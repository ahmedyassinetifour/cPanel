import { mount } from "../app.js";
import { confirmDialog } from "../ui/modal.js";
import {
  getClients,
  setClients,
  getTransactions,
  getProducts,
  setTransactions,
} from "../storage.js";

let state = {
  q: "",
  month: "all",
  status: "all",
  sort: "name-asc",
  page: 1,
  pageSize: 6,
};

const debounce = (fn, ms = 300) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

function computeStatusMap() {
  const tx = getTransactions();
  const byClient = new Map();
  tx.forEach((t) => {
    const arr = byClient.get(t.clientId) || [];
    arr.push(t);
    byClient.set(t.clientId, arr);
  });
  const now = Date.now();
  const ninety = 90 * 24 * 60 * 60 * 1000;
  return (id) => {
    const arr = byClient.get(id) || [];
    const last = arr.reduce(
      (max, t) => Math.max(max, new Date(t.date).getTime()),
      0
    );
    return last && now - last <= ninety ? "Active" : "Inactive";
  };
}

function applyFilters(list) {
  const statusOf = computeStatusMap();
  let out = [...list];
  if (state.q)
    out = out.filter((c) =>
      c.name.toLowerCase().includes(state.q.toLowerCase())
    );
  if (state.month !== "all")
    out = out.filter(
      (c) => (new Date(c.birthday).getMonth() + 1).toString() === state.month
    );
  if (state.status !== "all")
    out = out.filter((c) => statusOf(c.id) === state.status);

  const [key, dir] = state.sort.split("-");
  out.sort((a, b) => {
    let va =
      key === "birthday"
        ? new Date(a.birthday).getTime()
        : a[key].toString().toLowerCase();
    let vb =
      key === "birthday"
        ? new Date(b.birthday).getTime()
        : b[key].toString().toLowerCase();
    if (va < vb) return dir === "asc" ? -1 : 1;
    if (va > vb) return dir === "asc" ? 1 : -1;
    return 0;
  });

  return out;
}

function paginate(list) {
  const start = (state.page - 1) * state.pageSize;
  return list.slice(start, start + state.pageSize);
}

export function renderClients() {
  mount((root) => {
    const data = getClients();
    const list = applyFilters(data);
    const pageItems = paginate(list);
    const totalPages = Math.max(1, Math.ceil(list.length / state.pageSize));

    root.innerHTML = `
      <div class="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-soft">
        <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div class="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div class="sm:col-span-2">
              <label class="text-xs text-slate-500">Search</label>
              <!-- Dark-theme friendly input: explicit bg/text to ensure contrast -->
              <input id="q" class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-brand-200 dark:focus:ring-brand-700" placeholder="Search by name…" value="${
                state.q
              }" />
            </div>
            <div>
              <label class="text-xs text-slate-500">Birthday Month</label>
              <!-- Dark-theme friendly select -->
              <select id="month" class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">${monthOptions()}</select>
            </div>
            <div>
              <label class="text-xs text-slate-500">Status</label>
              <select id="status" class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                <option value="all">All</option>
                <option ${
                  state.status === "Active" ? "selected" : ""
                } value="Active">Active</option>
                <option ${
                  state.status === "Inactive" ? "selected" : ""
                } value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label class="text-xs text-slate-500">Sort by</label>
            <select id="sort" class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
              ${sortOptions(state.sort)}
            </select>
          </div>
        </div>

  <div class="mt-5 overflow-x-auto" id="results">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left text-slate-600 dark:text-slate-300">
                <th class="py-3">Name</th>
                <th class="py-3">Contact</th>
                <th class="py-3">Birthday</th>
                <th class="py-3">Status</th>
                <th class="py-3">Products</th>
                <th class="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-100">
              ${pageItems.map(row).join("")}
            </tbody>
          </table>
        </div>

        <div class="mt-4 flex items-center justify-between text-sm">
          <div>Showing ${(state.page - 1) * state.pageSize + 1}-${Math.min(
      state.page * state.pageSize,
      list.length
    )} of ${list.length}</div>
          <div class="flex items-center gap-2">
            <button id="prev" class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40" ${
              state.page === 1 ? "disabled" : ""
            }>Prev</button>
            <div class="px-3">Page ${state.page} / ${totalPages}</div>
            <button id="next" class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40" ${
              state.page === totalPages ? "disabled" : ""
            }>Next</button>
          </div>
        </div>
      </div>
    `;

    // Wire controls: debounced search with partial re-render
    // NOTE: We only update the results <tbody> to preserve input focus and avoid layout flicker.
    // This ensures typing doesn't reset the field or scroll position.
    const searchEl = root.querySelector("#q");
    const resultsEl = () => root.querySelector("#results tbody");
    const doSearch = debounce(() => {
      state.page = 1;
      const dataNow = getClients();
      const filtered = paginate(applyFilters(dataNow));
      resultsEl().innerHTML = filtered.map(row).join("");
      wireRowActions(root);
    }, 300);
    searchEl.addEventListener("input", (e) => {
      state.q = e.target.value;
      doSearch();
    });
    root.querySelector("#month").value = state.month;
    root.querySelector("#month").addEventListener("change", (e) => {
      state.month = e.target.value;
      state.page = 1;
      renderClients();
    });
    root.querySelector("#status").addEventListener("change", (e) => {
      state.status = e.target.value;
      state.page = 1;
      renderClients();
    });
    root.querySelector("#sort").addEventListener("change", (e) => {
      state.sort = e.target.value;
      renderClients();
    });
    root.querySelector("#prev").addEventListener("click", () => {
      if (state.page > 1) {
        state.page--;
        renderClients();
      }
    });
    root.querySelector("#next").addEventListener("click", () => {
      const tp = Math.ceil(applyFilters(getClients()).length / state.pageSize);
      if (state.page < tp) {
        state.page++;
        const dataNow = getClients();
        const filtered = paginate(applyFilters(dataNow));
        resultsEl().innerHTML = filtered.map(row).join("");
        wireRowActions(root);
      }
    });

    wireRowActions(root);
  });
}

function row(c) {
  const statusOf = computeStatusMap();
  const status = statusOf(c.id);
  return `
    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
      <td class="py-3">
        <div class="flex items-center gap-3">
          <div class="h-9 w-9 rounded-lg bg-gradient-to-tr from-brand-500 to-purple-500 text-white grid place-items-center">${
            c.name[0]
          }</div>
          <div>
            <div class="font-medium">${c.name}</div>
            <div class="text-xs text-slate-500">${c.email}</div>
          </div>
        </div>
      </td>
      <td class="py-3">${c.phone}</td>
      <td class="py-3">${new Date(c.birthday).toLocaleDateString()}</td>
      <td class="py-3"><span class="text-xs px-2 py-1 rounded-full ${
        status === "Active"
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
      }">${status}</span></td>
      <td class="py-3">${
        Array.isArray(c.products)
          ? c.products.join(", ")
          : c.productsPurchased
          ? c.productsPurchased.length + " items"
          : "-"
      }</td>
      <td class="py-3 text-right space-x-2">
        <button data-action="details" data-id="${
          c.id
        }" class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700">Details</button>
        <button data-action="edit" data-id="${
          c.id
        }" class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700">Edit</button>
        <button data-action="delete" data-id="${
          c.id
        }" class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white">Delete</button>
      </td>
    </tr>`;
}

function monthOptions() {
  const names = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return (
    `<option value="all">All</option>` +
    names
      .map(
        (n, i) =>
          `<option ${+state.month === i + 1 ? "selected" : ""} value="${
            i + 1
          }">${n}</option>`
      )
      .join("")
  );
}

function sortOptions(sel) {
  const opts = [
    ["name-asc", "Name A→Z"],
    ["name-desc", "Name Z→A"],
    ["birthday-asc", "Birthday ↑"],
    ["birthday-desc", "Birthday ↓"],
  ];
  return opts
    .map(
      ([v, l]) =>
        `<option ${sel === v ? "selected" : ""} value="${v}">${l}</option>`
    )
    .join("");
}

function wireRowActions(root) {
  const data = getClients();
  root
    .querySelectorAll('[data-action="edit"]')
    .forEach((btn) =>
      btn.addEventListener("click", () => alert("Edit placeholder"))
    );
  root
    .querySelectorAll('[data-action="details"]')
    .forEach((btn) =>
      btn.addEventListener("click", () => openDetails(+btn.dataset.id))
    );
  root.querySelectorAll('[data-action="delete"]').forEach((btn) =>
    btn.addEventListener("click", async (e) => {
      const id = +e.currentTarget.dataset.id;
      const c = data.find((x) => x.id === id);
      const ok = await confirmDialog({
        title: "Delete Client",
        message: `This will remove ${c.name}.`,
      });
      if (ok) {
        const next = data.filter((x) => x.id !== id);
        setClients(next);
        renderClients();
      }
    })
  );
}

function openDetails(id) {
  const c = getClients().find((x) => x.id === id);
  const tx = getTransactions().filter((t) => t.clientId === id);
  const prods = getProducts();
  const spend = tx.reduce((sum, t) => sum + t.priceAtPurchase * t.qty, 0);
  const overlay = document.createElement("div");
  overlay.className =
    "fixed inset-0 z-50 grid place-items-center bg-slate-900/50 backdrop-blur-sm";
  overlay.innerHTML = `
    <div class="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-2xl">
      <div class="flex items-start justify-between">
        <div>
          <div class="text-xl font-bold">${c.name}</div>
          <div class="text-sm text-slate-500">${c.email} • ${c.phone}</div>
        </div>
        <button data-close class="h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">✖</button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
          <div class="text-sm text-slate-500 mb-1">Total Spend</div>
          <div class="text-2xl font-extrabold">$${spend.toFixed(2)}</div>
        </div>
        <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
          <div class="text-sm text-slate-500 mb-1">Birthday</div>
          <div class="font-medium">${new Date(
            c.birthday
          ).toLocaleDateString()}</div>
        </div>
      </div>
      <div class="mt-4">
        <h4 class="font-bold mb-2">Purchases</h4>
        <div class="max-h-64 overflow-auto">
          <table class="w-full text-sm">
            <thead><tr class="text-left text-slate-500"><th class="py-1">Product</th><th>Qty</th><th>Price</th><th>Date</th></tr></thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
              ${tx
                .map((t) => {
                  const p = prods.find((p) => p.id === t.productId);
                  return `<tr><td class="py-1">${
                    p?.name || t.productId
                  }</td><td>${t.qty}</td><td>$${t.priceAtPurchase.toFixed(
                    2
                  )}</td><td>${new Date(
                    t.date
                  ).toLocaleDateString()}</td></tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay
    .querySelector("[data-close]")
    .addEventListener("click", () => overlay.remove());
  document.body.appendChild(overlay);
}
