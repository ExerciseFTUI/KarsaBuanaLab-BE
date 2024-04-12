const inventoryServices = require("../services/Inventory.services");

exports.getAllInventory = async function (req, res) {
  try {
    const result = await inventoryServices.getAllInventory(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.createInventory = async function (req, res) {
  try {
    const result = await inventoryServices.createInventory(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getInventoryItemById = async function (req, res) {
  try {
    const result = await inventoryServices.getInventoryItemById(req.params);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateInventory = async function (req, res) {
  try {
    const result = await inventoryServices.updateInventory(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getUsers = async function (req, res) {
  try {
    const result = await inventoryServices.getUsers();
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.addFile = async function (req, res) {
  try {
    const result = await inventoryServices.addFile(req.files, req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteFileFromInventory = async function (req, res) {
  try {
    const result = await inventoryServices.deleteFileFromInventory(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
