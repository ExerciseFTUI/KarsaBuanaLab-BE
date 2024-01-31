const { google } = require("googleapis");
const { User } = require("../models/User.models");
const { Project } = require("../models/Project.models");
const { BaseSample } = require("../models/BaseSample.models");
const { File } = require("../models/File.models");
const { Sampling } = require("../models/Sampling.models");
const { getAuth } = require("../config/driveAuth");
const drivesServices = require("../services/Drives.services");
const sheetsServices = require("../services/Sheets.services");
const projectsUtils = require("../utils/Projects.utils");
const { Regulation } = require("../models/Regulation.models");

exports.newBaseSample = async function (body) {
  const regulationObj = body;
  const dupCheck = await BaseSample.findOne({
    sample_name: regulationObj.sample_name,
  });
  if (dupCheck) {
    throw new Error("Base sample already exists");
  }
  const arrOfRegulation = await Promise.all(
    regulationObj.regulation.map(async (reg) => {
      const regulation = new Regulation({
        regulation_name: reg.regulation_name,
        default_param: reg.default_param,
      });
      await regulation.save();
      return regulation;
    })
  );

  const result = new BaseSample({
    sample_name: regulationObj.sample_name,
    file_id: regulationObj.file_id,
    file_safety_id: regulationObj.file_safety_id,
    param: regulationObj.param,
    regulation: arrOfRegulation,
  });
  await result.save();
  return { message: "Base sample created", result };
};

/* TODO: 
      - Rename gdrive folder if project name is changed
      - Remove duplicate folder sample
*/
exports.editProject = async function (body) {
  const { ...project } = body;

  if (!project._id || project._id == null) {
    throw new Error("Please specify the project _id");
  }
  if (Object.keys(project).length == 1) {
    throw new Error("Only project _id is being passed");
  }
  let result = await Project.findOneAndUpdate(
    { _id: project._id },
    { ...project },
    { new: true }
  );
  if (!result) {
    throw new Error("Project not found");
  }
  return { message: "Successfully edited project", result };
};

exports.editProjectSamples = async function (project_id, body) {
  if (!project_id || project_id == null) {
    throw new Error("Please specify the project_id");
  }
  if (!body || body == null) {
    throw new Error("Request body is empty");
  }

  let result = await Project.findOne({ _id: project_id });
  if (!result) {
    throw new Error("Project not found");
  }
  let new_sampling_list = [];
  let new_regulation_list = [];
  let new_param_list = [];
  let sampling_object_list = [];
  body.forEach((sample, index) => {
    const indexOfValue = result.sampling_list.findIndex(
      (res) => res.sample_name === sample.sample_name
    );
    if (indexOfValue !== -1) {
      if (
        result.sampling_list[indexOfValue].regulation_name[0].regulation_name ==
        body[index].regulation_name
      ) {
        if (
          result.sampling_list[indexOfValue].param.toString() ===
          sample.param.toString()
        ) {
          sampling_object_list.push(result.sampling_list[indexOfValue]);
        } else {
          new_sampling_list.push(sample.sample_name);
          new_regulation_list.push(body[index].regulation_name);
          new_param_list.push(body[index].param);
        }
      } else {
        new_sampling_list.push(sample.sample_name);
        new_regulation_list.push(body[index].regulation_name);
        new_param_list.push(body[index].param);
      }
    } else {
      new_sampling_list.push(sample.sample_name);
      new_regulation_list.push(body[index].regulation_name);
      new_param_list.push(body[index].param);
    }
  });

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

    sampling_object_list = sampling_object_list.concat(new_sampling_obj);
  }

  result = await Project.findOneAndUpdate(
    { _id: project_id },
    { sampling_list: sampling_object_list },
    { new: true }
  );

  return { message: "Successfully edited project samples", result };
};

exports.editProjectFiles = async function (files, body) {
  const { ...project } = body;

  if (!project._id || project._id == null) {
    throw new Error("Please specify the project _id");
  }
  if (!files.length) {
    throw new Error("Please specify the files");
  }
  let result = await Project.findOne({ _id: project._id });
  if (!result) {
    throw new Error("Project not found");
  }
  let new_files_list = [];
  let files_object_list = [];
  files.forEach((file) => {
    const indexOfValue = result.file.findIndex(
      (res) => res.file_name === file.originalname
    );
    if (indexOfValue !== -1) {
      files_object_list.push(result.file[indexOfValue]);
    } else {
      new_files_list.push(file);
    }
  });

  if (new_files_list.length) {
    const new_files_obj = await projectsUtils.uploadFilesToDrive(
      files,
      result.folder_id
    );
    files_object_list = files_object_list.concat(new_files_obj);
  }

  result = await Project.findOneAndUpdate(
    { _id: project._id },
    { file: files_object_list },
    { new: true }
  );

  return {
    message: "Successfully added files and the project has been edited",
    result,
  };
};

/* TODO: 
      - Autofill surat penawaran
      - Serialize nomor proyek ✅
*/
exports.createProject = async function (files, body) {
  const { ...project } = body;
  if (!project.client_name) {
    throw new Error("Please specify the client name");
  }
  if (!project.project_name) {
    throw new Error("Please specify the project name");
  }
  if (!project.alamat_kantor) {
    throw new Error("Please specify the almaat kantor");
  }
  if (!project.alamat_sampling) {
    throw new Error("Please specify the alamat sampling");
  }
  if (!project.surel) {
    throw new Error("Please specify the email");
  }
  if (!project.contact_person) {
    throw new Error("Please specify the contact person");
  }
  if (!project.sampling_list) {
    throw new Error("Please specify the sampling_list");
  }
  if (!project.regulation_list) {
    throw new Error("Please specify the regulation_list");
  }
  if (!project.param_list) {
    throw new Error("Please specify the param_list or pass an empty array");
  }
  let new_folder = null;
  try {
    const no_sampling = await projectsUtils.generateSamplingID();
    const no_penawaran = await projectsUtils.generateProjectID(no_sampling);
    new_folder = await drivesServices.createFolder({
      folder_name: project.project_name,
      root_folder_id: process.env.FOLDER_ID_PROJECT,
    });
    const sampling_object_list = await projectsUtils.copySampleTemplate(
      true,
      new_folder.result.id,
      project.sampling_list,
      project.project_name,
      project.regulation_list,
      project.param_list
    );
    const files_object_list = await projectsUtils.uploadFilesToDrive(
      files,
      new_folder.result.id
    );

    const lab_file_object_list = await projectsUtils.copyFilesIntoLabFiles(
      new_folder.result.id
    );

    const fpp_id = create_project.lab_file.find(
      (file) => file.file_name === "FPP"
    ).file_id;

    const fillFPP = await projectsUtils.fillFPPFile(
      fpp_id,
      no_penawaran,
      project.client_name,
      project.contact_person,
      project.alamat_kantor,
      project.surel,
      project.project_name,
      project.alamat_sampling
    );

    const create_project = new Project({
      ...project,
      no_penawaran,
      no_sampling,
      folder_id: new_folder.result.id,
      sampling_list: sampling_object_list,
      file: files_object_list,
      lab_file: lab_file_object_list,
    });

    await create_project.save();
    return {
      message: "Successfull",
      result: {
        id: new_folder.result.id,
        url: "https://drive.google.com/drive/folders/" + new_folder.result.id,
        project: create_project,
      },
    };
  } catch (error) {
    throw { message: error.message, new_folder_id: new_folder.result.id };
  }
};

exports.createProjectJSON = async function (body) {
  const project = body;
  if (!project.client_name) {
    throw new Error("Please specify the client name");
  }
  if (!project.project_name) {
    throw new Error("Please specify the project name");
  }
  if (!project.alamat_kantor) {
    throw new Error("Please specify the almaat kantor");
  }
  if (!project.alamat_sampling) {
    throw new Error("Please specify the alamat sampling");
  }
  if (!project.surel) {
    throw new Error("Please specify the email");
  }
  if (!project.contact_person) {
    throw new Error("Please specify the contact person");
  }
  if (!project.sampling_list) {
    throw new Error("Please specify the sampling_list");
  }
  let new_folder = null;
  try {
    const no_sampling = await projectsUtils.generateSamplingID();
    const no_penawaran = await projectsUtils.generateProjectID(no_sampling);
    new_folder = await drivesServices.createFolder({
      folder_name: project.project_name,
      root_folder_id: process.env.FOLDER_ID_PROJECT,
    });
    const new_sampling_list = project.sampling_list.map(
      (sample) => sample.sample_name
    );
    const new_regulation_list = project.sampling_list.map(
      (sample) => sample.regulation_name
    );
    const new_param_list = project.sampling_list.map((sample) => sample.param);
    const sampling_object_list = await projectsUtils.copySampleTemplate(
      true,
      new_folder.result.id,
      new_sampling_list,
      project.project_name,
      new_regulation_list,
      new_param_list
    );

    const lab_file_object_list = await projectsUtils.copyFilesIntoLabFiles(
      new_folder.result.id
    );

    const create_project = new Project({
      ...project,
      no_penawaran,
      no_sampling,
      folder_id: new_folder.result.id,
      sampling_list: sampling_object_list,
      lab_file: lab_file_object_list,
    });

    const fpp_id = create_project.lab_file.find(
      (file) => file.file_name === "FPP"
    ).file_id;

    const fillFPP = await projectsUtils.fillFPPFile(
      fpp_id,
      no_penawaran,
      project.client_name,
      project.contact_person,
      project.alamat_kantor,
      project.surel,
      project.project_name,
      project.alamat_sampling
    );

    await create_project.save();
    return {
      message: "Successfull",
      result: {
        id: new_folder.result.id,
        url: "https://drive.google.com/drive/folders/" + new_folder.result.id,
        project: create_project,
      },
    };
  } catch (error) {
    throw { message: error.message, new_folder_id: new_folder.result.id };
  }
};

exports.getSample = async function (body) {
  try {
    const { projectId } = body;
    const project = await Project.findById(projectId);

    if (!project) {
      throw { message: "Project not found" };
    }

    const samples = project.sampling_list.map((sample) => ({
      fileId: sample.fileId,
      sample_name: sample.sample_name,
    }));

    return samples;
  } catch (error) {
    throw { message: error.message };
  }
};

exports.getProjectByDivision = async function (body) {
  try {
    const { division, status } = body;
    let projects = null;
    if (!division) throw new Error("Please specify the division");
    if (!status) {
      projects = await Project.find({
        current_division: division.toUpperCase(),
      });
    } else {
      projects = await Project.find({
        current_division: division.toUpperCase(),
        status: status,
      });
    }
    return { message: "Success", projects };
  } catch (error) {
    throw { message: error.message };
  }
};

exports.getLinkFiles = async function (params) {
  if (!params.ProjectID) throw new Error("Please specify the project ID");

  const resultProject = await Project.findById(params.ProjectID).exec();
  if (!resultProject) {
    throw new Error("Project not found");
  }

  const result = {
    sampling_list: [],
    file: [],
    lhp: null,
  };

  resultProject.sampling_list.forEach((sampling) => {
    const { sample_name, fileId } = sampling;
    const sample_key = {
      name: sample_name,
      url: "https://drive.google.com/drive/folders/" + fileId,
    };
    result.sampling_list.push(sample_key);
  });

  //TO-Do Add after surat Tugas Added
  const surat_tugas = {
    name: "Surat Tugas",
    url: "https://drive.google.com/file/d/",
    type: "Preparation",
  };
  result.file.push(surat_tugas);

  const logbook = {
    name: "Logbook Jadwal Sampling",
    url: "https://drive.google.com/file/d/",
    type: "Preparation",
  };
  result.file.push(logbook);

  const suratPenawaran = {
    name: "Surat Penawaran",
    url: "https://drive.google.com/file/d/" + resultProject.surat_penawaran,
    type: "Preparation",
  };
  result.file.push(suratPenawaran);

  const KajiUlang = {
    name: "Form Kaji Ulang",
    url: "https://drive.google.com/file/d/",
    type: "Preparation",
  };
  result.file.push(KajiUlang);

  const coc = {
    name: "DP Chain of Custody",
    url: "https://drive.google.com/file/d/" + resultProject.surat_fpp,
    type: "Preparation",
  };
  result.file.push(coc);

  const list_sample = {
    name: "List Pengambilan Sample",
    url: "https://drive.google.com/file/d/" + resultProject.surat_fpp,
    type: "Result",
  };
  result.file.push(list_sample);

  const result_sampling = {
    name: "Result Sampling",
    url: "https://drive.google.com/file/d/",
    type: "Result",
  };
  result.file.push(result_sampling);

  const log_penerimaan = {
    name: "Log Penerimaan",
    url: "https://drive.google.com/file/d/" + resultProject.surat_fpp,
    type: "Result",
  };
  result.file.push(log_penerimaan);

  resultProject.file.forEach((fl) => {
    const { file_name, file_id } = fl;
    const file_key = {
      name: file_name,
      url: "https://drive.google.com/file/d/" + file_id,
      type: "User",
    };
    result.file.push(file_key);
  });

  result.lhp = {
    name: "LHP",
    url: "https://drive.google.com/file/d/" + resultProject.surat_fpp,
    type: "Result",
  };

  return { message: "Success", result };
};

exports.getProjectByAcc = async function (body) {
  if (body.accountId === null) throw new Error("Please specify the account ID");

  const projectList = await Project.find({
    project_assigned_to: body.accountId,
  });

  if (projectList === null) throw new Error("Project not found");

  return { message: "success", projectList };
};

exports.assignProject = async function (body) {
  const { ...project } = body;
  if (!project.projectId) throw new Error("Please specify the project ID");
  if (!project.accountId) throw new Error("Please specify the account ID");
  if (!project.jadwal_sampling)
    throw new Error("Please specify the sampling schedule");

  const projectObj = await Project.findById(project.projectId).exec();
  if (projectObj === null) throw new Error("Project not found");

  if (projectObj.project_assigned_to.includes(body.accountId))
    throw new Error("User already assigned to this project");

  if ((await User.findById(body.accountId)) === null)
    throw new Error("User not found");

  projectObj.project_assigned_to.push(body.accountId);
  projectObj.jadwal_sampling = project.jadwal_sampling;

  await projectObj.save();

  return { message: "success", projectObj };
};

exports.editAssignedProjectUsers = async function (body) {
  if (body.accountId === null) throw new Error("Please specify the account ID");
  if (body.projectId === null) throw new Error("Please specify the project ID");

  const projectObj = await Project.findById(body.projectId);
  if (projectObj === null) throw new Error("Project not found");

  if ((await User.findById(body.accountId)) === null)
    throw new Error("User not found");

  projectObj.project_assigned_to = body.accountId;

  await projectObj.save();

  return { message: "success", data: projectObj };
};

exports.editAssignedProjectSchedule = async function (body) {
  if (body.jadwal_sampling === null)
    throw new Error("Please specify the sampling schedule");
  if (body.projectId === null) throw new Error("Please specify the project ID");

  const projectObj = await Project.findById(body.projectId);
  if (projectObj === null) throw new Error("Project not found");

  projectObj.jadwal_sampling = body.jadwal_sampling;

  await projectObj.save();

  return { message: "success", data: projectObj };
};

exports.changeToDraft = async function (params) {
  if (!params.id) throw new Error("Please specify the project ID");

  const resultProject = await Project.findById(params.id).exec();
  if (!resultProject) {
    throw new Error("Project not found");
  }

  const newStatus = "DRAFT";

  resultProject.pplhp_status = newStatus;

  await project.save();

  return { message: "pplhp_status updated successfully", data: resultProject };
};

exports.changeToFinished = async function (params) {
  if (!params.id) throw new Error("Please specify the project ID");

  const resultProject = await Project.findById(params.id).exec();
  if (!resultProject) {
    throw new Error("Project not found");
  }

  const newStatus = resultProject.is_paid ? "FINISHED" : "DRAFT";

  resultProject.pplhp_status = newStatus;

  await project.save();

  return { message: "pplhp_status updated successfully", data: resultProject };
};

exports.getPplhpByStatus = async function (params) {
  if (!params.status) throw new Error("Please specify the project ID");

  const resultProject = await Project.find({
    current_division: "PPLHP",
    pplhp_status: params.status.toUpperCase(),
  }).exec();

  if (!resultProject) {
    throw new Error("Project not found");
  }

  return { message: "get Data Successful", data: resultProject };
};
