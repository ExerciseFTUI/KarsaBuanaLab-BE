const Express = require("express");
const router = Express.Router();
const labControllers = require("../controllers/Lab.controllers");


router.post("/", labControllers.getProjectInLab);
router.post("/assign", labControllers.assignStaffToSample);
router.post("/change-status", labControllers.changeSampleStatus);
router.post("/remove", labControllers.removeAssignedStaff);
router.post("/submit-lab",labControllers.submitLab)
router.get("/get-project-by-lab",labControllers.getProjectByLab);
router.post("/change-lab-status",labControllers.changeLabStatus);
router.post("/add-notes",labControllers.addNotes);

module.exports = router;