const { google } = require("googleapis");
const { Project } = require("../models/Project.models");
const { BaseSample } = require("../models/BaseSample.models");
const { File } = require("../models/File.models");
const { Sampling } = require("../models/Sampling.models");
const drivesServices = require("../services/Drives.services");
const sheetsServices = require("../services/Sheets.services");
const fs = require("fs");

exports.newBaseSample = async function (body) {
  const { sample_name, file_id } = body;
  const result = new BaseSample({
    sample_name: sample_name,
    file_id: file_id,
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

// TODO : Ubah
exports.createProject = async function (files, body) {
  const {
    no_penawaran,
    no_sampling,
    client_name,
    project_name,
    alamat_kantor,
    alamat_sampling,
    surel,
    contact_person,
    valuasi_proyek,
    sampling_list,
  } = body;

  let new_folder;
  let project = null
  try {
    new_folder = await drivesServices.createFolder({
      folder_name: project_name,
      root_folder_id: process.env.FOLDER_ID_PROJECT,
    });

    const copied_surat_id = await copySuratPenawaran(new_folder.id);

    let no_penawaran = await generateProjectID(await generateSamplingID());
    let no_sampling = await generateSamplingID();

    const filled = await sheetsServices.fillSuratPenawaran(
      no_penawaran,
      copied_surat_id,
      contact_person,
      alamat_kantor,
      surel,
      project_name,
      alamat_sampling
    );

    const sampling_object_list = await copySampleTemplate(
      new_folder.id,
      sampling_list,
      project_name
    );

    const new_files_obj = await uploadFilesToDrive(files, new_folder.id);

    project = new Project({
      no_penawaran,
      no_sampling,
      client_name,
      project_name,
      alamat_kantor,
      alamat_sampling,
      surel,
      contact_person,
      valuasi_proyek,
      folder_id: new_folder.id,
      surat_penawaran: copied_surat_id,
      sampling_list: sampling_object_list,
      file: new_files_obj,
    });

    await project.save();
  } catch (error) {
    console.log(error);
    //TODO : Find better way to error handle
    if (new_folder) {
      try {
        await drivesServices.deleteFile(new_folder.id);
      } catch (error) {
        console.log(error);
      }
    }

    return { message: "Failed to create project", result: error };
  }
  return {
    message: "Successfull",
    id: new_folder.id,
    url: "https://drive.google.com/drive/folders/" + new_folder.id,
    project: project,
  };
};

async function copySuratPenawaran(folder_id) {
  const surat_penawaran_id = process.env.SPREADSHEET_SURAT_PENAWARAN;

  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  const drive = google.drive({ version: "v3", auth });

  // Create a copy of the file on Google Drive
  const copiedFile = await drive.files.copy({
    fileId: surat_penawaran_id,
    requestBody: {
      name: "Surat Penawaran",
      parents: [folder_id],
    },
  });

  // Construct the shareable URL for the copied file
  const copiedFileId = copiedFile.data.id;

  await drive.permissions.create({
    fileId: copiedFileId,
    requestBody: {
      role: "writer",
      type: "anyone",
    },
  });

  return copiedFileId;
}

async function copySampleTemplate(folder_id, sampling_list, project_name) {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  const drive = google.drive({ version: "v3", auth });

  if (!Array.isArray(sampling_list)) {
    return null;
  }

  const sample_object_list = await Promise.all(
    sampling_list.map(async (sample) => {
      const result = await BaseSample.findOne({ sample_name: sample });
      if (!result) {
        return null;
      }
      const samplingObj = new Sampling({
        fileId: result.file_id,
        sample_name: result.sample_name,
        param: null,
        regulation: null,
      });
      return samplingObj;
    })
  );

  const new_folder = await drivesServices.createFolder({
    folder_name: "Folder Sampel",
    root_folder_id: folder_id,
  });

  sample_object_list.forEach(async (sample, index) => {
    const copiedFile = await drive.files.copy({
      fileId: sample.fileId,
      requestBody: {
        name: `Sampel_${sample.sample_name}_${project_name}_${index + 1}`,
        parents: [new_folder.id],
      },
    });
    await drive.permissions.create({
      fileId: copiedFile.data.id,
      requestBody: {
        role: "writer",
        type: "anyone",
      },
    });
  });

  return sample_object_list;
}

async function uploadFilesToDrive(files, folderId) {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/drive.file",
    ],
  });

  const drive = google.drive({ version: "v3", auth });

  const fileObj = [];

  if (!Array.isArray(files)) {
    files = [files];
  }

  for (const file of files) {
    const fileMetadata = {
      name: file.originalname,
      parents: [folderId],
    };

    const media = {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.path),
    };

    try {
      const uploadedFile = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: "id",
      });
      const newFile = new File({
        file_id: uploadedFile.data.id,
        file_name: file.originalname,
      });
      fileObj.push(newFile);
      fs.unlinkSync(file.path);
    } catch (error) {
      console.error("Error uploading file:", error.message);
    }
  }

  return fileObj;
}

async function generateSamplingID() {
  // Get the current year
  const currentYear = new Date().getFullYear();

  // Find the last project in the current year
  const lastProjectInYear = await Project.findOne({
    createdYear: currentYear,
  }).sort({ nomorProject: -1 });

  let nomorProject;
  if (lastProjectInYear) {
    // Increment the project number from the last project in the current year
    nomorProject = lastProjectInYear.nomorProject + 1;
  } else {
    // If no project exists in the current year, start from 1
    nomorProject = 1;
  }

  return nomorProject;
}

async function generateProjectID(nomorProject) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const romanNumerals = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
  ];
  const monthRomanNumeral = romanNumerals[currentMonth - 1];

  // Create the project ID in the desired format
  const projectID = `${nomorProject}/Dirut/LabKBL/${monthRomanNumeral}/${currentYear}`;

  return projectID;
}
