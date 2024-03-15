const Express = require("express");
const router = Express.Router();
const projectsControllers = require("../controllers/Projects.controllers");
const projectMiddleware = require("../middlewares/Projects.middlewares");

router.post("/create", projectMiddleware.uploadFiles, projectsControllers.createProject);
router.post("/createJSON", projectsControllers.createProjectJSON);
router.put("/edit", projectsControllers.editProject);
router.put("/editSamples/:id", projectsControllers.editProjectSamples);
router.put("/addFiles", projectMiddleware.uploadFiles, projectsControllers.addProjectFiles);
router.put("/removeFile", projectsControllers.removeProjectFiles);
router.get("/get-sample",projectsControllers.getSample);
router.get("/get-project-by-division",projectsControllers.getProjectByDivision);
router.get("/get-link-files/:ProjectID", projectsControllers.getLinkFiles);
router.get("/get-project-by-acc", projectsControllers.getProjectByAcc);
router.post("/assign-project", projectsControllers.assignProject);
router.post("/assign-project/edit-users", projectsControllers.editAssignedProjectUsers);
router.post("/assign-project/edit-schedule", projectsControllers.editAssignedProjectSchedule);
router.post("/change-to-draft/:id",projectsControllers.changeToDraft);
router.post("/change-to-review/:id",projectsControllers.changeToReview);
router.post("/change-to-finished/:id", projectsControllers.changeToFinished);
router.get("/get-pplhp-by-status/:status",projectsControllers.getPplhpByStatus);
router.post("/change-division", projectsControllers.changeDivision);
router.get("/get-all-lhp", projectsControllers.getAllLHP);
router.get("/get-lhp/:id", projectsControllers.getLHP);

module.exports = router;