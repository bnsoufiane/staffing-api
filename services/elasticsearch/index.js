'use strict';

var ElasticService = require('./elastic-service');
const defaults = require('./defaults');
var queryGenerator = require('./query-generator');

/**
 * Elastic Search Service Class.
 * This is class will be instantiated and configured to be used with different
 * resources.
 */
class ElasticSearchService extends ElasticService {
  configure(options) {
    if (!options || !options.type) throw new Error('Missing options');
    this.type = options.type;
  }

  /**
   * Wraps single insert method.
   */
  insert(body) {
    return super.insert(body);
  }

  /**
   * Wraps bulk insert.
   */
  bulkInsert(docs) {
    let action = {index: {_index: this.index, _type: this.type}},
        bulkOps = [];

    if(!docs || !docs.length) this._reject('null/empty docs array');

    //Creating bulk operations array
    //for details https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-bulk
    docs.forEach(doc => {
      bulkOps.push(action);
      bulkOps.push(doc);
    });

    return super.bulkInsert(bulkOps);
  }

  /**
   * Does the type specific search.
   */
  search(params, getAggs) {
    if (!params) {
      return this._reject('Missing attributes');
    }

    getAggs = getAggs === undefined ? true : getAggs;

    params.page = params.page > 0 ? parseInt(params.page) : 1;
    params.size = params.size > 0 ? parseInt(params.size) : defaults.SIZE;

    return queryGenerator.get(this.type, params)
    .then(searchQuery => {
      console.log('QUERY: ', JSON.stringify(searchQuery));
      return super.search(searchQuery)
      .then(response => {
        let docs = [];
        let result = {};

        response.hits.hits.forEach(hit => {
          docs.push(Object.assign(hit._source || hit.fields, {_id: hit._id}));
        });

        result.total = response.hits.total;
        result[defaults.TYPES[this.type].collectionName] = docs;

        if (getAggs) {
          return this.getAggs()
          .then(aggs => {
            result.aggregations = aggs;
            return result;
          })
          .catch(err => this._error(err));
        }

        return result;
      })
      .catch(err => this._error(err));
    });
  }

  /**
   * get list of companies by an array of ids
   * @param ids
   * @returns {*}
   */
  getByIds(ids) {
    ids = Array.isArray(ids) ? ids : [];
    let params = {"filter":{ "query": {"ids":{ "values": ids } } } };

    return super.search(params)
    .then(response => {
      let docs = [];
      let result = {};

      response.hits.hits.forEach(hit => {
        docs.push(Object.assign(hit._source || hit.fields, {_id: hit._id}));
      });

      return docs;
    })
    .catch(err => this._error(err));
  }

  /**
   * Gets a document by id.
   */
  get(id) {
    if (!id) {
      return this._reject('Missing attributes');
    }

    return super.get(id)
    .then(result => (result.found &&
      Object.assign(result._source, {_id: result._id}) ||
      this._reject('Not found')));
  }

  /**
   * Updates a document partially.
   */
  update(id, doc) {
    if (!id || !doc) {
      return this._reject('Missing attributes');
    }

    return super.update(id, doc)
    .then(result => result.get.found && result.get._source);
  }

  /**
   * Prepares type specific aggregation query.
   */
  getAggs() {
    let aggs = {};
    defaults.TYPES[this.type].aggregateOn.forEach(field => {
      aggs[field.name] = {
        terms: {
          field: field.name,
          //Makes sure that the number of aggregations returned is unlimited.
          size: 0
        }
      }
    });

    return super.getAggs(aggs)
    .then(response => {
      let aggregations = {};
      defaults.TYPES[this.type].aggregateOn.forEach(field => {
        aggregations[field.mappedOn] = response.aggregations[field.name].buckets || [];
      });
      return aggregations;
    });

  }
}

module.exports = function(options) {
  return new ElasticSearchService(options);
};
