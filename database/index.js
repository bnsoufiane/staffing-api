var mongoose = require('mongoose');
var database = process.env.MONGO_DB || 'staffing';
const logging = require('../services/logging')();


function buildMongoURI () {
  var uri = [
    'mongodb://',
    process.env.MONGO_SERVER || 'localhost',
    '/',
    database,
    process.env.MONGO_OPTIONS || ''
  ];
  return uri.join('');
}

// Initialize database.
mongoose.connect(buildMongoURI());

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', function () {
  logging.info('Mongoose connected to ' + buildMongoURI() + '.');
});

// If the connection throws an error
mongoose.connection.on('error',function (err) {
  logging.error('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
  logging.info('Mongoose default connection disconnected.');
});
