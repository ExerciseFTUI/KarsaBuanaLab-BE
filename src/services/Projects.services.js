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

exports.editProjectSamples = async function (body) {
  const { ...project } = body;
  let sampling_list = [];

  if (!project._id || project._id == null) {
    throw new Error("Please specify the project _id");
  }
  if (Object.keys(project).length == 1) {
    throw new Error("Only project _id is being passed");
  }
  if (project.sampling_list) {
    sampling_list = project.sampling_list;
    delete project.sampling_list;
  }
  let result = await Project.findOneAndUpdate(
    { _id: project._id },
    { ...project },
    { new: true }
  );
  if (!result) {
    throw new Error("Project not found");
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
  const result = await Project.findOne(
    { _id: project._id },
  );
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
    throw new Error("Please specify the sampling list");
  }
  if (!project.regulation_list) {
    throw new Error("Please specify the regulation list");
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
      project.regulation_list
    );
    const files_object_list = await projectsUtils.uploadFilesToDrive(
      files,
      new_folder.result.id
    );

    const id_surat_fpp = await projectsUtils.copyFPPFile(new_folder.result.id);

    // const fillFPP = await projectsUtils.fillFPPFile(
    //   FPP_result.fileId,
    //   no_penawaran,
    //   project.client_name,
    //   project.contact_person,
    //   project.alamat_kantor,
    //   project.surel,
    //   project.project_name,
    //   project.alamat_sampling
    // );

    const create_project = new Project({
      ...project,
      no_penawaran,
      no_sampling,
      folder_id: new_folder.result.id,
      surat_penawaran: id_surat_penawaran,
      sampling_list: sampling_object_list,
      file: files_object_list,
      surat_fpp: id_surat_fpp,
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

exports.getProjectyByDivision = async function (division) {
  try {
    const projects = await Project.find({ current_division: division });
    return projects;
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
