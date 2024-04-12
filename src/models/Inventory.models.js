const mongoose = require("mongoose");
const { fileSchema } = require("./File.models");

const repeatEnum = [
  "1 Month",
  "2 Month",
  "3 Month",
  "4 Month",
  "6 Month",
  "1 Year",
  "2 Year",
];
const categoryEnum = ["Tools", "Materials"];

const inventorySchema = new mongoose.Schema({
  tools_name: { type: String, required: true },
  description: { type: String, required: false },
  last_maintenance: { type: Date, required: false },
  maintenance_history: [{ type: Date, required: false }],
  maintenance_every: { type: String, enum: repeatEnum, required: false },
  assigned_user: [{ type: String, required: false }],
  category: { type: String, enum: categoryEnum, required: false },
  folder_id: { type: String, required: false },
  inventory_file: [fileSchema],
});

const Inventory = mongoose.model("Inventory", inventorySchema);

module.exports = {
  inventorySchema,
  Inventory,
};
