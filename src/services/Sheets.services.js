const { google } = require("googleapis");

exports.getMeta = async function () {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  const client = await auth.getClient();
  const googleSheets = google.sheets({ version: "v4", auth: client });

  const result = await googleSheets.spreadsheets.get({
    auth,
    spreadsheetId: process.env.SPREADSHEET_ID,
  });

  return { message: "Meta data found", result };
};

exports.postData = async function (data) {
  const { spreadsheet_id, key, value } = data;

  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  // Create client instance for auth
  const client = await auth.getClient();
  // Instance of Google Sheets API
  const googleSheets = google.sheets({ version: "v4", auth: client });

  // Write rows to spreadsheet
  const result = await googleSheets.spreadsheets.values.append({
    auth,
    spreadsheetId: spreadsheet_id,
    range: "Sheet1!A:B",
    valueInputOption: "USER_ENTERED",
    resource: {
      values: [[key, value]],
    },
  });

  return { message: "Data posted", result: result.config.data.values };
};

exports.postValuesFromRange = async function (body) {
  const { spreadsheet_id } = body;

  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  // Create client instance for auth
  const client = await auth.getClient();
  // Instance of Google Sheets API
  const googleSheets = google.sheets({ version: "v4", auth: client });

  // Read rows from spreadsheet
  const result = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId: spreadsheet_id,
    range: "Sheet1!A:A",
  });

  return { message: "Data range posted", result: result.data.values };
};

exports.postCopyTemplate = async function (body) {
  const { spreadsheet_id } = body;
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });

  const drive = google.drive({ version: "v3", auth });

  const spreadsheetId = spreadsheet_id;

  if (spreadsheetId == null) {
    return {message: "Error getting spreadsheet id"};
  }

  const originalFile = await drive.files.get({
    fileId: spreadsheetId,
    fields: "name", // Specify the fields you want to retrieve (e.g., 'name', 'id', 'mimeType', etc.)
  });

  // Create a copy of the file on Google Drive
  const copiedFile = await drive.files.copy({
    fileId: spreadsheetId,
    requestBody: {
      name: "Copy of " + originalFile.data.name, // Name for the copied file
    },
  });

  // Construct the shareable URL for the copied file
  const copiedFileId = copiedFile.data.id;

  if (!copiedFileId) {
    return "Error copying template";
  }

  const response = `https://docs.google.com/spreadsheets/d/${copiedFileId}`;

  await drive.permissions.create({
    fileId: copiedFileId,
    requestBody: {
      role: "writer",
      type: "anyone",
    },
  });

  return { message: "Template copied", id: copiedFileId, url: response };
};

exports.createSheets = async function (body) {
  const { title, root_folder_id, email_to_access } = body;

  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });

  const client = await auth.getClient();
  const googleSheets = google.sheets({ version: "v4", auth: client });
  const drive = google.drive({ version: "v3", auth });

  const response = await googleSheets.spreadsheets.create({
    resource: {
      properties: {
        title,
      },
    },
    auth,
  });

  const spreadsheetId = response.data.spreadsheetId;

  await drive.permissions.create({
    fileId: spreadsheetId,
    requestBody: {
      role: "writer",
      type: "anyone",
    },
  });

  await drive.files.update({
    fileId: spreadsheetId,
    requestBody: {
      addParents: [root_folder_id],
    },
  });

  return {
    message: "Sheet created",
    id: spreadsheetId,
    url: "https://docs.google.com/spreadsheets/d/" + spreadsheetId,
  };
};

function getSpreadsheetIdFromUrl(spreadsheetUrl) {
  // Mencocokkan URL dengan pola yang sesuai dengan link spreadsheet Google Sheets
  const regex = /\/spreadsheets\/d\/([\w-]+)/;
  const match = spreadsheetUrl.match(regex);

  if (match && match[1]) {
    // Mengembalikan ID spreadsheet yang cocok
    return match[1];
  } else {
    // Jika URL tidak sesuai, maka mengembalikan null atau pesan kesalahan
    return null;
  }
}
