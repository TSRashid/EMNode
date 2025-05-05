const sidebar = document.querySelector(".sidebar");
const mainContent = document.querySelector(".main-content");
const groupCardsContainer = document.getElementById("group-cards");
const addGroupBtn = document.getElementById("add-group-btn");
const expenseDialog = document.getElementById("add-expense-dialog");
const expenseForm = document.getElementById("expense-form");
const paidBySelect = document.getElementById("paid-by");
const divideEquallyBtn = document.getElementById("divide-equally");
const divideUnequallyBtn = document.getElementById("divide-unequally");
const unequalMembers = document.getElementById("unequal-members");
const groupDialog = document.getElementById("add-group-dialog");
const groupForm = document.getElementById("group-form");
const memberDialog = document.getElementById("add-member-dialog");
const memberForm = document.getElementById("member-form");
const cashDialog = document.getElementById("cash-dialog");
const cashForm = document.getElementById("cash-form");
const deleteGroupDialog = document.getElementById("delete-group-dialog");
const deleteGroupName = document.getElementById("delete-group-name");
const cancelDeleteGroupBtn = document.getElementById("cancel-delete-group");
const confirmDeleteGroupBtn = document.getElementById("confirm-delete-group");
const resetGroupDialog = document.getElementById("reset-group-dialog");
const resetGroupName = document.getElementById("reset-group-name");
const cancelResetGroupBtn = document.getElementById("cancel-reset-group");
const confirmResetGroupBtn = document.getElementById("confirm-reset-group");

let isSidebarActive = false;
let currentGroup = null;
let divideMode = "equally";

function toggleSidebar() {
  isSidebarActive = !isSidebarActive;
  sidebar.classList.toggle("active", isSidebarActive);
  mainContent.classList.toggle("sidebar-active", isSidebarActive);
}

document.querySelector(".header").addEventListener("click", toggleSidebar);

async function fetchGroups() {
  try {
    const response = await fetch("http://localhost/home");
    if (!response.ok) throw new Error("Failed to fetch groups");
    const groups = await response.json();
    renderGroups(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    groupCardsContainer.innerHTML = "<p>Error loading groups.</p>";
  }
}

function renderGroups(groups) {
  groupCardsContainer.innerHTML = "";
  groups.forEach((group, index) => {
    const card = document.createElement("div");
    card.classList.add("card");

    const cardHeader = document.createElement("div");
    cardHeader.classList.add("card-header");

    const groupName = document.createElement("span");
    groupName.classList.add("group-name");
    groupName.textContent = group.groupName;

    const cardButtons = document.createElement("div");
    cardButtons.classList.add("card-buttons");

    const plusBtn = document.createElement("i");
    plusBtn.classList.add("fas", "fa-plus", "icon-btn");
    plusBtn.title = "Add Expense";

    const minusBtn = document.createElement("i");
    minusBtn.classList.add("fas", "fa-minus", "icon-btn");
    minusBtn.title = "Subtract Expense";

    const addMemberBtn = document.createElement("button");
    addMemberBtn.classList.add("btn", "btn-add-member");
    addMemberBtn.textContent = "Add Member";

    const optionsMenu = document.createElement("div");
    optionsMenu.classList.add("options-menu");

    const optionsIcon = document.createElement("i");
    optionsIcon.classList.add(
      "fas",
      "fa-ellipsis-v",
      "icon-btn",
      "btn-options"
    );
    optionsIcon.setAttribute("data-group", group.groupName);
    optionsIcon.title = "Options";

    const dropdownMenu = document.createElement("div");
    dropdownMenu.classList.add("dropdown-menu");
    dropdownMenu.setAttribute("data-group", group.groupName);

    const deleteGroupBtn = document.createElement("button");
    deleteGroupBtn.classList.add("dropdown-item", "btn-delete-group");
    deleteGroupBtn.setAttribute("data-group", group.groupName);
    deleteGroupBtn.textContent = "Delete Group";

    const resetGroupBtn = document.createElement("button");
    resetGroupBtn.classList.add("dropdown-item", "btn-reset-group");
    resetGroupBtn.setAttribute("data-group", group.groupName);
    resetGroupBtn.textContent = "Reset Group";

    const exportDataBtn = document.createElement("button");
    exportDataBtn.classList.add("dropdown-item", "btn-export-data");
    exportDataBtn.setAttribute("data-group", group.groupName);
    exportDataBtn.textContent = "Export Data";

    dropdownMenu.appendChild(deleteGroupBtn);
    dropdownMenu.appendChild(resetGroupBtn);
    dropdownMenu.appendChild(exportDataBtn);
    optionsMenu.appendChild(optionsIcon);
    optionsMenu.appendChild(dropdownMenu);

    cardButtons.appendChild(plusBtn);
    cardButtons.appendChild(minusBtn);
    cardButtons.appendChild(addMemberBtn);
    cardButtons.appendChild(optionsMenu);
    cardHeader.appendChild(groupName);
    cardHeader.appendChild(cardButtons);

    const cardBody = document.createElement("div");
    cardBody.classList.add("card-body");

    group.members.forEach((member) => {
      const memberDiv = document.createElement("div");
      memberDiv.classList.add("member");

      const memberName = document.createElement("span");
      memberName.classList.add("member-name");
      memberName.textContent = member.name;

      const balance = document.createElement("span");
      balance.classList.add("balance");
      const balanceValue = Math.round(member.finalBalance);
      balance.textContent =
        balanceValue >= 0
          ? `Rs ${balanceValue}`
          : `Rs ${Math.abs(balanceValue)}`;
      balance.style.color = balanceValue >= 0 ? "#27ae60" : "#e74c3c";

      const cashInBtn = document.createElement("button");
      cashInBtn.textContent = "Cash In";
      cashInBtn.classList.add("btn", "btn-cash-in");
      cashInBtn.addEventListener("click", () =>
        showCashDialog(group.groupName, member.name, "in", group.members)
      );

      const cashOutBtn = document.createElement("button");
      cashOutBtn.textContent = "Cash Out";
      cashOutBtn.classList.add("btn", "btn-cash-out");
      cashOutBtn.addEventListener("click", () =>
        showCashDialog(group.groupName, member.name, "out", group.members)
      );

      const viewTransactionsBtn = document.createElement("button");
      viewTransactionsBtn.textContent = "View All";
      viewTransactionsBtn.classList.add("btn", "btn-view");
      viewTransactionsBtn.addEventListener("click", () => {
        window.location.href = `/transactions.html?groupName=${encodeURIComponent(
          group.groupName
        )}&memberName=${encodeURIComponent(member.name)}`;
      });

      memberDiv.appendChild(memberName);
      memberDiv.appendChild(balance);
      memberDiv.appendChild(cashInBtn);
      memberDiv.appendChild(cashOutBtn);
      memberDiv.appendChild(viewTransactionsBtn);
      cardBody.appendChild(memberDiv);
    });

    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    groupCardsContainer.appendChild(card);

    plusBtn.addEventListener("click", () => {
      currentGroup = { name: group.groupName, members: group.members, index };
      showAddExpenseDialog("add");
    });

    minusBtn.addEventListener("click", () => {
      currentGroup = { name: group.groupName, members: group.members, index };
      showAddExpenseDialog("subtract");
    });

    addMemberBtn.addEventListener("click", () => {
      currentGroup = { name: group.groupName, members: group.members, index };
      showAddMemberDialog();
    });
  });

  document.querySelectorAll(".btn-options").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const dropdown = btn.nextElementSibling;
      document.querySelectorAll(".dropdown-menu").forEach((menu) => {
        if (menu !== dropdown) menu.style.display = "none";
      });
      dropdown.style.display =
        dropdown.style.display === "block" ? "none" : "block";
    });
  });

  document.querySelectorAll(".btn-delete-group").forEach((btn) => {
    btn.addEventListener("click", () => {
      const groupName = btn.dataset.group;
      deleteGroupName.textContent = groupName;
      deleteGroupDialog.showModal();
      btn.closest(".dropdown-menu").style.display = "none";
    });
  });

  document.querySelectorAll(".btn-reset-group").forEach((btn) => {
    btn.addEventListener("click", () => {
      const groupName = btn.dataset.group;
      resetGroupName.textContent = groupName;
      resetGroupDialog.showModal();
      btn.closest(".dropdown-menu").style.display = "none";
    });
  });

  document.querySelectorAll(".btn-export-data").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const groupName = btn.dataset.group;
      try {
        // First fetch the group data to get current member balances
        const response = await fetch("http://localhost/home");
        if (!response.ok) {
          throw new Error("Failed to fetch groups");
        }
        const groups = await response.json();
        const group = groups.find((g) => g.groupName === groupName);
        if (!group) {
          throw new Error("Group not found");
        }

        // Get transactions for each member
        for (const member of group.members) {
          // Fetch transactions for this member
          const response = await fetch(
            `http://localhost/home/transactions/${encodeURIComponent(
              member.name
            )}?groupName=${encodeURIComponent(groupName)}`
          );
          if (!response.ok) {
            throw new Error(`Failed to fetch transactions for ${member.name}`);
          }
          const transactions = await response.json();

          // Create table HTML
          let tableHTML = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px;">
              <thead>
                <tr style="background-color: #3498db; color: white;">
                  <th style="padding: 8px; text-align: left; border: 1px solid #ddd; width: 15%;">Date</th>
                  <th style="padding: 8px; text-align: left; border: 1px solid #ddd; width: 20%;">Description</th>
                  <th style="padding: 8px; text-align: left; border: 1px solid #ddd; width: 10%;">Amount</th>
                  <th style="padding: 8px; text-align: left; border: 1px solid #ddd; width: 10%;">Credit</th>
                  <th style="padding: 8px; text-align: left; border: 1px solid #ddd; width: 10%;">Debit</th>
                  <th style="padding: 8px; text-align: left; border: 1px solid #ddd; width: 15%;">Paid By</th>
                  <th style="padding: 8px; text-align: left; border: 1px solid #ddd; width: 10%;">Tag</th>
                  <th style="padding: 8px; text-align: left; border: 1px solid #ddd; width: 10%;">Final Balance</th>
                </tr>
              </thead>
              <tbody>
          `;

          transactions.forEach((transaction) => {
            const date = new Date(transaction.date).toLocaleString();
            const balanceColor =
              transaction.finalBalance >= 0 ? "#27ae60" : "#e74c3c";
            tableHTML += `
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-size: 9px;">${date}</td>
                <td style="padding: 8px; border: 1px solid #ddd; font-size: 9px;">${
                  transaction.description || ""
                }</td>
                <td style="padding: 8px; border: 1px solid #ddd; font-size: 9px;">Rs ${Math.abs(
                  transaction.amount
                )}</td>
                <td style="padding: 8px; border: 1px solid #ddd; font-size: 9px;">Rs ${
                  transaction.credit
                }</td>
                <td style="padding: 8px; border: 1px solid #ddd; font-size: 9px;">Rs ${
                  transaction.debit
                }</td>
                <td style="padding: 8px; border: 1px solid #ddd; font-size: 9px;">${
                  transaction.paidByName
                }</td>
                <td style="padding: 8px; border: 1px solid #ddd; font-size: 9px;">${
                  transaction.tag || ""
                }</td>
                <td style="padding: 8px; border: 1px solid #ddd; font-size: 9px; color: ${balanceColor}">Rs ${Math.abs(
              transaction.finalBalance
            )}</td>
              </tr>
            `;
          });

          tableHTML += `
              </tbody>
            </table>
          `;

          // Create the full HTML document
          const htmlContent = `
            <html>
              <head>
                <style>
                  body { 
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    padding: 0;
                  }
                  h1 { 
                    color: #2c3e50;
                    font-size: 16px;
                    margin-bottom: 10px;
                  }
                  .header { 
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #3498db;
                  }
                  .balance { 
                    font-size: 14px; 
                    font-weight: bold; 
                    color: ${member.finalBalance >= 0 ? "#27ae60" : "#e74c3c"};
                  }
                  table {
                    page-break-inside: auto;
                  }
                  tr {
                    page-break-inside: avoid;
                    page-break-after: auto;
                  }
                  thead {
                    display: table-header-group;
                  }
                  tfoot {
                    display: table-footer-group;
                  }
                </style>
              </head>
              <body>
                <div class="header">
                  <h1>${groupName} - ${member.name}</h1>
                  <p>Current Balance: <span class="balance">Rs ${Math.abs(
                    member.finalBalance
                  )}</span></p>
                </div>
                ${tableHTML}
              </body>
            </html>
          `;

          // Convert HTML to PDF using html2pdf.js
          const element = document.createElement("div");
          element.innerHTML = htmlContent;
          document.body.appendChild(element);

          const opt = {
            margin: [0.5, 0.5, 0.5, 0.5],
            filename: `${groupName}_${member.name}_transactions.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: {
              scale: 2,
              useCORS: true,
              letterRendering: true,
            },
            jsPDF: {
              unit: "in",
              format: "a4",
              orientation: "landscape",
            },
          };

          await html2pdf().set(opt).from(element).save();
          document.body.removeChild(element);
        }

        btn.closest(".dropdown-menu").style.display = "none";
      } catch (error) {
        console.error("Error exporting data:", error);
        alert("Failed to export data: " + error.message);
      }
    });
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".options-menu")) {
      document.querySelectorAll(".dropdown-menu").forEach((menu) => {
        menu.style.display = "none";
      });
    }
  });
}

function showAddExpenseDialog(mode) {
  const dialogTitle = document.getElementById("expense-dialog-title");
  const paidByLabel = document.getElementById("paid-by-label");
  const submitButton = expenseForm.querySelector('button[type="submit"]');

  document.getElementById("expense-mode").value = mode;
  document.getElementById("expense-amount").value = "";
  document.getElementById("expense-tag").value = "";
  document.getElementById("expense-description").value = "";
  unequalMembers.innerHTML = "<h4>Select Members to Split:</h4>";
  divideMode = "equally";
  unequalMembers.style.display = "none";

  let calculateAmountBtn = document.getElementById("calculate-amount");
  if (!calculateAmountBtn) {
    calculateAmountBtn = document.createElement("button");
    calculateAmountBtn.id = "calculate-amount";
    calculateAmountBtn.textContent = "Calculate Amount";
    calculateAmountBtn.type = "button";
    calculateAmountBtn.classList.add("btn");
    divideUnequallyBtn.insertAdjacentElement("afterend", calculateAmountBtn);
  }
  calculateAmountBtn.disabled = true;

  if (mode === "add") {
    dialogTitle.textContent = "Add Expense";
    paidByLabel.style.display = "block";
    paidBySelect.innerHTML = '<option value="">Select Member</option>';
    submitButton.textContent = "Add Expense";
    currentGroup.members.forEach((member, i) => {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = member.name;
      paidBySelect.appendChild(option);
    });
  } else {
    dialogTitle.textContent = "Subtract Expense";
    paidByLabel.style.display = "none";
    paidBySelect.innerHTML = "";
    submitButton.textContent = "Subtract Expense";
  }

  currentGroup.members.forEach((member, i) => {
    const checkLabel = document.createElement("label");
    checkLabel.classList.add("unequal-member-label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "unequal-members";
    checkbox.value = i;
    const amountInput = document.createElement("input");
    amountInput.type = "number";
    amountInput.name = `amount-${i}`;
    amountInput.placeholder = "Custom Amount";
    amountInput.style.marginLeft = "0.5rem";
    amountInput.style.width = "100px";
    amountInput.style.display = "none";
    amountInput.step = "1";
    amountInput.min = "0";
    checkLabel.appendChild(checkbox);
    checkLabel.appendChild(document.createTextNode(` ${member.name}`));
    checkLabel.appendChild(amountInput);
    unequalMembers.appendChild(checkLabel);
  });

  expenseDialog.showModal();
}

function showAddMemberDialog() {
  document.getElementById("member-group-name").value = currentGroup.name;
  memberDialog.showModal();
}

function showCashDialog(groupName, memberName, type, members) {
  document.getElementById("cash-dialog-title").textContent = `Cash ${
    type === "in" ? "In" : "Out"
  }`;
  document.getElementById("cash-group-name").value = groupName;
  document.getElementById("cash-member-name").value = memberName;
  document.getElementById("cash-type").value = type;
  document.getElementById("cash-amount").value = "";
  document.getElementById("cash-description").value = "";

  const cashPaidBySelect = document.getElementById("cash-paid-by");
  cashPaidBySelect.style.display = "none";
  cashPaidBySelect.value = memberName;
  cashPaidBySelect.innerHTML = `<option value="${memberName}">${memberName}</option>`;

  cashDialog.showModal();
}

divideEquallyBtn.addEventListener("click", () => {
  divideMode = "equally";
  unequalMembers.style.display = "none";
  document
    .querySelectorAll('.unequal-member-label input[type="number"]')
    .forEach((input) => {
      input.style.display = "none";
    });
  document.getElementById("calculate-amount").disabled = true;
});

divideUnequallyBtn.addEventListener("click", () => {
  divideMode = "unequally";
  unequalMembers.style.display = "block";
  document
    .querySelectorAll('.unequal-member-label input[type="number"]')
    .forEach((input) => {
      input.style.display = "inline";
    });
  document.getElementById("calculate-amount").disabled = false;
});

document.addEventListener("click", (e) => {
  if (e.target.id === "calculate-amount") {
    if (divideMode !== "unequally") {
      alert("Please select 'Divide Unequally' to calculate custom amounts.");
      return;
    }

    const checkboxes = document.querySelectorAll(
      'input[name="unequal-members"]:checked'
    );
    if (checkboxes.length === 0) {
      alert("Please select at least one member to calculate the amount.");
      return;
    }

    let totalAmount = 0;
    checkboxes.forEach((cb) => {
      const index = cb.value;
      const amountInput = document.querySelector(
        `input[name="amount-${index}"]`
      );
      const customAmount = Math.round(parseFloat(amountInput.value) || 0);
      totalAmount += customAmount;
    });

    if (totalAmount === 0) {
      alert("Please enter at least one non-zero custom amount.");
      return;
    }

    document.getElementById("expense-amount").value = totalAmount;
  }
});

document.getElementById("cancel-dialog").addEventListener("click", () => {
  expenseDialog.close();
});

expenseForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const mode = document.getElementById("expense-mode").value;
  const amount = Math.round(
    parseFloat(document.getElementById("expense-amount").value)
  );
  const tag = document.getElementById("expense-tag").value;
  const description = document.getElementById("expense-description").value;

  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid positive amount");
    return;
  }

  let paidByIndex, paidBy;
  if (mode === "add") {
    paidByIndex = parseInt(paidBySelect.value);
    if (isNaN(paidByIndex)) {
      alert("Please select a member who paid");
      return;
    }
    paidBy = currentGroup.members[paidByIndex];
  }

  let splitMembers = [];
  let customAmounts = {};

  if (divideMode === "equally") {
    splitMembers = currentGroup.members;
    // Calculate equal split amount and ensure integers
    const memberCount = splitMembers.length;
    const baseAmount = Math.floor(amount / memberCount); // Base integer amount per member
    let totalAssigned = baseAmount * memberCount; // Total amount assigned so far
    let remaining = amount - totalAssigned; // Remaining amount to distribute

    customAmounts = {};
    splitMembers.forEach((member, index) => {
      let memberAmount = baseAmount;
      // Distribute the remaining amount one unit at a time to members until exhausted
      if (remaining > 0 && index < remaining) {
        memberAmount += 1; // Add 1 to this member's share
      }
      customAmounts[member.name] = memberAmount;
    });
  } else {
    const checkboxes = document.querySelectorAll(
      'input[name="unequal-members"]:checked'
    );
    if (checkboxes.length === 0) {
      alert("Please select at least one member to split the expense");
      return;
    }
    splitMembers = Array.from(checkboxes).map((cb) => {
      const index = parseInt(cb.value);
      const customAmount =
        Math.round(
          parseFloat(
            document.querySelector(`input[name="amount-${index}"]`).value
          )
        ) || 0; // Round to integer, default to 0 if NaN
      customAmounts[currentGroup.members[index].name] = customAmount;
      return currentGroup.members[index];
    });

    // Verify that the sum of custom amounts equals the total amount
    const totalCustomAmount = Object.values(customAmounts).reduce(
      (sum, val) => sum + val,
      0
    );
    if (totalCustomAmount !== amount) {
      alert(
        `The sum of custom amounts (${totalCustomAmount}) does not match the total amount (${amount}). Please adjust the amounts.`
      );
      return;
    }
  }

  const expenseData = {
    groupName: currentGroup.name,
    amount,
    paidBy: mode === "add" ? paidBy.name : splitMembers.map((m) => m.name),
    splitAmong: splitMembers.map((m) => m.name),
    divideMode,
    customAmounts,
    tag,
    description,
  };

  console.log(`Sending ${mode} expense data:`, expenseData);

  try {
    const endpoint =
      mode === "add" ? "/home/add-expense" : "/home/subtract-expense";
    const response = await fetch(`http://localhost${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expenseData),
    });
    if (!response.ok) throw new Error(`Failed to ${mode} expense`);
    expenseDialog.close();
    fetchGroups();
  } catch (error) {
    console.error(`Error ${mode}ing expense:`, error);
    alert(`Failed to ${mode} expense`);
  }
});

addGroupBtn.addEventListener("click", () => {
  groupDialog.showModal();
});

groupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const groupName = document.getElementById("group-name").value;
  const membersInput = document.getElementById("group-members").value;
  const members = membersInput
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name);

  const groupData = { groupName, members };
  console.log("Sending group data:", groupData);

  try {
    const response = await fetch("http://localhost/home/create-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(groupData),
    });
    if (!response.ok) throw new Error("Failed to create group");
    groupDialog.close();
    fetchGroups();
  } catch (error) {
    console.error("Error creating group:", error);
    alert("Failed to create group");
  }
});

document.getElementById("cancel-group-dialog").addEventListener("click", () => {
  groupDialog.close();
});

memberForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const memberName = document.getElementById("member-name").value;
  const groupName = document.getElementById("member-group-name").value;

  const memberData = { groupName, memberName };
  console.log("Sending member data:", memberData);

  try {
    const response = await fetch("http://localhost/home/add-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(memberData),
    });
    if (!response.ok) throw new Error("Failed to add member");
    memberDialog.close();
    fetchGroups();
  } catch (error) {
    console.error("Error adding member:", error);
    alert("Failed to add member");
  }
});

document
  .getElementById("cancel-member-dialog")
  .addEventListener("click", () => {
    memberDialog.close();
  });

cashForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const groupName = document.getElementById("cash-group-name").value;
  const memberName = document.getElementById("cash-member-name").value;
  const type = document.getElementById("cash-type").value;
  const amount = Math.round(
    parseFloat(document.getElementById("cash-amount").value)
  );
  const description = document.getElementById("cash-description").value;
  const paidBy = document.getElementById("cash-paid-by").value;
  const tag = type === "in" ? "cash in" : "cash out";

  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid positive amount");
    return;
  }

  const cashData = {
    groupName,
    memberName,
    amount,
    type,
    description,
    paidBy,
    tag,
  };

  console.log("Sending cash data:", cashData);

  try {
    const response = await fetch("http://localhost/home/cash-transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cashData),
    });
    if (!response.ok) throw new Error("Failed to save cash transaction");
    cashDialog.close();
    fetchGroups();
  } catch (error) {
    console.error("Error saving cash transaction:", error);
    alert("Failed to save cash transaction");
  }
});

document.getElementById("cancel-cash-dialog").addEventListener("click", () => {
  cashDialog.close();
});

cancelDeleteGroupBtn.addEventListener("click", () => {
  deleteGroupDialog.close();
});

confirmDeleteGroupBtn.addEventListener("click", async () => {
  const groupName = deleteGroupName.textContent;
  try {
    const response = await fetch("http://localhost/home/delete-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupName }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete group");
    }
    deleteGroupDialog.close();
    fetchGroups();
  } catch (error) {
    console.error("Error deleting group:", error);
    alert(error.message || "Failed to delete group");
  }
});

cancelResetGroupBtn.addEventListener("click", () => {
  resetGroupDialog.close();
});

confirmResetGroupBtn.addEventListener("click", async () => {
  const groupName = resetGroupName.textContent;
  try {
    const response = await fetch("http://localhost/home/reset-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupName }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to reset group");
    }
    resetGroupDialog.close();
    fetchGroups();
  } catch (error) {
    console.error("Error resetting group:", error);
    alert(error.message || "Failed to reset group");
  }
});

document.addEventListener("DOMContentLoaded", fetchGroups);
