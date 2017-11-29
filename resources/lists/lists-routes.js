'use strict';

const express = require('express');
const router = express.Router();
const AppErr = require('../../error');
const ListsModel = require('./lists-resource');
const CompanyModel = require('../company/company-resource');
const auth = require('../../auth');
const constants = require('../../constants');
const esCompany =
  require('../../services/elasticsearch')({
    type: constants.ELASTIC_TYPES.COMPANY
  });


//add proposal routes here
/**
 * List all lists
 *
 * @swagger
 * /lists:
 *   get:
 *     tags:
 *     - list
 *     summary: List all lists
 *     description: List all lists.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successful Operation.
 *         schema:
 *           $ref: '#/definitions/List'
 *       401:
 *         description: unauthorized
 *       500:
 *         description: internal error
 */
router.get('/', auth.bearer, (req, res, next) => {
  console.log('List all lists');
  ListsModel.findAsync({}, null, {sort: {createdAt: 'desc'}})
    .then(lists => res.json(lists))
    .catch(err => next(AppErr.handle(err, ListsModel.ERROR.LIST)));
});


/**
 * Defining the listId parameter, and defining the dependent endpoints afterwards.
 */
router.param('id', (req, res, next, id) => {
  ListsModel.findByIdAsync(id)
    .then(list => {
      if (!list) return AppErr.reject(null, ListsModel.ERROR.NOT_FOUND);
      req.data.list = list;
      next();
    })
    .catch(err => next(AppErr.handle(err, ListsModel.ERROR.GENERIC)));
});

/**
 * Get list
 *
 * @swagger
 * /lists/:id:
 *   get:
 *     tags:
 *     - list
 *     summary: Get list by id
 *     description: Get list by id
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successful Operation.
 *         schema:
 *           $ref: '#/definitions/List'
 *       401:
 *         description: unauthorized
 *       500:
 *         description: internal error
 */
router.get('/:id', (req, res, next) => {
  console.log('Get list by id');
  let returnedObj = {
    list: req.data.list,
    listCompanies: []
  };
  console.log(returnedObj.list.companies);
  if (returnedObj.list.companies && returnedObj.list.companies.length > 0) {
    esCompany.getByIds(returnedObj.list.companies)
      .then(result => {
        console.log(result);
        returnedObj.listCompanies = result;
        res.json(returnedObj);
      })
      .catch(err => next(AppErr.handle(err, CompanyModel.ERROR.NO_DATA)));
  } else {
    res.json(returnedObj);
  }

});



/**
 * Defining the userId parameter, and defining the dependent endpoints afterwards.
 */
router.param('userId', (req, res, next, userId) => {
  ListsModel.findAsync({userId: userId}, null, {sort: {createdAt: 'desc'}})
    .then(lists => {
      req.data.lists = lists;
      next();
    })
    .catch(err => next(AppErr.handle(err, ListsModel.ERROR.GENERIC)));
});

/**
 * Get lists by userId
 *
 * @swagger
 * /lists/user/:userId:
 *   get:
 *     tags:
 *     - list
 *     summary: Get lists by userId
 *     description: Get lists by userId
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successful Operation.
 *         schema:
 *           $ref: '#/definitions/List'
 *       401:
 *         description: unauthorized
 *       500:
 *         description: internal error
 */
router.get('/user/:userId', (req, res, next) => {
  console.log('Get lists by userId');
  res.json(req.data.lists);
});

/**
 * Delete list
 *
 * @swagger
 * /lists/:id:
 *   delete:
 *     tags:
 *     - list
 *     summary: Delete list by id
 *     description: Delete list by id
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successful Operation.
 *       401:
 *         description: unauthorized
 *       500:
 *         description: internal error
 */
router.delete('/:id', (req, res, next) => {
  console.log('Delete list by id');
  let list = req.data.list;
  list.removeAsync()
    .then(list => res.json('list deleted successfully'))
    .catch(err => next(AppErr.handle(err, ListsModel.ERROR.DELETE)));
});


/**
 * Create a list
 *
 * @swagger
 * /lists:
 *   post:
 *     tags:
 *     - list
 *     summary: Create list
 *     description: Create list with form fields
 *     produces:
 *       - application/json
 *     parameters:
 *       name:
 *         type: string
 *       userId:
 *         type: string
 *       companies:
 *         type: array
 *         items:
 *           type: string
 *       jobs:
 *         type: array
 *         items:
 *           type: string
 *       businesses:
 *         type: array
 *         items:
 *           type: string
 *       sharedWithUsers:
 *         type: array
 *         items:
 *           type: string
 *       sharedWithTeams:
 *         type: array
 *         items:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful Operation.
 *         schema:
 *           $ref: '#/definitions/List'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 *
 */
router.post('/', auth.bearer,
  (req, res, next) => {
    console.log('list CREATE route activated');
    ListsModel.validate(req.body, 'create')
    .catch(err => AppErr.reject(null, err))
    .then(list => {
      try {
        list = new ListsModel(list);

        return list.saveAsync()
        .then(list => list[0])
        .catch(err => AppErr.reject(err, ListsModel.ERROR.CREATE));
      } catch (err) {
        AppErr.reject(err, ListsModel.ERROR.CREATE);
      }
    })
    .then(list => res.json(list))
    .catch(err => next(AppErr.handle(err, ListsModel.ERROR.GENERIC)));
  });

/**
 * Update a list
 *
 * @swagger
 * /lists:
 *   put:
 *     tags:
 *     - list
 *     summary: Create list
 *     description: Create list with form fields
 *     produces:
 *       - application/json
 *     parameters:
 *       _id:
 *         type: string
 *       name:
 *         type: string
 *       userId:
 *         type: string
 *       companies:
 *         type: array
 *         items:
 *           type: string
 *       jobs:
 *         type: array
 *         items:
 *           type: string
 *       businesses:
 *         type: array
 *         items:
 *           type: string
 *       sharedWithUsers:
 *         type: array
 *         items:
 *           type: string
 *       sharedWithTeams:
 *         type: array
 *         items:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful Operation.
 *         schema:
 *           $ref: '#/definitions/List'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 *
 */
router.put('/', auth.bearer,
  (req, res, next) => {
    console.log('list UPDATE route activated');
    ListsModel.validate(req.body, 'update')
      .catch(err => AppErr.reject(null, err))
      .then(list => {
        try {
          return ListsModel.findByIdAndUpdateAsync(list._id, list, {new: true})
            .then(list => {
              return list;
            })
            .catch(err => AppErr.reject(err, ListsModel.ERROR.UPDATE));
        } catch (err) {
          AppErr.reject(err, ListsModel.ERROR.UPDATE);
        }

      })
      .then(list => res.json(list))
      .catch(err => next(AppErr.handle(err, ListsModel.ERROR.GENERIC)));
  });

module.exports = router;
