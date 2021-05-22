// Dependencies
const http = require('http');
const https = require('https');
const { URL } = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./lib/config');
const fs = require('fs');
const _data = require('./lib/data');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

// TESTING
// @TODO delete this
// _data.create('test', 'newFile', { foo: 'bar' }, async function (err) {
//   console.log('This was the error:', err);
// });

// const readData = _data.read('test', 'newFile', function (err, data) {
//   console.log(`Error: ${err}, Data: ${data}`);
// });

// _data.update('test', 'newFile', { sabajo: 'diego' }, function (err) {
//   console.log(`This was the error: ${err}`);
// });

// _data.delete('test', 'newFile', function (err) {
//   console.log(`this was the error: ${err}`);
// });

// Instantiate the HTTP server
const httpServer = http.createServer((req, res) => {
  unifiedServer(req, res);
});

// Start the server
httpServer.listen(config.httpPort, () => {
  console.log(`The server is listening on port ${config.httpPort}`);
});

// Instantiate the HTTPS server
const httpsServerOptions = {
  key: fs.readFileSync('./https/key.pem'),
  cert: fs.readFileSync('./https/cert.pem'),
};
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req, res);
});

// Start the HTTPS server
httpsServer.listen(config.httpsPort, () => {
  console.log(`The server is listening on port ${config.httpsPort}`);
});

// All the sever logic for both the http and https sever
const unifiedServer = (req, res) => {
  // Get the URL and parse it
  const parsedUrl = new URL(req.url, 'http://localhost:3000/');

  // Get the path and trim it using regex, get the query string as an object
  const { pathname, searchParams } = parsedUrl;
  const trimmedPath = pathname.replace(/^\/+|\/+$/g, '');
  const queryStringObject = searchParams;

  // Get the HTTP Method nad headers
  const { method, headers } = req;

  // Get the payload, if any
  const decoder = new StringDecoder('utf-8');
  let buffer = '';

  req.on('data', data => {
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();

    // Choose the handler this request should go to. If one is not found, use the not found handler
    const chosenHandler =
      typeof router[trimmedPath] !== 'undefined'
        ? router[trimmedPath]
        : handlers.notFound;

    // Construct the data object to send to the handler
    const data = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      method: method.toLowerCase(),
      headers: headers,
      payload: helpers.parseJsonToObject(buffer),
    };
    console.log('hey', data);

    // Route the request to the handler specified in the router
    chosenHandler(data, (statusCode, payload) => {
      // Use the status code called back by the handler or default to 200
      statusCode = typeof statusCode == 'number' ? statusCode : 200;

      // use the payload called back by the handler, or default to an empty object
      payload = typeof payload == 'object' ? payload : {};

      // Convert the payload to a string
      const payloadStrings = JSON.stringify(payload);

      // Return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadStrings);
      console.log('Returning this response:', statusCode, payloadStrings);
    });
  });
};

// Define a request router
const router = {
  ping: handlers.ping,
  users: handlers.users,
};
