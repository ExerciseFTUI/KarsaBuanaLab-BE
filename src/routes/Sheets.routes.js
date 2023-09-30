const Express = require("express");
const { google } = require("googleapis");
const router = Express.Router();
const sheetsControllers = require("../controllers/Sheets.controller");

router.post("/", sheetsControllers.postData);
router.get("/meta", sheetsControllers.getMeta);
router.post("/get-values", sheetsControllers.postValuesFromRange);
router.post("/copy", sheetsControllers.postCopyTemplate);
router.get("/create", sheetsControllers.postCreateSheets);

module.exports = router;
