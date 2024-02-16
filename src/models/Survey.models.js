const mongoose = require("mongoose");

const surveySchema = new mongoose.Schema({
  title: { type: String, required: true },
  questions: [
    {
      text: { type: String, required: true },
      type: {
        type: String,
        enum: ["rating", "essay", "multiple_choice"],
        required: true,
      },
      choices: [{ type: String }],
    },
  ],
  responses: [
    {
      projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      answers: [
        {
          questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
          value: { type: String },
        },
      ],
    },
  ],
});
const Survey = mongoose.model("Survey", surveySchema);

module.exports = {
  surveySchema,
  Survey,
};
