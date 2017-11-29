var shell = require('gulp-shell');

var Promise = require('bluebird');

function Git() {}

Git.prototype.archive = function(location) {
  return new Promise(function(resolve) {
    (shell.task([
      'git archive --format=zip HEAD > ' + location
    ]))();
    resolve();
  });
}

module.exports = Git;