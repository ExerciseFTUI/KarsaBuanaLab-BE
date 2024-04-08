const { Project } = require("../models/Project.models");
const { Sampling } = require("../models/Sampling.models");
const { User } = require("../models/User.models");

exports.getProjectInLab = async function (body) {
  const result = await Project.find({ current_division: "LAB" });
  if (!result) {
    throw new Error("No Projects currently in lab");
  }
  return { message: "Projects currently in lab found", result };
};

exports.assignStaffToSample = async function (body) {
  const { ...sample } = body;
  if (!sample.sample_id) {
    throw new Error("Please specify the sample_id");
  }
  if (!sample.user_id && !Array.isArray(sample.user_id)) {
    throw new Error("Please specify the user_id and should be an array");
  }
  if (!sample.deadline) {
    throw new Error("Please specify the deadline");
  }
  const sampling = await Project.findOne({
    "sampling_list._id": sample.sample_id,
  });
  if (!sampling) {
    throw new Error("Sample not found");
  }
  const result = await Project.findOneAndUpdate(
    { "sampling_list._id": sample.sample_id },
    {
      $push: {
        "sampling_list.$.lab_assigned_to": sample.user_id,
      },
      $set: {
        "sampling_list.$.deadline": sample.deadline,
      },
    },
    { new: true }
  );
  if (!result) {
    throw new Error("Failed to assign staff(s) to sample");
  }
  return { message: "Staff(s) assigned to sample", result };
};

exports.changeSampleStatus = async function (body) {
  const { ...sample } = body;
  if (!sample.sample_id) {
    throw new Error("Please specify the sample_id");
  }
  if (!sample.status) {
    throw new Error("Please specify the sample_id");
  }
  const sampling = await Project.findOne({
    "sampling_list._id": sample.sample_id,
  });
  if (!sampling) {
    throw new Error("Sample not found");
  }
  const result = await Project.findOneAndUpdate(
    { "sampling_list._id": sample.sample_id },
    {
      $set: {
        "sampling_list.$.status": sample.status,
      },
    },
    { new: true }
  );
  if (!result) {
    throw new Error("Failed to accept sample");
  }
  return { message: `Sample status updated to ${sample.status}`, result };
};

exports.removeAssignedStaff = async function (body) {
  const { ...sample } = body;
  if (!sample.sample_id) {
    throw new Error("Please specify the sample_id");
  }
  if (!sample.user_id) {
    throw new Error("Please specify the user_id");
  }
  const result = await Project.findOneAndUpdate(
    { "sampling_list._id": sample.sample_id },
    { $pull: { "sampling_list.$.lab_assigned_to": sample.user_id } },
    { new: true }
  );
  if (!result) {
    throw new Error("Failed to remove staff(s) from sample");
  }
  return { message: "Staff removed from sample", result };
};

exports.submitLab = async function (body) {
  const { projectId, samples } = body;

  console.log(body);
  console.log(samples)


  const project = await Project.findById(projectId);

  // Iterate over the samples
  samples.forEach((sample) => {
    // Find the sample in the project's sampling_list
    const foundSample = project.sampling_list.find(
      (s) => s.sample_name === sample.sample_name
    );

    // If the sample is found, update its parameters
    if (foundSample) {
      sample.param.forEach((param) => {
        const foundParam = foundSample.param.find(
          (p) => p.param === param.param
        );
        if (foundParam) {
          // Update parameter values
          foundParam.result = param.result;
          foundParam.unit = param.unit;
          foundParam.method = param.method;
        }
      });
    }
  });
  project.current_division = "PPLHP";

  // Save the updated project
  await project.save();

  return { message: "Success Adding", project };
};

exports.getProjectByLab = async function (body) {
  const { projectId, userId } = body;

  const labAssignedProjects = []; // Array to hold matching projects

  // Find projects where current_division is "LAB"
  const projects = await Project.find({ current_division: "LAB" });

  // Iterate through each project
  for (const project of projects) {
    // Iterate through each sampling in the project
    for (const sampling of project.sampling_list) {
      // Check if lab_assigned_to includes the userId
      if (sampling.lab_assigned_to.includes(userId)) {
        labAssignedProjects.push(project); // Add project to the result array
        break; // Move to the next project once a match is found
      }
    }
  }

  return { message: "Success Getting", labAssignedProjects };
};

exports.changeLabStatus = async function (body) {
  try {
    const { projectId, status } = body;
    if (!projectId) throw new Error("Please specify the project_id");
    if (!status) throw new Error("Please specify the status");

    const projectObj = await Project.findById(projectId).exec();
    if (!projectObj) throw new Error("Project not found");

    projectObj.lab_status = status;
    await projectObj.save();

    return { message: "Lab status updated", projectObj };
  } catch (error) {
    throw error;
  }
};

// Add notes to project
exports.addNotes = async function (body) {
  const { projectId, notes } = body;

  if (!projectId) {
    throw new Error("Please specify the project_id");
  }
  if (!notes) {
    throw new Error("Please specify the notes");
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  // I want to add the notes to the project without removing the existing notes array
  project.notes.push(notes);
  await project.save();

  return { message: "Notes added to project", project };
}