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

exports.addProjectFiles = async function (req, res) {
  try {
    const result = await projectsServices.addProjectFiles(req.files, req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.removeProjectFiles = async function (req, res) {
  try {
    const result = await projectsServices.removeProjectFiles(req.body);
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

exports.changeToReview = async function (req, res) {
  try {
    const result = await projectsServices.changeToReview(req.params);
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

exports.fillSample = async function (req, res) {
  try {
    const result = await projectsServices.fillSample(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.changeDivision = async function (req, res) {
  try {
    const result = await projectsServices.changeDivision(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

exports.getAllLHP = async function (req, res) {
  try {
    const result = await projectsServices.getAllLHP();
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

exports.getLHP = async function (req, res) {
  try {
    const result = await projectsServices.getLHP(req.params);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

exports.setDeadlineLHP = async function (req, res) {
  try {
    const result = await projectsServices.setDeadlineLHP(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

exports.getAllPPLHPDetail = async function (req, res) {
  try {
    const result = await projectsServices.getAllPPLHPDetail();
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

exports.getPPLHPDetail = async function (req, res) {
  try {
    const result = await projectsServices.getPPLHPDetail(req.params);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

exports.LHPAccept = async function (req, res) {
  try {
    const result = await projectsServices.LHPAccept(req.params, req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

exports.LHPRevision = async function (req, res) {
  try {
    const result = await projectsServices.LHPRevision(req.params, req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

exports.getNotes = async function (req, res) {
  try {
    const result = await projectsServices.getNotes(req.params);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}