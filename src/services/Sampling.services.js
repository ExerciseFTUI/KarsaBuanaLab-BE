const { Sampling } = require("../models/Sampling.models");
const { Project } = require("../models/Project.models");
const { User } = require("../models/User.models");
const mongoose = require("mongoose");

exports.getSampling = async function (params) {
  const sample = await getSample(params);
  if (sample == null) {
    throw new Error("No sample found");
  }
  return { message: "success", sample };
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
  return { message: "success", projectRes };
};

exports.changeSampleStatus = async function (body) {
  // const { projectId, status, sample_name } = body;
  const { projectId, status, sample_id } = body;

  const projectObj = await Project.findById(projectId).exec();
  if (!projectObj) throw new Error("Project not exist!");

  projectObj.sampling_list.forEach(async (sample) => {
    if (sample._id == sample_id) {
      sample.status = status;
    }
  });

  await projectObj.save();

  return { message: "Success update status", projectObj };
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

exports.getUser = async function (body) {
  if (!body.role) {
    throw new Error("Please specify the role");
  }

  if (body.role === "SPV") {
    if (!body.division) {
      throw new Error("Please specify the division");
    }
  }
  let userList;

  if (!body.division) {
    userList = await User.find({ role: body.role });
  } else {
    userList = await User.find({ role: body.role, division: body.division });
  }

  if (userList == null) {
    throw new Error("No user found");
  }

  return { message: "success", result: userList };
};

exports.getDashboardSampling = async function () {
  const projects = await Project.find();

  const result = await Promise.all(
    projects.map(async (project) => {
      let person = null;
      if (
        project.project_assigned_to != null ||
        project.project_assigned_to.length != 0
      ) {
        let empty = false;
        person = await Promise.all(
          project.project_assigned_to.map(async (id) => {
            if (mongoose.Types.ObjectId.isValid(id)) {
              const user = await User.findById(id);
              return user.username;
            }
            empty = true;
            return null;
          })
        );
        if (empty) {
          person = [];
        }
      }
      
      // Function to convert date format from DD/MM/YYYY to MM/DD/YYYY
      const convertDateFormat = (dateString) => {
        if (!dateString) return null; // If dateString is null, return null
        const [day, month, year] = dateString.split('-');
        return `${month}-${day}-${year}`;
      };

      const result = {
        _id: project._id,
        title: project.project_name,
        start: convertDateFormat(project.jadwal_sampling ? project.jadwal_sampling.from : null),
        end: convertDateFormat(project.jadwal_sampling ? project.jadwal_sampling.to : null),
        person,
      };
      return result;
    })
  );

  return { message: "success", result };
};
