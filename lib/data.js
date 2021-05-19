/*
 * @module lib/data
 * Library for storing and editing data
 */

// Dependencies
const { open, writeFile, truncate, readFile, unlink } = require('fs/promises');
const path = require('path');

// Container for the module (to be exported)
const lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');

// Write data to a file
lib.create = async function (dir, file, data, callback) {
  const fileDir = lib.baseDir + dir + '/' + file + '.json';
  let fileHandle;
  try {
    fileHandle = await open(fileDir, 'wx');
    const stringData = JSON.stringify(data);
    try {
      await writeFile(fileDir, stringData);
      fileHandle.close();
      callback('No error, file written and closed');
    } catch (err) {
      callback('Error writing to new file');
    }
  } catch (err) {
    callback('Could not create new file, it may already exist');
  }
};

// Read data from a file
lib.read = async function (dir, file, callback) {
  const fileDir = lib.baseDir + dir + '/' + file + '.json';
  try {
    const data = await readFile(fileDir, 'utf8');
    callback('no error', data);
  } catch (err) {
    callback('Error reading data from file');
  }
};

// Update data inside a file
lib.update = async function (dir, file, data, callback) {
  const fileDir = lib.baseDir + dir + '/' + file + '.json';
  let filehandle;
  try {
    filehandle = await open(fileDir, 'r+');
    const stringData = JSON.stringify(data);
    try {
      await truncate(fileDir);
      callback('No error, file truncated');
      try {
        await writeFile(fileDir, stringData);
        filehandle.close();
        callback('No error, file updated and closed');
      } catch (err) {
        callback('Error writing to existing file');
      }
    } catch (err) {
      callback('Error truncating file');
    }
  } catch (err) {
    callback('Could not open the file for update, it may not exist yet.');
  }
};

// Delete a file
lib.delete = async function (dir, file, callback) {
  const fileDir = lib.baseDir + dir + '/' + file + '.json';
  try {
    await unlink(fileDir);
    callback('No error, file deleted');
  } catch (err) {
    callback('Error deleting file');
  }
};

// Export the module
module.exports = lib;
