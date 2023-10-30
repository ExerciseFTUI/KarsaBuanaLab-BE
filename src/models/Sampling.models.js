const mongoose = require("mongoose");

const samplingSchema = new mongoose.Schema({
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
  regulation: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: false,
  },
});

const Sampling = mongoose.model("Sampling", samplingSchema);

module.exports = Sampling;
