const mongoose = require("mongoose");

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
  status: { type: String, required: false, default: "RUNNING" },
  folder_id: { type: String, required: false },
  password: { type: String, required: false, default: generatePass() },
  jumlah_revisi: { type: Number, required: false, default: 0 },
  valuasi_proyek: { type: Number, required: false },
  surat_penawaran: { type: String, required: false },
  created_year: {
    type: String,
    required: false,
    default: new Date().getFullYear(),
  },
  sampling_list: [{ type: mongoose.Schema.Types.ObjectId, ref: "Sampling" }],
  file: [{ type: mongoose.Schema.Types.ObjectId, ref: "File" }],
  created_at: {
    type: String,
    required: false,
    default: new Date().getFullYear()
  }
});

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;