'use strict';

const express = require('express');
const router = express.Router();
const ScrapeManager = require('../../services/scrape-manager');
const JobModel = require('../job/job-resource');
const deepFreeze = require('deep-freeze-strict');
const AppErr = require('../../error');
const ERROR = deepFreeze(
  Object.assign({},
    AppErr.COMMON_ERROR
  )
);
const constants = require('../../constants');

/**
 * Scrape a web site by company type.
 *
 * @swagger
 * /scrape:
 *   get:
 *     tags:
 *     - Scrape
 *     summary: Scrape a web site
 *     description: Scrape a web site by company type.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: types
 *         in: formData
 *         description: scrape type which also represent company
 *         required: true
 *         type: integer
 *       - name: terms
 *         in: formData
 *         description: Search terms.
 *         required: true
 *         type: string
 *       - name: limit
 *         in: formData
 *         description: limit how many records to scrap
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: Successful Operation.
 *       401:
 *         description: unauthorized
 *       404:
 *         description: not found
 *       400:
 *         description: error fetching
 *       500:
 *         description: internal error
 */
router.get('/', (req, res) => {
  console.log('inside scrape');
  ScrapeManager.scrap(
    req.query.type,
    req.query.terms,
    req.query.limit,
    req.models,
    function (resultData) {
      return res.json({result:resultData});
    }
  );
});

/**
 * Scrape for companies.
 *
 * @swagger
 * /scrape/companies:
 *   get:
 *     tags:
 *     - Scrape companies
 *     summary: Scrape companies from the specified source.
 *     description: Scrape companies from the specified source, crunchBase by default.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: category
 *         in: request.query
 *         description: companies category/market/industry we want to scrape, default to all
 *         required: false
 *         type: string
 *       - name: source
 *         in: request.query
 *         description: website we want to do the scraping from. default to crunchBase
 *         required: false
 *         type: string
 *       - name: limit
 *         in: request.query
 *         description: limit how many records to scrape, default to 1000
 *         required: false
 *         type: integer
 *     responses:
 *       200:
 *         description: Successful Operation.
 *       401:
 *         description: unauthorized
 *       404:
 *         description: not found
 *       400:
 *         description: error fetching
 *       500:
 *         description: internal error
 */
router.get('/companies', (req, res) => {
  ScrapeManager.scrapeCompanies(
    req.query.category,
    req.query.source,
    req.query.limit,
    req.query.update,
    function (resultData) {
      return res.json({result:resultData});
    }
  );
});

router.get('/businesses', (req, res) => {
  ScrapeManager.scrapeBusinesses(
    req.query.city,
    req.query.category,
    req.query.source,
    req.query.limit,
    req.query.update,
    function (resultData) {
      return res.json({result:resultData});
    }
  );
});

router.get('/jobs', (req, res) => {
  ScrapeManager.scrapeJobs(
    req.query.city,
    req.query.category,
    req.query.source,
    req.query.limit,
    function (resultData) {
      return res.json({result:resultData});
    }
  );
});

module.exports = router;
