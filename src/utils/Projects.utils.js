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
) {
	const auth = getAuth("https://www.googleapis.com/auth/drive");

	const drive = google.drive({ version: "v3", auth });

	if (!Array.isArray(sampling_list)) {
		return null;
	}

	const sample_object_list = await Promise.all(
		sampling_list.map(async (sample) => {
			const result = await BaseSample.findOne({ sample_name: sample });
			if (!result) {
				throw new Error("Error while copying sample template: Base sample not found");
			}
			const samplingObj = new Sampling({
				fileId: result.file_id,
				sample_name: result.sample_name,
				param: result.param,
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
				name: `Sampel_${sample.sample_name}_${project_name}_${
					index + 1
				}`,
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

	let nomorProject;
	if (lastProjectInYear) {
		// Increment the project number from the last project in the current year
		nomorProject = lastProjectInYear.no_sampling + 1;
	} else {
		// If no project exists in the current year, start from 1
		nomorProject = 1;
	}

	return nomorProject;
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
