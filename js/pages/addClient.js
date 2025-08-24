import { mount } from "../app.js";
import {
  getClients,
  setClients,
  getProducts,
  setProducts,
  getTransactions,
  setTransactions,
} from "../storage.js";

export function renderAddClient() {
  mount((root) => {
    const products = getProducts();
    root.innerHTML = `
      <form id="add-form" class="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-soft space-y-6 max-w-3xl">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="text-xs text-slate-500">Full Name</label>
            <input name="name" required class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400" />
          </div>
          <div>
            <label class="text-xs text-slate-500">Phone</label>
            <input name="phone" required class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400" />
          </div>
          <div>
            <label class="text-xs text-slate-500">Email</label>
            <input name="email" type="email" required class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400" />
          </div>
          <div>
            <label class="text-xs text-slate-500">Birthday</label>
            <input name="birthday" type="date" required class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100" />
          </div>
          <div class="sm:col-span-2">
            <label class="text-xs text-slate-500">Products</label>
            <div id="picker" class="flex flex-wrap gap-2 mt-1"></div>
            <div class="mt-2 flex items-center gap-2">
              <select id="prod-select" class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">${products
                .map(
                  (p) =>
                    `<option value="${p.id}">${p.name} • $${p.price}</option>`
                )
                .join("")}</select>
              <input id="prod-qty" type="number" min="1" value="1" class="w-20 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100" />
              <button type="button" id="add-prod" class="px-3 py-2 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">Add</button>
              <button type="button" id="quick-add" title="Quick add product" class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">+ New</button>
            </div>
          </div>
          <div class="sm:col-span-2">
            <label class="text-xs text-slate-500">Notes</label>
            <textarea name="notes" rows="3" class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400"></textarea>
          </div>
          <div>
            <label class="text-xs text-slate-500">Status</label>
            <select name="status" class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>
        <div class="flex gap-3">
          <button class="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white">Add Client</button>
          <button type="reset" class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">Reset</button>
        </div>
      </form>
    `;

    const selected = [];
    const picker = root.querySelector("#picker");
    function renderChips() {
      picker.innerHTML = selected
        .map(
          (s) =>
            `<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-sm">${s.name} • $${s.price} × ${s.qty}<button data-remove="${s.id}" class="ml-1 hover:opacity-70">✖</button></span>`
        )
        .join("");
      picker.querySelectorAll("[data-remove]").forEach((b) =>
        b.addEventListener("click", () => {
          const id = +b.dataset.remove;
          const i = selected.findIndex((x) => x.id === id);
          if (i > -1) selected.splice(i, 1);
          renderChips();
        })
      );
    }
    root.querySelector("#add-prod").addEventListener("click", () => {
      const id = +root.querySelector("#prod-select").value;
      const qty = Math.max(1, +root.querySelector("#prod-qty").value || 1);
      const p = products.find((x) => x.id === id);
      const existing = selected.find((x) => x.id === id);
      if (existing) existing.qty += qty;
      else selected.push({ id, name: p.name, price: p.price, qty });
      renderChips();
    });
    root.querySelector("#quick-add").addEventListener("click", () => {
      const name = prompt("Product name");
      if (!name) return;
      const price = +prompt("Price") || 0;
      const list = getProducts();
      const item = {
        id: Math.max(0, ...list.map((p) => p.id)) + 1,
        name,
        price,
      };
      setProducts([...list, item]);
      root
        .querySelector("#prod-select")
        .insertAdjacentHTML(
          "beforeend",
          `<option value="${item.id}">${item.name} • $${item.price}</option>`
        );
    });

    root.querySelector("#add-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const form = new FormData(e.target);
      const obj = Object.fromEntries(form.entries());
      const list = getClients();
      const nextId = Math.max(0, ...list.map((c) => c.id)) + 1;
      const newClient = {
        id: nextId,
        name: obj.name.trim(),
        phone: obj.phone.trim(),
        email: obj.email.trim(),
        birthday: obj.birthday,
        status: obj.status,
        productsPurchased: selected.map((s) => ({
          productId: s.id,
          qty: s.qty,
          priceAtPurchase: s.price,
        })),
        notes: obj.notes || "",
      };
      setClients([...list, newClient]);
      const tx = getTransactions();
      const toAdd = selected.map((s, i) => ({
        id: Math.max(0, ...tx.map((t) => t.id)) + 1 + i,
        clientId: nextId,
        productId: s.id,
        qty: s.qty,
        priceAtPurchase: s.price,
        date: new Date().toISOString().slice(0, 10),
      }));
      setTransactions([...tx, ...toAdd]);
      e.target.reset();
      const toast = document.createElement("div");
      toast.className =
        "fixed bottom-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg";
      toast.textContent = "Client added";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 1800);
    });
  });
}
