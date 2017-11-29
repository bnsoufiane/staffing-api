'use strict';

const mongoose = require('mongoose');
const Promise = require('bluebird');
const constants = require('../../constants');
const RolesModel = require('../roles/roles-resource');
const utils = require('../../utils');
const ImageModel = require('../images/images-resource');
const _ = require('lodash');
const AppErr = require('../../error');
const imageUpload = require('../../services/imageupload')({
  aws: constants.AWS_CONFIG
});


const ERROR = Object.freeze({
  REQ_ATTR: {status: 400, message: 'Some required input fields are missing.'},
  REQ_FILES: {status: 400, message: 'Some required files are missing.'},
  INVALID_ARRAYS: {status: 400, message: 'Roles, pastCompanies or skillset requires stringified arrays.'},
  INCOMPLETE_SKILLSET: {status: 400, message: 'Skillset data is not complete.'},
  INCOMPLETE_PAST_COMPANIES: {status: 400, message: 'Past companies data is not complete.'},
  ALREADY_EXISTS: {status: 400, message: 'This candidate already exists.'},
  NOT_FOUND: {status: 404, message: 'Candidate not found.'},
  UPLOAD: {status: 500, message: 'Error uploading file.'},
  VIDEO_UPLOAD: {status: 500, message: 'Error uploading interview video.'},
  IMAGES_UPLOAD: {status: 500, message: 'Error uploading images.'},

  INVALID_DATA: {status: 400, message: 'Invalid data, kindly consult swagger docs for data types.'},
  CREATE: {status: 500, message: 'Error creating candidate.'},
  LIST: {status: 500, message: 'Error listing candidates.'},
  GENERIC: {status: 500, message: 'Something went wrong with candidates.'},
  FETCH: {status: 500, message: 'Candidate could not be retrieved.'},
  UPDATE: {status: 422, message: 'Unable to update candidate.'},
  DELETE: {status: 422, message: 'Unable to delete candidate.'}
});


var candidateSchema = require('./candidates-schema');

/**
 *
 */
candidateSchema.options.toJSON = {
  transform: function (doc, obj, options) {
    delete obj.__v;
    return obj;
  }
};

/**
 * Upload video
 * @param multerFiles
 * @param name (this name will be included in the returned object)
 */
candidateSchema.statics.uploadVideo = function uploadVideo(multerFiles, name) {
  let video = multerFiles[name];
  if (!video) return {['interviewVideo']: {full: ''}};
  let settings = {
    bucket: constants.STAFFING_S3_BUCKET
  };
  return imageUpload.uploadVideo(video[0], settings, name);
};

/**
 * Upload all images
 * @param multerImages
 * @param settings
 * @returns {Promise}
 */
candidateSchema.statics.uploadImages = function uploadImages(multerImages, settings) {
  let images = [];
  if (!multerImages) Promise.resolve(false);
  utils.object.forEach(multerImages, (value, key) => {
      let settings = {
        bucket: constants.STAFFING_S3_BUCKET,
        thumbnail: {height: ImageModel.THUMB_HEIGHT, width: ImageModel.THUMB_WIDTH}
      };
      images.push(imageUpload.uploadImageAndThumb(value[0], settings, key))
    }
  );
  return Promise.all(images);
};

/**
 * Multer configurations for images and video of candidate
 */
candidateSchema.statics.multerFilesConfiguration = function multerFilesConfiguration() {
  return imageUpload.multerMW([
    {name: 'avatar', maxCount: 1},
    {name: 'interviewVideo', maxCount: 1},
    {name: 'company1_logo', maxCount: 1},
    {name: 'company1_worksample1', maxCount: 1},
    {name: 'company1_worksample2', maxCount: 1},
    {name: 'company1_worksample3', maxCount: 1},
    {name: 'company2_logo', maxCount: 1},
    {name: 'company2_worksample1', maxCount: 1},
    {name: 'company2_worksample2', maxCount: 1},
    {name: 'company2_worksample3', maxCount: 1},
    {name: 'company3_logo', maxCount: 1},
    {name: 'company3_worksample1', maxCount: 1},
    {name: 'company3_worksample2', maxCount: 1},
    {name: 'company3_worksample3', maxCount: 1}
  ])
};

/**
 * Data validation checks for candidates input
 * @param candidate
 * @param files
 * @param formType
 * @returns {Promise.<T>}
 */
candidateSchema.statics.validate = function (candidate, files, formType) {
  //validate text fields
  if (_.isEmpty(candidate) || utils.array.any(
      [candidate.roles, candidate.skillset, candidate.pastCompanies, candidate.fullname,
        candidate.location, candidate.title],
      attr => !attr || _.isEmpty(attr)))
    return AppErr.reject(null, ERROR.REQ_ATTR);

  //parse the array based input fields
  try {
    candidate['pastCompanies'] = JSON.parse(candidate.pastCompanies);
    candidate['roles'] = JSON.parse(candidate.roles);
    candidate['skillset'] = JSON.parse(candidate.skillset);
    if (candidate.avatar && !files.avatar) candidate['avatar'] = JSON.parse(candidate.avatar);
  } catch (err) {
    return AppErr.reject(err, ERROR.INVALID_ARRAYS);
  }

  //validate all input files
  if (reqFilesMissing(candidate, files, formType))
    return AppErr.reject(null, ERROR.REQ_FILES);


  //validate all role ids
  if (!utils.array.all(candidate.roles, role => RolesModel.findById(role)))
    return AppErr.reject(null, RolesModel.ERROR.NOT_FOUND);

  //validate skillset data
  if (candidate.skillset.length < 6 || utils.array.any(candidate.skillset,
      skillset => utils.array.any([skillset.title],
        attr => !attr)))
    return AppErr.reject(null, ERROR.INCOMPLETE_SKILLSET);

  //validate past companies data
  if (candidate.pastCompanies.length < 3 || utils.array.any(candidate.pastCompanies,
      company => utils.array.any([company.name, company.url, company.position,
          company.workStartMonth, company.workEndMonth, company.workStartYear, company.workEndYear,
          company.workDescription],
        attr => !attr)))
    return AppErr.reject(null, ERROR.INCOMPLETE_PAST_COMPANIES);

  return Promise.resolve(candidate);


};
/**
 * Data validation checks for candidates
 * @param candidate
 * @param files
 * @param formType
 * @returns boolean
 */
function reqFilesMissing(candidate, files, formType) {
  return formType === 'add' ?
    addFormReqFilesMissing(files) : editFormReqFilesMissing(candidate, files);
}
/**
 * Edit specific file checks
 * @param candidate
 * @param files
 * @returns {boolean}
 */
function editFormReqFilesMissing(candidate, files) {
  return !!(_.isEmpty(files.avatar) && _.isEmpty(candidate.avatar) ||
  _.isEmpty(files.company1_logo) && _.isEmpty(candidate.pastCompanies[0].logo) ||
  _.isEmpty(files.company2_logo) && _.isEmpty(candidate.pastCompanies[1].logo) ||
  _.isEmpty(files.company3_logo) && _.isEmpty(candidate.pastCompanies[2].logo))
}
/**
 * Add specific file checks
 * @param files
 * @returns {boolean}
 */
function addFormReqFilesMissing(files) {
  //TODO(hhsadiq): add validations for image mime type and video mime type and allow only specific types
  return !!(_.isEmpty(files) || utils.array.any(
    [files.avatar, files.company1_logo, files.company2_logo,
      files.company3_logo],
    file => _.isEmpty(file)));
}

/**
 * Reformat the structure of uploaded images according to
 * candidate schema
 * @param images
 * @param pastCompanies
 */
candidateSchema.statics.pastCompaniesImages = function pastCompaniesImages(images, pastCompanies) {
  _.forEach(pastCompanies, (company, i) => {
    let companyStr = 'company'.concat(i + 1);
    let logoKey = companyStr.concat('_logo');
    let image = utils.array.findWhere(images,
      (value, index) => Object.keys(value)[0] === logoKey);
    if (image) {
      company.logo = {
        url: image[logoKey].full.Location,
        thumbnail: image[logoKey].thumb.Location
      };
    }
    company.workSamples = [];
    for (let j = 0; j < 3; j++) {
      let sampleKey = companyStr.concat('_worksample').concat(j + 1);
      image = utils.array.findWhere(images,
        (value, index) => Object.keys(value)[0] === sampleKey);
      if (!image) continue;
      company.workSamples.push({
        url: image[sampleKey].full.Location,
        thumbnail: image[sampleKey].thumb.Location
      });
    }
  });
  return pastCompanies;
};

/**
 * Include the avatar image to body
 * @param images
 */
candidateSchema.statics.avatarImage = function avatarImage(images) {
  let image = utils.array.findWhere(images,
    (value, index) => Object.keys(value)[0] === 'avatar');
  if (!image) return false;
  return {
    url: image.avatar.full.Location,
    thumbnail: image.avatar.thumb.Location
  };
};


// Promisify Mongoose Model.
var CandidateModel = mongoose.model('Candidate', candidateSchema);
Promise.promisifyAll(CandidateModel);
Promise.promisifyAll(CandidateModel.prototype);


CandidateModel.ERROR = ERROR;

/**
 * Exports the Candidate Model.
 * @type {!Object}
 */
module.exports = CandidateModel;
