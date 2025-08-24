import { mount } from "../app.js";
import { getClients } from "../storage.js";
import { confirmDialog } from "../ui/modal.js";

export function renderBirthdays() {
  mount((root) => {
    const enriched = getClients()
      .map((c) => ({ ...c, days: daysUntilBirthday(c.birthday) }))
      .sort((a, b) => a.days - b.days);

    root.innerHTML = `
      <div class="space-y-4">
        ${enriched
          .map(
            (c) => `
          <div class="rounded-2xl p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-soft flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white grid place-items-center">🎂</div>
              <div>
                <div class="font-semibold">${c.name}</div>
                <div class="text-sm text-slate-500">${new Date(
                  c.birthday
                ).toLocaleDateString()}</div>
                <div class="text-xs text-slate-400">Valid discount window: ${validWindow(
                  c.birthday
                )}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-xs text-slate-500">Days remaining</div>
              <div class="text-2xl font-extrabold">${c.days}</div>
              <button data-act="discount" data-email="${
                c.email
              }" class="mt-2 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white">Send discount</button>
            </div>
          </div>`
          )
          .join("")}
      </div>
    `;

    root.querySelectorAll('[data-act="discount"]').forEach((btn) =>
      btn.addEventListener("click", async () => {
        const email = btn.dataset.email;
        const ok = await confirmDialog({
          title: "Send Discount",
          message: `Prepare and send a birthday discount to ${email}?`,
        });
        if (!ok) return;
        const overlay = document.createElement("div");
        // Dark-theme friendly modal with proper contrast
        overlay.className =
          "fixed inset-0 z-[1000] grid place-items-center bg-slate-900/50 backdrop-blur-sm";
        overlay.innerHTML = `<div class="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-2xl text-slate-800 dark:text-slate-100"><h3 class="font-bold mb-2">Prepared Message</h3><textarea class="w-full h-40 rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400">Hi! Wishing you a wonderful birthday 🎉 Enjoy 20% off any service this month. Use code BDAY20 at checkout.</textarea><div class="mt-3 text-right"><button class="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white" data-close>Mark as Sent</button></div></div>`;
        overlay.addEventListener("click", (e) => {
          if (e.target === overlay) overlay.remove();
        });
        overlay
          .querySelector("[data-close]")
          .addEventListener("click", () => overlay.remove());
        document.body.appendChild(overlay);
      })
    );
  });
}

function daysUntilBirthday(iso) {
  const now = new Date();
  const b = new Date(iso);
  let next = new Date(now.getFullYear(), b.getMonth(), b.getDate());
  if (next < now)
    next = new Date(now.getFullYear() + 1, b.getMonth(), b.getDate());
  return Math.ceil((next - now) / (1000 * 60 * 60 * 24));
}

function validWindow(iso) {
  const b = new Date(iso);
  const start = new Date(new Date().getFullYear(), b.getMonth(), b.getDate());
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return `${start.toLocaleDateString()} → ${end.toLocaleDateString()}`;
}
