/**
 * @fileoverview pages scraper.
 */
'use strict';
const cheerio = require('cheerio');
const constants = require('../../../../../constants');
const BaseScraper = require('../../base-scraper');
const _ = require('underscore');
const IndeedURLsScraper = require('./urls-scraper');
const jobsModel = require('../../../../../resources/job/job-resource');
const utils = require('../../../../../utils');
const esJob = require('../../../../elasticsearch')({
  type: constants.ELASTIC_TYPES.JOB
});

/** Class IndeedPageScraper. */
class IndeedPageScraper extends BaseScraper{
  /**
   * Create Indeed scraper
   */
  constructor() {
    super();
    this.baseURL = constants.INDEED_BASE_URL;
    this.urlsService = IndeedURLsScraper;
    this.scrapersName = 'Indeed Scraper';
    this.useProxiesStream = false;
    this.useProxies = false;
    this.useElastic = true;
    this.proxiesSources = [constants.PROXY_SOURCE.all];
    this.urlsPerBulk = 10;
    this.mainHtmlElement = 'body';
    this.itemsModel = jobsModel;
    this.elasticModel = esJob;
  }

  /**
   * get company data from html
   * @param jobData
   * @returns {*}
   */
  parseHTMLForItemData(jobData) {
    let job = {
      title: '',
      jobLink: jobData.url,
      description: '',
      company: '',
      companyLink: '',
      companyId: '',
      location: '',
      city: jobData.city,
      date: '',
      wage: '',
      source: 'indeed',
      category: jobData.category,
      reviewsNumber: undefined
    };

    if(jobData.html) {
      let $ = cheerio.load(jobData.html);

      //name
      job.title = $($('a')[0]).attr('title').replace(jobData.city, '').trim();
      job.company = $('.company').text().trim();

      job.companyLink = $('.company a').attr('href');
      if (job.companyLink && job.companyLink.indexOf('http') === -1) job.companyLink = this.baseURL+job.companyLink;

      let reviewsNumber = $('.ratings').next().text().trim();
      if (reviewsNumber && reviewsNumber.indexOf('review') !== -1) {
        job.reviewsNumber = utils.stringToNumber(reviewsNumber.substring(0, reviewsNumber.indexOf('review')).trim());
      }

      job.location = $('.location').text().trim();
      job.description = $('.summary').text().trim();
      job.wage = $('td.snip nobr').text().trim();

      let date = utils.timeAgoToDate($('.date').text().trim());
      if (date) job.date = date;

      return job;

    } else {
      console.log('couldn\'t find data');
      return false;
    }
  }

}

module.exports = new IndeedPageScraper;
