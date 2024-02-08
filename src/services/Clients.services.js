const { Project } = require("../models/Project.models");

exports.login = async function (body) {
  const { projectId, password } = body;
  //   console.log(projectId);
  const project = await Project.findOne({ _id: projectId });
  if (!project) {
    throw new Error("Project Not Found");
  }

  if (password === project.password) {
    return { message: "Login Successful!", result: project.current_division };
  } else {
    throw new Error("Incorrect Password");
  }
};

exports.getSampleStatus = async function (body) {
  const { projectId } = body;
  const project = await Project.findOne({ _id: projectId });
  if (!project) {
    throw new Error("Project Not Found"); 
  }

  const sampleStatusArray = project.sampling_list.map((sampling) => ({
    sample_name: sampling.sample_name,
    status: sampling.status === "FINISHED",
  }));

  return { message: "Get Sample Successful!", result: sampleStatusArray };
};

exports.getAnalysisStatus = async function (body) {
  const { projectId } = body;
  const project = await Project.findOne({ _id: projectId });
  if (!project) {
    throw new Error("Project Not Found");
  }

  const sampleStatusArray = project.sampling_list.map((sampling) => ({
    sample_name: sampling.sample_name,
    status: sampling.status === "FINISHED",
  }));

  return {
    message: "Get Analysis Sample Successful!",
    result: sampleStatusArray,
  };
};

exports.getPaymentStatus = async function (body) {
  const { projectId } = body;
  const project = await Project.findOne({ _id: projectId });
  if (!project) {
    throw new Error("Project Not Found");
  }

  const payment = {
    is_paid: project.is_paid,
    report: "https://drive.google.com/file/d/",
    is_survey_filled: project.is_survey_filled,
  };

  return {
    message: "Get Payment Status Successful!",
    result: payment,
  };
};

exports.fillSurvey = async function (body) {
  const { projectId } = body;
  const project = await Project.findOne({ _id: projectId });
  if (!project) {
    throw new Error("Project Not Found");
  }

  project.is_survey_filled = true;

  await project.save();

  return {
    message: "Survey Is Filled",
    result: project.is_survey_filled,
  };
};
