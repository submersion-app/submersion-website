// A failure while filling in the page must still tell the visitor something,
// rather than leaving the heading over an empty panel.
import { test } from "node:test";
import assert from "node:assert/strict";

const platforms = { macos: 110, android: 40, windows: 50, linux: 25 };
const summary = () => ({
  schema: 1,
  generated_at: new Date().toISOString(),
  total: 225,
  platforms,
  recent_releases: [{ tag: "v1.8.3.9095", published_at: "2026-10-26T00:00:00Z", downloads: 215 }],
  history: [{ date: "2026-11-01", total: 225, platforms }],
});

test("a failure while rendering shows the unavailable message", async (t) => {
  const elements = {
    numbers: { hidden: true },
    unavailable: { hidden: true },
    total: {
      set textContent(_) {
        throw new Error("render failed");
      },
    },
  };
  t.mock.method(console, "error", () => {});
  globalThis.document = { getElementById: (id) => elements[id] };
  globalThis.fetch = async () => ({ ok: true, json: async () => summary() });
  t.after(() => {
    delete globalThis.document;
    delete globalThis.fetch;
  });

  await import("../downloads/page.js").catch(() => {});
  for (let turn = 0; turn < 20 && elements.unavailable.hidden; turn += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }

  assert.equal(elements.unavailable.hidden, false);
  assert.equal(elements.numbers.hidden, true);
});
