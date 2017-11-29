'use strict';

const companyMapping = require('./company-mapping');
const jobMapping = require('./job-mapping');

const mappings = {
  company: {
    properties: companyMapping
  },
  job: {
    properties: jobMapping
  }
};

module.exports = mappings;
