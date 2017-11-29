/**
 * @fileoverview Indeed scraper.
 */
'use strict';
const moment = require('moment');
const async = require("async");
const scrap = require('scrap');
const constants = require('../../../constants');
const BaseScraper = require('./base-scraper.js');
const jobModel = require('../../../resources/job/job-resource');

/** Class IndeedScrap. */
class IndeedScraper extends BaseScraper {
  /**
   * Create a indeed scrap
   */
  constructor() {
    super();
    this.baseURL = constants.INDEED_BASE_URL;
    this.queryURL = constants.INDEED_QUERY_URL;
  }
  /**
   * Scrap result callback
   * @param {Object} err - if any error occur while scraping
   * @param {Object} $ - jQuery object
   */
  scrapResultCB(models, cb, err, $) {
    let results = $('.row.result');
    let jobs = [];
    this.insertedJobs = [];

    async.eachSeries(results,
        this.rowParser.bind(this, $, models),
        function (err) {
          if (err) {
            throw err;
          }

          if (cb) {
            cb(this.insertedJobs);
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

    job['title'] = $(element).find('h2 > a').text();
    jobLink = $(element).find('h2 > a').attr('href');
    job['jobLink'] = jobLink ? this.baseURL + jobLink : '';
    companyLink = $(element).find('.company > span > a');
    companyName = companyLink.text().trim();
    companyLink = companyLink.attr('href');
    job['companyLink'] = companyLink ? this.baseURL + companyLink : '';
    companyName = companyName != '' ? companyName : $(element).find('.company > span').text().trim();
    job['company'] = companyName;
    job['location'] = $(element).find('span.location > span').text();
    job['description'] = $(element).find('.summary').text().trim();
    date = $(element).find('span.date').text().trim();

    //converting moment .fromNow format to date format
    regexResult = date != '' ? myRegExp.exec(date) : undefined;
    if (regexResult && regexResult.length == 3) {
      num = regexResult[1];
      duration = regexResult[2];
      job['date'] = moment().subtract(num, duration).format(constants.SERVER_DATE_FORMAT);
    }

    jobModel.createOne(job).then(function(insertedJob) {
      insertedJob && this.insertedJobs.push(insertedJob);
      callback();
    }.bind(this)).catch(function() {
      callback();
    });

  }
};

module.exports = new IndeedScraper;
