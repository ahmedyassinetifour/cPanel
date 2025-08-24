import { mount } from "../app.js";
import { getOrders, setOrders, getSettings } from "../storage.js";

let state = { q: "", status: "all", page: 1, pageSize: 8 };
let moneyFormatter;

export function renderOrders() {
  mount((root) => {
    moneyFormatter = (() => {
      const c = getSettings()?.currency || "USD";
      try {
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: c,
        });
      } catch {
        return null;
      }
    })();
    const all = getOrders();
    const list = applyFilters(all);
    const totalPages = Math.max(1, Math.ceil(list.length / state.pageSize));
    const pageItems = list.slice(
      (state.page - 1) * state.pageSize,
      state.page * state.pageSize
    );

    root.innerHTML = `
      <div class="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-soft">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
            <div class="sm:col-span-2">
              <label class="text-xs text-slate-500">Search (customer or product)</label>
              <input id="q" class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400" placeholder="Search…" value="${
                state.q
              }" />
            </div>
            <div>
              <label class="text-xs text-slate-500">Status</label>
              <select id="status" class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                ${statusOptions(state.status)}
              </select>
            </div>
          </div>
        </div>

        <div class="mt-5 overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left text-slate-600 dark:text-slate-300">
                <th class="py-3">Customer</th>
                <th class="py-3">Contact</th>
                <th class="py-3">Items</th>
                <th class="py-3">Total</th>
                <th class="py-3">Date</th>
                <th class="py-3">Status</th>
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
            <div class="px-3">Page ${state.page}/${totalPages}</div>
            <button id="next" class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40" ${
              state.page === totalPages ? "disabled" : ""
            }>Next</button>
          </div>
        </div>
      </div>`;

    const search = root.querySelector("#q");
    search.addEventListener("input", () => {
      state.page = 1;
      state.q = search.value;
      renderOrders();
    });
    const statusSel = root.querySelector("#status");
    statusSel.addEventListener("change", () => {
      state.page = 1;
      state.status = statusSel.value;
      renderOrders();
    });
    root.querySelector("#prev").addEventListener("click", () => {
      if (state.page > 1) {
        state.page--;
        renderOrders();
      }
    });
    root.querySelector("#next").addEventListener("click", () => {
      const tp = Math.ceil(applyFilters(getOrders()).length / state.pageSize);
      if (state.page < tp) {
        state.page++;
        renderOrders();
      }
    });

    wireRowActions(root);
  });
}

function statusOptions(sel) {
  const opts = [
    ["all", "All"],
    ["Pending", "Pending"],
    ["In Transit", "In Transit"],
    ["Delivered", "Delivered"],
    ["Cancelled", "Cancelled"],
  ];
  return opts
    .map(
      ([v, l]) =>
        `<option ${sel === v ? "selected" : ""} value="${v}">${l}</option>`
    )
    .join("");
}

function applyFilters(list) {
  let out = [...list];
  if (state.q) {
    const q = state.q.toLowerCase();
    out = out.filter(
      (o) =>
        (o.customer?.name || "").toLowerCase().includes(q) ||
        o.items?.some((i) => i.name.toLowerCase().includes(q))
    );
  }
  if (state.status !== "all")
    out = out.filter((o) => (o.status || "Pending") === state.status);
  out.sort((a, b) => new Date(b.date) - new Date(a.date));
  return out;
}

function row(o) {
  const items = (o.items || []).map((i) => `${i.name} × ${i.qty}`).join(", ");
  const status = o.status || "Pending";
  return `<tr>
    <td class="py-3">
      <div class="font-medium">${o.customer?.name || "-"}</div>
    </td>
    <td class="py-3">${
      o.customer?.phone || "-"
    }<div class="text-xs text-slate-500">${o.customer?.address || ""}</div></td>
    <td class="py-3">${items || "-"}</td>
  <td class="py-3 font-semibold">${formatMoney(o.total)}</td>
    <td class="py-3">${new Date(o.date).toLocaleString()}</td>
    <td class="py-3">
      <span class="text-xs px-2 py-1 rounded-full ${badge(
        status
      )}">${status}</span>
    </td>
    <td class="py-3 text-right">
      <select data-status="${
        o.id
      }" class="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
        ${["Pending", "In Transit", "Delivered", "Cancelled"]
          .map((s) => `<option ${s === status ? "selected" : ""}>${s}</option>`)
          .join("")}
      </select>
    </td>
  </tr>`;
}

function badge(s) {
  switch (s) {
    case "Delivered":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
    case "In Transit":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
    case "Cancelled":
      return "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
  }
}

function formatMoney(v) {
  if (moneyFormatter) return moneyFormatter.format(+v || 0);
  return `$${(+v || 0).toFixed(2)}`;
}

function wireRowActions(root) {
  root.querySelectorAll("select[data-status]").forEach((sel) =>
    sel.addEventListener("change", (e) => {
      const id = +e.currentTarget.dataset.status;
      const orders = getOrders();
      const idx = orders.findIndex((o) => o.id === id);
      if (idx > -1) {
        orders[idx].status = e.currentTarget.value;
        setOrders(orders);
        const toast = document.createElement("div");
        toast.className =
          "fixed bottom-4 right-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-3 py-1.5 rounded-lg shadow-lg";
        toast.textContent = "Status updated";
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 1200);
      }
    })
  );
}
