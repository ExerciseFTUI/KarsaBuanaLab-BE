const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: {
      type: String,
      required: true,
      minlength: 8,
      maxlength: 1024,
  },
  role: { type: String, enum: ["ADMIN", "USER"], required: true, default: "USER" },
});

const User = mongoose.model("User", userSchema);

module.exports = User;