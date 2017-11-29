'use strict';

var Promise = require('bluebird');
var _ = require('lodash');
const defaults = require('../defaults');
var operators = require('./operators');

var type;

function QueryGenerator() {}

QueryGenerator.prototype.get = function(elasticType, params) {

  params.page = params.page > 0 ? parseInt(params.page) : 1;
  params.size = params.size > 0 ? parseInt(params.size) : defaults.SIZE;

  let searchQuery = {
    from: (params.page-1)*params.size,
    size: params.size,    
    query: {
      bool: {
        filter: []
      }
    }
  };

  if (Array.isArray(params.sort)) searchQuery.sort = params.sort;

  type = defaults.TYPES[elasticType];
  return new Promise((resolve, reject) => {
    params.query = params.query || params.q;
    if (params.query) {
      _.forIn(params.query, (value, key) => {
        let operator = extractOperator(key, value);
        if (operator) {
          searchQuery.query.bool.filter = searchQuery.query.bool.filter.concat(
            Array.isArray(operator) ? operator: [operator]
          );
        }
      });
    }
    resolve(searchQuery);
  });
};

function extractOperator(key, value) {
  if (!key || !value) return;
  let clause;

  let operator = operators.supported.find(op => key.indexOf(op.identifier) !== -1);

  if (operator) {
    key = key.replace(operator.identifier, '');
    clause = operator.clause(type.queryOn[key], value);
  } else {
    clause = operators.default.clause(type.queryOn[key], value);
  }

  if (type.queryOn[key]) return clause;
}

module.exports = new QueryGenerator();
