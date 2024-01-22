const { Sampling } = require("../models/Sampling.models");
const { Project } = require("../models/Project.models");
const { User } = require("../models/User.models");

exports.getSampling = async function (params) {
  const sample = await getSample(params);
  if (sample == null) {
    throw new Error("No sample found");
  }
  return { message: "success", data: sample };
};

exports.sampleAssignment = async function (params, body) {
  const { ...user } = body;
  const id_sampling = params.id_sampling;

  if (!id_sampling) {
    throw new Error("Please specify the sampling id");
  }
  if (!user.accountId) {
    throw new Error("Please specify the user");
  }

  const criteria = {
    sampling_list: {
      $elemMatch: {
        _id: id_sampling,
      },
    },
  };
  const projectObj = await Project.findOne(criteria);
  if (projectObj == null) {
    throw new Error("No sample found in project");
  }
  const userObj = await User.findOne({ _id: user.accountId });
  if (userObj == null) {
    throw new Error("No user found");
  }
  const sampleObj = projectObj.sampling_list.filter(
    (sample) => sample._id == id_sampling
  );
  const duplicateUser = sampleObj[0].lab_assigned_to.filter(
    (acc) => acc._id == user.accountId
  );
  if (duplicateUser.length > 0) {
    throw new Error("User already assigned");
  }
  const inProject = projectObj.project_assigned_to.filter(
    (acc) => acc._id == user.accountId
  );

  const update = {
    $push: { "sampling_list.$.lab_assigned_to": userObj },
    $set: { "sampling_list.$.status": "ASSIGNED" },
  };
  const result = await Project.findOneAndUpdate(criteria, update, {
    new: true,
  });
  if (result == null) {
    throw new Error("Failed to assign user to sample");
  }
  return { message: "success", result };
};

exports.getSampleByAcc = async function (params, body) {
  const projectList = await Project.find({ created_year: params.tahun });
  if (projectList == null) {
    throw new Error("No project found");
  }

  const projectRes = [];
  projectList.forEach(async (project) => {
    const sampleList = project.sampling_list;
    sampleList.forEach(async (sample) => {
      const user = sample.lab_assigned_to;
      user.forEach(async (acc) => {
        if (acc._id == body.accountId) {
          projectRes.push(project);

          if (projectRes.length > 1) {
            projectRes.forEach(async (project) => {
              const duplicateProject = projectRes.filter(
                (p) => p._id == project._id
              );
              if (duplicateProject.length > 1) {
                projectRes.splice(projectRes.indexOf(project), 1);
              }
            });
          }
        }
      });
    });
  });

  const user = await User.findById(body.accountId).exec();
  if (user == null) {
    throw new Error("No user found");
  }

  if (projectRes == null) {
    throw new Error("No project found");
  }
  return { message: "success", data: projectRes };
};

exports.changeSampleStatus = async function (body) {
  const { projectId, status, sample_name } = body;

  const projectList = await Project.findOne(
    { _id: projectId },
    { "sampling_list.sample_name": sample_name }
  );

  if (!projectList) {
    throw new Error("No project found");
  }

  const sampleList = projectList.sampling_list;

  sampleList.forEach(async (sample) => {
    if (sample.sample_name === sample_name) {
      sample.status = status;
    }
  });

  await projectList.save();

  return { message: "Success update status", data: projectList };
};

async function getSample(params) {
  const { tahun, no_sampling } = params;
  const projectList = await Project.find({ created_year: tahun });
  const samplingList = [];
  projectList.forEach(async (project) => {
    const sampleList = project.sampling_list;
    sampleList.forEach(async (sample) => {
      if (sample._id == no_sampling) {
        samplingList.push(sample);
      }
    });
  });

  return samplingList[0];
}

exports.getUser = async function () {
  const userList = await User.find({ role: "SPV" });
  if (userList == null) {
    throw new Error("No user found");
  }
  return { message: "success", data: userList };
}