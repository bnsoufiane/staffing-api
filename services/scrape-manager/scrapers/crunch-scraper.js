/**
 * @fileoverview Crunch scraper.
 */
'use strict';
const moment = require('moment');
const async = require("async");
const scrap = require('scrap');
const constants = require('../../../constants');
const BaseScraper = require('./base-scraper.js');
const companyModel = require('../../../resources/company/company-resource');

/** Class CrunchScraper. */
class CrunchScraper extends BaseScraper {
  /**
   * Create a crunch scrap
   */
  constructor() {
    super();
    this.baseURL = constants.CRUNCHBOARD_BASE_URL;
    this.queryURL = constants.CRUNCHBOARD_QUERY_URL;
  }
  /**
   * Scrap result callback
   * @param {Object} err - if any error occur while scraping
   * @param {Object} $ - jQuery object
   */
  scrapResultCB(models, cb, err, $) {
    let results = $('.row.result');
    let jobs = [];
    this.insertedCompanies = [];

    async.eachSeries(results,
        this.rowParser.bind(this, $, models),
        function (err) {
          if (err) {
            throw err;
          }

          if (cb) {
            cb(this.insertedCompanies);
          }
        }.bind(this)
    );
  }
  /**
   * Each row parser
   * @param {Object} $ - jQuery object
   * @param {Object} element - dom element
   * @param {Callback} cb - callback when scrap completed
   */
  rowParser($, models, element, callback) {
    let myRegExp = /^(\d+)\+?\s(\w+)\sago$/; //regex to extract reverse moment .fromNow format to moment format
    let job = {};
    let companyName;
    let regexResult;
    let num;
    let duration;
    let date;
    let jobLink;
    let companyLink;

    //company details fetching logic will go here

    companyModel.createOne(job).then(function(insertedCompany) {
      insertedCompany && this.insertedCompanies.push(insertedCompany);
      callback();
    }.bind(this)).catch(function() {
      callback();
    });

  }
};

module.exports = new CrunchScraper;
