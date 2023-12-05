const mongoose = require('mongoose');
const { regulationSchema } = require('./Regulation.models');

const baseSampleSchema = new mongoose.Schema({
    sample_name: { type: String, required: true, unique: true },
    file_id: { type: String, required: true },
    param: [{ type: String, required: false }],
    regulation: [regulationSchema],
});

const BaseSample = mongoose.model("BaseSample", baseSampleSchema);

module.exports = {
    baseSampleSchema,
    BaseSample
}