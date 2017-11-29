'use strict';

const express = require('express');
const router = express.Router();
const AppErr = require('../../error');
const ProposalModel = require('./proposals-resource');
const auth = require('../../auth');

//add proposal routes here
/**
 * List all proposals
 *
 * @swagger
 * /proposals:
 *   get:
 *     tags:
 *     - Proposal
 *     summary: List all proposals
 *     description: List all proposals.
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
router.get('/', auth.bearer, (req, res, next) => {
  console.log('List all proposals');
  ProposalModel.findAsync({}, null, {sort: {createdAt: 'desc'}})
    .then(proposals => res.json(proposals))
    .catch(err => next(AppErr.handle(err, ProposalModel.ERROR.LIST)));
});


/**
 * Defining the userId parameter, and defining the dependent endpoints afterwards.
 */
router.param('id', (req, res, next, id) => {
  ProposalModel.findByIdAsync(id)
    .then(proposal => {
      if (!proposal) return AppErr.reject(null, ProposalModel.ERROR.NOT_FOUND);
      req.data.proposal = proposal;
      next();
    })
    .catch(err => next(AppErr.handle(err, ProposalModel.ERROR.GENERIC)));
});

/**
 * Get proposal
 *
 * @swagger
 * /proposals/:id:
 *   get:
 *     tags:
 *     - Proposal
 *     summary: Get proposal by id
 *     description: Get proposal by id
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
  console.log('Get proposal by id');
  res.json(req.data.proposal);
});

/**
 * Delete proposal
 *
 * @swagger
 * /proposals/:id:
 *   delete:
 *     tags:
 *     - Proposal
 *     summary: Delete proposal by id
 *     description: Delete proposal by id
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
  console.log('Delete proposal by id');
  let proposal = req.data.proposal;
  proposal.removeAsync()
    .then(proposal => res.json('Proposal deleted successfully'))
    .catch(err => next(AppErr.handle(err, ProposalModel.ERROR.DELETE)));
});


/**
 * Create a proposal
 *
 * @swagger
 * /proposals:
 *   post:
 *     tags:
 *     - Proposal
 *     summary: Create proposal
 *     description: Create proposal with form fields
 *     produces:
 *       - application/json
 *     parameters:
 *       name:
 *         type: string
 *       subhead:
 *         type: string
 *       overview:
 *         type: string
 *       overview_inactive:
 *         type: boolean
 *       scope_of_work:
 *         type: string
 *       scope_of_work_inactive:
 *         type: boolean
 *       inserts:
 *         type: array
 *         items:
 *          type: object
 *          schema:
 *            $ref: '#/definitions/Insert'
 *       inserts_inactive:
 *         type: boolean
 *       breakdown:
 *         type: object
 *         schema:
 *          $ref: '#/definitions/Breakdown'
 *       breakdown_inactive:
 *         type: boolean
 *       timeline:
 *         type: object
 *         schema:
 *          $ref: '#/definitions/Breakdown'
 *       timeline_inactive:
 *         type: boolean
 *       steps:
 *         type: object
 *         schema:
 *          $ref: '#/definitions/Steps'
 *       steps_inactive:
 *         type: boolean
 *       candidate_ids:
 *         type: array
 *         items:
 *          type: string
 *          required: true
 *       candidate_ids_inactive:
 *         type: boolean
 *       portfolio_ids:
 *         type: array
 *         items:
 *          type: number
 *       portfolio_ids_inactive:
 *         type: boolean
 *     responses:
 *       200:
 *         description: Successful Operation.
 *         schema:
 *           $ref: '#/definitions/Proposal'
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
    console.log('Proposal CREATE route activated');
    ProposalModel.validate(req.body, 'create')
      .catch(err => AppErr.reject(null, err))
      .then(proposal => {
        proposal = new ProposalModel(proposal);
        return proposal.saveAsync()
          .then(proposal => proposal[0])
          .catch(err => AppErr.reject(err, ProposalModel.ERROR.CREATE));
      })
      .then(proposal => res.json(proposal))
      .catch(err => next(AppErr.handle(err, ProposalModel.ERROR.GENERIC)));
  });

/**
 * Update a proposal
 *
 * @swagger
 * /proposals:
 *   put:
 *     tags:
 *     - Proposal
 *     summary: Create proposal
 *     description: Create proposal with form fields
 *     produces:
 *       - application/json
 *     parameters:
 *       _id:
 *         type: string
 *       name:
 *         type: string
 *       subhead:
 *         type: string
 *       overview:
 *         type: string
 *       overview_inactive:
 *         type: boolean
 *       scope_of_work:
 *         type: string
 *       scope_of_work_inactive:
 *         type: boolean
 *       inserts:
 *         type: array
 *         items:
 *          type: object
 *          schema:
 *            $ref: '#/definitions/Insert'
 *       inserts_inactive:
 *         type: boolean
 *       breakdown:
 *         type: object
 *         schema:
 *          $ref: '#/definitions/Breakdown'
 *       breakdown_inactive:
 *         type: boolean
 *       timeline:
 *         type: object
 *         schema:
 *          $ref: '#/definitions/Breakdown'
 *       timeline_inactive:
 *         type: boolean
 *       steps:
 *         type: object
 *         schema:
 *          $ref: '#/definitions/Steps'
 *       steps_inactive:
 *         type: boolean
 *       candidate_ids:
 *         type: array
 *         items:
 *          type: string
 *          required: true
 *       candidate_ids_inactive:
 *         type: boolean
 *       portfolio_ids:
 *         type: array
 *         items:
 *          type: number
 *       portfolio_ids_inactive:
 *         type: boolean
 *     responses:
 *       200:
 *         description: Successful Operation.
 *         schema:
 *           $ref: '#/definitions/Proposal'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 *         
 */
router.put('/', auth.bearer,
  (req, res, next) => {
    console.log('Proposal UPDATE route activated');
    ProposalModel.validate(req.body, 'update')
      .catch(err => AppErr.reject(null, err))
      .then(proposal => {
        return ProposalModel.findByIdAndUpdateAsync(proposal._id, proposal)
          .then(proposal => proposal)
          .catch(err => AppErr.reject(err, ProposalModel.ERROR.CREATE));
      })
      .then(proposal => res.json(proposal))
      .catch(err => next(AppErr.handle(err, ProposalModel.ERROR.GENERIC)));
  });

module.exports = router;
