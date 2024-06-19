const mongoose = require("mongoose");

const ldSchema = new mongoose.Schema({
  ld_name: { type: String, required: true },
  ld_file_id: { type: String, required: true },
});

const LD = mongoose.model("LD", ldSchema);

module.exports = {
  ldSchema,
  LD,
};
