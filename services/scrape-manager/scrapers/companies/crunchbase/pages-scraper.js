/**
 * @fileoverview pages scraper.
 */
'use strict';
const cheerio = require('cheerio');
const constants = require('../../../../../constants');
const BaseScraper = require('../../base-scraper');
const _ = require('underscore');
const CrunchbaseURLsScraper = require('./urls-scraper');
const utils = require('../../../../../utils');
const companyDetailsModel = require('../../../../../resources/company-details/company-details-resource');

/** Class CrunchbaseScraper. */
class CrunchbasePageScraper extends BaseScraper {
  /**
   * Create a crunch scraper
   */
  constructor() {
    super();
    this.baseURL = constants.CRUNCHBASE_BASE_URL;
    this.urlsService = CrunchbaseURLsScraper;
    this.scrapersName = 'CrunchBase Scraper';
    this.mainHtmlElement = '#main-content';
    this.useElastic = true;
    this.itemsModel = companyDetailsModel;
  }

  /**
   * get company data from html
   * @param html
   * @param companyUrlData
   * @returns {*}
   */
  parseHTMLForItemData(html, companyUrlData) {
    let url = companyUrlData.url;
    let company = {
      companyName: '',
      foundersNames: [],
      status: 'private',

      cityHeadQuartersIn: '',
      headquartersAddress: '',
      otherLocations: [],

      numberOfEmployees: undefined,
      minNumberOfEmployees: undefined,
      maxNumberOfEmployees: undefined,

      dateFounded: '',
      categories: [],
      description: '',

      fundingAmount: undefined,
      fundingRounds: undefined,
      lastFundingDate: '',

      acquisitionsNumber: undefined,
      linkedInURL: '',
      twitterURL: '',
      twitterFollowers: undefined,
      facebookURL: '',
      facebookLikes: undefined,
      youtubeURL: '',
      instagramURL: '',
      instagramFollowers: undefined,
      angelURL: '',
      crunchBaseURL: url,
      owlerURL: '',
      craftURL: '',

      logo : '',
      email: '',
      phone: '',
      source: 'crunchBase',
      websiteLink: '',

      news: [],
      edits: [],
      funding: [],
      investors: [],
      keyPeople: [],
      acquisitions: [],
      investments: []
    };


    let $ = cheerio.load(html);
    let title = $('#profile_header_heading');

    if (title) {
      company.companyName = $(title).text();
      company.logo = $('.entity-info-card-primary-image').attr('src');
      let overviewSection = $('#info-card-overview-content');
      let indexes = $(overviewSection).find('dl.definition-list .definition-list dt');
      let values = $(overviewSection).find('dl.definition-list .definition-list dd');

      let attributes = {};
      _.each(indexes, function(index, i){
        let key = $(index).text().replace(':', '').trim();
        attributes[key] = $(values[i]).text().trim();
      });

      values = $(overviewSection).find('dl.definition-list .overview-stats dd');
      _.each(values, function(v){
        let val = $(v).text().trim().toLowerCase();
        if (val.indexOf('went public') !== -1)
          company.status = 'public';
        if (val.indexOf('acquired by') !== -1)
          company.status = 'acquired';
      });

      indexes = $('.timeline.container').find('.info-tab .card-content .details dt');
      values = $('.timeline.container').find('.info-tab .card-content .details dd');
      _.each(indexes, function(index, i){
        let key = $(index).text().replace(':', '').trim();
        attributes[key] = $(values[i]).text().trim();
      });

      let fund = $('#funding_rounds').text();
      if (fund !== 'Add Funding Rounds') {
        attributes['fundingRounds'] = $('#funding_rounds').find('span').text().replace('(', '').replace(')', '').trim();
        attributes['fundingAmount'] = fund.substring(fund.lastIndexOf('-')+1).replace('$', '').trim();
        attributes['lastFundingDate'] = $($('.funding_rounds').find('table td.date')[0]).text().trim();
      }

      let acquisitionsNumber = $('#acquisitions').find('span').text().replace('(', '').replace(')', '').trim();
      if (acquisitionsNumber && acquisitionsNumber !== 'Add Acquisitions')
        attributes['acquisitionsNumber'] = acquisitionsNumber;

      let peopleHTML = $('.people').find('ul.section-list li');
      let people = [];
      _.each(peopleHTML, function(elmt){
        people.push({
          name:$(elmt).find('h4').text().trim(),
          title:$(elmt).find('h5').text().trim(),
          avatar: $(elmt).find('.profile img').attr('src'),
          email: '',
          linkedIn: '',
          twitter: '',
          facebook: '',
          website: '',
          other: ''
        });
      });
      if (people.length) {
        company.keyPeople = people;
      }

      company.linkedInURL = $(overviewSection).find('.icons.linkedin').attr('href') || '';
      company.twitterURL = $(overviewSection).find('.icons.twitter').attr('href') || '';
      company.facebookURL = $(overviewSection).find('.icons.facebook').attr('href') || '';

      let keysMap = [
        {k : 'Headquarters', v: 'cityHeadQuartersIn'},
        {k : 'Description', v: 'description'},
        {k : 'Website', v: 'websiteLink'},
        {k : 'fundingRounds', v: 'fundingRounds'},
        {k : 'fundingAmount', v: 'fundingAmount'},
        {k : 'lastFundingDate', v: 'lastFundingDate'},
        {k : 'acquisitionsNumber', v: 'acquisitionsNumber'},
        {k : 'Founded', v: 'dateFounded'}
      ];

      _.each(keysMap, key => {
        if (attributes[key.k] && attributes[key.k].toLowerCase() != 'unknown') {
          if (key.k === 'fundingRounds' || key.k === 'fundingAmount' ||  key.k === 'acquisitionsNumber') {
            company[key.v] = utils.stringToNumber(attributes[key.k]);
          } else {
            company[key.v] = attributes[key.k];
          }
        }
      });

      if (attributes['Founders']) {
        company.foundersNames = _.map(attributes['Founders'].split(','), founder => founder.trim());
      }

      if (attributes['Categories']) {
        company.categories = _.map(attributes['Categories'].split(','), founder => founder.trim());
      }

      if (attributes['Employees']) {
        let employees = attributes['Employees'].substring(0, attributes['Employees'].indexOf('|')).trim();
        if (employees.indexOf('-') !== -1) {
          let min = employees.substring(0, employees.indexOf('-'));
          let max = employees.substring(employees.indexOf('-')+1);
          if (!isNaN(parseInt(min))) company.minNumberOfEmployees = utils.stringToNumber(min);
          if (!isNaN(parseInt(max))) company.maxNumberOfEmployees = utils.stringToNumber(max);
        } else {
          company.numberOfEmployees = utils.stringToNumber(employees);
        }
      }

      return company;

    } else {
      console.log('title was not found for this company, aborting..');
      return false;
    }


  }
}

module.exports = new CrunchbasePageScraper;
