const { google } = require("googleapis");
const Project = require("../models/Project.models");
const BaseSample = require("../models/BaseSample.models");
const drivesServices = require("../services/Drives.services");
const fs = require("fs");

exports.newBaseSample = async function (body) {
  const { sample_name, file_id } = body;
  const result = new BaseSample({
    sample_name: sample_name,
    file_id: file_id,
  });
  await result.save();
  return {message: "Base sample created", result};
};

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
  const folder_id = process.env.FOLDER_ID_PROJECT;

  let new_folder = null;
  let copied_surat_id = null;
  let sampling_list_id = null;
  let new_files_id = null;
  // const new_folder = await drivesServices.createFolder({
  //   folder_name: project_name,
  //   root_folder_id: folder_id,
  // });

  // const copied_surat_id = await copySuratPenawaran(new_folder.id);

  // const sampling_list_id = await copySampleTemplate(new_folder.id, sampling_list);

  // const new_files_id = await uploadFilesToDrive(files, new_folder.id);
  try {
    new_folder = await drivesServices.createFolder({
      folder_name: project_name,
      root_folder_id: folder_id,
    });
  
    copied_surat_id = await copySuratPenawaran(new_folder.id);
  
    sampling_list_id = await copySampleTemplate(new_folder.id, sampling_list);
  
    new_files_id = await uploadFilesToDrive(files, new_folder.id);

    const project = new Project({
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
      sampling_list: sampling_list_id,
      file: new_files_id,
    });

    await project.save();
  } catch (error) {
    setTimeout(() => {
      drivesServices.deleteFile({file_id: new_folder.id});
    }, 5000);
    return { message: "Failed to create project", result: error };
  }
  return {
    message: "Successfull",
    id: new_folder.id,
    url: "https://drive.google.com/drive/folders/" + new_folder.id,
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
      name: "Copy of Surat Penawaran " + getRandomInt(1, 101),
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

async function copySampleTemplate(folder_id, sampling_list) {
  if (!Array.isArray(sampling_list)) {
    return null;
  }

  const sample_id_list = await Promise.all(
    sampling_list.map(async (sample) => {
      const result = await BaseSample.findOne({ sample_name: sample });
      if (!result) {
        return null;
      }
      return result.file_id;
    })
  );

  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  const drive = google.drive({ version: "v3", auth });

  let i = 0;
  sample_id_list.forEach(async (sample_id) => {
    const copiedFile = await drive.files.copy({
      fileId: sample_id,
      requestBody: {
        name: "Copy of Sample " + getRandomInt(1, 101),
        parents: [folder_id],
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

  return sample_id_list;
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

  const fileIds = [];

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

      fileIds.push(uploadedFile.data.id);
      fs.unlinkSync(file.path);
    } catch (error) {
      console.error("Error uploading file:", error.message);
    }
  }

  return fileIds;
}

function getRandomInt(min, max) {
  // The maximum is exclusive and the minimum is inclusive
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}
