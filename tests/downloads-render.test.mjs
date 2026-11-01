// Runs the page scripts against a stand-in page, so what a visitor sees is pinned:
// the numbers when the data is good, and a message when anything goes wrong.
import { test } from "node:test";
import assert from "node:assert/strict";

import { TREND_MIN_SNAPSHOTS } from "../downloads/data.js";

const platforms = { macos: 110, android: 40, windows: 50, linux: 25 };
const summary = (snapshots = 1) => ({
  schema: 1,
  generated_at: new Date().toISOString(),
  total: 225,
  platforms,
  recent_releases: [{ tag: "v1.8.3.9095", published_at: "2026-10-26T00:00:00Z", downloads: 215 }],
  history: Array.from({ length: snapshots }, (_, index) => ({
    date: `2026-10-${String(index + 1).padStart(2, "0")}`,
    total: 225,
    platforms,
  })),
});

function fakeElement() {
  const element = {
    hidden: true,
    textContent: "",
    children: [],
    attributes: {},
    classes: [],
    classList: { add: (name) => element.classes.push(name) },
    setAttribute: (name, value) => {
      element.attributes[name] = value;
    },
    append: (...children) => element.children.push(...children),
    replaceChildren: (...children) => {
      element.children = children;
    },
  };
  return element;
}

const rowText = (list) => list.children.map((row) => row.children.map((cell) => cell.textContent));

let runs = 0;

// Each import runs the script again, because the query makes it a new module.
async function runScript(t, script, respond, elements = {}) {
  t.mock.method(console, "error", () => {});
  t.mock.method(globalThis, "fetch", respond);
  globalThis.document = {
    getElementById: (id) => (elements[id] ??= fakeElement()),
    createElement: fakeElement,
    createElementNS: fakeElement,
  };
  t.after(() => {
    delete globalThis.document;
  });
  runs += 1;
  await import(`../downloads/${script}?run=${runs}`);
  for (let turn = 0; turn < 10; turn += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }
  return elements;
}

const respondWith = (body) => async () => ({ ok: true, json: async () => body });

test("the page fills in from a good summary", async (t) => {
  const page = await runScript(t, "page.js", respondWith(summary()));
  assert.equal(page.numbers.hidden, false);
  assert.equal(page.total.textContent, "225");
  assert.deepEqual(rowText(page.platforms), [
    ["macOS", "110"],
    ["Android", "40"],
    ["Windows", "50"],
    ["Linux", "25"],
  ]);
  assert.deepEqual(rowText(page.releases), [["v1.8.3", "215"]]);
  assert.match(page.updated.textContent, /^Last updated \d{4}-\d{2}-\d{2}\.$/);
  assert.equal(page.unavailable?.hidden ?? true, true);
});

test("a loading message shows until the numbers arrive", async (t) => {
  let finish;
  const page = {};
  const running = runScript(t, "page.js", () => new Promise((resolve) => (finish = resolve)), page);
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(page.loading.hidden, false);
  finish({ ok: true, json: async () => summary() });
  await running;
  assert.equal(page.loading.hidden, true);
  assert.equal(page.numbers.hidden, false);
});

test("the trend waits for enough snapshots", async (t) => {
  const page = await runScript(t, "page.js", respondWith(summary(TREND_MIN_SNAPSHOTS - 1)));
  assert.deepEqual(page.trend.classes, ["downloads__trend--empty"]);
  assert.match(page.trend.children[0].textContent, /^The trend will appear here/);
});

test("the trend draws once there are enough snapshots", async (t) => {
  const page = await runScript(t, "page.js", respondWith(summary(TREND_MIN_SNAPSHOTS)));
  assert.deepEqual(page.trend.classes, []);
  const [heading, chart, axis] = page.trend.children;
  assert.equal(heading.textContent, "Over time");
  assert.match(chart.attributes["aria-label"], /^From 225 downloads on 2026-10-01/);
  assert.deepEqual(
    axis.children.map((end) => end.textContent),
    ["2026-10-01: 225", "2026-10-14: 225"],
  );
});

test("a failed request shows the unavailable message", async (t) => {
  const page = await runScript(t, "page.js", async () => ({ ok: false, status: 404 }));
  assert.equal(page.unavailable.hidden, false);
  assert.equal(page.numbers?.hidden ?? true, true);
  assert.equal(page.loading.hidden, true);
});

test("a failure while rendering shows the unavailable message", async (t) => {
  const page = {
    total: {
      set textContent(_) {
        throw new Error("render failed");
      },
    },
  };
  await runScript(t, "page.js", respondWith(summary()), page);
  assert.equal(page.unavailable.hidden, false);
  assert.equal(page.numbers?.hidden ?? true, true);
});

test("the home line shows the total when the data is good", async (t) => {
  const page = await runScript(t, "home-line.js", respondWith(summary()));
  assert.equal(page["download-count"].hidden, false);
  assert.equal(page["download-count-number"].textContent, "225");
});

test("the home line stays hidden when the data is unavailable", async (t) => {
  const page = await runScript(t, "home-line.js", async () => ({ ok: false, status: 404 }));
  assert.equal(page["download-count"]?.hidden ?? true, true);
});
