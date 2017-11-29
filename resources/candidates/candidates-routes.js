'use strict';

const express = require('express');
const router = express.Router();
const AppErr = require('../../error');
const utils = require('../../utils');
const CandidateModel = require('./candidates-resource');
const _ = require("underscore");
const constants = require('../../constants');
const auth = require('../../auth');

/**
 * List all candidates
 *
 * @swagger
 * /candidates:
 *   get:
 *     tags:
 *     - Candidate
 *     summary: List all candidates
 *     description: List all candidates.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successful Operation.
 *         schema:
 *           $ref: '#/definitions/Candidate'
 *       401:
 *         description: unauthorized
 *       500:
 *         description: internal error
 */
router.get('/', (req, res, next) => {
  console.log('List all candidates');
  CandidateModel.findAsync({}, null, {sort: {createdAt: 'desc'}})
    .then(candidates => res.json(candidates))
    .catch(err => next(AppErr.handle(err, CandidateModel.ERROR.LIST)));
});


/**
 * Defining the userId parameter, and defining the dependent endpoints afterwards.
 */
router.param('id', (req, res, next, id) => {
  CandidateModel.findByIdAsync(id)
    .then(candidate => {
      if (!candidate) return AppErr.reject(null, CandidateModel.ERROR.NOT_FOUND);
      req.data.candidate = candidate;
      next();
    })
    .catch(err => next(AppErr.handle(err, CandidateModel.ERROR.GENERIC)));
});

/**
 * Get candidates
 *
 * @swagger
 * /candidates/:id:
 *   get:
 *     tags:
 *     - Candidate
 *     summary: Get candidate by id
 *     description: Get candidate by id
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successful Operation.
 *         schema:
 *           $ref: '#/definitions/Candidate'
 *       500:
 *         description: internal error
 */
router.get('/:id', (req, res, next) => {
  console.log('Get candidate by id');
  res.json(req.data.candidate);
});

/**
 * Delete candidate by id
 *
 * @swagger
 * /candidates/:id:
 *   delete:
 *     tags:
 *     - Candidate
 *     summary: Delete candidate by id
 *     description: Delete candidate by id
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successful Operation.
 *         schema:
 *           $ref: '#/definitions/Candidate'
 *       401:
 *         description: unauthorized
 *       500:
 *         description: internal error
 */
router.delete('/:id', (req, res, next) => {
  console.log('Delete candidate by id');
  let candidate = req.data.candidate;
  candidate.removeAsync()
    .then(candidate => res.json('Candidate deleted successfully'))
    .catch(err => next(AppErr.handle(err, CandidateModel.ERROR.DELETE)));
});

/**
 * Post route for creating candidates
 *
 * @swagger
 * /candidates:
 *   post:
 *     tags:
 *     - Candidate
 *     summary: Create candidate
 *     description: Create candidate profile with form fields
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: avatar
 *         in: formData
 *         description: Candidate avatar
 *         required: false
 *         type: file
 *       - name: interviewVideo
 *         in: formData
 *         description: Candidate interview video
 *         required: false
 *         type: file
 *       - name: fullname
 *         in: formData
 *         description: Full name
 *         required: true
 *         type: string
 *       - name: location
 *         in: formData
 *         description: Location
 *         required: true
 *         type: string
 *       - name: title
 *         in: formData
 *         description: Candidate title
 *         required: true
 *         type: string
 *       - name: roles
 *         in: formData
 *         description: List of role ids (Stringified array of roles)
 *         required: true
 *         type: array
 *       - name: skillset
 *         in: formData
 *         description: Stringified array of skillset
 *         required: true
 *         type: array
 *       - name: pastCompanies
 *         in: formData
 *         description: Past companies in which he worked (Stringified array of pastCompanies)
 *         required: true
 *         type: array
 *     responses:
 *       200:
 *         description: Successful Operation.
 *         schema:
 *           $ref: '#/definitions/Candidate'
 *       400:
 *         description: error creating
 *       401:
 *         description: unauthorized
 *       500:
 *         description: internal error
 */
router.post('/', auth.bearer, CandidateModel.multerFilesConfiguration(),
  (req, res, next) => {
    console.log('Candidate CREATE route activated');
    CandidateModel.validate(req.body, req.files, 'add')
      .catch(err => AppErr.reject(null, err))
      .then(candidate => //valid candidate
        {
          if(req.files['interviewVideo']) {
            return CandidateModel.uploadVideo(req.files, 'interviewVideo')
              .catch(err => AppErr.reject(err, CandidateModel.ERROR.VIDEO_UPLOAD));
          }
        }
      )
      .then(video => { //uploaded video with valid link
        req.body['interviewVideo'] = '';
        if(video) {
          req.body['interviewVideo'] = video.interviewVideo.full.Location;
          delete req.files['interviewVideo'];
        }
        return CandidateModel.uploadImages(req.files)
            .catch(err => AppErr.reject(err, CandidateModel.ERROR.IMAGES_UPLOAD));
      })
      .then(images => { //all uploaded images with valid image and thumbnail links
        req.body['avatar'] = CandidateModel.avatarImage(images);
        CandidateModel.pastCompaniesImages(images, req.body.pastCompanies);
        let candidate = new CandidateModel(req.body);
        return candidate.saveAsync()
          .then(candidate => candidate[0])
          .catch(err => AppErr.reject(err, CandidateModel.ERROR.CREATE));
      })
      .then(candidate => res.json(candidate)) //successfully saved candidate
      .catch(err => next(AppErr.handle(err, CandidateModel.ERROR.GENERIC)));
  });

/**
 * Update candidate
 *
 * @swagger
 * /candidates:
 *   put:
 *     tags:
 *     - Candidate
 *     summary: Update candidate
 *     description: Update proposal
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successful Operation.
 *         schema:
 *           $ref: '#/definitions/Candidate'
 *       401:
 *         description: unauthorized
 *       500:
 *         description: internal error
 */
router.put('/', auth.bearer, CandidateModel.multerFilesConfiguration(),
  (req, res, next) => {
    console.log('Candidate Update route activated');
    CandidateModel.validate(req.body, req.files, 'update')
      .catch(err => AppErr.reject(null, err))
      .then(candidate => //valid candidate
        {
          if(req.files['interviewVideo']) {
            return CandidateModel.uploadVideo(req.files, 'interviewVideo')
                .catch(err => AppErr.reject(err, CandidateModel.ERROR.VIDEO_UPLOAD));
          }
        }
      )
      .then(video => { //uploaded video with valid link
        if (video) {
          req.body['interviewVideo'] = video.interviewVideo.full.Location;
          delete req.files['interviewVideo'];
        } else {
          req.body['interviewVideo'] = '';
        }
        return CandidateModel.uploadImages(req.files)
          .catch(err => AppErr.reject(err, CandidateModel.ERROR.IMAGES_UPLOAD));
      })
      .then(images => { //all uploaded images with valid image and thumbnail links
        let image = CandidateModel.avatarImage(images);
        if (image) { req.body['avatar'] = image }
        CandidateModel.pastCompaniesImages(images, req.body.pastCompanies);
        return CandidateModel.findByIdAndUpdateAsync(req.body['_id'], req.body)
          .then(candidate => candidate)
          .catch(err => AppErr.reject(err, CandidateModel.ERROR.UPDATE));
      })
      .then(candidate => res.json(candidate)) //successfully saved candidate
      .catch(err => next(AppErr.handle(err, CandidateModel.ERROR.GENERIC)));
  });

module.exports = router;
