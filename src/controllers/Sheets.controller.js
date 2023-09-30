const sheetsServices = require("../services/Sheets.services");

exports.getMeta = async function (req, res) {
  try {
    const meta = await sheetsServices.getMeta();
    res.send(meta);
  } catch (error) {
    res.send(error);
  }
};

exports.postData = async function (req, res) {
  try {
    const data = await sheetsServices.postData(req.body);
    res.send("Succesfully sent! Thank You");
  } catch (error) {
    res.send(error);
  }
};

exports.postValuesFromRange = async function (req, res) {
  try {
    const data = await sheetsServices.postValuesFromRange(req.body);
    res.send(data.data.values);
  } catch (error) {
    res.status(500).json({ error: "Error fetching values" });
  }
};

exports.postCopyTemplate = async function (req, res) {
  try {
    const response = await sheetsServices.postCopyTemplate(req);
    res.status(200).json({ message: "Sheet copied successfully", response });
  } catch (error) {
    res.status(500).json({ message: "Error copying sheet", error: error });
  }
};

exports.postCreateSheets = async function (req, res) {
  try {
    const response = await sheetsServices.createSheets(req.body);
    res.status(200).json({ message: "Sheet created successfully", response });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error creating sheet",
        error: error.response.data.error,
      });
  }
};
