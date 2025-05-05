const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: { type: String, required: true }, // Instead of ObjectId, it's now just a string
  createdAt: { type: Date, default: Date.now },
});

const Group = mongoose.model("Group", GroupSchema);
module.exports = Group;
