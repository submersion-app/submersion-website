// Reads a gear tag payload, the query string after https://submersion.app/g#.
// Mirrors GearTagCodec.decode in the app repo
// (docs/developer/reference/formats/gear-tag.md is the format), so this page
// and the app agree on what a tag says. The text rules are the cylinder
// tag's, shared from tag.js.

import { CURRENT_FORMAT, UUID, capCharacters, parseDate, parseInteger, splitQuery } from "./tag.js";

const MAX_NAME = 40;
const MAX_SHORT_TEXT = 24;
// Type codes are enum names; the cap only stops a hostile tag from carrying
// an essay in a field the page prints.
const MAX_TYPE_CODE = 32;

// The type a cylinder's tag names. A cylinder's tag is a cylinder tag, so a
// gear tag naming it is refused.
const TANK = "tank";

// Text as the app keeps it: absent when empty, else cut to max characters.
function cap(text, max) {
  return text == null || text === "" ? null : capCharacters(text, max);
}

// The tag's fields, with ok false when the payload is no gear tag:
// unreadable, a missing or malformed passport id, no type, or a tank.
// Everything else that does not parse is dropped rather than trusted.
export function parseGearTag(query) {
  let pairs;
  try {
    pairs = splitQuery(query ?? "");
  } catch {
    return { ok: false };
  }
  const passportId = (pairs.get("p") ?? "").toLowerCase();
  if (!UUID.test(passportId)) return { ok: false };
  const typeCode = cap(pairs.get("t"), MAX_TYPE_CODE);
  if (typeCode === null || typeCode === TANK) return { ok: false };

  const format = parseInteger(pairs.get("f")) ?? CURRENT_FORMAT;
  return {
    ok: true,
    format,
    newerFormat: format > CURRENT_FORMAT,
    passportId,
    typeCode,
    writtenOn: parseDate(pairs.get("w")),
    name: cap(pairs.get("n"), MAX_NAME),
    brand: cap(pairs.get("b"), MAX_SHORT_TEXT),
    model: cap(pairs.get("mo"), MAX_SHORT_TEXT),
    serial: cap(pairs.get("sn"), MAX_SHORT_TEXT),
    lastService: parseDate(pairs.get("ls")),
  };
}
