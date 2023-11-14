const Express = require("express");
const router = Express.Router();
const sheetsControllers = require("../controllers/Sheets.controllers");

router.post("/", sheetsControllers.getMeta);
router.post("/post-values", sheetsControllers.postData);
router.post("/get-values", sheetsControllers.postValuesFromRange);
router.post("/copy", sheetsControllers.postCopyTemplate);
router.post("/create", sheetsControllers.postCreateSheets);
router.post("/update",sheetsControllers.fillValue)

module.exports = router;
