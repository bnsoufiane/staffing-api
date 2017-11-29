'use strict';

const rp = require('request-promise');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const BearerStrategy = require('passport-http-bearer').Strategy;
const OAuth2Strategy = require('passport-oauth2').Strategy;
const UserModel = require('../resources/users/users-resource');

const AUTH_SECRET = process.env.AUTH_SECRET || 'konmari';



/**
 *
 */
passport.use('login', new LocalStrategy({
  passReqToCallback: true
},  (req, username, password, done) => {
  UserModel.login(username, password).then(
      user => done(null, user),
      err => done(err));
}));


/**
 *
 */
passport.use('bearer', new BearerStrategy((token, done) => {
  jwt.verify(token, AUTH_SECRET, (err, user) => {
    if (err) return done(err);
    UserModel.findOne({_id: user._id, "sessions.token": token}).then(
        user => done(null, user),
        err => done(err));
  });
}));


/**
 * Middlware to log a user out.
 */
passport.use('logout', new BearerStrategy((token, done) => {
  console.log('in the middleware');
  jwt.verify(token, AUTH_SECRET, (err, result) => {
    if (err) return done(err);

    UserModel.findOne({"sessions.token": token})
    .then(user => {
      if (!user) done();
      if (user) {
        let sessions = user.sessions;
        let foundIndex = -1;
        sessions.forEach((session, index) => {
          if (session.token == token) foundIndex = index;
        });
        if (foundIndex > -1) {
          sessions.splice(foundIndex, 1);
          user.sessions = sessions;
        }
        return user.saveAsync()
        .then(users => done(null, users[0]))
        .catch(err => done(err));
      }
    });
  });
}));


function signToken(user) { return jwt.sign(user, AUTH_SECRET); }


/**
 *
 */
module.exports = {
  login: [
    (req, res, next) => {
      next();
    },
    passport.authenticate('login', { session: false }),
    function(req, res, next) {
      var token = signToken(req.user.toJSON());
      res.json({
        user: req.user.toJSON(),
        token: token
      });
      req.user.addSession(token);
    }
  ],
  bearer: passport.authenticate('bearer', { session: false } ),
  logout: passport.authenticate('logout', {session: false })
};
