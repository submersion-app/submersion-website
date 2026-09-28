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
    const psi = number(Math.round(tag.workingPressureBar * PSI_PER_BAR), 0);
    rows.push(["Working pressure", `${number(tag.workingPressureBar, 0)} bar (${psi} psi)`]);
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

// The app's own scheme, which opens Submersion where it is installed; the
// payload rides in the query, a form the app accepts.
export function openInAppUrl(query) {
  return `submersion://c?${query}`;
}
