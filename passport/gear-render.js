// Fills g.html for one gear tag. Takes the document, timer and visibility
// check as arguments so the page's behaviour is testable without a browser.
import { parseGearTag } from "./gear-tag.js";
import { formatDate } from "./display.js";
import { gearOpenInAppUrl, gearRows, gearTitle } from "./gear-display.js";
import { OPEN_APP_WAIT_MS } from "./render.js";

export function renderGearTagPage({ doc, query, locale, schedule, isPageVisible }) {
  const show = (id) => {
    doc.getElementById(id).hidden = false;
  };

  if (query === "") {
    show("info");
    return;
  }
  const tag = parseGearTag(query);
  if (!tag.ok) {
    show("invalid");
    return;
  }

  const title = gearTitle(tag);
  doc.getElementById("title").textContent = title;
  doc.title = `${title} - Submersion`;
  doc.getElementById("newer").hidden = !tag.newerFormat;

  const spec = doc.getElementById("spec");
  for (const [label, value] of gearRows(tag, locale)) {
    const dt = doc.createElement("dt");
    dt.textContent = label;
    const dd = doc.createElement("dd");
    dd.textContent = value;
    spec.append(dt, dd);
  }

  if (tag.writtenOn) {
    doc.getElementById("written").textContent =
      `This tag was written on ${formatDate(tag.writtenOn, locale)}. ` +
      "Everything above is how the gear was then. " +
      "The gear passport in Submersion has the current record.";
  }

  // As on the cylinder page: without the app the scheme goes nowhere, and
  // the page, still in front, suggests getting it.
  const open = doc.getElementById("open");
  open.href = gearOpenInAppUrl(query);
  open.addEventListener("click", () => {
    schedule(() => {
      if (isPageVisible()) show("notOpened");
    }, OPEN_APP_WAIT_MS);
  });

  show("tag");
}
