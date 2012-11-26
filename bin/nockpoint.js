#!/usr/bin/env node

var args      = require('optimist').argv;
var nockpoint = require('../lib/nockpoint.js');


// parse any cli options
if (args.h || args.help) {
  console.log([
    "usage: nockpoint [options]",
    "",
    "options:",
    "  -p            port to utilize (8080)",
    "  -r            redis host:port (localhost:6379)",
    "  -s            suppress logging",
    "  -h --help     display usage information",
  ].join('\n'));

  process.exit();
}

var options = {
  'port'   : args.p || 8080,
  'redis'  : args.r || 'localhost:6379',
  'silent' : args.s || false,
};


// start up the server
nockpoint.start(options);