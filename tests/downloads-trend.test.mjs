// The trend is drawn by real date, so a missed day shows as a longer step
// rather than being hidden.
import { test } from "node:test";
import assert from "node:assert/strict";

import { trendEnds, trendPoints, trendText } from "../downloads/trend.js";

const entry = (date, total) => ({ date, total, platforms: {} });
const size = { width: 100, height: 50, pad: 0 };

test("spaces points by real date, so gaps stay visible", () => {
  const points = trendPoints(
    [entry("2026-11-01", 10), entry("2026-11-02", 20), entry("2026-11-11", 30)],
    size,
  );
  assert.deepEqual(points.map((p) => p.x), [0, 10, 100]);
});

test("higher totals sit higher on the chart", () => {
  const [low, high] = trendPoints([entry("2026-11-01", 10), entry("2026-11-02", 20)], size);
  assert.equal(low.y, 50);
  assert.equal(high.y, 0);
});

test("a flat trend draws a level line, not NaN", () => {
  const points = trendPoints([entry("2026-11-01", 10), entry("2026-11-02", 10)], size);
  assert.deepEqual(points.map((p) => p.y), [25, 25]);
});

test("a single point does not divide by zero", () => {
  assert.deepEqual(trendPoints([entry("2026-11-01", 10)], size), [{ x: 0, y: 25 }]);
});

test("a day that crosses a clock change keeps even spacing", () => {
  const points = trendPoints(
    [entry("2026-03-07", 1), entry("2026-03-08", 2), entry("2026-03-09", 3)],
    size,
  );
  assert.deepEqual(points.map((p) => p.x), [0, 50, 100]);
});

test("padding insets the chart", () => {
  const points = trendPoints(
    [entry("2026-11-01", 10), entry("2026-11-02", 20)],
    { width: 100, height: 50, pad: 5 },
  );
  assert.deepEqual(points, [{ x: 5, y: 45 }, { x: 95, y: 5 }]);
});

test("trendEnds labels both ends with their date and total", () => {
  assert.deepEqual(trendEnds([entry("2026-11-01", 11452), entry("2026-11-15", 12000)]), [
    "2026-11-01: 11,452",
    "2026-11-15: 12,000",
  ]);
});

test("trendText states both ends without claiming a direction", () => {
  assert.equal(
    trendText([entry("2026-11-01", 11452), entry("2026-11-15", 12000)]),
    "From 11,452 downloads on 2026-11-01 to 12,000 on 2026-11-15.",
  );
});
