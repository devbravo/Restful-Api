/*
 * Request handlers
 */

// Dependencies
const config = require('./config');
const _data = require('./data');
const helpers = require('./helpers');

// Define all the handlers
const handlers = {};

// Ping
handlers.ping = (data, callback) => {
  callback(200);
};

// Not-Found
handlers.notFound = (data, callback) => {
  callback(404);
};

/* ======================================= */
// Users

handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the users methods
handlers._users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = async (data, callback) => {
  // Check that all required fields are filled out
  const firstName =
    typeof data.payload.firstName == 'string' &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;

  const lastName =
    typeof data.payload.lastName == 'string' &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;

  const phone =
    typeof data.payload.phone == 'string' &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;

  const password =
    typeof data.payload.password == 'string' &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  const tosAgreement =
    typeof data.payload.tosAgreement == 'boolean' &&
    data.payload.tosAgreement == true
      ? true
      : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    // Make sure the user doesnt already exist
    const tokenData = await _data.read('users', phone);

    if (typeof tokenData == 'undefined') {
      //Hash the password
      const hashedPassword = helpers.hash(password);
      // Create the user object
      if (hashedPassword) {
        const userObject = {
          firstName: firstName,
          lastName: lastName,
          phone: phone,
          hashedPassword: hashedPassword,
          tosAgreement: true,
        };

        // Store the user
        const createData = await _data.create('users', phone, userObject);
        if (typeof createData == 'undefined') {
          callback(200);
        } else {
          callback(500, { Error: 'Could not create the new user' });
        }
      } else {
        callback(500, {
          Error: "Could not hash the user's password.",
        });
      }
    } else {
      callback(400, {
        Error: 'A user with that phone number already exists',
      });
    }
  } else {
    callback(400, { Error: 'Missing required fields' });
  }
};

// Users - get
// Required data: phone
// Optional data: none
handlers._users.get = async (data, callback) => {
  // Check that the user's phone number is valid
  const phone =
    typeof data.queryStringObject.get('phone') === 'string' &&
    data.queryStringObject.get('phone').trim().length == 10
      ? data.queryStringObject.get('phone').trim()
      : false;

  if (phone) {
    // Get the token from the headers
    const token =
      typeof data.headers.token === 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the phone number
    const tokenIsValid = await handlers._tokens.verifyToken(token, phone);

    if (tokenIsValid) {
      // Lookup the user
      const readData = await _data.read('users', phone);
      if (readData) {
        // Remove the hashed password from the user object before returning it to the requester
        delete readData.hashedPassword;
        callback(200, readData);
      } else {
        callback(404);
      }
    } else {
      callback(403, {
        Error: 'Missing required token in header, or token is invalid',
      });
    }
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
handlers._users.put = async (data, callback) => {
  // Check that the user's phone number is valid
  const phone =
    typeof data.payload.phone === 'string' &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;

  // Check for the optional fields
  var firstName =
    typeof data.payload.firstName == 'string' &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;

  const lastName =
    typeof data.payload.lastName == 'string' &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;

  const password =
    typeof data.payload.password == 'string' &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  // Error if the phone is invalid
  if (phone) {
    // Error if nothing is sent to update
    if (firstName || lastName || password) {
      const token =
        typeof data.headers.token === 'string' ? data.headers.token : false;

      // Verify that the given token is valid for the phone number
      const tokenIsValid = await handlers._tokens.verifyToken(token, phone);
      if (tokenIsValid) {
        // Lookup the user
        const readData = await _data.read('users', phone);
        if (readData) {
          // Update the fields necessary
          if (firstName) {
            readData.firstName = firstName;
          }
          if (lastName) {
            readData.lastName = lastName;
          }
          if (password) {
            readData.hashedPassword = helpers.hash(password);
          }
          // Store the new updates
          const updateData = await _data.update('users', phone, readData);
          if (!updateData) {
            callback(200);
          } else {
            callback(500, { Error: 'Could not update the user' });
          }
        } else {
          callback(400, { Error: 'The specified user does not exist' });
        }
      } else {
        callback(403, {
          Error: 'Missing required token in header, or token is invalid',
        });
      }
    } else {
      callback(400, { Error: 'Missing fields to update' });
    }
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Users - delete
// Required field : phone
handlers._users.delete = async (data, callback) => {
  // Check that the phone number is valid
  const phone =
    typeof data.queryStringObject.get('phone') === 'string' &&
    data.queryStringObject.get('phone').trim().length == 10
      ? data.queryStringObject.get('phone').trim()
      : false;

  if (phone) {
    const token =
      typeof data.headers.token === 'string' ? data.headers.token : false;

    // Verify that the given token is valid for the phone number
    const tokenIsValid = await handlers._tokens.verifyToken(token, phone);
    if (tokenIsValid) {
      // Lookup the user
      const readData = await _data.read('users', phone);
      if (readData) {
        const deleteData = await _data.delete('users', phone);
        if (!deleteData) {
          callback(200);
        } else {
          callback(500, { Error: 'Could not delete the specified user' });
        }
      } else {
        callback(400, { Error: 'Could find the specified user' });
      }
    } else {
      callback(403, {
        Error: 'Missing required token in header, or token is invalid',
      });
    }
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

/*============================================================== */
// Tokens

handlers.tokens = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the tokens methods
handlers._tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = async function (data, callback) {
  const phone =
    typeof data.payload.phone == 'string' &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;

  const password =
    typeof data.payload.password == 'string' &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (phone && password) {
    // Lookup the user who matches that phone number

    const readData = await _data.read('users', phone);
    if (readData) {
      // Hash the sent password, and compare it to the password stored in the user object
      const hashedPassword = helpers.hash(password);
      if (hashedPassword == readData.hashedPassword) {
        // If valid, create a new token with a random name. Set expiration data 1 hour in the future
        const tokenId = helpers.createRandomString(20);
        const expires = Date.now() + 1000 * 60 * 60;
        const tokenObject = {
          phone: phone,
          id: tokenId,
          expires: expires,
        };
        // Store the token
        const createData = await _data.create('tokens', tokenId, tokenObject);
        if (typeof createData == 'undefined') {
          callback(200, tokenObject);
        } else {
          callback(500, { Error: 'Could not create the new token' });
        }
      } else {
        callback(400, {
          Error: "Password did not match the specified user's stored password",
        });
      }
    } else {
      callback(400, { Error: 'Could not find the specified user' });
    }
  } else {
    callback(400, { Error: 'Missing required field(s)' });
  }
};

// Tokens - get
// Required data : id
// Optional data: none
handlers._tokens.get = async (data, callback) => {
  // Check that the user's id is valid
  const id =
    typeof data.queryStringObject.get('id') === 'string' &&
    data.queryStringObject.get('id').trim().length == 20
      ? data.queryStringObject.get('id').trim()
      : false;

  if (id) {
    // Lookup the token
    const tokenData = await _data.read('tokens', id);
    if (tokenData) {
      callback(200, tokenData);
    } else {
      callback(404);
    }
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Tokens - put
// Required data : id, extend
// Optional data : none
handlers._tokens.put = async (data, callback) => {
  const id =
    typeof data.payload.id == 'string' && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;

  const extend =
    typeof data.payload.extend == 'boolean' && data.payload.extend == true
      ? true
      : false;

  if (id && extend) {
    // Lookup token
    const tokenData = await _data.read('tokens', id);
    if (tokenData) {
      // check to make sure the token isn't already expired
      if (tokenData.expires > Date.now()) {
        // Set the expiration an hour from now
        tokenData.expires = Date.now() + 1000 * 60 * 60;

        // Store the new updates
        const updatedTokenExpDate = await _data.update('tokens', id, tokenData);

        if (typeof updatedTokenExpDate == 'undefined') {
          callback(200);
        } else {
          callback(500, {
            Error: 'Could not update the tokens expiration',
          });
        }
      } else {
        callback(400, {
          Error: 'The token has already expired and cannot be extended',
        });
      }
    } else {
      callback(400, { Error: 'Specified token does not exist' });
    }
  } else {
    callback(400, {
      Error: 'Missing required field(s) or field(s) are invalid',
    });
  }
};

// Tokens - delete
// Required data: id
// Optional data: none
handlers._tokens.delete = async (data, callback) => {
  const id =
    typeof data.queryStringObject.get('id') === 'string' &&
    data.queryStringObject.get('id').trim().length == 20
      ? data.queryStringObject.get('id').trim()
      : false;

  if (id) {
    // Lookup the user
    const tokenData = await _data.read('tokens', id);
    if (tokenData) {
      const deleteData = await _data.delete('tokens', id);
      if (!deleteData) {
        callback(200);
      } else {
        callback(500, { Error: 'Could not delete the specified token' });
      }
    } else {
      callback(400, { Error: "Couldn't find the specified token" });
    }
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = async (id, phone) => {
  // Lookup the token
  const tokenData = await _data.read('tokens', id);

  if (tokenData) {
    // Check that the token is for the given user and has not expired
    if (tokenData.phone === phone && tokenData.expires > Date.now()) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};

/* ============================= */
// Checks

handlers.checks = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the checks methods
handlers._checks = {};

// Checks - post
// Required data; protocol, url, methods, successCodes, timeoutSeconds
// Optional data: none

handlers._checks.post = async (data, callback) => {
  const protocol =
    typeof data.payload.protocol == 'string' &&
    ['https', 'http'].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;

  const url =
    typeof data.payload.url == 'string' && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;

  const method =
    typeof data.payload.method == 'string' &&
    ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;

  const successCodes =
    typeof data.payload.successCodes == 'object' &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;

  const timeoutSeconds =
    typeof data.payload.timeoutSeconds == 'number' &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;

  if (protocol && url && method && successCodes && timeoutSeconds) {
    // Get the token from the headers
    const token =
      typeof data.headers.token == 'string' ? data.headers.token : false;

    // Lookup the user by reading the token
    const tokenData = await _data.read('tokens', token);
    if (tokenData) {
      const userPhone = tokenData.phone;

      // Lookup the user data
      const userData = await _data.read('users', userPhone);
      if (userData) {
        const userChecks =
          typeof userData.checks == 'object' && userData.checks instanceof Array
            ? userData.checks
            : [];

        // Verify that the user has less than the number of max-checks-per-user
        console.log(config.maxChecks);
        if (userChecks.length < config.maxChecks) {
          // Create a random id for the check
          const checkId = helpers.createRandomString(20);

          // Create the check object, and include the user's phone
          const checkObject = {
            id: checkId,
            userPhone: userPhone,
            protocol: protocol,
            url: url,
            method: method,
            successCodes: successCodes,
            timeoutSeconds: timeoutSeconds,
          };

          // Save the object
          const createData = await _data.create('checks', checkId, checkObject);
          if (typeof createData == 'undefined') {
            // Add the check id to the user's object
            userData.checks = userChecks;
            userData.checks.push(checkId);

            // Save the new user data
            const saveNewUser = await _data.update(
              'users',
              userPhone,
              userData
            );
            if (typeof saveNewUser == 'undefined') {
              // Return the data about the new check
              callback(200, checkObject);
            } else {
              callback(500, {
                Error: 'Could not update the user with the new check',
              });
            }
          } else {
            callback(500, { Error: 'Could not create the new check' });
          }
        } else {
          callback(400, {
            Error: 'Thse user already has the maximum number of checks',
          });
        }
      } else {
        callback(403);
      }
    } else {
      callback(403);
    }
  } else {
    callback(400, { Error: 'Missing required inputs, or inputs are invalid' });
  }
};

// Export the module
module.exports = handlers;
