import { initAuth } from "./auth.js";
import { initRouter, navigate } from "./router.js";
import { buildSidebar } from "./ui/sidebar.js";
import { renderDashboard } from "./pages/dashboard.js";
import { renderClients } from "./pages/clients.js";
import { renderAddClient } from "./pages/addClient.js";
import { renderBirthdays } from "./pages/birthdays.js";
import { renderStats } from "./pages/stats.js";
import { renderSettings } from "./pages/settings.js";
import { setupTheme } from "./theme.js";
import { renderProducts } from "./pages/products.js";
import { renderOrders } from "./pages/orders.js";
import { renderMessages } from "./pages/messages.js";
import { initStorage, getAvatar, getClients } from "./storage.js";

// Lightweight SPA bootstrap
const routes = {
  "#/dashboard": renderDashboard,
  "#/clients": renderClients,
  "#/add-client": renderAddClient,
  "#/birthdays": renderBirthdays,
  "#/statistics": renderStats,
  "#/settings": renderSettings,
  "#/products": renderProducts,
  "#/orders": renderOrders,
  "#/messages": renderMessages,
};

const sidebarItems = [
  { key: "dashboard", label: "Dashboard", href: "#/dashboard", icon: "📊" },
  { key: "clients", label: "Clients", href: "#/clients", icon: "👥" },
  { key: "add-client", label: "Add Client", href: "#/add-client", icon: "➕" },
  { key: "birthdays", label: "Birthdays", href: "#/birthdays", icon: "🎂" },
  { key: "statistics", label: "Statistics", href: "#/statistics", icon: "📈" },
  { key: "products", label: "Products", href: "#/products", icon: "🛒" },
  { key: "orders", label: "Orders", href: "#/orders", icon: "📦" },
  { key: "messages", label: "Messages", href: "#/messages", icon: "💬" },
  { key: "settings", label: "Settings", href: "#/settings", icon: "⚙️" },
];

const content = document.getElementById("content");
const pageTitle = document.getElementById("page-title");

function setTitle(text) {
  pageTitle.textContent = text;
}

export function mount(view) {
  content.innerHTML = "";
  requestAnimationFrame(() => {
    view(content);
    content.animate(
      [
        { opacity: 0, transform: "translateY(6px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)" }
    );
  });
}

function init() {
  initStorage();
  setupTheme();
  initAuth();
  buildSidebar(sidebarItems);
  initRouter(routes);

  // UI wiring
  document.getElementById("mobile-menu").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("hidden");
  });
  document.getElementById("toggle-theme").addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    localStorage.setItem(
      "theme",
      document.documentElement.classList.contains("dark") ? "dark" : "light"
    );
  });

  // Avatar dropdown (Profile/Settings/Logout)
  // Target the dedicated avatar element (not the bell or its badge)
  const avatarEl = document.getElementById("avatar");
  const saved = getAvatar();
  if (saved)
    (avatarEl.style.backgroundImage = `url(${saved})`),
      (avatarEl.style.backgroundSize = "cover"),
      (avatarEl.textContent = "");
  // React to avatar updates from Settings
  window.addEventListener("avatar-updated", (e) => {
    const src = e.detail?.src || getAvatar();
    if (src) {
      avatarEl.style.backgroundImage = `url(${src})`;
      avatarEl.style.backgroundSize = "cover";
      avatarEl.textContent = "";
    }
  });
  // Dropdown positioning helper: fixed and anchored to the trigger so it never overlaps/gets hidden
  function positionBelow(anchorEl, ddEl) {
    const rect = anchorEl.getBoundingClientRect();
    ddEl.style.position = "fixed";
    const top = Math.round(rect.bottom + 8); // 8px gap below trigger
    const width = ddEl.offsetWidth || 192; // fallback width
    let left = Math.round(rect.right - width); // align right edge
    const vw = Math.max(
      document.documentElement.clientWidth,
      window.innerWidth || 0
    );
    left = Math.max(8, Math.min(left, vw - width - 8)); // clamp to viewport
    ddEl.style.top = `${top}px`;
    ddEl.style.left = `${left}px`;
  }

  const header = document.querySelector(
    "header .flex.items-center.justify-between"
  );

  // Profile dropdown (appended to body with z-index to stay above header)
  const profileDD = document.createElement("div");
  profileDD.className =
    "hidden z-50 w-48 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg";
  profileDD.innerHTML = `<button data-act="profile" class="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700">Profile</button><button data-act="settings" class="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700">Settings</button><button data-act="logout" class="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700">Logout</button>`;
  document.body.appendChild(profileDD);
  avatarEl.style.cursor = "pointer";
  let profileOpen = false;
  function openProfileDD() {
    profileDD.classList.remove("hidden");
    requestAnimationFrame(() => positionBelow(avatarEl, profileDD));
    profileOpen = true;
  }
  function closeProfileDD() {
    profileDD.classList.add("hidden");
    profileOpen = false;
  }
  avatarEl.addEventListener("click", (e) => {
    e.stopPropagation();
    // Close notifications if open
    if (typeof closeBellDD === "function") closeBellDD();
    profileOpen ? closeProfileDD() : openProfileDD();
  });
  profileDD
    .querySelector('[data-act="settings"]')
    .addEventListener("click", () => {
      profileDD.classList.add("hidden");
      navigate("#/settings");
    });
  profileDD
    .querySelector('[data-act="profile"]')
    .addEventListener("click", () => {
      profileDD.classList.add("hidden");
      alert("Profile placeholder");
    });
  profileDD
    .querySelector('[data-act="logout"]')
    .addEventListener("click", () => {
      localStorage.removeItem("session");
      location.reload();
    });

  // Bell notifications (birthdays next 7 days)
  const bell = document.getElementById("notify-bell");
  const countEl = document.getElementById("notify-count");
  const bellDD = document.createElement("div");
  bellDD.className =
    "hidden z-50 w-72 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg max-h-80 overflow-auto";
  document.body.appendChild(bellDD);
  function daysUntil(date) {
    const now = new Date();
    const b = new Date(date);
    let next = new Date(now.getFullYear(), b.getMonth(), b.getDate());
    if (next < now)
      next = new Date(now.getFullYear() + 1, b.getMonth(), b.getDate());
    return Math.ceil((next - now) / (1000 * 60 * 60 * 24));
  }
  function refreshBell() {
    const clients = getClients();
    const items = clients
      .map((c) => ({
        id: c.id,
        name: c.name,
        birthday: c.birthday,
        days: daysUntil(c.birthday),
      }))
      .filter((x) => x.days >= 0 && x.days <= 7)
      .sort((a, b) => a.days - b.days);

    // Badge
    if (items.length > 0) {
      countEl.textContent = String(items.length);
      countEl.classList.remove("hidden");
    } else {
      countEl.classList.add("hidden");
    }

    // Dropdown content
    bellDD.innerHTML = items.length
      ? `<div class="p-2">
           ${items
             .map(
               (it) => `
               <button data-id="${
                 it.id
               }" class="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between">
                 <div>
                   <div class="font-medium">${it.name}</div>
                   <div class="text-xs text-slate-500">in ${it.days} day${
                 it.days === 1 ? "" : "s"
               } • ${new Date(it.birthday).toLocaleDateString()}</div>
                 </div>
                 <span>🎂</span>
               </button>`
             )
             .join("")}
           </div>
           <div class="border-t border-slate-200 dark:border-slate-700">
             <button id="view-all-bdays" class="w-full text-center px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700">View Birthdays</button>
           </div>`
      : `<div class="p-4 text-sm text-slate-500">No birthdays in the next 7 days.</div>`;

    const viewAll = bellDD.querySelector("#view-all-bdays");
    if (viewAll)
      viewAll.addEventListener("click", () => {
        bellDD.classList.add("hidden");
        navigate("#/birthdays");
      });
    bellDD.querySelectorAll("button[data-id]").forEach((btn) =>
      btn.addEventListener("click", () => {
        bellDD.classList.add("hidden");
        navigate("#/birthdays");
      })
    );
  }

  // Toggle dropdown on bell click
  let bellOpen = false;
  function openBellDD() {
    refreshBell();
    bellDD.classList.remove("hidden");
    requestAnimationFrame(() => positionBelow(bell, bellDD));
    bellOpen = true;
  }
  function closeBellDD() {
    bellDD.classList.add("hidden");
    bellOpen = false;
  }
  bell.addEventListener("click", (e) => {
    e.stopPropagation();
    // Close profile menu if open
    if (profileOpen) closeProfileDD();
    bellOpen ? closeBellDD() : openBellDD();
  });
  // Close on outside click or Escape key
  document.addEventListener("click", () => {
    if (profileOpen) closeProfileDD();
    if (bellOpen) closeBellDD();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (profileOpen) closeProfileDD();
      if (bellOpen) closeBellDD();
    }
  });
  // Reposition on resize/scroll to avoid misalignment when layout changes
  window.addEventListener("resize", () => {
    if (profileOpen) positionBelow(avatarEl, profileDD);
    if (bellOpen) positionBelow(bell, bellDD);
  });
  window.addEventListener(
    "scroll",
    () => {
      if (profileOpen) positionBelow(avatarEl, profileDD);
      if (bellOpen) positionBelow(bell, bellDD);
    },
    { passive: true }
  );

  // Initial badge state
  refreshBell();

  // Default route
  if (!location.hash) navigate("#/dashboard");
}

window.addEventListener("DOMContentLoaded", init);
