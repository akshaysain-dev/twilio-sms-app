// public/js/app.js
// Talks to the Express API via fetch(). No frameworks.

const state = {
  groups: [],
  editingId: null, // null => creating new group
  pendingDeleteId: null,
  pendingExecuteId: null,
};

// ---------- DOM refs ----------

const groupsBody = document.getElementById("groupsBody");
const groupCount = document.getElementById("groupCount");
const emptyState = document.getElementById("emptyState");
const banner = document.getElementById("banner");

const groupModalOverlay = document.getElementById("groupModalOverlay");
const groupModalTitle = document.getElementById("groupModalTitle");
const groupForm = document.getElementById("groupForm");
const orderNumberInput = document.getElementById("orderNumberInput");
const phoneList = document.getElementById("phoneList");
const formError = document.getElementById("formError");

const deleteModalOverlay = document.getElementById("deleteModalOverlay");
const deleteMessage = document.getElementById("deleteMessage");

const executeModalOverlay = document.getElementById("executeModalOverlay");
const executeMessage = document.getElementById("executeMessage");

const resultModalOverlay = document.getElementById("resultModalOverlay");
const resultSummary = document.getElementById("resultSummary");
const resultList = document.getElementById("resultList");

// ---------- Init ----------

document.addEventListener("DOMContentLoaded", () => {
  loadGroups();
  bindStaticEvents();
});

function bindStaticEvents() {
  document.getElementById("btnAddGroup").addEventListener("click", () => openGroupModal(null));
  document.getElementById("closeGroupModal").addEventListener("click", closeGroupModal);
  document.getElementById("cancelGroupModal").addEventListener("click", closeGroupModal);
  document.getElementById("addPhoneBtn").addEventListener("click", () => addPhoneRow(""));
  groupForm.addEventListener("submit", handleSaveGroup);

  document.getElementById("closeDeleteModal").addEventListener("click", closeDeleteModal);
  document.getElementById("cancelDeleteModal").addEventListener("click", closeDeleteModal);
  document.getElementById("confirmDeleteBtn").addEventListener("click", handleConfirmDelete);

  document.getElementById("closeExecuteModal").addEventListener("click", closeExecuteModal);
  document.getElementById("cancelExecuteModal").addEventListener("click", closeExecuteModal);
  document.getElementById("confirmExecuteBtn").addEventListener("click", handleConfirmExecute);

  document.getElementById("closeResultModal").addEventListener("click", closeResultModal);
  document.getElementById("closeResultBtn").addEventListener("click", closeResultModal);
}

// ---------- API helpers ----------

async function apiGet(url) {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}

async function apiSend(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}

// ---------- Load & render ----------

async function loadGroups() {
  try {
    state.groups = await apiGet("/api/groups");
    renderTable();
  } catch (err) {
    showBanner(err.message || "Failed to load groups.", "error");
  }
}

function renderTable() {
  groupsBody.innerHTML = "";

  if (state.groups.length === 0) {
    emptyState.classList.remove("hidden");
    groupCount.textContent = "0 groups";
    return;
  }

  emptyState.classList.add("hidden");
  groupCount.textContent = `${state.groups.length} group${state.groups.length === 1 ? "" : "s"}`;

  state.groups.forEach((group) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td class="ticket-id">${escapeHtml(group.id)}</td>
      <td><span class="order-number">${escapeHtml(group.orderNumber)}</span></td>
      <td class="col-center"><span class="count-pill">${group.phoneNumbers.length}</span></td>
      <td class="col-center">${renderStatusCell(group)}</td>
      <td>
        <div class="row-actions">
          <button class="btn-row" data-action="edit" data-id="${group.id}">Edit</button>
          <button class="btn-row danger" data-action="delete" data-id="${group.id}">Delete</button>
          <button class="btn-row signal" data-action="execute" data-id="${group.id}">Execute</button>
        </div>
      </td>
    `;

    groupsBody.appendChild(tr);
  });

  groupsBody.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const action = btn.getAttribute("data-action");
      if (action === "edit") openGroupModal(id);
      if (action === "delete") openDeleteModal(id);
      if (action === "execute") openExecuteModal(id);
    });
  });
}

function renderStatusCell() {
  // No last-run tracking stored on the group itself (spec keeps groups.json
  // limited to orderNumber/phoneNumbers). Show a neutral indicator; the
  // real per-run result is shown in the execution result modal each time.
  return `<span class="status-cell"><span class="status-dot"></span>—</span>`;
}

// ---------- Add / Edit modal ----------

function openGroupModal(id) {
  state.editingId = id;
  formError.classList.add("hidden");
  formError.textContent = "";
  phoneList.innerHTML = "";

  if (id) {
    const group = state.groups.find((g) => g.id === id);
    groupModalTitle.textContent = "Edit Order Group";
    orderNumberInput.value = group.orderNumber;
    group.phoneNumbers.forEach((p) => addPhoneRow(p));
  } else {
    groupModalTitle.textContent = "New Order Group";
    orderNumberInput.value = "";
    addPhoneRow("");
  }

  groupModalOverlay.classList.remove("hidden");
  orderNumberInput.focus();
}

function closeGroupModal() {
  groupModalOverlay.classList.add("hidden");
  state.editingId = null;
}

function addPhoneRow(value) {
  const row = document.createElement("div");
  row.className = "phone-row";
  row.innerHTML = `
    <input type="text" class="phone-input" placeholder="+15516550939" value="${escapeHtml(value || "")}" />
    <button type="button" class="phone-remove">Remove</button>
  `;
  row.querySelector(".phone-remove").addEventListener("click", () => {
    row.remove();
  });
  phoneList.appendChild(row);
}

async function handleSaveGroup(e) {
  e.preventDefault();
  formError.classList.add("hidden");

  const orderNumber = orderNumberInput.value.trim();
  const phoneNumbers = Array.from(phoneList.querySelectorAll(".phone-input"))
    .map((input) => input.value.trim())
    .filter((v) => v.length > 0);

  const clientError = validateClientSide(orderNumber, phoneNumbers);
  if (clientError) {
    formError.textContent = clientError;
    formError.classList.remove("hidden");
    return;
  }

  const payload = { orderNumber, phoneNumbers };

  try {
    if (state.editingId) {
      await apiSend(`/api/groups/${state.editingId}`, "PUT", payload);
      showBanner(`Order group ${orderNumber} updated.`, "success");
    } else {
      await apiSend("/api/groups", "POST", payload);
      showBanner(`Order group ${orderNumber} created.`, "success");
    }
    closeGroupModal();
    await loadGroups();
  } catch (err) {
    formError.textContent = err.message || "Failed to save group.";
    formError.classList.remove("hidden");
  }
}

function validateClientSide(orderNumber, phoneNumbers) {
  if (!orderNumber) return "Order number is required.";
  if (phoneNumbers.length === 0) return "At least one phone number is required.";

  const phoneRegex = /^\+[1-9]\d{7,14}$/;
  for (const p of phoneNumbers) {
    if (!phoneRegex.test(p)) {
      return `Invalid phone number: "${p}". Use E.164 format, e.g. +15516550939`;
    }
  }
  return null;
}

// ---------- Delete modal ----------

function openDeleteModal(id) {
  const group = state.groups.find((g) => g.id === id);
  state.pendingDeleteId = id;
  deleteMessage.textContent = `Are you sure you want to delete order group ${group.orderNumber}? This cannot be undone.`;
  deleteModalOverlay.classList.remove("hidden");
}

function closeDeleteModal() {
  deleteModalOverlay.classList.add("hidden");
  state.pendingDeleteId = null;
}

async function handleConfirmDelete() {
  if (!state.pendingDeleteId) return;
  try {
    await apiSend(`/api/groups/${state.pendingDeleteId}`, "DELETE");
    showBanner("Order group deleted.", "success");
    closeDeleteModal();
    await loadGroups();
  } catch (err) {
    closeDeleteModal();
    showBanner(err.message || "Failed to delete group.", "error");
  }
}

// ---------- Execute modal ----------

function openExecuteModal(id) {
  const group = state.groups.find((g) => g.id === id);
  state.pendingExecuteId = id;
  executeMessage.textContent = `Send SMS for ${group.orderNumber} to ${group.phoneNumbers.length} number${group.phoneNumbers.length === 1 ? "" : "s"}?`;
  executeModalOverlay.classList.remove("hidden");
}

function closeExecuteModal() {
  executeModalOverlay.classList.add("hidden");
  state.pendingExecuteId = null;
}

async function handleConfirmExecute() {
  if (!state.pendingExecuteId) return;
  const id = state.pendingExecuteId;
  const confirmBtn = document.getElementById("confirmExecuteBtn");

  confirmBtn.disabled = true;
  confirmBtn.textContent = "Sending…";

  try {
    const result = await apiSend(`/api/groups/${id}/execute`, "POST");
    closeExecuteModal();
    showExecutionResult(result);
  } catch (err) {
    closeExecuteModal();
    showBanner(err.message || "Failed to execute group.", "error");
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Send SMS";
  }
}

// ---------- Execution result modal ----------

function showExecutionResult(result) {
  resultSummary.innerHTML = `
    <div class="stat">
      <span class="num">${result.total}</span>
      <span class="label">Total</span>
    </div>
    <div class="stat ok">
      <span class="num">${result.successful}</span>
      <span class="label">Successful</span>
    </div>
    <div class="stat fail">
      <span class="num">${result.failed}</span>
      <span class="label">Failed</span>
    </div>
    <div class="stat">
      <span class="num" style="font-size:14px;">${escapeHtml(result.orderNumber)}</span>
      <span class="label">Order</span>
    </div>
  `;

  resultList.innerHTML = "";
  result.results.forEach((r) => {
    const row = document.createElement("div");
    row.className = `result-row ${r.success ? "ok" : "fail"}`;
    const statusText = r.success
      ? `✓ Success (${escapeHtml(r.response && r.response.status || "queued")})`
      : `✗ ${escapeHtml(r.error || "Failed")}`;
    row.innerHTML = `
      <span>${escapeHtml(r.phoneNumber)}</span>
      <span class="rr-status">${statusText}</span>
    `;
    resultList.appendChild(row);
  });

  resultModalOverlay.classList.remove("hidden");
}

function closeResultModal() {
  resultModalOverlay.classList.add("hidden");
}

// ---------- Utilities ----------

function showBanner(message, type) {
  banner.textContent = message;
  banner.className = `banner ${type}`;
  banner.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
  setTimeout(() => banner.classList.add("hidden"), 4000);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
