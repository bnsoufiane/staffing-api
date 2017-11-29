'use strict';

const utils = require('../../utils');

/**
 * @const
 * @enum {{id: !string, name: !string}}
 */
const ROLES = Object.freeze({
  FULL_STACK_SOFTWARE_ENGINEER: Object.freeze({id: 'full_stack_software_engineer', text: 'Full-Stack Software Engineer'}),
  FRONT_END_ENGINEER: Object.freeze({id: 'front_end_engineer', text: 'Frontend Engineer'}),
  IOS_ENGINEER: Object.freeze({id: 'ios_engineer', text: 'iOS Engineer'}),
  ANDROID_ENGINEER: Object.freeze({id: 'android_engineer', text: 'Android Engineer'}),
  DATA_SCIENTIST: Object.freeze({id: 'data_scientist', text: 'Data Scientist'}),
  UI_UX_DESIGNER: Object.freeze({id: 'ui_ux_designer', text: 'UI/UX Designer'}),
  BACK_END_ENGINEER: Object.freeze({id: 'back_end_engineer', text: 'Backend engineer'}),
  PROJECT_MANAGER: Object.freeze({id: 'project_manager', text: 'Project manager'}),
  MARKETER: Object.freeze({id: 'marketer', text: 'Marketer'})
});


/**
 * Indexes the ROLES by ID.
 * @enum {Object}
 */
const INDEXED_BY = Object.freeze({
  ID: Object.freeze(utils.object.reduce(ROLES, (agg, category) => {
    agg[category.id] = category;
    return agg;
  }, {}))
});



/**
 *
 */
module.exports.ROLES = ROLES;



/**
 *
 */
module.exports.INDEXED_BY = INDEXED_BY;



/**
 * Explicitly ordered here.
 */
module.exports.data = Object.freeze([
  ROLES.ANDROID_ENGINEER,
  ROLES.BACK_END_ENGINEER,
  ROLES.DATA_SCIENTIST,
  ROLES.IOS_ENGINEER,
  ROLES.FRONT_END_ENGINEER,
  ROLES.FULL_STACK_SOFTWARE_ENGINEER,
  ROLES.UI_UX_DESIGNER,
  ROLES.PROJECT_MANAGER,
  ROLES.MARKETER
]);
