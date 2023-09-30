const sheetsServices = require("../services/Sheets.services");

exports.getMeta = async function (req, res) {
  try {
    const result = await sheetsServices.getMeta();
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

exports.postData = async function (req, res) {
  try {
    const result = await sheetsServices.postData(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

exports.postValuesFromRange = async function (req, res) {
  try {
    const result = await sheetsServices.postValuesFromRange(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

exports.postCopyTemplate = async function (req, res) {
  try {
    const result = await sheetsServices.postCopyTemplate(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

exports.postCreateSheets = async function (req, res) {
  try {
    const result = await sheetsServices.createSheets(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
