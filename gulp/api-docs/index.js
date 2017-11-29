const shell = require('gulp-shell');

function ApiDocs() {}

ApiDocs.prototype.update = function apiDocTask() {
  var cmd = 'node gulp/api-docs/update-docs.js';
  return (shell.task([
    cmd
  ]))();
};

module.exports = ApiDocs;