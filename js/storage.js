import { clients as seedClients } from "../data/clients.js";
import { products as seedProducts } from "../data/products.js";
import { transactions as seedTransactions } from "../data/transactions.js";

const KEYS = {
  clients: "cpanel.clients",
  products: "cpanel.products",
  transactions: "cpanel.transactions",
  settings: "cpanel.settings",
  session: "session",
  avatar: "cpanel.avatar",
  orders: "shop.orders", // customer orders (shared with ordering site)
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

export function initStorage() {
  if (!localStorage.getItem(KEYS.clients)) write(KEYS.clients, seedClients);
  if (!localStorage.getItem(KEYS.products)) write(KEYS.products, seedProducts);
  if (!localStorage.getItem(KEYS.transactions))
    write(KEYS.transactions, seedTransactions);
  if (!localStorage.getItem(KEYS.settings))
    write(KEYS.settings, {
      profitMargin: 0.3,
      theme: localStorage.getItem("theme") || "light",
      currency: "USD",
    });
}

// Clients
export const getClients = () => read(KEYS.clients, []);
export function setClients(list) {
  write(KEYS.clients, list);
}

// Products
export const getProducts = () => read(KEYS.products, []);
export function setProducts(list) {
  write(KEYS.products, list);
}

// Transactions
export const getTransactions = () => read(KEYS.transactions, []);
export function setTransactions(list) {
  write(KEYS.transactions, list);
}

// Settings
export const getSettings = () =>
  read(KEYS.settings, { profitMargin: 0.3, theme: "light", currency: "USD" });
export function setSettings(s) {
  write(KEYS.settings, s);
}

// Session & avatar
export const getSession = () => read(KEYS.session, null);
export const setSession = (s) => write(KEYS.session, s);
export const clearSession = () => localStorage.removeItem(KEYS.session);
export const getAvatar = () => read(KEYS.avatar, null);
export const setAvatar = (b64) => write(KEYS.avatar, b64);

// CSV
export function toCSV(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v) => '"' + String(v).replace(/"/g, '""') + '"';
  const csv = [headers.join(",")]
    .concat(rows.map((r) => headers.map((h) => esc(r[h] ?? "")).join(",")))
    .join("\n");
  return csv;
}

export function download(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Orders (customer-facing)
export const getOrders = () => read(KEYS.orders, []);
export function setOrders(list) {
  write(KEYS.orders, list);
}
