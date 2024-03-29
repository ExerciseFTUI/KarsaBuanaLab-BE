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
