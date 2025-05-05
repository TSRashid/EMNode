const urlParams = new URLSearchParams(window.location.search);
const groupName = urlParams.get("groupName");
const memberName = urlParams.get("memberName");
const transactionTables = document.getElementById("transaction-tables");
const paidByMeFilter = document.getElementById("paid-by-me-filter");
const tagFiltersContainer = document.getElementById("tag-filters");
const applyTagFilterBtn = document.getElementById("apply-tag-filter");
const memberNameHeading = document.getElementById("member-name-heading");

let allTransactions = [];
let availableTags = new Set();

async function fetchTransactions() {
  try {
    const response = await fetch(
      `/home/transactions/${encodeURIComponent(
        memberName
      )}?groupName=${encodeURIComponent(groupName)}`
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch transactions");
    }
    allTransactions = await response.json();
    allTransactions.reverse(); // Latest first

    // If there are no transactions, show an alert and clear the UI
    if (allTransactions.length === 0) {
      alert("There are no transactions for this member.");
      transactionTables.innerHTML = "<p>No transactions available.</p>";
      tagFiltersContainer.innerHTML = ""; // Clear tag filters
      memberNameHeading.textContent = `Transaction Details of ${memberName}`;
      return;
    }

    // Populate tags and render transactions
    allTransactions.forEach((txn) => availableTags.add(txn.tag));
    memberNameHeading.textContent = `Transaction Details of ${memberName}`;
    renderTagFilters();
    renderTransactions();
  } catch (error) {
    console.error("Error fetching transactions:", error);
    transactionTables.innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

function renderTagFilters() {
  tagFiltersContainer.innerHTML = "";
  availableTags.forEach((tag) => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" name="tag-filter" value="${tag}"> ${tag}`;
    tagFiltersContainer.appendChild(label);
  });
}

function createTable(title, transactions, showTotal = false) {
  // If there are no transactions, return null instead of an empty string
  if (transactions.length === 0) return null;

  let total = 0;
  const table = document.createElement("table");
  table.classList.add("transaction-table");

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th colspan="8">${title}</th>
    </tr>
    <tr>
      <th>Date</th>
      <th>Description</th>
      <th>Amount</th>
      <th>Credit</th>
      <th>Debit</th>
      <th>Paid By</th>
      <th>Tag</th>
      <th>Final Balance</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  transactions.forEach((txn) => {
    const tr = document.createElement("tr");
    const finalBalance = txn.finalBalance;
    const balanceText =
      finalBalance >= 0 ? `₹${finalBalance}` : `-₹${Math.abs(finalBalance)}`;
    const balanceColor = finalBalance >= 0 ? "#27ae60" : "#e74c3c";
    tr.innerHTML = `
      <td>${txn.date}</td>
      <td>${txn.description || ""}</td>
      <td>₹${txn.amount}</td>
      <td>₹${txn.credit}</td>
      <td>₹${txn.debit}</td>
      <td>${txn.paidByName}</td>
      <td>${txn.tag || ""}</td>
      <td style="color: ${balanceColor}">${balanceText}</td>
    `;
    tbody.appendChild(tr);
    if (showTotal) total += txn.amount;
  });
  table.appendChild(tbody);

  if (showTotal && transactions.length > 0) {
    const tfoot = document.createElement("tfoot");
    tfoot.innerHTML = `
      <tr>
        <td colspan="8">Total: ₹${total.toFixed(2)}</td>
      </tr>
    `;
    table.appendChild(tfoot);
  }

  const tableWrapper = document.createElement("div");
  tableWrapper.classList.add("table-wrapper");
  tableWrapper.appendChild(table);
  return tableWrapper;
}

function renderTransactions() {
  transactionTables.innerHTML = "";
  const isPaidByMeChecked = paidByMeFilter.checked;
  const selectedTags = Array.from(
    document.querySelectorAll('input[name="tag-filter"]:checked')
  ).map((cb) => cb.value);

  let hasTransactions = false;

  if (isPaidByMeChecked) {
    const paidByMe = allTransactions.filter(
      (txn) => txn.paidByName === memberName
    );
    const others = allTransactions.filter(
      (txn) => txn.paidByName !== memberName
    );

    const paidByMeTable = createTable(`Paid by ${memberName}`, paidByMe, true);
    if (paidByMeTable) {
      transactionTables.appendChild(paidByMeTable);
      hasTransactions = true;
    }

    const othersTable = createTable("Other Transactions", others);
    if (othersTable) {
      transactionTables.appendChild(othersTable);
      hasTransactions = true;
    }
  } else if (selectedTags.length > 0) {
    const tagTables = {};
    selectedTags.forEach((tag) => {
      tagTables[tag] = allTransactions.filter((txn) => txn.tag === tag);
    });
    const otherTransactions = allTransactions.filter(
      (txn) => !selectedTags.includes(txn.tag)
    );

    selectedTags.forEach((tag) => {
      const tagTable = createTable(`Tag: ${tag}`, tagTables[tag], true);
      if (tagTable) {
        transactionTables.appendChild(tagTable);
        hasTransactions = true;
      }
    });

    const othersTable = createTable("Other Transactions", otherTransactions);
    if (othersTable) {
      transactionTables.appendChild(othersTable);
      hasTransactions = true;
    }
  } else {
    const allTable = createTable(
      `All Transactions for ${memberName}`,
      allTransactions
    );
    if (allTable) {
      transactionTables.appendChild(allTable);
      hasTransactions = true;
    }
  }

  // If no transactions were rendered, display a message
  if (!hasTransactions) {
    transactionTables.innerHTML =
      "<p>No transactions match the selected filters.</p>";
  }
}

paidByMeFilter.addEventListener("change", () => {
  document
    .querySelectorAll('input[name="tag-filter"]')
    .forEach((cb) => (cb.checked = false));
  renderTransactions();
});

applyTagFilterBtn.addEventListener("click", () => {
  paidByMeFilter.checked = false;
  renderTransactions();
});

document.addEventListener("DOMContentLoaded", fetchTransactions);
