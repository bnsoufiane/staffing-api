/**
 * @fileoverview pages scraper.
 */
'use strict';
const cheerio = require('cheerio');
const constants = require('../../../../../constants');
const BaseScraper = require('../../base-scraper');
const _ = require('underscore');
const CraftURLsScraper = require('./urls-scraper');

/** Class CraftPageScraper. */
class CraftPageScraper extends BaseScraper{
  /**
   * Create a crunch scraper
   */
  constructor() {
    super();
    this.baseURL = constants.CRUNCHBASE_BASE_URL;
    this.urlsService = CraftURLsScraper;
    this.scrapersName = 'Craft Scraper';
    this.useProxiesStream = false;
    this.proxiesSources = [constants.PROXY_SOURCE.inCloak];
    this.urlsPerBulk = 30;
    this.mainHtmlElement = '.container-page';
  }

  /**
   * get company data from html
   * @param html
   * @param companyData
   * @returns {*}
   */
  parseHTMLForItemData(html, companyData) {
    let company = {
      companyName: companyData.companyName,
      foundersNames: [],
      cityHeadQuartersIn: '',
      numberOfEmployees: companyData.numberOfEmployees || '',
      websiteLink: '',
      fundingRounds: '', //missing
      fundingAmount: '',
      lastFundingDate: '',
      dateFounded: '',
      categories: [],
      angelId: companyData.companyName? companyData.companyName.toLowerCase() : '',
      description: companyData.description || '',
      acquisitionsNumber: '', //missing
      linkedInURL: '',
      twitterURL: '',
      facebookURL: '',
      youtubeURL: '',
      instagramURL: '',
      angelURL: '',
      crunchBaseURL:'',
      craftURL: companyData.url,
      status: '',
      keyPeople: [],
      source: 'craft',
      logos : {crunchBaseLogo:'', craftLogo: companyData.craftLogo || ''},
      otherLocations: [],
      email: '', //missing
      phone: '' //missing
    };

    let $ = cheerio.load(html);

    //categories
    company.categories.push($($('ul.breadcrumb li')[0]).text().replace('!', '').trim().toLowerCase());

    //status
    let topSection = $('div.top');
    company.status = $(topSection).find('span.company-type-label').text().trim();

    //social links
    let socialLinks = $(topSection).find('div.social-links a');
    _.each(socialLinks, function(socialLink){
      let key = $(socialLink).attr('title').toLowerCase();
      let value = $(socialLink).attr('href');
      if (key === 'site') company.websiteLink = value;
      if (key === 'crunchbase') company.crunchBaseURL = value;
      if (key === 'linkedin') company.linkedInURL = value;
      if (key === 'youtube') company.youtubeURL = value;
      if (key === 'facebook') company.facebookURL = value;
      if (key === 'instagram') company.instagramURL = value;
    });
    company.twitterURL = $('#twitter-block').find('.active-handle').text().trim().replace('@', 'https://twitter.com/');

    //founded & funding
    let financeRows = $('table.table-finance').find('tr');
    _.each(financeRows, function(row){
      let key = $($(row).find('td')[0]).text().replace(':', '').trim().toLowerCase();
      let value = $($(row).find('td')[1]).text().trim();
      if (key === 'founding date') company.dateFounded = value;
      if (key === 'total funding') company.fundingAmount = value;
      if (key === 'time since last funding') company.lastFundingDate = value;
    });

    //key people
    let keyPeopleHtml = $('.positions').find('.profile-blog');
    _.each(keyPeopleHtml, function(personHtml){
      let keyPerson = {
        name: $(personHtml).find('.name').text().trim(),
        title: $(personHtml).find('.job-title').text().trim(),
        email: '',
        facebook: '',
        twitter: '',
        linkedIn: '',
        website: '',
        other: ''
      };

      let personSocialLinks = $(personHtml).find('ul.share-list li a');
      _.each(personSocialLinks, function(socialLink){
        let key = $(socialLink).attr('title').toLowerCase();
        let value = $(socialLink).attr('href');
        if (key === 'email') keyPerson.email = value;
        if (key === 'facebook') keyPerson.facebook = value;
        if (key === 'twitter') keyPerson.twitter = value;
        if (key === 'linkedin') keyPerson.linkedIn = value;
        if (key === 'site') keyPerson.wesbite = value;
        if (key === 'other site') keyPerson.other = value;
      });

      company.keyPeople.push(keyPerson);
      if (keyPerson.title.toLowerCase().indexOf('founder') !== -1) {
        company.foundersNames.push(keyPerson.name);
      }
    });

    //locations
    let locationsRows = $('.container-locations-scroll').find('p');
    let otherLocations = [];
    _.each(locationsRows, function(location){
      let text = $(location).text().trim();
      if (text.indexOf('(HQ)') !== -1) {
        company.cityHeadQuartersIn = text.replace('(HQ)', '').trim();
      } else {
        otherLocations.push(text);
      }
    });
    company.otherLocations = otherLocations;

    return company;
  }

}

module.exports = new CraftPageScraper;
