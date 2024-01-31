const express = require("express");
const router = express.Router();
const baseSampleControllers = require("../controllers/BaseSample.controllers");

router.get("/getBaseSampleById", baseSampleControllers.getBaseSample);
router.post("/addBaseSample", baseSampleControllers.addBaseSample);
router.put("/editBaseSample/:id", baseSampleControllers.editBaseSample);

module.exports = router;