'use strict';

module.exports.stringAnalyzed = {
  type: 'string'
};

module.exports.stringNotAnalyzed = {
  type: 'string',
  index: 'not_analyzed'
};

module.exports.intSearchable = {
  type: 'integer'
};

module.exports.doubleSearchable = {
  type: 'double'
};

module.exports.longSearchable = {
  type: 'long'
};

module.exports.dateAnalyzed = {
  type: 'date'
};
