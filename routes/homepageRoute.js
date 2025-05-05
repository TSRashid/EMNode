const express = require("express");
const router = express.Router();
const groupController = require("./../controllers/groupControllers");

router.route("/").get(groupController.getAllGroups);
router.route("/add-expense").post(groupController.addExpense);
router.route("/reset").get(groupController.resetAndPopulateData);
router
  .route("/transactions/:memberName")
  .get(groupController.getMemberTransactions);
router.route("/create-group").post(groupController.createGroup);
router.route("/add-member").post(groupController.addMemberToGroup);
router.route("/cash-transaction").post(groupController.cashTransaction);
router.post("/subtract-expense", groupController.subtractExpense);
router.post("/delete-group", groupController.deleteGroup);
router.post("/reset-group", groupController.resetGroup);

module.exports = router;
