// How a parsed gear tag reads on the page. Type names and labels match the
// app's English strings, so a diver sees the same words in both.

import { formatDate } from "./display.js";

// Submersion's equipment types by code, as the app names them in English
// (EquipmentType and its enum_equipmentType_* strings). tank never reaches
// here: a gear tag naming it is refused.
const TYPE_NAMES = {
  regulator: "Regulator",
  firstStage: "First Stage",
  secondStage: "Second Stage",
  hose: "Hose",
  bcd: "BCD",
  backplate: "Backplate",
  wing: "Wing",
  harness: "Harness",
  tankBand: "Tank Band",
  weightPocket: "Weight Pocket",
  gearPocket: "Gear Pocket",
  wetsuit: "Wetsuit",
  drysuit: "Drysuit",
  undersuit: "Undersuit",
  baselayer: "Base Layer",
  rashGuard: "Rash Guard",
  vest: "Vest",
  fins: "Fins",
  mask: "Mask",
  snorkel: "Snorkel",
  computer: "Dive Computer",
  transmitter: "Transmitter",
  instrument: "Instrument / Gauge",
  compass: "Compass",
  rebreather: "Rebreather",
  weights: "Weights",
  light: "Light",
  camera: "Camera",
  lens: "Lens",
  port: "Port",
  housing: "Housing",
  trayHandle: "Tray / Handle",
  armClamp: "Arm / Clamp",
  strobe: "Strobe",
  videoLight: "Video Light",
  floatArm: "Float Arm / Float",
  smb: "SMB",
  reel: "Reel",
  knife: "Knife",
  tool: "Tool",
  hood: "Hood",
  gloves: "Gloves",
  boots: "Boots",
  dpv: "DPV",
  bag: "Bag",
  o2Cell: "O2 cell",
  battery: "Battery",
  other: "Other",
};

// A type a newer app added, unknown here, reads as plain gear, as in the app.
export function gearTypeName(typeCode) {
  return Object.hasOwn(TYPE_NAMES, typeCode) ? TYPE_NAMES[typeCode] : "Gear";
}

export function gearTitle(tag) {
  return tag.name ?? gearTypeName(tag.typeCode);
}

// [label, value] pairs for the fields the tag carries, in the tag's key
// order. The name is the title, and the written date has its own line.
export function gearRows(tag, locale) {
  const rows = [["Type", gearTypeName(tag.typeCode)]];
  if (tag.brand) rows.push(["Brand", tag.brand]);
  if (tag.model) rows.push(["Model", tag.model]);
  if (tag.serial) rows.push(["Serial number", tag.serial]);
  if (tag.lastService) rows.push(["Last service", formatDate(tag.lastService, locale)]);
  return rows;
}

// The app's own scheme, which opens Submersion where it is installed; the
// payload rides in the query, a form the app accepts.
export function gearOpenInAppUrl(query) {
  return `submersion://g?${query}`;
}
