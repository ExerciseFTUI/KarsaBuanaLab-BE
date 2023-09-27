const Express = require("express");
const { google } = require("googleapis");
const router = Express.Router();
const sheetsController = require("../controllers/Sheets.controller");

router.post("/", sheetsController.postData);
router.get("/meta", sheetsController.getMeta);
router.post("/get-values", sheetsController.postValuesFromRange);
router.post("/copy", sheetsController.postCopyTemplate);
router.get("/create", sheetsController.postCreateSheets);

module.exports = router;
