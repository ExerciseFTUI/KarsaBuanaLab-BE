const mongoose = require("mongoose");

const OperatorEnum = ["<", ">", "="];

const paramSchema = new mongoose.Schema({
  param: { type: String, required: true, unique: true },
  method: [{ type: String, required: false }],
  unit: [{ type: String, required: false }],
  operator: { type: String, enum: OperatorEnum, required: false },
  baku_mutu: { type: Number, required: false },
  result: { type: Number, required: false },
});

const Param = mongoose.model("Param", paramSchema);

module.exports = {
  paramSchema,
  Param,
};
