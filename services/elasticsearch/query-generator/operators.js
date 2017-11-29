'use strict';

module.exports.supported = [
  {
    identifier: '>',
    clause: (key, value) => {
      let range = {};
      range[key] = {
        gte: value
      };
      return {range};
    }
  },
  {
    identifier: '<',
    clause: (key, value) => {
      let range = {};
      range[key] = {
        lte: value
      };
      return {range};
    }
  },
  // Operator for range.
  {
    identifier: '~',
    clause: (key, values) => {
      console.log('KEY: ', key);
      let range = {};
      values = values.split(',');
      if (values.length === 2) {
        range[key] = {
          gte: values[0],
          lte: values[1]
        };
      }
      return {range};
    }
  }
];

module.exports.default = {
  identifier: '',
  clause: (key, value) => {
    value = Array.isArray(value) ? value : [value];
    return value.map(val => ({term: {[key]: val}}));
  }
};
