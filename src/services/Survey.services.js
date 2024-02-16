const { Project } = require("../models/Project.models");
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
  const survey = await Survey.findById("65cf38e96b9daebce80bb89a").exec();

  return { message: "Get Survey Success", survey };
};

exports.submitSurvey = async function (body) {
  const { projectId, answers } = body;

  const survey = await Survey.findById("65cf38e96b9daebce80bb89a").exec();
  if (!survey) {
    throw new Error("Survey Not Found");
  }

  const project = await Project.findById(projectId).exec();

  if (!project) {
    throw new Error("Project Not Found");
  }

  const response = {
    projectId: projectId,
    answers: answers,
  };

  survey.responses.push(response);

  await survey.save();

  project.is_survey_filled = true;

  await project.save();

  return { message: "Post Answers Success", survey };
};

// {
//   "surveyId": "your_survey_id",
//   "projectId": "your_project_id",
//   "answers": [
//     { "questionId": "your_question_id_1", "value": "answer1" },
//     { "questionId": "your_question_id_2", "value": "answer2" },
//     // Add more answers as needed
//   ]
// }
