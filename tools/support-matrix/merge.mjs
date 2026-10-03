// Folds a sweep's candidate reports into computers/data/reports.json: skips
// ones already recorded unless they carry a newer fixedIn, keeps only report
// fields, keeps a stable order so monthly diffs stay small, and advances only
// the watermarks the sweep sets.
//   node tools/support-matrix/merge.mjs <sweep.json>
// sweep.json is { "reports": [...], "watermarks": { "<source>": {...} } }.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { cellKey } from "./validate.mjs";

const FIELDS = ["model", "platform", "transport", "outcome", "appVersion", "date", "source", "url", "sourceRef", "fixedIn", "note"];
const NULLABLE = new Set(["appVersion", "sourceRef", "fixedIn"]);
const ORDER = ["model", "transport", "platform", "date", "url", "sourceRef"];

// fixedBy (the fixing PR) is kept only while the fix is unreleased, so a later
// sweep can resolve it to the release that ships it.
function pick(r) {
  if (r.fixedBy != null && r.fixedIn == null) {
    throw new Error(`${r.url}: fixedBy ${r.fixedBy} was never resolved to fixedIn; run SWEEP.md step 3 first`);
  }
  const report = Object.fromEntries(FIELDS.map((f) => [f, r[f] ?? (NULLABLE.has(f) ? null : r[f])]));
  return report.fixedIn === "unreleased" ? { ...report, fixedBy: r.fixedBy ?? null } : report;
}

// null < "unreleased" < a release version: a sweep may move fixedIn up, never down.
const fixRank = (fixedIn) => (fixedIn == null ? 0 : fixedIn === "unreleased" ? 1 : 2);

export function sortReports(reports) {
  return [...reports].sort((a, b) => {
    for (const key of ORDER) {
      const x = String(a[key] ?? "");
      const y = String(b[key] ?? "");
      if (x !== y) return x < y ? -1 : 1;
    }
    return 0;
  });
}

export function mergeReports(existing, sweep) {
  const byKey = new Map(existing.reports.map((r) => [cellKey(r), r]));
  let added = 0;
  let duplicates = 0;
  let upgraded = 0;
  for (const candidate of sweep.reports ?? []) {
    const report = pick(candidate);
    const key = cellKey(report);
    const stored = byKey.get(key);
    if (!stored) {
      byKey.set(key, report);
      added++;
    } else if (fixRank(report.fixedIn) > fixRank(stored.fixedIn)) {
      const { fixedBy, ...rest } = stored;
      byKey.set(key, pick({ ...rest, fixedIn: report.fixedIn, fixedBy: report.fixedBy }));
      upgraded++;
    } else {
      duplicates++;
    }
  }
  return {
    data: {
      watermarks: { ...existing.watermarks, ...(sweep.watermarks ?? {}) },
      reports: sortReports([...byKey.values()]),
    },
    added,
    duplicates,
    upgraded,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const target = new URL("../../computers/data/reports.json", import.meta.url);
  const existing = JSON.parse(readFileSync(target, "utf8"));
  const sweep = JSON.parse(readFileSync(process.argv[2], "utf8"));
  const { data, added, duplicates, upgraded } = mergeReports(existing, sweep);
  writeFileSync(target, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`added ${added}, upgraded fixedIn on ${upgraded}, skipped ${duplicates} already recorded`);
}
