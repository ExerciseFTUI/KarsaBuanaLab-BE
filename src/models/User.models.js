const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["ADMIN", "USER", "SPV"],
    required: false,
    default: "USER",
  },
  division: {
    type: String,
    required: false,
    enum: ["Marketing", "Sampling", "Lab", "PPLHP"],
  },
  createdAt: { type: Date, default: Date.now },
  jadwal: [
    {
      type: {
        projectID: String,
        projectName: String,
        from: String,
        to: String,
      },
      required: false,
    },
  ],
});

const User = mongoose.model("User", userSchema);

module.exports = {
  userSchema,
  User,
};
