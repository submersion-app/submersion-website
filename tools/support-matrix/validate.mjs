// Checks the support matrix data before it can merge: every report points at
// a real, reachable cell, uses known values, links where its source says it
// does, and appears once. Run: node tools/support-matrix/validate.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { FAMILIES, PLATFORMS } from "../../computers/rows.js";

export const OUTCOMES = ["works", "caveats", "fails"];
export const SOURCES = {
  scubaboard: ["scubaboard.com"],
  "github-issue": ["github.com"],
  "github-pr": ["github.com"],
  "github-discussion": ["github.com"],
  reddit: ["reddit.com"],
  "app-store": ["apps.apple.com"],
  "play-store": ["play.google.com"],
};
const STORE_SOURCES = new Set(["app-store", "play-store"]);
const VERSION = /^\d+(\.\d+){0,3}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const EM_DASH = "\u2014";

const hostMatches = (host, allowed) => allowed.some((a) => host === a || host.endsWith(`.${a}`));

// Two reports are the same evidence when they share a source item and a cell.
// Store reviews share the listing url, so their review id identifies them.
export const cellKey = (r) => [r.sourceRef ?? r.url, r.model, r.platform, r.transport].join("|");

function httpsHost(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.hostname : null;
  } catch {
    return null;
  }
}

export function validate(catalog, data) {
  const errors = [];
  const models = new Map();
  for (const m of [...catalog.models, ...(catalog.unsupported ?? [])]) {
    if (models.has(m.id)) errors.push(`catalog: duplicate id ${m.id}`);
    models.set(m.id, m);
  }
  if (typeof data.watermarks !== "object" || data.watermarks === null) errors.push("reports: watermarks missing");
  if (!Array.isArray(data.reports)) return [...errors, "reports: reports is not a list"];

  const seen = new Set();
  data.reports.forEach((r, i) => {
    const at = `reports[${i}] (${r.model} ${r.platform} ${r.transport})`;
    const model = models.get(r.model);
    if (!model) errors.push(`${at}: unknown model`);
    else if (!model.platforms) errors.push(`${at}: model is unsupported on every platform`);
    if (!PLATFORMS.includes(r.platform)) errors.push(`${at}: unknown platform`);
    if (!FAMILIES.includes(r.transport)) errors.push(`${at}: unknown transport`);
    if (model?.platforms && PLATFORMS.includes(r.platform) && FAMILIES.includes(r.transport)) {
      if (!model.platforms[r.platform].includes(r.transport)) {
        errors.push(`${at}: ${r.transport} is not reachable on ${r.platform}`);
      }
    }
    if (!OUTCOMES.includes(r.outcome)) errors.push(`${at}: unknown outcome ${r.outcome}`);
    if (!(r.source in SOURCES)) {
      errors.push(`${at}: unknown source ${r.source}`);
    } else {
      const host = httpsHost(r.url);
      if (!host) errors.push(`${at}: url is not an https URL`);
      else if (!hostMatches(host, SOURCES[r.source])) errors.push(`${at}: url host ${host} does not match source ${r.source}`);
      const store = STORE_SOURCES.has(r.source);
      if (store && !r.sourceRef) errors.push(`${at}: a store review needs a sourceRef`);
      if (!store && r.sourceRef != null) errors.push(`${at}: only store reviews carry a sourceRef`);
    }
    if (r.appVersion !== null && !VERSION.test(String(r.appVersion))) {
      errors.push(`${at}: appVersion ${r.appVersion} is not a version or null`);
    }
    if (r.fixedIn != null && r.fixedIn !== "unreleased" && !VERSION.test(String(r.fixedIn))) {
      errors.push(`${at}: fixedIn ${r.fixedIn} is not a version or "unreleased"`);
    }
    // An unreleased fix keeps its PR number so a later sweep can find the release.
    if (r.fixedIn === "unreleased") {
      if (!Number.isInteger(r.fixedBy) || r.fixedBy < 1) errors.push(`${at}: an unreleased fix needs fixedBy, the fixing PR number`);
    } else if (r.fixedBy !== undefined) {
      errors.push(`${at}: fixedBy belongs only on a report whose fixedIn is "unreleased"`);
    }
    if (!DATE.test(String(r.date))) errors.push(`${at}: date ${r.date} is not YYYY-MM-DD`);
    if (typeof r.note !== "string" || r.note.length === 0 || r.note.length > 120) {
      errors.push(`${at}: note must be 1 to 120 characters`);
    } else if (r.note.includes(EM_DASH)) {
      errors.push(`${at}: note contains an em dash`);
    }
    const key = cellKey(r);
    if (seen.has(key)) errors.push(`${at}: duplicate of an earlier report`);
    seen.add(key);
  });
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const read = (path) => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), "utf8"));
  const errors = validate(read("computers/data/catalog.json"), read("computers/data/reports.json"));
  for (const error of errors) console.error(error);
  console.log(errors.length ? `${errors.length} problem(s)` : "support matrix data is valid");
  process.exit(errors.length ? 1 : 0);
}
