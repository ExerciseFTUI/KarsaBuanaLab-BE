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
const { Param } = require("../models/Param.models");

exports.copySuratPenawaran = async function copySuratPenawaran(folder_id) {
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
  is_new,
  folder_id,
  sampling_list,
  project_name,
  regulation_list,
  param_array_list
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
        regulation_name: regulation_list[index],
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

      let paramList = [];
      param_array_list[index].forEach(async (param) => {
        paramList.push(param);
      });

      const paramArray = await Promise.all(paramList.map(async (param) => {
        const paramObj = await Param.findOne({ param: param }).exec();
        if (!paramObj) throw new Error("Error while copying sample template: Param not found");
        const paramObjMap = {
          param: paramObj.param,
          method: paramObj.method,
          unit: paramObj.unit,
          operator: paramObj.operator,
          baku_mutu: paramObj.baku_mutu,
          result: paramObj.result
        };

        return paramObjMap;
      }));

      const samplingObj = new Sampling({
        fileId: result.file_id,
        sample_name: result.sample_name,
        param: paramArray,
        regulation_name: regulation,
      });
      
      await samplingObj.save();
      return samplingObj;
    })
  );
  let parents_folder = null;
  if (is_new) {
    const new_folder = await drivesServices.createFolder({
      folder_name: "Folder Sampel",
      root_folder_id: folder_id,
    });
    parents_folder = new_folder.result.id;
  } else {
    parents_folder = folder_id;
  }

  const promises = sample_object_list.map(async (sample, index) => {
    const copiedFile = await drive.files.copy({
      fileId: sample.fileId,
      requestBody: {
        name: `Sampel_${sample.sample_name}_${project_name}_${index + 1}`,
        parents: [parents_folder],
      },
    });
    await drive.permissions.create({
      fileId: copiedFile.data.id,
      requestBody: {
        role: "writer",
        type: "anyone",
      },
    });
    sample_object_list[index].fileId = copiedFile.data.id;
  });
  await Promise.all(promises);
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

exports.copyFPPFile = async function copyFPPFile(folder_id) {
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

  const result = await exports.insertValuesIntoCells(
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

exports.getFolderIdByName = async function (folder_name, parent_id) {
  const auth = getAuth("https://www.googleapis.com/auth/drive");

  const drive = google.drive({ version: "v3", auth });

  const folder = await drive.files.list({
    q: `name = '${folder_name}' and '${parent_id}' in parents`,
  });

  if (folder.data.files.length == 0) {
    return null;
  }

  return folder.data.files[0].id;
};

exports.copyFilesIntoLabFiles = async function (folder_id) {
  const id_sample = await exports.copySuratPenawaran(folder_id);
  const id_fpp = await exports.copyFPPFile(folder_id);
  let file_list = [id_sample, id_fpp];
  const file_name = ["Surat Penawaran", "FPP"];
  file_list = file_list.map((id, index) => {
    const new_file = new File({
      file_name: file_name[index],
      file_type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      file_id: id,
      file_extension: "xlsx",
    });
    return new_file;
  });
  return file_list;
};

exports.copySuratTugas = async function (folder_id, sampling_list) {
  const id_surat_tugas = process.env.SPREADSHEET_SURAT_PENAWARAN;
  const id_jsa_list = sampling_list.map((sample) => sample.jsa);

  const auth = getAuth("https://www.googleapis.com/auth/drive");

  const drive = google.drive({ version: "v3", auth });

  const new_folder = await drivesServices.createFolder({
    folder_name: "Surat Tugas",
    root_folder_id: folder_id,
  });

  const new_folder_id = new_folder.result.id;

  const copiedSuratTugas = await drive.files.copy({
    fileId: id_surat_tugas,
    requestBody: {
      name: "Surat Tugas",
      parents: [new_folder_id],
    },
  });

  id_jsa_list = await Promise.all(
    id_jsa_list.map(async (id) => {
      const copiedFileJSA = await drive.files.copy({
        fileId: id_file_jsa,
        requestBody: {
          name: "File JSA",
          parents: [new_folder_id],
        },
      });
      return copiedFileJSA.data.id;
    })
  );

  const copiedFileId = copiedSuratTugas.data.id;

  await drive.permissions.create({
    fileId: copiedFileId,
    requestBody: {
      role: "writer",
      type: "anyone",
    },
  });

  return copiedFileId;
};

function addLeadingZeros(number, zeros) {
  const numberString = String(number);
  const numberOfZeros = Math.max(0, zeros - numberString.length);
  const zerosString = "0".repeat(numberOfZeros);

  return zerosString + numberString;
}

exports.fillSample = async function (
  file_id,
  alamat_sampling,
  sampling_list) {
  if (!sampling_list) throw new Error("Error while filling sample: Sampling list is not an array");
  let initial_col = 20;

  let data = [];
  let cellAddress = [];
  const sheetName = "FPP";
  sampling_list.forEach(async (sample, index) => {
    const regulation = `Regulation: ${sample.regulation_name[0].regulation_name}`;
    const param = `Parameter: ${sample.param.join(", ")}`;
    data.push([index + 1, sample.sample_name, "", "", "", `${regulation}\n${param}`]);
    cellAddress.push(16);
    initial_col += 1;
  });

  await exports.insertValuesIntoRows(
    file_id,
    data,
    sheetName,
    16,
    16 + sampling_list.length
  )

  await exports.insertValuesIntoCells(
    file_id,
    [alamat_sampling],
    sheetName,
    ["D16"]
  )

  return { message: "Data inserted into cells" };
}

exports.insertValuesIntoRows = async function (
  fileId,
  values,
  sheetname,
  startrow,
  endrow
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

    for (let i = startrow; i <= endrow; i++) {
      const range = `${sheetname}!A${i}:F${i}`;

      const result = await sheets.spreadsheets.values
        .update({
          auth,
          spreadsheetId: fileId,
          range: range,
          valueInputOption: "USER_ENTERED",
          resource: {
            values: [values[i - startrow]], // Use values[i] to update the cell
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

    return { message: "Data inserted into row" };
  } catch (error) {
    return { message: "Error inserting data into row", error: error.message };
  }
}

exports.fillSuratPenawaran = async function (file_id, no_penawaran, tanggal, nama_client, alamat_client, contact_person, email, nama_proyek, alamat_proyek) {
  if (!file_id || !no_penawaran || !tanggal || !nama_client || !alamat_client || !contact_person || !email || !nama_proyek || !alamat_proyek) throw new Error("Error while filling surat penawaran: Missing required parameter");
  const sheetName = "Surat Penawaran";
  const cellAddress = ["G2", "G4", "G7", "G8", "G11", "G12", "G13", "G15"];
  const data = [no_penawaran, tanggal, nama_client, alamat_client, contact_person, email, nama_proyek, alamat_proyek];

  const result = await exports.insertValuesIntoCells(
    file_id,
    data,
    sheetName,
    cellAddress
  );

  return result;
}