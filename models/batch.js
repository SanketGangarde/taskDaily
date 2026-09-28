const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  timing : {
    type: String,  
    required:true
  },

  duration : {
      type: String,
      required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Batch = mongoose.model("Batch", batchSchema);

module.exports = Batch;