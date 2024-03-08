const mongoose = require("mongoose");
const { regulationSchema } = require("./Regulation.models");
const { paramSchema } = require("./Param.models");

const baseSampleSchema = new mongoose.Schema({
  sample_name: { type: String, required: true, unique: true },
  file_id: { type: String, required: true },
  file_safety_id: { type: String, required: true },
  param: [paramSchema],
  regulation: [regulationSchema],
});

const BaseSample = mongoose.model("BaseSample", baseSampleSchema);

module.exports = {
  baseSampleSchema,
  BaseSample,
};
/*
Air LImbah
Param : PH, Kebeningan, kekentalan
File : 
Regulation : 
-> reg_name : PP 2014
    default_param : PH,Kebeningan

sample

*/
