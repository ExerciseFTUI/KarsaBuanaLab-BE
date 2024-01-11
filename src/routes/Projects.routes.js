const Express = require("express");
const router = Express.Router();
const projectsControllers = require("../controllers/Projects.controllers");
const projectMiddleware = require("../middlewares/Projects.middlewares");

router.post("/add-base-sample", projectsControllers.newBaseSample);
router.post("/create", projectMiddleware.uploadFiles, projectsControllers.createProject);
router.put("/edit", projectMiddleware.uploadFiles, projectsControllers.editProject);
router.get("/get-sample",projectsControllers.getSample);
router.get("/get-project-by-division/:division",projectsControllers.getProjectByDivision);
router.get("/get-link-files/:ProjectID", projectsControllers.getLinkFiles);

module.exports = router;