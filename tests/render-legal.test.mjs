// tools/render_legal.py turns PRIVACY.md and TERMS.md from the app repo into
// privacy/ and terms/. A link between the two legal files must become a link
// between the two pages: the site has no PRIVACY.md or TERMS.md to link to.
// Any other link to a file in the app repo (LICENSE) must go to that file on
// GitHub: relative to the page it would resolve to /terms/LICENSE, a 404.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const tools = new URL("../tools/", import.meta.url).pathname;
const renderInline = (markdown) =>
  execFileSync(
    "python3",
    ["-c", "import sys; sys.path.insert(0, sys.argv[1]); import render_legal; print(render_legal.render_inline(sys.argv[2]), end='')", tools, markdown],
    { encoding: "utf8" },
  );

test("a link to PRIVACY.md becomes a link to the privacy page", () => {
  assert.equal(renderInline("See our [Privacy Policy](PRIVACY.md)."), 'See our <a href="../privacy/">Privacy Policy</a>.');
});

test("a link to TERMS.md keeps its section anchor", () => {
  assert.equal(renderInline("[Terms](TERMS.md#cloud-backup)"), '<a href="../terms/#cloud-backup">Terms</a>');
});

test("a link to another file in the app repo goes to that file on GitHub", () => {
  assert.equal(
    renderInline("See [LICENSE](LICENSE)."),
    'See <a href="https://github.com/submersion-app/submersion/blob/main/LICENSE" target="_blank" rel="noreferrer">LICENSE</a>.',
  );
});

test("a repo file link keeps its folder and anchor", () => {
  assert.match(
    renderInline("[Testing](docs/developer/testing.md#helpers)"),
    /href="https:\/\/github\.com\/submersion-app\/submersion\/blob\/main\/docs\/developer\/testing\.md#helpers"/,
  );
  assert.match(renderInline("[License](./LICENSE)"), /href="https:\/\/github\.com\/submersion-app\/submersion\/blob\/main\/LICENSE"/);
});

test("other links are left alone", () => {
  assert.equal(renderInline("[Guide](../guide/)"), '<a href="../guide/">Guide</a>');
  assert.equal(renderInline("[Above](#cloud-backup)"), '<a href="#cloud-backup">Above</a>');
  assert.match(renderInline("[Email](mailto:hello@example.com)"), /href="mailto:hello@example\.com"/);
  assert.match(renderInline("[GitHub](https://github.com/submersion-app)"), /href="https:\/\/github\.com\/submersion-app"/);
});

test("the published legal pages link to each other, not to Markdown files", () => {
  for (const page of ["privacy/index.html", "terms/index.html"]) {
    const html = readFileSync(new URL(`../${page}`, import.meta.url), "utf8");
    assert.doesNotMatch(html, /href="(?:PRIVACY|TERMS)\.md/, `${page} links to a Markdown file the site does not have`);
  }
});

test("the published legal text links only to pages, anchors or absolute URLs", () => {
  for (const page of ["privacy/index.html", "terms/index.html"]) {
    const html = readFileSync(new URL(`../${page}`, import.meta.url), "utf8");
    const body = html.slice(html.indexOf("<!-- legal:body:begin -->"), html.indexOf("<!-- legal:body:end -->"));
    for (const [, href] of body.matchAll(/href="([^"]*)"/g)) {
      assert.match(href, /^(?:[a-z]+:|#|\.\.\/)/, `${page} links to "${href}", which resolves under the page and does not exist`);
    }
  }
});
