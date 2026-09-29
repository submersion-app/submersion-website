// How a parsed passport tag reads on the page. Labels match the app's English
// strings, so a diver sees the same words in both.

import { utcDate } from "./tag.js";

const PSI_PER_BAR = 14.5038;

const MATERIALS = { al: "Aluminum", st: "Steel", cf: "Carbon fiber" };
const VALVES = { din: "DIN", yoke: "Yoke (INT)", conv: "Convertible" };

// A YYYY-MM-DD calendar date in the viewer's language. Formatted in UTC so a
// viewer west of Greenwich does not see the day before.
export function formatDate(isoDate, locale) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(utcDate(y, m, d));
}

export function tagTitle(tag) {
  return tag.name ?? "Cylinder";
}

// [label, value] pairs for the fields the tag carries, in the tag's key
// order. The name is the title, and the written date has its own line.
export function specRows(tag, locale) {
  const number = (n, digits = 1) =>
    n.toLocaleString(locale, { maximumFractionDigits: digits });
  const rows = [];
  if (tag.serial) rows.push(["Serial number", tag.serial]);
  if (tag.volumeL !== null) rows.push(["Volume", `${number(tag.volumeL)} L`]);
  if (tag.workingPressureBar !== null) {
    rows.push(["Working pressure", pressureText(tag.workingPressureBar, locale)]);
  }
  if (tag.material) rows.push(["Material", MATERIALS[tag.material]]);
  if (tag.valve) rows.push(["Valve", VALVES[tag.valve]]);
  if (tag.hydroTest) {
    rows.push(["Last hydrostatic test", formatDate(tag.hydroTest, locale)]);
  }
  if (tag.visualInspection) {
    rows.push(["Last visual inspection", formatDate(tag.visualInspection, locale)]);
  }
  if (tag.o2Clean) rows.push(["O2 clean", "Yes, when the tag was written"]);
  return rows;
}

// A fill's mix as the app's GasMix.name gives it.
export function fillMixName({ o2Percent: o2, hePercent: he }) {
  const [o, h] = [Math.round(o2), Math.round(he)];
  if (o2 >= 20 && o2 <= 22 && he === 0) return "Air";
  if (he > 0) return `Tx ${o}/${h}`;
  if (o2 >= 99) return "O2";
  if (o2 > 22) return `EAN${o}`;
  return `${o}% O2`;
}

// A pressure in bar with psi beside it, as the spec rows show one.
function pressureText(bar, locale) {
  const number = (n) => n.toLocaleString(locale, { maximumFractionDigits: 0 });
  return `${number(bar)} bar (${number(Math.round(bar * PSI_PER_BAR))} psi)`;
}

// The fill on one line: mix, pressure when the tag has it, and the day it
// was filled in the viewer's time zone (or timeZone, for tests).
export function fillSummary(fill, locale, timeZone) {
  const date = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone,
  }).format(new Date(fill.filledAt));
  return [
    fillMixName(fill),
    ...(fill.pressureBar !== null ? [pressureText(fill.pressureBar, locale)] : []),
    date,
  ].join(" · ");
}

// The app's own scheme, which opens Submersion where it is installed; the
// payload rides in the query, a form the app accepts.
export function openInAppUrl(query) {
  return `submersion://c?${query}`;
}
