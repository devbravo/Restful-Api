// Dependencies
const http = require('http');
const { URL } = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

// The server should respond to all requests with a string
var server = http.createServer((req, res) => {
  // Get the URL and parse it
  const parsedUrl = new URL(req.url, 'http://localhost:3000/');

  // Get the path and trim it using regex
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the query string as an object
  const queryStringObject = parsedUrl.searchParams;

  // Get the HTTP Method
  const method = req.method.toLowerCase();

  // Get the headers as an object
  const headers = req.headers;

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
      method: method,
      headers: headers,
      payload: buffer,
    };

    // Route the request to the handler specified in the router
    chosenHandler(data, function (statusCode, payload) {
      // Use the status code called back by the handler or default to 200
      statusCode = typeof statusCode == 'number' ? statusCode : 200;

      // use the payload called back by the handler, or default to an empty object
      payload = typeof payload == 'object' ? payload : {};

      // Convert the payload to a string
      const payloadStrings = JSON.stringify(payload);

      // Return the response
      res.writeHead(statusCode);
      res.end(payloadStrings);
      console.log('Returning this response: ', statusCode, payloadStrings);
    });
  });
});

// Start the server, and have it listen on port 3000
server.listen(3000, () => {
  console.log('The server is listening on port 3000 now');
});

// Define the handlers
const handlers = {};

// Sample handler
handlers.sample = function (data, callback) {
  // Callback a http status code, and a payload
  callback(406, { name: 'sample handler' });
};

// Not found handler
handlers.notFound = function (data, callback) {
  callback(404);
};

// Define a request router
const router = {
  sample: handlers.sample,
};
