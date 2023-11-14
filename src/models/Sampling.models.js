const mongoose = require("mongoose");
const { userSchema } = require("./User.models");

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
  regulation: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: false,
  },
  assigned: userSchema,
  status: {
    type: String, 
    required:false,
    default: "NOT ASSIGNED"
  },
  jadwal: {
    type: Date, 
    required:false
  },

});

const Sampling = mongoose.model("Sampling", samplingSchema);

module.exports = {
  samplingSchema,
  Sampling,
};