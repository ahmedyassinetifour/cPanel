import { mount } from "../app.js";
import { getProducts, setProducts, getSettings } from "../storage.js";
import { confirmDialog } from "../ui/modal.js";

export function renderProducts() {
  mount((root) => {
    const products = getProducts();
    const money = (v) => {
      const currency = getSettings()?.currency || "USD";
      try {
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency,
        }).format(+v || 0);
      } catch {
        return `$${(+v || 0).toFixed(2)}`;
      }
    };
    // Tiny toast helper
    function toast(message, { actionLabel, onAction, timeout = 4000 } = {}) {
      const t = document.createElement("div");
      t.className =
        "fixed bottom-4 right-4 z-[1000] max-w-sm rounded-lg bg-slate-900 text-white px-4 py-3 shadow-lg flex items-center gap-3";
      t.innerHTML = `<span class="text-sm">${message}</span>`;
      if (actionLabel && onAction) {
        const btn = document.createElement("button");
        btn.className =
          "ml-auto px-2 py-1 rounded border border-white/20 hover:bg-white/10 text-xs";
        btn.textContent = actionLabel;
        btn.addEventListener("click", () => {
          onAction();
          t.remove();
        });
        t.appendChild(btn);
      }
      document.body.appendChild(t);
      if (timeout) setTimeout(() => t.remove(), timeout);
    }
    root.innerHTML = `
      <div class="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-soft">
        <div class="flex items-center justify-between gap-3 mb-4">
          <h3 class="font-bold">Products</h3>
          <button id="add-product" class="px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white">Add Product</button>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
        <tr class="text-left text-slate-500"><th class="py-2">Name</th><th>Price</th><th>Category</th><th>Stock</th><th>Image</th><th class="text-right">Actions</th></tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
              ${products.map(row).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    root
      .querySelector("#add-product")
      .addEventListener("click", () => openForm());
    root
      .querySelectorAll('[data-action="edit"]')
      .forEach((btn) =>
        btn.addEventListener("click", () => openForm(+btn.dataset.id))
      );
    root.querySelectorAll('[data-action="delete"]').forEach((btn) =>
      btn.addEventListener("click", async () => {
        const id = +btn.dataset.id;
        const ok = await confirmDialog({
          title: "Delete product",
          message: "This cannot be undone.",
        });
        if (!ok) return;
        const list = getProducts();
        const deleted = list.find((p) => p.id === id);
        const next = list.filter((p) => p.id !== id);
        setProducts(next);
        renderProducts();
        // Offer undo
        toast("Product deleted", {
          actionLabel: "Undo",
          onAction: () => {
            const back = getProducts();
            setProducts([...back, deleted].sort((a, b) => a.id - b.id));
            renderProducts();
          },
        });
      })
    );

    function openForm(id) {
      const list = getProducts();
      const editing = id
        ? list.find((p) => p.id === id)
        : {
            name: "",
            price: "",
            category: "",
            stock: "",
            image: "",
            images: [],
            description: "",
          };
      const overlay = document.createElement("div");
      overlay.className =
        "fixed inset-0 z-50 grid place-items-center bg-slate-900/50 backdrop-blur-sm";
      overlay.innerHTML = `
        <form class="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-2xl space-y-4">
          <h3 class="font-bold">${id ? "Edit" : "Add"} Product</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label class="text-xs text-slate-500">Name</label><input name="name" value="${
              editing.name || ""
            }" required class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" /></div>
            <div><label class="text-xs text-slate-500">Price</label><input name="price" type="number" step="0.01" value="${
              editing.price || ""
            }" required class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" /></div>
            <div><label class="text-xs text-slate-500">Category</label><input name="category" value="${
              editing.category || ""
            }" class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" /></div>
            <div><label class="text-xs text-slate-500">Stock</label><input name="stock" type="number" value="${
              editing.stock || ""
            }" class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" /></div>
            <div class="sm:col-span-2">
              <label class="text-xs text-slate-500">Images</label>
              <input id="images-input" type="file" accept="image/*" multiple class="block w-full text-sm file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 dark:file:bg-slate-700 file:text-slate-700 dark:file:text-slate-200" />
              <div id="images-preview" class="mt-2 flex flex-wrap gap-3"></div>
              <button type="button" id="clear-all-images" class="mt-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">Clear all</button>
            </div>
            <div class="sm:col-span-2">
              <label class="text-xs text-slate-500">Description</label>
              <textarea name="description" rows="4" class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" placeholder="Short description...">${
                editing.description || ""
              }</textarea>
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" data-cancel class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">Cancel</button>
            <button class="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white">Save</button>
          </div>
        </form>`;
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.remove();
      });
      const form = overlay.querySelector("form");
      // Multiple images preview logic using FileReader
      const imagesInput = form.querySelector("#images-input");
      const imagesPreview = form.querySelector("#images-preview");
      const clearAllBtn = form.querySelector("#clear-all-images");
      let imagesData = Array.isArray(editing.images)
        ? editing.images.slice()
        : editing.image
        ? [editing.image]
        : [];

      function renderImagesPreview() {
        imagesPreview.innerHTML = imagesData
          .map(
            (src, idx) => `
          <div class="relative" draggable="true" data-idx="${idx}">
            <img src="${src}" class="h-20 w-28 object-cover rounded-lg border border-slate-200 dark:border-slate-700"/>
            <button type="button" data-remove="${idx}" class="absolute -top-2 -right-2 h-6 w-6 grid place-items-center rounded-full bg-rose-600 text-white">×</button>
          </div>
        `
          )
          .join("");
        imagesPreview.querySelectorAll("button[data-remove]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const i = +btn.getAttribute("data-remove");
            imagesData.splice(i, 1);
            renderImagesPreview();
          });
        });
        // Drag & drop reorder
        imagesPreview.querySelectorAll('[draggable="true"]').forEach((el) => {
          el.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", el.getAttribute("data-idx"));
            e.dataTransfer.effectAllowed = "move";
          });
          el.addEventListener("dragover", (e) => {
            e.preventDefault();
            el.classList.add("ring-2", "ring-brand-500");
          });
          el.addEventListener("dragleave", () =>
            el.classList.remove("ring-2", "ring-brand-500")
          );
          el.addEventListener("drop", (e) => {
            e.preventDefault();
            el.classList.remove("ring-2", "ring-brand-500");
            const from = +e.dataTransfer.getData("text/plain");
            const to = +el.getAttribute("data-idx");
            if (Number.isInteger(from) && Number.isInteger(to) && from !== to) {
              const [moved] = imagesData.splice(from, 1);
              imagesData.splice(to, 0, moved);
              renderImagesPreview();
            }
          });
        });
      }
      renderImagesPreview();
      imagesInput.addEventListener("change", (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        let pending = files.length;
        files.forEach((file) => {
          const reader = new FileReader();
          reader.onload = () => {
            imagesData.push(reader.result);
            if (--pending === 0) renderImagesPreview();
          };
          reader.readAsDataURL(file);
        });
        imagesInput.value = "";
      });
      clearAllBtn.addEventListener("click", () => {
        imagesData = [];
        renderImagesPreview();
      });
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const obj = Object.fromEntries(fd.entries());
        const item = {
          id: id || Math.max(0, ...list.map((p) => p.id)) + 1,
          name: obj.name.trim(),
          price: +obj.price,
          category: obj.category || "",
          stock: obj.stock ? +obj.stock : undefined,
          images: imagesData,
          image: imagesData[0] || editing.image || "",
          description: (obj.description || "").trim(),
        };
        const next = id
          ? list.map((p) => (p.id === id ? item : p))
          : [...list, item];
        setProducts(next);
        overlay.remove();
        renderProducts();
      });
      form
        .querySelector("[data-cancel]")
        .addEventListener("click", () => overlay.remove());
      document.body.appendChild(overlay);
    }
  });
}

function row(p) {
  const cover = (Array.isArray(p.images) && p.images[0]) || p.image;
  const money = (() => {
    const c = getSettings()?.currency || "USD";
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: c,
      }).format(+p.price || 0);
    } catch {
      return `$${p.price.toFixed(2)}`;
    }
  })();
  return `<tr class="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"><td class="py-2">${
    p.name
  }</td><td>${money}</td><td>${p.category || "-"}</td><td>${
    p.stock ?? "-"
  }</td><td>${
    cover
      ? `<img src="${cover}" alt="${p.name}" class="h-10 w-14 object-cover rounded border border-slate-200 dark:border-slate-700"/>`
      : "-"
  }</td><td class="py-2 text-right space-x-2"><button data-action="edit" data-id="${
    p.id
  }" class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700">Edit</button><button data-action="delete" data-id="${
    p.id
  }" class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white">Delete</button></td></tr>`;
}
