const constants = require('../../constants');
const sendgrid = require('sendgrid')(constants.SENDGRID_API_KEY);
var Promise = require('bluebird');
const logging = require('../logging')();

const AppErr = require('../../error');

const ERROR = {
  EMAIL_SENDING_FAILIURE: {status: 400, message: 'Error sending email.'}
};


/**
 *
 */
function Mailer(config) {
  config = config || {};
  config.sendGridApiKey = config.mandrillApiKey || "";
  //this.sendGridClient = sendgrid(config.sendGridApiKey);
}


/**
 * @param {{
 *   to: Array,
 *   toName: Array,
 *   reply_to: string,
 *   html: string,
 *   text: string,
 *   subject: string,
 *   from: string,
 *   fromname: string,
 *   bcc: Array
 * }} options
 */
Mailer.prototype.send = function(params) {
  console.log("PREPARING TO SEND EMAIL", params);
  var self = this;
  return new Promise(function(resolve, reject) {
    console.log("SENDING EMAIL", params);
    sendgrid.send(params, function(err, json) {
      if (err) {
        console.log("MAIL NOT SENT", params);
        reject(err);
      }
      else {
        console.log("MAIL SENT", params);
        resolve(json);
      }
    });
  });
};


/**
 *
 */
module.exports = function(config) {
  logging.info("MAILER INSTANCE CREATED");
  return new Mailer(config);
};
