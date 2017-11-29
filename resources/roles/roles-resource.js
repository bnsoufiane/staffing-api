'use strict';

const Promise = require('bluebird');

const AppErr = require('../../error');
const utils = require('../../utils');

const ERROR = Object.freeze({
  NOT_FOUND: {status: 400, message: 'Role not found.'},
  FETCH: {status: 500, message: 'Error fetching role.'},
  LIST: {status: 500, message: 'Error listing role.'}
});

const data = require('./roles-data');



/**
 * Role Model.
 */
class RoleModel {
  constructor() {}


  /**
   *
   * @param id
   * @returns {boolean | Role}
   */
  static findById(id) {
    let role = data.INDEXED_BY.ID[id];
    return !role ? false: role;
  }

  /**
   *
   * @param id
   * @returns {*}
   */
  static findByIdAsync(id) {
    let role = data.INDEXED_BY.ID[id];
    if (!role) return AppErr.reject(null, ERROR.NOT_FOUND);
    return Promise.resolve(role);
  }


  /**
   *
   * @returns {Promise.<*>}
   */
  static list() {
    return Promise.resolve(data.data);
  }
}

RoleModel.ROLES = data.ROLES;
RoleModel.ERROR = ERROR;


/**
 *
 * @type {Object}
 */
module.exports = Object.freeze(RoleModel);
