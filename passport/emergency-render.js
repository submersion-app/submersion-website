// Fills e.html for one emergency tag. Takes the document as an argument so
// the page's behaviour is testable without a browser.
//
// The details stay in the browser: every value goes onto the page as text,
// and nothing here sends, stores or puts them in a URL other than the tel:
// links the reader taps to call. The page title stays generic, so the
// diver's name does not land in the browser's history list.
import { parseEmergencyTag } from "./emergency-tag.js";
import { formatDate } from "./display.js";
import { appendRows } from "./render.js";

// A tap-to-call link, or the number as plain text when it cannot be dialled.
function phoneElement(doc, phone, label) {
  if (phone.dial === null) {
    const p = doc.createElement("p");
    p.className = "phone";
    p.textContent = `${label} ${phone.display}`;
    return p;
  }
  const a = doc.createElement("a");
  a.className = "call";
  a.href = `tel:${phone.dial}`;
  a.textContent = `${label} ${phone.display}`;
  return a;
}

function paragraph(doc, className, text) {
  const p = doc.createElement("p");
  p.className = className;
  p.textContent = text;
  return p;
}

// One emergency contact: who they are, then the number to call.
function contactElement(doc, contact) {
  const box = doc.createElement("div");
  box.className = "contact";
  const who = [contact.name, contact.relation === null ? null : `(${contact.relation})`]
    .filter((part) => part !== null)
    .join(" ");
  if (who !== "") box.append(paragraph(doc, "contact-name", who));
  if (contact.phone !== null) box.append(phoneElement(doc, contact.phone, "Call"));
  return box;
}

// The [label, value] rows after the calls: medications, blood type, notes.
export function detailRows(tag) {
  const rows = [];
  if (tag.medications) rows.push(["Medications", tag.medications]);
  if (tag.bloodType) rows.push(["Blood type", tag.bloodType]);
  if (tag.medicalNotes) rows.push(["Medical notes", tag.medicalNotes]);
  return rows;
}

export function renderEmergencyTagPage({ doc, query, locale }) {
  const byId = (id) => doc.getElementById(id);
  const show = (id) => {
    byId(id).hidden = false;
  };

  if (query === "") {
    show("info");
    return;
  }
  const tag = parseEmergencyTag(query);
  if (!tag.ok) {
    show("invalid");
    return;
  }

  byId("newer").hidden = !tag.newerFormat;
  byId("name").textContent = tag.name;
  byId("born").hidden = tag.birthYear === null;
  byId("born").textContent = tag.birthYear === null ? "" : `Born ${tag.birthYear}`;

  byId("allergiesBlock").hidden = tag.allergies === null;
  byId("allergies").textContent = tag.allergies ?? "";

  byId("contactsBlock").hidden = tag.contacts.length === 0;
  byId("contacts").append(...tag.contacts.map((c) => contactElement(doc, c)));

  const insurance = tag.insurance;
  byId("insuranceBlock").hidden = insurance === null;
  if (insurance !== null) {
    const parts = [];
    if (insurance.insurer !== null) parts.push(paragraph(doc, "insurer", insurance.insurer));
    if (insurance.policy !== null) {
      parts.push(paragraph(doc, "policy", `Policy ${insurance.policy}`));
    }
    if (insurance.line !== null) {
      parts.push(phoneElement(doc, insurance.line, "Call the 24-hour line"));
    }
    byId("insurance").append(...parts);
  }

  const rows = detailRows(tag);
  byId("details").hidden = rows.length === 0;
  appendRows(doc, byId("details"), rows);

  byId("written").textContent =
    tag.writtenOn === null
      ? "Written by the diver."
      : `Written on ${formatDate(tag.writtenOn, locale)} by the diver.`;
  byId("trimmed").hidden = !tag.trimmed;

  show("tag");
}
