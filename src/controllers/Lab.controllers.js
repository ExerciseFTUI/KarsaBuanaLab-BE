const labServices = require("../services/Lab.services");

exports.getProjectInLab = async function (req, res) {
  try {
    const result = await labServices.getProjectInLab(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.assignPersonToSample = async function (req, res) {
  try {
    const result = await labServices.assignPersonToSample(req.body);
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
