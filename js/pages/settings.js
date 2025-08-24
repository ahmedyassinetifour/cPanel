import { mount } from "../app.js";
import { getAvatar, setAvatar, getSettings, setSettings } from "../storage.js";

export function renderSettings() {
  mount((root) => {
    const theme = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    const settings = getSettings();
    const avatar = getAvatar();
    root.innerHTML = `
      <div class="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <div class="rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-soft space-y-4">
          <h3 class="font-bold">Appearance</h3>
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">Theme</div>
              <div class="text-sm text-slate-500">Toggle light/dark mode</div>
            </div>
            <button id="theme-toggle" class="px-4 py-2 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">${
              theme === "dark" ? "Dark" : "Light"
            }</button>
          </div>
        </div>
        <div class="rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-soft space-y-4">
          <h3 class="font-bold">Business & Profile</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-xs text-slate-500">Business Name</label>
              <input id="biz-name" class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" placeholder="Acme Co." />
            </div>
            <div>
              <label class="text-xs text-slate-500">Phone</label>
              <input id="biz-phone" class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" placeholder="+1 555 000 0000" />
            </div>
            <div class="sm:col-span-2">
              <label class="text-xs text-slate-500">Address</label>
              <input id="biz-address" class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" placeholder="123 Main St" />
            </div>
            <div>
              <label class="text-xs text-slate-500">Profit Margin (0–1)</label>
              <input id="profit" type="number" step="0.01" min="0" max="1" value="${
                settings.profitMargin ?? 0.3
              }" class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" />
              <p class="mt-1 text-xs text-slate-500">Used for profit estimates on the Statistics page only.</p>
            </div>
            <div>
              <label class="text-xs text-slate-500">Currency</label>
              <select id="currency" class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent">
                ${currencyOptions(settings.currency)}
              </select>
              <p class="mt-1 text-xs text-slate-500">Used across Products, Orders, and the shop.</p>
            </div>
            <div class="flex items-center gap-3">
              <div class="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden" id="avatar-preview" style="${
                avatar
                  ? `background-image:url(${avatar}); background-size:cover; background-position:center;`
                  : ""
              }">${avatar ? "" : "🧑"}</div>
              <label class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">Upload Avatar<input id="avatar-input" type="file" accept="image/*" class="hidden"></label>
            </div>
          </div>
          <button id="save" class="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white">Save</button>
        </div>
      </div>
    `;

    root.querySelector("#theme-toggle").addEventListener("click", () => {
      document.documentElement.classList.toggle("dark");
      localStorage.setItem(
        "theme",
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      );
      renderSettings();
    });

    // Avatar upload: read as Data URL -> save to localStorage -> update preview -> broadcast to header
    const input = root.querySelector("#avatar-input");
    const preview = root.querySelector("#avatar-preview");
    input.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const fr = new FileReader();
      fr.onload = () => {
        setAvatar(fr.result);
        preview.style.backgroundImage = `url(${fr.result})`;
        preview.style.backgroundSize = "cover";
        preview.style.backgroundPosition = "center";
        preview.textContent = "";
        window.dispatchEvent(
          new CustomEvent("avatar-updated", { detail: { src: fr.result } })
        );
      };
      fr.readAsDataURL(file);
    });

    // Save business + profit + currency
    root.querySelector("#save").addEventListener("click", () => {
      const next = {
        ...settings,
        profitMargin: Math.max(
          0,
          Math.min(1, parseFloat(root.querySelector("#profit").value) || 0.3)
        ),
        currency: root.querySelector("#currency").value || "USD",
      };
      setSettings(next);
      const toast = document.createElement("div");
      toast.className =
        "fixed bottom-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg";
      toast.textContent = "Saved";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 1500);
    });
  });
}

function currencyOptions(sel = "USD") {
  const list = [
    ["USD", "US Dollar"],
    ["EUR", "Euro"],
    ["GBP", "British Pound"],
    ["DZD", "Algerian Dinar"],
    ["AED", "UAE Dirham"],
    ["SAR", "Saudi Riyal"],
    ["EGP", "Egyptian Pound"],
    ["MAD", "Moroccan Dirham"],
    ["TND", "Tunisian Dinar"],
  ];
  return list
    .map(
      ([c, l]) =>
        `<option value="${c}" ${
          c === sel ? "selected" : ""
        }>${c} — ${l}</option>`
    )
    .join("");
}
