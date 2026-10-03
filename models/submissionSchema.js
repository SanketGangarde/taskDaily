const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
    required: true,
  },

  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  fileUrl: {
    type: String,
    required: true,
  },

  fileName: {
    type: String,
    required: true,
  },

  publicId: {
    type: String,
    required: true,
  },

  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Submission", submissionSchema);
