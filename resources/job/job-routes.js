'use strict';

const express = require('express');
const router = express.Router();
const JobModel = require('./job-resource');
const auth = require('../../auth');
const AppErr = require('../../error');


/**
 * List jobs by query
 *
 * @swagger
 * /jobs:
 *   get:
 *     tags:
 *     - Job
 *     summary: List jobs by query
 *     description: List jobs by query. if no query is sent, list all jobs
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successful Operation.
 *         schema:
 *           $ref: '#/definitions/Job'
 *       401:
 *         description: unauthorized
 *       500:
 *         description: internal error
 */

router.get('/', auth.bearer, (req, res, next) => {
  JobModel.fetch(req.query)
  .then(jobs => {
  res.json(jobs);
})
.catch(err => AppErr.reject(err, ERROR.NO_DATA));
});

module.exports = router;
