import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildRows } from "../computers/rows.js";
import {
  escapeHtml,
  renderBrandOptions,
  renderDetail,
  renderProvenance,
  renderRows,
  renderUnsupported,
  reportUrl,
  sourceText,
} from "../computers/render.js";

const catalog = JSON.parse(
  readFileSync(new URL("./fixtures/support-matrix-catalog.json", import.meta.url), "utf8"),
);

const report = (over = {}) => ({
  model: "shearwater-perdix-3",
  platform: "android",
  transport: "bluetooth",
  outcome: "works",
  appVersion: "1.8.0",
  date: "2026-09-01",
  source: "github-issue",
  url: "https://github.com/submersion-app/submersion/issues/723",
  sourceRef: null,
  fixedIn: null,
  note: "Downloaded 40 dives",
  ...over,
});

test("escapeHtml escapes the five characters", () => {
  assert.equal(escapeHtml(`<a href="x">'&'</a>`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
});

test("rows are grouped under vendor headings", () => {
  const html = renderRows(buildRows(catalog, []));
  const vendors = [...html.matchAll(/<tr class="vendor"><th colspan="7" scope="colgroup">([^<]+)</g)].map((m) => m[1]);
  assert.deepEqual(vendors, ["Mares", "Scubapro", "Shearwater"]);
});

test("only a model's first row carries its id", () => {
  const html = renderRows(buildRows(catalog, []));
  assert.equal(html.match(/id="scubapro-g2"/g).length, 1);
  assert.equal(html.match(/data-model="scubapro-g2"/g).length, 2);
});

test("cells without reports are text, cells with reports are buttons", () => {
  const html = renderRows(buildRows(catalog, [report()]));
  assert.match(html, /<span class="cell cell--na">n\/a<\/span>/);
  assert.match(html, /<span class="cell cell--untested">Untested<\/span>/);
  assert.match(
    html,
    /<button type="button" class="cell cell--verified" data-cell="shearwater-perdix-3\|bluetooth\|android" aria-expanded="false" aria-label="Shearwater Perdix 3, Bluetooth, Android: Verified\. Show reports">Verified<\/button>/,
  );
});

test("data values are escaped", () => {
  const evil = { ...catalog, models: [{ ...catalog.models[2], product: "<img src=x onerror=alert(1)>" }] };
  const html = renderRows(buildRows(evil, []));
  assert.ok(!html.includes("<img"));
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

test("detail lists reports newest first with sources and fix state", () => {
  const rows = buildRows(catalog, [
    report({ appVersion: "1.7.2", outcome: "fails", fixedIn: "1.7.3", note: "Name not <recognized>" }),
    report({ appVersion: "1.8.0", url: "https://scubaboard.com/community/threads/x.667061/post-1", source: "scubaboard" }),
  ]);
  const html = renderDetail(rows.find((r) => r.id === "shearwater-perdix-3"), "android");
  assert.match(html, /^<tr class="detail" data-cell="shearwater-perdix-3\|bluetooth\|android"><td colspan="7">/);
  assert.match(html, /<h3>Shearwater Perdix 3 · Bluetooth · Android<\/h3>/);
  const scuba = html.indexOf("ScubaBoard post");
  const github = html.indexOf("GitHub #723");
  assert.ok(scuba > 0 && github > scuba, "newest report first");
  assert.match(html, /Name not &lt;recognized&gt;/);
  assert.match(html, /Fixed in v1\.7\.3\./);
  assert.match(html, /rel="noreferrer"/);
});

test("sourceText names each source", () => {
  assert.equal(sourceText(report()), "GitHub #723");
  assert.equal(sourceText(report({ source: "github-pr", url: "https://github.com/submersion-app/submersion/pull/1465" })), "GitHub #1465");
  assert.equal(sourceText(report({ source: "github-discussion" })), "GitHub discussion");
  assert.equal(sourceText(report({ source: "reddit" })), "Reddit");
  assert.equal(sourceText(report({ source: "app-store" })), "App Store review");
  assert.equal(sourceText(report({ source: "play-store" })), "Google Play review");
});

test("brand options, unsupported list and provenance", () => {
  assert.equal(renderBrandOptions(["Mares", "A&B"]), '<option value="Mares">Mares</option><option value="A&amp;B">A&amp;B</option>');
  assert.equal(renderUnsupported(catalog.unsupported), "<li>Uwatec Aladin 2G</li>");
  const html = renderProvenance(catalog.generatedFrom);
  assert.match(html, /href="https:\/\/github\.com\/submersion-app\/libdivecomputer\/commit\/b{40}"/);
  assert.match(html, /href="https:\/\/github\.com\/submersion-app\/submersion\/commit\/a{40}"/);
  assert.match(html, /2026-10-02/);
});

const form = (url) => new URL(url);
const perdix = { id: "shearwater-perdix-3", vendor: "Shearwater", product: "Perdix 3", family: "bluetooth" };

test("a row's report link fills in the model and connection", () => {
  const url = form(reportUrl(perdix));
  assert.equal(url.origin + url.pathname, "https://github.com/submersion-app/submersion/issues/new");
  assert.equal(url.searchParams.get("template"), "computer-report.yml");
  assert.equal(url.searchParams.get("labels"), "computer-report");
  assert.equal(url.searchParams.get("title"), "Computer report: Shearwater Perdix 3, Bluetooth");
  assert.equal(url.searchParams.get("model"), "shearwater-perdix-3 (Shearwater Perdix 3)");
  assert.equal(url.searchParams.get("connection"), "Bluetooth");
  assert.equal(url.searchParams.has("platform"), false);
});

test("a cell's report link fills in the platform too", () => {
  const url = form(reportUrl({ ...perdix, platform: "android" }));
  assert.equal(url.searchParams.get("title"), "Computer report: Shearwater Perdix 3, Android, Bluetooth");
  assert.equal(url.searchParams.get("platform"), "Android");
});

test("report links encode spaces as %20, not +", () => {
  const url = reportUrl(perdix);
  assert.match(url, /Shearwater%20Perdix%203/);
  assert.ok(!url.includes("+"));
});

test("the blank report link opens the form with nothing filled in", () => {
  const url = form(reportUrl());
  assert.equal(url.searchParams.get("template"), "computer-report.yml");
  assert.equal(url.searchParams.has("title"), false);
  assert.equal(url.searchParams.has("model"), false);
});

test("every row and every detail panel links to the form", () => {
  const rows = buildRows(catalog, [report()]);
  const html = renderRows(rows);
  assert.equal(html.match(/<a class="report"/g).length, rows.length);
  assert.ok(html.includes(`href="${escapeHtml(reportUrl(rows[0]))}"`));
  assert.match(html, /aria-label="Report your result for Mares Puck Pro \+, Bluetooth"/);
  const perdixRow = rows.find((r) => r.id === "shearwater-perdix-3");
  const detail = renderDetail(perdixRow, "android");
  assert.ok(detail.includes(`href="${escapeHtml(reportUrl({ ...perdixRow, platform: "android" }))}"`));
});
