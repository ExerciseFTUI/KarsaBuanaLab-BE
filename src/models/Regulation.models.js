const mongoose = require("mongoose");

const regulationSchema = new mongoose.Schema({
  regulation_name: { type: String, required: true },
  param: [{ type: String, required: true }],
});

const Regulation = mongoose.model("Regulation", regulationSchema);

module.exports = {
  regulationSchema,
  Regulation,
};
