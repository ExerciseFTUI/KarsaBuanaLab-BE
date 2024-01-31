const projectsServices = require("../services/Projects.services");
const drivesServices = require("../services/Drives.services");

exports.newBaseSample = async function (req, res) {
  try {
    const result = await projectsServices.newBaseSample(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.editProject = async function (req, res) {
  try {
    const result = await projectsServices.editProject(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.editProjectSamples = async function (req, res) {
  try {
    const result = await projectsServices.editProjectSamples(
      req.params.id,
      req.body
    );
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.editProjectFiles = async function (req, res) {
  try {
    const result = await projectsServices.editProjectFiles(req.files, req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.createProject = async function (req, res) {
  try {
    const result = await projectsServices.createProject(req.files, req.body);
    res.status(200).json(result);
  } catch (errorObj) {
    if (errorObj.new_folder_id == null) {
      res.status(400).json({
        message: errorObj.message,
        result: "Failed to create project folder",
      });
      return;
    }
    const delete_folder = await drivesServices.deleteFile({
      file_id: errorObj.new_folder_id,
    });
    res.status(400).json({
      message: errorObj.message,
      result:
        delete_folder == null
          ? "Failed to delete the project folder"
          : "Project folder deleted",
    });
  }
};

exports.createProjectJSON = async function (req, res) {
  try {
    const result = await projectsServices.createProjectJSON(req.body);
    res.status(200).json(result);
  } catch (errorObj) {
    if (errorObj.new_folder_id == null) {
      res.status(400).json({
        message: errorObj.message,
        result: "Failed to create project folder",
      });
      return;
    }
    const delete_folder = await drivesServices.deleteFile({
      file_id: errorObj.new_folder_id,
    });
    res.status(400).json({
      message: errorObj.message,
      result:
        delete_folder == null
          ? "Failed to delete the project folder"
          : "Project folder deleted",
    });
  }
};

exports.getSample = async function (req, res) {
  try {
    const result = await projectsServices.getSample(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getProjectByDivision = async function (req, res) {
  try {
    const result = await projectsServices.getProjectByDivision(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getLinkFiles = async function (req, res) {
  try {
    const result = await projectsServices.getLinkFiles(req.params);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getProjectByAcc = async function (req, res) {
  try {
    const result = await projectsServices.getProjectByAcc(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.assignProject = async function (req, res) {
  try {
    const result = await projectsServices.assignProject(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.editAssignedProjectUsers = async function (req, res) {
  try {
    const result = await projectsServices.editAssignedProjectUsers(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.editAssignedProjectSchedule = async function (req, res) {
  try {
    const result = await projectsServices.editAssignedProjectSchedule(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.changeToDraft = async function (req, res) {
  try {
    const result = await projectsServices.changeToDraft(req.params);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.changeToFinished = async function (req, res) {
  try {
    const result = await projectsServices.changeToFinished(req.params);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getPplhpByStatus = async function (req, res) {
  try {
    const result = await projectsServices.getPplhpByStatus(req.params);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
