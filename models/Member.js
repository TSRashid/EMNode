const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  cashIn: { type: Number, default: 0 }, // Total money received
  cashOut: { type: Number, default: 0 }, // Total money spent
  finalBalance: { type: Number, default: 0 }, // Net balance (cashIn - cashOut)
});

const Member = mongoose.model("Member", memberSchema);
module.exports = Member;
