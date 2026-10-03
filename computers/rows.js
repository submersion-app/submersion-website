// Rows, search, filters and URL state for the support matrix. Pure, so the
// tests drive it without a browser; page.js wires it to the page.
import { cellStatus } from "./status.js";

export const PLATFORMS = ["ios", "android", "macos", "windows", "linux"];
export const FAMILIES = ["bluetooth", "usb"];
export const STATUSES = ["verified", "issues", "not-working", "untested", "na"];
const STATE_KEYS = ["q", "brand", "platform", "status", "transport"];
const ENUMS = { platform: PLATFORMS, status: STATUSES, transport: FAMILIES };

const byText = (a, b) => a.localeCompare(b, "en", { sensitivity: "base", numeric: true });
// "+" is part of some names (Puck Pro +), so it reads as "plus", as in the ids.
const squash = (text) => text.toLowerCase().replace(/\+/g, "plus").replace(/[^a-z0-9]+/g, "");

export function buildRows(catalog, reports) {
  const byCell = new Map();
  for (const r of reports) {
    const key = `${r.model}|${r.transport}|${r.platform}`;
    if (!byCell.has(key)) byCell.set(key, []);
    byCell.get(key).push(r);
  }
  const rows = [];
  for (const model of catalog.models) {
    for (const family of FAMILIES) {
      if (!PLATFORMS.some((p) => model.platforms[p].includes(family))) continue;
      const cells = {};
      for (const p of PLATFORMS) {
        cells[p] = cellStatus(byCell.get(`${model.id}|${family}|${p}`) ?? [], model.platforms[p].includes(family));
      }
      rows.push({ id: model.id, vendor: model.vendor, product: model.product, family, cells, hasEvidence: false });
    }
  }
  const withEvidence = new Set(
    rows.filter((row) => PLATFORMS.some((p) => row.cells[p].reports)).map((row) => row.id),
  );
  return rows
    .map((row) => ({ ...row, hasEvidence: withEvidence.has(row.id) }))
    .sort(
      (a, b) =>
        byText(a.vendor, b.vendor) ||
        Number(b.hasEvidence) - Number(a.hasEvidence) ||
        byText(a.product, b.product) ||
        FAMILIES.indexOf(a.family) - FAMILIES.indexOf(b.family),
    );
}

export function filterRows(rows, state) {
  const tokens = (state.q ?? "").split(/\s+/).map(squash).filter(Boolean);
  return rows.filter((row) => {
    const text = squash(`${row.vendor} ${row.product}`);
    if (!tokens.every((token) => text.includes(token))) return false;
    if (state.brand && row.vendor !== state.brand) return false;
    if (state.transport && row.family !== state.transport) return false;
    if (state.platform && !state.status && row.cells[state.platform].status === "na") return false;
    const platforms = state.platform ? [state.platform] : PLATFORMS;
    if (state.status && !platforms.some((p) => row.cells[p].status === state.status)) return false;
    return true;
  });
}

export function vendorsOf(rows) {
  return [...new Set(rows.map((row) => row.vendor))].sort(byText);
}

export function parseState(search) {
  const params = new URLSearchParams(search);
  const state = {};
  for (const key of STATE_KEYS) {
    const value = params.get(key) ?? "";
    state[key] = ENUMS[key] && !ENUMS[key].includes(value) ? "" : value;
  }
  return state;
}

export function stateToSearch(state) {
  const params = new URLSearchParams();
  for (const key of STATE_KEYS) if (state[key]) params.set(key, state[key]);
  const text = params.toString();
  return text ? `?${text}` : "";
}

// The address to replaceState to. An empty string there would keep the old
// query, so the path is always spelled out.
export function urlFor(pathname, state, hash) {
  return `${pathname}${stateToSearch(state)}${hash}`;
}

// The model id in a location hash, or "" when the hash is empty or is not
// valid percent-encoding (decodeURIComponent throws on "#%E0").
export function hashTarget(hash) {
  try {
    return decodeURIComponent(hash.slice(1));
  } catch {
    return "";
  }
}

// Filters to apply so the model in the hash is on screen: the current ones
// when they show it, none when they hide it, null when the hash is no model.
export function revealTarget(rows, state, id) {
  if (!rows.some((row) => row.id === id)) return null;
  if (filterRows(rows, state).some((row) => row.id === id)) return state;
  return Object.fromEntries(STATE_KEYS.map((key) => [key, ""]));
}
