const { Survey } = require("../models/Survey.models");

exports.createSurvey = async function (body) {
  const { title, questions } = body;

  const survey = new Survey({
    title,
    questions,
  });

  if (survey == null) {
    throw new Error("Error Creating Survey");
  }

  await survey.save();

  return { message: "Create Survey Success", survey };
};

exports.getSurvey = async function (body) {
  const { surveyId } = body;

  const survey = await Survey.findById(surveyId).exec();

  return { message: "Get Survey Success", survey };
};
