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
  ALREADY_EXISTS: {status: 400, message: 'This proposal already exists.'},
  NOT_FOUND: {status: 404, message: 'Proposal not found.'},
  UPLOAD: {status: 500, message: 'Error uploading file.'},
  INVALID_BREAKDOWN: {status: 400, message: 'Breakdown should be stringified data.'},
  INVALID_TIMELINE: {status: 400, message: 'Timeline should be stringified data.'},
  INVALID_INSERTS: {status: 400, message: 'Inserts should be stringified data.'},
  INVALID_STEPS: {status: 400, message: 'Steps should be stringified data.'},

  INVALID_DATA: {status: 400, message: 'Invalid data, kindly consult swagger docs for data types.'},
  CREATE: {status: 500, message: 'Error creating proposal.'},
  LIST: {status: 500, message: 'Error listing proposals.'},
  GENERIC: {status: 500, message: 'Something went wrong with proposals.'},
  FETCH: {status: 500, message: 'Proposal could not be retrieved.'},
  UPDATE: {status: 422, message: 'Unable to update proposal.'},
  DELETE: {status: 422, message: 'Unable to delete proposal.'}
});


var proposalSchema = require('./proposals-schema');

/**
 *
 */
proposalSchema.options.toJSON = {
  transform: function (doc, obj, options) {
    delete obj.__v;
    return obj;
  }
};


/**
 * Multer configurations for images and video of candidate
 */
proposalSchema.statics.multerFilesConfiguration = function multerFilesConfiguration() {
};

/**
 * Data validation checks for proposals input
 * @param proposal
 * @param formType
 * @returns {Promise.<T>}
 */
proposalSchema.statics.validate = function (proposal, formType) {
  //validate text fields
  if (_.isEmpty(proposal) || utils.array.any(
      [proposal.name],
      attr => !attr || !attr.length))
    return AppErr.reject(null, ERROR.REQ_ATTR);

  //parse the array based input fields
  try {
    if(proposal.breakdown && proposal.breakdown.length > 0)
      proposal['breakdown'] = JSON.parse(proposal.breakdown);
  } catch (err) {
    return AppErr.reject(err, ERROR.INVALID_BREAKDOWN);
  }
  try {
    if(proposal.timeline && proposal.timeline.length > 0)
      proposal['timeline'] = JSON.parse(proposal.timeline);
  } catch (err) {
    return AppErr.reject(err, ERROR.INVALID_TIMELINE);
  }
  try {
    if(proposal.inserts && proposal.inserts.length > 0)
      proposal['inserts'] = JSON.parse(proposal.inserts);
  } catch (err) {
    return AppErr.reject(err, ERROR.INVALID_INSERTS);
  }
  try {
    if(proposal.steps && proposal.steps.length > 0)
      proposal['steps'] = JSON.parse(proposal.steps);
  } catch (err) {
    return AppErr.reject(err, ERROR.INVALID_STEPS);
  }

  //_id is required to update proposal document
  if(formType === 'update' && (!proposal._id || !proposal._id.length)) {
    return AppErr.reject(null, ERROR.REQ_ID_ATTR);
  }

  return Promise.resolve(proposal);
};

// Promisify Mongoose Model.
var ProposalModel = mongoose.model('Proposal', proposalSchema);
Promise.promisifyAll(ProposalModel);
Promise.promisifyAll(ProposalModel.prototype);


ProposalModel.ERROR = ERROR;

/**
 * Exports the Proposal Model.
 * @type {!Object}
 */
module.exports = ProposalModel;
