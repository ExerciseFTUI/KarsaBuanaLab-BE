const { Sampling } = require("../models/Sampling.models");
const { Project } = require("../models/Project.models");
const { User } = require("../models/User.models");
const { BaseSample } = require("../models/BaseSample.models");
const mongoose = require("mongoose");
const { Param } = require("../models/Param.models");

exports.getSampling = async function (params) {
  const sample = await getSample(params);
  if (sample == null) {
    throw new Error("No sample found");
  }
  return { message: "success", sample };
};

exports.sampleAssignment = async function (params, body) {
  const { userId, deadline } = body;
  const id_sampling = params.id_sampling;

  if (!id_sampling) {
    throw new Error("Please specify the sampling id");
  }
  if (!userId) {
    throw new Error("Please specify the user");
  }
  if (!deadline) {
    throw new Error("Please specify the deadline");
  }

  try {
    const projectObj = await Project.findOne({
      "sampling_list._id": id_sampling,
    });
    if (!projectObj) {
      throw new Error("No sample found in project");
    }

    const sampleObj = projectObj.sampling_list.find(
      (sample) => sample._id == id_sampling
    );

    // Check if user is already assigned to the sample
    const isUserAssigned = sampleObj.lab_assigned_to.some((assignee) =>
      assignee.equals(userId)
    );
    if (isUserAssigned) {
      throw new Error("User already assigned");
    }

    // Assign user to the sample
    sampleObj.lab_assigned_to.push(userId);
    sampleObj.status = "ASSIGNED";
    sampleObj.deadline = deadline;

    await projectObj.save();

    return { message: "success", result: projectObj };
  } catch (error) {
    throw new Error("Failed to assign user to sample: " + error.message);
  }
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
      if (status === "REVISION BY SPV") {
        sample.status = "REVISION";
      } else {
        if (status === "ACCEPTED LAB") {
          projectObj.lab_status = "IN REVIEW BY ADMIN";
        }
        sample.status = status;
      }
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
  const projects = await Project.find({ current_division: "SAMPLING" });

  const result = await Promise.all(
    projects.map(async (project) => {
      let person = null;
      if (
        project.project_assigned_to != null ||
        project.project_assigned_to.length != 0 ||
        project.valuasi_proyek != null
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
        const [day, month, year] = dateString.split("-");
        return `${year}-${month}-${day}`;
      };

      const result = {
        _id: project._id,
        title: project.project_name,
        start: convertDateFormat(
          project.jadwal_sampling ? project.jadwal_sampling.from : null
        ),
        end: convertDateFormat(
          project.jadwal_sampling ? project.jadwal_sampling.to : null
        ),
        location: project.alamat_sampling,
        person,
      };
      return result;
    })
  );

  return { message: "success", result };
};

exports.getSamplingDetails = async function (body) {
  const { projectId, userId } = body;
  let count = 0;
  const project = await Project.findById(projectId);
  if (!project) {
    return { error: "Project not found" };
  }

  const samplingList = [];

  for (const sampling of project.sampling_list) {
    count++;
    if (sampling.lab_assigned_to.includes(userId)) {
      const baseSample = await BaseSample.findOne({
        sample_name: sampling.sample_name,
      });

      const parameterDetails = [];

      for (const param of sampling.param) {
        const parameter_found = baseSample.param.find(
          (baseParam) => baseParam.param === param.param
        );
        parameterDetails.push({
          name: param.param,
          unit: param.unit || null,
          method: param.method || null,
          result: param.result || null,
          analysis_status: param.analysis_status,
        });
      }

      samplingList.push({
        sampleName: sampling.sample_name,
        assignedTo: sampling.lab_assigned_to,
        parameters: parameterDetails,
      });
    }
  }

  const result = {
    judul: project.project_name,
    status: project.lab_status,
    deadline: project.deadline_lhp,
    lhp: "null",
    dokumen: [
      { judul: "Log Penerimaan Sample", url: null },
      { judul: "Akomodasi Lingkungan", url: null },
    ],
    input: samplingList,
  };


  return { message: "success", result };
};

exports.getSamplingList = async function (body) {
  try {
    const { projectId } = body;
    const projectObj = await Project.findById(projectId).exec();
    if (!projectObj) {
      throw new Error("Project not found");
    }

    return { message: "success", result: projectObj.sampling_list };
  } catch (error) {
    throw new Error("Failed to get sampling list: " + error.message);
  }
};

exports.getParameter = async function (body) {
  try {
    const { projectId, userId } = body;
    const projectObj = await Project.findById(projectId).exec();
    if (!projectObj) {
      return { error: "Project not found" };
    }
    if (!userId) {
      return { error: "User not found" };
    }

    let parameterList = [];
    for (const sample of projectObj.sampling_list) {
      if (sample.lab_assigned_to.includes(userId)) {
        for (const param of sample.param) {
          if (!parameterList.includes(param.param)) {
            parameterList.push(param.param);
          }
        }
      }
    }

    let result = [];
    for (const paramName of parameterList) {
      const tempResult = await Param.findOne({ param: paramName }).exec();
      const mapTempResult = {
        param: tempResult.param,
        unit: tempResult.unit,
        method: tempResult.method
      };
      result.push(mapTempResult);
    }

    return { message: "success", result: result };
  } catch (error) {
    throw new Error("Failed to get parameter: " + error.message);
  }
};

exports.getDetailsPPLHP = async function (body) {
  try {
    const { projectId } = body;
    const project = await Project.findById(projectId).exec();
    if (!project) {
      throw new Error("Project not found");
    }

  
    const result = {
      project_name: project.project_name,
      sampling: project.sampling_list,
      logbook_internal: `https://docs.google.com/spreadsheets/d/${process.env.LOGBOOK_INTERNAL}`,
      logbook_external: `https://docs.google.com/spreadsheets/d/${process.env.LOGBOOK_EXTERNAL}`,
      files: [
        { judul: `Surat Penawaran`, url: `https://docs.google.com/spreadsheets/d/${project.surat_penawaran}` }
      ],
    }

    return { message: "success get Receive Details",success: true, result: result };
  } catch (error) {
    throw new Error("Failed to get sampling list: " + error.message);
  }
};
