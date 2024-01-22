const mongoose = require("mongoose");
const { userSchema } = require("./User.models");
const { regulationSchema } = require("./Regulation.models");

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
  param: [
    {
      type: String,
      required: true,
    },
  ],
  regulation_name: [regulationSchema],
  location: {
    type: String,
    required: false,
  },
  assigned_to: {
    type: String,
    required: false,
  },
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
    ],
    required: false,
    default: "NOT ASSIGNED",
  },
  jadwal: {
    type: Date,
    required: false,
  },
});

const Sampling = mongoose.model("Sampling", samplingSchema);

module.exports = {
  samplingSchema,
  Sampling,
};
