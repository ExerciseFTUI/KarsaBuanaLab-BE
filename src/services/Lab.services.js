const { google } = require("googleapis");
const { getAuth } = require("../config/driveAuth");
const { LD } = require("../models/LembarData.models");
const { Project } = require("../models/Project.models");
const { Sampling, samplingParam } = require("../models/Sampling.models");
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
      $set: {
        "sampling_list.$.lab_assigned_to": sample.user_id,
        "sampling_list.$.deadline": sample.deadline,
      },
      // $set: {
      //   "sampling_list.$.deadline": sample.deadline,
      // },
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

  const project = await Project.findById(projectId);

  // Iterate over the samples
  samples.forEach((sample) => {
    // Find the sample in the project's sampling_list
    const foundSample = project.sampling_list.find(
      (s) => s.sample_name === sample.sample_name
    );

    // If the sample is found, update its parameters
    if (foundSample) {
      foundSample.status = "WAITING";

      sample.param.forEach((param) => {
        const foundParam = foundSample.param.find(
          (p) => p.param === param.param
        );
        if (foundParam) {
          // Update parameter values
          foundParam.result = param.result;
          foundParam.unit = param.unit;
          foundParam.method = param.method;
          foundParam.analysis_status = param.analysis_status;
        }
      });
    }
  });
  // project.current_division = "PPLHP";

  var status = false;
  // change lab_status if all sampling_list status is not "SUBMIT"
  // if sample status is "SUBMIT" or "REVISION" then status is false if all sample status is not "SUBMIT" or "REVISION" then status is true and lab_status is "NEED ANALYZE"
  project.sampling_list.forEach((sample) => {
    if (sample.status === "SUBMIT" || sample.status === "REVISION") {
      status = true;
    }
  });

  if (status === false) {
    project.lab_status = "IN REVIEW BY SPV";
  }

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
};

exports.getLD = async function () {
  const result = await LD.find().exec();
  if (!result) throw new Error("Lembar Data not found");

  if (result.length === 0) return { message: "Lembar Data not found", result };

  return { message: "Lembar Data found", result };
};

exports.assignLD = async function (body) {
  const { projectId, samplingId, paramId, LDId } = body;
  if (!projectId || !samplingId || !paramId || !LDId)
    throw new Error(
      "Please specify the project_id, sampling_id, param_id, and LD_id"
    );

  let analisis_folder_id, sample_folder_id;
  const projectObj = await Project.findById(projectId).exec();
  if (!projectObj) throw new Error("Project not found");

  const auth = getAuth("https://www.googleapis.com/auth/drive");
  const drive = google.drive({ version: "v3", auth });
  const result = await drive.files.list({
    q: `name = 'Analisis' and '${projectObj.folder_id}' in parents`,
    fields: "files(id, name)",
  });

  analisis_folder_id = result.data.files[0].id;

  if (result.data.files.length === 0) {
    const newFolder = await drive.files.create({
      requestBody: {
        name: "Analisis",
        mimeType: "application/vnd.google-apps.folder",
        parents: [projectObj.folder_id],
      },
      fields: "id",
    });
    analisis_folder_id = newFolder.data.id;
    projectObj.analisis_folder_id = newFolder.data.id;
    await projectObj.save();
  }

  const samplingObj = await Sampling.findById(samplingId).exec();
  if (!samplingObj) throw new Error("Sampling not found");

  const result2 = await drive.files.list({
    q: `name = '${samplingObj.sample_name}' and '${analisis_folder_id}' in parents`,
    fields: "files(id, name)",
  });

  sample_folder_id = result2.data.files[0].id;

  if (result2.data.files.length === 0) {
    const newFolder = await drive.files.create({
      requestBody: {
        name: samplingObj.sample_name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [analisis_folder_id],
      },
      fields: "id",
    });
    sample_folder_id = newFolder.data.id;
  }

  const samplingParamObj = projectObj.sampling_list
    .id(samplingId)
    .param.id(paramId);
  if (!samplingParamObj) throw new Error("Sampling Param not found");

  console.log(samplingParamObj);

  const LDObj = await LD.findById(LDId).exec();
  if (!LDObj) throw new Error("Lembar Data not found");

  const result3 = await drive.files.list({
    q: `name = '${samplingParamObj.param} - LD' and '${sample_folder_id}' in parents`,
    fields: "files(id, name)",
  });

  if (result3.data.files.length === 0) {
    await drive.files.copy({
      fileId: LDObj.base_ld_file_id,
      requestBody: {
        name: `${samplingParamObj.param} - LD`,
        parents: [sample_folder_id],
      },
      fields: "id",
    });
  }

  samplingParamObj.ld_file_id = result3.data.files[0].id;
  samplingParamObj.ld_name = `${samplingParamObj.param} - LD`;
  await projectObj.save();

  projectObj.analisis_folder_id = analisis_folder_id;
  await projectObj.save();

  return { message: "Success Assigning", projectObj };
};

exports.getSPVDashboard = async function () {
  try {
    console.log();
    // Find Project with Either "SAMPLING or "LAB"
    const projects = await Project.find({
      current_division: { $in: ["SAMPLING", "LAB"] },
    }).exec();

    // Step 2: Iterate through the samples of these projects to find those with the status "ACCEPTED"
    let result = [];
    let counter = 0;

    projects.forEach((project) => {
      project.sampling_list.forEach((sample) => {
        if (sample.status === "LAB_RECEIVE") {
          let sampleIdentifier;
          if (sample.sample_number) {
            sampleIdentifier = `${project.no_sampling}.${sample.sample_number}`;
          } else {
            sampleIdentifier = `${project.no_sampling}.${counter}`;
            counter++;
          }
          // Step 3: Collect the necessary details for each accepted sample
          result.push({
            project_id: project._id,
            _id: sample._id,
            sample_number: sampleIdentifier,
            sample_name: sample.sample_name,
            status: sample.status,
            deadline: sample.deadline || "haven't set deadline yet",
          });
        }
      });
    });

    return { message: "Success Fetching SPV Dashboard", success: true, result };
  } catch (error) {
    console.error("Error fetching SPV dashboard data:", error);
  }
};

exports.getStaffDashboard = async function () {
  try {
    // Find Project with Either "SAMPLING or "LAB"
    const projects = await Project.find({
      current_division: { $in: ["SAMPLING", "LAB"] },
    }).exec();

    // Step 2: Iterate through the samples of these projects to find those with the status "ACCEPTED"
    let result = [];
    let counter = 0;

    projects.forEach((project) => {
      project.sampling_list.forEach((sample) => {
        if (sample.status === "LAB_RECEIVE") {
          let sampleIdentifier;
          if (sample.sample_number) {
            sampleIdentifier = `${project.no_sampling}.${sample.sample_number}`;
          } else {
            sampleIdentifier = `${project.no_sampling}.${counter}`;
            counter++;
          }
          // Step 3: Collect the necessary details for each accepted sample
          result.push({
            project_id: project._id,
            _id: sample._id,
            sample_number: sampleIdentifier,
            sample_name: sample.sample_name,
            status: sample.status,
            deadline: sample.deadline || "haven't set deadline yet",
          });
        }
      });
    });

    return {
      message: "Success Fetching staff Dashboard",
      success: true,
      result,
    };
  } catch (error) {
    console.error("Error fetching SPV dashboard data:", error);
  }
  return { message: "Lembar Data found", success: true, result };
};

exports.getDocsAndNotesLab = async function (body) {
  const { samplingId } = body;
  if (!samplingId) throw new Error("Please specify the sampling_id");

  const sampling = await Project.findOne({ "sampling_list._id": samplingId });
  if (!sampling) throw new Error("Sampling not found");

  // return surat penawaran block, and notes
};

exports.submitLabRev = async function (body) {
  const { projectId, sampleId, samples } = body;
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  // samples just only contain 1 sampleAnswer not array of sampleAnswer
  // we can get the samplingList using the sampleId
  const sample = project.sampling_list.id(sampleId);
  if (!sample) {
    throw new Error("Sample not found");
  }

  samples.param.forEach((param) => {
    const foundParam = sample.param.find((p) => p.param === param.param);
    if (foundParam) {
      // Update parameter values
      foundParam.unit = param.unit;
      foundParam.method = param.method;
    }
  });

  // submitLabRev means API Revision of submitLab not for revision of sample
  // so the status of the sample is still "SUBMIT"
  // sample.status = "SUBMIT";

  // save the project
  await project.save();

  return { message: "Success Submitting", project };

  // // Iterate over the samples
  // samples.forEach((sample) => {
  //   // Find the sample in the project's sampling_list
  //   const foundSample = project.sampling_list.find(
  //     (s) => s.sample_name === sample.sample_name
  //   );

  //   // If the sample is found, update its parameters
  //   if (foundSample) {
  //     foundSample.status = "WAITING";

  //     sample.param.forEach((param) => {
  //       const foundParam = foundSample.param.find(
  //         (p) => p.param === param.param
  //       );
  //       if (foundParam) {
  //         // Update parameter values
  //         foundParam.result = param.result;
  //         foundParam.unit = param.unit;
  //         foundParam.method = param.method;
  //         foundParam.analysis_status = param.analysis_status;
  //       }
  //     });
  //   }
  // });
  // // project.current_division = "PPLHP";

  // var status = false;
  // // change lab_status if all sampling_list status is not "SUBMIT"
  // // if sample status is "SUBMIT" or "REVISION" then status is false if all sample status is not "SUBMIT" or "REVISION" then status is true and lab_status is "NEED ANALYZE"
  // project.sampling_list.forEach((sample) => {
  //   if (sample.status === "SUBMIT" || sample.status === "REVISION") {
  //     status = true;
  //   }
  // });

  // if (status === false) {
  //   project.lab_status = "IN REVIEW BY SPV";
  // }

  // // Save the updated project
  // await project.save();

  // return { message: "Success Adding", project };
};
