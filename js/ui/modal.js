export function confirmDialog({
  title = "Are you sure?",
  message = "",
  okText = "Confirm",
  cancelText = "Cancel",
} = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    // High z-index to ensure dialogs sit above dropdowns and header elements
    overlay.className =
      "fixed inset-0 z-[1000] grid place-items-center bg-slate-900/50 backdrop-blur-sm animate-fadeIn";
    overlay.innerHTML = `
      <div class="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-2xl">
        <h3 class="font-bold mb-2">${title}</h3>
        <p class="text-sm text-slate-600 dark:text-slate-300">${message}</p>
        <div class="mt-5 flex justify-end gap-2">
          <button data-action="cancel" class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">${cancelText}</button>
          <button data-action="ok" class="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white">${okText}</button>
        </div>
      </div>`;
    function close(val) {
      overlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150 });
      setTimeout(() => {
        overlay.remove();
        resolve(val);
      }, 140);
    }
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close(false);
    });
    overlay
      .querySelector('[data-action="cancel"]')
      .addEventListener("click", () => close(false));
    overlay
      .querySelector('[data-action="ok"]')
      .addEventListener("click", () => close(true));
    document.body.appendChild(overlay);
  });
}
