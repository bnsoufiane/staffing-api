/**
 * @fileoverview urls scraper.
 */
'use strict';
const cheerio = require('cheerio');
const constants = require('../../../../../constants');
const request = require('request-promise');
const _ = require('underscore');
const Promise = require('bluebird');

/** Class CrunchbaseURLsScraper. */
class CrunchbaseURLsScraper {
  /**
   * Create a crunch url scraper
   */
  constructor() {
    this.baseURL = constants.CRUNCHBASE_BASE_URL;
    this.queryURL = constants.CRUNCHBASE_API_URL;
    this.apiKey = constants.CRUNCHBASE_API_KEY;
    this.appID = constants.CRUNCHBASE_APP_ID;

    this.companies = [];
    this.filtredCompanies = [];
    this.pageNumber = 0;
    this.retryTimer = null;
    this.urlsPool = [];
  }

  /**
   * sets all the params before calling the API, returns a Promise containing the URLs
   * @param companies
   * @param category
   * @param urlsNumber
   */
  getURLs(companies, category, urlsNumber) {
    this.urlsPool = [];
    this.companies = companies;
    this.filtredCompanies = _.filter(companies, comp => comp.source === 'crunchBase');
    this.urlsNumber = urlsNumber || 100;

    //setting the query URL depending on the chosen category
    let paramsURL = '';
    let categoryFullName = '';
    if (!category) category = '';
    switch(category.toLowerCase()) {
      case 'it1':
        paramsURL = '%2Cmarkets%3Ab8f58a18453350fb93a9b4f5579318c1';
        categoryFullName = 'it management';
        console.log('scraping IT Management companies');
        break;
      case 'it2':
        paramsURL = '%2Cmarkets%3A2a6133d96f680778b10626703abacfce';
        categoryFullName = 'it and cybersecurity';
        console.log('scraping IT and CyberSecurity companies');
        break;
      case 'retail':
        paramsURL = '%2Cmarkets%3Ab65acba5b299399063908be3e3833a07';
        categoryFullName = 'retail';
        console.log('scraping retail companies');
        break;
      case 'consulting':
        paramsURL = '%2Cmarkets%3Ab9bd65b920bf45cc207db70ac35d5bf4';
        categoryFullName = 'consulting';
        console.log('scraping consulting companies');
        break;
      case 'construction':
        paramsURL = '%2Cmarkets%3Ae4d83fbb33f0a6f01399a68245e8f8ac';
        categoryFullName = 'construction';
        console.log('scraping construction companies');
        break;
      case 'drones':
        paramsURL = '%2Cmarkets%3A1fec33a7163f88a97e5c8967fee59a1e';
        categoryFullName = 'drones';
        console.log('scraping Drones companies');
        break;
      case 'bigdata':
        paramsURL = '%2Cmarkets%3Ac33728a5de33d0da7bce0e3c4383bc99';
        categoryFullName = 'big data';
        console.log('scraping Big Data companies');
        break;
      case 'advertising':
        paramsURL = '%2Cmarkets%3A6cb685372de1b0412ee5451ff81bccab';
        categoryFullName = 'advertising';
        console.log('scraping advertising companies');
        break;
      case 'broadcasting':
        paramsURL = '%2Cmarkets%3A048fa3b0ae537c4ec5b71ae93b6dc303';
        categoryFullName = 'broadcasting';
        console.log('scraping broadcasting companies');
        break;
      default:
        paramsURL = '';
        console.log('scraping all companies');
    }

    if (paramsURL !== '') {
      this.filtredCompanies = _.filter(this.filtredCompanies, comp => {
        let catFound = _.find(comp.categories, (cat) => {
          if (cat.toLowerCase() === categoryFullName) return true;
        });
        return (catFound && catFound.length > 0);
      });
      console.log(this.filtredCompanies.length+' '+category+' companies from crunchbase in db');
    }

    //setting the page we'll start scraping on, basing on companies array.
    if (this.pageNumber === 0) {
      this.pageNumber = parseInt(this.filtredCompanies.length/100) + 20;
    }

    console.log('starting at page :'+this.pageNumber+' - 100 results per page');

    return new Promise((resolve) => {
      this._requestAPI(paramsURL, () => {
        console.log(this.urlsPool.length+' url returned');
        resolve(this.urlsPool);
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
  _requestAPI(paramsURL, callback) {
    console.log('init _requestAPI');
    let options = {
      method: 'POST',
      uri: this.queryURL,
      body: {
        params: 'query=&facets=*&distinct=true&page='+this.pageNumber+'&hitsPerPage=100&facetFilters=type%3AOrganization'+paramsURL,
        apiKey: this.apiKey,
        appID: this.appID
      },
      json: true
    };

    request(options)
      .then((response) => {
        console.log(response.nbHits + ' companies exist in this query');
        let NumberUrlsLeftToScrape = response.nbHits - this.filtredCompanies.length;
        console.log(NumberUrlsLeftToScrape + ' companies not scraped yet');

        if (response.nbHits - this.filtredCompanies.length < 1) {
          console.log('no companies left to scrape, please change criteria');
          callback();
        } else {
          if (response.hits && response.hits.length > 0) {
            this.pageNumber++;
            response.hits.forEach(comp => {
              let url = (comp.url[0] === '/') ? comp.url.slice(1) : comp.url;
              url = this.baseURL + url;
              if (!_.findWhere(this.companies, {companyName:comp.name}) &&
                  !_.findWhere(this.companies, {crunchBaseURL:url}) &&
                  !_.findWhere(this.companies, {websiteLink:comp.homepage_url})) {
                this.urlsPool.push({name:comp.name, url:url});
              }
            });
            this.urlsPool = _.uniq(this.urlsPool, 'name');

            let max = (NumberUrlsLeftToScrape < this.urlsNumber) ? NumberUrlsLeftToScrape : this.urlsNumber;

            console.log('urls returned: '+this.urlsPool.length+' after getting page: '+this.pageNumber);

            if (this.urlsPool.length < max) {
              this._requestAPI(paramsURL, () => callback());
            } else {
              callback();
            }
          } else {
            this.pageNumber = (this.pageNumber > response.nbPages) ? 0 : ++this.pageNumber;
            console.log('response didn\'t return any hits');
            this._requestAPI(paramsURL, () => callback());
          }
        }
      })
      .catch((err) => {
        console.log('ERROR getting list of companies from CB API.. retrying');
        console.log(err);
        clearTimeout(this.retryTimer);
        this.retryTimer = setTimeout(() => {
          this._requestAPI(paramsURL, () => callback());
        }, 30000);
      });
  }

}

module.exports = new CrunchbaseURLsScraper;
