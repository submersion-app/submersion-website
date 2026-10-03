// Markup for the support matrix, as HTML strings so node --test can check it
// without a browser. Every value that comes from the data passes through
// escapeHtml.
import { PLATFORMS } from "./rows.js";

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);

export const STATUS_TEXT = {
  verified: "Verified",
  issues: "Issues",
  "not-working": "Not working",
  untested: "Untested",
  na: "n/a",
};
export const PLATFORM_TEXT = { ios: "iOS", android: "Android", macos: "macOS", windows: "Windows", linux: "Linux" };
export const FAMILY_TEXT = { bluetooth: "Bluetooth", usb: "USB" };
const OUTCOME_TEXT = { works: "Works", caveats: "Works with caveats", fails: "Fails" };

export function sourceText(report) {
  switch (report.source) {
    case "github-issue":
    case "github-pr": {
      const number = /\/(?:issues|pull)\/(\d+)/.exec(report.url);
      return number ? `GitHub #${number[1]}` : "GitHub";
    }
    case "github-discussion":
      return "GitHub discussion";
    case "scubaboard":
      return "ScubaBoard post";
    case "reddit":
      return "Reddit";
    case "app-store":
      return "App Store review";
    case "play-store":
      return "Google Play review";
    default:
      return "Source";
  }
}

function cellHtml(row, platform) {
  const cell = row.cells[platform];
  const text = STATUS_TEXT[cell.status];
  const cls = `cell cell--${cell.status}`;
  if (!cell.reports) return `<span class="${cls}">${text}</span>`;
  const key = escapeHtml(`${row.id}|${row.family}|${platform}`);
  const label = escapeHtml(
    `${row.vendor} ${row.product}, ${FAMILY_TEXT[row.family]}, ${PLATFORM_TEXT[platform]}: ${text}. Show reports`,
  );
  return `<button type="button" class="${cls}" data-cell="${key}" aria-expanded="false" aria-label="${label}">${text}</button>`;
}

export function renderRows(rows) {
  const out = [];
  const seen = new Set();
  let vendor = null;
  for (const row of rows) {
    if (row.vendor !== vendor) {
      vendor = row.vendor;
      out.push(`<tr class="vendor"><th colspan="7" scope="colgroup">${escapeHtml(vendor)}</th></tr>`);
    }
    const anchor = seen.has(row.id) ? "" : ` id="${escapeHtml(row.id)}"`;
    seen.add(row.id);
    const cells = PLATFORMS.map(
      (p) => `<td class="platform" data-label="${PLATFORM_TEXT[p]}">${cellHtml(row, p)}</td>`,
    ).join("");
    out.push(
      `<tr data-model="${escapeHtml(row.id)}"${anchor}><th scope="row">${escapeHtml(row.product)}</th>` +
        `<td class="transport">${FAMILY_TEXT[row.family]}</td>${cells}</tr>`,
    );
  }
  return out.join("\n");
}

function fixText(report) {
  if (report.fixedIn === "unreleased") return " Fix merged, not released yet.";
  if (report.fixedIn) return ` Fixed in v${report.fixedIn}.`;
  return "";
}

export function renderDetail(row, platform) {
  const cell = row.cells[platform];
  const items = cell.reports
    .map((r) => {
      const version = r.appVersion ? `v${r.appVersion}` : "version not stated";
      return (
        `<li><strong>${OUTCOME_TEXT[r.outcome]}</strong> · ${escapeHtml(version)} · ${escapeHtml(r.date)}<br>` +
        `${escapeHtml(r.note)}${escapeHtml(fixText(r))} ` +
        `<a href="${escapeHtml(r.url)}" target="_blank" rel="noreferrer">${escapeHtml(sourceText(r))}</a></li>`
      );
    })
    .join("");
  const label = cell.label ? `<p>${escapeHtml(cell.label)}</p>` : "";
  const key = escapeHtml(`${row.id}|${row.family}|${platform}`);
  const title = `${escapeHtml(`${row.vendor} ${row.product}`)} · ${FAMILY_TEXT[row.family]} · ${PLATFORM_TEXT[platform]}`;
  return `<tr class="detail" data-cell="${key}"><td colspan="7"><h3>${title}</h3>${label}<ul>${items}</ul></td></tr>`;
}

export function renderBrandOptions(vendors) {
  return vendors.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
}

export function renderUnsupported(unsupported) {
  return unsupported.map((m) => `<li>${escapeHtml(m.vendor)} ${escapeHtml(m.product)}</li>`).join("");
}

export function renderProvenance(generatedFrom) {
  const link = (repo, sha) =>
    `<a href="https://github.com/submersion-app/${repo}/commit/${escapeHtml(sha)}">${escapeHtml(sha.slice(0, 7))}</a>`;
  return (
    `Built from libdivecomputer ${link("libdivecomputer", generatedFrom.libdcCommit)} and Submersion ` +
    `${link("submersion", generatedFrom.appCommit)}, last updated ${escapeHtml(generatedFrom.generatedAt.slice(0, 10))}.`
  );
}
