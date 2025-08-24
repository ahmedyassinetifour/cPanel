export function initRouter(routes) {
  function handle() {
    const fn = routes[location.hash] || routes["#/dashboard"];
    const mapTitle = {
      "#/dashboard": "Dashboard",
      "#/clients": "Clients",
      "#/add-client": "Add Client",
      "#/birthdays": "Birthdays",
      "#/statistics": "Statistics",
      "#/settings": "Settings",
      "#/products": "Products",
    };
    document.getElementById("page-title").textContent =
      mapTitle[location.hash] || "Dashboard";
    fn?.();
  }
  window.addEventListener("hashchange", handle);
  handle();
}

export function navigate(hash) {
  location.hash = hash;
}
