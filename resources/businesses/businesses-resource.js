'use strict';

const mongoose = require('mongoose');
const Promise = require('bluebird');
mongoose.Promise = Promise;
const deepFreeze = require('deep-freeze-strict');
const AppErr = require('../../error');
const constants = require('../../constants');
const RESOURCE = 'Business';
const ERROR = deepFreeze(
  Object.assign({},
    AppErr.COMMON_ERROR,
    AppErr.generateResourceErrors(RESOURCE))
);
const businessesSchema = require('./businesses-schema');


/**
 *
 */
businessesSchema.options.toJSON = {
  transform: function (doc, obj, options) {
    delete obj.__v;
    return obj;
  }
};

/******************************************************************************/
/******************************* MODEL METHODS  *******************************/
/******************************************************************************/

/**
 * @param {Object} query
 */
businessesSchema.statics.fetchOne = function(query) {
  return BusinessesModel.findOne(query)
    .then(business => business || AppErr.reject(null, ERROR.NOT_FOUND))
    .catch(err => AppErr.formatMongoErrors(err))
    .catch(err => AppErr.reject(err, ERROR.FETCH));
};

/**
 * @param {Object} query
 */
businessesSchema.statics.fetch = function(params) {
  let page = (params.page && params.page > 0) ? parseInt(params.page) : 1;
  let size = (params.size && params.size > 0) ?
    parseInt(params.size) : constants.DEFAULT_PAGE_SIZE;
  let toSkip = (size * (page-1));

  params.query = params.query || {};
  return BusinessesModel.count(params.query)
  .then(total => {
    return BusinessesModel.find(params.query).skip(toSkip).limit(size)
    .then(businesses => {
      if (businesses && businesses.length) {
        return {
          total,
          page,
          size,
          businesses
        }
      }
      return AppErr.reject(null, ERROR.NONE_FOUND);
    });
  })
  .catch(err => AppErr.formatMongoErrors(err))
  .catch(err => AppErr.reject(err, ERROR.FETCH));
};


/**
 * @param {BusinessesSchema} data
 */
businessesSchema.statics.createOne = function(data) {
  if (!data) return AppErr.reject(null, ERROR.NO_DATA);
  // Create company.
  return doesNotExist(data)
    .then(() => createBusiness(data))
    .catch(err => AppErr.reject(err, ERROR.ALREADY_EXIST));
};

/******************************************************************************/
/***************************** HELPER FUNCTIONS  ******************************/
/******************************************************************************/


// Unsafe/Unvalidated Create. Use inside validated method.
function createBusiness(data) {
  return BusinessesModel.create(data)
    .catch(err => AppErr.formatMongoErrors(err))
    .catch(err => AppErr.reject(err, ERROR.CREATE));
}


function doesNotExist(data) {
  return BusinessesModel.fetchOne(data)
    .then(() => AppErr.reject(null, ERROR.ALREADY_EXISTS))
    .catch(err => AppErr.resolveIf(err, ERROR.NOT_FOUND));
}


/******************************************************************************/
/******************************* EXPORT MODEL  ********************************/
/******************************************************************************/


// Promisify Mongoose Model.
const BusinessesModel = mongoose.model(RESOURCE, businessesSchema);
Promise.promisifyAll(BusinessesModel);
Promise.promisifyAll(BusinessesModel.prototype);


BusinessesModel.ERROR = ERROR;
BusinessesModel.RESOURCE = RESOURCE;

/**
 * Exports the Company Schema.
 * @type {!Object}
 */
module.exports = BusinessesModel;
