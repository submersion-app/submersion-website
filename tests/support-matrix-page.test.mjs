// The matrix page copies the homepage's header, so its menu must stay the
// homepage's menu: an older copy of the nav once shipped here with stale items.
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

test("the matrix page's menu is the homepage's menu", () => {
  const home = navLinks(read("index.html")).map(([href, text]) => [
    href.startsWith("#") ? `../${href}` : href,
    text,
  ]);
  assert.deepEqual(navLinks(read("computers/index.html")), home);
});
