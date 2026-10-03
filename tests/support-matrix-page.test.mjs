// The inner pages copy the homepage's header, so their menu must stay the
// homepage's menu: an older copy once shipped with the retired Why, Screens,
// Features and Support items.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

// [href, text] for each link in the primary nav's link list.
function navLinks(html) {
  const links = /<div class="nav__links">([\s\S]*?)<\/div>/.exec(html);
  assert.ok(links, "no nav__links block");
  return [...links[1].matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map((m) => [m[1], m[2].trim()]);
}

const homeMenu = () =>
  navLinks(read("index.html")).map(([href, text]) => [href.startsWith("#") ? `../${href}` : href, text]);

for (const page of ["computers/index.html", "privacy/index.html", "terms/index.html"]) {
  test(`${page} uses the homepage's menu`, () => {
    assert.deepEqual(navLinks(read(page)), homeMenu());
  });
}

// The sweep reads ScubaBoard, GitHub and the App Store only, so the page must
// not ask divers to report anywhere the sweep never looks.
test("the matrix page invites reports only where the sweep reads", () => {
  const help = /<section class="matrix__help">([\s\S]*?)<\/section>/.exec(read("computers/index.html"));
  assert.ok(help, "no matrix__help section");
  assert.doesNotMatch(help[1], /reddit|google play/i);
});
