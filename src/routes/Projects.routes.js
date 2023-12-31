const Express = require("express");
const router = Express.Router();
const projectsControllers = require("../controllers/Projects.controllers");
const projectMiddleware = require("../middlewares/Projects.middlewares");

router.post("/add-base-sample", projectsControllers.newBaseSample);
router.post("/create", projectMiddleware.uploadFiles, projectsControllers.createProject);

module.exports = router;