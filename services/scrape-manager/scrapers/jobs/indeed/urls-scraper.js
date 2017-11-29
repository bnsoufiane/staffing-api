/**
 * @fileoverview urls scraper.
 */
'use strict';
const cheerio = require('cheerio');
const constants = require('../../../../../constants');
const _ = require('underscore');
const Promise = require('bluebird');
var Nightmare = require('nightmare');

/** Class IndeedURLsScraper. */
class IndeedURLsScraper {
  /**
   * Create an Indeed url scraper
   */
  constructor() {
    this.baseURL = constants.INDEED_BASE_URL;
    this.queryURL = constants.INDEED_QUERY_URL;
    this.citiesArray = constants.CITIES;

    this.jobs = [];
    this.filtredJobs = [];
    this.pageNumber = 0;
    this.retryTimer = null;
    this.cityIndex = 0;
    this.maxPageNumber = 99;
    this.urlsPool = [];
  }

  /**
   * sets all the params before scraping Yelp main page for URLs, returns a Promise with urls Array
   * @param jobs
   * @param filter
   * @param urlsNumber
   */
  getURLs(jobs, filter, urlsNumber) {
    this.urlsPool = [];
    let city = '';
    let category = '';
    if (filter && filter.city) city = filter.city;
    if (filter && filter.category) category = filter.category;

    this.jobs = jobs;
    this.filtredJobs = _.filter(this.jobs, j => j.source === 'indeed');
    console.log(this.filtredJobs.length+' jobs from indeed');
    this.urlsNumber = urlsNumber || 100;
    let estimatedResultsPerPage = 10;

    if (!city) {
      console.log('city index:'+this.cityIndex);
      console.log('city:'+this.citiesArray[this.cityIndex]);
      if (this.citiesArray[this.cityIndex]) {
        city = this.citiesArray[this.cityIndex];
      } else {
        console.log('done with all cities, please add more.');
        return false;
      }
    }
    console.log('scraping jobs from '+city);

    this.filtredJobs = _.filter(this.filtredJobs, j => j.city.toLowerCase().indexOf(city) !== -1);

    console.log(this.jobs.length+' '+city+' jobs from indeed in db');
    if (category) {
      this.jobs = _.filter(this.jobs, j => j.category.toLowerCase().indexOf(category) !== -1);
      console.log(this.jobs.length+' '+category+' jobs in '+city+' from indeed in db');
    }

    //setting the page we'll start scraping on, basing on companies array.
    if (this.pageNumber === 0) {
      this.pageNumber = parseInt(this.jobs.length/estimatedResultsPerPage);
      if (this.pageNumber > this.maxPageNumber) this.pageNumber = this.maxPageNumber;
    }

    console.log('starting at page :'+this.pageNumber+' - 10 result per page');

    return new Promise((resolve) => {
      this._scrapeForUrls(city, category, () => {
        console.log(this.urlsPool.length+' url returned from request');
        resolve(this.urlsPool);
      });

    });


  }

  /**
   * Making the call to the API to get list of URLS
   * @param city
   * @param category
   * @param callback
   * @private
   */
  _scrapeForUrls(city, category, callback) {
    let pageUrl = this.queryURL;
    if (category) pageUrl += 'q=' + category.replace(/ /g, '+');
    if (city) pageUrl += '&l=' + city.replace(/ /g, '+');
    pageUrl += '&start=' + (this.pageNumber*10);
    console.log(pageUrl);

    var nightmare = Nightmare({show:true});
    nightmare
      .goto(pageUrl)
      .wait(5000)
      .evaluate(() => {
        return document.querySelector('td#resultsCol').outerHTML;
      })
      .end()
      .then((data) => {
        try {
          let $ = cheerio.load(data);
          let resultsNumber = $('#searchCount').text().trim();
          resultsNumber = parseInt(resultsNumber.substr(resultsNumber.indexOf('of')+3).replace(/,/g, ''));
          this.maxPageNumber = parseInt(resultsNumber/10);
          if (this.maxPageNumber > 100) this.maxPageNumber = 100; //we can only get 100 page

          console.log(resultsNumber+' result in this query');
          let rows = $('.row.result');
          console.log(rows.length+' result in this page');
          this.pageNumber++;
          console.log(this.pageNumber);

          if (rows.length === 0) {
            console.log('could not find any results in '+pageUrl);
            callback();
          } else {
            _.each(rows, (row) => {
              let url = $($(row).find('a')[0]).attr('href');
              if (url.indexOf('http') === -1) url = this.baseURL+url;

              if (!_.findWhere(this.urlsPool, {url: url}) && !_.findWhere(this.jobs, {jobLink: url})) {
                this.urlsPool.push({
                  url: url,
                  category: category,
                  city: city,
                  html: row
                });
              }
            });
            console.log(this.urlsPool.length+' job URLs returned after scraping page:'+this.pageNumber);

            if (this.urlsPool.length < this.urlsNumber && this.pageNumber < 100) {
              this._scrapeForUrls(city, category, () => callback());
            } else {
              if (this.pageNumber > this.maxPageNumber) {
                console.log('this.pageNumber > ' + this.maxPageNumber);
                this.pageNumber = 0;
                this.cityIndex++;
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
          this.pageNumber = 0;
          this.cityIndex++;
          callback();
        } else {
          console.log(error);
          console.log('retrying.. ');
          clearTimeout(this.retryTimer);
          this.retryTimer = setTimeout(()=>{
            this._scrapeForUrls(city, category, () => callback());
          }, 10000);
        }
      });
  }
}

module.exports = new IndeedURLsScraper;
