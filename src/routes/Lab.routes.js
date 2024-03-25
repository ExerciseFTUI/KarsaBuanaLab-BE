const Express = require("express");
const router = Express.Router();
const labControllers = require("../controllers/Lab.controllers");


router.post("/", labControllers.getProjectInLab);
router.post("/assign", labControllers.assignStaffToSample);
router.post("/change-status", labControllers.changeSampleStatus);
router.post("/remove", labControllers.removeAssignedStaff);

module.exports = router;