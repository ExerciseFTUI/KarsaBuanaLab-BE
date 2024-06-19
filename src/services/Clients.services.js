const { Project } = require("../models/Project.models");
const { notifyEmail } = require("../utils/Mail.utils");

exports.login = async function (body) {
  const { projectId, password } = body;

  const project = await Project.findOne({ _id: projectId });
  if (!project) {
    throw new Error("Project Not Found");
  }

  if (password === project.password) {
    const projectReturn = {
      project_name: project.project_name,
      client_name: project.client_name,
      contact_person: project.contact_person,
      status: project.status,
      current_division: project.current_division,
    };
    console.log(projectReturn);
    return { message: "Login Successful!", result: projectReturn };
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
    status: sampling.status,
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
    status: sampling.status,
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

exports.getAllStatus = async function (body) {
  const { projectId } = body;
  const project = await Project.findOne({ _id: projectId });
  if (!project) {
    throw new Error("Project Not Found");
  }

  const sampleStatusArray = project.sampling_list.map((sampling) => ({
    sample_name: sampling.sample_name,
    parameter: sampling.param,
    status: sampling.status,
  }));

  const result = {
    sample_status: sampleStatusArray,
    is_paid: project.is_paid,
    report: "https://drive.google.com/file/d/",
    is_survey_filled: project.is_survey_filled,
  };

  return {
    message: "Get All Status Success",
    result: result,
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

exports.resendEmail = async function (body) {
  const { projectId } = body;
  const project = await Project.findOne({ _id: projectId });
  if (!project) {
    throw new Error("Project Not Found");
  }

  await notifyEmail(
    project.surel,
    "Check out your project",
    `Your project ${project.project_name} has been created.
    \nProject ID: ${project.id}
    \nPassword: ${project.password}
    \nYou can access your project using this information in our <a href=${process.env.DOMAIN_NAME}>website</a>.

    \n\nPlease keep this information safe.
    \nThank you.`
  );

  return {
    message: "Email Sent",
  };
};
