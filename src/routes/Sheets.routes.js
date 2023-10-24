const Express = require("express");
const { google } = require("googleapis");
const router = Express.Router();
const sheetsControllers = require("../controllers/Sheets.controller");

router.post("/", sheetsControllers.postData);
router.get("/meta", sheetsControllers.getMeta);
router.post("/get-values", sheetsControllers.postValuesFromRange);
router.post("/copy", sheetsControllers.postCopyTemplate);
router.get("/create", sheetsControllers.postCreateSheets);
router.get("/drive", sheetsControllers.getDrive);
router.post("/drive/rename", sheetsControllers.renameFile);
router.post("/drive/create-folder", sheetsControllers.createFolder);

module.exports = router;
