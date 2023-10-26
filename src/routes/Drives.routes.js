const Express = require("express");
const router = Express.Router();
const drivesControllers = require("../controllers/Drives.controllers");

router.post("/", drivesControllers.getDrive);
router.post("/rename", drivesControllers.renameFile);
router.post("/create-folder", drivesControllers.createFolder);
router.post("/delete", drivesControllers.deleteFile);

module.exports = router;