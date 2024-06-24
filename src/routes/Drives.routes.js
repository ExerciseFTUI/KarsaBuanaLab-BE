const Express = require("express");
const router = Express.Router();
const drivesControllers = require("../controllers/Drives.controllers");
const authMiddleware = require("../middlewares/Auth.middlewares");


router.post("/", drivesControllers.getDrive);
router.post("/rename",authMiddleware.authenticateToken, drivesControllers.renameFile);
router.post("/create-folder", drivesControllers.createFolder);
router.post("/delete", drivesControllers.deleteFile);
router.post("/get-folder-details", drivesControllers.getFolderDetails);

module.exports = router;