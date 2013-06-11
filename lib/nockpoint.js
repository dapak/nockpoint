var http    = require('http');
var pfinder = require('portfinder');
var redis   = require('redis');


// setup logger
var winston = require('winston'),
  logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({'timestamp':true}),
  ]
});


/**
 * NockPoint Server
 *
 * @param options Any custom parameters for this server instance, which can
 * include host, port, and not logging (silent mode).
 */
var NockPointServer = exports.NockPointServer = function(options) {

  this.host   = options.host   || 'localhost';
  this.port   = options.port   || 8080;
  this.silent = options.silent || false;

  if (this.silent) {
    logger.remove(winston.transports.Console);
  }

  this.redis = (options.redis || 'localhost:6379').split(':');
  var client = redis.createClient(this.redis[1], this.redis[0]);
  client.on('error', function (error) {
    logger.error(error);
    process.exit();
  });


  /**
   * Invokes the server to begin listening on the specified host name
   * and port number.
   *
   * @param port The port number.
   * @param host The host name.
   */
  this.listen = function (port, host) {
    this.port = port || this.port;
    this.host = host || this.host;
    var that = this;

    // check if we can use the port specified
    pfinder.basePort = this.port;
    pfinder.getPort(function (error, port) {
      if (error) {
        logger.error('server could not start on port ' + port);
        logger.error(error);
        process.exit();
      }

      that.server.listen(port, that.host);
      logger.info('server listening at http://' + that.host + ':' + port);
    });
  };

  // create a new http server
  this.server = http.createServer();
  this.server.on('request', function(req, res) {
    logger.info(['request', req.method, req.url].join('\t'));

    var sendError = function(code, message) {
      if (message) {
        message = {"error": message};
      }
      sendResponse(code, message);
    };

    var sendResponse = function(code, data) {
      res.writeHead(code, {"Content-Type":"application/json"});

      var response = ['response', res.statusCode];
      if (typeof data === 'object') {
        data = JSON.stringify(data);
      }

      if (data) {
        response.push(data);
      }

      res.end(data);
      logger.info(response.join('\t'));
    };


    // before continuing, check for absence of '/np' in the url
    if (req.url.indexOf('/np') === -1) {
      client.hget('nockpoint', req.method + ':' + req.url, function(error, field) {
        var data = JSON.parse(field);
        if (!data) {
          sendError(404);
          return;
        }

        if (data.code) {
          res.statusCode = data.code;
        }

        if (data.headers) {
          for (var i = 0; i < data.headers.length; i++) {
            var header = data.headers[i].split(':');
            res.setHeader(header[0], header[1]);
          }
        }

        var response = data.response || null;
        res.end(response);

        logger.info(['response', res.statusCode, response].join('\t'));
      });

      return;
    }

    // reserved endpoints
    switch (req.url) {
      case '/np/shutdown':
        if (req.method === 'POST') {
          logger.warn('server is shutting down');
          sendResponse(204);
          req.connection.destroy();
          this.close();

        } else {
          sendError(405);
        }
        break;

      case '/np/status':
        if (req.method === 'GET') {
          client.hlen("nockpoint", function(error, total) {
            sendResponse(200, {"endpoints":total});
          });

        } else {
          sendError(405);
        }
        break;

      default:
        if (/np\/add/.test(req.url) && (req.method === 'POST')) {
          req.on('data', function(chunk) {
            if (chunk.length > 1e6) {
              logger.error('request data exceeded maximum permitted length');
              sendError(413);
              req.connection.destroy();
              return;
            }

            var data  = JSON.parse(chunk.toString());
            var store = {};

            var matches = req.url.match(/\/np\/add\/(delete|get|post|put)(.*)/);
            if (!matches) {
              sendError(400, 'Method type is required in endpoint specification.');
              return;
            }

            var key = matches[1].toUpperCase() + ':';
            if (matches[2]) {
              key += matches[2];
            }

            if (/^\/np/.test(matches[2])) {
              sendError(400, 'Unable to override reserved endpoints.');
              return;
            }

            if (http.STATUS_CODES[data.code]) {
              store.code = data.code;
            }

            if (data.headers) {
              store.headers = data.headers;
            }

            if (data.response) {
              store.response = data.response;
            }

            var field = JSON.stringify(store);
            logger.info(['endpoint', 'add', key, field].join('\t'));
            client.hset('nockpoint', key, field);

            sendResponse(201, '"' + key + '"');
          });

        } else if (/np\/remove/.test(req.url) && (req.method === 'DELETE')) {
          var matches = req.url.match(/\/np\/remove\/(delete|get|post|put)(.*)/);
          if (!matches) {
            sendError(400, 'Method type is required in endpoint specification.');
            return;
          }

          var key = matches[1].toUpperCase() + ':';
          if (matches[2]) {
            key += matches[2];
          }

          logger.info(['endpoint', 'remove', key].join('\t'));
          client.hdel('nockpoint', key);
          sendResponse(204);

        } else {
          sendError(405);
        }
    }
  });

  this.server.on('close', function () {
      logger.info('server connection closed');
      process.exit();
  });
};


/**
 * Creates a new server instance.
 *
 * @returns NockPointServer
 */
exports.create = function(options) {
  return new NockPointServer(options);
};


/**
 * Creates and starts a new server instance.
 *
 * @returns NockPointServer
 */
exports.start = function(options) {
  var server = new NockPointServer(options);
  server.listen();
  return server;
}
