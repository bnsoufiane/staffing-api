/**
 * @fileoverview pages scraper.
 */
'use strict';
const cheerio = require('cheerio');
const constants = require('../../../../../constants');
const BaseScraper = require('../../base-scraper');
const _ = require('underscore');
const YelpURLsScraper = require('./urls-scraper');
const businessesModel = require('../../../../../resources/businesses/businesses-resource');

/** Class YelpPageScraper. */
class YelpPageScraper extends BaseScraper{
  /**
   * Create yelp scraper
   */
  constructor() {
    super();
    this.baseURL = constants.YELP_BASE_URL;
    this.urlsService = YelpURLsScraper;
    this.scrapersName = 'Yelp Scraper';
    this.useProxiesStream = false;
    this.useProxies = true;
    this.proxiesSources = [constants.PROXY_SOURCE.all];
    this.urlsPerBulk = 30;
    this.mainHtmlElement = 'body';
    this.itemsModel = businessesModel;
  }

  updateBusinessPartOfChain(cb) {
    console.log('updating businesses...');
    this.itemsModel.fetch().then((items) => {
      cb('working...');
      console.log('total number of businesses: '+items.length);
      let businessesPerCity = [];
      _.each(items, (item) => {
        if (!item.partOfChain && item.city) {
          if (!businessesPerCity[item.city] || businessesPerCity[item.city].length === 0) {
            businessesPerCity[item.city] = [item];
          } else {
            businessesPerCity[item.city].push(item);
          }
        }
      });
      console.log('total number of cities: '+Object.keys(businessesPerCity).length);
      let itemsToUpdate = [];
      _.each(Object.keys(businessesPerCity), (city) => {
        _.each(businessesPerCity[city], (item) => {
          let results = _.where(businessesPerCity[city], {name: item.name});
          if (results && results.length > 1) itemsToUpdate = itemsToUpdate.concat(results);
        });
      });
      itemsToUpdate = _.uniq(itemsToUpdate);

      _.each(itemsToUpdate, (item) => {
        console.log(item.name+' : '+item.city+', '+item.yelpUrl);
        item.partOfChain = true;
        this.itemsModel.findByIdAndUpdateAsync(item._id, item)
          .then(biz => console.log(biz.name+' updated!'))
          .catch(err => AppErr.reject(err, this.itemsModel.ERROR.CREATE));
      });


    }).catch((err) => {
      console.log('err getting list of items from db: ');
      console.log(err);
    });
  }

  isPartOfChain(business) {
    //get all businesses from same city with same name
    let similarBusinesses = _.filter(this.items, (item) => {
      return (item.name.toLowerCase() === business.name.toLowerCase() && item.city.toLowerCase === business.city.toLowerCase())
    });

    if (similarBusinesses && similarBusinesses.length > 0) {
      _.each(similarBusinesses, (biz) => {
        if (!biz.partOfChain && biz._id) {
          biz.partOfChain = true;
          this.itemsModel.findByIdAndUpdateAsync(biz._id, biz)
            .then(ubiz => console.log(ubiz.name+' updated!'))
            .catch(err => AppErr.reject(err, this.itemsModel.ERROR.CREATE));
        }
      });
      return true;
    }
    return false;
  }

  /**
   * get company data from html
   * @param html
   * @param businessData
   * @returns {*}
   */
  parseHTMLForItemData(html, businessData) {
    let business = {
      name: '',
      website: '',
      owners: [], //missing
      dateFounded: '', //missing
      street: '',
      city: '',
      state: '',
      postalCode: '',
      neighborhood: '',
      country: '',
      categories: [],
      email: '', //missing
      phone: '',
      coordinates: [],
      partOfChain: false,
      facebook: '', //missing
      twitter: '', //missing
      priceRange: '',
      priceDescription: '',
      healthInspection: '',
      hours: {mon:'', tue:'', wed:'', thu:'', fri:'', sat:'', sun:''},
      reviews: {five:'', four:'', three:'', two:'', one:''},
      yelpingSince: '',
      additionalInfo: [],
      yelpUrl: businessData.url,
      yelpAvatar: businessData.yelpAvatar,
      source: 'yelp'
    };

    let $ = cheerio.load(html);

    //name
    business.name = $('.biz-page-title').text().trim();

    //address + contact
    let mapbox = $('.biz-page-subheader').find('.mapbox');
    if (mapbox && mapbox.length > 0) {
      let addressElmts = $(mapbox).find('.map-box-address span');
      _.each(addressElmts, (elmt) => {
        if ($(elmt).attr('class') === 'neighborhood-str-list') business.neighborhood = $(elmt).text().trim();
        if ($(elmt).attr('itemprop') === 'streetAddress') business.street = $(elmt).text().trim();
        if ($(elmt).attr('itemprop') === 'addressLocality') business.city = $(elmt).text().trim();
        if ($(elmt).attr('itemprop') === 'addressRegion') business.state = $(elmt).text().trim();
        if ($(elmt).attr('itemprop') === 'postalCode') business.postalCode = $(elmt).text().trim();
      });
      if (!business.street) {
        let fullAddress = $(mapbox).find('.map-box-address .street-address');
        if (fullAddress && fullAddress.length > 0) business.street = $(fullAddress).text().trim();
      }
      if (!business.city && businessData.city) business.city = businessData.city;

      let country = $(mapbox).find('.map-box-address meta');
      if (country && country.length > 0 && country.attr('itemprop') === 'addressCountry') business.country = $(country).attr('content');

      let phone = $(mapbox).find('.biz-phone');
      if (phone && phone.length > 0) business.phone = $(phone).text().trim();

      let website = $(mapbox).find('.biz-website a');
      if (website && website.length > 0) business.website = decodeURIComponent($(website).attr('href').replace('/biz_redir?url=', ''));

      let map = $(mapbox).find('.mapbox-map img');
      if (map && map.length > 0) {
        map = $(map).attr('src');
        map = map.substr(map.indexOf('center=')+7);
        let coordinates = map.substring(0, map.indexOf('&')).split('%2C');
        if (coordinates.length === 2) business.coordinates = coordinates;
      }

      //categories
      let categories = $('.category-str-list').text().trim().split(',');
      _.each(categories, (cat) => {
        business.categories.push(cat.trim());
      });

      //price + health
      let summary = $('.island.summary');
      if (summary && summary.length > 0) {
        business.priceRange = $(summary).find('.price-range').text().trim();
        business.priceDescription = $(summary).find('.price-description').text().trim();
        business.healthInspection = $(summary).find('.health-score .score-block').text().trim();
      }

      //business hours
      let hoursRows = $('.hours-table tbody tr');
      if (hoursRows && hoursRows.length > 0) {
        _.each(hoursRows, (row) => {
          business.hours[$(row).find('th').text().trim().toLowerCase()] = $($(row).find('td')[0]).text().trim().toLowerCase();
        });
      }

      //yelping since and review counts
      let yelpingSince = $('.rating-details-ratings-info').text().trim();
      if (yelpingSince && yelpingSince.indexOf('Yelping since') !== -1) {
        business.yelpingSince = yelpingSince.substring(yelpingSince.indexOf('Yelping since')+14, yelpingSince.indexOf('Yelping since')+18);
      }
      let reviewRows = $('table.histogram tr.histogram_row');
      if (reviewRows && reviewRows.length > 0) {
        _.each(reviewRows, (row, i) => {
          if (i === 0) business.reviews.five = $(row).find('td.histogram_count').text().trim();
          if (i === 1) business.reviews.four = $(row).find('td.histogram_count').text().trim();
          if (i === 2) business.reviews.three = $(row).find('td.histogram_count').text().trim();
          if (i === 3) business.reviews.two = $(row).find('td.histogram_count').text().trim();
          if (i === 4) business.reviews.one = $(row).find('td.histogram_count').text().trim();
        });
      }

      //additional info
      let moreInfoRows = $('.bordered-rail .ylist .short-def-list dl');
      if (moreInfoRows && moreInfoRows.length > 0) {
        _.each(moreInfoRows, (row) => {
          business.additionalInfo.push({key: $(row).find('dt').text().trim(), value: $(row).find('dd').text().trim()});
        });
      }
      //console.log(business);
      business.partOfChain = this.isPartOfChain(business);
      return business;

    } else {
      console.log('couldn\'t find address related data');
      return false;
    }
  }

}

module.exports = new YelpPageScraper;
