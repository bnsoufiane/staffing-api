'use strict';

const mongoose = require('mongoose');
const Promise = require('bluebird');
mongoose.Promise = Promise;
const deepFreeze = require('deep-freeze-strict');
const AppErr = require('../../error');
const constants = require('../../constants');
const RESOURCE = 'CompanyDetails';
const _ = require('lodash');

const ERROR = deepFreeze(
  Object.assign({},
    AppErr.COMMON_ERROR,
    AppErr.generateResourceErrors(RESOURCE)
  )
);
const companyDetailsSchema = require('./company-details-schema');
/**
 *
 */
companyDetailsSchema.options.toJSON = {
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
companyDetailsSchema.statics.fetchOne = function(query) {
  return CompanyDetailsModel.findOne(query)
    .then(company => company || AppErr.reject(null, ERROR.NOT_FOUND))
    .catch(err => AppErr.formatMongoErrors(err))
    .catch(err => AppErr.reject(err, ERROR.FETCH));
};

/**
 * @param {Object} query
 */
companyDetailsSchema.statics.fetch = function(params) {
  let page = (params.page && params.page > 0) ? parseInt(params.page) : 1;
  let size = (params.size && params.size > 0) ?
    parseInt(params.size) : constants.DEFAULT_PAGE_SIZE;
  let toSkip = (size * (page-1));

  params.query = params.query || {};
  return CompanyDetailsModel.count(params.query)
    .then(total => {
      return CompanyDetailsModel.find(params.query).skip(toSkip).limit(size)
        .then(companies => {
          if (companies && companies.length) return {total, page, size, companies};
          return AppErr.reject(null, ERROR.NONE_FOUND);
        });
    })
    .catch(err => AppErr.formatMongoErrors(err))
    .catch(err => AppErr.reject(err, ERROR.FETCH));
};


/**
 * @param {CompanySchema} data
 */
companyDetailsSchema.statics.createOne = function(data) {
  if (!data) return AppErr.reject(null, ERROR.NO_DATA);
  // Create company.
  return doesNotExist(data)
    .then(() => createCompany(data))
    .catch(err => AppErr.reject(err, ERROR.ALREADY_EXIST));
};


/******************************************************************************/
/***************************** HELPER FUNCTIONS  ******************************/
/******************************************************************************/


// Unsafe/Unvalidated Create. Use inside validated method.
function createCompany(data) {
  return CompanyDetailsModel.create(data)
    .catch(err => AppErr.formatMongoErrors(err))
    .catch(err => AppErr.reject(err, ERROR.CREATE));
}


function doesNotExist(data) {
  return CompanyDetailsModel.fetchOne(data)
    .then(() => AppErr.reject(null, ERROR.ALREADY_EXISTS))
    .catch(err => AppErr.resolveIf(err, ERROR.NOT_FOUND));
}


/******************************************************************************/
/******************************* EXPORT MODEL  ********************************/
/******************************************************************************/


// Promisify Mongoose Model.
const CompanyDetailsModel = mongoose.model(RESOURCE, companyDetailsSchema);
Promise.promisifyAll(CompanyDetailsModel);
Promise.promisifyAll(CompanyDetailsModel.prototype);


CompanyDetailsModel.ERROR = ERROR;
CompanyDetailsModel.RESOURCE = RESOURCE;

/**
 * Exports the Company Schema.
 * @type {!Object}
 */
module.exports = CompanyDetailsModel;
