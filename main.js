const express = require('express');
const path = require('path');
const passport = require('passport');
const logger = require('morgan');
const bodyParser = require('body-parser');
const moment = require('moment');
const logging = require('./services/logging')();
const app = express();
const port = process.env.PORT || '3000';
require('dotenv').config();

global.Moment = moment;
global.UpTime = Moment().format('MMMM Do YYYY, h:mm:ss a');
//TODO(raza): This should be removed, I have added this temporary fix just to
// avoid strict mode on npm scrap module as it's dependent module 'cheerio' throw error in strict mode
global.scrap = require('scrap');

logging.info(
  'Staffing API Application up since ' +
   global.UpTime + ' on port ' + port + '.');



// Initialize database
require('./database');

// Initialize vendor middleware.
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  next();
});

// Setup swagger docs
app.get('/api/docs', (req, res) => {
  res.redirect('/swagger-ui/?url=/api-docs/swagger.json');
});
app.use('/swagger-ui', express.static('node_modules/swagger-ui/dist'));
app.use('/api-docs/swagger.json', (req, res) => {
  res.sendfile('./api-docs/swagger.json');
});

app.use('/', express['static']('./public'));
app.use('/admin/*', express['static']('./public'));
app.use('/candidate/*', express['static']('./public'));
app.use('/proposal-live/*', express['static']('./public'));

// Setup for all requests.
app.use((req, res, next) => {
  req.data = req.data || {};
  next();
});


// Add the request logger to log api calls
// [START requests]
app.use(logging.requestLogger);
// [END requests]

// Initialize routes.
// Doing this out of strict mode due an errant dependency 'node-forge'
// futher inforamation https://github.com/digitalbazaar/forge/issues/333
// instead explicitly declaring strict mode in the files.
app.use('/api', require('./routes/index'));

require('strict-mode')(function () {
  var AppErr = require('./error');

// Add the error logger after all middleware and routes so that
// it can log errors from the whole application. Any custom error
// handlers should go after this.
// [START errors]
  app.use(logging.errorLogger);

  // Basic 404 handler
  app.use(function (req, res) {
    res.status(404).send('Not Found');
  });

  // Handle errors.
  app.use((err, req, res, next) => {
    logging.error('In error handling ----', err);
    AppErr.reject(err, {status: 500, message: 'Internal Server Error.'})
    .catch(err => {
      logging.error('In final catch() ----', err);
      res.status(err.status).send(err.message);
    });
  });

  //Setup cron manager
require('./services/cron-manager/index').setup();
});

/**
 *
 */
module.exports = app;

// app.listen(port);
