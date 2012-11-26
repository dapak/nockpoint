# nockpoint
Utilizes [Node.js][nodejs] and [redis] for the dynamic creation of mock http request endpoints.  Its development stemmed from the desire to test funtionality that was dependent on the result of API service requests, without having to rely on said service's uptime.


## Getting Started
You will need to install [redis] and start `redis-server`.  When that is done, go ahead and install `nockpoint` via `npm` like so:

```sh
$ npm install nockpoint
```

Fire it up by executing:

```sh
$ nockpoint [options]
```


## Options
`-p` is the port to utilize (defaults to 8080)

`-r` is the redis host:port (defaults to localhost:6379)

`-s` will suppress logging

`-h` displays usage information


## Usage
You can utilize either the native API functionality to add/remove endpoints or directly interact with [redis] itself for expedience.  The below is an example of just using a series of curl requests:

```sh
$ nockpoint -p 8081 -s &
$ curl -X GET http://localhost:8081/np/status
{"endpoints":5}

$ curl -X POST http://localhost:8081/np/add/get/test/12 -d '{"code":202, "headers":["User-Agent: n/a"], "response":"{\"result\":\"This is a message from a mocked endpoint.\"}"}'
"GET:/test/12"

$ curl -X GET http://localhost:8081/np/status
{"endpoints":6}

$ curl -X GET http://localhost:8081/test/12 -v
> GET /test/12 HTTP/1.1
> Host: localhost:8081
> Accept: */*
>
< HTTP/1.1 202 Accepted
< User-Agent:  n/a
<
{"result":"This is a message from a mocked endpoint."}
```


## API
### POST: /np/add/&lt;type&gt;/&lt;endpoint&gt;
Creates a new mock endpoint and returns its [redis] hash key.

### DELETE: /np/remove/&lt;type&gt;/&lt;endpoint&gt;
Removes an existing mock endpiont.

### POST: /np/shutdown
Causes the server to "gracefully" die.

### GET: /np/status
Provides information on the number of existing endpoints.


## License
Copyright (c) 2012 Daniel Khodaparast

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[nodejs]:http://nodejs.org
[redis]:http://redis.io