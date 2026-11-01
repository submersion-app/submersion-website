// Geometry and wording for the downloads trend, as plain values so node --test
// can check them without a browser.
import { formatCount } from "./data.js";

// UTC, so a clock change cannot shift a point.
function dayMs(date) {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

// Where a value sits between two ends, or the middle if the ends are equal.
const share = (value, low, high) => (high === low ? 0.5 : (value - low) / (high - low));

export function trendPoints(history, { width, height, pad }) {
  const days = history.map((entry) => dayMs(entry.date));
  const totals = history.map((entry) => entry.total);
  const [firstDay, lastDay] = [days[0], days[days.length - 1]];
  const [lowest, highest] = [Math.min(...totals), Math.max(...totals)];
  const innerWidth = width - pad * 2;
  const innerHeight = height - pad * 2;
  return history.map((entry, index) => ({
    x: pad + (firstDay === lastDay ? 0 : share(days[index], firstDay, lastDay)) * innerWidth,
    y: pad + (1 - share(entry.total, lowest, highest)) * innerHeight,
  }));
}

export function trendText(history) {
  const first = history[0];
  const last = history[history.length - 1];
  return `From ${formatCount(first.total)} downloads on ${first.date} to ${formatCount(last.total)} on ${last.date}.`;
}
