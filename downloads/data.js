// Loads and checks the download summary that the app repo's daily job writes to
// its metrics branch (scripts/snapshot_downloads.py has the counting rules).
// Both the home page line and the downloads page read through here, and anything
// wrong with the data reads as null, so neither can show a bad or stale number.
export const SUMMARY_URL =
  "https://raw.githubusercontent.com/submersion-app/submersion/metrics/downloads/summary.json";
export const MAX_AGE_DAYS = 7;
export const FETCH_TIMEOUT_MS = 5000;
export const TREND_MIN_SNAPSHOTS = 14;
export const PLATFORMS = [
  ["macos", "macOS"],
  ["android", "Android"],
  ["windows", "Windows"],
  ["linux", "Linux"],
];

const DAY_MS = 24 * 60 * 60 * 1000;
const isCount = (value) => Number.isInteger(value) && value >= 0;

// A real calendar day: Date.UTC rolls 2026-10-32 over, so it would not come back.
function isDay(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) === value;
}

function validTotals({ total, platforms }) {
  if (!isCount(total) || platforms === null || typeof platforms !== "object") return false;
  const counts = PLATFORMS.map(([key]) => platforms[key]);
  return counts.every(isCount) && counts.reduce((sum, count) => sum + count, 0) === total;
}

const validRelease = (release) =>
  typeof release?.tag === "string" && isCount(release.downloads);

const validEntry = (entry) => isDay(entry?.date) && validTotals(entry);

// Oldest first with no repeats, ending on the headline total, so the trend can
// never disagree with the number above it.
const validHistory = (history, total) =>
  Array.isArray(history) &&
  history.length > 0 &&
  history.every(validEntry) &&
  history.every((entry, index) => index === 0 || history[index - 1].date < entry.date) &&
  history[history.length - 1].total === total;

// A summary dated ahead of the visitor's clock still passes: a wrong clock does
// not make the numbers wrong.
export function parseSummary(raw, now = new Date()) {
  if (raw === null || typeof raw !== "object" || raw.schema !== 1) return null;
  if (!validTotals(raw) || raw.total === 0) return null;
  if (typeof raw.generated_at !== "string") return null;
  const generated = Date.parse(raw.generated_at);
  if (Number.isNaN(generated) || now.getTime() - generated > MAX_AGE_DAYS * DAY_MS) return null;
  const { recent_releases: releases } = raw;
  if (!Array.isArray(releases) || releases.length === 0 || !releases.every(validRelease)) return null;
  // Recent releases are part of the total, so together they can never exceed it.
  if (releases.reduce((sum, release) => sum + release.downloads, 0) > raw.total) return null;
  return validHistory(raw.history, raw.total) ? raw : null;
}

export const formatCount = (count) => count.toLocaleString("en-US");

// v1.8.3.9095 reads as v1.8.3: the last part is a build number.
export const shortTag = (tag) => tag.replace(/^(v\d+\.\d+\.\d+)\.\d+$/, "$1");

export async function loadSummary({ fetchFn = (...args) => fetch(...args), now = new Date() } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetchFn(SUMMARY_URL, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return parseSummary(await response.json(), now);
  } catch (error) {
    console.error("Failed to load download counts:", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
