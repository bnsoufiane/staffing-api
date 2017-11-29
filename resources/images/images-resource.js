'use strict';

var mongoose = require('mongoose');
var Promise = require('bluebird');

const AppErr = require('../../error');
const constants = require('../../constants');
const imageUpload = require('../../services/imageupload')({
  aws: constants.AWS_CONFIG
});

var ERRORS = {
  UPLOAD: {status: 500, message: 'Error occured while uploading picture.'},
  CREATE: {status: 500, message: 'Error occured while creating picture.'},
  NOT_FOUND: {status: 400, message: 'Picture not found.'}
};


var imageSchema = require('./images-schema');


/**
 * Uploads and saves the given picture to db.
 */
imageSchema.statics.saveImage = function(file) {
  if(!file) return AppErr.reject(null, ERRORS.NOT_FOUND);
  
  // Upload picture.
  return imageUpload.uploadImageAndThumb(file, {
    bucket: constants.STAFFING_S3_BUCKET,
    thumbnail: { height: 300, width: 300 }
  })
  .catch(err => AppErr.reject(err, ERRORS.UPLOAD))
  // Create picture.
  .then(function(result) {
    console.log('---- upload result: ', result);

    let body = {
      url: result.image.full.Location,
      thumbnail: result.image.thumb.Location
    };
    let image = new ImageModel(body);
    return image.saveAsync()
    .then(images => images[0])
    .catch(err => AppErr.reject(err, ERRORS.CREATE));
  });
};

// Promisify Mongoose Model.
var ImageModel = mongoose.model('Image', imageSchema);
Promise.promisifyAll(ImageModel);
Promise.promisifyAll(ImageModel.prototype);

ImageModel.THUMB_HEIGHT = 400;
ImageModel.THUMB_WIDTH = 400;

/**
 * Exports the Image Schema.
 * @type {!Object}
 */
module.exports = ImageModel;
