'use strict';

var isDevelopment = process.env.APP_ENV === 'development';

/**
 * Elastic search config variables.
 */
const CONFIG = {
  get HOST() {
    return isDevelopment ? 'http://localhost:9200' :
      'http://104.198.230.49:9200';
  },
  INDEX: 'staffing_v1',
  LOG: 'trace'
};

/**
 * Elastic types and related info
 */
const TYPES = {
  company: {
    type: 'company',
    collectionName: 'companies',
    aggregateOn: [
      {name: 'categories', mappedOn: 'markets'}
    ],
    queryOn: {
      markets: 'categories',
      funding: 'fundingAmount',
      size: 'numberOfEmployees'
    }
  },
  job: {
    type: 'job',
    collectionName: 'jobs',
    aggregateOn: []
  }
};

module.exports.TIMEOUT = 5000;

module.exports.SIZE = 10;

module.exports.CONFIG = CONFIG;

module.exports.TYPES = TYPES;
