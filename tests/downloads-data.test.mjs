// The home line and the downloads page show nothing unless this file accepts
// the data, so a broken or stale summary can never reach a visitor.
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  FETCH_TIMEOUT_MS,
  SUMMARY_URL,
  formatCount,
  loadSummary,
  parseSummary,
  shortTag,
} from "../downloads/data.js";

const NOW = new Date("2026-11-03T00:00:00Z");
const platforms = { macos: 110, android: 40, windows: 50, linux: 25 };
const good = (over = {}) => ({
  schema: 1,
  generated_at: "2026-11-01T04:23:00Z",
  total: 225,
  platforms,
  recent_releases: [{ tag: "v1.8.3.9095", published_at: "2026-10-26T00:00:00Z", downloads: 215 }],
  history: [{ date: "2026-11-01", total: 225, platforms }],
  ...over,
});

test("accepts a good summary", () => {
  assert.deepEqual(parseSummary(good(), NOW), good());
});

for (const [name, raw] of [
  ["nothing", null],
  ["a list", []],
  ["a wrong schema", good({ schema: 2 })],
  ["a text total", good({ total: "225" })],
  ["a zero total", good({ total: 0, platforms: { macos: 0, android: 0, windows: 0, linux: 0 } })],
  ["a negative platform", good({ platforms: { ...platforms, macos: -110, linux: 245 } })],
  ["a fractional total", good({ total: 225.5 })],
  ["a missing platform", good({ platforms: { macos: 225 } })],
  ["platforms that do not add up", good({ total: 226 })],
  ["a bad generated_at", good({ generated_at: "soon" })],
  ["a generated_at that is not text", good({ generated_at: ["2026-11-01T04:23:00Z"] })],
  ["no recent releases", good({ recent_releases: [] })],
  ["a bad release", good({ recent_releases: [{ tag: 3 }] })],
  ["no history", good({ history: [] })],
  ["a bad history entry", good({ history: [{ date: "x" }] })],
  ["a bad history date", good({ history: [{ date: "2026-11", total: 225, platforms }] })],
  ["an impossible history day", good({ history: [{ date: "2026-10-32", total: 225, platforms }] })],
  ["an impossible day in a short month", good({ history: [{ date: "2026-02-30", total: 225, platforms }] })],
  ["an impossible history month", good({ history: [{ date: "2026-13-01", total: 225, platforms }] })],
  [
    "recent releases that add up to more than the total",
    good({
      recent_releases: [
        { tag: "v1.8.3.9095", downloads: 200 },
        { tag: "v1.8.2.8916", downloads: 200 },
      ],
    }),
  ],
  [
    "history out of date order",
    good({
      history: [
        { date: "2026-11-02", total: 225, platforms },
        { date: "2026-11-01", total: 225, platforms },
      ],
    }),
  ],
  [
    "a repeated history date",
    good({
      history: [
        { date: "2026-11-01", total: 225, platforms },
        { date: "2026-11-01", total: 225, platforms },
      ],
    }),
  ],
  [
    "history that ends on a different total",
    good({
      history: [{ date: "2026-11-01", total: 200, platforms: { ...platforms, macos: 85 } }],
    }),
  ],
]) {
  test(`rejects ${name}`, () => {
    assert.equal(parseSummary(raw, NOW), null);
  });
}

test("a leap day is a real date", () => {
  const history = [{ date: "2028-02-29", total: 225, platforms }];
  assert.ok(parseSummary(good({ history }), NOW));
});

test("recent releases may add up to exactly the total", () => {
  const recent_releases = [{ tag: "v1.8.3.9095", downloads: 225 }];
  assert.ok(parseSummary(good({ recent_releases }), NOW));
});

test("stale data is rejected after 7 days", () => {
  const generated_at = "2026-11-01T00:00:00Z";
  assert.ok(parseSummary(good({ generated_at }), new Date("2026-11-08T00:00:00Z")));
  assert.equal(parseSummary(good({ generated_at }), new Date("2026-11-08T00:00:01Z")), null);
});

test("data ahead of the visitor's clock still shows", () => {
  assert.ok(parseSummary(good(), new Date("2020-01-01T00:00:00Z")));
});

test("formatCount uses en-US separators", () => {
  assert.equal(formatCount(11452), "11,452");
});

test("shortTag drops the build number", () => {
  assert.equal(shortTag("v1.8.3.9095"), "v1.8.3");
  assert.equal(shortTag("v1.8.3"), "v1.8.3");
  assert.equal(shortTag("demo"), "demo");
});

test("loadSummary asks for the summary and returns good data", async () => {
  const calls = [];
  const fetchFn = async (url, options) => {
    calls.push([url, options]);
    return { ok: true, json: async () => good() };
  };
  assert.deepEqual(await loadSummary({ fetchFn, now: NOW }), good());
  assert.equal(calls[0][0], SUMMARY_URL);
  assert.equal(calls[0][1].cache, undefined);
});

test("the summary address is the metrics branch", () => {
  assert.equal(
    SUMMARY_URL,
    "https://raw.githubusercontent.com/submersion-app/submersion/metrics/downloads/summary.json",
  );
});

test("loadSummary returns null on an HTTP error", async () => {
  const fetchFn = async () => ({ ok: false, status: 404 });
  assert.equal(await loadSummary({ fetchFn, now: NOW }), null);
});

test("loadSummary returns null when the request throws", async () => {
  const fetchFn = async () => {
    throw new Error("down");
  };
  assert.equal(await loadSummary({ fetchFn, now: NOW }), null);
});

test("loadSummary returns null on bad JSON", async () => {
  const fetchFn = async () => ({
    ok: true,
    json: async () => {
      throw new SyntaxError("x");
    },
  });
  assert.equal(await loadSummary({ fetchFn, now: NOW }), null);
});

test("loadSummary returns null on an invalid summary", async () => {
  const fetchFn = async () => ({ ok: true, json: async () => good({ schema: 2 }) });
  assert.equal(await loadSummary({ fetchFn, now: NOW }), null);
});

test("loadSummary gives up after the timeout", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const fetchFn = (_url, { signal }) =>
    new Promise((_, reject) => {
      signal.addEventListener("abort", () => reject(new Error("aborted")));
    });
  const result = loadSummary({ fetchFn, now: NOW });
  t.mock.timers.tick(FETCH_TIMEOUT_MS);
  assert.equal(await result, null);
});
