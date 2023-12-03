const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: {
      type: String,
      required: true
  },
  role: { type: String, enum: ["ADMIN", "USER"], required: false, default: "USER" },
  division: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

module.exports = {
  userSchema,
  User,
};