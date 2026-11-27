// Reads a buddy card payload, the fragment after https://submersion.app/b#.
// Mirrors BuddyCardCodec.decodeLink in the app repo
// (lib/features/buddies/domain/services/buddy_card_codec.dart), so this page
// and the app agree on what a card says: base64url of UTF-8 JSON with short
// keys. Dates share the passport tag's rules from tag.js.

import { parseDate } from "./tag.js";

// BuddyCardCodec.currentVersion in the app.
export const BUDDY_CARD_FORMAT = 1;

const MAX_ID = 128;
const MAX_NAME = 200;
const MAX_TEXT = 500;
const MAX_DIVES = 100000;
const MAX_CERTS = 50;
const BASE64URL = /^[A-Za-z0-9_-]*$/;

// The JSON a payload carries, or null when it is not base64url, UTF-8 and
// JSON.
function decodePayload(payload) {
  if (!BASE64URL.test(payload)) return null;
  try {
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const binary = atob(padded.replaceAll("-", "+").replaceAll("_", "/"));
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return null;
  }
}

const isString = (value) => typeof value === "string";

// Text as the app keeps it: trimmed, and absent when empty or overlong.
function text(value) {
  if (!isString(value)) return null;
  const t = value.trim();
  return t === "" || t.length > MAX_TEXT ? null : t;
}

function integerIn(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max ? value : null;
}

function certs(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const entry of value.slice(0, MAX_CERTS)) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const agency = text(entry[0]);
    const name = text(entry[1]);
    if (agency === null || name === null) continue;
    out.push({
      agency,
      name,
      level: text(entry[2]),
      cardNumber: text(entry[3]),
      issueDate: isString(entry[4]) ? parseDate(entry[4]) : null,
    });
  }
  return out;
}

// The card's fields, with ok false when the payload is no card: unreadable,
// not a JSON object, or without a usable id and name. Every other field that
// does not parse is dropped rather than trusted. now sets the latest
// diving-since year a card may claim: next year, for a sender's clock a day
// ahead.
export function parseBuddyCard(payload, now = new Date()) {
  const json = decodePayload(payload ?? "");
  if (json === null || typeof json !== "object" || Array.isArray(json)) return { ok: false };
  const { i: id, n: name } = json;
  if ((id != null && !isString(id)) || (name != null && !isString(name))) return { ok: false };
  if (id == null || id.trim() === "" || id.length > MAX_ID) return { ok: false };
  if (name == null || name.trim() === "") return { ok: false };

  const format = Number.isInteger(json.v) ? json.v : BUDDY_CARD_FORMAT;
  return {
    ok: true,
    format,
    newerFormat: format > BUDDY_CARD_FORMAT,
    trimmed: json.t === 1,
    name: name.trim().slice(0, MAX_NAME),
    phone: text(json.p),
    email: text(json.e),
    social: text(json.s),
    certs: certs(json.c),
    dives: integerIn(json.d, 0, MAX_DIVES),
    since: integerIn(json.f, 1900, now.getFullYear() + 1),
    lastDive: isString(json.l) ? parseDate(json.l) : null,
  };
}
