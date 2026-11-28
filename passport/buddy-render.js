// Fills b.html for one buddy card. Takes the document and the clock as
// arguments so the page's behaviour is testable without a browser. Every
// value from the card is set as text, never as markup.
import { parseBuddyCard } from "./buddy-card.js";
import { formatDate } from "./display.js";

// A tel: link for a phone number as the diver typed it, keeping only what a
// dialler reads; null when nothing callable is left.
export function phoneHref(phone) {
  const dial = phone.replace(/[^0-9+*#]/g, "");
  return /[0-9]/.test(dial) ? `tel:${dial.replaceAll("#", "%23")}` : null;
}

// Characters that would turn a mailto: link into more than an address
// (headers, a second recipient, a fragment) or that no address holds.
const EMAIL = /^[^\s@?&#<>"]+@[^\s@?&#<>"]+\.[^\s@?&#<>"]+$/;

// A mailto: link for an email address; null when the text is not shaped
// like one.
export function emailHref(email) {
  if (!EMAIL.test(email)) return null;
  const [local, domain] = email.split("@");
  return `mailto:${encodeURIComponent(local)}@${encodeURIComponent(domain)}`;
}

// [label, value, href] rows for the fields the card carries, href null for
// plain text. Labels match the app's buddy card preview (buddyCard_field_*
// strings).
export function buddyRows(card, locale) {
  const rows = [];
  if (card.phone) rows.push(["Phone", card.phone, phoneHref(card.phone)]);
  if (card.email) rows.push(["Email", card.email, emailHref(card.email)]);
  if (card.social) rows.push(["Social handle", card.social]);
  if (card.dives !== null) rows.push(["Dives", card.dives.toLocaleString(locale)]);
  if (card.since !== null) rows.push(["Diving since", String(card.since)]);
  if (card.lastDive) rows.push(["Last dive", formatDate(card.lastDive, locale)]);
  return rows.map(([label, value, href = null]) => [label, value, href]);
}

// Appends the rows to a definition list, a value with an href as a link.
function appendBuddyRows(doc, list, rows) {
  for (const [label, value, href] of rows) {
    const dt = doc.createElement("dt");
    dt.textContent = label;
    const dd = doc.createElement("dd");
    if (href === null) {
      dd.textContent = value;
    } else {
      const a = doc.createElement("a");
      a.href = href;
      a.textContent = value;
      dd.append(a);
    }
    list.append(dt, dd);
  }
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
  appendBuddyRows(doc, spec, rows);
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
