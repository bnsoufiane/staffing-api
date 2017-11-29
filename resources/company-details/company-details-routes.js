'use strict';

const express = require('express');
const router = express.Router();
const CompanyModel = require('../company/company-resource');
const CompanyDetailsModel = require('./company-details-resource');
const auth = require('../../auth');
const AppErr = require('../../error');
const _ = require('underscore');
const utils = require('../../utils');

router.get('/transfer', (req, res) => {
  console.log('starting transfer');
  res.json('working');
  let sourceCompanies = [];
  let targetCompanies = [];

  CompanyModel.find().lean().exec().then(s_comps => {
    sourceCompanies = s_comps;
    console.log(sourceCompanies.length+' in source db');

    CompanyDetailsModel.find().lean().exec().then(t_comps => {
      targetCompanies = t_comps;
      console.log(targetCompanies.length+' in target db');

      let lookup = _.indexBy(targetCompanies, c =>  c.companyName);
      sourceCompanies = _.filter(sourceCompanies, c => {
        return lookup[c.companyName] === undefined;
      });


      console.log(sourceCompanies.length+' companies to transfer');


      let angelCompanies = 0;
      let cbCompanies = 0;
      let owlerCompanies = 0;
      let craftCompanies = 0;
      let otherCompanies = 0;
      let companiesToInsert = [];
      _.each(sourceCompanies, s_comp => {
        //construct t_comp
        let t_comp = {
          acquisitions: [], //done: TODO: get from owler
          acquisitionsNumber: undefined, //done
          angelURL: '',                     //done
          categories: s_comp.categories || [], //done
          cityHeadQuartersIn: s_comp.cityHeadQuartersIn || '', //done
          craftURL: '',                     //done
          crunchBaseURL: '',                //done
          companyName: s_comp.companyName,  //done
          dateFounded: '',                  //done
          description: s_comp.description || '', //done
          edits: [],                       //done
          email: s_comp.email || '',      //done
          facebookLikes: undefined,         //done
          facebookURL: s_comp.facebookURL || '', //done
          foundersNames: s_comp.foundersNames || [], //done
          funding: [],                        //done
          fundingAmount: undefined,           //
          fundingRounds: undefined,          //
          headquartersAddress: s_comp.cityHeadQuartersIn || '', //done
          instagramFollowers: undefined,    //done
          instagramURL: s_comp.instagramURL || '', //done
          investments: [],                  //done
          investors: [],                    //done
          keyPeople: [],                    //done
          lastFundingDate: s_comp.lastFundingDate || '',
          linkedInURL: s_comp.linkedInURL || '', //done
          logo : '',                         //done
          news: [],                         //done
          numberOfEmployees: undefined,    //done
          minNumberOfEmployees: undefined,  //done
          maxNumberOfEmployees: undefined,  //done
          otherLocations: s_comp.otherLocations || [], //done
          owlerURL: '',                   //done
          phone: s_comp.phone || '',      //done
          revenue: undefined,             //done
          source: '',                     //done
          status: s_comp.status || '',    //done
          twitterFollowers: undefined,    //done
          twitterURL: s_comp.twitterURL || '', //done
          websiteLink: s_comp.websiteLink || '', //done
          youtubeURL: s_comp.youtubeURL || '' //done
        };
        //Source, URL
        if (!s_comp.source && s_comp.angelURL) {
          t_comp.source = 'angel';
          t_comp.angelURL = s_comp.angelURL;
          angelCompanies++;
        } else if (s_comp.source.toLowerCase() === 'crunchbase' && s_comp.angelURL) {
          t_comp.source = 'crunchBase';
          t_comp.crunchBaseURL = s_comp.angelURL;
          cbCompanies++;
        } else if(s_comp.source.toLowerCase() === 'crunchbase' && s_comp.crunchBaseURL) {
          t_comp.source = 'crunchBase';
          t_comp.crunchBaseURL = s_comp.crunchBaseURL;
          cbCompanies++;
        } else if(s_comp.source.toLowerCase() === 'owler' && s_comp.angelId) {
          t_comp.source = 'owler';
          t_comp.owlerURL = s_comp.angelId;
          owlerCompanies++;
        } else if(s_comp.source.toLowerCase() === 'craft' && s_comp.craftURL) {
          t_comp.source = 'craft';
          t_comp.craftURL = s_comp.craftURL;
          craftCompanies++;
        } else if(s_comp.source.toLowerCase() === 'crunchbase' && s_comp.url){
          t_comp.source = 'crunchBase';
          t_comp.crunchBaseURL = s_comp.url;
          cbCompanies++;
        } else {
          otherCompanies++;
          console.log('special case:');
          console.log(s_comp);
        }
        if (s_comp.crunchBaseURL && s_comp.crunchBaseURL.toLowerCase().indexOf('crunchbase') !== -1) t_comp.crunchBaseURL = s_comp.crunchBaseURL;

        if (t_comp.crunchBaseURL && t_comp.crunchBaseURL.toLowerCase().indexOf('crunchbase') === -1) {
          t_comp.crunchBaseURL = 'https://www.crunchbase.com/' + t_comp.crunchBaseURL;
        }

        if (t_comp.crunchBaseURL && t_comp.crunchBaseURL.toLowerCase().indexOf('crunchbase.com//organization') !== -1) {
          t_comp.crunchBaseURL = t_comp.crunchBaseURL.replace('crunchbase.com//organization', 'crunchbase.com/organization');
        }
        
        if (t_comp.crunchBaseURL && t_comp.crunchBaseURL.toLowerCase().indexOf('crunchbase.com/https://www.crunchbase') !== -1) {
          t_comp.crunchBaseURL = t_comp.crunchBaseURL.replace('crunchbase.com/https://www.crunchbase', 'crunchbase');
        }

        //acquisitions, acquisitionsNumber
        let acquisitionsNumber = parseInt(s_comp.acquisitionsNumber);
        if (!isNaN(acquisitionsNumber)) t_comp.acquisitionsNumber = acquisitionsNumber;
        let fundingRounds = parseInt(s_comp.fundingRounds);
        if (!isNaN(fundingRounds)) t_comp.fundingRounds = fundingRounds;

        if (s_comp.dateFounded) t_comp.dateFounded = s_comp.dateFounded;
        if (s_comp.keyPeople && s_comp.keyPeople.length > 0) {
          _.each(s_comp.keyPeople, person => {
            let newP = {
              name: person.name || '',
              title: person.title || '',
              email: person.email || '',
              avatar: person.avatar || '',
              linkedIn: person.linkedIn || '',
              facebook: person.facebook || '',
              twitter: person.twitter || '',
              website: person.website || '',
              other: person.other || ''
            };
            t_comp.keyPeople.push(newP);
          });
        }
        if (s_comp.logos) {
          if (s_comp.logos.crunchBaseLogo) t_comp.logo = s_comp.logos.crunchBaseLogo;
          if (s_comp.logos.craftLogo) t_comp.logo = s_comp.logos.craftLogo;
          if (s_comp.logos.otherLogo) t_comp.logo = s_comp.logos.otherLogo;
        }
        _.each([{key:'fundingAmount', value:s_comp.fundingAmount}, {key:'revenue', value:s_comp.revenue}], obj => {
          t_comp[obj.key] = utils.stringToNumber(obj.value);
        });

        if (s_comp.numberOfEmployees) {
          if(s_comp.numberOfEmployees.indexOf('-') !== -1) {
            t_comp.minNumberOfEmployees = utils.stringToNumber(s_comp.numberOfEmployees.substring(0, s_comp.numberOfEmployees.indexOf('-')));
            t_comp.maxNumberOfEmployees = utils.stringToNumber(s_comp.numberOfEmployees.substring(s_comp.numberOfEmployees.indexOf('-')+1));

          } else {
            t_comp.numberOfEmployees = utils.stringToNumber(s_comp.numberOfEmployees);
          }
        }
        if (s_comp.edits) {
          t_comp.edits = {
            companyName: s_comp.edits.companyName || '',
            status: s_comp.edits.status || '',
            description: s_comp.edits.description || '',
            numberOfEmployees: undefined,
            dateFounded: '',
            websiteLink: s_comp.edits.websiteLink || '',
            linkedInURL: s_comp.edits.linkedInURL || '',
            twitterURL: s_comp.edits.twitterURL || '',
            facebookURL: s_comp.edits.facebookURL || '',
            funding: [],
            fundingAmount: undefined,
            fundingRounds: undefined,
            lastFundingDate: s_comp.edits.lastRound || '',
            foundersNames: s_comp.edits.foundersNames || [],
            categories: s_comp.edits.categories || [],
            keyPeople: [],
            revenue: undefined,
            source: s_comp.edits.source || ''
          };
          if (s_comp.edits.dateFounded && s_comp.edits.dateFounded.toLowerCase.indexOf('nan') === -1 &&
            s_comp.edits.dateFounded.toLowerCase.indexOf('undefined') === -1) t_comp.dateFounded = s_comp.edits.dateFounded;
          if (s_comp.edits.numberOfEmployees && s_comp.edits.numberOfEmployees.indexOf('-') !== -1) {
            let NOE = parseInt(s_comp.edits.numberOfEmployees);
            if(!isNaN(NOE)) t_comp.edits.numberOfEmployees = s_comp.edits.numberOfEmployees;
          }
          if (s_comp.edits.fundingRounds) {
            let FR = parseInt(s_comp.edits.fundingRounds);
            if(!isNaN(FR)) t_comp.edits.fundingRounds = s_comp.edits.fundingRounds;
          }
          if (s_comp.edits.fundingAmount) {
            let FA = parseFloat(s_comp.edits.fundingAmount);
            if(!isNaN(FA)) t_comp.edits.fundingAmount = s_comp.edits.fundingAmount;
          }
          if (s_comp.edits.revenue) {
            let r = parseFloat(s_comp.edits.revenue);
            if(!isNaN(r)) t_comp.edits.revenue = s_comp.edits.revenue;
          }
          if (s_comp.edits.keyPeople && s_comp.edits.keyPeople.length > 0) {
            _.each(s_comp.edits.keyPeople, person => {
              let newP = {
                name: person.name || '',
                title: person.title || '',
                email: person.email || '',
                avatar: person.avatar || '',
                linkedIn: person.linkedIn || '',
                facebook: person.facebook || '',
                twitter: person.twitter || '',
                website: person.website || '',
                other: person.other || ''
              };
              t_comp.edits.keyPeople.push(newP);
            });
          }
        }

        //console.log(t_comp.source+ ': angel:'+t_comp.angelURL+' cb:'+t_comp.crunchBaseURL+' owler:'+t_comp.owlerURL+'
        // craft:'+t_comp.craftURL);
        //save t_comp to database
        companiesToInsert.push(t_comp);
      });

      console.log(angelCompanies+ ' companies from angel');
      console.log(cbCompanies+ ' companies from cb');
      console.log(owlerCompanies+ ' companies from owler');
      console.log(craftCompanies+ ' companies from craft');
      console.log(otherCompanies+ ' companies from other');
      console.log((otherCompanies+angelCompanies+cbCompanies+owlerCompanies+craftCompanies)+ ' companies in total');

      CompanyDetailsModel.collection.insert(companiesToInsert, null, () => {
        console.log('done inserting companies');
      })

    });
  });

});

module.exports = router;
