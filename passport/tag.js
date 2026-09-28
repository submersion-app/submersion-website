// Reads a cylinder passport tag payload, the query string after
// https://submersion.app/c#. Mirrors PassportPayloadCodec.decode in the app
// repo (docs/import-formats/cylinder-passport-tag.md is the format), so this
// page and the app agree on what a tag says.

export const CURRENT_FORMAT = 1;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MATERIALS = new Set(["al", "st", "cf"]);
const VALVES = new Set(["din", "yoke", "conv"]);
const MAX_NAME = 40;
const MAX_SERIAL = 24;

// Splits a query string as Dart's Uri.splitQueryString does: "+" is a space,
// the last of a repeated key wins, and bad percent-encoding throws.
function splitQuery(query) {
  const pairs = new Map();
  for (const part of query.split("&")) {
    if (part === "") continue;
    const eq = part.indexOf("=");
    const rawKey = eq === -1 ? part : part.slice(0, eq);
    const rawValue = eq === -1 ? "" : part.slice(eq + 1);
    const decode = (s) => decodeURIComponent(s.replace(/\+/g, " "));
    pairs.set(decode(rawKey), decode(rawValue));
  }
  return pairs;
}

// A real calendar date as YYYY-MM-DD, or null.
function parseDate(text) {
  const m = text == null ? null : DATE.exec(text);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  return text;
}

// Dart's double.tryParse grammar (JavaScript's Number also takes 0x10,
// 0b1010 and the like, which the app drops). Infinity and NaN, which Dart
// does take, fail every range check anyway.
const DOUBLE = /^\s*[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?\s*$/;

// Dart's int.tryParse grammar: decimal digits or a 0x hex literal, no point
// and no exponent (Number would take 232.0 as the integer 232).
const INT = /^\s*([+-]?)(?:(\d+)|0[xX]([0-9a-fA-F]+))\s*$/;

// A decimal number as the app reads one, or null.
function parseDouble(text) {
  return text != null && DOUBLE.test(text) ? Number(text) : null;
}

// An integer as the app reads one, or null.
function parseInteger(text) {
  const m = text == null ? null : INT.exec(text);
  if (!m) return null;
  const magnitude = m[2] !== undefined ? Number.parseInt(m[2], 10) : Number.parseInt(m[3], 16);
  return m[1] === "-" ? -magnitude : magnitude;
}

// At most max characters, counted and cut by whole code points.
function capCharacters(text, max) {
  const chars = [...text];
  return chars.length <= max ? text : chars.slice(0, max).join("");
}

// The tag's fields, with ok false when the payload is no tag: unreadable, or
// a missing or malformed passport id. Everything else that does not parse is
// dropped rather than trusted.
export function parsePassportTag(query) {
  let pairs;
  try {
    pairs = splitQuery(query ?? "");
  } catch {
    return { ok: false };
  }
  const passportId = (pairs.get("p") ?? "").toLowerCase();
  if (!UUID.test(passportId)) return { ok: false };

  const rawFormat = pairs.get("f") ?? "";
  const format = /^\d+$/.test(rawFormat) ? Number(rawFormat) : CURRENT_FORMAT;
  const volume = parseDouble(pairs.get("v"));
  const pressure = parseInteger(pairs.get("wp"));
  const name = pairs.get("n") ?? "";
  const serial = pairs.get("sn") ?? "";
  const material = pairs.get("m");
  const valve = pairs.get("vt");

  return {
    ok: true,
    format,
    newerFormat: format > CURRENT_FORMAT,
    passportId,
    writtenOn: parseDate(pairs.get("w")),
    name: name === "" ? null : capCharacters(name, MAX_NAME),
    serial: serial === "" ? null : capCharacters(serial, MAX_SERIAL),
    volumeL: volume !== null && volume >= 0.5 && volume <= 50 ? volume : null,
    workingPressureBar: pressure !== null && pressure >= 50 && pressure <= 400 ? pressure : null,
    material: MATERIALS.has(material) ? material : null,
    valve: VALVES.has(valve) ? valve : null,
    hydroTest: parseDate(pairs.get("h")),
    visualInspection: parseDate(pairs.get("vi")),
    o2Clean: pairs.get("oc") === "1",
  };
}
