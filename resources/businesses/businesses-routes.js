'use strict';

const express = require('express');
const router = express.Router();
const BusinessesModel = require('./businesses-resource');
const auth = require('../../auth');
const AppErr = require('../../error');

/**
 * List companies by query
 *
 * @swagger
 * /businesses:
 *   get:
 *     tags:
 *     - business
 *     summary: List businesses by query
 *     description: List businesses by query. if no query is sent, list all businesses
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successful Operation.
 *         schema:
 *           $ref: '#/definitions/Business'
 *       401:
 *         description: unauthorized
 *       500:
 *         description: internal error
 */
router.get('/', auth.bearer, (req, res, next) => {
  BusinessesModel.fetch(req.query)
  .then(businesses => res.json(businesses))
  .catch(err => next(AppErr.handle(err, BusinessesModel.ERROR.NO_DATA)));
});

module.exports = router;
