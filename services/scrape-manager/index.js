'use strict';
const deepFreeze = require('deep-freeze-strict');
const IndeedScraper = require('./scrapers/indeed-scraper');
const AngelScraper = require('./scrapers/angel-scraper');
const CrunchbasePageScraper = require('./scrapers/companies/crunchbase/pages-scraper');
const CraftPageScraper = require('./scrapers/companies/craft/pages-scraper');
const OwlerPageScraper = require('./scrapers/companies/owler/pages-scraper');
const YelpPageScraper = require('./scrapers/businesses/yelp/pages-scraper');
const IndeedPageScraper = require('./scrapers/jobs/indeed/pages-scraper');

const SCRAPE_TYPES = deepFreeze({
    INDEED : 0,
    ANGEL: 1,
    CRUNCHBASE: 2
  });


class ScrapeManager {
  /**
   * Scrape companies entry point
   * @param {string} category - companies category/market we want to scrape
   * @param {string} source - specifies the source, right now only 'crunchBase' and 'craft' available
   * @param {integer} limit - limit for scraping
   * @param {update} true to update from owler
   * @param {Function} cb - callback when scrap completed
   */
  static scrapeCompanies(category, source, limit, update, cb) {
    if (!source) source = '';
    if (update) {
      OwlerPageScraper.updateCompaniesFromOwler();
    } else {
      switch (source.toLowerCase()) {
        case 'crunchbase':
          CrunchbasePageScraper.startScrapeService(category, limit, cb);
          break;
        case 'craft':
          CraftPageScraper.startScrapeService(category, limit, cb);
          break;
        case 'owler':
          OwlerPageScraper.startScrapeService(category, limit, cb);
          break;
        default:
          CrunchbasePageScraper.startScrapeService(category, limit, cb);
      }
    }
  }

  static scrapeBusinesses(city, category, source, limit, update, cb) {
    if (!source) source = '';
    if (update) {
      YelpPageScraper.updateBusinessPartOfChain(cb);
    } else {
      switch (source.toLowerCase()) {
        default:
          YelpPageScraper.startScrapeService({city:city, category:category}, limit, cb);
      }
    }
  }

  static scrapeJobs(city, category, source, limit, cb) {
    if (!source) source = '';
   
    switch (source.toLowerCase()) {
      default:
        IndeedPageScraper.startScrapeService({city:city, category:category}, limit, cb);
    }
  }

  /**
   * Perform scraping (fallback for older cron jobs)
   * @param {string} type - sets the scraping type
   * @param {string} terms - all term which will be used for scraping
   * @param {integer} limit - limit for scraping
   * @param {Object} models - all available models
   * @param {Function} cb - callback when scrap completed
   */
  static scrape(type, terms, limit, models, cb) {
    switch (parseInt(type)) {
      case SCRAPE_TYPES.INDEED:
        IndeedScraper.scrape(terms, limit, models, cb);
        break;
      case SCRAPE_TYPES.ANGEL:
        AngelScraper.scrape(terms, limit, models, cb);
        break;
      default:
        console.log('ScrapeManager: No such scraper type::'+type);
        cb();
    }
  }
}


module.exports = ScrapeManager;
