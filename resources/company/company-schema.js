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
 * The logos Schema.
 *
 * @swagger
 * definition:
 *   Logos:
 *     type: object
 *     properties:
 *       craftLogo:
 *         type: string
 *       crunchBaseLogo:
 *         type: string
 *       otherLogo:
 *         type: string
 *
 */
var logosSchema = new Schema({
  craftLogo: String,
  crunchBaseLogo: String,
  otherLogo: String
}, {_id: false});


/**
 * Company edits schema, used for scraper edit layer.
 *
 * @swagger
 * definition:
 *   Edits:
 *     type: object
 *     properties:
 *       companyName:
 *         type: string
 *       status:
 *         type: string
 *       description:
 *         type: string
 *       numberOfEmployees:
 *         type: number
 *       dateFounded:
 *         type: string
 *       websiteLink:
 *         type: string
 *       linkedInURL:
 *         type: string
 *       twitterURL:
 *         type: string
 *       facebookURL:
 *         type: string
 *       instagramURL:
 *         type: string
 *       fundingAmount:
 *         type: string
 *       fundingRounds:
 *         type: number
 *       lastRound:
 *         type: string
 *       foundersNames:
 *         type: array
 *         items:
 *           type: string
 *       categories:
 *         type: array
 *         items:
 *           type: string
 *       keyPeople:
 *         type: array
 *         items:
 *           type: object
 *           schema:
 *            $ref: '#/definitions/KeyPeople'
 *       revenue:
 *         type: string
 *       source:
 *         type: string
 *
 */
var editsSchema = new Schema({
  companyName: String,
  status: String,
  description: String,
  numberOfEmployees: String,
  dateFounded: String,
  websiteLink: String,
  linkedInURL: String,
  twitterURL: String,
  facebookURL: String,
  instagramURL: String,
  fundingAmount: String,
  fundingRounds: Number,
  lastRound: String,
  foundersNames: [String],
  categories: [String],
  keyPeople: [keyPeopleSchema],
  revenue: String,
  source: String
}, {_id: false});

/**
 * @swagger
 * definition:
 *   Company:
 *     type: object
 *     properties:
 *       companyName:
 *         type: string
 *       foundersNames:
 *         type: array
 *         items:
 *           type: string
 *       cityHeadQuartersIn:
 *         type: string
 *       numberOfEmployees:
 *         type: number
 *       websiteLink:
 *         type: string
 *       fundingRounds:
 *         type: number
 *       fundingAmount:
 *         type: string
 *       lastFundingDate:
 *         type: string
 *       dateFounded:
 *         type: string
 *       categories:
 *         type: array
 *         items:
 *           type: string
 *       angelId:
 *         type: string
 *       description:
 *         type: string
 *       acquisitionsNumber:
 *         type: string
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
 *       angelURL:
 *         type: string
 *       crunchBaseURL:
 *         type: string
 *       craftURL:
 *         type: string
 *       status:
 *         type: string
 *       keyPeople:
 *         type: array
 *         items:
 *           type: object
 *           schema:
 *            $ref: '#/definitions/KeyPeople'
 *       source:
 *         type: string
 *       logos:
 *         type: array
 *         items:
 *           type: object
 *           schema:
 *            $ref: '#/definitions/Logos'
 *       otherLocations:
 *         type: array
 *         items:
 *           type: string
 *       email:
 *         type: string
 *       phone:
 *         type: string
 *       revenue:
 *         type: string
 *       edits:
 *         type: array
 *         items:
 *           type: object
 *           schema:
 *            $ref: '#/definitions/Edits'
 */


/**
 * The Company Schema.
 * @type {Schema}
 */
const companySchema = new Schema({
  companyName: {type: String, required: true},
  foundersNames: [String],
  cityHeadQuartersIn: {type: String},
  numberOfEmployees: {type: String},
  websiteLink: {type: String},
  fundingRounds: {type: Number},
  fundingAmount: {type: String},
  lastFundingDate: {type: String},
  dateFounded: {type: String},
  categories: [String],
  angelId: {type: String, index: {unique: true}},
  description: {type: String},
  acquisitionsNumber: {type: String},
  linkedInURL: {type: String},
  twitterURL: {type: String},
  facebookURL: {type: String},
  youtubeURL: {type: String},
  instagramURL: {type: String},
  angelURL: {type: String},
  crunchBaseURL: {type: String},
  craftURL: {type: String},
  status: {type: String},
  keyPeople: [keyPeopleSchema],
  source: {type: String},
  logos : {type: logosSchema},
  otherLocations: [String],
  email: {type: String},
  phone: {type: String},
  revenue: {type: String},
  // TODO(irtazabbas): As per verdi and tim, we should be using separate collection for edits when shifting to
  // TODO(irtazabbas): elastic search. For details check https://github.com/punchagency/staffing-api/pull/29
  edits: [editsSchema]
});

autoIncrement.initialize(mongoose);
companySchema.plugin(autoIncrement.plugin, {
  model: 'Company',
  startAt: 1
});
companySchema.plugin(mongooseTimestamps);

module.exports = companySchema;
