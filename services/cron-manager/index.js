'use strict';
const IndeedScraper = require('../scrape-manager/scrapers/indeed-scraper');
const JobModel = require('../../resources/job/job-resource');
const CronJob = require('cron').CronJob;
const constants = require('../../constants');
const CrunchbasePageScraper = require('../scrape-manager/scrapers/companies/crunchbase/pages-scraper');
const CraftPageScraper = require('../scrape-manager/scrapers/companies/craft/pages-scraper');


class CronManager {
  /**
   * Setup cron manager
   */
  static setup() {
    new CronJob('00 05 13 1 4 *', function () {
      let terms = constants.INDEED_DEFAULT_TERMS;
      IndeedScraper.scrape(terms, constants.DEFAULT_SCRAPE_LIMIT, JobModel, function (jobsData) {
        console.log('Cron::Updated jobs data::' + jobsData.length);
      });
    }, null, true, constants.DEFAULT_CRON_TIMEZONE);

    /*new CronJob('00 05 12 1 * *', function () {
      CrunchbasePageScraper.startScrapeService('', 1000, function (data) {
        console.log('Cron::adding companies from crunchbase ::' + data);
      });
    }, null, true, constants.DEFAULT_CRON_TIMEZONE);

    new CronJob('00 35 12 1 * *', function () {
      CraftPageScraper.startScrapeService('', 1000, function (data) {
        console.log('Cron::adding companies from craft ::' + data);
      });
    }, null, true, constants.DEFAULT_CRON_TIMEZONE);*/
  }
}

/**
 *
 */
module.exports = CronManager;
