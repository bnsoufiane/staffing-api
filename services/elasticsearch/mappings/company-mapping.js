'use strict';

const types = require('./field-types');

const keyPeopleMapping = {
  name: types.stringAnalyzed,
  title: types.stringAnalyzed,
  email: types.stringNotAnalyzed,
  avatar: types.stringNotAnalyzed,
  linkedIn: types.stringNotAnalyzed,
  facebook: types.stringNotAnalyzed,
  twitter: types.stringNotAnalyzed,
  website: types.stringNotAnalyzed,
  other: types.stringNotAnalyzed
};

const investmentMapping = {
  date: types.stringNotAnalyzed,
  investedIn: types.stringNotAnalyzed,
  round: types.stringNotAnalyzed,
  type: types.stringNotAnalyzed,
  partners: types.stringNotAnalyzed
};

const investorMapping = {
  name: types.stringAnalyzed,
  investedIn: types.stringAnalyzed,
  round: types.stringNotAnalyzed,
  type: types.stringNotAnalyzed,
  partners: types.stringNotAnalyzed
};

const newsMapping = {
  source: types.stringNotAnalyzed,
  date: types.stringNotAnalyzed,
  title: types.stringAnalyzed,
  url: types.stringNotAnalyzed
};

const acquisitionMapping = {
  name: types.stringAnalyzed,
  date: types.stringNotAnalyzed,
  amount: types.doubleSearchable,
  source: types.stringAnalyzed
};

const fundingMapping = {
  date: types.stringNotAnalyzed,
  amount: types.doubleSearchable,
  source: types.stringNotAnalyzed,
  round: types.stringNotAnalyzed,
  leadInvestors: types.stringNotAnalyzed,
  valuation: types.doubleSearchable,
  investorsNumber: types.longSearchable,
  investors: types.stringNotAnalyzed
};

const editsMapping = {
  companyName: types.stringAnalyzed,
  status: types.stringNotAnalyzed,
  description: types.stringAnalyzed,
  numberOfEmployees: types.longSearchable,
  dateFounded: types.stringNotAnalyzed,
  foundersNames: types.stringAnalyzed,
  categories: types.stringNotAnalyzed,
  keyPeople: {type: 'nested', properties: keyPeopleMapping},
  source: types.stringNotAnalyzed,
  websiteLink: types.stringNotAnalyzed,
  linkedInURL: types.stringNotAnalyzed,
  twitterURL: types.stringNotAnalyzed,
  facebookURL: types.stringNotAnalyzed,
  funding: {type: 'nested', properties: fundingMapping},
  fundingAmount: types.doubleSearchable,
  fundingRounds: types.longSearchable,
  lastFundingDate: types.stringNotAnalyzed,
  revenue: types.doubleSearchable
};

//TODO(irtazabbas): Discuss and change types of fields that can be changed to
//integers, floats and dates from strings.
const companyMapping = {
  companyName: types.stringAnalyzed,
  foundersNames: types.stringAnalyzed,
  status: types.stringNotAnalyzed,

  cityHeadQuartersIn: types.stringAnalyzed,
  headquartersAddress: types.stringAnalyzed,
  otherLocations: types.stringAnalyzed,

  numberOfEmployees: types.longSearchable,
  minNumberOfEmployees: types.longSearchable,
  maxNumberOfEmployees: types.longSearchable,

  dateFounded: types.stringAnalyzed,
  categories: types.stringNotAnalyzed,
  description: types.stringAnalyzed,

  fundingAmount: types.doubleSearchable,
  fundingRounds: types.longSearchable,
  lastFundingDate: types.stringNotAnalyzed,
  revenue: types.doubleSearchable,

  acquisitionsNumber: types.intSearchable,
  linkedInURL: types.stringNotAnalyzed,
  twitterURL: types.stringNotAnalyzed,
  twitterFollowers: types.longSearchable,
  facebookURL: types.stringNotAnalyzed,
  facebookLikes: types.longSearchable,
  youtubeURL: types.stringNotAnalyzed,
  instagramURL: types.stringNotAnalyzed,
  instagramFollowers: types.longSearchable,
  angelURL: types.stringNotAnalyzed,
  crunchBaseURL: types.stringNotAnalyzed,
  craftURL: types.stringNotAnalyzed,
  owlerURL: types.stringNotAnalyzed,

  logo : types.stringNotAnalyzed,
  email: types.stringNotAnalyzed,
  phone: types.stringNotAnalyzed,
  source: types.stringNotAnalyzed,
  websiteLink: types.stringNotAnalyzed,

  news: {type: 'nested', properties: newsMapping},
  edits: {type: 'nested', properties: editsMapping},
  funding: {type: 'nested', properties: fundingMapping},
  investors: {type: 'nested', properties: investorMapping},
  keyPeople: {type: 'nested', properties: keyPeopleMapping},
  acquisitions: {type: 'nested', properties: acquisitionMapping},
  investments: {type: 'nested', properties: investmentMapping}
};

module.exports = companyMapping;
