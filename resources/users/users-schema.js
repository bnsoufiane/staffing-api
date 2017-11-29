var mongoose = require('mongoose');
var mongooseTimestamps = require('mongoose-timestamp');
var autopopulate = require('mongoose-autopopulate');
var Schema = mongoose.Schema;

/**
 * The User Schema.
 *
 * @swagger
 * definition:
 *   User:
 *     type: object
 *     required:
 *       - username
 *       - resetPasswordToken
 *       - resetPasswordExpiresAt
 *     properties:
 *       _id:
 *         type: string
 *       name:
 *         type: string
 *       username:
 *         type: string
 *       email:
 *         type: string
 *       password:
 *         type: string
 *       resetPasswordToken:
 *         type: string
 *       resetPasswordExpiresAt:
 *         type: string
 */
var userSchema = new Schema({
  firstName: {type: String},
  lastName: {type: String},
  country: {type: String},
  timeZone: {type: String},
  name: {type: String},
  username: {type: String, required: true, index: {unique: true}},
  email: {type: String, index: {unique: true, sparse: true}},
  password: {type: String, select: false},
  emailConfirmed: {type: Boolean, required: true, default: false},
  googleId: {type: String},
  linkedinId: {type: String},
  confirmationToken: {type: String},
  confirmationExpiresAt: {type: Date},
  resetPasswordToken: {type: String, required: false},
  resetPasswordExpiresAt: {type: Date, required: false},
  avatar: {type: Schema.Types.ObjectId, ref: 'Image', autopopulate: true},
  sessions: [{
    token: {type: String},
    createdAt: {type: Date}
  }]
});

userSchema.plugin(mongooseTimestamps);
userSchema.plugin(autopopulate);

module.exports = userSchema;
