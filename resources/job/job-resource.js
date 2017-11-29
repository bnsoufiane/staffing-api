'use strict';

const mongoose = require('mongoose');
const Promise = require('bluebird');
mongoose.Promise = Promise;
const deepFreeze = require('deep-freeze-strict');
const AppErr = require('../../error');
const RESOURCE = 'Job';
const ERROR = deepFreeze(
  Object.assign({},
    AppErr.COMMON_ERROR,
    AppErr.generateResourceErrors(RESOURCE)
  )
);
const jobSchema = require('./job-schema');
const constants = require('../../constants');
const queryString = require('query-string');
const esJob = require('../../services/elasticsearch')({
  type: constants.ELASTIC_TYPES.JOB
});


/**
 *
 */
jobSchema.options.toJSON = {
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
jobSchema.statics.fetchOne = function(query) {
  return JobModel.findOne(query)
  .then(job => job || AppErr.reject(null, ERROR.NOT_FOUND))
  .catch(err => AppErr.formatMongoErrors(err))
  .catch(err => AppErr.reject(err, ERROR.FETCH));
};

/**
 * @param {Object} query
 */
jobSchema.statics.fetch = function(params) {
  params.page = (params.page && params.page > 0) ? parseInt(params.page) : 1;
  params.size = (params.size && params.size > 0) ?
    parseInt(params.size) : constants.DEFAULT_PAGE_SIZE;

  params.q = params.q ? queryString.parse(params.q) : {};

  params.sort = [
    {date: 'desc'}
  ];

  return esJob.search(params)
    .then(result => result)
    .catch(err => AppErr.reject(err, ERROR.FETCH));
};

/**
 * @param {string} id
 */
jobSchema.statics.getById = function(id) {
  return esJob.get(id)
    .then(result => (result.found && result._source) || AppErr.reject(null, ERROR.NOT_FOUND))
    .catch(err => AppErr.reject(err, ERROR.FETCH));
};


/**
 * @param {jobSchema} data
 */
jobSchema.statics.createOne = function(data) {
  if (!data) return AppErr.reject(null, ERROR.NO_DATA);
  return doesNotExist(data)
  // Create job.
  .then(() => createJob(data))
  .catch(err => AppErr.reject(err, ERROR.ALREADY_EXIST));
};

/******************************************************************************/
/***************************** HELPER FUNCTIONS  ******************************/
/******************************************************************************/


// Unsafe/Unvalidated Create. Use inside validated method.
function createJob(data) {
  return JobModel.create(data)
  .catch(err => AppErr.formatMongoErrors(err))
  .catch(err => AppErr.reject(err, ERROR.CREATE));
}


function doesNotExist(data) {
  return JobModel.fetchOne(data)
  .then(() => AppErr.reject(null, ERROR.ALREADY_EXISTS))
  .catch(err => AppErr.resolveIf(err, ERROR.NOT_FOUND));
}


/******************************************************************************/
/******************************* EXPORT MODEL  ********************************/
/******************************************************************************/


// Promisify Mongoose Model.
const JobModel = mongoose.model(RESOURCE, jobSchema);


JobModel.ERROR = ERROR;
JobModel.RESOURCE = RESOURCE;

/**
 * Exports the Job Schema.
 * @type {!Object}
 */
module.exports = JobModel;
