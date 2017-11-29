var mongoose = require('mongoose');
var mongooseTimestamps = require('mongoose-timestamp');
var Schema = mongoose.Schema;

/**
 * @swagger
 * definition:
 *   Image:
 *     type: object
 *     properties:
 *       _id:
 *         type: string
 *       url:
 *         type: string
 *       thumbnail:
 *         type: string
 *       title:
 *         type: string
 *       description:
 *         type: string
 */
var imageSchema = new Schema({
  url: {type: String},
  thumbnail: {type: String},
  title: {type: String},
  description: {type: String}
});

imageSchema.plugin(mongooseTimestamps);

module.exports = imageSchema;
