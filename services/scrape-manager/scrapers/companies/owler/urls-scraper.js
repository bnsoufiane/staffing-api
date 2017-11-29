/**
 * @fileoverview urls scraper.
 */
'use strict';
const cheerio = require('cheerio');
const constants = require('../../../../../constants');
const _ = require('underscore');
const Promise = require('bluebird');
const ProxiesManager = require('../../proxies/proxies-manager');
var Nightmare = require('nightmare');

/** Class OwlerURLsScraper. */
class OwlerURLsScraper {
  /**
   * Create a yelp url scraper
   */
  constructor() {
    this.baseURL = constants.OWLER_BASE_URL;
    this.queryURL = constants.OWLER_BASE_URL;

    this.companies = [];
    this.filtredCompanies = [];
    this.pageNumber = 1;
    this.retryTimer = null;
    this.maxPageNumber = 0;
    this.filtersArray = [];
    this.filtersIndex = 0;
    this.proxiesList = [];
    this.useProxies = false;
    this.urlsPool = [];
  }

  /**
   * sets all the params before scraping Yelp main page for URLs, returns a Promise with urls Array
   * @param companies
   * @param filter
   * @param urlsNumber
   */
  getURLs(companies, filter, urlsNumber) {
    this.urlsPool = [];
    if (this.filtersArray.length === 0) {
      let filters = [];
      if (filter && filter.indexOf(',') !== -1) {
        filters = filter.split(',');
      } else {
        if (filter && filter.length > 0) filters.push(filter);
      }
      _.each(filters, f => {
        if (f.indexOf(':') !== -1) {
          let elmts = f.split(':');
          if (elmts.length === 2) this.filtersArray.push({key:elmts[0], value:elmts[1]});
        } else {
          this.filtersArray.push({key:'category', value:f});
        }
      });
      console.log(this.filtersArray);
    }

    this.companies = companies;
    this.filtredCompanies = _.filter(this.companies, comp => comp.source === 'owler');
    console.log(this.filtredCompanies.length+' companies from owler');
    this.urlsNumber = urlsNumber || 100;
    let estimatedResultsPerPage = 15;

    //setting the query URL depending on the chosen category
    let paramsURL = '';

    if (this.filtersArray.length > 0) {
      paramsURL = this.filtersArray[this.filtersIndex].key+'/'+this.filtersArray[this.filtersIndex].value;

      this.filtredCompanies = _.filter(this.filtredCompanies, comp => {
        let catFound = _.find(comp.categories, (cat) => {
          if (cat.toLowerCase() === this.filtersArray[this.filtersIndex].value.replace('-companies', '').replace('-', ' ').toLowerCase()) {
            return true;
          }
        });
        return (catFound && catFound.length > 0);
      });

    }

    //setting the page we'll start scraping on, basing on companies array.
    if (this.pageNumber === 1) {
      this.pageNumber = parseInt(this.filtredCompanies.length/estimatedResultsPerPage) - 1;
      if (this.pageNumber < 1) this.pageNumber = 1;
      if(this.maxPageNumber === 0) this.maxPageNumber = this.pageNumber + 10;
    }
    if (this.pageNumber > this.maxPageNumber) {
      console.log('done with scraping all pages in this category');
      this.filtersIndex++;
      this.pageNumber = 1;
    }

    console.log('starting at page :'+this.pageNumber+' - 15 result per page');

    return new Promise((resolve) => {
      if (this.useProxies) {
        ProxiesManager.getProxiesFromGimmeProxy().then((proxy) => {
          console.log(proxy);
          this._scrapeForUrls(paramsURL, proxy, () => {
            console.log(this.urlsPool.length+' url returned from request');
            resolve(this.urlsPool);
          });
        }).catch(()=> {
          console.log('no proxy used to get urls from owler');
          this._scrapeForUrls(paramsURL, false, () => {
            console.log(this.urlsPool.length+' url returned from request');
            resolve(this.urlsPool);
          });
        });
      } else {
        this._scrapeForUrls(paramsURL, false, () => {
          console.log(this.urlsPool.length+' url returned from request');
          resolve(this.urlsPool);
        });
      }
    });


  }

  /**
   * Making the call to the API to get list of URLS
   * @param paramsURL
   * @param proxy
   * @param callback
   * @private
   */
  _scrapeForUrls(paramsURL, proxy, callback) {
    let url = this.queryURL+paramsURL+'?p='+this.pageNumber;
    console.log(url);

    let options = {
      show:false
    };

    if (proxy) {
      if (proxy.ip !== '') {
        options['switches'] = {
          'proxy-server': proxy.ip,
          'ignore-certificate-errors': true,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
        };
      }
    }

    let _nightmareInstance = Nightmare(options);
    _nightmareInstance
      .goto(url)
      .wait(5000)
      .evaluate(() => {
        return document.querySelector('#seo-landingPage-container').outerHTML;
      })
      .end()
      .then((data) => {
        try {
          let $ = cheerio.load(data);
          let resultsNumber = parseInt($('#text-noOfSearch-result').text().trim().replace(',', ''));
          this.maxPageNumber = Math.ceil(resultsNumber/15);

          console.log(resultsNumber+' result in this query, in '+this.maxPageNumber+' pages');

          let rows = $('.company-details');
          console.log(rows.length+' result in this page');
          this.pageNumber++;

          if (rows.length === 0) {
            console.log('done with scraping pages in '+paramsURL);
            callback();
          } else {
            _.each(rows, (row) => {
              let url = $(row).find('.text-profile-link').attr('href');
              let name = $(row).find('.text-company-name').text().trim();
              if (!_.findWhere(this.urlsPool, {url: url}) &&
                  !_.findWhere(this.companies, {owlerUrl: url}) &&
                  !_.findWhere(this.companies, {companyName: name})) {
                this.urlsPool.push({url: url, name: name});
              }
            });
            console.log(this.urlsPool.length+' companies URL returned after scraping page:'+this.pageNumber);

            if (this.urlsPool.length < this.urlsNumber && this.pageNumber < this.maxPageNumber) {
              this._scrapeForUrls(paramsURL, proxy, () => callback());
            } else {
              if (this.pageNumber > this.maxPageNumber) {
                console.log('this.pageNumber > ' + this.maxPageNumber + ': the max page number');
                console.log('done scraping this query');
                this.filtersIndex++;
                this.pageNumber = 1;
                if (this.filtersArray.length - 1 < this.filtersArray) {
                  console.log('done with all passed queries');
                  _nightmareInstance.run(() => {
                    return false;
                  });
                  return;
                }
              }
              callback();
            }
          }
        }
        catch (err) {
          console.log('error occurred getting urls: '+err);
        }
      })
      .catch((error) => {
        if (this.pageNumber > this.maxPageNumber) {
          console.log('this.pageNumber > ' + this.maxPageNumber);
          callback();
        } else {
          console.log(error);
          console.log('retrying.. ');
          this.useProxies = true;
          clearTimeout(this.retryTimer);
          this.retryTimer = setTimeout(()=>{
            ProxiesManager.getProxiesFromGimmeProxy().then((proxy) => {
              console.log(proxy);
              this._scrapeForUrls(paramsURL, proxy, () => callback());
            }).catch(()=> {
              console.log('no proxy used to get urls from owler');
              this._scrapeForUrls(paramsURL, false, () => callback());
            });
          }, 3000);
        }
        _nightmareInstance.run(() => {
          return false;
        });
      });
  }
}

module.exports = new OwlerURLsScraper;
