// The download button must point at an app release. The app repo also publishes
// releases that hold no installers, such as demo-data, and those can be the
// newest. script.js is a plain script, so this runs it with a stand-in page.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../script.js", import.meta.url), "utf8");

function element() {
  const node = {
    href: "",
    textContent: "",
    attributes: {},
    appendChild: (child) => child,
    removeAttribute: () => {},
    setAttribute: () => {},
  };
  return node;
}

async function runPage(releases) {
  const elements = {};
  const context = {
    console: { error: () => {} },
    AbortController,
    setTimeout,
    clearTimeout,
    navigator: { userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", platform: "MacIntel", maxTouchPoints: 0 },
    fetch: async () => ({ ok: true, json: async () => releases }),
    document: {
      querySelector: () => null,
      getElementById: (id) => (elements[id] ??= element()),
      createElement: () => ({ ...element(), content: { firstChild: null } }),
      createDocumentFragment: element,
      createTextNode: element,
    },
  };
  runInNewContext(source, context);
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
  return {
    href: elements["download-primary"].href,
    label: elements["download-primary-label"].textContent,
    meta: elements["download-primary-meta"].textContent,
  };
}

const installer = (tag) => ({
  name: `Submersion-${tag}-macOS.dmg`,
  browser_download_url: `https://example.test/${tag}.dmg`,
  size: 1048576,
});
const app = (tag, over = {}) => ({ tag_name: tag, draft: false, prerelease: false, assets: [installer(tag)], ...over });
const demoData = app("demo-data", { assets: [{ name: "demo-manifest.json", browser_download_url: "x", size: 1 }] });

test("a newer release with no installers does not take over the button", async () => {
  const page = await runPage([demoData, app("v1.8.3.9095")]);
  assert.equal(page.label, "Download for macOS");
  assert.equal(page.href, "https://example.test/v1.8.3.9095.dmg");
  assert.match(page.meta, /^v1\.8\.3\.9095/);
});

test("the newest app release wins", async () => {
  const page = await runPage([app("v1.8.3.9095"), app("v1.8.2.8916")]);
  assert.equal(page.href, "https://example.test/v1.8.3.9095.dmg");
});

test("prereleases and drafts are still skipped", async () => {
  const page = await runPage([
    app("v1.9.0-beta.1", { prerelease: true }),
    app("v1.9.0.1", { draft: true }),
    app("v1.8.3.9095"),
  ]);
  assert.equal(page.href, "https://example.test/v1.8.3.9095.dmg");
});

test("with no app release the button falls back to a plain download link", async () => {
  const page = await runPage([demoData]);
  assert.equal(page.label, "Download");
  assert.equal(page.meta, "");
});
