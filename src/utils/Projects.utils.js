const { google } = require("googleapis");
const { Project } = require("../models/Project.models");
const { BaseSample } = require("../models/BaseSample.models");
const { File } = require("../models/File.models");
const { Sampling } = require("../models/Sampling.models");
const { User } = require("../models/User.models");
const { Regulation } = require("../models/Regulation.models");
const { getAuth } = require("../config/driveAuth");
const drivesServices = require("../services/Drives.services");
const sheetsServices = require("../services/Sheets.services");
const fs = require("fs");

exports.copySuratPenawaran = async function (folder_id) {
  const surat_penawaran_id = process.env.SPREADSHEET_SURAT_PENAWARAN;

  const auth = getAuth("https://www.googleapis.com/auth/drive");

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
};

exports.copySampleTemplate = async function copySampleTemplate(
  folder_id,
  sampling_list,
  project_name,
  regulation_arr
) {
  const auth = getAuth("https://www.googleapis.com/auth/drive");

  const drive = google.drive({ version: "v3", auth });

  if (!Array.isArray(sampling_list)) {
    throw new Error(
      "Error while copying sample template: Sampling list is not an array"
    );
  }
  if (!Array.isArray(sampling_list)) {
    throw new Error(
      "Error while copying sample template: Regulation list is not an array"
    );
  }

  const sample_object_list = await Promise.all(
    sampling_list.map(async (sample, index) => {
      const result = await BaseSample.findOne({ sample_name: sample });
      const regulation = await Regulation.findOne({
        regulation_name: regulation_arr[index],
      });
      if (!result) {
        throw new Error(
          "Error while copying sample template: Base sample not found"
        );
      }
      if (!regulation) {
        throw new Error(
          "Error while copying sample template: Regulation not found"
        );
      }
      const samplingObj = new Sampling({
        fileId: result.file_id,
        sample_name: result.sample_name,
        param: result.param,
        regulation_name: regulation,
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
        parents: [new_folder.result.id],
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
};

exports.uploadFilesToDrive = async function (files, folderId) {
  const auth = getAuth([
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/drive.file",
  ]);

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
        file_extension: file.mimetype,
      });
      fileObj.push(newFile);
      fs.unlinkSync(file.path);
    } catch (error) {
      console.error("Error uploading file:", error.message);
    }
  }

  return fileObj;
};

exports.generateSamplingID = async function () {
  // Get the current year
  const currentYear = new Date().getFullYear();

  // Find the last project in the current year
  const lastProjectInYear = await Project.findOne({
    created_year: currentYear,
  }).sort({ no_sampling: -1 });

  let nomorProject = 0;
  if (lastProjectInYear) {
    // Increment the project number from the last project in the current year
    nomorProject = parseInt(lastProjectInYear.no_sampling) + 1;
  } else {
    // If no project exists in the current year, start from 1
    nomorProject = 1;
  }

  return addLeadingZeros(nomorProject, 3);
};

exports.generateProjectID = async function (nomorProject) {
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
};

exports.copyFPPFile = async function (folder_id) {
  const fpp_id = process.env.FPP_ID;

  const auth = getAuth("https://www.googleapis.com/auth/drive");

  const drive = google.drive({ version: "v3", auth });

  // Create a copy of the file on Google Drive
  const copiedFile = await drive.files.copy({
    fileId: fpp_id,
    requestBody: {
      name: "FPP",
      parents: [folder_id],
    },
  });

  // Construct the shareable URL for the copied file
  const copiedFileId = copiedFile.data.id;
  const editor = process.env.SERVICE_ACCOUNT;

  await drive.permissions.create({
    fileId: copiedFileId,
    requestBody: {
      role: "writer",
      type: "user",
      emailAddress: editor,
    },
  });
  return copiedFileId;
};

exports.fillFPPFile = async function (
  file_id,
  no_permohonan,
  no_customer,
  personil_pehubung,
  alamat_customer,
  kontak,
  nama_proyek,
  alamat_proyek
) {
  const sheetName = "FPP";
  const cellAddress = ["C8", "C9", "C10", "C11", "C12", "F8", "F9"];

  const data = [
    no_permohonan,
    no_customer,
    personil_pehubung,
    alamat_customer,
    kontak,
    nama_proyek,
    alamat_proyek,
  ];

  const result = await insertValuesIntoCells(
    file_id,
    data,
    sheetName,
    cellAddress
  );

  return result;
};

exports.insertValuesIntoCells = async function (
  fileId,
  values,
  sheetName,
  cellAddresses
) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: process.env.GOOGLE_TYPE,
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"), // Replace escaped newline characters
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: process.env.GOOGLE_AUTH_URI,
        token_uri: process.env.GOOGLE_TOKEN_URI,
        auth_provider_x509_cert_url:
          process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
      },
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    for (let i = 0; i < cellAddresses.length; i++) {
      const cellAddress = cellAddresses[i];
      const range = `${sheetName}!${cellAddress}`;

      const result = await sheets.spreadsheets.values
        .update({
          auth,
          spreadsheetId: fileId,
          range: range,
          valueInputOption: "USER_ENTERED",
          resource: {
            values: [[values[i]]], // Use values[i] to update the cell
          },
        })
        .then((response) => {
          return response;
        })
        .catch((error) => {
          console.error("Error:", error);
          throw error;
        });
    }

    return { message: "Data inserted into cells" };
  } catch (error) {
    return { message: "Error inserting data into cells", error: error.message };
  }
};

function addLeadingZeros(number, zeros) {
  const numberString = String(number);
  const numberOfZeros = Math.max(0, zeros - numberString.length);
  const zerosString = "0".repeat(numberOfZeros);

  return zerosString + numberString;
}
