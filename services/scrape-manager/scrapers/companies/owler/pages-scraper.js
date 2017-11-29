/**
 * @fileoverview pages scraper.
 */
'use strict';
const cheerio = require('cheerio');
const constants = require('../../../../../constants');
const BaseScraper = require('../../base-scraper');
const _ = require('underscore');
const OwlerURLsScraper = require('./urls-scraper');
const owlerCompanyModel = require('../../../../../resources/owler-company/owler-company-resource');
const companyModel = require('../../../../../resources/company/company-resource');
const utils = require('../../../../../utils');

/** Class OwlerPageScraper. */
class OwlerPageScraper extends BaseScraper{
  /**
   * Create Owler scraper
   */
  constructor() {
    super();
    this.proxies = [];
    this.urlsService = OwlerURLsScraper;
    this.scrapersName = 'Owler Scraper';
    this.useProxiesStream = false;
    this.useProxies = true;
    this.urlsPerBulk = 15;
    this.hitsPerLoop = 5;
    this.mainHtmlElement = '#competitiveAnalysis';
    this.itemsModel = owlerCompanyModel;
    this.useElastic = true;
  }

  getFundingAmount(funding) {
    let amount = 0;
    if (funding.length > 0) {
      _.each(funding, f => {
        let temp = f.amount.replace('$', '').replace('-', '').replace('-','').trim().toLowerCase();
        let m = 1;
        if (temp.indexOf('k')) {
          temp = temp.replace('k', '');
          m = 1000;
        }
        if (temp.indexOf('m')) {
          temp = temp.replace('m', '');
          m = 1000000;
        }
        if (temp.indexOf('b')) {
          temp = temp.replace('b', '');
          m = 1000000000;
        }
        temp = parseFloat(temp)*m;
        if (isNaN(temp)) temp = 0;
        amount += temp;
      });
    }
    return amount;
  }

  updateCompaniesFromOwler() {
    if (this.working) {
      console.log('a process is already working...');
    } else {
      this.working = true;
      console.log('updating from owler.. getting companies');
      companyModel.find().lean().exec().then((companies) => {
        console.log('done getting companies.. getting owler companies');
        this.itemsModel.find().lean().exec().then((items) => {
          this.items = items;
          console.log(companies.length+' companies in db');
          console.log(this.items.length+' companies in owler db');
          let companiesToUpdate = [];
          let preparedCompanies = [];
          let companiesToAdd = _.filter(this.items, comp => {
            if (comp.companyName === '{{companyBasicDetails.name}}') return false;
            for (let i = 0; i < companies.length; i++) {
              if (companies[i].companyName.toLowerCase() === comp.companyName.toLowerCase()) {
                return false;
              }
            }
            return true;
          });

          _.each(companiesToAdd, (comp, i) => {
            let fundingRounds = comp.funding.length;
            let fundingAmount = this.getFundingAmount(comp.funding);
            let lastFundingDate = '';
            if (fundingRounds > 0) lastFundingDate = comp.funding[0].date;
            let c = {
              companyName: comp.companyName,
              foundersNames: comp.foundersNames,
              cityHeadQuartersIn: comp.headquartersAddress,
              numberOfEmployees: comp.numberOfEmployees,
              websiteLink: comp.websiteLink,
              fundingRounds: fundingRounds,
              fundingAmount: fundingAmount,
              lastFundingDate: lastFundingDate,
              dateFounded: comp.dateFounded,
              categories: comp.categories,
              angelId: comp.owlerURL,
              description: comp.description,
              acquisitionsNumber: comp.acquisitionsNumber,
              linkedInURL: comp.linkedInURL,
              twitterURL: comp.twitterURL,
              facebookURL: comp.facebookURL,
              youtubeURL: comp.youtubeURL,
              instagramURL: comp.instagramURL,
              angelURL: '',
              crunchBaseURL: '',
              craftURL: '',
              status: comp.status,
              keyPeople: comp.keyPeople,
              source: comp.source,
              logos : {craftLogo: '', crunchBaseLogo: '', otherLogo: comp.logo},
              otherLocations: [],
              email: '',
              phone: comp.phone,
              revenue: comp.revenue
            };
            console.log(c);

            preparedCompanies.push(c);

          });
          console.log(preparedCompanies.length+ ' companies to add from owler');

          companyModel.collection.insert(preparedCompanies, null, () => {
            console.log('done inserting companies');
          });

          _.each(companies, comp => {
            for (let i = 0; i < this.items.length; i++) {
              if (this.items[i].numberOfEmployees && this.items[i].revenue &&
                !comp.revenue && this.items[i].companyName.toLowerCase() === comp.companyName.toLowerCase()) {
                if (this.items[i].numberOfEmployees) comp.numberOfEmployees = this.items[i].numberOfEmployees;
                comp.revenue = this.items[i].revenue;
                companiesToUpdate.push(comp);

                break;
              }
            }
          });

          console.log(companiesToUpdate.length+' companies to update from owler');

          if (companiesToUpdate.length > 0) {
            let bulk = companyModel.collection.initializeOrderedBulkOp();
            _.each(companiesToUpdate, (item) => {
              bulk.find({'_id': item._id}).update({$set: item});
            });
            bulk.execute((error) => {
              console.log(error);
              console.log('done bulk update');
            });
          }

          this.working = false;
        });
      });
    }

  }

  /**
   * get company data from html
   * @param html
   * @param companyData
   * @returns {*}
   */
  parseHTMLForItemData(html, companyData) {
    let company = {
      companyName: '',
      foundersNames: [],
      status: '',

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
      crunchBaseURL: '',
      owlerURL: companyData.url,
      craftURL: '',

      logo : '',
      email: '',
      phone: '',
      source: 'owler',
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

    company.companyName = $('.company-name').text().trim();
    if (company.companyName === '{{companyBasicDetails.name}}') return false;
    company.websiteLink = $('.website-link').find('a').attr('href');
    company.description = $($('.row-description')[0]).text().trim();
    company.logo = $('.company-logo img').attr('src');
    let foundedDateText = $($('h2 span span.cp-left-lable')[0]).text().trim();
    if (foundedDateText && foundedDateText.indexOf('founded date') !== -1) {
      company.dateFounded = foundedDateText.substring(foundedDateText.indexOf('founded date')+12).trim();
    }
    let categories = $('h2 span span.cp-left-lable .cp-box-right-list span span');
    if (categories.length > 0) {
      _.each(categories, cat => {
        company.categories.push($(cat).text().trim());
      });
    }
    let boxRows = $('div.cp-box-row');
    if (boxRows.length > 0) {
      _.each(boxRows, row => {
        if ($(row).find('.cp-box-left').text().trim().toLowerCase() === 'status:') {
          company.status = $(row).find('.cp-box-right').text().trim();
        }
      });
    }

    let boxSections = $('.key-stats-box .cp-info-boxes .cp-box-sections');
    if (boxSections.length > 0) {
      _.each(boxSections, box => {
        if ($(box).find('h2').text().trim().toLowerCase().indexOf('revenue') !== -1) {
          company.revenue =  utils.stringToNumber($($(box).find('h2 span')[0]).text().trim());
        }
        if ($(box).find('h2').text().trim().toLowerCase().indexOf('employees') !== -1) {
          company.numberOfEmployees =  utils.stringToNumber($($(box).find('h2 span')[0]).text().trim().replace(',', ''));
        }
      });
    }

    let fundingRows = $('.funding-table-main .cp-funding-tr');
    let dateRows = $('.funding-table-date .cp-funding-tr');
    if (fundingRows.length > 0) {
      _.each(fundingRows, (row, i) => {
        let elmts = $(row).find('.cp-table-td-txt');
        let fund = {
          date: $(dateRows[i]).text().trim(),
          amount: utils.stringToNumber($($(elmts)[1]).find('.cp-funding-amount').text().trim()),
          source: $($(elmts)[1]).find('a').attr('href'),
          round: $($(elmts)[0]).text().trim(),
          investors: [],
          leadInvestors: '',
          valuation: undefined,
          investorsNumber: undefined
        };
        let investors = $($(elmts)[2]).find('li span');
        _.each(investors, inv => {
          fund.investors.push($(inv).text().trim());
        });
        company.funding.push(fund);
      });
    }

    let acqRows = $('.acquisition-table-outer .cp-acquisition-tr');
    _.each(acqRows, (row) => {
      let elmts = $(row).find('.cp-acquisition-td');
      let acq = {
        name: $($(elmts)[1]).find('a').attr('title'),
        date: $($(elmts)[0]).text().trim(),
        amount: utils.stringToNumber($($(elmts)[1]).find('.acq-text-amt').text().trim()),
        source: $($(elmts)[2]).find('a').attr('href')
      };
      company.acquisitions.push(acq);
    });
    let acqText = $('.cp-acquisition-section .cp-dynamicSummary-text').text().trim();
    if (acqText && acqText.indexOf('acquired') !== -1 && acqText.indexOf('companies') !== -1) {
      company.acquisitionsNumber = utils.stringToNumber(acqText.substring(acqText.indexOf('acquired')+8, acqText.indexOf('companies')).trim());
    }

    let teamRows = $('.cp-leadership-table .cp-leadership-tr');
    _.each(teamRows, (row) => {
      let elmts = $(row).find('.cp-ls-td');
      let person = {
        name: $($(elmts[0]).find('span')[0]).text().trim(),
        title: $($(elmts[1]).find('span')[0]).text().trim(),
        avatar: $($(elmts[0]).find('img')[0]).attr('src'),
        email: '',
        linkedIn: '',
        facebook: '',
        twitter: '',
        website: '',
        other: ''
      };
      let socialLinks = $(elmts[2]).find('span a');
      _.each(socialLinks, sl => {
        let link = $(sl).attr('href').toLowerCase();
        if (link.indexOf('linkedin.com') !== -1) person.linkedIn = link;
        if (link.indexOf('twitter.com') !== -1) person.twitter = link;
        if (link.indexOf('facebook.com') !== -1) person.facebook = link;
      });

      company.keyPeople.push(person);
      if (person.title.toLowerCase().indexOf('founder') !== -1) company.foundersNames.push(person.name);
    });

    let socialLinks = $('.cp-social-wholeWrapper .sectionSocial-links a');
    _.each(socialLinks, sl => {
      let link = $(sl).attr('href').toLowerCase();
      if (link.indexOf('linkedin') !== -1) company.linkedInURL = link;
      if (link.indexOf('twitter') !== -1) company.twitterURL = link;
      if (link.indexOf('facebook') !== -1) company.facebookURL = link;
      if (link.indexOf('youtube') !== -1) company.youtubeURL = link;
      if (link.indexOf('instagram') !== -1) company.instagramURL = link;
    });

    let addressElmts = $('.cp-address-section data-address div');
    _.each(addressElmts, el => {
      company.headquartersAddress += $(el).text().trim()+' ';
    });
    company.headquartersAddress = company.headquartersAddress.trim();

    let phone = $('.cp-address-section data-address > span');
    let phoneAttr = $(phone).attr('data-ng-if');

    if (phoneAttr && phoneAttr.indexOf('phone') !== -1) company.phone = $(phone).text().trim();

    return company;
  }

}

module.exports = new OwlerPageScraper;
