/**
 * @fileoverview urls scraper.
 */
'use strict';
const cheerio = require('cheerio');
const constants = require('../../../../../constants');
const _ = require('underscore');
const Promise = require('bluebird');
var Nightmare = require('nightmare');

/** Class CraftURLsScraper. */
class CraftURLsScraper {
  /**
   * Create a craft url scraper
   */
  constructor() {
    this.baseURL = constants.CRAFT_BASE_URL;
    this.queryURL = constants.CRAFT_QUERY_URL;

    this.companies = [];
    this.filtredCompanies = [];
    this.pageNumber = 0;
    this.retryTimer = null;
  }

  /**
   * sets all the params before scraping Craft main page for URLs, returns a Promise with urls Array
   * @param companies
   * @param category
   * @param urlsNumber
   */
  getURLs(companies, category, urlsNumber) {
    this.companies = companies;
    this.filtredCompanies = _.filter(companies, comp => comp.source === 'craft');
    console.log(this.filtredCompanies.length+' companies from craft');
    this.urlsNumber = urlsNumber || 100;
    let estimatedResultsPerPage = 15;

    //setting the query URL depending on the chosen category
    let paramsURL = '';
    if (!category) {
      category = '';
      estimatedResultsPerPage = 8;
      console.log('scraping all companies');
    } else {
      //make sure category belongs to one of the industries in craft.co
      paramsURL = '/industry/'+category;
      console.log('scraping '+category+' companies');
    }

    if (paramsURL !== '') {
      this.filtredCompanies = _.filter(this.filtredCompanies, comp => {
        let catFound = _.find(comp.categories, (cat) => {
          if (cat.toLowerCase() === category) return true;
        });
        return (catFound && catFound.length > 0);
      });
      console.log(this.filtredCompanies.length+' '+category+' companies from craft in db');
    }

    //setting the page we'll start scraping on, basing on companies array.
    if (this.pageNumber === 0) {
      this.pageNumber = parseInt(this.filtredCompanies.length/estimatedResultsPerPage);
    }

    console.log('starting at page :'+this.pageNumber+' - 15 result per page');

    return new Promise((resolve) => {
      let urlsToReturn = [];

      this._scrapeForUrls(paramsURL, urlsToReturn, () => {
        console.log(urlsToReturn.length+' url returned from request');
        resolve(urlsToReturn);
      });

    });


  }

  /**
   * Making the call to the API to get list of URLS
   * @param paramsURL
   * @param URLs
   * @param callback
   * @private
   */
  _scrapeForUrls(paramsURL, URLs, callback) {
    if (!URLs) URLs = [];
    var nightmare = Nightmare({show:true});
    nightmare
      .goto(this.queryURL+paramsURL+'?page='+this.pageNumber+'&view=table&section=companies')
      .wait(5000)
      .evaluate(() => {
        return document.querySelector('table.table-hover').outerHTML;
      })
      .end()
      .then((data) => {
        try {
          let $ = cheerio.load(data);
          let rows = $('tbody').find('tr');

          if (rows.length === 0) {
            console.log('done with scraping pages in '+paramsURL);
            callback();
          } else {
            this.pageNumber++;
            _.each(rows, (row) => {
              let name = $($(row).find('td')[0]).text().trim();
              let url = $($(row).find('td')[0]).find('a').attr('href');
              if (url[0] === '/') url = url.slice(1);
              url = this.baseURL + url;
              if (!_.findWhere(URLs, {url: url}) &&
                !_.findWhere(this.companies, {companyName: name}) &&
                !_.findWhere(this.companies, {craftURL: url})) {
                URLs.push({
                  companyName: name,
                  url: url,
                  craftLogo: $($(row).find('td')[0]).find('img').attr('src'),
                  description: $($(row).find('td')[1]).text().trim(),
                  cityHeadQuartersIn: $($(row).find('td')[2]).text().trim(),
                  numberOfEmployees: $($(row).find('td')[3]).text().trim()
                });
              }
            });
            console.log(URLs.length+' companies URL returned after scraping page:'+this.pageNumber);

            if (URLs.length < this.urlsNumber) {
              this._scrapeForUrls(paramsURL, URLs, () => callback());
            } else {
              callback();
            }
          }

        }
        catch (err) {
          console.log('error occurred getting urls: '+err);
        }
      })
      .catch((error) => {
        if (error.toLowerCase && error.toLowerCase().indexOf('outerhtml')) {
          console.log('done with scraping pages in '+paramsURL);
          callback();
        } else {
          console.log('nightmare: getting urls failed:', error);
          console.log('retrying..');
          clearTimeout(this.retryTimer);
          this.retryTimer = setTimeout(()=> {
            this._scrapeForUrls(paramsURL, URLs, () => callback());
          }, 5000);
        }
      });
  }
}

module.exports = new CraftURLsScraper;
