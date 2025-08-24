import { mount } from "../app.js";
import { getClients, getTransactions } from "../storage.js";

export function renderDashboard() {
  mount((root) => {
    const clients = getClients();
    const active = clients.filter((c) => c.status === "Active").length;
    const inactive = clients.filter((c) => c.status !== "Active").length;
    const upcoming = clients.filter(
      (c) => daysUntilBirthday(c.birthday) <= 30
    ).length;

    root.innerHTML = `
      <div class="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        ${card("Total Clients", clients.length, "from-brand-500 to-purple-500")}
        ${card("Active", active, "from-emerald-500 to-teal-500")}
        ${card("Inactive", inactive, "from-amber-500 to-orange-500")}
        ${card("Birthdays (30d)", upcoming, "from-pink-500 to-rose-500")}
      </div>

      <div class="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div class="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-soft">
          <h3 class="font-bold mb-4">Recent Clients</h3>
          <div class="divide-y divide-slate-100 dark:divide-slate-700">
            ${clients
              .slice(-5)
              .reverse()
              .map(
                (c) => `
              <div class="py-3 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-500 to-purple-500 text-white grid place-items-center">${
                    c.name[0]
                  }</div>
                  <div>
                    <div class="font-semibold">${c.name}</div>
                    <div class="text-sm text-slate-500">${c.email}</div>
                  </div>
                </div>
                <span class="text-xs px-2 py-1 rounded-full ${
                  c.status === "Active"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                }">${c.status}</span>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
        <div class="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-soft">
          <h3 class="font-bold mb-4">Activity</h3>
          <ul class="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <li>✅ Logged in</li>
            <li>🆕 Added 2 new clients</li>
            <li>🎯 Updated campaign settings</li>
          </ul>
        </div>
      </div>
    `;
  });
}

function card(title, value, gradient) {
  return `
    <div class="group rounded-2xl p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-soft hover:shadow-lg transition transform hover:-translate-y-0.5">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm text-slate-500">${title}</div>
          <div class="text-3xl font-extrabold mt-1">${value}</div>
        </div>
        <div class="h-12 w-12 rounded-xl text-white grid place-items-center bg-gradient-to-tr ${gradient}">★</div>
      </div>
    </div>`;
}

function daysUntilBirthday(iso) {
  const now = new Date();
  const b = new Date(iso);
  let next = new Date(now.getFullYear(), b.getMonth(), b.getDate());
  if (next < now)
    next = new Date(now.getFullYear() + 1, b.getMonth(), b.getDate());
  return Math.ceil((next - now) / (1000 * 60 * 60 * 24));
}
