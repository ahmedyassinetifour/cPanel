import { navigate } from "../router.js";

export function buildSidebar(items) {
  const nav = document.getElementById("sidebar-nav");
  nav.innerHTML = "";
  items.forEach(({ label, href, icon }) => {
    const a = document.createElement("a");
    a.href = href;
    a.className =
      "group flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition";
    a.innerHTML = `<span class="text-lg">${icon}</span><span class="font-medium">${label}</span>`;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(href);
      document
        .querySelectorAll("#sidebar-nav a")
        .forEach((el) =>
          el.classList.remove("bg-slate-100", "dark:bg-slate-700")
        );
      a.classList.add("bg-slate-100", "dark:bg-slate-700");
    });
    nav.appendChild(a);
  });

  function markActive() {
    const hash = location.hash || "#/dashboard";
    document.querySelectorAll("#sidebar-nav a").forEach((el) => {
      if (el.getAttribute("href") === hash)
        el.classList.add("bg-slate-100", "dark:bg-slate-700");
      else el.classList.remove("bg-slate-100", "dark:bg-slate-700");
    });
  }
  window.addEventListener("hashchange", markActive);
  markActive();
}
