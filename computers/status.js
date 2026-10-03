// Cell status for the support matrix: the one place that decides what a cell
// shows. The rules are in the app repo's spec,
// docs/superpowers/specs/2026-10-02-dive-computer-support-matrix-design.md.

export const STATUS = Object.freeze({
  VERIFIED: "verified",
  ISSUES: "issues",
  NOT_WORKING: "not-working",
  UNTESTED: "untested",
  NA: "na",
});

// Store reviews have no public permalink, so they cannot verify a cell alone.
const UNLINKABLE = new Set(["app-store", "play-store"]);

// Lower is weaker; the weaker outcome wins a tie.
const STRENGTH = { fails: 0, caveats: 1, works: 2 };

// Dotted numeric versions, compared part by part; null sorts oldest.
export function compareVersions(a, b) {
  if (a == null || b == null) return a == null && b == null ? 0 : a == null ? -1 : 1;
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return Math.sign(diff);
  }
  return 0;
}

// Sort comparator: newest app version, then newest date, then weakest outcome.
export function newestFirst(a, b) {
  return (
    compareVersions(b.appVersion, a.appVersion) ||
    (a.date === b.date ? 0 : a.date > b.date ? -1 : 1) ||
    STRENGTH[a.outcome] - STRENGTH[b.outcome]
  );
}

export function cellStatus(reports, reachable) {
  if (!reachable) return { status: STATUS.NA };
  if (reports.length === 0) return { status: STATUS.UNTESTED };
  const sorted = [...reports].sort(newestFirst);
  const latest = sorted[0];
  const result = (status, label) => ({ status, reports: sorted, latest, ...(label ? { label } : {}) });
  switch (latest.outcome) {
    case "works":
      return reports.some((r) => r.outcome === "works" && !UNLINKABLE.has(r.source))
        ? result(STATUS.VERIFIED)
        : result(STATUS.ISSUES, "Reported working only in app store reviews");
    case "caveats":
      return result(STATUS.ISSUES);
    case "fails":
      if (latest.fixedIn === "unreleased") return result(STATUS.NOT_WORKING, "Fix pending release");
      if (latest.fixedIn && compareVersions(latest.appVersion, latest.fixedIn) < 0) {
        return result(STATUS.ISSUES, `Fixed in v${latest.fixedIn}, awaiting confirmation`);
      }
      return result(STATUS.NOT_WORKING);
    default:
      throw new Error(`unknown outcome ${latest.outcome}`);
  }
}
