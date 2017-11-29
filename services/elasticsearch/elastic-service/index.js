'use strict';

var elasticsearch = require('elasticsearch');
var chalk = require('chalk');

const defaults = require('../defaults');
const mappings = require('../mappings');

/**
 * Elastic Service Class.
 * Provides basic methods to communicate with elastic server.
 */
class ElasticService {
  constructor(options) {
    this.host = defaults.CONFIG.HOST;
    this.index = defaults.CONFIG.INDEX;

    this.client = new elasticsearch.Client({
      host: this.host
    });

    this.configure(options);
  }

  /**
   * Pings the Elastic server, and checks if the current index exists.
   */
  init() {
    return this.client.ping({
      requestTimeout: defaults.TIMEOUT
    })
    .then(res => {
      console.log(chalk.green('ES listening at ') + this.host);
      return this.client.indices.exists({index: this.index})
      .then(isUp => {
        if (isUp) {
          console.log(chalk.green(`Index found "${this.index}"`));
        } else {
          this._error(`Index not found "${this.index}"`);
          return this.createIndex();
        }
      })
      .catch(err => this._error(`Error looking for index "${this.index}"`))
    })
    .catch(err => this._error('ES did not respond: ', err));
  }

  /**
   * Creates the current index with the defined mappings.
   */
  createIndex() {
    return new Promise((resolve, reject) => {
      console.log(chalk.yellow(`Creating index "${this.index}"`));
      this.client.indices.create({
        index: this.index,
        body: {mappings}
      })
      .then(resp => {
        console.log(chalk.green(`Index created "${this.index}""`));
        //Waiting for the newly created elastic index to become available.
        setTimeout(resolve, 2000);
      })
      .catch(err => {
        this._error('Error creating index: ', err);
        reject();
      });
    })
  }

  /**
   * Inserts a single document in to elastic based on the type.
   */
  insert(body) {
    return this.client.index({
      index: this.index,
      type: this.type,
      body: body
    })
    .catch(err => this._error(err));
  }

  /**
   * Inserts docs in bulk.
   */
  bulkInsert(bulkOps) {
    return this.client.bulk({
      body: bulkOps
    })
    .then(response => response)
    .catch(err => this._error(err));
  }

  /**
   * Searches with given query.
   */
  search(params) {
    return this.client.search({
      index: this.index,
      type: this.type,
      body: params
    });
  }


  /**
   * get all results using a scroll
   */
  getAll() {
    return new Promise((resolve) => {
      let allResults = [];

      this.client.search({
        index: this.index,
        type: this.type,
        scroll: '30s'
      }, function getMoreUntilDone(error, response) {
        response.hits.hits.forEach(hit => {
          allResults.push(hit);
        });

        if (response.hits.total !== allResults.length) {
          this.client.scroll({
            scrollId: response._scroll_id,
            scroll: '30s'
          }, getMoreUntilDone.bind(this));
        } else {
          resolve(allResults);
        }
      }.bind(this));

    });

  }

  /**
   * Gets by id.
   */
  get(id) {
    return this.client.get({
      index: this.index,
      type: this.type,
      id: id
    });
  }

  /**
   * Updates a document partially.
   */
  update(id, doc) {
    return this.client.update({
      index: this.index,
      type: this.type,
      fields: '_source',
      id: id,
      body: {doc}
    });
  }

  /**
   * Queries elastic for aggregations.
   */
  getAggs(aggs) {
    return this.client.search({
      index: this.index,
      type: this.type,
      body: {
        //The size = 0, excludes hits from being returned in aggregation query.
        size: 0,
        aggs: aggs
      }
    });
  }

  /**
   * Counts documents of the current type.
   */
  count() {
    return this.client.count({
      index: this.index,
      type: this.type
    })
    .then(response => response)
    .catch(err => this._error(err));
  }

  /**
   * Logs errors on console.
   */
  _error() {
    Array.from(arguments).forEach(err => {
      if (Array.isArray(err)) {
        err.forEach(e => console.log(chalk.red.bold('Elastic ERROR: '), e))
      } else {
        console.log(chalk.red.bold('Elastic ERROR: '), err);
      }
    });
  }

  /**
   * Returns a rejected promise with error or calls a callback with error.
   */
  _reject() {
    let params = Array.from(arguments),
      len = params.length,
      last;

    if (len) {
      last = params[len-1];
      if (typeof last === 'function') {
        last = params.pop();
        this._error(params);
        return last(params);
      } else {
        this._error(params);
        return Promise.reject(params);
      }
    } else {
      return Promise.reject();
    }
  }
}

module.exports = ElasticService;
