"use strict";

const STORAGE_KEY = "sentinel-demo-transactions-v1";
const DAY = 24 * 60 * 60 * 1000;
const now = new Date();

function hoursAgo(hours) {
  return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
}

const seedTransactions = [
  { id: "TXN-849201", merchant: "Luxe Boutique", category: "Retail", holder: "Olivia Chen", card: "•••• 4821", amount: 2840, currency: "USD", location: "London, UK", time: hoursAgo(0.3), status: "review", signals: ["Unusually high amount", "Card used in a new country"] },
  { id: "TXN-849200", merchant: "Starbucks Coffee", category: "Food & drink", holder: "Marcus Williams", card: "•••• 1093", amount: 8.75, currency: "USD", location: "New York, US", time: hoursAgo(0.7), status: "approved", signals: ["Known merchant", "Typical spending amount"] },
  { id: "TXN-849199", merchant: "QuickShip Digital", category: "Digital goods", holder: "Ava Patel", card: "•••• 7604", amount: 642.90, currency: "USD", location: "Bucharest, RO", time: hoursAgo(1.4), status: "blocked", signals: ["Unfamiliar merchant category", "Multiple rapid purchases"] },
  { id: "TXN-849198", merchant: "Delta Air Lines", category: "Travel", holder: "Noah Thompson", card: "•••• 3347", amount: 468.20, currency: "USD", location: "Atlanta, US", time: hoursAgo(2.2), status: "approved", signals: ["Amount is typical for travel"] },
  { id: "TXN-849197", merchant: "Fashion Nova", category: "Retail", holder: "Isabella Garcia", card: "•••• 2290", amount: 1298.00, currency: "USD", location: "Lagos, NG", time: hoursAgo(3.1), status: "review", signals: ["Unusually high amount", "Card used in a new country"] },
  { id: "TXN-849196", merchant: "Whole Foods Market", category: "Food & drink", holder: "Ethan Brooks", card: "•••• 5518", amount: 76.34, currency: "USD", location: "Seattle, US", time: hoursAgo(4.8), status: "approved", signals: ["Known merchant", "Typical spending amount"] },
  { id: "TXN-849195", merchant: "CryptoX Exchange", category: "Digital goods", holder: "Sophia Miller", card: "•••• 8076", amount: 4999.00, currency: "USD", location: "Singapore, SG", time: hoursAgo(6.3), status: "blocked", signals: ["Unusually high amount", "High-risk merchant category", "Card used in a new country"] },
  { id: "TXN-849194", merchant: "Uber", category: "Travel", holder: "Liam Wilson", card: "•••• 1932", amount: 24.80, currency: "USD", location: "Chicago, US", time: hoursAgo(8.2), status: "approved", signals: ["Known merchant", "Typical spending amount"] },
  { id: "TXN-849193", merchant: "Tech Haven", category: "Retail", holder: "Mia Johnson", card: "•••• 6781", amount: 875.60, currency: "USD", location: "Prague, CZ", time: hoursAgo(11), status: "review", signals: ["Card used in a new country", "Unusually high amount"] },
  { id: "TXN-849192", merchant: "Fresh Market", category: "Food & drink", holder: "Lucas Martin", card: "•••• 9021", amount: 43.17, currency: "USD", location: "Austin, US", time: hoursAgo(15), status: "approved", signals: ["Known merchant", "Typical spending amount"] },
  { id: "TXN-849191", merchant: "StreamFlix", category: "Digital goods", holder: "Amelia Davis", card: "•••• 4110", amount: 15.99, currency: "USD", location: "Los Angeles, US", time: hoursAgo(19), status: "approved", signals: ["Recurring subscription", "Typical spending amount"] },
  { id: "TXN-849190", merchant: "Gadget World", category: "Retail", holder: "James Anderson", card: "•••• 5628", amount: 1599.99, currency: "USD", location: "Hong Kong, HK", time: hoursAgo(23), status: "review", signals: ["Unusually high amount", "Card used in a new country"] }
];

const $ = (selector) => document.querySelector(selector);
const rowsElement = $("#transaction-rows");
let transactions = loadTransactions();
let selectedTransactionId = null;
let toastTimer;

function loadTransactions() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return seedTransactions.map((item) => ({ ...item }));
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.some((item) => !isValidTransaction(item))) {
      throw new Error("Saved transaction data has an invalid format.");
    }
    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof TypeError) {
      console.error("Could not read saved demo data:", error);
      showToast("Saved data could not be read. Starting with sample transactions.");
      return seedTransactions.map((item) => ({ ...item }));
    }
    if (error instanceof Error && error.message.includes("invalid format")) {
      console.error(error);
      showToast("Saved data was invalid. Starting with sample transactions.");
      return seedTransactions.map((item) => ({ ...item }));
    }
    console.error("Could not access local browser storage:", error);
    return seedTransactions.map((item) => ({ ...item }));
  }
}

function isValidTransaction(item) {
  return item && typeof item.id === "string" && typeof item.merchant === "string" &&
    typeof item.holder === "string" && Number.isFinite(Number(item.amount)) &&
    ["review", "approved", "blocked"].includes(item.status);
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error("Could not save demo transactions:", error);
    showToast("Could not save changes in this browser.");
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function riskScore(transaction) {
  let score = 8;
  if (Number(transaction.amount) >= 1000) score += 38;
  else if (Number(transaction.amount) >= 500) score += 24;
  else if (Number(transaction.amount) >= 250) score += 12;
  if (transaction.category === "Digital goods") score += 16;
  if (transaction.location && !/,\s*(US|USA)$/i.test(transaction.location)) score += 24;
  const signals = Array.isArray(transaction.signals) ? transaction.signals : [];
  score += Math.max(0, signals.length - 1) * 5;
  return Math.min(99, score);
}

function riskLevel(transaction) {
  const score = riskScore(transaction);
  return score >= 65 ? "high" : score >= 35 ? "medium" : "low";
}

function formatMoney(amount, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(amount));
  } catch {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
}

function formatRelativeTime(value) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  if (!Number.isFinite(elapsed)) return "Unknown time";
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  return `${Math.floor(hours / 24)} day${hours < 48 ? "" : "s"} ago`;
}

function merchantClass(category) {
  if (category === "Food & drink") return "food";
  if (category === "Travel") return "travel";
  if (category === "Retail") return "retail";
  return "";
}

function renderTransactions() {
  const query = $("#search-input").value.trim().toLowerCase();
  const riskFilter = $("#risk-filter").value;
  const statusFilter = $("#status-filter").value;
  const filtered = transactions.filter((transaction) => {
    const searchable = [transaction.id, transaction.merchant, transaction.holder, transaction.card, transaction.location].join(" ").toLowerCase();
    return (!query || searchable.includes(query)) &&
      (riskFilter === "all" || riskLevel(transaction) === riskFilter) &&
      (statusFilter === "all" || transaction.status === statusFilter);
  });
  rowsElement.innerHTML = filtered.map((transaction) => {
    const level = riskLevel(transaction);
    const initials = transaction.merchant.trim().slice(0, 1).toUpperCase() || "?";
    const safeId = escapeHtml(transaction.id);
    return `<tr>
      <td><div class="transaction-cell"><span class="merchant-icon ${merchantClass(transaction.category)}">${escapeHtml(initials)}</span><span class="transaction-copy"><strong>${escapeHtml(transaction.merchant)}</strong><small>${safeId} · ${escapeHtml(formatRelativeTime(transaction.time))}</small></span></div></td>
      <td><span class="cardholder"><strong>${escapeHtml(transaction.holder)}</strong><small>${escapeHtml(transaction.card || "Card not provided")}</small></span></td>
      <td class="amount">${escapeHtml(formatMoney(transaction.amount, transaction.currency || "USD"))}</td>
      <td class="location">${escapeHtml(transaction.location || "Unknown")}</td>
      <td><span class="risk-badge ${level}">${level[0].toUpperCase() + level.slice(1)} · ${riskScore(transaction)}</span></td>
      <td><span class="status-badge ${transaction.status}">${statusLabel(transaction.status)}</span></td>
      <td><div class="row-actions"><button class="row-action" data-view="${safeId}" aria-label="View ${safeId}">View</button></div></td>
    </tr>`;
  }).join("");
  $("#table-count").textContent = String(filtered.length);
  $("#table-footer-copy").textContent = `Showing ${filtered.length} of ${transactions.length} transactions`;
  $("#empty-state").hidden = filtered.length !== 0;
  rowsElement.closest("table").hidden = filtered.length === 0;
  $("#nav-review-count").textContent = String(transactions.filter((item) => item.status === "review").length);
}

function statusLabel(status) {
  return status === "review" ? "Needs review" : status === "approved" ? "Approved" : "Blocked";
}

function renderMetrics() {
  const total = transactions.length;
  const flagged = transactions.filter((item) => item.status === "blocked").length;
  const open = transactions.filter((item) => item.status === "review").length;
  const highRisk = transactions.filter((item) => riskLevel(item) === "high").length;
  const mediumRisk = transactions.filter((item) => riskLevel(item) === "medium").length;
  const lowRisk = total - highRisk - mediumRisk;
  $("#metric-screened").textContent = total.toLocaleString("en-US");
  $("#metric-prevented").textContent = formatMoney(transactions.filter((item) => item.status === "blocked").reduce((sum, item) => sum + Number(item.amount), 0));
  $("#metric-review").textContent = open.toLocaleString("en-US");
  $("#metric-rate").textContent = total ? `${((flagged / total) * 100).toFixed(2)}%` : "0.00%";
  $("#risk-total").textContent = String(total);
  $("#risk-low").textContent = String(lowRisk);
  $("#risk-medium").textContent = String(mediumRisk);
  $("#risk-high").textContent = String(highRisk);
  const lowAngle = total ? lowRisk / total * 360 : 0;
  const mediumAngle = total ? mediumRisk / total * 360 : 0;
  $("#risk-donut").style.background = total
    ? `conic-gradient(#635be7 0deg ${highRisk / total * 360}deg, #e7a543 ${highRisk / total * 360}deg ${(highRisk + mediumRisk) / total * 360}deg, #36b18b ${(highRisk + mediumRisk) / total * 360}deg 360deg)`
    : "conic-gradient(#e9ecf2 0deg 360deg)";
  $("#chart-total").textContent = total.toLocaleString("en-US");
  drawChart($("#chart-range").value === "14" ? 14 : 7, lowAngle, mediumAngle);
}

function drawChart(days, unusedLow, unusedMedium) {
  const canvas = $("#activity-chart");
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  const context = canvas.getContext("2d");
  context.scale(ratio, ratio);
  const width = rect.width;
  const height = rect.height;
  const left = 30, right = 8, top = 8, bottom = 22;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const dayCounts = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const end = start + DAY;
    const items = transactions.filter((item) => {
      const time = new Date(item.time).getTime();
      return time >= start && time < end;
    });
    return { date, volume: items.length, flagged: items.filter((item) => riskLevel(item) === "high").length };
  });
  const max = Math.max(4, Math.ceil(Math.max(...dayCounts.map((item) => item.volume), 0) / 2) * 2);
  context.clearRect(0, 0, width, height);
  context.font = '9px "DM Sans", sans-serif';
  context.textBaseline = "middle";
  for (let line = 0; line <= 3; line++) {
    const y = top + plotHeight * line / 3;
    context.beginPath();
    context.strokeStyle = "#edf0f5";
    context.lineWidth = 1;
    context.moveTo(left, y);
    context.lineTo(width - right, y);
    context.stroke();
    context.fillStyle = "#a0a7b3";
    context.textAlign = "right";
    context.fillText(String(Math.round(max * (1 - line / 3))), left - 8, y);
  }
  const step = plotWidth / days;
  const barWidth = Math.min(18, step * .42);
  dayCounts.forEach((item, index) => {
    const x = left + step * (index + .5);
    const barHeight = item.volume / max * plotHeight;
    const flaggedHeight = item.flagged / max * plotHeight;
    context.fillStyle = "#e7e5fb";
    roundedRect(context, x - barWidth / 2, top + plotHeight - barHeight, barWidth, barHeight, 3);
    context.fill();
    if (flaggedHeight > 0) {
      context.fillStyle = "#f2bd65";
      roundedRect(context, x - barWidth / 2, top + plotHeight - flaggedHeight, barWidth, flaggedHeight, 3);
      context.fill();
    }
    if (days === 7 || index % 2 === 0) {
      context.fillStyle = "#a0a7b3";
      context.textAlign = "center";
      context.fillText(item.date.toLocaleDateString("en-US", { weekday: "short" }), x, height - 8);
    }
  });
}

function roundedRect(context, x, y, width, height, radius) {
  const actualRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.roundRect(x, y, width, height, actualRadius);
}

function render() {
  renderTransactions();
  renderMetrics();
}

function renderGreeting() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  $("#greeting").textContent = `${greeting}, Jordan`;
  $("#date-label").textContent = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric"
  }).toUpperCase();
}

function showToast(message) {
  const region = $("#toast-region");
  if (!region) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  region.append(toast);
  window.setTimeout(() => toast.remove(), 3500);
}

function openDetails(id) {
  const transaction = transactions.find((item) => item.id === id);
  if (!transaction) return;
  selectedTransactionId = id;
  const level = riskLevel(transaction);
  const signals = Array.isArray(transaction.signals) && transaction.signals.length
    ? transaction.signals
    : ["No notable signals recorded"];
  $("#drawer-title").textContent = transaction.merchant;
  $("#drawer-content").innerHTML = `
    <div class="drawer-amount"><span>Transaction amount</span><strong>${escapeHtml(formatMoney(transaction.amount, transaction.currency || "USD"))}</strong></div>
    <h3 class="drawer-section-title">Transaction details</h3>
    <div class="detail-grid">
      ${detailItem("Transaction ID", transaction.id)}
      ${detailItem("Date & time", new Date(transaction.time).toLocaleString())}
      ${detailItem("Cardholder", transaction.holder)}
      ${detailItem("Payment card", transaction.card || "Not provided")}
      ${detailItem("Merchant category", transaction.category || "Uncategorized")}
      ${detailItem("Location", transaction.location || "Unknown")}
      ${detailItem("Risk score", `${riskScore(transaction)} / 100 · ${level} risk`)}
      ${detailItem("Decision", statusLabel(transaction.status))}
    </div>
    <h3 class="drawer-section-title">Risk assessment</h3>
    <div class="score-explanation"><p>Demo score is a transparent rules-based estimate, not a production fraud prediction.</p><div class="signal-list">${signals.map((signal) => `<div class="signal"><span class="signal-dot ${/known|typical|recurring/i.test(signal) ? "positive" : ""}"></span>${escapeHtml(signal)}</div>`).join("")}</div></div>`;
  const buttons = transaction.status === "review"
    ? `<button class="button button-secondary" data-decision="blocked">Block transaction</button><button class="button button-primary" data-decision="approved">Approve transaction</button>`
    : `<button class="button button-secondary" data-decision="review">Reopen for review</button><button class="button button-primary" data-close>Done</button>`;
  $("#drawer-actions").innerHTML = buttons;
  $("#detail-drawer").hidden = false;
  $("#drawer-backdrop").hidden = false;
  $("#close-drawer").focus();
}

function detailItem(label, value) {
  return `<div class="detail-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function closeDetails() {
  $("#detail-drawer").hidden = true;
  $("#drawer-backdrop").hidden = true;
  selectedTransactionId = null;
}

function decideTransaction(id, status) {
  const transaction = transactions.find((item) => item.id === id);
  if (!transaction) return;
  transaction.status = status;
  persist();
  render();
  closeDetails();
  showToast(`${transaction.id} marked ${statusLabel(status).toLowerCase()}.`);
}

function exportCsv(items = transactions) {
  const headers = ["id", "merchant", "category", "cardholder", "card", "amount", "currency", "location", "time", "risk_score", "risk_level", "status"];
  const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.map(csvCell).join(",")];
  for (const item of items) {
    lines.push([item.id, item.merchant, item.category, item.holder, item.card, item.amount, item.currency || "USD", item.location, item.time, riskScore(item), riskLevel(item), item.status].map(csvCell).join(","));
  }
  downloadFile(`sentinel-transactions-${new Date().toISOString().slice(0, 10)}.csv`, lines.join("\r\n"), "text/csv;charset=utf-8");
  showToast(`Exported ${items.length} transaction${items.length === 1 ? "" : "s"}.`);
}

function downloadFile(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') { value += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { values.push(value.trim()); value = ""; }
    else value += char;
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  values.push(value.trim());
  return values;
}

function importCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("CSV must include a header and at least one transaction.");
  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase().replace(/[\s-]+/g, "_"));
  const required = ["merchant", "amount"];
  if (required.some((key) => !headers.includes(key))) throw new Error("CSV needs at least these columns: merchant, amount.");
  const imported = lines.slice(1).map((line, index) => {
    const columns = parseCsvLine(line);
    if (columns.length !== headers.length) throw new Error(`Row ${index + 2} has a different number of columns than the header.`);
    const record = Object.fromEntries(headers.map((header, column) => [header, columns[column]]));
    const amount = Number(record.amount);
    if (!record.merchant || !Number.isFinite(amount) || amount < 0) throw new Error(`Row ${index + 2} needs a merchant and a valid non-negative amount.`);
    const location = record.location || "Unknown";
    const category = record.category || "Retail";
    const signals = [];
    if (amount >= 500) signals.push("Unusually high amount");
    if (!/,\s*(US|USA)$/i.test(location)) signals.push("Location needs verification");
    if (category === "Digital goods") signals.push("Unfamiliar merchant category");
    if (!signals.length) signals.push("Typical spending amount");
    const status = ["review", "approved", "blocked"].includes(record.status) ? record.status : "review";
    return {
      id: record.id || `IMP-${Date.now().toString(36).toUpperCase()}-${String(index + 1).padStart(3, "0")}`,
      merchant: record.merchant,
      category,
      holder: record.cardholder || record.holder || "Imported customer",
      card: record.card || "Not provided",
      amount,
      currency: record.currency || "USD",
      location,
      time: record.time && !Number.isNaN(Date.parse(record.time)) ? new Date(record.time).toISOString() : new Date().toISOString(),
      status,
      signals
    };
  });
  const existingIds = new Set(transactions.map((item) => item.id));
  for (const item of imported) {
    if (existingIds.has(item.id)) throw new Error(`Transaction ID "${item.id}" already exists.`);
    existingIds.add(item.id);
  }
  transactions = [...imported, ...transactions];
  persist();
  render();
  showToast(`Imported ${imported.length} transaction${imported.length === 1 ? "" : "s"}.`);
}

function simulateTransaction() {
  const merchants = [
    { merchant: "Northstar Electronics", category: "Retail", amount: 1299, location: "Dublin, IE" },
    { merchant: "Cornerstone Coffee", category: "Food & drink", amount: 12.40, location: "Boston, US" },
    { merchant: "Digital Vault", category: "Digital goods", amount: 740, location: "Unknown" },
    { merchant: "Metro Transit", category: "Travel", amount: 5.80, location: "San Francisco, US" }
  ];
  const sample = merchants[Math.floor(Math.random() * merchants.length)];
  const signals = [];
  if (sample.amount >= 500) signals.push("Unusually high amount");
  if (!/,\s*US$/i.test(sample.location)) signals.push("Location needs verification");
  if (sample.category === "Digital goods") signals.push("Unfamiliar merchant category");
  if (!signals.length) signals.push("Typical spending amount");
  const transaction = {
    ...sample,
    id: `SIM-${Date.now().toString(36).toUpperCase()}`,
    holder: ["Taylor Morgan", "Riley Cooper", "Casey Bennett"][Math.floor(Math.random() * 3)],
    card: `•••• ${String(Math.floor(1000 + Math.random() * 9000))}`,
    currency: "USD",
    time: new Date().toISOString(),
    status: riskScore({ ...sample, signals }) >= 65 ? "review" : "approved",
    signals
  };
  transactions.unshift(transaction);
  persist();
  render();
  showToast(`New transaction screened: ${transaction.merchant}.`);
}

$("#search-input").addEventListener("input", renderTransactions);
$("#risk-filter").addEventListener("change", renderTransactions);
$("#status-filter").addEventListener("change", renderTransactions);
$("#chart-range").addEventListener("change", renderMetrics);
$("#export-button").addEventListener("click", () => exportCsv());
$("#export-table-button").addEventListener("click", () => {
  const query = $("#search-input").value.trim().toLowerCase();
  const risk = $("#risk-filter").value;
  const status = $("#status-filter").value;
  const visible = transactions.filter((item) => {
    const searchable = [item.id, item.merchant, item.holder, item.card, item.location].join(" ").toLowerCase();
    return (!query || searchable.includes(query)) && (risk === "all" || riskLevel(item) === risk) && (status === "all" || item.status === status);
  });
  exportCsv(visible);
});
$("#simulate-button").addEventListener("click", simulateTransaction);
$("#import-button").addEventListener("click", () => $("#file-input").click());
$("#file-input").addEventListener("change", async (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  try {
    importCsv(await file.text());
  } catch (error) {
    console.error("CSV import failed:", error);
    showToast(error instanceof Error ? error.message : "CSV could not be imported.");
  } finally {
    event.target.value = "";
  }
});
rowsElement.addEventListener("click", (event) => {
  const button = event.target.closest("[data-view]");
  if (button) openDetails(button.dataset.view);
});
$("#drawer-actions").addEventListener("click", (event) => {
  const decision = event.target.closest("[data-decision]");
  if (decision && selectedTransactionId) decideTransaction(selectedTransactionId, decision.dataset.decision);
  else if (event.target.closest("[data-close]")) closeDetails();
});
$("#close-drawer").addEventListener("click", closeDetails);
$("#drawer-backdrop").addEventListener("click", closeDetails);
$("#clear-filters-button").addEventListener("click", () => {
  $("#search-input").value = "";
  $("#risk-filter").value = "all";
  $("#status-filter").value = "all";
  renderTransactions();
});
$("#help-button").addEventListener("click", () => showToast("Sentinel is a local demo. No real card data or bank systems are connected."));
$("#risk-info").addEventListener("click", () => showToast("Demo scores: amount, merchant category, location, and listed signals."));
$(".profile-menu").addEventListener("click", () => {
  try {
    sessionStorage.removeItem("sentinel-demo-auth");
  } catch (error) {
    console.warn("Could not clear session-only demo sign-in:", error);
  }
  try {
    localStorage.removeItem("sentinel-demo-auth");
  } catch (error) {
    console.warn("Could not clear remembered demo sign-in:", error);
  }
  location.replace("index.html");
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !$("#detail-drawer").hidden) closeDetails();
});
window.addEventListener("resize", () => drawChart($("#chart-range").value === "14" ? 14 : 7));

renderGreeting();
render();
