// Reads an emergency tag payload, the query string after
// https://submersion.app/e#. The format is the app repo's
// docs/developer/reference/formats/emergency-tag.md.
//
// The tag is read by a stranger helping the diver, so the reader keeps every
// detail it can: a value that does not decode or does not read is dropped on
// its own, and the rest of the tag still shows. Only the name is required.

import { parseDate, parseInteger } from "./tag.js";

// The emergency tag's own format version.
export const EMERGENCY_FORMAT = 1;

const YEAR = /^\d{4}$/;
const EARLIEST_YEAR = 1900;

// The characters a phone number may be written with besides its digits.
const PHONE_PUNCTUATION = /[\s().\-/]/g;
const DIALABLE = /^\+?\d{3,}$/;

// Splits a query string into a map of keys to values: "+" is a space, the
// last of a repeated key wins, and a pair whose key or value is not valid
// percent-encoding is left out on its own rather than spoiling the rest.
export function splitEmergencyQuery(query) {
  const pairs = new Map();
  for (const part of (query ?? "").split("&")) {
    if (part === "") continue;
    const eq = part.indexOf("=");
    const rawKey = eq === -1 ? part : part.slice(0, eq);
    const rawValue = eq === -1 ? "" : part.slice(eq + 1);
    try {
      const decode = (s) => decodeURIComponent(s.replace(/\+/g, " "));
      pairs.set(decode(rawKey), decode(rawValue));
    } catch {
      // Bad percent-encoding: this key reads as missing.
    }
  }
  return pairs;
}

// Text trimmed, with blank as absent.
function text(value) {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? null : trimmed;
}

// A four-digit year from 1900 on, or null.
export function parseBirthYear(value) {
  if (value == null || !YEAR.test(value)) return null;
  const year = parseInteger(value);
  return year >= EARLIEST_YEAR ? year : null;
}

// The number a tel: link dials, or null when the text is no phone number:
// the digits and a leading +, with spaces, brackets, dots, dashes and
// slashes dropped.
export function dialableNumber(phone) {
  if (phone == null) return null;
  const compact = phone.replace(PHONE_PUNCTUATION, "");
  return DIALABLE.test(compact) ? compact : null;
}

// A phone number as the tag has it, and the number to dial when it is one.
// Text that is no phone number still shows, without a link.
function phone(value) {
  const display = text(value);
  return display === null ? null : { display, dial: dialableNumber(display) };
}

// Emergency contact i (1 or 2), or null when the tag has none of its keys.
function contact(pairs, i) {
  const name = text(pairs.get(`c${i}`));
  const relation = text(pairs.get(`r${i}`));
  const number = phone(pairs.get(`p${i}`));
  if (name === null && relation === null && number === null) return null;
  return { name, relation, phone: number };
}

// The tag's fields, with ok false when the payload has no readable name.
export function parseEmergencyTag(query) {
  const pairs = splitEmergencyQuery(query);
  const name = text(pairs.get("n"));
  if (name === null) return { ok: false };

  const format = parseInteger(pairs.get("f")) ?? EMERGENCY_FORMAT;
  const insurer = text(pairs.get("in"));
  const policy = text(pairs.get("ip"));
  const line = phone(pairs.get("il"));
  const insurance =
    insurer === null && policy === null && line === null ? null : { insurer, policy, line };

  return {
    ok: true,
    format,
    newerFormat: format > EMERGENCY_FORMAT,
    writtenOn: parseDate(pairs.get("w")),
    name,
    birthYear: parseBirthYear(pairs.get("y")),
    allergies: text(pairs.get("al")),
    medications: text(pairs.get("me")),
    bloodType: text(pairs.get("bt")),
    medicalNotes: text(pairs.get("mn")),
    contacts: [contact(pairs, 1), contact(pairs, 2)].filter((c) => c !== null),
    insurance,
    trimmed: pairs.get("t") === "1",
  };
}
