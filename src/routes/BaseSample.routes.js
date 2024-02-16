const express = require("express");
const router = express.Router();
const baseSampleControllers = require("../controllers/BaseSample.controllers");
const baseSampleMiddleware = require("../middlewares/Projects.middlewares");

router.get("/getBaseSampleById", baseSampleControllers.getBaseSample);
router.post("/addBaseSample", baseSampleMiddleware.uploadFiles,baseSampleControllers.addBaseSample);
router.put("/editBaseSample/:id", baseSampleControllers.editBaseSample);
router.delete("/removeBaseSample", baseSampleControllers.removeBaseSample);

module.exports = router;