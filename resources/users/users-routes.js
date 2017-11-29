'use strict';

const express = require('express');
const router = express.Router();

const AppErr = require('../../error');
const auth = require('../../auth');
const utils = require('../../utils');


const UserModel = require('./users-resource');
const _ = require("underscore");
const constants = require('../../constants');
const imageUpload = require('../../services/imageupload')({
  aws: constants.AWS_CONFIG
});

/**
 * User login
 *
 * @swagger
 * /users:
 *   post:
 *     tags:
 *     - User
 *     summary: Login the user
 *     description: Login the user
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: username
 *         in: formData
 *         description: Username
 *         required: true
 *         type: string
 *       - name: password
 *         in: formData
 *         description: User password
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Successful Operation.
 *         schema:
 *           $ref: '#/definitions/User'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized request
 *       500:
 *         description: internal error
 */
router.post('/login', auth.login, (req, res, next) => res.json(res.data));

/**
 * Logs the bearer out, removes the current token.
 */
router.get('/logout', auth.logout, (req, res, next) => res.status(200).end());

/**
 * Create a new user. Follows with login to add to
 * session or token.
 *
 * @swagger
 * /users:
 *   post:
 *     tags:
 *     - User
 *     summary: Create a user
 *     description: Create user with form fields
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: username
 *         in: formData
 *         description: Username
 *         required: true
 *         type: string
 *       - name: email
 *         in: formData
 *         description: User email
 *         required: true
 *         type: string
 *       - name: password
 *         in: formData
 *         description: User password
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Successful Operation.
 *         schema:
 *           $ref: '#/definitions/User'
 *       400:
 *         description: Invalid request
 *       500:
 *         description: internal error
 */
router.post('/',
  (req, res, next) => {
    UserModel.signup(req.body)
    .then(_ => res.status(200).end())
    .catch(err => next(AppErr.handle(err, UserModel.ERROR.CREATE)));
  }
);

/**
 * Confirms user email.
 */
router.put('/confirm/:token', (req, res, next) => {
  UserModel.confirm(req.params.token)
  .then(_ => res.status(200).end())
  .catch(err => next(AppErr.handle(err, UserModel.ERROR.CONFIRMATION)));
});

/**
 * Return current user details
 *
 * @swagger
 * /users/current:
 *   get:
 *     tags:
 *     - User
 *     summary: Return current user details
 *     description: Return current user details
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successful Operation.
 *         schema:
 *           $ref: '#/definitions/User'
 *       400:
 *         description: Invalid request
 *       500:
 *         description: internal error
 */
router.get('/current', auth.bearer, (req, res, next) => res.json(req.user));

/**
 * Updates a current user
 *
 * @swagger
 * /users:
 *   put:
 *     tags:
 *     - User
 *     summary: Updates a current user
 *     description: Updates a current user
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: username
 *         in: formData
 *         description: Username
 *         required: true
 *         type: string
 *       - name: email
 *         in: formData
 *         description: User email
 *         required: true
 *         type: string
 *       - name: password
 *         in: formData
 *         description: User password
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Successful Operation.
 *         schema:
 *           $ref: '#/definitions/User'
 *       400:
 *         description: Invalid request
 *       422:
 *         description: Unable to update user.
 *       500:
 *         description: internal error
 */
router.put('/',
  auth.bearer,
  (req, res, next) => {
    req.user.updateProfile(req.body)
    .then(user => res.json(user))
    .catch(err => next(AppErr.handle(err, UserModel.ERROR.UPDATE_USER_ERROR)));
  }
);

/**
 * Updates the password.
 */
router.put('/password',
  auth.bearer,
  (req, res, next) => {
    UserModel.updatePassword(req.user._id, req.body)
    .then(_ => res.status(200).end())
    .catch(err => next(AppErr.handle(err, UserModel.ERROR.UPDATE_USER_ERROR)));
  }
);

/**
 * Updates avatar.
 */
router.put('/avatar',
  auth.bearer,
  imageUpload.multerSingleMW(),  
  (req, res, next) => {
    req.user.updateAvatar(req.file)
      .then(user => res.json(user))
      .catch(err => next(AppErr.handle(err, UserModel.ERROR.UPDATE_USER_ERROR)));
  }
);

/**
 * Deletes a current user.
 *
 * @swagger
 * /users:
 *   delete:
 *     tags:
 *     - User
 *     summary: Deletes a current user
 *     description: Deletes a current user
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successful Operation.
 *         schema:
 *           $ref: '#/definitions/User'
 *       400:
 *         description: Invalid request
 *       422:
 *         description: Unable to update user.
 *       500:
 *         description: internal error
 */
router.delete('/',
  auth.bearer,
  (req, res, next) => {
    let user = req.user;
    if (!user)
      return next(AppErr.reject(null, UserModel.ERROR.GENERIC));
    console.log('DELETING CURRENT USER', user);
    return user.removeAsync()
    .then(user => res.json(user))
    .catch(err => next(AppErr.handle(err, UserModel.ERROR.DELETE_USER_ERROR)));
  }
);

/**
 * Send Reset Password Email
 *
 * @swagger
 * /users/forgot-password:
 *   post:
 *     tags:
 *     - User
 *     summary: Send Reset Password Email
 *     description: Send Reset Password Email
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: username
 *         in: formData
 *         description: Username
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Successful Operation.
 *         schema:
 *           $ref: '#/definitions/User'
 *       400:
 *         description: Invalid request
 *       422:
 *         description: Unable to update user.
 *       500:
 *         description: internal error
 */
router.post('/forgot-password',
  (req, res, next) => {
    var baseUrl = req.protocol + '://' + req.get('host');
    if (!req.body.username)
      return next(AppErr.handle(null, UserModel.ERROR.REQ_ATTR));
    UserModel.fetchOne({username: req.body.username})
    .then(user => user.sendResetPasswordLink(baseUrl))
    .then(json => res.json(UserModel.SUCCESS.RESET_PASSWORD_SUCCESS))
    .catch(err => next(AppErr.handle(err, UserModel.ERROR.RESET_PASSWORD_ERROR)));
  }
);

/**
 * Reset Password with taken
 *
 * @swagger
 * /users/reset-password/:token:
 *   post:
 *     tags:
 *     - User
 *     summary: Reset Password with taken
 *     description: Reset Password with taken
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: token
 *         in: formData
 *         description: Token
 *         required: true
 *         type: string
 *       - name: password
 *         in: formData
 *         description: Password
 *         required: true
 *         type: string
 *       - name: password_confirmation
 *         in: formData
 *         description: Confirmation password
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Successful Operation.
 *         schema:
 *           $ref: '#/definitions/User'
 *       400:
 *         description: Invalid request
 *       500:
 *         description: internal error
 */
router.post('/reset-password/:token',
  (req, res, next) => {
    if (!req.body.password || !req.body.password_confirmation)
      return next(AppErr.handle(null, UserModel.ERROR.REQ_ATTR));
    if (req.body.password != req.body.password_confirmation)
      return next(AppErr.handle(null, UserModel.ERROR.PASSWORD_MISS_MATCH));

    UserModel.fetchOne({resetPasswordToken: req.params.token})
    .then(user => {
      user.password = req.body.password;
      return user.saveAsync()
    })
    .then(user => {
      req.body.username = user[0].username;
      next();
    })
    .catch(err => next(AppErr.handle(err, UserModel.ERROR.GENERIC)));
  },
  auth.login,
  (req, res, next) => res.json(res.data)
);

/**
 * Checks if a given user exists.
 *
 * @swagger
 * /users/exists:
 *   post:
 *     tags:
 *     - User
 *     summary: Checks if a given user exists
 *     description: Checks if a given user exists
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: username
 *         in: formData
 *         description: username
 *         required: true
 *         type: string
 *       - name: email
 *         in: formData
 *         description: email
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Successful Operation.
 *         schema:
 *           $ref: '#/definitions/User'
 *       500:
 *         description: internal error
 */
router.post('/exists',
  (req, res, next) => {
    let query = {
      $or : [
        { username: req.body.username },
        { email: req.body.email }
      ]
    };
    UserModel.fetchOne(query)
    .then(user => res.status(200).end())
    .catch(err => next(AppErr.handle(err, UserModel.ERROR.FETCH)));
  }
);

/**
 * Verifies the bearer token and returns the bearer.
 */
router.get('/verify',
  auth.bearer,
  (req, res, next) => res.json({user: req.user})
);

/**
 * Defining the userId parameter, and defining the dependent endpoints afterwards.
 */

router.param('userId', (req, res, next, id) => {
  UserModel.findByIdAsync(id)
  .then((user) => {
    if (!user) return AppErr.reject(null, UserModel.ERROR.NOT_FOUND);
    req.data.user = user;
    next();
  })
  .catch(err => next(AppErr.handle(err, UserModel.ERROR.FETCH)));
});

/**
 * Get user by ID
 *
 * @swagger
 * /users/:userId:
 *   get:
 *     tags:
 *     - User
 *     summary: Get user by ID
 *     description: Get user by ID
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: userId
 *         in: formData
 *         description: userId
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Successful Operation.
 *         schema:
 *           $ref: '#/definitions/User'
 *       500:
 *         description: internal error
 */
router.get('/:userId', auth.bearer, (req, res, next) => {
  UserModel.getProfile(req.user, req.data.user)
  .then(profileData => {
    _.assign(req.data.user._doc, profileData);
    res.json(req.data.user);
  })
  .catch(err => AppErr.reject(err, UserModel.ERROR.FETCH));
});

/**
 * Gets google oauth url.
 */
router.get('/auth/google', (req, res, next) => {
  res.json({
    url: UserModel.getGoogleAuth()
  });
});

/**
 * Connects bearer to google.
 */
router.post('/auth/google', auth.bearer, (req, res, next) => {
  req.user.connectToGoogle(req.body)
  .then(user => res.json(user))
  .catch(err => next(AppErr.handle(err, UserModel.ERROR.OAUTH_GOOGLE)));
});


/**
 * Gets linkedin oauth url.
 */
router.get('/auth/linkedin', (req, res, next) => {
  res.json({
    url: UserModel.getLinkedinAuth()
  });
});

/**
 * Connects bearer to linkedin.
 */
router.post('/auth/linkedin', auth.bearer, (req, res, next) => {
  req.user.connectToLinkedin(req.body)
  .then(user => res.json(user))
  .catch(err => next(AppErr.handle(err, UserModel.ERROR.OAUTH_LINKEDIN)));
});

module.exports = router;
