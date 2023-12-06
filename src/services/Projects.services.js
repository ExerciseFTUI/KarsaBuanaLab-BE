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
  const { sample_name, file_id, safety_file_id, param, regulation } = body;

  const arrOfRegulation = regulation.map(
    (reg) =>
      new Regulation({
        regulation_name: reg.regulation_name,
        default_param: reg.default_param,
      })
  );

  const result = new BaseSample({
    sample_name: sample_name,
    file_id: file_id,
    safety_file_id: safety_file_id,
    param: param,
    regulation: arrOfRegulation,
  });
  await result.save();
  return { message: "Base sample created", result };
};

/* TODO: 
      - Rename gdrive folder if project name is changed
      - Remove duplicate folder sample
*/
exports.editProject = async function (files, body) {
  const { ...project } = body;
  let sampling_list = [];

  if (!project._id || project._id == null) {
    return { message: "Please specify the project _id", result: null };
  }
  if (Object.keys(project).length == 1 && !files.length) {
    return { message: "Only project _id is being passed", result: null };
  }
  if (project.files) {
    delete project.files;
  }
  if (project.sampling_list) {
    sampling_list = project.sampling_list;
    console.log(sampling_list);
    delete project.sampling_list;
  }
  let result = await Project.findOneAndUpdate(
    { _id: project._id },
    { ...project },
    { new: true }
  );
  if (!result) {
    return { message: "Project not found", result: null };
  }
  if (sampling_list.length) {
    const sampling_object_list = await copySampleTemplate(
      result.folder_id,
      sampling_list,
      result.project_name
    );
    result = await Project.findOneAndUpdate(
      { _id: project._id },
      { $push: { sampling_list: { $each: sampling_object_list } } },
      { new: true }
    );
  }
  if (!files.length) {
    return { message: "Successfully edited", result };
  }
  const new_files_obj = await uploadFilesToDrive(files, result.folder_id);

  result = await Project.findOneAndUpdate(
    { _id: project._id },
    { $push: { file: { $each: new_files_obj } } },
    { new: true }
  );
  return {
    message: "Successfully added files and the project has been edited",
    result,
  };
};

/* TODO: 
      - Autofill surat penawaran
      - Serialize nomor proyek
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
  if (!project.regulation) {
    throw new Error("Please specify the regulation");
  }
  if (!project.sampling_list) {
    throw new Error("Please specify the sampling list");
  }
  if (!project.assigned_to) {
    throw new Error("Please specify the username assigned to the project");
  }
  let new_folder = null;
  try {
    const no_sampling = await projectsUtils.generateSamplingID();
    const no_penawaran = await projectsUtils.generateProjectID(no_sampling);
    new_folder = await drivesServices.createFolder({
      folder_name: project.project_name,
      root_folder_id: process.env.FOLDER_ID_PROJECT,
    });
    const id_surat_penawaran = await projectsUtils.copySuratPenawaran(
      new_folder.result.id
    );
    const sampling_object_list = await projectsUtils.copySampleTemplate(
      new_folder.result.id,
      project.sampling_list,
      project.project_name,
      project.assigned_to,
      project.regulation
    );
    const files_object_list = await projectsUtils.uploadFilesToDrive(
      files,
      new_folder.result.id
    );
    const create_project = new Project({
      ...project,
      no_penawaran,
      no_sampling,
      folder_id: new_folder.result.id,
      surat_penawaran: id_surat_penawaran,
      sampling_list: sampling_object_list,
      file: files_object_list,
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
