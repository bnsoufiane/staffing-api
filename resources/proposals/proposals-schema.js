var mongoose = require('mongoose');
var mongooseTimestamps = require('mongoose-timestamp');
var Schema = mongoose.Schema;

/**
 * The Breakdown Schema.
 *
 * @swagger
 * definition:
 *   Breakdown:
 *     type: object
 *     properties:
 *       _id:
 *         type: string
 *       title:
 *         type: string
 *       summary:
 *         type: string
 *       tables:
 *         type: array
 *         items:
 *          type: object
 *          properties:
 *            row:
 *              type: array
 *              items:
 *                type: string
 *
 */
var breakdownSchema = new Schema({
  title: String,
  summary: String,
  tables: [{
    title: String,
    table: [{row: [String]}]
  }]
});

/**
 * The Insert Schema.
 *
 * @swagger
 * definition:
 *   Insert:
 *     type: object
 *     properties:
 *       _id:
 *         type: string
 *       title:
 *         type: string
 *       paragraph:
 *         type: string
 *
 */
var insertSchema = new Schema({
  title: String,
  paragraph: String
});


/**
 * The Steps Schema.
 *
 * @swagger
 * definition:
 *   Steps:
 *     type: object
 *     properties:
 *       _id:
 *         type: string
 *       title:
 *         type: string
 *       summary:
 *         type: string
 *       list:
 *         type: array
 *         items:
 *          type: object
 *          properties:
 *            header: string
 *            paragraph: string
 *
 */
var stepsSchema = new Schema({
  title: String,
  summary: String,
  list: [{header:String, paragraph:String}]
});

/**
 * * The Proposal Schema.
 *
 * @swagger
 * definition:
 *   Proposal:
 *     type: object
 *     properties:
 *       _id:
 *         type: string
 *       name:
 *         type: string
 *       subhead:
 *         type: string
 *       overview:
 *         type: string
 *       overview_inactive:
 *         type: boolean
 *       scope_of_work:
 *         type: string
 *       scope_of_work_inactive:
 *         type: boolean
 *       inserts:
 *         type: array
 *         items:
 *          type: object
 *          schema:
 *            $ref: '#/definitions/Insert'
 *       inserts_inactive:
 *         type: boolean
 *       breakdown:
 *         type: object
 *         schema:
 *          $ref: '#/definitions/Breakdown'
 *       breakdown_inactive:
 *         type: boolean
 *       timeline:
 *         type: object
 *         schema:
 *          $ref: '#/definitions/Breakdown'
 *       timeline_inactive:
 *         type: boolean
 *       steps:
 *         type: object
 *         schema:
 *          $ref: '#/definitions/Steps'
 *       steps_inactive:
 *         type: boolean
 *       candidate_ids:
 *         type: array
 *         items:
 *          type: string
 *          required: true
 *       candidate_ids_inactive:
 *         type: boolean
 *       portfolio_ids:
 *         type: array
 *         items:
 *          type: number
 *       portfolio_ids_inactive:
 *         type: boolean
 *
 */
var proposalSchema = new Schema({
  name: String,
  subhead: String,
  overview: String,
  overview_inactive: Boolean,
  scope_of_work: String,
  scope_of_work_inactive: Boolean,
  inserts: [insertSchema],
  inserts_inactive: Boolean,
  breakdown: breakdownSchema,
  breakdown_inactive: Boolean,
  timeline: breakdownSchema,
  timeline_inactive: Boolean,
  steps: stepsSchema,
  steps_inactive: Boolean,
  candidate_ids: [{type: Schema.Types.ObjectId, required: true, ref: 'Candidate', index: {unique: true}}],
  candidate_ids_inactive: Boolean,
  portfolio_ids: [Number],
  portfolio_ids_inactive: Boolean
});

proposalSchema.plugin(mongooseTimestamps);

module.exports = proposalSchema;
