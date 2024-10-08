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
const { notifyEmail } = require("../utils/Mail.utils");
const { Param } = require("../models/Param.models");

exports.editProject = async function (body) {
  const { ...project } = body;

  if (!project._id || project._id == null) {
    throw new Error("Please specify the project _id");
  }
  if (Object.keys(project).length == 1) {
    throw new Error("Only project _id is being passed");
  }

  let projectFind = await Project.findOne({ _id: project._id });

  if (project.is_paid && projectFind.pplhp_status === "FINISHED") {
    projectFind.status = "FINISHED";
    // save projectFind.status
    await projectFind.save();
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

exports.addProjectFiles = async function (files, body) {
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

  const files_object_list = await projectsUtils.uploadFilesToDrive(
    files,
    result.folder_id
  );

  result = await Project.findOneAndUpdate(
    { _id: project._id },
    { $push: { file: { $each: files_object_list } } },
    { new: true }
  );

  return {
    message: "Successfully added files and the project has been edited",
    result,
  };
};

exports.removeProjectFiles = async function (body) {
  const { ...project } = body;

  if (!project._id || project._id == null) {
    throw new Error("Please specify the project _id");
  }
  if (!project.file_id || project.file_id == null) {
    throw new Error(
      "Please specify the file_id using the _id from the database"
    );
  }
  const result = await Project.findOneAndUpdate(
    { _id: project._id },
    { $pull: { file: { _id: project.file_id } } },
    { new: true }
  );
  if (!result) {
    throw new Error("Project not found");
  }
  return {
    message: "Successfully removed file and the project has been edited",
    result,
  };
};

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
  if (!project.tipe_project) {
    throw new Error("Please specify the tipe_project");
  }
  if (
    project.tipe_project !== "external" &&
    project.tipe_project !== "internal"
  ) {
    throw new Error('tipe_project harus "external" atau "internal" saja');
  }

  let new_folder = null;
  try {
    const no_sampling = await projectsUtils.generateSamplingID();
    const no_penawaran = await projectsUtils.generateProjectID(
      no_sampling,
      project.tipe_project
    );
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

    const kuptk_file_object_list = await projectsUtils.copyKUPTK(
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
      kuptk_file: kuptk_file_object_list,
    });

    const fillFPPSample = await projectsUtils.fillSample(
      fpp_id,
      create_project.alamat_sampling,
      create_project.sampling_list
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
  if (!project.tipe_project) {
    throw new Error("Please specify the tipe_project");
  }
  if (
    project.tipe_project !== "external" &&
    project.tipe_project !== "internal"
  ) {
    throw new Error('tipe_project harus "external" atau "internal" saja');
  }
  console.log("Field udah aman");

  let new_folder = null;
  try {
    const no_sampling = await projectsUtils.generateSamplingID();
    const no_penawaran = await projectsUtils.generateProjectID(
      no_sampling,
      project.tipe_project
    );
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

    const kuptk_file_object_list = await projectsUtils.copyKUPTK(
      new_folder.result.id
    );

    const create_project = new Project({
      ...project,
      no_penawaran,
      no_sampling,
      folder_id: new_folder.result.id,
      sampling_list: sampling_object_list,
      lab_file: lab_file_object_list,
      kuptk_file: kuptk_file_object_list,
    });

    const fpp_id = create_project.lab_file.find(
      (file) => file.file_name === "FPP"
    ).file_id;

    const surat_penawaran_id = create_project.lab_file.find(
      (file) => file.file_name === "Surat Penawaran"
    ).file_id;

    // const fillFPP = await projectsUtils.fillFPPFile(
    //   fpp_id,
    //   no_penawaran,
    //   project.client_name,
    //   project.contact_person,
    //   project.alamat_kantor,
    //   project.surel,
    //   project.project_name,
    //   project.alamat_sampling
    // );

    // const fillFPPSample = await projectsUtils.fillSample(
    //   fpp_id,
    //   create_project.alamat_sampling,
    //   create_project.sampling_list
    // );

    // const fillSuratPenawaran = await projectsUtils.fillSuratPenawaran(
    //   surat_penawaran_id,
    //   no_penawaran,
    //   Date.now(),
    //   project.client_name,
    //   project.alamat_kantor,
    //   project.contact_person,
    //   project.surel,
    //   project.project_name,
    //   project.alamat_sampling
    // );

    // const id_surat_penawaran_censored =
    //   await projectsUtils.copySuratPenawaranCensored(
    //     create_project.folder_id,
    //     surat_penawaran_id
    //   );

    // create_project.surat_penawaran_censored = id_surat_penawaran_censored;

    await create_project.save();

    // await notifyEmail(
    //   create_project.surel,
    //   "Project Created",
    //   `Your project ${create_project.project_name} has been created.
    //   \nProject ID: ${create_project.id}
    //   \nPassword: ${create_project.password}
    //   \nYou can access your project using this information in our <a href=${process.env.DOMAIN_NAME}>website</a>.

    //   \n\nPlease keep this information safe.
    //   \nThank you.`
    // );

    return {
      message: "Successfull",
      result: {
        id: new_folder.result.id,
        url: "https://drive.google.com/drive/folders/" + new_folder.result.id,
        project: create_project,
      },
    };
  } catch (error) {
    console.log(error);
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
    if (!(division.toUpperCase() === "MARKETING")) {
      projects = projects.filter((project) => {
        if (project.valuasi_proyek == 0 || project.valuasi_proyek == null)
          return false;
        else return true;
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
    url: "https://docs.google.com/spreadsheets/d/" + resultProject.surat_penawaran,
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
    url: "https://docs.google.com/spreadsheets/d/" + resultProject.surat_fpp,
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
    url: "https://docs.google.com/spreadsheets/d/" + "1sqCwcDybexzN74HqYUEtVwdoO0OdC1Pp",
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

  const jadwalUserObj = {
    projectID: project.projectId,
    projectName: projectObj.project_name,
    from: project.jadwal_sampling.from,
    to: project.jadwal_sampling.to,
  };

  projectObj.project_assigned_to.forEach(async (old_id) => {
    const userObj = await User.findById(old_id).exec();
    if (userObj === null) throw new Error("User not found");

    userObj.jadwal.forEach(async (jadwal) => {
      if (jadwal.projectID === project.projectId)
        await userObj.jadwal.pull(jadwal);
    });

    await userObj.save();
  });

  project.accountId.forEach(async (id) => {
    const userObj = await User.findById(id).exec();
    if (userObj === null) throw new Error("User not found");

    userObj.jadwal.push(jadwalUserObj);
    await userObj.save();
  });

  projectObj.project_assigned_to = project.accountId;
  projectObj.jadwal_sampling = project.jadwal_sampling;

  await projectObj.save();

  return { message: "success", projectObj };
};

exports.editAssignedProjectUsers = async function (body) {
  if (body.accountId === null) throw new Error("Please specify the account ID");
  if (body.projectId === null) throw new Error("Please specify the project ID");

  const projectObj = await Project.findById(body.projectId).exec();
  if (projectObj === null) throw new Error("Project not found");

  if ((await User.findById(body.accountId)) === null)
    throw new Error("User not found");

  projectObj.project_assigned_to.forEach(async (id) => {
    const userObj = await User.findById(id).exec();
    if (userObj === null) throw new Error("User not found");
    userObj.jadwal.forEach((jadwal) => {
      if (jadwal.projectID === body.projectId) jadwal.remove();
    });

    await userObj.save();
  });

  projectObj.project_assigned_to = body.accountId;

  const jadwalUserObj = {
    projectID: body.projectId,
    projectName: projectObj.project_name,
    from: body.jadwal_sampling.from,
    to: body.jadwal_sampling.to,
  };

  body.accountId.forEach(async (id) => {
    const userObj = await User.findById(id).exec();
    if (userObj === null) throw new Error("User not found");
    userObj.jadwal.push(jadwalUserObj);
    await userObj.save();
  });

  await projectObj.save();

  return { message: "success", data: projectObj };
};

exports.editAssignedProjectSchedule = async function (body) {
  if (body.jadwal_sampling === null)
    throw new Error("Please specify the sampling schedule");
  if (body.projectId === null) throw new Error("Please specify the project ID");

  const projectObj = await Project.findById(body.projectId);
  if (projectObj === null) throw new Error("Project not found");

  const jadwalUserObj = {
    projectID: body.projectId,
    projectName: projectObj.project_name,
    from: body.jadwal_sampling.from,
    to: body.jadwal_sampling.to,
  };

  projectObj.project_assigned_to.forEach(async (id) => {
    const userObj = await User.findById(id).exec();
    if (userObj === null) throw new Error("User not found");
    userObj.jadwal.forEach((jadwal) => {
      if (jadwal.projectID === body.projectId) jadwal.remove();
    });
    userObj.jadwal.push(jadwalUserObj);
  });

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

  await resultProject.save();

  return { message: "pplhp_status updated successfully", data: resultProject };
};

exports.changeToReview = async function (params) {
  if (!params.id) throw new Error("Please specify the project ID");

  const resultProject = await Project.findById(params.id).exec();
  if (!resultProject) {
    throw new Error("Project not found");
  }

  const newStatus = "REVIEW";

  resultProject.pplhp_status = newStatus;
  resultProject.current_division = "LAB";

  await resultProject.save();

  return { message: "pplhp_status updated successfully", data: resultProject };
};

exports.changeToFinished = async function (params) {
  if (!params.id) throw new Error("Please specify the project ID");

  const resultProject = await Project.findById(params.id).exec();
  if (!resultProject) {
    throw new Error("Project not found");
  }

  const newStatus = "FINISHED";

  resultProject.pplhp_status = newStatus;

  await resultProject.save();

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

exports.changeDivision = async function (body) {
  if (!body.projectId) throw new Error("Please specify the project ID");
  if (!body.division) throw new Error("Please specify the division");

  const resultProject = await Project.findById(body.projectId).exec();
  if (!resultProject) {
    throw new Error("Project not found");
  }

  resultProject.current_division = body.division.toUpperCase();

  await resultProject.save();

  return { message: "Division updated successfully", data: resultProject };
};

exports.getAllLHP = async function () {
  try {
    const projectList = await Project.find({ pplhp_status: "REVIEW" });
    if (projectList == null) {
      throw new Error("No LHP found");
    }

    let projectListFiltered = projectList.map((project) => {
      return {
        project_name: project.project_name,
        project_deadline: project.jadwal_sampling,
        lab_files: project.lab_file,
      };
    });

    return { message: "success", projectList: projectListFiltered };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getLHP = async function (params) {
  try {
    if (!params.id) throw new Error("Please specify the project ID");

    const project = await Project.findById(params.id);
    if (!project) {
      throw new Error("Project not found");
    }

    const mapProject = {
      _id: project._id,
      no_penawaran: project.no_penawaran,
      project_name: project.project_name,
      client_name: project.client_name,
      alamat_sampling: project.alamat_sampling,
      contact_person: project.contact_person,
      created_at: project.created_at,
      status: project.status,
      current_division: project.current_division,
      valuasi_proyek: project.valuasi_proyek,
      jadwal_sampling: project.jadwal_sampling,
      deadline_lhp: project.deadline_lhp,
      desc_failed: project.desc_failed,
    };

    return { message: "success", project: mapProject };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.setDeadlineLHP = async function (body) {
  try {
    if (!body.projectId) throw new Error("Please specify the project ID");
    if (!body.deadline) throw new Error("Please specify the deadline");

    const projectObj = await Project.findById(body.projectId).exec();
    if (projectObj === null) throw new Error("Project not found");

    projectObj.deadline_lhp = body.deadline;
    await projectObj.save();

    return { message: "success", project: projectObj };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getAllPPLHPDetail = async function () {
  try {
    /*
    TODO:
    1. Cek di FE pake ini atau tidak
    2. Kalau misalnya pake, ganti current_division ke "SAMPLING" dan pplhp_status "RECEIVE"
    3. Bukan mapping per project, berdasarkan sample
    4. Sample status-nya harus "ACCEPTED"
    5. Filter dari mongodb langsung
    6.. NAMBAH ENDPOINT BARU AJA JADINYA
    */
    const projectList = await Project.find({
      current_division: "LAB",
      lab_status: "IN REVIEW BY ADMIN",
    });
    if (projectList == null) {
      throw new Error("No LHP found");
    }

    let projectListFiltered = projectList.map((project) => {
      return {
        project_name: project.project_name,
        projectID: project._id,
        sampling_list: project.sampling_list,
        lab_files: project.lab_file,
        deadline_lhp: project.deadline_lhp,
      };
    });

    // TODO: Ganti return value-nya (CEK FIGMA)
    return { message: "success", projectList: projectListFiltered };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getPPLHPDetail = async function (params) {
  try {
    const projectObj = await Project.findById(params.id).exec();
    if (projectObj === null) throw new Error("Project not found");

    const mapProjectObj = {
      project_name: projectObj.project_name,
      projectID: projectObj._id,
      sampling_list: projectObj.sampling_list,
      lab_files: projectObj.lab_file,
      deadline_lhp: projectObj.deadline_lhp,
      lhp: null,
      ttd_type: projectObj.ttd_type === null ? "TM" : projectObj.ttd_type,
    };

    mapProjectObj.lhp = {
      name: "LHP",
      url: "https://drive.google.com/file/d/" + projectObj.surat_fpp,
      type: "Result",
    };

    return { message: "success", project: mapProjectObj };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.LHPAccept = async function (params, body) {
  try {
    if (!params.id) throw new Error("Please specify the project ID");

    const projectObj = await Project.findById(params.id).exec();
    if (!projectObj) throw new Error("Project not found");
    if (projectObj.pplhp_status !== "REVIEW")
      throw new Error("Project is not in REVIEW status");

    projectObj.pplhp_status = "FINISHED";
    projectObj.current_division = "PPLHP";

    if (projectObj.is_paid && projectObj.pplhp_status === "FINISHED") {
      projectObj.status = "FINISHED";
    }

    if (body.notes) projectObj.notes.push(body.notes);

    await projectObj.save();
    return { message: "success", data: projectObj };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.LHPRevision = async function (params, body) {
  try {
    if (!params.id) throw new Error("Please specify the project ID");

    const projectObj = await Project.findById(params.id).exec();
    if (!projectObj) throw new Error("Project not found");
    // if(projectObj.pplhp_status !== "REVIEW") throw new Error("Project is not in REVIEW status");

    if (body.from === "ADMIN") {
      projectObj.lab_status = "REVISION";

      projectObj.sampling_list.forEach((sample) => {
        sample.status = "REVISION";
      });
    } else {
      projectObj.pplhp_status = "DRAFT";
    }
    if (body.notes) projectObj.notes.push(body.notes);

    await projectObj.save();
    return { message: "success", data: projectObj };
  } catch (err) {
    console.log("error", err);
    throw new Error(err.message);
  }
};

exports.getNotes = async function (params) {
  try {
    if (!params.id) throw new Error("Please specify the project ID");

    const projectObj = await Project.findById(params.id).exec();
    if (!projectObj) throw new Error("Project not found");

    if (projectObj.notes.length === 0) throw new Error("No notes found");

    return { message: "success", data: projectObj.notes };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.deal = async function (body) {
  const { project_id } = body;
  if (!project_id) throw new Error("Please specify the project id");
  const projectObj = await Project.findById(project_id);
  if (!projectObj) throw new Error("Project not found");
  try {
    projectObj.current_division = "SAMPLING";
    projectObj.save();
    return { message: "success", success: true };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.testLHP = async function (body) {
  const { project_id } = body;
  if (!project_id) throw new Error("Please specify the project id");
  const projectObj = await Project.findById(project_id);
  if (!projectObj) throw new Error("Project not found");
  try {
    const result = await projectsUtils.fillLHP(projectObj);

    return { message: "LHP successfully generated", result };
  } catch (err) {
    throw { file_id: err.file_id, message: err.message };
  }
};

exports.changeTMStatus = async function (body) {
  const { project_id, status, notes } = body;
  if (!status) throw new Error("Please specify the status");
  if (!project_id) throw new Error("Please specify the project id");

  const projectObj = await Project.findById(project_id);
  if (!projectObj) throw new Error("Project not found");

  const validStatuses = ["WAITING", "ACCEPTED", "REVISE"];
  if (!validStatuses.includes(status)) throw new Error("Invalid status");

  try {
    projectObj.TM_status = status;
    projectObj.TM_note = notes || "";

    await projectObj.save();

    return { message: "Status Successfully Changed", success: true };
  } catch (err) {
    throw { message: err.message };
  }
};

exports.getAllPPLHP = async function () {
  try {
    const sampleList = await Sampling.find({
      status: "ACCEPTED",
      current_division: "SAMPLING",
      pplhp_status: "RECEIVE",
    }).exec();
    if (sampleList === null) throw new Error("No sample found");

    let projectList = [];
    for (let i = 0; i < sampleList.length; i++) {
      const project = await Project.findById(sampleList[i].project_id).exec();
      projectList.push(project);
    }

    return { message: "success", projectList };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.submitSample = async function (body) {
  try {
    const { sampleId, projectId, receive_date } = body;
    if (!sampleId || !projectId || !receive_date)
      throw new Error(
        "Please specify the sampleId, projectId, and receive_date"
      );
    const projectObj = await Project.findById(projectId).exec();
    if (!projectObj) throw new Error("Project not found");

    const sample = projectObj.sampling_list.find((s) => s._id == sampleId);
    if (!sample) throw new Error("Sample not found");

    sample.receive_date = new Date(receive_date);
    sample.status = "LAB_RECEIVE";

    await projectObj.save();
    const sampleObj = await Sampling.findById(sampleId).exec();
    sampleObj.receive_date = receive_date;
    sampleObj.status = "LAB_RECEIVE";
    await sampleObj.save();

    return { message: "success", project: projectObj };
  } catch (error) {
    throw new Error(error.message);
  }
};
