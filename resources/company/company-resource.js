'use strict';

const mongoose = require('mongoose');
const Promise = require('bluebird');
mongoose.Promise = Promise;
const deepFreeze = require('deep-freeze-strict');
const AppErr = require('../../error');
const constants = require('../../constants');
const RESOURCE = 'Company';
const _ = require('lodash');
const queryString = require('query-string');

const esCompany =
  require('../../services/elasticsearch')({
    type: constants.ELASTIC_TYPES.COMPANY
  });

/**
 * List of array type fields, which are to be be sent to server
 * in a stringified way.
 * @type {Array}
 */
const stringifiedArrayFields = ['foundersName', 'categories', 'keyPeople'];
const ERROR = deepFreeze(
  Object.assign({},
    AppErr.COMMON_ERROR,
    AppErr.generateResourceErrors(RESOURCE),
    AppErr.generateInvalidArrayErrors(stringifiedArrayFields)
  )
);
const companySchema = require('./company-schema');
/**
 *
 */
companySchema.options.toJSON = {
  transform: function (doc, obj, options) {
    delete obj.__v;
    return obj;
  }
};

/******************************************************************************/
/******************************* MODEL METHODS  *******************************/
/******************************************************************************/

/**
 * Update the edits according to source, if there is already entry in edits
 * by given source, then update it, else add new one.
 */
companySchema.statics.updateEdits = function(edits) {
  return this.getById(edits._id)
  .then(company => {
    _.omit(edits, '_id')
    //TODO(jonah13): Remove the is array check when its made sure that edits in companies are arrays rather than objects.
    if (company.edits && !Array.isArray(company.edits)) {
      company.edits = [company.edits];
    }

    let index = _.findIndex(company.edits, {source: edits.source});
    if (index === -1) company.edits.push(edits);
    else company.edits[index] = edits;

    return esCompany.update(company._id, {edits: company.edits})
    .catch(err => AppErr.reject(err, ERROR.UPDATE));
  });
};

/**
 * @param {Object} query
 */
companySchema.statics.fetchOne = function(query) {
  return CompanyModel.findOne(query)
  .then(company => company || AppErr.reject(null, ERROR.NOT_FOUND))
  .catch(err => AppErr.formatMongoErrors(err))
  .catch(err => AppErr.reject(err, ERROR.FETCH));
};

/**
 * @param {Object} query
 */
companySchema.statics.fetch = function(params) {
  params.page = (params.page && params.page > 0) ? parseInt(params.page) : 1;
  params.size = (params.size && params.size > 0) ?
    parseInt(params.size) : constants.DEFAULT_PAGE_SIZE;

  params.q = params.q ? queryString.parse(params.q) : {};
  if (params.q.markets) {
    params.q.markets = params.q.markets.split(',') || [];
  } else {
    delete params.q.markets;
  }

  params.sort = [
    {revenue: 'desc'}
  ];

  return esCompany.search(params)
  .then(result => result)
  .catch(err => AppErr.reject(err, ERROR.FETCH));
};

/**
 * @param {string} id
 */
companySchema.statics.getById = function(id) {
  return esCompany.get(id)
  .catch(err => AppErr.reject(err, ERROR.NOT_FOUND));
};


/**
 * @param {CompanySchema} data
 */
companySchema.statics.createOne = function(data) {
  if (!data) return AppErr.reject(null, ERROR.NO_DATA);
  // Create company.
  return doesNotExist(data)
  .then(() => createCompany(data))
  .catch(err => AppErr.reject(err, ERROR.ALREADY_EXIST));
};

/**
 * Data validation checks for companies edit
 * @param company
 * @returns {Promise.<any>}
 */
companySchema.statics.validate = function (company) {
  //validate text fields
  if (_.isEmpty(company) || _.some(
      [company._id, company.source],
      attr => typeof attr === undefined))
    return AppErr.reject(null, ERROR.REQ_ATTR);

  return Promise.resolve(company);
};


/******************************************************************************/
/***************************** HELPER FUNCTIONS  ******************************/
/******************************************************************************/

/**
 * Validate the array fields and inject parsed arrays in
 * company object, or returns error if parsing fails out
 *
 * @param fields
 * @param company
 */
function validateArrayFields(fields, company) {
  let error;
  _.some(fields, field => {
    try {
      if (company[field] && company[field].length > 0) {
        company[field] = JSON.parse(company[field]);
      }
    } catch (err) {
      error = AppErr.reject(err, ERROR['INVALID_' + field.toUpperCase()]);
      return true;
    }
  });
  return error;
}

// Unsafe/Unvalidated Create. Use inside validated method.
function createCompany(data) {
  return CompanyModel.create(data)
  .catch(err => AppErr.formatMongoErrors(err))
  .catch(err => AppErr.reject(err, ERROR.CREATE));
}


function doesNotExist(data) {
  return CompanyModel.fetchOne(data)
  .then(() => AppErr.reject(null, ERROR.ALREADY_EXISTS))
  .catch(err => AppErr.resolveIf(err, ERROR.NOT_FOUND));
}


/******************************************************************************/
/******************************* EXPORT MODEL  ********************************/
/******************************************************************************/


// Promisify Mongoose Model.
const CompanyModel = mongoose.model(RESOURCE, companySchema);
Promise.promisifyAll(CompanyModel);
Promise.promisifyAll(CompanyModel.prototype);


CompanyModel.ERROR = ERROR;
CompanyModel.RESOURCE = RESOURCE;

/**
 * Exports the Company Schema.
 * @type {!Object}
 */
module.exports = CompanyModel;
