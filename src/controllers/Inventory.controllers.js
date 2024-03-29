
const inventoryServices = require("../services/Inventory.services");


exports.getAllInventory = async function (req, res) {
  try {
    const result = await inventoryServices.getAllInventory(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};