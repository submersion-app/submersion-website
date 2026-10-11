// Fills g.html for one gear tag. Takes the document, timer and visibility
// check as arguments so the page's behaviour is testable without a browser.
import { parseGearTag } from "./gear-tag.js";
import { formatDate, openInAppUrl } from "./display.js";
import { gearRows, gearTitle } from "./gear-display.js";
import { appendRows, wireOpenInApp } from "./render.js";

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

  appendRows(doc, doc.getElementById("spec"), gearRows(tag, locale));

  if (tag.writtenOn) {
    doc.getElementById("written").textContent =
      `This tag was written on ${formatDate(tag.writtenOn, locale)}. ` +
      "Everything above is how the gear was then. " +
      "The gear passport in Submersion has the current record.";
  }

  wireOpenInApp({ doc, href: openInAppUrl(query, "g"), schedule, isPageVisible });

  show("tag");
}
