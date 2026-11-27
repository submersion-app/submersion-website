// Fills b.html for one buddy card. Takes the document and the clock as
// arguments so the page's behaviour is testable without a browser. Every
// value from the card is set as text, never as markup.
import { parseBuddyCard } from "./buddy-card.js";
import { formatDate } from "./display.js";
import { appendRows } from "./render.js";

// [label, value] pairs for the fields the card carries. Labels match the
// app's buddy card preview (buddyCard_field_* strings).
export function buddyRows(card, locale) {
  const rows = [];
  if (card.phone) rows.push(["Phone", card.phone]);
  if (card.email) rows.push(["Email", card.email]);
  if (card.social) rows.push(["Social handle", card.social]);
  if (card.dives !== null) rows.push(["Dives", card.dives.toLocaleString(locale)]);
  if (card.since !== null) rows.push(["Diving since", String(card.since)]);
  if (card.lastDive) rows.push(["Last dive", formatDate(card.lastDive, locale)]);
  return rows;
}

// One certification as a heading line and, when the card shares any, a line
// of details. The level joins the details only when it says something the
// name does not.
export function certLines(cert, locale) {
  const details = [];
  if (cert.level && cert.level !== cert.name) details.push(cert.level);
  if (cert.cardNumber) details.push(`Card ${cert.cardNumber}`);
  if (cert.issueDate) details.push(`Issued ${formatDate(cert.issueDate, locale)}`);
  return [`${cert.agency} ${cert.name}`, ...(details.length ? [details.join(" · ")] : [])];
}

export function renderBuddyCardPage({ doc, fragment, locale, now }) {
  const show = (id) => {
    doc.getElementById(id).hidden = false;
  };

  if (fragment === "") {
    show("info");
    return;
  }
  const card = parseBuddyCard(fragment, now);
  if (!card.ok) {
    show("invalid");
    return;
  }

  doc.getElementById("title").textContent = card.name;
  doc.title = `${card.name} - Submersion`;
  doc.getElementById("newer").hidden = !card.newerFormat;
  doc.getElementById("trimmed").hidden = !card.trimmed;

  const spec = doc.getElementById("spec");
  const rows = buddyRows(card, locale);
  appendRows(doc, spec, rows);
  spec.hidden = rows.length === 0;

  const list = doc.getElementById("certList");
  for (const cert of card.certs) {
    const item = doc.createElement("li");
    certLines(cert, locale).forEach((line, index) => {
      const p = doc.createElement("p");
      p.className = index === 0 ? "cert-name" : "cert-detail";
      p.textContent = line;
      item.append(p);
    });
    list.append(item);
  }
  doc.getElementById("certs").hidden = card.certs.length === 0;

  show("card");
}
