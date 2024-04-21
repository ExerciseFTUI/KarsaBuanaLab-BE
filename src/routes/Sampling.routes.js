const express = require("express");
const router = express.Router();
const samplingController = require("../controllers/Sampling.controllers");

router.get("/sample/:tahun", samplingController.getSampleByAcc);
router.get("/get/:tahun/:no_sampling", samplingController.getSampling);
router.post("/change", samplingController.changeSampleStatus);
router.post("/assign/:id_sampling", samplingController.sampleAssignment);
router.get("/get-all-user", samplingController.getUser);
router.get("/get-dashboard-sampling/", samplingController.getDashboardSampling);
router.get("/get-sampling-details",samplingController.getSamplingDetails);
router.get("/get-sampling-list",samplingController.getSamplingList);
router.get("/get-parameter", samplingController.getParameter);

module.exports = router;
