'use strict';

const mongoose = require('mongoose');
const Promise = require('bluebird');
const constants = require('../../constants');
const utils = require('../../utils');
const _ = require('lodash');
const AppErr = require('../../error');

const ERROR = Object.freeze({
  REQ_ATTR: {status: 400, message: 'Some required input fields are missing.'},
  REQ_ID_ATTR: {status: 400, message: '_id field is required in order to update.'},
  ALREADY_EXISTS: {status: 400, message: 'This list already exists.'},
  NOT_FOUND: {status: 404, message: 'list not found.'},

  INVALID_DATA: {status: 400, message: 'Invalid data, please consult swagger docs for data types.'},
  CREATE: {status: 500, message: 'Error creating list.'},
  LIST: {status: 500, message: 'Error listing lists.'},
  GENERIC: {status: 500, message: 'Something went wrong with lists.'},
  FETCH: {status: 500, message: 'lists could not be retrieved.'},
  UPDATE: {status: 422, message: 'Unable to update list.'},
  DELETE: {status: 422, message: 'Unable to delete list.'}
});


var listsSchema = require('./lists-schema');

/**
 *
 */
listsSchema.options.toJSON = {
  transform: function (doc, obj, options) {
    delete obj.__v;
    return obj;
  }
};

/**
 * Data validation checks for proposals input
 * @param list
 * @param formType
 * @returns {Promise.<T>}
 */
listsSchema.statics.validate = function (list, formType) {
  //validate text fields
  if (_.isEmpty(list) || utils.array.any([list.name, list.userId], attr => !attr || !attr.length))
    return AppErr.reject(null, ERROR.REQ_ATTR);

  list.name = list.name.trim();

  //_id is required to update list document
  if(formType === 'update' && !list._id) {
    return AppErr.reject(null, ERROR.REQ_ID_ATTR);
  }

  return Promise.resolve(list);
};

// Promisify Mongoose Model.
var ListsModel = mongoose.model('List', listsSchema);
Promise.promisifyAll(ListsModel);
Promise.promisifyAll(ListsModel.prototype);


ListsModel.ERROR = ERROR;

/**
 * Exports the Proposal Model.
 * @type {!Object}
 */
module.exports = ListsModel;
