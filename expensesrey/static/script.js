const CATEGORY_EMOJI = {
  Food: "🍛",
  Transport: "🚌",
  Shopping: "🛍",
  Health: "💊",
  Bills: "💡",
  Entertainment: "🎬",
  Education: "📚",
  Other: "📦",
};

let allExpenses = [];
let selectedCategory = "Food";

// ── DOM refs ──────────────────────────────────────
const totalAmountEl = document.getElementById("totalAmount");
const totalCountEl = document.getElementById("totalCount");
const topCategoryEl = document.getElementById("topCategory");
const expenseListEl = document.getElementById("expenseList");
const breakdownEl = document.getElementById("categoryBreakdown");
const formMsg = document.getElementById("formMsg");
const searchInput = document.getElementById("searchInput");

// ── Theme Toggle ──────────────────────────────────
const themeToggle = document.getElementById("themeToggle");
const toggleIcon = themeToggle.querySelector(".toggle-icon");
const toggleLabel = themeToggle.querySelector(".toggle-label");

function applyTheme(theme) {
  if (theme === "light") {
    document.body.classList.add("light");
    toggleIcon.textContent = "☀️";
    toggleLabel.textContent = "Light";
  } else {
    document.body.classList.remove("light");
    toggleIcon.textContent = "🌙";
    toggleLabel.textContent = "Dark";
  }
  localStorage.setItem("theme", theme);
}

// Load saved preference on startup
applyTheme(localStorage.getItem("theme") || "dark");

themeToggle.addEventListener("click", () => {
  applyTheme(document.body.classList.contains("light") ? "dark" : "light");
});

// ── Init ──────────────────────────────────────────
document.getElementById("date").valueAsDate = new Date();

document.querySelectorAll(".cat-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".cat-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedCategory = btn.dataset.cat;
  });
});

document.getElementById("addBtn").addEventListener("click", addExpense);
searchInput.addEventListener("input", () => renderList(allExpenses));

// ── Fetch all on load ─────────────────────────────
async function loadAll() {
  try {
    const [expRes, sumRes] = await Promise.all([
      fetch("/api/expenses"),
      fetch("/api/summary"),
    ]);
    allExpenses = await expRes.json();
    const summary = await sumRes.json();
    renderSummary(summary);
    renderList(allExpenses);
    renderBreakdown(summary.by_category, summary.total);
  } catch (e) {
    showMsg("Failed to load data.", "error");
  }
}

// ── Add expense ───────────────────────────────────
async function addExpense() {
  const title = document.getElementById("title").value.trim();
  const amount = document.getElementById("amount").value;
  const date = document.getElementById("date").value;
  const note = document.getElementById("note").value.trim();

  if (!title || !amount || !date) {
    showMsg("Please fill in title, amount, and date.", "error");
    return;
  }

  const btn = document.getElementById("addBtn");
  btn.disabled = true;
  btn.textContent = "Adding...";

  try {
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        amount: parseFloat(amount),
        category: selectedCategory,
        date,
        note,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      showMsg(data.error || "Error adding expense.", "error");
      return;
    }

    showMsg("Expense added!", "success");
    document.getElementById("title").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("note").value = "";
    await loadAll();
  } catch (e) {
    showMsg("Network error.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "+ Add Expense";
  }
}

// ── Delete expense ────────────────────────────────
async function deleteExpense(id) {
  try {
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    await loadAll();
  } catch (e) {
    showMsg("Delete failed.", "error");
  }
}

// ── Render: Summary ───────────────────────────────
function renderSummary(summary) {
  totalAmountEl.textContent =
    "₹" + summary.total.toLocaleString("en-IN", { minimumFractionDigits: 2 });
  totalCountEl.textContent = summary.count;

  const entries = Object.entries(summary.by_category);
  if (entries.length) {
    const top = entries.sort((a, b) => b[1] - a[1])[0];
    topCategoryEl.textContent = (CATEGORY_EMOJI[top[0]] || "📦") + " " + top[0];
  } else {
    topCategoryEl.textContent = "—";
  }
}

// ── Render: Expense List ──────────────────────────
function renderList(expenses) {
  const query = searchInput.value.toLowerCase();
  const filtered = query
    ? expenses.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.category.toLowerCase().includes(query) ||
          (e.note && e.note.toLowerCase().includes(query))
      )
    : expenses;

  if (!filtered.length) {
    expenseListEl.innerHTML = `<p class="empty-state">${
      query ? "No results found." : "No expenses recorded yet."
    }</p>`;
    return;
  }

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  expenseListEl.innerHTML = sorted
    .map(
      (e) => `
    <div class="expense-item">
      <div class="expense-emoji">${CATEGORY_EMOJI[e.category] || "📦"}</div>
      <div class="expense-info">
        <div class="expense-title">${escHtml(e.title)}</div>
        <div class="expense-meta">${e.category} · ${formatDate(e.date)}${
        e.note ? " · " + escHtml(e.note) : ""
      }</div>
      </div>
      <div class="expense-amount">₹${parseFloat(e.amount).toLocaleString(
        "en-IN",
        { minimumFractionDigits: 2 }
      )}</div>
      <button class="btn-delete" onclick="deleteExpense(${
        e.id
      })" title="Delete">✕</button>
    </div>
  `
    )
    .join("");
}

// ── Render: Category Breakdown ────────────────────
function renderBreakdown(byCategory, total) {
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  if (!entries.length) {
    breakdownEl.innerHTML = `<p class="empty-state">No data yet.</p>`;
    return;
  }

  breakdownEl.innerHTML = entries
    .map(([cat, amt]) => {
      const pct = total > 0 ? Math.round((amt / total) * 100) : 0;
      return `
      <div class="breakdown-item">
        <div class="breakdown-row">
          <span class="breakdown-cat">${
            CATEGORY_EMOJI[cat] || "📦"
          } ${cat}</span>
          <span class="breakdown-amt">₹${parseFloat(amt).toLocaleString(
            "en-IN",
            { minimumFractionDigits: 2 }
          )} <span style="color:var(--text-dim);font-size:10px">${pct}%</span></span>
        </div>
        <div class="breakdown-bar-bg">
          <div class="breakdown-bar-fill" style="width:${pct}%"></div>
        </div>
      </div>
    `;
    })
    .join("");
}

// ── Helpers ───────────────────────────────────────
function showMsg(text, type) {
  formMsg.textContent = text;
  formMsg.className = "form-msg " + type;
  setTimeout(() => {
    formMsg.textContent = "";
    formMsg.className = "form-msg";
  }, 3000);
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function escHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Boot ──────────────────────────────────────────
loadAll();
