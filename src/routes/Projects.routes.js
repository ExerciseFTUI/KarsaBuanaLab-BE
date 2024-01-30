const Express = require("express");
const router = Express.Router();
const projectsControllers = require("../controllers/Projects.controllers");
const projectMiddleware = require("../middlewares/Projects.middlewares");

router.post("/add-base-sample", projectsControllers.newBaseSample);
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
router.post("/change-draft-status/:id",projectsControllers.changeDraftStatus);

module.exports = router;