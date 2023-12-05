const { google } = require("googleapis");
const { getAuth } = require("../config/driveAuth");

exports.getDrive = async function () {
  const auth = getAuth("https://www.googleapis.com/auth/drive");

  const drive = google.drive({ version: "v3", auth });

  const result = await drive.files.list({
    pageSize: 10,
    fields: "nextPageToken, files(id, name)",
  });

  return { message: "Drive found", result };
};

exports.renameFile = async function (body) {
  const { file_id, name } = body;

  const auth = getAuth("https://www.googleapis.com/auth/drive");

  const drive = google.drive({ version: "v3", auth });

  const result = await drive.files.update({
    fileId: file_id,
    requestBody: {
      name: name,
    },
  });

  return { message: "File renamed", result };
};

exports.createFolder = async function (body) {
  const { folder_name, root_folder_id } = body;

  const auth = getAuth("https://www.googleapis.com/auth/drive");

  const drive = google.drive({ version: "v3", auth });

  const result = await drive.files.create({
    requestBody: {
      name: folder_name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [root_folder_id],
    },
    fields: "id",
  });

  await drive.permissions.create({
    fileId: result.data.id,
    requestBody: {
      role: "writer",
      type: "anyone",
    },
  });

  return {
    message: "Folder created",
    result: {
        id: result.data.id,
        url: "https://drive.google.com/drive/folders/" + result.data.id,
    },
  };
};

exports.deleteFile = async function (body) {
  const { file_id } = body;

  const auth = getAuth("https://www.googleapis.com/auth/drive");

  const drive = google.drive({ version: "v3", auth });

  const result = await drive.files.delete({
    fileId: file_id,
  });

  return { message: "File deleted", result };
};
