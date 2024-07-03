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
const conditionEnum = ["GOOD", "BROKEN", "NEED SERVICE", "CALIBRATING"];

const maintenanceHistorySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  change_type: { type: String, required: true },
  change_typevendor: { type: String, required: false },
});

const inventorySchema = new mongoose.Schema({
  tools_name: { type: String, required: true },
  current_vendor : { type: String, required: false },
  description: { type: String, required: false },
  last_maintenance: { type: Date, required: false },
  maintenance_history: [maintenanceHistorySchema],
  maintenance_every: { type: String, enum: repeatEnum, required: false },
  assigned_user: [{ type: String, required: false }],
  condition: { type: String, enum: conditionEnum, required: false },
  folder_id: { type: String, required: false },
  inventory_file: [fileSchema],
});

const vendorSchema = new mongoose.Schema({
  vendor_name: { type: String, required: true },
}); 

const Inventory = mongoose.model("Inventory", inventorySchema);
const Vendor = mongoose.model("Vendor",vendorSchema)

module.exports = {
  vendorSchema,
  Vendor,
  inventorySchema,
  Inventory,
};
