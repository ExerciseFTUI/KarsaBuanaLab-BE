const drivesServices = require("../services/Drives.services");

exports.getDrive = async function (req, res) {
  try {
    const result = await drivesServices.getDrive();
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.renameFile = async function (req, res) {
  try {
    const result = await drivesServices.renameFile(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.createFolder = async function (req, res) {
  try {
    const result = await drivesServices.createFolder(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteFile = async function (req, res) {
  try {
    const result = await drivesServices.deleteFile(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getFolderDetails = async function (req, res) {
  try {
    const result = await drivesServices.getFolderDetails(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};