const labServices = require("../services/Lab.services");

exports.getProjectInLab = async function (req, res) {
  try {
    const result = await labServices.getProjectInLab(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.assignStaffToSample = async function (req, res) {
  try {
    const result = await labServices.assignStaffToSample(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.changeSampleStatus = async function (req, res) {
  try {
    const result = await labServices.changeSampleStatus(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.removeAssignedStaff = async function (req, res) {
  try {
    const result = await labServices.removeAssignedStaff(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.submitLab = async function (req, res) {
  try {
    const result = await labServices.submitLab(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getProjectByLab = async function (req, res) {
  try {
    const result = await labServices.getProjectByLab(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.changeLabStatus = async function (req, res) {
  try {
    const result = await labServices.changeLabStatus(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.addNotes = async function (req, res) {
  try {
    const result = await labServices.addNotes(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getLD = async function (req, res) {
  try {
    const result = await labServices.getLD();
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.assignLD = async function (req, res) {
  try {
    const result = await labServices.assignLD(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getSPVDashboard = async function (req, res) {
  try {
    const result = await labServices.getSPVDashboard(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getStaffDashboard = async function (req, res) {
  try {
    const result = await labServices.getStaffDashboard(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
