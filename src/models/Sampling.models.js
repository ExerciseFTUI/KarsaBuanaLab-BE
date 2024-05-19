const mongoose = require("mongoose");
const { userSchema } = require("./User.models");
const { regulationSchema } = require("./Regulation.models");
const { paramSchema } = require("./Param.models");

const samplingParamSchema = new mongoose.Schema({
  param: { type: String, required: true, unique: true },
// method with value of array of string
  method: { type: [String], required: false },
  unit: { type: String, required: false },
  operator: { type: String, required: false, enum: ["<", ">", "="] },
  baku_mutu: { type: Number, required: false },
  result: { type: Number, required: false },
  history_result: [{type: {result: Number, date: Date, count: Number, method: String, unit: String}, required: false}],
  CRM: { type: String, enum: ["DITERIMA", "DITOLAK"], required: false },
  CVS: { type: String, enum: ["DITERIMA", "DITOLAK"], required: false },
  RPD: { type: String, enum: ["DITERIMA", "DITOLAK"], required: false },
  Recovery: { type: String, enum: ["DITERIMA", "DITOLAK"], required: false },
  analysis_status: {
    type: String,
    enum: ["WAITING", "SUBMIT", "ACCEPTED", "REVISION"],
    required: false,
    default: "WAITING",
  },
});

const samplingParam = mongoose.model("samplingParam", samplingParamSchema);

const samplingSchema = new mongoose.Schema({
  sample_name: {
    type: String,
    required: true,
  },
  harga: {
    type: String,
    required: false,
  },
  fileId: {
    type: String,
    required: true,
  },
  param: [samplingParamSchema],
  regulation_name: [regulationSchema],
  location: {
    type: String,
    required: false,
  },
  lab_assigned_to: [
    {
      type: String,
      required: false,
    },
  ],
  status: {
    type: String,
    enum: [
      "ASSIGNED",
      "NOT ASSIGNED",
      "VERIFYING",
      "FINISHED",
      "SUBMIT",
      "WAITING",
      "ACCEPTED",
      "REVISION",
    ],
    required: false,
    default: "NOT ASSIGNED",
  },
  
  jadwal: {
    type: Date,
    required: false,
  },
  deadline: {
    type: { from: String, to: String },
    required: false,
  },
  unit: {
    type: String,
    required: false,
  },
  method: {
    type: String,
    required: false,
  },
});

const Sampling = mongoose.model("Sampling", samplingSchema);

module.exports = {
  samplingSchema,
  Sampling,
  samplingParamSchema,
  samplingParam,
};
