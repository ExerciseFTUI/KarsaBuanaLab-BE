const mongoose = require("mongoose");
const { samplingSchema } = require("./Sampling.models");
const { fileSchema } = require("./File.models");
const { userSchema } = require("./User.models");

function generatePass() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters.charAt(randomIndex);
  }

  return password;
}

const projectSchema = new mongoose.Schema({
  no_penawaran: { type: String, required: true },
  no_sampling: { type: String, required: true },
  client_name: { type: String, required: true },
  project_name: { type: String, required: true },
  alamat_kantor: { type: String, required: true },
  alamat_sampling: { type: String, required: true },
  surel: { type: String, required: true },
  contact_person: { type: String, required: true },
  status: {
    type: String,
    required: false,
    default: "RUNNING",
    enum: ["RUNNING", "FINISHED", "CANCELLED"],
  },
  current_division: {
    type: String,
    required: false,
    default: "SAMPLING",
    enum: ["LAB", "SAMPLING", "PPLHP"],
  },
  folder_id: { type: String, required: false },
  password: { type: String, required: false, default: generatePass() },
  jumlah_revisi: { type: Number, required: false, default: 0 },
  valuasi_proyek: { type: Number, required: false },
  surat_penawaran: { type: String, required: false },
  surat_fpp: { type: String, required: false },
  jadwal_sampling: { type: { from: String, to: String }, required: false },
  desc_failed: {
    type: String,
    required: false,
    default: "Project running smoothly.",
  },
  created_year: {
    type: String,
    required: false,
    default: new Date().getFullYear(),
  },
  sampling_list: [samplingSchema],
  file: [fileSchema],
  lab_file: [fileSchema],
  created_at: {
    type: Date,
    required: false,
    default: Date.now,
  },
  project_assigned_to: [
    {
      type: String,
      required: false,
    },
  ],
  is_paid: { type: Boolean, default: false },
  pplhp_status: {
    type: String,
    required: false,
    default: "RECEIVE",
    enum: ["RECEIVE", "DRAFT", "REVIEW", "FINISHED"],
  },
  lab_status: {
    type: String,
    required: false,
    default: "RECEIVE",
    enum: ["RECEIVE", "NEED ANALYZE", "IN REVIEW BY SPV", "REVISION BY SPV", "IN REVIEW BY ADMIN", "REVISION"],
    // "RECEIVE", IS DEFAULT VALUE WHEN PROJECT IS MOVED FROM PPLHP (after create DRAFT LHP) TO LAB
    // "NEED ANALYZE", IS VALUE WHEN SPV HAS ASSIGNED THE PROJECT TO ANALYZER AND WAITING SPV TO REVIEW THE RESULT
    // "IN REVIEW BY ADMIN", IS VALUE WHEN SPV HAS REVIEWED THE RESULT AND WAITING ADMIN TO REVIEW THE RESULT
    // "REVISION", IS VALUE WHEN ADMIN HAS REVIEWED THE RESULT AND NEED REVISION
  },
  is_survey_filled: { type: Boolean, default: false },
  deadline_lhp: { type: { from: String, to: String }, required: false },
  lhp: { type: String, required: false },
  notes: [
    {
      date: { type: Date, required: false },
      content: { type: String, required: false },
    },
  ],
});

const Project = mongoose.model("Project", projectSchema);

module.exports = {
  projectSchema,
  Project,
};
