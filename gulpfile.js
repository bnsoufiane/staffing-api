/**
 * @fileoverview The Gulp file.
 * Provides tasks to run jobs on the codebase.
 * Usage:
 *   'gulp [task]'
 *
 * Available tasks:
 *   gulp
 */

var gulp = require('gulp');
var gulpPrompt = require('gulp-prompt');
var openInBrowser = require('gulp-open');
var fs = require('fs');
var _ = require('lodash');
var punchAWS = require('punch-aws');
var gulpGit = require('./gulp/git');
var nodemon = require('gulp-nodemon');
var Promise = require('bluebird');
var gulpApiDoc = require('./gulp/api-docs');

var ERRORS = {
  USER_CONSTANTS: 'User Constants missing or invalid. Please view README.md section on deployment.'
};


var ZIP_LOCATION = './archive.zip';
var USER_CONSTANTS_LOCATION = './credentials/user_constants.json';

var AWS_REGION = 'us-west-2';

// Fetch and validate user constants.

var REQUIRED_USER_CONSTANTS= [
  'user',
  'AWS_access_key',
  'AWS_secret'
];

try {
  var USER_CONSTANTS = JSON.parse(fs.readFileSync(USER_CONSTANTS_LOCATION, "utf8"));
  REQUIRED_USER_CONSTANTS.forEach(function (key) {
    if (!USER_CONSTANTS[key]) {
      console.log('Required value (' + key + ')' + ' missing from ' +
        USER_CONSTANTS_LOCATION + ' Please view README.md section on deployment.');
    }
  });
} catch (err) {
  console.log(err);
  console.log('Malformed JSON at ' + USER_CONSTANTS_LOCATION + ' ' +
    'Please view README.md section on deployment.');
}

/*******************************/
/***********  SETUP  ***********/
/*******************************/


var AWS = new punchAWS({
  region: AWS_REGION,
  accessKeyId: USER_CONSTANTS ? USER_CONSTANTS.AWS_access_key : '',
  secretAccessKey: USER_CONSTANTS ? USER_CONSTANTS.AWS_secret : ''
});

var git = new gulpGit();
var apiDocs = new gulpApiDoc();


/*******************************/
/***********  TASKS  ***********/
/*******************************/

gulp.task('generate-api-doc', apiDocs.update);
gulp.task('server', function () {
  nodemon({
    script: 'bin/www'
  , watch: ['bin', 'database', 'resources', 'routes', 'utils', 'services', 'main.js']
  , env: { 'NODE_ENV': 'development' }
  });
});

gulp.task('default', ['server']);
