// Folds a sweep's candidate reports into computers/data/reports.json: drops
// ones already recorded, keeps only report fields, keeps a stable order so
// monthly diffs stay small, and advances only the watermarks the sweep sets.
//   node tools/support-matrix/merge.mjs <sweep.json>
// sweep.json is { "reports": [...], "watermarks": { "<source>": {...} } }.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { cellKey } from "./validate.mjs";

const FIELDS = ["model", "platform", "transport", "outcome", "appVersion", "date", "source", "url", "sourceRef", "fixedIn", "note"];
const NULLABLE = new Set(["appVersion", "sourceRef", "fixedIn"]);
const ORDER = ["model", "transport", "platform", "date", "url", "sourceRef"];

const pick = (r) => Object.fromEntries(FIELDS.map((f) => [f, r[f] ?? (NULLABLE.has(f) ? null : r[f])]));

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
  const seen = new Set(existing.reports.map(cellKey));
  const added = [];
  let duplicates = 0;
  for (const candidate of sweep.reports ?? []) {
    const report = pick(candidate);
    const key = cellKey(report);
    if (seen.has(key)) {
      duplicates++;
      continue;
    }
    seen.add(key);
    added.push(report);
  }
  return {
    data: {
      watermarks: { ...existing.watermarks, ...(sweep.watermarks ?? {}) },
      reports: sortReports([...existing.reports, ...added]),
    },
    added: added.length,
    duplicates,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const target = new URL("../../computers/data/reports.json", import.meta.url);
  const existing = JSON.parse(readFileSync(target, "utf8"));
  const sweep = JSON.parse(readFileSync(process.argv[2], "utf8"));
  const { data, added, duplicates } = mergeReports(existing, sweep);
  writeFileSync(target, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`added ${added}, skipped ${duplicates} already recorded`);
}
