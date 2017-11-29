'use strict';

const express = require('express');
const router = express.Router();

const AppErr = require('../../error');
const constants = require('../../constants');
const logging = require('../../services/logging')();

const RoleModel = require('./roles-resource');

/**
 * List all roles
 *
 * @swagger
 * /roles:
 *   get:
 *     tags:
 *     - Role
 *     summary: List all roles
 *     description: List all roles
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successful Operation.
 *       500:
 *         description: internal error
 */
router.get('/', (req, res, next) => {
  logging.info('List all roles');
  RoleModel.list()
  .then(data => res.json(data))
  .catch(err => next(AppErr.handle(err, RoleModel.ERROR.LIST)));
});



/**
 *
 */
module.exports = router;
