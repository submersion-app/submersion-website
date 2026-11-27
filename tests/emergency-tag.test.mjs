// Reading rules from the app repo's docs/developer/reference/formats/emergency-tag.md.
// Run with: node --test tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

import { dialableNumber, parseEmergencyTag } from "../passport/emergency-tag.js";

// The format document's worked example.
const example =
  "f=1&w=2026-11-27&n=Sam+Diver&y=1984&al=Penicillin&me=None&bt=O%2B" +
  "&mn=Asthma+as+a+child&c1=Alex+Diver&r1=Partner&p1=%2B15551234567" +
  "&in=DAN&ip=1234567&il=%2B19196849111";

test("reads every field of the documented example", () => {
  assert.deepEqual(parseEmergencyTag(example), {
    ok: true,
    format: 1,
    newerFormat: false,
    writtenOn: "2026-11-27",
    name: "Sam Diver",
    birthYear: 1984,
    allergies: "Penicillin",
    medications: "None",
    bloodType: "O+",
    medicalNotes: "Asthma as a child",
    contacts: [
      {
        name: "Alex Diver",
        relation: "Partner",
        phone: { display: "+15551234567", dial: "+15551234567" },
      },
    ],
    insurance: {
      insurer: "DAN",
      policy: "1234567",
      line: { display: "+19196849111", dial: "+19196849111" },
    },
    trimmed: false,
  });
});

test("only the name is required, and f defaults to 1", () => {
  const tag = parseEmergencyTag("n=Sam");
  assert.equal(tag.ok, true);
  assert.equal(tag.format, 1);
  assert.equal(tag.newerFormat, false);
  for (const key of ["writtenOn", "birthYear", "allergies", "medications", "bloodType", "medicalNotes", "insurance"]) {
    assert.equal(tag[key], null, key);
  }
  assert.deepEqual(tag.contacts, []);
  assert.equal(tag.trimmed, false);
});

test("a tag without a name is no tag", () => {
  assert.equal(parseEmergencyTag("al=Penicillin&c1=Alex").ok, false);
  assert.equal(parseEmergencyTag("n=&al=Penicillin").ok, false);
  assert.equal(parseEmergencyTag("n=+++").ok, false);
  assert.equal(parseEmergencyTag("n=%E0%A4%A").ok, false);
  assert.equal(parseEmergencyTag("").ok, false);
});

test("+ is a space and values are percent-decoded", () => {
  const tag = parseEmergencyTag("n=Jos%C3%A9+da+Silva&al=Latex%2C+bee+stings&mn=50%25+lung+capacity%26more");
  assert.equal(tag.name, "José da Silva");
  assert.equal(tag.allergies, "Latex, bee stings");
  assert.equal(tag.medicalNotes, "50% lung capacity&more");
});

test("ignores keys it does not know", () => {
  const tag = parseEmergencyTag("n=Sam&zz=later&al=None&x");
  assert.equal(tag.ok, true);
  assert.equal(tag.allergies, "None");
  assert.equal("zz" in tag, false);
});

test("a value that does not decode reads as missing, and the rest still reads", () => {
  const tag = parseEmergencyTag("n=Sam&al=%E0%A4%A&me=Aspirin");
  assert.equal(tag.ok, true);
  assert.equal(tag.allergies, null);
  assert.equal(tag.medications, "Aspirin");
});

test("a value it cannot read reads as missing", () => {
  const tag = parseEmergencyTag("n=Sam&w=2026-02-30&y=84&f=one");
  assert.equal(tag.writtenOn, null);
  assert.equal(tag.birthYear, null);
  assert.equal(tag.format, 1);
  assert.equal(parseEmergencyTag("n=Sam&y=1066").birthYear, null);
});

test("t=1 says fields were left off to fit the tag", () => {
  assert.equal(parseEmergencyTag("n=Sam&t=1").trimmed, true);
  assert.equal(parseEmergencyTag("n=Sam&t=0").trimmed, false);
  assert.equal(parseEmergencyTag("n=Sam&t=yes").trimmed, false);
});

test("a newer format still reads, with the note", () => {
  const tag = parseEmergencyTag("f=2&n=Sam");
  assert.equal(tag.ok, true);
  assert.equal(tag.newerFormat, true);
});

test("reads a second contact, and a contact with only some of its keys", () => {
  const tag = parseEmergencyTag("n=Sam&c1=Alex&c2=Jo&r2=Sister&p2=%2B44+20+7946+0000");
  assert.deepEqual(tag.contacts, [
    { name: "Alex", relation: null, phone: null },
    { name: "Jo", relation: "Sister", phone: { display: "+44 20 7946 0000", dial: "+442079460000" } },
  ]);
});

test("insurance shows when the tag has any of its keys", () => {
  assert.deepEqual(parseEmergencyTag("n=Sam&ip=99").insurance, { insurer: null, policy: "99", line: null });
});

test("a phone number dials without its punctuation, and other text does not dial", () => {
  assert.equal(dialableNumber("+1 (555) 123-4567"), "+15551234567");
  assert.equal(dialableNumber("0044.20/7946"), "0044207946");
  assert.equal(dialableNumber("ask the boat"), null);
  assert.equal(dialableNumber("12"), null);
  assert.equal(dialableNumber("+1 555 javascript:alert(1)"), null);
  const tag = parseEmergencyTag("n=Sam&c1=Alex&p1=ask+the+boat");
  assert.deepEqual(tag.contacts[0].phone, { display: "ask the boat", dial: null });
});
