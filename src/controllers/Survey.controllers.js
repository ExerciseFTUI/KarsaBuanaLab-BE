const surveyServices = require("../services/Survey.services");

exports.createSurvey = async function (req, res) {
  try {
    const result = await surveyServices.createSurvey(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getSurvey = async function (req, res) {
  try {
    const result = await surveyServices.getSurvey(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.submitSurvey = async function (req,res) {
  try{
    const result = await surveyServices.submitSurvey(req.body);
    res.status(200).json(result);
  } catch(err){
    res.status(400).json({message: err.message});

  }

}