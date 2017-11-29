var sprintf = require('underscore.string/sprintf')
, debugPfx = require('../package.json').name;

/**
 * returns a debug instance with application prefix.
 * @param {String} string which will be appended to application prefix.
 */
module.exports = function(str){
  return require('debug')(sprintf('%s:%s', debugPfx, str))
}
