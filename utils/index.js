var Promise = require('bluebird');

var utils = {};


/**
 *
 */
utils.isString = function(test) {
  return !!(typeof test === 'string' || test instanceof String);
};

/**
 * converts a string containing a number to a number, supports different formats
 */
utils.stringToNumber = function(val) {
  var v = val;
  if (!v) v = '';
  if (typeof v === 'number') v = '' + v;
  v = v.replace('$', '').replace('<', '').replace('>', '').replace('+', '').replace(/,/g, '').toLowerCase().trim();
  if (v === 'undefined') v = '';
  if (v === 'unknown') v = '';
  if (v === 'undisclosed') v = '-1';
  var multiplier = 1;
  if (v.indexOf('k') !== -1) {
    multiplier = 1000;
    v = v.replace('k', '');
  }
  if (v.indexOf('m') !== -1) {
    multiplier = 1000000;
    v = v.replace('m', '');
  }
  if (v.indexOf('b') !== -1) {
    multiplier = 1000000000;
    v = v.replace('b', '');
  }
  v = parseFloat(v);
  if (isNaN(v)) {
    v = undefined;
  } else {
    v *= multiplier;
  }
  return v;
};

/**
 * converts a string containing date in the time ago format to a regular date
 */
utils.timeAgoToDate = function(str) {
  if (typeof str !== 'string' || str.indexOf('ago') === -1 || (str.match(/ /g) || []).length !==2 ){
    return false;
  }

  str = str.replace("+", "").toLowerCase();
  var d = new Date();
  var count = str.split(" ")[0];

  if (str.indexOf('second') !== -1){
    d.setSeconds(d.getSeconds()-count);
  }

  if (str.indexOf('minute') !== -1){
    d.setMinutes(d.getMinutes()-count);
  }

  if (str.indexOf('hour') !== -1){
    d.setHours(d.getHours()-count);
  }

  if (str.indexOf('day') !== -1){
    d.setDate(d.getDate()-count);
  }

  if (str.indexOf('month') !== -1){
    d.setMonth(d.getMonth()-count);
  }

  if (str.indexOf('year') !== -1){
    d.setFullYear(d.getFullYear()-count);
  }
  
  return d;
};



/**
 * Array-specific utilities.
 */
utils.array = {};


/**
 *
 */
utils.array.findIndexWhere = function(array, f, context) {
  for (var i = 0; i < array.length; i++) {
    if (f.call(context, array[i], i, array)) return i;
  }
};


/**
 *
 */
utils.array.findWhere = function(array, f, opt_context) {
  var index = utils.array.findIndexWhere(array, f, opt_context);
  if (index != undefined) return array[index];
};


/**
 *
 */
utils.array.findAllWhere = function(array, f, opt_context) {
  var results = [];
  for (var i = 0; i < array.length; i++) {
    if (f.call(opt_context, array[i], i, array)) results.push(array[i]);
  }
  return results.length ? results : undefined;
};


/**
 * Returns true if all elements in the list meet the condition provided.
 */
utils.array.all = function(array, f, opt_context) {
  for (var i = 0; i < array.length; i++) {
    if (!f.call(opt_context, array[i], i, array)) return false;
  }
  return true;
};


/**
 * Returns true if any of the elements in the list meet the condition provided.
 */
utils.array.any = function(array, f, opt_context) {
  for (var i = 0; i < array.length; i++) {
    if (f.call(opt_context, array[i], i, array)) return true;
  }
  return false;
};


/**
 *
 */
utils.array.addOrReplace = function(array, replacement) {
  var index = array.indexOf(replacement);
  if (index > -1) array.splice(index, 1, replacement);
  else array.push(replacement);
  return array;
};


/**
 *
 */
utils.array.addOrReplaceWhere = function(array, f, replacement, opt_context) {
  var index = utils.array.findIndexWhere(array, f, opt_context);
  if (index != undefined) array.splice(index, 1, replacement);
  else array.push(replacement);
  return array;
};


/**
 *
 */
utils.array.remove = function(array, target) {
  var index = array.indexOf(target);
  if (index != undefined) array.splice(index, 1);
  return array;
};


/**
 *
 */
utils.array.removeAll = function(array, target) {
  var index;
  while((index = array.indexOf(target)) > -1) {
    array.splice(index, 1);
  }
  return array;
};


/**
 *
 */
utils.array.removeWhere = function(array, f, opt_context) {
  var index = utils.array.findIndexWhere(array, f, opt_context);
  if (index != undefined) array.splice(index, 1);
  return array;
};


/**
 *
 */
utils.array.removeAllWhere = function(array, f, opt_context) {
  for (var i = 0; i < array.length; i++) {
    if (f.call(opt_context, array[i], i, array)) {
      array.splice(i--, 1);
    }
  }
  return array;
};


/**
 * Remove and return all values matching condition f.
 */
utils.array.popOutAllWhere = function(array, f, opt_context) {
  var popped = [];
  for (var i = 0; i < array.length; i++) {
    if (f.call(opt_context, array[i], i, array)) {
      popped.push(array[i]);
      array.splice(i--, 1);
    }
  }
  return popped;
};


utils.array.hashByProperty = function(array, property) {
  return array.reduce(function(hash, value) {
    hash[value[property]] = value;
    return hash;
  }, {});
};


/**
 * Group array of objects by values of a key.
 * @param {!Array<!Object>} array Array of objects.
 * @param {!string} key The key whose value should be grouped on.
 * @return {!Array<!Array<!Object>>}
 */
utils.array.groupByKeyValue = function(array, key) {
  var groups = {};
  return array.reduce(function(agg, item) {
    groups[item[key]] = groups[item[key]] != undefined ?
        groups[item[key]] : agg.length;
    agg[groups[item[key]]] = (agg[groups[item[key]]] || []).concat([item]);
    return agg;
  }, []);
};


/**
 * Group array of objects by values of a key.
 * @param {!Array<!Object>} array Array of objects.
 * @param {!string} key The key whose value should be grouped on.
 * @return {!Array<!Array<!Object>>}
 */
utils.array.groupByValue = function(array, f, opt_context) {
  var groups = {};
  return array.reduce(function(agg, item, key) {
    var value = f.call(opt_context, item, key, array);
    groups[value] = groups[value] != undefined ? groups[value] : agg.length;
    agg[groups[value]] = (agg[groups[value]] || []).concat([item]);
    return agg;
  }, []);
};



/**
 * Object-specific utilities.
 */
utils.object = {};


/**
 * Checks if property is present and on the object itself, not including
 * its prototype chain.
 * @param {!Object} object The object to test.
 * @param {!string} property The property to test.
 */
utils.object.hasOwnProperty = function(object, property) {
  return ({}).hasOwnProperty.call(object, property);
};


/**
 * Iterates through the properties and values of an object, ignoring prototype
 * chain.
 */
utils.object.forEach = function(object, f, context) {
  for (var key in object) {
    if (!this.hasOwnProperty(object, key)) continue;
    f.call(context, object[key], key, object);
  }
};


/**
 *
 */
utils.object.map = function(object, f, context) {
  var results = [];
  utils.object.forEach(object, function(v, k, object) {
    results.push(f.call(context, v, k, object));
  }, context);
  return results;
};


/**
 * Returns true if condition is met for every value on the object.
 */
utils.object.all = function(object, f, context) {
  for (var key in object) {
    if (!utils.object.hasOwnProperty(object, key)) continue;
    if (!f.call(context, object[key], key, object)) return false;
  }
  return true;
};


/**
 * Returns true if condition is met for any value on the object.
 */
utils.object.any = function(object, f, context) {
  for (var key in object) {
    if (!utils.object.hasOwnProperty(object, key)) continue;
    if (f.call(context, object[key], key, object)) return true;
  }
  return false;
};


/**
 * Returns true if condition isn't met for any value on the object.
 */
utils.object.none = function(object, f, context) {
  return !utils.object.any(object, f, context);
};


/**
 *
 */
utils.object.reduce = function(object, f, starting, context) {
  var current = starting;
  utils.object.forEach(object, function(value, key) {
    current = f.call(context, current, value, key, object);
  });
  return current;
};


/**
 *
 */
utils.object.findWhere = function(object, f, context) {
  for (var key in object) {
    if (!utils.object.hasOwnProperty(object, key)) continue;
    if (f.call(context, object[key], key, object)) return object[key];
  }
};


/**
 * Converts object to array.
 */
utils.object.asArray = function(object) {
  return utils.object.reduce(object, function(agg, value) {
    agg.push(value);
    return agg;
  }, []);
};


/**
 *
 */
utils.object.addIfExists = function(key, value, target) {
  if (value == undefined) return false;
  if (utils.isString(value) && !value.length) return false;
  target[key] = value;
};


/**
 * Maps properties from source object onto a target object following
 * either a string to string key to key map or a string to function key
 * to function converter.
 */
utils.object.formatByMapping = function(map, source) {
  return utils.object.reduce(function(target, value, targetProperty) {
    if (utils.isFunction(value)) {
      try { utils.object.addIfExists(targetProperty, value(source), target); }
      catch(err) {}
    } else { utils.object.addIfExists(targetProperty, source[value], target); }
  }, {});
};


/**
 * Extends specified properties from the provided source/sources onto the
 * target object.
 * @param {!Object} target The target to extend properties onto.
 * @param {!Object|!Array<!Object>} sources The sources to extend property
 *     values from.
 * @param {!Array<!string>} properties The properties to extend from the source
 *     objects.
 * @return {!Object} The target object with extended values.
 */
utils.object.extendProperties = function(
    target, sources, properties, opt_config) {
  var config = opt_config || {};
  sources = Array.isArray(sources) ? sources : [sources];
  sources.forEach(function(source) {
    properties.forEach(function(property) {
      var value = config.get ? config.get(source, property) : source[property];
      if (config.set) {
        config.set(target, source, property);
      } else {
        target[property] = value;
      }
    });
  });
};


/**
 * Extends specified properties from the provided source/sources onto the
 * target object, but only if the condition is met.
 * @param {!Object} target The target to extend properties onto.
 * @param {!Object|!Array<!Object>} sources The sources to extend property
 *     values from.
 * @param {!Array<!string>} properties The properties to extend from the source
 *     objects.
 * @param {Function} condition The function to call for each value at the given
 *     property on a source to determine whether or not it should be extended.
 *     Is passed the value on the source object, the property, and the source
 *     object itself.
 * @param {boolean=} opt_allOrNothing Whether all values must pass the condition
 *     on a source object in order for it to be extended.
 * @return {!Object} The target object with extended values.
 */
utils.object.extendPropertiesIf = function(target, sources, properties,
    condition, opt_config) {
  var config = opt_config || {};
  sources = Array.isArray(sources) ? sources : [sources];
  sources.forEach(function(source) {
    var passed = properties.filter(function(property) {
      try { return !!condition(source[property], property, source); }
      catch(err) { return false; }
    });
    if (passed.length == properties.length || !config.allOrNothing) {
      utils.object.extendProperties(target, source, passed, config);
    }
  });
  return target;
};


/**
 *
 */
utils.object.extendIfValued = function() {
    var base = arguments[0];
    for (var i = 1; i < arguments.length; i++) {
        utils.object.forEach(arguments[i], function(value, prop) {
          if (value != undefined) base[prop] = value;
        });
    }
    return base;
}



/**
 *
 */
utils.function = {};


/**
 * Poll a function (can return a promise) at the interval specified until
 * the termination condition is met. Can specify maximum amount of tries
 * before failing. The termination condition is only checked if the function
 * {@code f} resolves success. To test a fail condition, you must catch and
 * return it successfully in the provided function {@code f}.
 */
utils.function.poll = function(f, terminationCondition, opt_interval,
    opt_maxTries, opt_onProgress) {
  var responseReturned = false;
  var intervalComplete = false;
  var resolved = false;
  var args = arguments;
  return new Promise(function(resolve, reject) {
    if (opt_maxTries != undefined) {
      // Decrement maxtries.
      if(!args[3]--) return reject('Max tries exceeded.');
    }
    Promise.resolve(f()).then(function(response) {
      if (terminationCondition(response)) {
        resolved = true;
        resolve(response);
      } else if (opt_onProgress) opt_onProgress(null, response);
    }, function(err) {
      if (opt_onProgress) opt_onProgress(err);
    }).finally(function() {
      responseReturned = true;
      if (intervalComplete && !resolved) {
        resolved = true;
        resolve(utils.function.poll.apply(null, args));
      }
    });
    setTimeout(function() {
      intervalComplete = true;
      if (responseReturned && !resolved) {
        resolved = true;
        resolve(utils.function.poll.apply(null, args));
      }
    }, (opt_interval || 2500));
  });
};

/**
 *
 */
utils.all = function() {
  return utils.array.all(arguments, (arg) => !!arg === true);
};

module.exports = utils;
