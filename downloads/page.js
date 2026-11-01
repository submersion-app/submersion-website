// Browser glue for the downloads page: loads the summary and fills in the page.
// Everything goes in through textContent or SVG attributes, never as HTML. The
// rules live in data.js and trend.js.
import { PLATFORMS, TREND_MIN_SNAPSHOTS, formatCount, loadSummary, shortTag } from "./data.js";
import { trendEnds, trendPoints, trendText } from "./trend.js";

const $ = (id) => document.getElementById(id);
const SVG_NS = "http://www.w3.org/2000/svg";
const CHART = { width: 640, height: 200, pad: 8 };
const PLACEHOLDER =
  "The trend will appear here once a few weeks of daily snapshots have built up. GitHub keeps no history, so it starts from the first snapshot.";

function fillList(list, rows) {
  list.replaceChildren(
    ...rows.map(([label, count]) => {
      const row = document.createElement("li");
      const name = document.createElement("span");
      const value = document.createElement("b");
      name.textContent = label;
      value.textContent = formatCount(count);
      row.append(name, value);
      return row;
    }),
  );
}

function chart(history) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "downloads__chart");
  svg.setAttribute("viewBox", `0 0 ${CHART.width} ${CHART.height}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", trendText(history));
  const line = document.createElementNS(SVG_NS, "polyline");
  const points = trendPoints(history, CHART).map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`);
  line.setAttribute("points", points.join(" "));
  svg.append(line);
  return svg;
}

function axis(history) {
  const row = document.createElement("p");
  row.className = "downloads__axis";
  row.setAttribute("aria-hidden", "true");
  for (const label of trendEnds(history)) {
    const end = document.createElement("span");
    end.textContent = label;
    row.append(end);
  }
  return row;
}

function showTrend(section, history) {
  if (history.length < TREND_MIN_SNAPSHOTS) {
    const note = document.createElement("p");
    note.textContent = PLACEHOLDER;
    section.classList.add("downloads__trend--empty");
    section.replaceChildren(note);
    return;
  }
  const heading = document.createElement("h2");
  heading.textContent = "Over time";
  section.replaceChildren(heading, chart(history), axis(history));
}

function show(summary) {
  $("total").textContent = formatCount(summary.total);
  fillList($("platforms"), PLATFORMS.map(([key, label]) => [label, summary.platforms[key]]));
  fillList($("releases"), summary.recent_releases.map((release) => [shortTag(release.tag), release.downloads]));
  showTrend($("trend"), summary.history);
  $("updated").textContent = `Last updated ${summary.generated_at.slice(0, 10)}.`;
  $("numbers").hidden = false;
}

$("loading").hidden = false;

// Anything that goes wrong here still has to leave the visitor a message.
loadSummary()
  .then((summary) => {
    if (!summary) throw new Error("no download summary");
    show(summary);
  })
  .catch((error) => {
    console.error("Failed to show download counts:", error);
    $("unavailable").hidden = false;
  })
  .finally(() => {
    $("loading").hidden = true;
  });
