const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    no_penawaran: { type: String, required: true },
    no_sampling: { type: String, required: true },
    client_name: { type: String, required: true },
    project_name: { type: String, required: true },
    alamat_kantor: { type: String, required: true },
    alamat_sampling: { type: String, required: true },
    surel: { type: String, required: true , unique: true},
    contact_person: { type: String, required: true },
    status: {type: String, required: true},
    baseurl: {type: String, required: true},
    password: {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 20,
    },
    jumlah_revisi: {type: Number, required: true},
    valuasi_proyek: {type: Number, required: true},
    surat_penawaran: [{type: URL, required: true}], // masih belum tau tipe datanya
    sampling_list: [{type: URL, required: true}], // masih belum tau tipe datanya
    file: [{type: URL, required: true}] // masih belum tau tipe datanya
})