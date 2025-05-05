const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  credit: { type: Number, required: true },
  debit: { type: Number, required: true },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },
  tag: { type: String },
  description: { type: String },
  finalBalance: { type: Number, required: true },
});

module.exports = mongoose.model("Transaction", transactionSchema);
