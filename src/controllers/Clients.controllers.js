const clientsServices = require("../services/Clients.services");

exports.login = async function login(req, res) {
  try {
    const result = await clientsServices.login(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getSampleStatus = async function (req, res) {
  try {
    const result = await clientsServices.getSampleStatus(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAnalysisStatus = async function (req, res) {
  try {
    const result = await clientsServices.getAnalysisStatus(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getPaymentStatus = async function (req, res) {
  try {
    const result = await clientsServices.getPaymentStatus(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.fillSurvey = async function (req, res) {
  try {
    const result = await clientsServices.fillSurvey(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAllStatus = async function (req, res) {
  try {
    const result = await clientsServices.getAllStatus(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.resendEmail = async function (req, res) {
  try {
    const result = await clientsServices.resendEmail(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
