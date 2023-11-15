const express = require('express');
const router = express.Router();
const marketingController = require('../controllers/Marketing.controller');

router.get('/dashboard', marketingController.dashboard);
router.get('/getSample', marketingController.getSample);
router.get('/:status', marketingController.getProjectByStatus);
router.get('/:status/:year', marketingController.getProjectByStatusAndYear);
router.get('/:ProjectID', marketingController.getProjectByID);

module.exports = router;