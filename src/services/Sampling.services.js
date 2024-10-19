const { Sampling } = require("../models/Sampling.models");
const { Project } = require("../models/Project.models");
const { User } = require("../models/User.models");
const { LD } = require("../models/LembarData.models");
const { BaseSample } = require("../models/BaseSample.models");
const mongoose = require("mongoose");
const { Param } = require("../models/Param.models");
const projectsUtils = require("../utils/Projects.utils");

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

  return { message: "Success update status", result: projectObj };
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
  const project = await Project.findById(projectId);
  if (!project) {
    return { error: "Project not found" };
  }

  const samplingList = [];

  for (const sampling of project.sampling_list) {
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
        method: tempResult.method,
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
    const { project_id } = body;
    const project = await Project.findById(project_id).exec();
    if (!project) {
      throw new Error("Project not found");
    }

    const result = {
      project_name: project.project_name,
      sampling: project.sampling_list,
      logbook_internal: `https://docs.google.com/spreadsheets/d/${process.env.LOGBOOK_INTERNAL}`,
      logbook_external: `https://docs.google.com/spreadsheets/d/${process.env.LOGBOOK_EXTERNAL}`,
      files: [
        {
          judul: `Surat Penawaran`,
          url: `https://docs.google.com/spreadsheets/d/${project.surat_penawaran}`,
        },
      ],
    };

    return {
      message: "success get Receive Details",
      success: true,
      result: result,
    };
  } catch (error) {
    throw new Error("Failed to get sampling list: " + error.message);
  }
};

exports.getInputSamplingForLab = async function (body) {
  const { sampleId } = body;

  const project = await Project.findOne({
    "sampling_list._id": sampleId,
  }).exec();
  if (!project) {
    return { error: "Project not found" };
  }

  const sampling = project.sampling_list.find(
    (sample) => sample._id == sampleId
  );
  if (!sampling) {
    return { error: "Sample not found" };
  }

  // return the array of parameters that includes name, unit, method and analysis_status
  const parameters = sampling.param.map((param) => ({
    name: param.param,
    unit: param.unit || null,
    method: param.method || null,
    analysis_status: param.analysis_status,
    lembar_data: {
      ld_name: param.ld_name || null,
      ld_file_id: param.ld_file_id || null,
    },
  }));

  const result = {
    sampleName: sampling.sample_name,
    parameters,
  };

  return { message: "success", result: result };
};

exports.getParameterRev = async function (body) {
  try {
    const { sampleId } = body;

    // Fetch the project object
    const projectObj = await Project.findOne({
      "sampling_list._id": sampleId,
    }).exec();
    if (!projectObj) {
      return { error: "Project not found" };
    }

    // Find the sample object
    const sampleObj = projectObj.sampling_list.find(
      (sample) => sample._id == sampleId
    );
    if (!sampleObj) {
      return { error: "Sample not found" };
    }

    // Create a list of unique parameters
    let parameterList = [];
    for (const param of sampleObj.param) {
      if (!parameterList.includes(param.param)) {
        parameterList.push(param.param);
      }
    }

    // Fetch parameter details and store the result
    let result = [];
    for (const paramName of parameterList) {
      const tempResult = await Param.findOne({ param: paramName }).exec();
      if (tempResult) {
        const mapTempResult = {
            param: tempResult.param,
            unit: tempResult.unit,
            method: tempResult.method
        };
        result.push(mapTempResult);
      }
    }

    // Fetch all LD entries from the database
    const ldList = await LD.find().exec();

    // Return the final result along with LD entries
    return { message: "success", result: result, ldData: ldList };
  } catch (error) {
    throw new Error("Failed to get parameter: " + error.message);
  }
};

exports.getReceiveDashboard = async function (body) {
  try {
    const runningProjects = await Project.find({ status: "RUNNING" });

    if (!runningProjects || runningProjects.length === 0) {
      return { message: "No RUNNING projects found" };
    }

    let submittedSamples = [];

    for (const project of runningProjects) {
      for (const sample of project.sampling_list) {
        if (sample.status === "SUBMIT") {
          submittedSamples.push({
            project_id: project.id,
            project_name: project.project_name,
            sample_id: sample.id,
            sample_name: sample.sample_name,
            project_type: project.project_type ?? null,
            sample_number: sample.sample_number ?? "",
            location: project.alamat_sampling,
            project_contact_person: project.contact_person, // Assuming this field exists in the project schema
          });
        }
      }
    }

    return { message: "success", result: submittedSamples };
  } catch (error) {
    throw new Error("Failed to get receive dashboard: " + error.message);
  }
};

exports.getProjectSampleDetails = async function (body) {
  try {
    const { projectId, samplingId } = body;

    // Find the project by its ID
    const projectObj = await Project.findById(projectId).exec();
    if (!projectObj) {
      return { error: "Project not found" };
    }

    // Find the specific sample in the sampling_list by its ID
    const sampleObj = projectObj.sampling_list.find(
      (sample) => sample._id == samplingId
    );
    if (!sampleObj) {
      return { error: "Sample not found" };
    }

    // Get the logbook details from environment variables
    const baseUrl = "https://docs.google.com/spreadsheets/d/";
    const logbook_internal = baseUrl + process.env.LOGBOOK_INTERNAL;
    const logbook_external = baseUrl + process.env.LOGBOOK_EXTERNAL;

    // Return the required details including all parameters (paramSchema)
    return {
      message: "success",
      result: {
        project_name: projectObj.project_name,
        sampling: sampleObj,
        files: [
          {
            judul: "Surat Penawaran",
            url: baseUrl + projectObj.surat_penawaran,
          },
        ],
        project_type: projectObj.project_type || null,
        logbook_internal,
        logbook_external,
      },
    };
  } catch (error) {
    throw new Error("Failed to get project sample details: " + error.message);
  }
};

exports.updateSampleStatusAndDate = async function (body) {
  try {
    const { projectId, samplingId, sampling } = body;

    // Find the project by its ID
    const projectObj = await Project.findById(projectId).exec();
    if (!projectObj) {
      return { error: "Project not found" };
    }
    const fixedSampling = sampling.sampling;

    // Update all samples with the same samplingId in the sampling_list
    projectObj.sampling_list = projectObj.sampling_list.map((sample) => {
      if (sample._id == samplingId) {
        // Replace the entire sample with the new data
        return { ...sample, ...fixedSampling };
      }
      return sample;
    });

    // check all of the sampling_list, if all of the status is LAB_RECEIVE
    // change the projectObj.current_divion to LAB
    let allLabReceive = true;
    for (const sample of projectObj.sampling_list) {
      if (sample.status !== "LAB_RECEIVE") {
        allLabReceive = false;
        break;
      }
    }
    if (allLabReceive) {
      projectObj.current_division = "LAB";
    }

    // Save the project with the updated sample data
    await projectObj.save();

    return {
      message: "Sample(s) updated successfully",
      sampling_list: projectObj.sampling_list,
    };
  } catch (error) {
    throw new Error("Failed to update sample(s): " + error.message);
  }
};

exports.updateProjectTtdType = async function (body) {
  try {
    const { projectId, ttd_type } = body;

    // Validate ttd_type input
    const validTypes = ["DIRECTOR", "TM"];
    if (!validTypes.includes(ttd_type)) {
      return { error: "Invalid ttd_type value" };
    }

    // Find the project by its ID
    const projectObj = await Project.findById(projectId).exec();
    if (!projectObj) {
      return { error: "Project not found" };
    }

    // Update the ttd_type in the project
    projectObj.ttd_type = ttd_type;

    // Save the project with updated ttd_type
    await projectObj.save();

    return {
      message: "ttd_type updated successfully",
      project: projectObj,
    };
  } catch (error) {
    throw new Error("Failed to update ttd_type: " + error.message);
  }
};

// update sample with like above function but with params project id and sample id as params, and body as new sample data
exports.updateSampleWithId = async function (params, body) {
  const { project_id, sample_id } = params;

  if (!body || Object.keys(body).length === 0) {
    throw new Error("Request body is empty");
  }

  let result = await Project.findOne({ _id: project_id });
  if (!result) {
    throw new Error("Project not found");
  }

  let sample = result.sampling_list.find((sample) => sample._id == sample_id);
  if (!sample) {
    throw new Error("Sample not found");
  }

  let new_sampling_list = [];
  let new_regulation_list = [];
  let new_param_list = [];
  let sampling_object_list = [];

  if (sample.sample_name === body.sample_name) {
    if (sample.regulation_name[0].regulation_name === body.regulation_name) {
      if (sample.param.toString() === body.param.toString()) {
        sampling_object_list.push(sample);
      } else {
        new_sampling_list.push(body.sample_name);
        new_regulation_list.push(body.regulation_name);
        new_param_list.push(body.param);
      }
    } else {
      new_sampling_list.push(body.sample_name);
      new_regulation_list.push(body.regulation_name);
      new_param_list.push(body.param);
    }
  } else {
    new_sampling_list.push(body.sample_name);
    new_regulation_list.push(body.regulation_name);
    new_param_list.push(body.param);
  }

  if (
    new_sampling_list.length ||
    new_regulation_list.length ||
    new_param_list.length
  ) {
    const folder_sample_id = await projectsUtils.getFolderIdByName(
      "Folder Sampel",
      result.folder_id
    );

    const new_sampling_obj = await projectsUtils.copySampleTemplate(
      false,
      folder_sample_id,
      new_sampling_list,
      result.project_name,
      new_regulation_list,
      new_param_list
    );

    // edit status = "SUBMIT" and lab_assigned_to = [] and deadline = null
    new_sampling_obj[0].status = "SUBMIT";
    new_sampling_obj[0].lab_assigned_to = sample.lab_assigned_to || [];
    new_sampling_obj[0].deadline = sample.deadline || null;

    sampling_object_list = sampling_object_list.concat(new_sampling_obj);
  }

  // merge the sampling_object_list with the existing sampling_list
  // and replace the same sample_id with the new data of sampling_object_list id
  result.sampling_list = result.sampling_list.map((sample) => {
    if (sample._id == sample_id) {
      return sampling_object_list[0];
    }
    return sample;
  });

  result = await Project.findOneAndUpdate(
    { _id: project_id },
    { sampling_list: result.sampling_list },
    { new: true }
  );

  return {
    message: "Successfully updated sample",
    result: sampling_object_list[0]._id,
  };
};
