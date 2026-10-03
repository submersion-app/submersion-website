// The first release containing a fix, for a report's fixedIn.
//   node tools/support-matrix/fixed-in.mjs <app-repo-checkout> <merge-sha>...
// Prints "<sha> <X.Y.Z|unreleased>" per sha. The checkout needs its tags
// (git fetch --tags).
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const RELEASE = /^v(\d+)\.(\d+)\.(\d+)(?:\.\d+)?$/;

export function firstRelease(tags) {
  const versions = tags
    .map((tag) => RELEASE.exec(tag.trim()))
    .filter(Boolean)
    .map((m) => [Number(m[1]), Number(m[2]), Number(m[3])])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
  return versions.length ? versions[0].join(".") : "unreleased";
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [repo, ...shas] = process.argv.slice(2);
  for (const sha of shas) {
    const tags = execFileSync("git", ["-C", repo, "tag", "--contains", sha], { encoding: "utf8" }).split("\n");
    console.log(`${sha} ${firstRelease(tags)}`);
  }
}
