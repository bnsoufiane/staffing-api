const mongoose = require('mongoose');
const mongooseTimestamps = require('mongoose-timestamp');
const autoIncrement = require('mongoose-auto-increment');
const Schema = mongoose.Schema;

/**
 * The keyPeople Schema.
 *
 * @swagger
 * definition:
 *   KeyPeople:
 *     type: object
 *     properties:
 *       name:
 *         type: string
 *       title:
 *         type: string
 *       email:
 *         type: string
 *       linkedIn:
 *         type: string
 *       facebook:
 *         type: string
 *       twitter:
 *         type: string
 *       website:
 *         type: string
 *       other:
 *         type: string
 *
 */
var keyPeopleSchema = new Schema({
  name: String,
  title: String,
  email: String,
  linkedIn: String,
  facebook: String,
  twitter: String,
  website: String,
  other: String
}, {_id: false});

/**
 * The keyPeople Schema.
 *
 * @swagger
 * definition:
 *   Funding:
 *     type: object
 *     properties:
 *       date:
 *         type: string
 *       amount:
 *         type: string
 *       source:
 *         type: string
 *       round:
 *         type: string
 *       investor:
 *         type: string
 *
 */
var fundingSchema = new Schema({
  date: String,
  amount: String,
  source: String,
  round: String,
  investors: [String]
}, {_id: false});

/**
 * The keyPeople Schema.
 *
 * @swagger
 * definition:
 *   Acquisition:
 *     type: object
 *     properties:
 *       name:
 *         type: string
 *       date:
 *         type: string
 *       amount:
 *         type: string
 *       source:
 *         type: string
 *
 */
var acquisitionSchema = new Schema({
  name: String,
  date: String,
  amount: String,
  source: String
}, {_id: false});


/**
 * @swagger
 * definition:
 *   OwlerCompany:
 *     type: object
 *     properties:
 *       companyName:
 *         type: string
 *       websiteLink:
 *         type: string
 *       description:
 *         type: string
 *       logo:
 *         type: string
 *       dateFounded:
 *         type: string
 *       categories:
 *         type: array
 *         items:
 *           type: string
 *       status:
 *         type: string
 *       revenue:
 *         type: string
 *       numberOfEmployees:
 *         type: number
 *       funding:
 *         type: array
 *         items:
 *           type: object
 *           schema:
 *            $ref: '#/definitions/Funding'
 *       acquisitions:
 *         type: array
 *         items:
 *           type: object
 *           schema:
 *            $ref: '#/definitions/Acquisition'
 *       acquisitionsNumber:
 *         type: string
 *       keyPeople:
 *         type: array
 *         items:
 *           type: object
 *           schema:
 *            $ref: '#/definitions/KeyPeople'
 *       foundersNames:
 *         type: array
 *         items:
 *           type: string
 *       linkedInURL:
 *         type: string
 *       twitterURL:
 *         type: string
 *       facebookURL:
 *         type: string
 *       youtubeURL:
 *         type: string
 *       instagramURL:
 *         type: string
 *       owlerURL:
 *         type: string
 *       headquartersAddress:
 *         type: string
 *       phone:
 *         type: string
 *       source:
 *         type: string
 */


/**
 * The OwlerCompany Schema.
 * @type {Schema}
 */
const owlerCompanySchema = new Schema({
  companyName: {type: String, required: true},
  websiteLink: {type: String},
  description: {type: String},
  logo : {type: String},
  dateFounded: {type: String},
  categories: [String],
  status: {type: String},
  revenue: {type: String},
  numberOfEmployees: {type: String},
  funding: [fundingSchema],
  acquisitions: [acquisitionSchema],
  acquisitionsNumber: {type: String},
  keyPeople: [keyPeopleSchema],
  foundersNames: [keyPeopleSchema],
  linkedInURL: {type: String},
  twitterURL: {type: String},
  facebookURL: {type: String},
  youtubeURL: {type: String},
  instagramURL: {type: String},
  owlerURL: {type: String},
  headquartersAddress: {type: String},
  phone: {type: String},
  source: {type: String}
});

autoIncrement.initialize(mongoose);
owlerCompanySchema.plugin(autoIncrement.plugin, {
  model: 'OwlerCompany',
  startAt: 1
});
owlerCompanySchema.plugin(mongooseTimestamps);

module.exports = owlerCompanySchema;
