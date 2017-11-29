'use strict';

const util = require('util');
const utils = require('../utils');
const Promise = require('bluebird');
const deepFreeze = require('deep-freeze-strict');
const _ = require('lodash');

const RESOURCE_ERROR =  deepFreeze({
  ALREADY_EXISTS: {status: 400, message: '%s already exists.'},
  NOT_FOUND: {status: 404, message: '%s not found.'},
  NONE_FOUND: {status: 400, message: 'No %s found.'},
  RESOURCE_ID_REQUIRED: {status: 400, message: '%s ID required.'},

  CREATE: {status: 500, message: 'Error creating %s.'},
  UPDATE: {status: 500, message: 'Error updating %s.'},
  DELETE: {status: 500, message: 'Error deleting %s.'},
  FETCH: {status: 500, message: 'Error fetching %s.'},
  GENERIC: {status: 500, message: 'Something with %s went wrong.'}
});

const COMMON_ERROR = deepFreeze({
  UNAUTHORIZED: {status: 401, message: 'Unauthorized.'},
  REQ_ATTR: {status: 400, message: 'Missing required attributes.'},
  NO_DATA: {status: 400, message: 'No data provided.'},
  UNEXPECTED_ID: {status: 400, message: 'Unexpected ID.'},
  INVALID_OBJECT_ID: {status: 400, message: 'Invalid objectId'},
  INVALID_DATA: {status: 400, message: 'Invalid data'},
  UNKNOWN_DB_ERROR : {status: 500, message: 'Unknown DB error.'},
  ALREADY_EXIST : {status: 400, message: 'Data already exist.'},
  INVALID_ARRAY: {status:400, message: '%s should be stringified array'}
});

class ApplicationError {
  constructor(error) {
    if (!error || !error.status || !error.message) throw 'Invalid error.';
    this.status = error.status;
    this.message = error.message;
  }


  /**
   * Return self as rejected promise.
   */
  reject() {
    return Promise.reject(this);
  }


  /**
   * Checks if the argument is an ApplicationError.
   */
  static is(test) {
    if (!test) return false;
    return test.constructor == this;
  }


  /**
   * Checks if an error is an ApplicationError. If it is, return. Else return
   * new ApplicationError 'otherwise' and log the error.
   */
  static handle(err, otherwise) {
    if (this.is(err)) return err;
    (err && err.stack) ? console.log('ERROR STACK:', err.stack) :
        console.log('ERROR NO STACK:', err+ ' ERROR:' + otherwise.message);
    return new ApplicationError(otherwise);
  }


  /**
   * Checks if an error is an ApplicationError. If it is, return rejection with
   * it. Else return rejection with new ApplicationError 'otherwise' and log the
   * error.
   */
  static reject(err, otherwise) {
    return this.handle(err, otherwise).reject();
  }

  static isMongoError(err){
    return err && err.name === 'MongoError' && err.code;
  }

  /**
   * Recognize various types of mongo errors
   * @param {Object} err
   */
  static formatMongoErrors(err) {
    if (!this.isMongoError(err)){
      return this.reject(err, COMMON_ERROR.UNKNOWN_DB_ERROR);
    }

    let handler = MONGO_ERROR_HANDLER[err.code];
    return this.reject(err, handler ? handler(err) : COMMON_ERROR.UNKNOWN_DB_ERROR);
  }

  /**
   * Resolves a promise if the err is an ApplicationError and matches the
   * status and message of the conditional provided.
   */
  static resolveIf(err, conditional) {
    if (!this.is(err)) return Promise.reject(err);
    if (!utils.all(
        conditional.status === err.status,
        conditional.message === err.message
      )) return Promise.reject(err);
    return Promise.resolve(err);
  }

  /**
   *
   */
  static generateResourceErrors(resource) {
    return utils.object.reduce(RESOURCE_ERROR, (clone, error, key) => {
        clone[key] = {
          status: error.status,
          message: util.format(error.message, resource)
        };
      return clone;
    }, {});
  }

  /**
   * Generates the invalid array error messages object
   * Sample input: [NAME]
   * Sample output: {INVALID_NAME: {status: 400, message: 'NAME should be stringified array'}
   * }
   * @param arrayFields
   * @returns {*}
   */
  static generateInvalidArrayErrors(arrayFields) {
    return _.chain(arrayFields)
      .map(field => {
        return {
          status: COMMON_ERROR.INVALID_ARRAY.status,
          message: util.format(COMMON_ERROR.INVALID_ARRAY.message, field)
        };
      })
      .indexBy(error => 'INVALID_' + _.chain(error.message).split(' ').first().value()
        .toUpperCase())
      .value();
  }
}

ApplicationError.COMMON_ERROR = COMMON_ERROR;

/**
 *
 */
module.exports = ApplicationError;
