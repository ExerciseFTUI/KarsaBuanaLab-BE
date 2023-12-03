const express = require('express');
const router = express.Router();
const samplingController = require('../controllers/Sampling.controllers');

router.get('/sample/:tahun' , samplingController.getSampleByAcc);
router.get('/:tahun/:no_sampling', samplingController.getSampling);

module.exports = router;