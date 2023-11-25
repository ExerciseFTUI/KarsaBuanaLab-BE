const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: {
      type: String,
      required: true
  },
  role: { type: String, enum: ["ADMIN", "STAFF"], required: true, default: "STAFF" },
  division: { type: String, enum: ["Marketing", "Sampling", "Sampling Recipient", "PPLHP", "Lab"], required: true, default: "Sampling"}
});

const User = mongoose.model("User", userSchema);

module.exports = {
  userSchema,
  User,
};