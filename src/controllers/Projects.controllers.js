const projectsServices = require('../services/Projects.services');

exports.newBaseSample = async function (req, res) {
  try {
    const result = await projectsServices.newBaseSample(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

exports.createProject = async function (req, res) {
  try {
    const result = await projectsServices.createProject(req.files, req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}