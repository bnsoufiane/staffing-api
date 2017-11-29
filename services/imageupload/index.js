var multer = require('multer');
var express = require('express');
var AWS = require('punch-aws');
var upload = multer({storage: multer.memoryStorage()});
var uuid = require('node-uuid');
var Promise = require('bluebird');
var lwip = require('lwip');
var request = require('request');
const utils = require('../../utils');

const AppErr = require('../../error');

const ERROR = {
  UPLOAD_ERROR: {status: 400, message: 'Error uploading image.'}
};


/**
 *
 */
function ImageUploader(config) {
  config = config || {};
  config.aws = config.aws || {};

  this.aws = new AWS(config.aws);
  this.fileProperty = config.fileProperty || 'file';
}


/**
 * @param {{
 *   mimetype: string,
 *   suffix: string,
 *   buffer: Array
 * }} multerFile
 * @param {{
 *   bucket: string,
 *   filename: (string|undefined)
 * }} settings
 */
ImageUploader.prototype.uploadImage = function (multerFile, settings) {
  settings = settings || {};
  if (!settings.filename) settings.filename =
    Date.now() + '-' + uuid.v4() + multerFile.suffix;
  return this.aws.S3.upload({
      body: multerFile.buffer,
      bucket: settings.bucket,
      key: settings.filename
    })
    .catch(err => AppErr.reject(err, ERROR.UPLOAD_ERROR));
};


/**
 * @param {{
 *   mimetype: string,
 *   suffix: string,
 *   buffer: Array
 * }} multerFile
 * @param {{
 *   height: number,
 *   width: number,
 *   centerPunch: (boolean|undefined),
 *   outputJPG: (boolean|undefined)
 * }} settings
 */
ImageUploader.prototype.createThumbnail = function (multerFile, settings) {
  settings = settings || {};
  return new Promise(function (resolve, reject) {
    var type = multerFile.suffix.replace('.', '');
    lwip.open(multerFile.buffer, type, function (err, image) {
      if (err) return reject(err);

      function resize(image) {
        image.resize(settings.width, settings.height, function (err, resized) {
          if (err) return reject(err);
          if (settings.outputJPG) {
            resized.toBuffer('jpg', {quality: 90}, function (err, result) {
              if (err) return reject(err);
              resolve(result);
            });
          } else resolve(resized);
        });
      }

      if (settings.centerPunch === false) return resize(image);
      var lesser = image.width() < image.height() ?
        image.width() : image.height();
      image.crop(lesser, lesser, function (err, cropped) {
        if (err) return reject(err);
        resize(cropped);
      });
    });
  });
};


/**
 * @param {{
 *   mimetype: string,
 *   suffix: string,
 *   buffer: Array
 * }} multerFile
 * @param {{
 *   bucket: string,
 *   filename: (string|undefined),
 *   thumbnail: {
 *     height: number,
 *     width: number
 *   }
 * }} settings
 * @param name
 */
ImageUploader.prototype.uploadImageAndThumb = function (multerFile, settings, name) {
  var self = this;

  settings = settings || {};
  name = name || 'image';
  if (!settings.filename) settings.filename =
    Date.now() + '-' + uuid.v4() + multerFile.suffix;

  settings.thumbnail.outputJPG = true;
  settings.thumbFilename = settings.filename.replace(multerFile.suffix, '') +
    '_th' + multerFile.suffix;

  var fullSize = this.aws.S3.upload({
    body: multerFile.buffer,
    bucket: settings.bucket,
    key: settings.filename
  });
  var thumbSize = this.createThumbnail(multerFile, settings.thumbnail)
    .then(function (thumbBuffer) {
      return self.aws.S3.upload({
        body: thumbBuffer,
        bucket: settings.bucket,
        key: settings.thumbFilename
      });
    });

  return Promise.all([fullSize, thumbSize]).spread(function (full, thumb) {
    return {[name]: {full: full, thumb: thumb}};
  });
};

ImageUploader.prototype.uploadVideo = function (multerFile, settings, name) {
  settings = settings || {};
  name = name || 'video';
  if (!settings.filename) settings.filename =
    Date.now() + '-' + uuid.v4() + multerFile.suffix;

  var video = this.aws.S3.upload({
    body: multerFile.buffer,
    bucket: settings.bucket,
    key: settings.filename
  });

  return Promise.all([video]).spread(function (video) {
    return {[name]: {full: video}};
  });
};

/**
 * Express Middleware for multer. Include as middleware on the route that
 * needs the images/videos available on the request. Makes the files available at
 * req.files.
 */
ImageUploader.prototype.multerMW = function (opt_fileProp) {
  var router = express.Router();
  router.use(
    upload.fields(opt_fileProp || this.fileProperty),
    function (req, res, next) {
      // Add suffix.
      utils.object.forEach(req.files, value => {
        console.log("FILE: ", value[0].originalname);
        var split = value[0].mimetype.split('/');
        value[0].suffix = '.' + split[split.length - 1].toLowerCase();
      });
      next();
    });
  return router;
};


/**
 * Express Middleware for multer. Include as middleware on the route that
 * needs the images/videos available on the request. Makes the files available at
 * req.files.
 */
ImageUploader.prototype.multerSingleMW = function (opt_fileProp) {
  var router = express.Router();
  router.use(
    upload.single(opt_fileProp || this.fileProperty),
    function(req, res, next) {
    // Add suffix.
    console.log("FILE: ",req.file);
    if (req.file) {
      var split = req.file.mimetype.split('/');
      var suffix = '.' + split[split.length - 1].toLowerCase();
      req.file.suffix = suffix;
    }
    next();
  });
  return router;
};




/**
 * @param {string} imageUrl Image url
 */
ImageUploader.prototype.uploadImageFromUrl = function (imageUrl) {
  var self = this;
  return new Promise(function (resolve, reject) {
    request(imageUrl, function (err, res, buffer) {
      if (err) return reject(err);
      self.uploadImage({buffer: buffer}).then(function (res) {
        resolve(res);
      }).catch('error', function (err) {
        return reject(err);
      });
    });
  });
};

/**
 *
 */
module.exports = function (config) {
  return new ImageUploader(config);
};
