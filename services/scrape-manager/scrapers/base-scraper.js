/**
 * @fileoverview base-scrap.
 */
'use strict';
const _ = require('underscore');
const constants = require('../../../constants');
const Promise = require('bluebird');
var Nightmare = require('nightmare');
const companyModel = require('../../../resources/company/company-resource');
const ProxiesManager = require('./proxies/proxies-manager');
const esCompany = require('../../elasticsearch')({
    type: constants.ELASTIC_TYPES.COMPANY
  });

/** Class BaseScrap. */
class BaseScraper {
  /**
   * Create a scraper
   */
  constructor () {
    this.urlsService = null; //should be set for each source
    this.items = [];
    this.insertedItems = [];
    this.proxies = [{ip: '', used: 0, success: 0, fail: 0, valid: true, source:'local'}];
    this.minutesElapsed = 0;
    this.itemsNumber = 0; //we need it for tracking number of items added
    //this.scrapedItemsNumber = 0; //we need it for tracking number of items added
    this.retryTimer = null;
    this.periodicUpdatesTimer = null;
    this.hitsPerLoop = 5;
    this.urlsToScrape = [];
    this.filter = '';
    this.scrapingLimit = 10000;
    this.useProxies = true;
    this.useProxiesStream = true;
    this.proxiesSources = [constants.PROXY_SOURCE.all];
    this.urlsPerBulk = 10;
    this.scrapersName = 'base Scraper';
    this.mainHtmlElement = 'body'; //ideally should be overwritten by child class
    this.itemsModel = companyModel; //default model is companies model, overwrite by child class if needed
    this.useElastic = false;
    this.elasticModel = esCompany; //default elastic service, overwrite by child class if needed
  }

  /**
   * main Entry for scrape script
   * @param filter
   * @param limit
   * @param cb
   */
  startScrapeService(filter, limit, cb) {
    if (filter) this.filter = filter;
    if (limit && parseInt(limit) > 0) this.scrapingLimit = parseInt(limit);

    //avoiding app rerun if it's already running
    if (this.processRunning) {
      console.log('looks like a process is already running');
      cb('working..');
      return;
    }

    this.processRunning = true;
    try {
      console.log('starting '+this.scrapersName);
      //getting items from database
      console.log('getting items from db');

      this.getItemsFromDb().then((items) => {

        cb('working...');
        this.items = items;
        this.itemsNumber = this.items.length;
        console.log(this.itemsNumber+' items are in DB');

        if (this.useProxies) {
          //getting proxies
          console.log('getting proxies');
          ProxiesManager.getProxiesList(this.proxiesSources).then((proxiesList)=>{
            this.proxies =  _.uniq(this.proxies.concat(proxiesList), 'ip');
            console.log(this.proxies.length+' proxies returned');

            this.initScrapingJob();
            this.periodicUpdates();
          });
          if (this.useProxiesStream) {
            ProxiesManager.getProxiesStream(20, (proxy)=> {
              if (!_.find(this.proxies, (p) => p.ip === proxy.ip )) {
                this.proxies.push({ip: proxy, success: 0, fail: 0, used: 0, valid: true, source: 'proxyListServer'});
              }
            });
          }
        } else {
          this.initScrapingJob();
          this.periodicUpdates();
        }

      }).catch((err) => {
        console.log('err getting list of items from db: ');
        console.log(err);
      });
    } catch(error) {
      console.log('error getting list of items from db.');
      console.log(error);
    }

  }

  /**
   * getting items from db
   * @returns {Promise}
   */
  getItemsFromDb() {
    if (this.useElastic) {
      return new Promise((resolve, reject) => {
        this.elasticModel.getAll()
        .then(result => {
          let companies = _.map(result, r => r._source);
          resolve(companies);
        })
        .catch(err => {
          console.log(err);
          reject();
        });
      });
    } else {
      return this.itemsModel.find().lean().exec();
    }
  }

  /**
   * start the scraping
   */
  initScrapingJob() {
    if (this.urlsToScrape.length > 0) {
      let promises = [];
      let items = [];

      //remove existing items form items to scrap
      let urlIndex = 'url';
      let nameIndex = 'companyName';
      if (this.scrapersName === 'Indeed Scraper') urlIndex = 'jobLink';
      if (this.scrapersName === 'Craft Scraper') urlIndex = 'craftURL';
      if (this.scrapersName === 'CrunchBase Scraper') urlIndex = 'crunchBaseURL';
      if (this.scrapersName === 'Owler Scraper') urlIndex = 'owlerURL';
      if (this.scrapersName === 'Angel Scraper') urlIndex = 'angelURL';
      if (this.scrapersName === 'Yelp Scraper') {
        urlIndex = 'yelpUrl';
        nameIndex = 'name';
      }

      this.urlsToScrape = _.filter(this.urlsToScrape, (item) => {
        return !(_.findWhere(this.items, {[nameIndex]:item.name}) || _.findWhere(this.items, {[urlIndex]:item.url}));
      });
      console.log(this.urlsToScrape.length+' items in queue');

      for (let i = 0; i < this.hitsPerLoop && i < this.urlsToScrape.length; i++) {
        items.push(this.urlsToScrape[i]);
      }

      items.forEach((item, i) => {
        promises.push(new Promise((resolve) => {
          setTimeout(()=>{
            this.scrapeItemPage(item, resolve);
          }, i*1000);
        }));
      });

      // All promises have resolved.
      Promise.all(promises).then(() => {
        console.log('done working on previous bulk!');
        if (this.insertedItems.length < this.scrapingLimit) {
          this.initScrapingJob();
        } else {
          console.log('limit of items to scrap reached');
          this.processRunning = false;
          clearInterval(this.periodicUpdatesTimer);
        }
      });

    } else {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = setTimeout(()=>{
        console.log('getting list of urls');
        this.urlsService.getURLs(this.items, this.filter, this.urlsPerBulk).then((urls) => {
          console.log(urls.length+' url returned');
          this.urlsToScrape = urls;
          this.initScrapingJob();
        });
      }, 5000);
    }
  }

  _handleHtml(html, urlData, proxyIndex, resolve) {
    try {
      let item = null;
      if (urlData.html) {
        item = this.parseHTMLForItemData(urlData);
      } else {
        item = this.parseHTMLForItemData(html, urlData);
      }
      if (item) {
        if (this.useProxies) {
          this.proxies[proxyIndex].success++;
          this.proxies[proxyIndex].fail = 0;
        }
        this.urlsToScrape = this.urlsToScrape.filter((obj) => {
          return (obj.url !== item.craftURL &&
                  obj.url !== item.crunchBaseURL &&
                  obj.url !== item.jobLink &&
                  obj.url !== item.yelpUrl);
        });

        this.saveItemToDb(item)
          .catch(()=>resolve())
          .then(()=>resolve());

      } else {
        console.log('nightmare: page doesn\'t contain the data needed, needs to double check');
        resolve();
      }
    }
    catch (err) {
      console.log('nightmare: error occurred: '+err);
      if (this.useProxies) this.proxies[proxyIndex].fail++;
      resolve();
      return null;
    }
  }

  /**
   * scraping item page with nightmare
   * @param urlData
   * @param resolve
   */
  scrapeItemPage(urlData, resolve) {
    if (urlData.html) {
      this._handleHtml(false, urlData, false, resolve);
    } else {
      let options = {
        show:false
      };

      let proxyIndex = 0;
      if (this.useProxies) {
        proxyIndex = this.getAndUpdateProxiesStatus();
        if (proxyIndex !== false) {
          this.proxies[proxyIndex].used++;

          if (this.proxies[proxyIndex].ip !== '') {
            options['switches'] = {
              'proxy-server': this.proxies[proxyIndex].ip
            };
          }
        }
      }

      let _nightmareInstance = Nightmare(options);
      var targetElement = this.mainHtmlElement;
      _nightmareInstance
        .goto(urlData.url)
        .wait(10000)
        .evaluate((targetElement) => {
          return document.querySelector(targetElement).outerHTML;
        }, targetElement)
        .end()
        .then((html) => {
          this._handleHtml(html, urlData, proxyIndex, resolve);
        })
        .catch((error) => {
          if (this.useProxies) this.proxies[proxyIndex].fail++;
          if (error && error.code) {
            console.log('error:'+error.code);
          } else {
            console.log(error);
            if (this.useProxies) {
              console.log('invalidating proxy');
              this.proxies[proxyIndex].valid = false;
            }
          }
          resolve();
        });
    }

  }

  /**
   * running a setInterval that
   *   - prints a report to the screen
   *   - get more proxies if we're running out of proxies
   */
  periodicUpdates() {
    //we update list of items every 5 minutes.
    this.periodicUpdatesTimer = setInterval(()=> {
      this.minutesElapsed++;

      if (this.useProxies) {
        //creating proxies report
        let usedProxies = _.filter(this.proxies, p => p.used > 0);
        let successProxies = _.filter(this.proxies, p => p.success > 0);

        let validProxies = _.filter(this.proxies, p => p.valid);
        let expiredProxies = _.filter(this.proxies, p => p.success > 0 && !p.valid);
        let minExp = 0, maxExp = 0, midExp = 0;
        if (expiredProxies.length > 0) {
          minExp = expiredProxies[0].used;
          maxExp = expiredProxies[0].used;
          _.each(expiredProxies, (p)=> {
            minExp = (p.used < minExp) ? p.used : minExp;
            maxExp = (p.used > maxExp) ? p.used : maxExp;
            midExp += p.used;
          });
          midExp = midExp/expiredProxies.length;
        }

        console.log('proxies status:');
        console.log('------------------------------------------------------------------------');
        console.log(this.proxies.length+' proxies in total');
        console.log(validProxies.length+' valid proxy remains');
        console.log('Total: '+usedProxies.length+' proxy used - success: '+successProxies.length+' %: '
          +parseInt(100*successProxies.length/usedProxies.length));
        console.log('Expired proxies: '+expiredProxies.length);
        if (expiredProxies.length > 0)
          console.log('minExp: '+minExp+' maxExp: '+maxExp+' midExp: '+midExp);
        console.log('------------------------------------------------------------------------');

        //get more proxies if we're running out of valid ones
        if (validProxies.length < 10) {
          ProxiesManager.getProxiesList(this.proxiesSources).then((proxiesList)=>{
            this.proxies = _.uniq(this.proxies.concat(proxiesList), 'ip');
          });
        }
      }

      console.log(this.insertedItems.length+' items were added from this session in total in '+this.minutesElapsed+' minutes');

    }, 60000);
  }

  /**
   * get a proxy index from the list, update list of proxies if needed
   * @returns {*}
   */
  getAndUpdateProxiesStatus() {
    //we invalidate proxies that failed 2 or more times in a row
    _.each(this.proxies, (p)=> {
      if (p.fail > 0 && p.success === 0 &&  p.valid) p.valid = false;
      if (p.fail > 2 && p.success > 0 &&  p.valid) p.valid = false;
    });

    //we return a random proxy from proxies that have been least used
    let leastUsedTimes = 100000000;
    _.each(this.proxies, (p) => {
      if (p.used < leastUsedTimes && p.valid) leastUsedTimes = p.used;
    });
    let leastUsedProxies = [];
    _.each(this.proxies, (p, i) => {
      if (p.used === leastUsedTimes && p.valid)
        leastUsedProxies.push(i);
    });
    if (leastUsedProxies.length > 0) {
      return _.sample(leastUsedProxies);
    }
    else {
      console.log('no more valid proxies');
      return false;
    }
  }

  /**
   * saving item to database if it doesn't exist
   * @param item
   */
  saveItemToDb(item) {
    let name = '';
    if(item.companyName) name = item.companyName;
    if(item.name) name = item.name;
    if(item.title) name = item.title;

    return new Promise((resolve, reject) => {
      if (!this.useElastic) {
        this.itemsModel.createOne(item)
          .then((insertedItem) => {
            if (insertedItem) {
              this.insertedItems.push(insertedItem);
              this.items.push(insertedItem);
              console.log(name+': item added! '+this.insertedItems.length);
            } else {
              console.log('createOne succeeded but returned an empty result');
            }
            resolve();
          })
          .catch( err => {
            console.log('error in createOne for '+name);
            console.log(err);
            reject();
          } );
      } else {
        console.log('init adding '+name+' to db');
        try {
          this.elasticModel.insert(item)
            .then((insertedItem) => {
              if (insertedItem) {
                this.insertedItems.push(item);
                this.items.push(item);
                console.log(name+': item added! '+this.insertedItems.length);
              } else {
                console.log('elastic insert succeeded but returned an empty result');
              }
              resolve();
            })
            .catch( err => {
              console.log('error in createOne for '+name);
              console.log(err);
              reject();
            } );
        } catch (err) {
          console.log(err);
        }

      }

    });
  }

}

module.exports = BaseScraper;
