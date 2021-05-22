/*
 * Request handlers
 */

const { read } = require('./data');
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
    const readData = await _data.read('users', phone);

    if (typeof readData == 'undefined') {
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
// @TODO Only let an authenticated user access their object. Don't let them access anyone else's
handlers._users.get = async (data, callback) => {
  // Check that the user's phone number is valid
  const phone =
    typeof data.queryStringObject.get('phone') === 'string' &&
    data.queryStringObject.get('phone').trim().length == 10
      ? data.queryStringObject.get('phone').trim()
      : false;

  if (phone) {
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
    callback(400, { Error: 'Missing required field' });
  }
};

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
// @TODO Only let an authenticated user update their own object, not anyone else's
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
    }
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Users - delete
// Required field : phone
// @TODO Only let an authenticated user delete their object. Dont let them delete anyone else's
// @TODO Cleanup (delete) any other data files associated with this user
handlers._users.delete = async (data, callback) => {
  // Check that the phone number is valid
  const phone =
    typeof data.queryStringObject.get('phone') === 'string' &&
    data.queryStringObject.get('phone').trim().length == 10
      ? data.queryStringObject.get('phone').trim()
      : false;

  if (phone) {
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
    callback(400, { Error: 'Missing required field' });
  }
};

// Export the module
module.exports = handlers;
