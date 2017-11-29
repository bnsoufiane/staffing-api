/**
 * @swagger
 * definition:
 *   Job:
 *     type: object
 *     properties:
 *       title:
 *         type: string
 *       jobLink:
 *         type: string
 *       description:
 *         type: string
 *       company:
 *         type: string
 *       companyLink:
 *         type: string
 *       location:
 *         type: string
 *       date:
 *         type: string
 */


const mongoose = require('mongoose');
const mongooseTimestamps = require('mongoose-timestamp');
const autoIncrement = require('mongoose-auto-increment');
const Schema = mongoose.Schema;


/**
 * The Job Schema.
 * @type {Schema}
 */
const jobSchema = new Schema({
  title: {type: String, required: true},
  jobLink: {type: String, required: true, index: {unique: true}},
  description: {type: String},
  company: {type: String},
  companyLink: {type: String},
  companyId: {type: String},
  location: {type: String},
  city: {type: String},
  date: {type: String},
  wage: {type: String},
  source: {type: String},
  category: {type: String},
  reviewsNumber: {type: Number}
});

autoIncrement.initialize(mongoose);
jobSchema.plugin(autoIncrement.plugin, {
  model: 'Job',
  startAt: 1
});
jobSchema.plugin(mongooseTimestamps);

module.exports = jobSchema;
