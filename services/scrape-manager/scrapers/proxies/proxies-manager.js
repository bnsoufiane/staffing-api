/**
 * @fileoverview proxies manager.
 */
'use strict';
const cheerio = require('cheerio');
const constants = require('../../../../constants');
const request = require('request-promise');
const _ = require('underscore');
const Promise = require('bluebird');
var Nightmare = require('nightmare');

/** Class proxiesManager. */
class proxiesManager {
  /**
   * Create a proxies manager
   */
  constructor() {
    this.proxiesList = [];
  }

  /**
   * returns a number of proxies per minute, max 20
   * queries APIs that return 1 proxy at a time
   * @param proxiesPerMinute
   * @param callback
     */
  getProxiesStream(proxiesPerMinute, callback) {
    setInterval(()=> {
      this.getProxiesFromGimmeProxy().then((proxy) => {
        callback(proxy);
      }).catch(()=> {
        console.log('Error: couldnt get proxy from GimmeProxy');
      });
    }, parseInt(60000/proxiesPerMinute));
  }

  /**
   * returns a list of proxies scrapped from the specified sources
   * @param sources
   */
  getProxiesList(sources) {
    let promises = [];
    if (!sources) sources = [];

    _.each(sources, (source) => {
      switch(source) {
        case constants.PROXY_SOURCE.USProxy:
          promises.push(this.getProxiesFromUSProxy());
          break;
        case constants.PROXY_SOURCE.UKProxy:
          promises.push(this.getProxiesFromUKProxy());
          break;
        case constants.PROXY_SOURCE.proxyServerList:
          promises.push(this.getProxiesFromProxyServerList());
          break;
        case constants.PROXY_SOURCE.inCloak:
          promises.push(this.getProxiesFromInCloak());
          break;
        case constants.PROXY_SOURCE.hideMyAss:
          promises.push(this.getProxiesFromHideMyAss());
          break;
        default:
          promises = [
            this.getProxiesFromHideMyAss(),
            this.getProxiesFromUSProxy(),
            this.getProxiesFromUKProxy(),
            this.getProxiesFromProxyServerList(),
            this.getProxiesFromInCloak()
          ];
      }
    });

    return new Promise((resolve)=> {
      Promise.all(promises).then(() => {
        console.log('done getting list of proxies!');
        resolve(this.proxiesList);
      });
    });
  }

  /**
   * get a random proxy from gimmeproxy.com
   */
  getProxiesFromGimmeProxy() {
    let options = {
      method: 'GET',
      uri: 'http://gimmeproxy.com/api/getProxy',
      json: true
    };

    return new Promise((resolve, reject)=> {
      request(options)
        .then((response) => {
          if(response.ipPort) {
            resolve({ip:response.ipPort, success: 0, fail:0, used: 0, valid: true, source:'gimmeProxy'});
          } else {
            console.log('response didn\'t return any ipPort');
            reject();
          }

        })
        .catch(() => {
          reject();
        });
    });
  }

  /**
   * scrap proxyserverlist-24.blogspot.com for proxies
   */
  getProxiesFromProxyServerList() {
    let options = {
      method: 'GET',
      uri: 'http://proxyserverlist-24.blogspot.com/'
    };

    return new Promise((resolve)=> {
      request(options)
        .then((html) => {
          let $ = cheerio.load(html);
          let links = $('#main').find('.jump-link a');
          let link = '';
          for (let i = 0; i < links.length; i++) {
            link = $(links[i]).attr('href');
            if (link.indexOf('free-proxy-server-list') !== -1) break;
          }
          if (link) {
            console.log('getting proxyServerList link success');
            console.log(link);
            options = {
              method: 'GET',
              uri: link
            };
            request(options)
              .then((html) => {
                let $ = cheerio.load(html);
                let proxies = $('pre span').find('span').eq(1).text().trim();
                let proxiesTable = proxies.split('\n');
                _.each(proxiesTable, (proxy)=> {
                  if (!_.find(this.proxiesList, (p) => p.ip === proxy )) {
                    this.proxiesList.push({ip: proxy, success: 0, fail: 0, used: 0, valid: true, source: 'proxyListServer'});
                  }
                });
                resolve();
              })
              .catch(() => {
                console.log('couldnt get proxies from link');
                resolve();
              });
          } else {
            console.log('couldnt find any url for free proxies');
            resolve();
          }

        })
        .catch(() => {
          resolve();
        });
    });
  }

  /**
   * get proxies from hidemyass.com
   */
  getProxiesFromHideMyAss() {
    //from hidemyass.com
    //url1: http://proxylist.hidemyass.com/search-1656054#listable
    //url2: http://proxylist.hidemyass.com/search-1655696#listable
    return new Promise((resolve)=> {
      var nightmare = Nightmare({show:false});
      nightmare
        .goto('http://proxylist.hidemyass.com/search-1659252#listable')
        .evaluate(() => {
          return document.querySelector('table#listable').outerHTML;
        })
        .end()
        .then((data) => {
          this.getProxyAttempt = 0;
          try {
            let $ = cheerio.load(data);
            let proxiesRows = $('tbody').find('tr');
            _.each(proxiesRows, (row) => {
              let rowElmts = [];
              let style = '';
              let td = $(row).find('td').eq(1).find('> span');

              _.each($(td).contents(), elmt => {
                if(elmt.nodeType === 1 && elmt.tagName.toLowerCase() === 'style') {
                  style = $(elmt).text();
                } else {
                  let text = $(elmt).text().trim();
                  let elmtStyle = $(elmt).attr('style');
                  if(text !== '.' && text !== '' && elmtStyle !== 'display:none') {
                    rowElmts.push({
                      text: text,
                      class: $(elmt).attr('class') || ''
                    });
                  }
                }
              });

              let classes = style.match(/\.([^{]+){/g);
              let styles = style.match(/{([^}]+)}/g);
              let proxy = '';
              _.each(rowElmts, (e) => {
                if(e.class === '' || styles[classes.indexOf('.'+e.class+'{')] !== '{display:none}') {
                  if(proxy !== '') proxy += '.';
                  if(e.text[0] === '.') e.text = e.text.slice(1);
                  if(e.text[e.text.length - 1] === '.') e.text = e.text.slice(0, -1);
                  proxy += e.text;
                }
              });
              proxy += ':'+$(row).find('td').eq(2).text().trim();
              if(!_.find(this.proxiesList, function(p) {return p.ip === proxy})) {
                this.proxiesList.push({ip:proxy, success: 0, fail:0, used: 0, valid: true, source:'hideMyAss'});
              }
            });
            console.log('getting HMA proxies succeeded');
            resolve();
          }
          catch (err) {
            console.log('nightmare: error occurred getting list of proxies: '+err);
            resolve();
          }
        })
        .catch(() => {
          console.log('nightmare: getting proxies from HMA failed');
          resolve();
        });
    });
  }

  /**
   * get proxies from us-proxy.org
   */
  getProxiesFromUSProxy() {
    //from us-proxy.org
    let options = {
      method: 'GET',
      uri: 'https://www.us-proxy.org/'
    };
    return new Promise((resolve)=> {
      request(options)
        .then((response) => {
          let $ = cheerio.load(response);
          let proxiesRows = $('tbody').find('tr');
          _.each(proxiesRows, (row) => {
            let proxy = $(row).find('td').eq(0).text().trim()+':'+$(row).find('td').eq(1).text().trim();
            if(!_.find(this.proxiesList, function(p) {return p.ip === proxy})) {
              this.proxiesList.push({ip:proxy, success: 0, fail:0, used: 0, valid: true, source:'usProxy'});
              resolve();
            }
          });
        })
        .catch(() => {
          console.log('US-PROXY IP:ERROR');
          resolve();
        });
    });
  }

  /**
   * get proxies from free-proxy-list.net/uk-proxy.html
   */
  getProxiesFromUKProxy() {
    let options = {
      method: 'GET',
      uri: 'http://free-proxy-list.net/uk-proxy.html'
    };
    return new Promise((resolve)=> {
      request(options)
        .then((response) => {
          let $ = cheerio.load(response);
          let proxiesRows = $('tbody').find('tr');
          _.each(proxiesRows, (row) => {
            let proxy = $(row).find('td').eq(0).text().trim() + ':' + $(row).find('td').eq(1).text().trim();
            if (!_.find(this.proxiesList, (p) => p.ip === proxy)) {
              this.proxiesList.push({ip: proxy, success: 0, fail: 0, used: 0, valid: true, source: 'ukProxy'});
            }
          });
          resolve();
        })
        .catch(() => {
          console.log('UK-PROXY IP:ERROR');
          resolve();
        });
    });
  }

  /**
   * get proxies from incloak.com
   */
  getProxiesFromInCloak() {
    //only https: https://incloak.com/proxy-list/?type=s#list
    return new Promise((resolve) => {
      var nightmare = Nightmare({show:false});
      nightmare
        .goto('https://incloak.com/proxy-list/?maxtime=2000&type=hs#list')
        .evaluate(() => {
          return document.querySelector('table.proxy__t').outerHTML;
        })
        .end()
        .then((data) => {
          try {
            let $ = cheerio.load(data);
            let proxiesRows = $('tbody').find('tr');
            _.each(proxiesRows, (row) => {
              let proxy = $(row).find('td.tdl').text().trim()+':'+$(row).find('td.tdl').next().text().trim();
              if(!_.find(this.proxiesList, function(p) {return p.ip === proxy})) {
                this.proxiesList.push({ip:proxy, success: 0, fail:0, used: 0, valid: true, source:'inCloak'});
              }
            });

            ///this.proxies = _(this.proxies).sortBy((obj) => { retsrn +obj.speed });
            resolve();
          }
          catch (err) {
            console.log('nightmare: error occurred getting list of proxies: '+err);
            resolve();
          }
        })
        .catch((error) => {
          console.log('nightmare: getting proxies failed:', error);
          resolve();
        });
    });

  }

}

module.exports = new proxiesManager;
