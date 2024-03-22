const Express = require("express");
const router = Express.Router();
const labControllers = require("../controllers/Lab.controllers");


router.post("/", labControllers.getProjectInLab);
router.post("/assign", labControllers.assignPersonToSample);
router.post("/change-status", labControllers.changeSampleStatus);

module.exports = router;