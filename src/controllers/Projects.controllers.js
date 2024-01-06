const projectsServices = require('../services/Projects.services');
const drivesServices = require('../services/Drives.services');

exports.newBaseSample = async function (req, res) {
  try {
    const result = await projectsServices.newBaseSample(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

exports.editProject = async function (req, res) {
  try {
    const result = await projectsServices.editProject(req.files,req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

exports.createProject = async function (req, res) {
  try {
    const result = await projectsServices.createProject(req.files, req.body);
    res.status(200).json(result);
  } catch (errorObj) {
    if(errorObj.new_folder_id == null) {
      res.status(400).json({ message: errorObj.message, result: "Failed to create project folder" });
      return;
    }
    const delete_folder = await drivesServices.deleteFile({file_id: errorObj.new_folder_id});
    res.status(400).json({ message: errorObj.message, result: delete_folder == null? "Failed to delete the project folder": "Project folder deleted" });
  }
}

exports.getLinkFiles = async function (req, res) {
  try {
    const result = await projectsServices.getLinkFiles(req.params);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}