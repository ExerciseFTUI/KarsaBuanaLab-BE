const baseSampleServices = require("../services/BaseSample.services");
const drivesServices = require("../services/Drives.services");

exports.getBaseSample = async function (req, res) {
  try {
    const result = await baseSampleServices.getBaseSample(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.addBaseSample = async function (req, res) {
  try {
    const result = await baseSampleServices.addBaseSample(req.files, req.body);
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

exports.editBaseSample = async function (req, res) {
  try {
    const result = await baseSampleServices.editBaseSample(
      req.params.id,
      req.body
    );
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.removeBaseSample = async function (req, res) {
  try {
    const result = await baseSampleServices.removeBaseSample(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
