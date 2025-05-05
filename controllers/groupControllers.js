const Group = require("../models/Group");
const Member = require("../models/Member");
const Transaction = require("../models/Transaction");

exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find();
    const responseData = await Promise.all(
      groups.map(async (group) => {
        const members = await Member.find({ groupId: group._id });
        return {
          groupName: group.name,
          members: members.map((member) => ({
            name: member.name,
            cashIn: member.cashIn,
            cashOut: member.cashOut,
            finalBalance: member.finalBalance,
          })),
        };
      })
    );
    res.json(responseData);
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.addExpense = async (req, res) => {
  try {
    const {
      groupName,
      amount,
      paidBy,
      splitAmong,
      divideMode,
      customAmounts,
      tag,
      description,
    } = req.body;
    console.log("Request body:", req.body);

    const group = await Group.findOne({ name: groupName });
    if (!group) return res.status(404).json({ message: "Group not found" });

    const paidByMember = await Member.findOne({
      name: paidBy,
      groupId: group._id,
    });
    if (!paidByMember)
      return res.status(404).json({ message: "Paid By member not found" });

    const splitMembers = await Member.find({
      name: { $in: splitAmong },
      groupId: group._id,
    });
    if (splitMembers.length !== splitAmong.length) {
      return res.status(404).json({ message: "Some split members not found" });
    }

    let memberAmounts = {};
    if (divideMode === "equally") {
      const splitAmount = amount / splitMembers.length;
      splitMembers.forEach((member) => {
        memberAmounts[member.name] = splitAmount;
      });
    } else if (divideMode === "unequally" && customAmounts) {
      let totalCustom = 0;
      let membersWithCustom = 0;
      splitMembers.forEach((member) => {
        const custom = customAmounts[member.name];
        if (custom !== null && !isNaN(custom)) {
          memberAmounts[member.name] = custom;
          totalCustom += custom;
          membersWithCustom++;
        }
      });

      const remainingAmount = amount - totalCustom;
      const remainingMembers = splitMembers.length - membersWithCustom;
      if (remainingMembers > 0) {
        const equalSplit = remainingAmount / remainingMembers;
        splitMembers.forEach((member) => {
          if (!(member.name in memberAmounts)) {
            memberAmounts[member.name] = equalSplit;
          }
        });
      }

      if (Math.abs(totalCustom + remainingAmount - amount) > 0.01) {
        return res
          .status(400)
          .json({ message: "Custom amounts do not sum to total amount" });
      }
    }

    console.log(`Processing payer: ${paidByMember.name}`);
    paidByMember.cashIn += amount;
    const payerAmount = memberAmounts[paidBy] || 0;
    paidByMember.cashOut += payerAmount;
    paidByMember.finalBalance += amount - payerAmount;

    const payerTransaction = {
      date: new Date(),
      amount: payerAmount,
      credit: amount,
      debit: payerAmount,
      paidBy: paidByMember._id,
      groupId: group._id,
      memberId: paidByMember._id,
      tag,
      description,
      finalBalance: paidByMember.finalBalance,
    };
    console.log("Creating payer transaction:", payerTransaction);
    await Transaction.create(payerTransaction);
    await paidByMember.save();
    console.log(
      `Payer ${paidByMember.name} saved with finalBalance: ${paidByMember.finalBalance}`
    );

    console.log("Processing non-payers:");
    for (const member of splitMembers) {
      if (!member._id.equals(paidByMember._id)) {
        member.cashOut += memberAmounts[member.name];
        member.finalBalance -= memberAmounts[member.name];
        const nonPayerTransaction = {
          date: new Date(),
          amount: memberAmounts[member.name],
          credit: 0,
          debit: memberAmounts[member.name],
          paidBy: paidByMember._id,
          groupId: group._id,
          memberId: member._id,
          tag,
          description,
          finalBalance: member.finalBalance,
        };
        console.log(
          `Creating transaction for ${member.name}:`,
          nonPayerTransaction
        );
        await Transaction.create(nonPayerTransaction);
        await member.save();
        console.log(
          `${member.name} saved with finalBalance: ${member.finalBalance}`
        );
      }
    }

    res.status(201).json({ message: "Expense added successfully" });
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.subtractExpense = async (req, res) => {
  try {
    const {
      groupName,
      amount,
      paidBy,
      splitAmong,
      divideMode,
      customAmounts,
      tag,
      description,
    } = req.body;
    console.log("Subtract expense request body:", req.body);

    const group = await Group.findOne({ name: groupName });
    if (!group) return res.status(404).json({ message: "Group not found" });

    const splitMembers = await Member.find({
      name: { $in: splitAmong },
      groupId: group._id,
    });
    if (splitMembers.length !== splitAmong.length) {
      return res.status(404).json({ message: "Some split members not found" });
    }

    let memberAmounts = {};
    if (divideMode === "equally") {
      const splitAmount = amount / splitMembers.length;
      splitMembers.forEach((member) => {
        memberAmounts[member.name] = splitAmount;
      });
    } else if (divideMode === "unequally" && customAmounts) {
      let totalCustom = 0;
      let membersWithCustom = 0;
      splitMembers.forEach((member) => {
        const custom = customAmounts[member.name];
        if (custom !== null && !isNaN(custom)) {
          memberAmounts[member.name] = custom;
          totalCustom += custom;
          membersWithCustom++;
        }
      });

      const remainingAmount = amount - totalCustom;
      const remainingMembers = splitMembers.length - membersWithCustom;
      if (remainingMembers > 0) {
        const equalSplit = remainingAmount / remainingMembers;
        splitMembers.forEach((member) => {
          if (!(member.name in memberAmounts)) {
            memberAmounts[member.name] = equalSplit;
          }
        });
      }

      if (Math.abs(totalCustom + remainingAmount - amount) > 0.01) {
        return res
          .status(400)
          .json({ message: "Custom amounts do not sum to total amount" });
      }
    }

    console.log("Processing subtraction for members:");
    for (const member of splitMembers) {
      member.cashOut += memberAmounts[member.name];
      member.finalBalance -= memberAmounts[member.name];
      const transaction = {
        date: new Date(),
        amount: memberAmounts[member.name],
        credit: 0,
        debit: memberAmounts[member.name],
        paidBy: member._id, // Each member "pays" their own deduction
        groupId: group._id,
        memberId: member._id,
        tag,
        description,
        finalBalance: member.finalBalance,
      };
      console.log(`Creating transaction for ${member.name}:`, transaction);
      await Transaction.create(transaction);
      await member.save();
      console.log(
        `${member.name} saved with finalBalance: ${member.finalBalance}`
      );
    }

    res.status(201).json({ message: "Expense subtracted successfully" });
  } catch (error) {
    console.error("Error subtracting expense:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getMemberTransactions = async (req, res) => {
  try {
    const { memberName } = req.params;
    const { groupName } = req.query;

    const group = await Group.findOne({ name: groupName });
    if (!group) return res.status(404).json({ message: "Group not found" });

    const member = await Member.findOne({
      name: memberName,
      groupId: group._id,
    });
    if (!member) return res.status(404).json({ message: "Member not found" });

    const transactions = await Transaction.find({
      memberId: member._id,
      groupId: group._id,
    })
      .populate("paidBy", "name")
      .lean();

    const formattedTransactions = transactions.map((txn) => ({
      date: txn.date.toLocaleString(),
      amount: txn.amount,
      credit: txn.credit,
      debit: txn.debit,
      paidByName: txn.paidBy.name,
      tag: txn.tag,
      description: txn.description,
      finalBalance: txn.finalBalance,
    }));

    console.log(
      `Transactions for ${memberName} in ${groupName}:`,
      formattedTransactions
    );
    res.json(formattedTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { groupName, members } = req.body;
    console.log("Creating group:", { groupName, members });

    const existingGroup = await Group.findOne({ name: groupName });
    if (existingGroup)
      return res.status(400).json({ message: "Group already exists" });

    const group = await Group.create({ name: groupName, createdBy: "User" });
    const memberDocs = members.map((name) => ({
      name,
      groupId: group._id,
      cashIn: 0,
      cashOut: 0,
      finalBalance: 0,
    }));
    await Member.insertMany(memberDocs);

    res.status(201).json({ message: "Group created successfully", groupName });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.addMemberToGroup = async (req, res) => {
  try {
    const { groupName, memberName } = req.body;
    console.log("Adding member:", { groupName, memberName });

    const group = await Group.findOne({ name: groupName });
    if (!group) return res.status(404).json({ message: "Group not found" });

    const existingMember = await Member.findOne({
      name: memberName,
      groupId: group._id,
    });
    if (existingMember)
      return res
        .status(400)
        .json({ message: "Member already exists in group" });

    await Member.create({
      name: memberName,
      groupId: group._id,
      cashIn: 0,
      cashOut: 0,
      finalBalance: 0,
    });

    res.status(201).json({ message: "Member added successfully" });
  } catch (error) {
    console.error("Error adding member:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.cashTransaction = async (req, res) => {
  try {
    const { groupName, memberName, amount, type, description, paidBy, tag } =
      req.body;
    console.log("Cash transaction:", {
      groupName,
      memberName,
      amount,
      type,
      description,
      paidBy,
      tag,
    });

    const group = await Group.findOne({ name: groupName });
    if (!group) return res.status(404).json({ message: "Group not found" });

    const member = await Member.findOne({
      name: memberName,
      groupId: group._id,
    });
    if (!member) return res.status(404).json({ message: "Member not found" });

    const paidByMember = await Member.findOne({
      name: paidBy,
      groupId: group._id,
    });
    if (!paidByMember)
      return res.status(404).json({ message: "Paid By member not found" });

    if (type === "in") {
      member.cashIn += amount;
      member.finalBalance += amount;
    } else if (type === "out") {
      member.cashOut += amount;
      member.finalBalance -= amount;
    }

    const transaction = {
      date: new Date(),
      amount,
      credit: type === "in" ? amount : 0,
      debit: type === "out" ? amount : 0,
      paidBy: paidByMember._id,
      groupId: group._id,
      memberId: member._id,
      tag,
      description,
      finalBalance: member.finalBalance,
    };

    await Transaction.create(transaction);
    await member.save();

    res.status(201).json({ message: "Cash transaction saved successfully" });
  } catch (error) {
    console.error("Error saving cash transaction:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.resetAndPopulateData = async (req, res) => {
  try {
    await Group.deleteMany({});
    await Member.deleteMany({});
    await Transaction.deleteMany({});
    console.log("All existing data deleted.");

    const group1 = await Group.create({
      name: "Family Trip",
      createdBy: "Admin",
    });
    const group2 = await Group.create({
      name: "Office Lunch",
      createdBy: "Admin",
    });
    console.log("Created groups:", group1, group2);

    const group1Members = await Member.insertMany([
      {
        name: "Alice",
        groupId: group1._id,
        cashIn: 0,
        cashOut: 0,
        finalBalance: 0,
      },
      {
        name: "Bob",
        groupId: group1._id,
        cashIn: 0,
        cashOut: 0,
        finalBalance: 0,
      },
      {
        name: "Charlie",
        groupId: group1._id,
        cashIn: 0,
        cashOut: 0,
        finalBalance: 0,
      },
      {
        name: "Dana",
        groupId: group1._id,
        cashIn: 0,
        cashOut: 0,
        finalBalance: 0,
      },
    ]);

    const group2Members = await Member.insertMany([
      {
        name: "Eve",
        groupId: group2._id,
        cashIn: 0,
        cashOut: 0,
        finalBalance: 0,
      },
      {
        name: "Frank",
        groupId: group2._id,
        cashIn: 0,
        cashOut: 0,
        finalBalance: 0,
      },
      {
        name: "Grace",
        groupId: group2._id,
        cashIn: 0,
        cashOut: 0,
        finalBalance: 0,
      },
      {
        name: "Hank",
        groupId: group2._id,
        cashIn: 0,
        cashOut: 0,
        finalBalance: 0,
      },
    ]);
    console.log("Created members for Group 1:", group1Members);
    console.log("Created members for Group 2:", group2Members);

    const splitAmount1 = 800 / 4; // 200 each
    await Member.updateOne(
      { _id: group1Members[0]._id },
      {
        cashIn: 800,
        cashOut: splitAmount1,
        finalBalance: 800 - splitAmount1, // 600
      }
    );
    for (let i = 1; i < 4; i++) {
      await Member.updateOne(
        { _id: group1Members[i]._id },
        {
          cashOut: splitAmount1,
          finalBalance: -splitAmount1, // -200
        }
      );
    }

    await Transaction.insertMany([
      {
        date: new Date(),
        amount: splitAmount1,
        credit: 800,
        debit: splitAmount1,
        paidBy: group1Members[0]._id,
        groupId: group1._id,
        memberId: group1Members[0]._id,
        tag: "travel",
        description: "Flight tickets",
        finalBalance: 600,
      },
      {
        date: new Date(),
        amount: splitAmount1,
        credit: 0,
        debit: splitAmount1,
        paidBy: group1Members[0]._id,
        groupId: group1._id,
        memberId: group1Members[1]._id,
        tag: "travel",
        description: "Flight tickets",
        finalBalance: -200,
      },
      {
        date: new Date(),
        amount: splitAmount1,
        credit: 0,
        debit: splitAmount1,
        paidBy: group1Members[0]._id,
        groupId: group1._id,
        memberId: group1Members[2]._id,
        tag: "travel",
        description: "Flight tickets",
        finalBalance: -200,
      },
      {
        date: new Date(),
        amount: splitAmount1,
        credit: 0,
        debit: splitAmount1,
        paidBy: group1Members[0]._id,
        groupId: group1._id,
        memberId: group1Members[3]._id,
        tag: "travel",
        description: "Flight tickets",
        finalBalance: -200,
      },
    ]);

    const splitAmount2 = 600 / 2; // 300 each
    await Member.updateOne(
      { _id: group2Members[0]._id },
      {
        cashIn: 600,
        cashOut: 0,
        finalBalance: 600,
      }
    );
    await Member.updateOne(
      { _id: group2Members[1]._id },
      {
        cashOut: splitAmount2,
        finalBalance: -splitAmount2, // -300
      }
    );
    await Member.updateOne(
      { _id: group2Members[2]._id },
      {
        cashOut: splitAmount2,
        finalBalance: -splitAmount2, // -300
      }
    );

    await Transaction.insertMany([
      {
        date: new Date(),
        amount: 0,
        credit: 600,
        debit: 0,
        paidBy: group2Members[0]._id,
        groupId: group2._id,
        memberId: group2Members[0]._id,
        tag: "food",
        description: "Lunch bill",
        finalBalance: 600,
      },
      {
        date: new Date(),
        amount: splitAmount2,
        credit: 0,
        debit: splitAmount2,
        paidBy: group2Members[0]._id,
        groupId: group2._id,
        memberId: group2Members[1]._id,
        tag: "food",
        description: "Lunch bill",
        finalBalance: -300,
      },
      {
        date: new Date(),
        amount: splitAmount2,
        credit: 0,
        debit: splitAmount2,
        paidBy: group2Members[0]._id,
        groupId: group2._id,
        memberId: group2Members[2]._id,
        tag: "food",
        description: "Lunch bill",
        finalBalance: -300,
      },
    ]);

    console.log("Dummy transactions added.");
    res.json({
      message: "Database reset and dummy data added successfully!",
    });
  } catch (error) {
    console.error("Error resetting and populating data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete a group
exports.deleteGroup = async (req, res) => {
  try {
    const { groupName } = req.body;
    console.log(`Deleting group: ${groupName}`);

    // Find the group by name (not groupName, as the field in the Group model is 'name')
    const group = await Group.findOne({ name: groupName });
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Delete all members associated with the group
    await Member.deleteMany({ groupId: group._id });

    // Delete all transactions associated with the group
    await Transaction.deleteMany({ groupId: group._id });

    // Delete the group itself
    await Group.deleteOne({ _id: group._id });

    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({ message: "Failed to delete group" });
  }
};

// Reset a group's balances
exports.resetGroup = async (req, res) => {
  try {
    const { groupName } = req.body;
    console.log(`Resetting group: ${groupName}`);

    // Find the group by name
    const group = await Group.findOne({ name: groupName });
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Reset all member balances to 0
    await Member.updateMany(
      { groupId: group._id },
      { cashIn: 0, cashOut: 0, finalBalance: 0 }
    );

    // Optionally, delete all transactions for the group (if you want to reset transactions as well)
    // If you want to keep transactions, comment out the line below
    await Transaction.deleteMany({ groupId: group._id });

    res.status(200).json({ message: "Group balances reset successfully" });
  } catch (error) {
    console.error("Error resetting group:", error);
    res.status(500).json({ message: "Failed to reset group" });
  }
};
