const express = require('express');
const router = express.Router();
const logging = require('../services/logging')();

logging.info('Defining routes.');

router.use('/users', require('../resources/users/users-routes'));

router.use('/candidates', require('../resources/candidates/candidates-routes'));

router.use('/proposals', require('../resources/proposals/proposals-routes'));

router.use('/roles', require('../resources/roles/roles-routes'));

router.use('/scrape', require('../resources/scrape/scrape-routes'));

router.use('/jobs', require('../resources/job/job-routes'));

router.use('/images', require('../resources/images/images-routes'));

router.use('/companies', require('../resources/company/company-routes'));

router.use('/companyDetails', require('../resources/company-details/company-details-routes'));

router.use('/businesses', require('../resources/businesses/businesses-routes'));

router.use('/lists', require('../resources/lists/lists-routes'));

module.exports = router;
