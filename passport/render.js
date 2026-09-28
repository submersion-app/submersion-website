// Fills c.html for one tag. Takes the document, timer and visibility check
// as arguments so the page's behaviour is testable without a browser.
import { parsePassportTag } from "./tag.js";
import { formatDate, openInAppUrl, specRows, tagTitle } from "./display.js";

// How long Open in Submersion has to take the diver to the app before the
// page suggests getting it.
export const OPEN_APP_WAIT_MS = 1500;

export function renderTagPage({ doc, query, locale, schedule, isPageVisible }) {
  const show = (id) => {
    doc.getElementById(id).hidden = false;
  };

  if (query === "") {
    show("info");
    return;
  }
  const tag = parsePassportTag(query);
  if (!tag.ok) {
    show("invalid");
    return;
  }

  const title = tagTitle(tag);
  doc.getElementById("title").textContent = title;
  doc.title = `${title} - Submersion`;
  doc.getElementById("newer").hidden = !tag.newerFormat;

  const spec = doc.getElementById("spec");
  const rows = specRows(tag, locale);
  for (const [label, value] of rows) {
    const dt = doc.createElement("dt");
    dt.textContent = label;
    const dd = doc.createElement("dd");
    dd.textContent = value;
    spec.append(dt, dd);
  }
  spec.hidden = rows.length === 0;

  if (tag.writtenOn) {
    doc.getElementById("written").textContent =
      `This tag was written on ${formatDate(tag.writtenOn, locale)}. ` +
      "Everything above is how the cylinder was then. " +
      "The passport in Submersion has the current record.";
  }

  // Without the app the scheme goes nowhere, silently or with a browser
  // error; the page is then still in front, so it suggests getting the app.
  // The wording holds even when a desktop browser stays in view as the app
  // opens beside it.
  const open = doc.getElementById("open");
  open.href = openInAppUrl(query);
  open.addEventListener("click", () => {
    schedule(() => {
      if (isPageVisible()) show("notOpened");
    }, OPEN_APP_WAIT_MS);
  });

  show("tag");
}
