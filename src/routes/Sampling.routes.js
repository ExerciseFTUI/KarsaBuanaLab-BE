const express = require('express');
const router = express.Router();
const samplingController = require('../controllers/Sampling.controllers');

router.get('/sample/:tahun' , samplingController.getSampleByAcc);
router.get('/get/:tahun/:no_sampling', samplingController.getSampling);
router.post('/change/:tahun/:no_sampling', samplingController.changeSampleStatus);
router.post('/assign/:tahun/:no_sampling', samplingController.sampleAssignment);

module.exports = router;