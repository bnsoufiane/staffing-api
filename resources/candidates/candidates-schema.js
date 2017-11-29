var mongoose = require('mongoose');
var mongooseTimestamps = require('mongoose-timestamp');
var Schema = mongoose.Schema;
var imageSchema = require('../images/images-schema');

/**
 * Schema for candidate's past company
 *
 * @swagger
 * definition:
 *   Company:
 *     type: object
 *     properties:
 *      logo:
 *        type: object
 *        schema:
 *          $ref: '#/definitions/Image'
 *      name:
 *        type: string
 *      url:
 *        type: string
 *      candidateTitle:
 *        type: string
 *      workDescription:
 *        type: string
 *      workSamples:
 *        type: array
 *        items:
 *          type: object
 *          schema:
 *            $ref: '#/definitions/Image'
 */
var companySchema = new Schema({
  logo: imageSchema,
  name: String,
  url: String,
  position: String,
  workStartMonth: Number,
  workStartYear: Number,
  workEndMonth: Number,
  workEndYear: Number,
  workDescription: String,
  workSamples: [imageSchema]
});

/**
 * The skillset sub-document
 *
 * @swagger
 * definition:
 *   SkillSet:
 *     type: object
 *     properties:
 *       _id:
 *         type: string
 *       title:
 *         type: string
 *       description:
 *         type: string
 */
 var skillsetSchema = new Schema({
  title: String,
  description: String
});

/**
 * @swagger
 * definition:
 *   Candidate:
 *     type: object
 *     required:
 *       - roles
 *     properties:
 *       _id:
 *         type: string
 *       avatar:
 *         type: object
 *         schema:
 *          $ref: '#/definitions/Image'
 *       interviewVideo:
 *         type: string
 *       fullname:
 *         type: imageSchema
 *       location:
 *         type: string
 *       title:
 *         type: imageSchema
 *       roles:
 *         type: array
 *         items:
 *          type: string
 *       skillset:
 *         type: object
 *         schema:
 *           $ref: '#/definitions/SkillSet'
 *       pastCompanies:
 *         type: array
 *         items:
 *            type: object
 *            schema:
 *              $ref: '#/definitions/Company'
 */

var candidateSchema = new Schema({
  avatar: imageSchema,
  interviewVideo: String,
  fullname: String,
  location: String,
  title: String,
  roles: [{type:String, required: true, index: true}],
  skillset: [skillsetSchema],
  pastCompanies: [companySchema]
});

candidateSchema.plugin(mongooseTimestamps);

module.exports = candidateSchema;
