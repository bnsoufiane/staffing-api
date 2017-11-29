/**
 * @fileoverview urls scraper.
 */
'use strict';
const cheerio = require('cheerio');
const constants = require('../../../../../constants');
const _ = require('underscore');
const Promise = require('bluebird');
var Nightmare = require('nightmare');

/** Class YelpURLsScraper. */
class YelpURLsScraper {
  /**
   * Create a yelp url scraper
   */
  constructor() {
    this.baseURL = constants.YELP_BASE_URL;
    this.queryURL = constants.YELP_QUERY_URL;
    this.citiesArray = constants.CITIES;

    this.localBusinesses = [];
    this.filtredLocalBusinesses = [];
    this.pageNumber = 0;
    this.retryTimer = null;
    this.cityIndex = 10;
    this.maxPageNumber = 99;
  }

  /**
   * sets all the params before scraping Yelp main page for URLs, returns a Promise with urls Array
   * @param localBusinesses
   * @param filter
   * @param urlsNumber
   */
  getURLs(localBusinesses, filter, urlsNumber) {
    let city = '';
    let category = '';
    if (filter && filter.city) city = filter.city;
    if (filter && filter.category) category = filter.category;

    console.log('city index:'+this.cityIndex);
    console.log('city:'+this.citiesArray[this.cityIndex]);
    this.localBusinesses = localBusinesses;
    this.filtredLocalBusinesses = _.filter(this.localBusinesses, comp => comp.source === 'yelp');
    console.log(this.filtredLocalBusinesses.length+' local businesses from yelp');
    this.urlsNumber = urlsNumber || 100;
    let estimatedResultsPerPage = 10;

    //setting the query URL depending on the chosen category
    let paramsURL = '';

    if (!city) {
        if (this.citiesArray[this.cityIndex]) {
          city = this.citiesArray[this.cityIndex];
        } else {
          console.log('done with all cities, please add more.');
          return false;
        }
    }
    paramsURL = city.replace(/ /g, '+');
    console.log('scraping local businesses from '+city);

    if (city === 'New York') {
      this.filtredLocalBusinesses = _.filter(this.filtredLocalBusinesses, comp =>
      comp.city.toLowerCase() === 'new york' || comp.city.toLowerCase() === 'brooklyn' );
    } else {
      this.filtredLocalBusinesses = _.filter(this.filtredLocalBusinesses, comp => comp.city.toLowerCase() === city.toLowerCase() );
    }
    console.log(this.filtredLocalBusinesses.length+' '+city+' local businesses from yelp in db');
    if (category) {
      category = category.toLowerCase();
      this.filtredLocalBusinesses = _.filter(this.filtredLocalBusinesses, comp => {
        for(let i = 0; i < comp.categories.length; i++) {
          if (comp.categories[i].toLowerCase() === category.toLowerCase()) {
            return true;
          }
        }
        return false;
      });
    }

    //setting the page we'll start scraping on, basing on companies array.
    if (this.pageNumber === 0) {
      this.pageNumber = parseInt(this.filtredLocalBusinesses.length/estimatedResultsPerPage);
      if (this.pageNumber > this.maxPageNumber) this.pageNumber = this.maxPageNumber;
      if (category) this.pageNumber -= 5;
      if (this.pageNumber < 0) this.pageNumber = 0;
    }

    console.log('starting at page :'+this.pageNumber+' - 10 result per page');

    return new Promise((resolve) => {
      let urlsToReturn = [];

      this._scrapeForUrls(paramsURL, category, urlsToReturn, () => {
        console.log(urlsToReturn.length+' url returned from request');
        resolve(urlsToReturn);
      });

    });


  }

  /**
   * Making the call to the API to get list of URLS
   * @param paramsURL
   * @param category
   * @param URLs
   * @param callback
   * @private
   */
  _scrapeForUrls(paramsURL, category, URLs, callback) {
    if (!URLs) URLs = [];
    let url = this.queryURL+paramsURL+'&start='+(this.pageNumber*10);
    if (category) {
      url += '&cflt='+category;
      console.log('category: '+category);
    }

    var nightmare = Nightmare({show:true});
    nightmare
      .goto(url)
      .wait(5000)
      .evaluate(() => {
        return document.querySelector('#wrap').outerHTML;
      })
      .end()
      .then((data) => {
        try {
          let $ = cheerio.load(data);
          let resultsNumber = $('.pagination-results-window').text().trim();
          resultsNumber = resultsNumber.substr(resultsNumber.indexOf('of')+3);
          this.maxPageNumber = parseInt(resultsNumber/10);
          if (this.maxPageNumber > 99) this.maxPageNumber = 99;

          console.log(resultsNumber+' result in this query');
          let rows = $('.search-results-content').find('li.regular-search-result');
          console.log(rows.length+' result in this page');
          this.pageNumber++;
          console.log(this.pageNumber);

          if (rows.length === 0) {
            console.log('done with scraping pages in '+paramsURL);
            callback();
          } else {
            _.each(rows, (row) => {
              let url = $(row).find('a.biz-name').attr('href');
              if (url[0] === '/') url = url.slice(1);
              url = this.baseURL + url;
              if (!_.findWhere(URLs, {url: url}) && !_.findWhere(this.localBusinesses, {yelpUrl: url})) {
                URLs.push({
                  name: $(row).find('a.biz-name').text().trim(),
                  url: url,
                  city: this.citiesArray[this.cityIndex],
                  yelpAvatar: $(row).find('.main-attributes .photo-box-img').attr('src')
                });
              }
            });
            console.log(URLs.length+' businesses URL returned after scraping page:'+this.pageNumber);

            if (URLs.length < this.urlsNumber && this.pageNumber < 100) {
              this._scrapeForUrls(paramsURL, category, URLs, () => callback());
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
            this._scrapeForUrls(paramsURL, category, URLs, () => callback());
          }, 10000);
        }
      });
  }
}

module.exports = new YelpURLsScraper;
