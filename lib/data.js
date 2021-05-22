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

lib.create = async (dir, file, data) => {
  const fileDir = lib.baseDir + dir + '/' + file + '.json';
  let filehandle;
  let writtenFile;

  try {
    fileHandle = await open(fileDir, 'wx');
    const stringData = JSON.stringify(data);
    try {
      writtenFile = await writeFile(fileDir, stringData);
      await filehandle?.close();
      return writtenFile;
    } catch (err) {
      console.error('Error writing to new file');
    }
  } catch (err) {
    console.error('Could not create new file, it may already exist');
  }
};

// Read data from a file
lib.read = async (dir, file) => {
  const fileDir = lib.baseDir + dir + '/' + file + '.json';
  try {
    const fileRead = await readFile(fileDir, 'utf8');
    console.error(null, fileRead);
    return fileRead;
  } catch (err) {
    console.error('Could not read file, it might not exist');
  }
};

// Update data in a file
lib.update = async (dir, file, data) => {
  const fileDir = lib.baseDir + dir + '/' + file + '.json';
  let filehandle;
  try {
    filehandle = await open(fileDir, 'r+');
    const stringData = JSON.stringify(data);

    try {
      await truncate(fileDir);

      try {
        writtenFile = await writeFile(fileDir, stringData);
        await filehandle?.close();
        return writtenFile;
      } catch {
        console.error('Error writing to existing file');
      }
    } catch {
      console.error('Error truncating file');
    }
  } catch {
    console.error('Could not open file for updating, it may not exist yet');
  }
};

// Delete a file
lib.delete = async (dir, file) => {
  const fileDir = lib.baseDir + dir + '/' + file + '.json';
  try {
    const unlinkFile = await unlink(fileDir);
    console.error(false);
    return unlinkFile;
  } catch (err) {
    console.error('Error deleting file');
  }
};

// Export the module
module.exports = lib;
