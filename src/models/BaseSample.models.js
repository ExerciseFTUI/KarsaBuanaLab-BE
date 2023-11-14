const mongoose = require('mongoose');

const baseSampleSchema = new mongoose.Schema({
    sample_name: { type: String, required: true, unique: true },
    file_id: { type: String, required: true },
    param: [{ type: String, required: false }],
    regulation: { type: String, required: false },
});

const BaseSample = mongoose.model("BaseSample", baseSampleSchema);

module.exports = BaseSample;