'use strict';

const express = require('express');
const router = express.Router();
const CompanyModel = require('./company-resource');
const auth = require('../../auth');
const AppErr = require('../../error');

/**
 * List companies by query
 *
 * @swagger
 * /companies:
 *   get:
 *     tags:
 *     - Company
 *     summary: List companies by query
 *     description: List companies by query. if no query is sent, list all companies
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successful Operation.
 *         schema:
 *           $ref: '#/definitions/Company'
 *       401:
 *         description: unauthorized
 *       500:
 *         description: internal error
 */
router.get('/', auth.bearer, (req, res, next) => {
  CompanyModel.fetch(req.query)
  .then(companies => res.json(companies))
  .catch(err => next(AppErr.handle(err, CompanyModel.ERROR.NO_DATA)));
});

/**
 * Defining the companyId parameter, and defining the dependent endpoints afterwards.
 */
router.param('id', (req, res, next, id) => {
  CompanyModel.getById(id)
  .then(company => {
    req.data.company = company;
    next();
  })
  .catch(err => next(AppErr.handle(err, CompanyModel.ERROR.GENERIC)));
});

/**
 * Get company
 *
 * @swagger
 * /companies/:id:
 *   get:
 *     tags:
 *     - Company
 *     summary: Get company by id
 *     description: Get company by id
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successful Operation.
 *         schema:
 *           $ref: '#/definitions/Proposal'
 *       401:
 *         description: unauthorized
 *       500:
 *         description: internal error
 */
router.get('/:id', (req, res, next) => {
  res.json(req.data.company);
});

/**
 * Update company info in edit layer
 *
 * @swagger
 * /companies:
 *   put:
 *     tags:
 *     - Company
 *     summary: Update company info
 *     description: Update company info and store in edit layer without changing original info
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: _id
 *         type: string
 *         description: _id of company document
 *         required: true
 *       - name: source
 *         type: string
 *         description: Who is editing. It will be user when editing from client forms. Or it can by any scrape source like crunchbase, craft etc
 *         required: true
 *       - name: companyName
 *         type: string
 *       - name: description
 *         type: string
 *       - name: foundersNames
 *         type: array
 *         items:
 *           type: string
 *         in: formData
 *       - name: categories
 *         type: array
 *         items:
 *           type: string
 *       - name: keyPeople
 *         type: array
 *         items:
 *           type: object
 *           schema:
 *            $ref: '#/definitions/KeyPeople'
 *     responses:
 *       200:
 *         description: Successful Operation.
 *         schema:
 *           $ref: '#/definitions/Company'
 *       401:
 *         description: unauthorized
 *       500:
 *         description: internal error
 */
router.put('/', auth.bearer,
  (req, res, next) => {
    CompanyModel.validate(req.body)
    .catch(err => AppErr.reject(null, err))
    .then(edits => CompanyModel.updateEdits(edits))
    .then(company => res.json(company))
    .catch(err => next(AppErr.handle(err, CompanyModel.ERROR.GENERIC)));
  });


module.exports = router;
