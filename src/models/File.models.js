const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  file_name: { type: String, required: true },
  file_id: { type: String, required: true },
});

const File = mongoose.model("File", fileSchema);

module.exports = File;
