import { mount } from "../app.js";
import {
  getClients,
  getTransactions,
  getProducts,
  getSettings,
  toCSV,
  download,
} from "../storage.js";

export function renderStats() {
  mount((root) => {
    const clients = getClients();
    const tx = getTransactions();
    const prods = getProducts();
    const settings = getSettings();
    const revenue = tx.reduce((s, t) => s + t.priceAtPurchase * t.qty, 0);
    const profit = revenue * (settings.profitMargin ?? 0.3);
    const byProd = prods
      .map((p) => ({
        name: p.name,
        revenue: tx
          .filter((t) => t.productId === p.id)
          .reduce((s, t) => s + t.priceAtPurchase * t.qty, 0),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    root.innerHTML = `
      <div class="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <div class="rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-soft">
          <h3 class="font-bold mb-3">Active vs Inactive</h3>
          <canvas id="chart1" height="160"></canvas>
        </div>
        <div class="rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-soft">
          <h3 class="font-bold mb-3">Birthdays by Month</h3>
          <canvas id="chart2" height="160"></canvas>
        </div>
        <div class="rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-soft">
          <h3 class="font-bold mb-3">Revenue & Profit</h3>
          <div class="text-3xl font-extrabold">$${revenue.toFixed(2)}</div>
          <div class="text-sm text-slate-500">Profit est. ($${profit.toFixed(
            2
          )})</div>
        </div>
        <div class="rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-soft">
          <h3 class="font-bold mb-3">Top Products</h3>
          <ul class="space-y-2 text-sm">${byProd
            .map(
              (p) =>
                `<li class="flex justify-between"><span>${
                  p.name
                }</span><span class="font-semibold">$${p.revenue.toFixed(
                  2
                )}</span></li>`
            )
            .join("")}</ul>
        </div>
        <div class="lg:col-span-2 flex items-center justify-end gap-2">
          <button id="export-clients" class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">Export Clients CSV</button>
          <button id="export-trans" class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">Export Transactions CSV</button>
        </div>
      </div>
    `;

    requestAnimationFrame(() => {
      // Derive Active/Inactive by last purchase within 90 days
      const txByClient = new Map();
      getTransactions().forEach((t) => {
        const arr = txByClient.get(t.clientId) || [];
        arr.push(t);
        txByClient.set(t.clientId, arr);
      });
      const now = Date.now();
      const cutoff = 90 * 24 * 60 * 60 * 1000;
      let active = 0;
      clients.forEach((c) => {
        const arr = txByClient.get(c.id) || [];
        const last = arr.reduce(
          (m, t) => Math.max(m, new Date(t.date).getTime()),
          0
        );
        if (last && now - last <= cutoff) active++;
      });
      const inactive = clients.length - active;

      new Chart(document.getElementById("chart1"), {
        type: "doughnut",
        data: {
          labels: ["Active", "Inactive"],
          datasets: [
            {
              data: [active, inactive],
              backgroundColor: ["#22c55e", "#a78bfa"],
            },
          ],
        },
        options: { plugins: { legend: { position: "bottom" } }, cutout: "65%" },
      });

      const months = Array.from({ length: 12 }, (_, i) => i);
      const counts = months.map(
        (m) =>
          clients.filter((c) => new Date(c.birthday).getMonth() === m).length
      );
      new Chart(document.getElementById("chart2"), {
        type: "bar",
        data: {
          labels: [
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
          ],
          datasets: [
            { label: "Birthdays", data: counts, backgroundColor: "#60a5fa" },
          ],
        },
        options: {
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        },
      });
    });

    // CSV exports
    root.querySelector("#export-clients").addEventListener("click", () => {
      const csv = toCSV(clients);
      download("clients.csv", csv);
    });
    root.querySelector("#export-trans").addEventListener("click", () => {
      const csv = toCSV(getTransactions());
      download("transactions.csv", csv);
    });
  });
}
