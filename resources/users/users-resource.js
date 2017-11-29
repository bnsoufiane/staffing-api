'use strict';

const mongoose = require('mongoose');
const Promise = require('bluebird');
const bcrypt = require('bcrypt');
const constants = require('../../constants');
const punchAuth = require('punch-auth');
const googleOAuth = punchAuth.googleOAuth(constants.OAUTH.GOOGLE);
const linkedinOAuth = punchAuth.linkedinOAuth(constants.OAUTH.LINKEDIN);

const mailer = require('../../services/mailer')({
  sendGridApiKey: constants.SENDGRID_API_KEY
});

const imageUpload = require('../../services/imageupload')({
  aws: constants.AWS_CONFIG
});

const AppErr = require('../../error');

const SALT_WORK_FACTOR = 10;

const ERROR = Object.freeze({
  NOT_VALID: {status: 401, message: 'Not a valid username or password.'},
  INVALID_PASSWORD: {status: 401, message: 'Invalid password provided.'},
  NO_USERNAME_FOUND: {status: 404, message: 'No user found with provided username'},
  NO_EMAIL_FOUND: {status: 404, message: 'No user found with provided email.'},
  REQ_ATTR: {status: 400, message: 'Missing required attributes.'},
  ALREADY_EXISTS: {status: 400, message: 'This user already exists.'},
  NOT_FOUND: {status: 404, message: 'User not found.'},
  INVALID_TOKEN: {status: 401, message: 'Invalid Token.'},
  CONFIRMATION: {status: 500, message: 'Error confirming email.'},
  EMAIL_CONFIRMATION: {status: 403, message: 'Email not confirmed.'},

  CREATE: {status: 500, message: 'Error creating user.'},
  GENERIC: {status: 500, message: 'Something went wrong with users.'},
  PASSWORD_CHECK: {status: 500, message: 'Could not verify password.'},
  FETCH: {status: 500, message: 'User could not be retrieved.'},
  UPDATE_USER_ERROR: {status: 422, message: 'Unable to update user.'},
  DELETE_USER_ERROR: {status: 422, message: 'Unable to delete user.'},
  RESET_PASSWORD_ERROR: {status: 422, message: 'Unable to send reset password link.'},
  UPDATE_PASSWORD_ERROR: {status: 422, message: 'Unable to update password.'},
  PASSWORD_MISS_MATCH: {status: 422, message: 'Password and confirmation password do not match.'},
  OAUTH_GOOGLE: {status: 500, message: 'google oauth - Error authorizing user.'},
  OAUTH_LINKEDIN: {status: 500, message: 'linkedin oauth - Error authorizing user.'},
  OAUTH_ALREADY_LINKED: {sttus: 400, message: 'given account is already linked.'}
});

const SUCCESS = Object.freeze({
  RESET_PASSWORD_SUCCESS : {message: "Reset password instructions have been emailed successfully."}
});

var userSchema = require('./users-schema');

/**
 *
 */
userSchema.statics.login = function(username, password) {
  if (!username || !password) return AppErr.reject(null, ERROR.NOT_VALID);
  return this.findOneAsync({
    $or: [
      {username: username},
      {email: username}
    ]    
  }, '+password')
  .then((user) => {
    if (!user) return AppErr.reject(null, ERROR.NO_EMAIL_FOUND);
    if (!user.emailConfirmed) {
      return AppErr.reject(null, ERROR.EMAIL_CONFIRMATION);
    }
    return user.checkPassword(password);
  })
  .then(user => user);
};

/**
 * Signs a user up, and sends confirmation email.
 */
userSchema.statics.signup = function(params) {
  if (!params || !params.email || !params.password || !params.firstName
      || !params.lastName) {
    return AppErr.reject(null, UserModel.ERROR.REQ_ATTR);
  }

  return UserModel.findOne({email: params.email})
  .then(user => {
    if (user) return AppErr.reject(null, ERROR.ALREADY_EXISTS);
    return createHashToken(params.email)
    .then(hash => {
      let expiration = new Date();
      expiration.setDate(expiration.getDate() + constants.EXPIRATION_DAYS);

      user = new UserModel(Object.assign(params, {
        emailConfirmed: false,
        confirmationToken: hash,
        confirmationExpiresAt: expiration,
        username: params.email
      }));
      return user.saveAsync()
      .then(users => {
        user = users[0];
        let confirmationLink = constants.CLIENT_URLS.ACCOUNT +
          `/confirm?tk=${hash}`;        
        //sending confirmation email.
        return mailer.send({
          to: user.email,
          toName: `${user.firstName} ${user.lastName}`,
          reply_to: constants.NO_REPLY_EMAIL.email,
          html: `<p>Click <a href="${confirmationLink}">here</a> 
            to confirm your email address.</p>`,
          subject: 'Confirm Email',
          from: constants.NO_REPLY_EMAIL.email,
          fromname: constants.NO_REPLY_EMAIL.name
        });
      })
      .catch(err => AppErr.reject(err, ERROR.CREATE));
    });
  })
  .catch(err => AppErr.reject(err, ERROR.FETCH));
};

/**
 * Confirms user email.
 */
userSchema.statics.confirm = function(token) {
  if (!token) return AppErr.reject(null, ERROR.REQ_ATTR);

  return UserModel.findOne({
    confirmationToken: token,
    confirmationExpiresAt: {
      $gte: new Date()
    }
  })
  .then(user => {
    if (!user) return AppErr.reject(null, ERROR.INVALID_TOKEN);
    user.confirmationToken = '';
    user.confirmationExpiresAt = null;
    user.emailConfirmed = true;

    return user.saveAsync();
  });
};

/**
 * Fetches a user.
 */
userSchema.statics.fetchOne = function(params) {
  if(!params) return AppErr.reject(null, ERROR.REQ_ATTR);

  return UserModel.findOneAsync(params)
  .then(user => {
    if(user) return user;
    else return AppErr.reject(null, ERROR.NOT_FOUND);
  })
  .catch(err => AppErr.reject(err, ERROR.NOT_FOUND));
};

/**
 * Updates user password.
 */
userSchema.statics.updatePassword = function(user_id, params) {
  if (!params || !params.oldPassword || !params.newPassword) {
    return AppErr.reject(null, ERROR.REQ_ATTR);
  }

  return this.findOneAsync({_id: user_id}, '+password')
  .then(user => {
    if (!user) return AppErr.reject(null, ERROR.NOT_FOUND);
    return user.checkPassword(params.oldPassword)
    .then(_ => {
      user.password = params.newPassword;
      return user.saveAsync();
    });
  });
};

/**
 * Gets auth url for google.
 */
userSchema.statics.getGoogleAuth = function() {
  return googleOAuth.getAuthURL();
};

/**
 * Gets auth url for linkedin.
 */
userSchema.statics.getLinkedinAuth = function() {
  return linkedinOAuth.getAuthURL();
}

/**
 * Connects user to their google account.
 */
userSchema.methods.connectToGoogle = function(params) {
  if (!params || !params.code) {
    return AppErr.reject(null, ERROR.REQ_ATTR);
  }

  return googleOAuth.verifyAndInitialize(params.code)
  .then(profile => {
    let googleId = profile.id;

    return UserModel.countAsync({googleId})
    .then(count => {
      if(count) return AppErr.reject(null, ERROR.OAUTH_ALREADY_LINKED);

      this.googleId = googleId;
      return this.saveAsync()
      .then(users => users[0])
      .catch(err => AppErr.reject(err, ERROR.UPDATE_USER_ERROR));
    });
  });
};

/**
 * Connects user to their linkedin account.
 */
userSchema.methods.connectToLinkedin = function(params) {
  if (!params || !params.code) {
    return AppErr.reject(null, ERROR.REQ_ATTR);
  }

  return googleOAuth.verifyAndInitialize(params.code)
  .then(profile => {
    let linkedinId = profile.id;

    return UserModel.countAsync({linkedinId})
    .then(count => {
      if(count) return AppErr.reject(null, ERROR.OAUTH_ALREADY_LINKED);

      this.linkedinId = linkedinId;
      return this.saveAsync()
      .then(users => users[0])
      .catch(err => AppErr.reject(err, ERROR.UPDATE_USER_ERROR));
    });
  });
};

/**
 * Updates user.
 */
userSchema.methods.updateProfile = function(params) {
  if (!params) return AppErr.reject(null, ERROR.REQ_ATTR);

  this.firstName = params.firstName || this.firstName;
  this.lastName = params.lastName || this.lastName;
  this.country = params.country || this.country;
  this.timeZone = params.timeZone || this.timeZone;
  this.email = params.email || this.email;

  return this.saveAsync()
  .then(users => users[0])
  .catch(err => AppErr.reject(err, ERROR.UPDATE_USER_ERROR));
}

/**
 * Updates user's avatar.
 */
userSchema.methods.updateAvatar = function(file) {
  if (!file) return AppErr.reject(null, ERROR.REQ_ATTR);
  
  return ImageModel.saveImage(file)
  .then(image => {
    this.avatar = image._id;
    return this.saveAsync()
    .then(users => UserModel.findByIdAsync(users[0]._id));
  });
}

/**
 *
 */
userSchema.methods.checkPassword = function(password) {
  var user = this;
  console.log('PASSWORD', password, user.password);
  return new Promise(function(resolve, reject) {
    bcrypt.compare(password, user.password, function(err, isMatch) {
      if (err) return reject(AppErr.handle(err, ERROR.PASSWORD_CHECK));
      if (!isMatch) return reject(AppErr.handle(null, ERROR.INVALID_PASSWORD));
      resolve(user);
    });
  });
};


/**
 * Adds the token to user sessions.
 */
userSchema.methods.addSession = function(token) {
  let sessions = this.sessions || [];
  sessions.push({
    token: token,
    createdAt: new Date()
  });

  this.sessions = sessions;

  return this.saveAsync();
};


/**
 *
 */
userSchema.methods.sendResetPasswordLink = function(baseUrl) {
  var user = this;
  return new Promise(function(resolve, reject) {
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
      if (err) {
        return reject(err)
      }
      // hash the password along with our new salt
      bcrypt.hash(user.username, salt, function(error, hash) {
        if (error) {
          console.log(error);
          return reject(error)
        }
        hash = hash.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "-");
        user.resetPasswordToken = hash;
        var resetPasswordLink = baseUrl + "/users/reset-password/" + hash;
        //console.log("USER RESET PASSWORD LINK", resetPasswordLink);
        return user.saveAsync()
        .then((user) => {
          user = user[0];
          mailer.send({
            to: user.email,
            toName: user.name,
            reply_to: constants.NO_REPLY_EMAIL.email,
            html: "Click here to reset your password: <a href='"+resetPasswordLink+"'>"+resetPasswordLink+"</a>.",
            subject: "Reset Your Password",
            from: constants.NO_REPLY_EMAIL.email,
            fromname: constants.NO_REPLY_EMAIL.name
          })
          .then((json) => {
            console.log("EMAIL HAS BEEN SENT", json);
            resolve(json);
          })
          .catch((err) => reject(err))
        })
      });
    });
  });
};

/**
 * Creates a hash for the given value.
 */
function createHashToken(value) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) => {
      if (err) reject(err);
      bcrypt.hash(value, salt, (err, hash) => {
        if (err) reject(err);
        hash = hash.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "-");
        resolve(hash);
      });
    })
  });
}

/**
 *
 */
userSchema.pre('save', function (next) {
  var user = this;

  // Only hash the password if it has been modified (or is new).
  if (!user.isModified('password')) { return next(); }

  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if (err) { return next(err); }

    // hash the password along with our new salt
    bcrypt.hash(user.password, salt, function(error, hash) {
      if (error) { return next(error); }

      // override the cleartext password with the hashed one
      user.password = hash;
      next();
    });
  })
});

/**
 *
 */
userSchema.options.toJSON = {
  transform: function(doc, obj, options) {
    delete obj.password;
    delete obj.sessions;
    delete obj.__v;
    return obj;
  }
};


// Promisify Mongoose Model.
var UserModel = mongoose.model('User', userSchema);
Promise.promisifyAll(UserModel);
Promise.promisifyAll(UserModel.prototype);


UserModel.ERROR = ERROR;
UserModel.SUCCESS = SUCCESS;

/**
 * Exports the User Model.
 * @type {!Object}
 */
module.exports = UserModel;

const ImageModel = require('../images/images-resource');
