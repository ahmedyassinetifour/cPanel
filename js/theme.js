export function setupTheme() {
  const pref = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if ((pref && pref === "dark") || (!pref && prefersDark)) {
    document.documentElement.classList.add("dark");
  }
}
