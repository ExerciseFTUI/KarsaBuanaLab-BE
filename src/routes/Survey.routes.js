const Express = require("express");
const router = Express.Router();
const surveyControllers = require("../controllers/Survey.controllers");

router.post("/create-question", surveyControllers.createSurvey);
router.get("/get-survey", surveyControllers.getSurvey);

module.exports = router;
