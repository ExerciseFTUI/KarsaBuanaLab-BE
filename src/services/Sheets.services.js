const { google } = require("googleapis");

exports.getMeta = async function () {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  const client = await auth.getClient();
  const googleSheets = google.sheets({ version: "v4", auth: client });

  const metaData = await googleSheets.spreadsheets.get({
    auth,
    spreadsheetId: process.env.SPREADSHEET_ID,
  });

  return metaData;
};

exports.postData = async function (data) {
  const { request, name } = data;

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
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: "Sheet1!A:B",
    valueInputOption: "USER_ENTERED",
    resource: {
      values: [[request, name]],
    },
  });

  return result;
};

exports.postValuesFromRange = async function (range) {
  const { request, name } = range;

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
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: "Sheet1!A:A",
  });

  return result;
};

exports.postCopyTemplate = async function (req) {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });

  const drive = google.drive({ version: "v3", auth });

  console.log(req.query);

  const spreadsheetId = getSpreadsheetIdFromUrl(req.query.spreadsheetUrl);

  console.log(spreadsheetId);

  if (spreadsheetId == null) {
    return "Error getting spreadsheet id";
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

  return response;
};

exports.createSheets = async function (property) {
  const { properties } = property;

  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });

  const client = await auth.getClient();
  const googleSheets = google.sheets({ version: "v4", auth: client });

  let response = null;
  try {
    response = await googleSheets.spreadsheets.create({
      resource: {
        properties: {
          title: "Baruuu",
        },
      },
      auth,
    });
  } catch (error) {}

  // Set the sharing permissions to "Anyone with the link can view"
  if (response != null) {
    const drive = google.drive({ version: "v3", auth });
    const spreadsheetId = response.data.spreadsheetId;

    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        role: "writer", // Change the role as needed (e.g., reader, writer, owner)
        type: "user",
        emailAddress: "netlabdte2023@gmail.com", // Replace with the email address of the user
      },
    });
  } else {
    return "error setting permission";
  }

  return response;
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

exports.getDrive = async function () {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });

  const client = await auth.getClient();
  const drive = google.drive({ version: "v3", auth });

  const response = await drive.files.list({
    pageSize: 10,
    fields: "nextPageToken, files(id, name)",
  });

  return response;
}