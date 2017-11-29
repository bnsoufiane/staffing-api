const mongoose = require('mongoose');
const mongooseTimestamps = require('mongoose-timestamp');
const autoIncrement = require('mongoose-auto-increment');
const Schema = mongoose.Schema;

/**
 * @swagger
 * definition:
 *   Lists:
 *     type: object
 *     properties:
 *       name:
 *         type: string
 *       userId:
 *         type: string
 *       companies:
 *         type: array
 *         items:
 *           type: string
 *       jobs:
 *         type: array
 *         items:
 *           type: string
 *       businesses:
 *         type: array
 *         items:
 *           type: string
 *       sharedWithUsers:
 *         type: array
 *         items:
 *           type: string
 *       sharedWithTeams:
 *         type: array
 *         items:
 *           type: string
 */


/**
 * The Lists Schema.
 * @type {Schema}
 */
const ListsSchema = new Schema({
  name: {type: String, required: true, index: {unique: true}},
  userId: {type: String},
  companies: [String],
  businesses: [String],
  jobs: [String],
  sharedWithUsers: [String],
  sharedWithTeams: [String]
});

autoIncrement.initialize(mongoose);
ListsSchema.plugin(autoIncrement.plugin, {
  model: 'Lists',
  startAt: 1
});
ListsSchema.plugin(mongooseTimestamps);

module.exports = ListsSchema;
