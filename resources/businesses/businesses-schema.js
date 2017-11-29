const mongoose = require('mongoose');
const mongooseTimestamps = require('mongoose-timestamp');
const autoIncrement = require('mongoose-auto-increment');
const Schema = mongoose.Schema;

/**
 * openingHours Schema
 *
 * @swagger
 * definition:
 *   OpeningHours:
 *     type: object
 *     properties:
 *       mon:
 *         type: string
 *       tue:
 *         type: string
 *       wed:
 *         type: string
 *       thu:
 *         type: string
 *       fri:
 *         type: string
 *       sat:
 *         type: string
 *       sun:
 *         type: string
 *
 */
var openingHoursSchema = new Schema({
  mon: String,
  tue: String,
  wed: String,
  thu: String,
  fri: String,
  sat: String,
  sun: String,
}, {_id: false});

/**
 * rating Schema.
 *
 * @swagger
 * definition:
 *   Rating:
 *     type: object
 *     properties:
 *       five:
 *         type: string
 *       four:
 *         type: string
 *       three:
 *         type: string
 *       two:
 *         type: string
 *       one:
 *         type: string
 *
 */
var ratingSchema = new Schema({
  five: String,
  four: String,
  three: String,
  two: String,
  one: String
}, {_id: false});

/**
 * key/value Schema.
 *
 * @swagger
 * definition:
 *   keyValue:
 *     type: object
 *     properties:
 *       key:
 *         type: string
 *       value:
 *         type: string
 *
 */
var keyValueSchema = new Schema({
  key: String,
  value: String
}, {_id: false});

/**
 * @swagger
 * definition:
 *   Business:
 *     type: object
 *     properties:
 *       name:
 *         type: string
 *       website:
 *         type: string
 *       owners:
 *         type: array
 *         items:
 *           type: string
 *       street:
 *         type: string
 *       city:
 *         type: string
 *       state:
 *         type: string
 *       postalCode:
 *         type: string
 *       neighborhood:
 *         type: string
 *       country:
 *         type: string
 *       categories:
 *         type: array
 *         items:
 *           type: string
 *       email:
 *         type: string
 *       phone:
 *         type: string
 *       coordinates:
 *         type: array
 *         items:
 *           type: string
 *       partOfChain:
 *         type: boolean
 *       facebook:
 *         type: string
 *       twitter:
 *         type: string
 *       yelpUrl:
 *         type: string
 *       yelpAvatar:
 *         type: string
 *       priceRange:
 *         type: string
 *       priceDescription:
 *         type: string
 *       healthInspection:
 *         type: string
 *       hours:
 *          type: object
 *          schema:
 *            $ref: '#/definitions/OpeningHours'
 *       reviews:
 *          type: object
 *          schema:
 *            $ref: '#/definitions/Rating'
 *       yelpingSince:
 *         type: string
 *       additionalInfo:
 *         type: array
 *         items:
 *           type: object
 *           schema:
 *            $ref: '#/definitions/keyValue'
 *       source:
 *         type: string
 */


/**
 * The Business Schema.
 * @type {Schema}
 */
const BusinessSchema = new Schema({
  name: {type: String, required: true},
  website: {type: String},
  owners: [String],
  dateFounded: {type: String},
  street: {type: String},
  city: {type: String},
  state: {type: String},
  postalCode: {type: String},
  neighborhood: {type: String},
  country: {type: String},
  categories: [String],
  email: {type: String},
  phone: {type: String},
  coordinates: [String],
  partOfChain: {type: Boolean},
  facebook: {type: String},
  twitter: {type: String},
  yelpUrl: {type: String},
  yelpAvatar: {type: String},
  priceRange: {type: String},
  priceDescription: {type: String},
  healthInspection: {type: String},
  hours: {type: openingHoursSchema},
  reviews: {type: ratingSchema},
  yelpingSince: {type: String},
  additionalInfo: [keyValueSchema],
  source: {type: String}
});

autoIncrement.initialize(mongoose);
BusinessSchema.plugin(autoIncrement.plugin, {
  model: 'Businesses',
  startAt: 1
});
BusinessSchema.plugin(mongooseTimestamps);

module.exports = BusinessSchema;
