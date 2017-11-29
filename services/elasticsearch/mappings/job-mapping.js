'use strict';

var types = require('./field-types');

const jobMapping = {
  title: types.stringAnalyzed,
  jobLink: types.stringAnalyzed,
  description: types.stringAnalyzed,
  company: types.stringAnalyzed,
  companyLink: types.stringNotAnalyzed,
  companyId: types.stringNotAnalyzed,
  location: types.stringAnalyzed,
  city: types.stringAnalyzed,
  date: types.stringNotAnalyzed,
  wage: types.stringNotAnalyzed,
  source: types.stringNotAnalyzed,
  category: types.stringNotAnalyzed,
  reviewsNumber: types.intSearchable
};

module.exports = jobMapping;
