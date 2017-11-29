const mongoose = require('mongoose');
const mongooseTimestamps = require('mongoose-timestamp');
const autoIncrement = require('mongoose-auto-increment');
const Schema = mongoose.Schema;

var keyPeopleSchema = new Schema({
  name: String,
  title: String,
  email: String,
  avatar: String,
  linkedIn: String,
  facebook: String,
  twitter: String,
  website: String,
  other: String
}, {_id: false});

var fundingSchema = new Schema({
  date: String,
  amount: Number,
  source: String,
  round: String,
  leadInvestors: [String],
  valuation: Number,
  investorsNumber: Number,
  investors: [String]
}, {_id: false});

var acquisitionSchema = new Schema({
  name: String,
  date: String,
  amount: Number,
  source: String
}, {_id: false});

var editsSchema = new Schema({
  companyName: String,
  status: String,
  description: String,
  numberOfEmployees: Number,
  dateFounded: String,
  websiteLink: String,
  linkedInURL: String,
  twitterURL: String,
  facebookURL: String,
  funding: [fundingSchema],
  fundingAmount: {type: String},
  fundingRounds: {type: Number},
  lastFundingDate: {type: String},
  foundersNames: [String],
  categories: [String],
  keyPeople: [keyPeopleSchema],
  revenue: Number,
  source: String
}, {_id: false});

var newsSchema = new Schema({
  source: String,
  date: String,
  title: String,
  url: String
}, {_id: false});

var investorSchema = new Schema({
  name: String,
  rounds: [String],
  partners: [String]
}, {_id: false});

var investmentSchema = new Schema({
  date: String,
  investedIn: String,
  round: String,
  type: String,
  partners: [String]
}, {_id: false});

const companyDetailsSchema = new Schema({
  acquisitions: [acquisitionSchema],
  acquisitionsNumber: {type: Number},
  angelURL: {type: String},
  categories: [String],
  cityHeadQuartersIn: {type: String},
  craftURL: {type: String},
  crunchBaseURL: {type: String},
  companyName: {type: String, required: true, index: {unique: true}},
  dateFounded: {type: String},
  description: {type: String},
  edits: [editsSchema],
  email: {type: String},
  facebookLikes: {type: Number},
  facebookURL: {type: String},
  foundersNames: [String],
  funding: [fundingSchema],
  fundingAmount: {type: Number},
  fundingRounds: {type: Number},
  headquartersAddress: {type: String},
  instagramFollowers: {type: Number},
  instagramURL: {type: String},
  investments: [investmentSchema],
  investors: [investorSchema],
  keyPeople: [keyPeopleSchema],
  lastFundingDate: {type: String},
  linkedInURL: {type: String},
  logo : {type: String},
  news: [newsSchema],
  numberOfEmployees: {type: Number},
  minNumberOfEmployees: {type: Number},
  maxNumberOfEmployees: {type: Number},
  otherLocations: [String],
  owlerURL: {type: String},
  phone: {type: String},
  revenue: {type: Number},
  source: {type: String},
  status: {type: String},
  twitterFollowers: {type: Number},
  twitterURL: {type: String},
  websiteLink: {type: String},
  youtubeURL: {type: String}
});

autoIncrement.initialize(mongoose);
companyDetailsSchema.plugin(autoIncrement.plugin, {
  model: 'companyDetails',
  startAt: 1
});
companyDetailsSchema.plugin(mongooseTimestamps);

module.exports = companyDetailsSchema;
