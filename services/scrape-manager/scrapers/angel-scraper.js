/**
 * @fileoverview Angel scraper.
 */
'use strict';
const moment = require('moment');
const async = require("async");
const cheerio = require('cheerio');
const constants = require('../../../constants');
const BaseScraper = require('./base-scraper.js');
const companyModel = require('../../../resources/company/company-resource');
var path = require('path');
var childProcess = require('child_process');
var phantomjs = require('phantomjs-prebuilt');
var binPath = phantomjs.path;

/** Class AngelScraper. */
class AngelScraper extends BaseScraper {
  /**
   * Create a angel.co scraper
   */
  constructor() {
    super();
    this.queryURL = constants.ANGEL_COMPANIES_URL;
    this.getIdsURL = 'https://angel.co/company_filters/search_data?sort=signal&page=';
    this.currentPage = 1;
    this.retryAttempt = 0;
    this.companies = [];
  }

  /**
   * Returns angel URL for current page from object of ids
   * @param response
   * @returns {*}
   */
  constructURL(response) {
    try {
      var obj = JSON.parse(response);
      var url = this.queryURL+'/startups?';
      for(var i = 0; i < obj.ids.length; i++) {
        var and = (i === 0) ? '':'&';
        url += and+'ids%5B%5D='+obj.ids[i];
      }
      url += '&total='+obj.total;
      url += '&page='+obj.page;
      url += '&sort='+obj.sort;
      url += '&new='+obj.new;
      url += '&hexdigest='+obj.hexdigest;
      return url;
    } catch(error) {
      return error;
    }
  }

  /**
   * gets company date from raw html and insert in db
   * @param response
   * @returns {*}
   */
  addCompany(rawCompany, $) {
    var company = {};

    company.angelId = $(rawCompany).find('.name').find('a').data('id');
    company.angelURL = $(rawCompany).find('.name').find('a').attr('href');
    company.companyName = $(rawCompany).find('.name').text().trim();
    company.cityHeadQuartersIn = $(rawCompany).find('.location').find('.tag').text().trim();
    company.websiteLink = $(rawCompany).find('.website').find('.website').text().trim();
    company.numberOfEmployees = $(rawCompany).find('.company_size').find('.value').text().trim();
    if(company.numberOfEmployees === '-')
      company.numberOfEmployees = '';
    company.fundingAmount = $(rawCompany).find('.raised').find('.value').text().trim();
    if(company.fundingAmount === '-')
      company.fundingAmount = '';

    try {
      companyModel.createOne(company).then(function(insertedCompany) {
        insertedCompany && this.insertedCompanies.push(insertedCompany);
        console.log('company added: '+company.companyName);
      }.bind(this)).catch( err =>  console.log(err) );
    } catch(error) {
      console.log('error adding company to DB, probably it already exists.');
    }
  }

  /**
   * scrape companies page angel url
   * @param response
   * @returns {*}
   */
  scrapeCompanies(url, cb) {
    scrap(url,
      function(err, $, code, html, resp) {
        resp = JSON.parse(resp);
        if(resp && resp.html) {
          $ = cheerio.load(resp.html);
          var results = $('.base.startup');
          for (var i = 0; i < results.length; i++) {
            this.addCompany(results[i], $);
          }

          if(this.insertedCompanies.length < this.limit) {
            this.currentPage++;
            this.getCompaniesListURL(cb);
          } else {
            cb(this.insertedCompanies);
          }
        }
        else {
          console.log('error getting data for url:');
          console.log(url);
          //retrying
          if(this.retryAttempt < 5) {
            setTimeout(function () {
              this.retryAttempt++;
              this.scrapeCompanies(url, cb);
            }.bind(this, cb, url), 500);
          } else {
            this.retryAttempt = 0;
            console.log('moving on..');
            //this.currentPage++;
            //this.getCompaniesListURL(cb);
            cb(this.insertedCompanies);
          }
        }
      }.bind(this, cb)
    );
  }
  /**
   * get list of ids and other data for each page
   * @param response
   * @returns {*}
   */
  getCompaniesListURL(cb) {
    scrap(this.getIdsURL+this.currentPage,
      function(err, $, code, html, resp) {
        if(resp) {
          console.log(resp);
          this.scrapeCompanies(this.constructURL(resp), cb);
        }
        else {
          console.log('error getting URL: '+this.getIdsURL+this.currentPage);
          //retrying
          if(this.retryAttempt < 5) {
            setTimeout(function () {
              this.retryAttempt++;
              this.getCompaniesListURL(cb);
            }.bind(this, cb), 500);
          } else {
            this.retryAttempt = 0;
            console.log('could not get URL after trying 5 times..');
          }
        }
      }.bind(this, cb)
    );
  }

  scrapeCompanyData() {
    var company;
    if(this.companies.length > 0) {
      company = this.companies[0];
    } else {
      console.log('done with companies update!');
      return;
    }

    if(!company.angelURL || company.foundersNames.length === 0) {
      this.companies.shift();
      this.scrapeCompanyData();
      return;
    }
    this.childArgs = [path.join(__dirname, 'angel-phantomjs.js'), company.angelURL];
    childProcess.execFile(binPath, this.childArgs, function(err, stdout, stderr) {

      //categories
      var $ = cheerio.load(stdout);
      let cats = $('.summary').find('.standard > .text > .tags > a');
      if(!cats) {
        cats = [];
      } else {
        company.categories = [];
      }
      for(let i = 1; i < cats.length; i++) {
        company.categories.push($(cats[i]).text().trim());
      }

      //founders
      let founders = $('.larger.roles').find('li > div > div > .text > .name');
      if(!founders) {
        founders = [];
      } else {
        company.foundersNames = [];
      }
      for(let i = 0; i < founders.length; i++) {
        company.foundersNames.push($(founders[i]).text().trim());
      }

      //funding
      let funding = $('ul.startup_rounds').find('li');
      if(!funding) funding = [];
      if(funding && funding.length > 0) {
        company.lastFundingDate = $(funding[0]).find('.date_display').text().trim();
        company.fundingRounds = funding.length;
      }

      if(!company.fundingAmount || company.fundingAmount === '$NaN') {
        var amounts = [];
        for(let i = 0; i < funding.length; i++) {
          amounts.push($(funding[i]).find('.raised').text().trim());
          if(i == 0)
            company.lastFundingDate = $(funding[i]).find('.date_display').text().trim();
        }

        if(amounts.length > 1) {
          let tAmount = 0;
          for(let i = 0; i < amounts.length; i++) {
            let temp = parseInt(amounts[i].replace(/,/g, '').replace('$', ''));
            if(temp)
              tAmount += temp;
          }
          company.fundingAmount = '$'+tAmount;
        } else {
          company.fundingAmount = amounts[0];
        }
      }

      console.log(company);

      try {
        companyModel.findByIdAndUpdateAsync(company._id, company)
          .then(function() {
            console.log(company.companyName+': done!');
            if(this.companies.length > 0) {
              this.companies.shift();
              this.scrapeCompanyData();
            }

          }.bind(this))
          .catch(function (err) {
            console.log('error updating company: '+company.companyName+ ' - err: '+err);
          }
        );
      } catch(error) {
        console.log('error updating company: '+company.companyName+ ' - error: '+error);
      }
    }.bind(this));

  }

  updateCompanies() {
    console.log('inside updateCompanies');
    try {
      companyModel.fetch().then(function(companies) {
        this.companies = companies;
        this.scrapeCompanyData();

      }.bind(this)).catch(function(err) {
        console.log('error getting list of companies from db: '+err);
      });
    } catch(error) {
      console.log('error getting list of companies from db.');
    }
  }


  /**
   * Perform scraping
   * @param {string} terms - all term which will be used for scraping
   * @param {integier} limit - limit for scraping
   * @param {Object} models - all available models
   * @param {Callback} cb - callback when scrap completed
   */
  scrape(terms, limit, models, cb) {
    this.addingType = terms ? terms : 'add';
    this.limit = limit ? limit : 100;
    this.insertedCompanies = [];
    this.getIdsURL = 'https://angel.co/company_filters/search_data?'
      +encodeURI('filter_data[locations][]=San Francisco')
      +'&sort=signal&page=';

    if(this.addingType == 'add') {
      this.getCompaniesListURL(cb);
    } else {
      this.updateCompanies();
    }

  }



}

module.exports = new AngelScraper;
