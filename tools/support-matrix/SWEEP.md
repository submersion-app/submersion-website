# Support matrix sweep

How `computers/data/reports.json` gets new evidence. The same procedure runs
the first time (every watermark empty, so every source is read in full) and
monthly (each source read from its own watermark). The page, the validator
and the status rules are described in the app repo's spec,
`docs/superpowers/specs/2026-10-02-dive-computer-support-matrix-design.md`.

## Rules for every report

- One report is one diver's own result for one model, one platform and one
  connection. Release notes, changelogs and "should work" replies are not
  reports. A maintainer's own hardware test is.
- `outcome`: `works` (dives downloaded), `caveats` (downloaded with a
  workaround or a partial problem), `fails`. When unsure, use the weaker one.
- `platform`: `ios`, `android`, `macos`, `windows`, `linux`. Leave the report
  out when the platform cannot be told.
- `transport`: `bluetooth` or `usb`. On iOS it is always `bluetooth`. Leave the
  report out when it cannot be told on another platform.
- `appVersion`: the Submersion version the diver ran, `X.Y.Z`, or `null`.
- `date`: the post or comment date, `YYYY-MM-DD`.
- `url`: the permalink to the exact post or comment. App Store reviews use the
  listing `https://apps.apple.com/us/app/submersion-dive-log/id6757456915` and
  put the review id in `sourceRef` (`appstore:<country>:<id>`).
- `note`: at most 120 characters, our own words, no quotes, no usernames, no
  em dash. Say what happened ("Downloaded 40 dives after re-pairing").
- `model`: a catalog id from `computers/data/catalog.json`. A report that names
  a family ("Suunto D-series") or an ambiguous name goes in `unmapped` with the
  text it used. Never guess.
- `fixedBy`: when the thread or issue links a fixing PR, its number. Step 3
  turns it into `fixedIn`. It stays on the report only while `fixedIn` is
  `"unreleased"`, so a later sweep can find the release that ships the fix.
  A fixing PR found for a report already in `reports.json` is still a
  candidate: merge upgrades the stored `fixedIn` instead of skipping it.

## Reports from the form

An issue opened from the matrix page's "Report your result" link is a filled
issue form (`.github/ISSUE_TEMPLATE/computer-report.yml` in the app repo). Its
body is Markdown: each field is a `### <label>` heading followed by the answer
(`_No response_` when an optional field is empty). Read it, do not interpret
it:

- `model`: the catalog id at the start of "Dive computer" (the text before the
  first space). If it is not a catalog id, the report goes to `unmapped` with
  the whole answer.
- `platform`: the "Platform" answer, lowercased (`iOS` gives `ios`).
- `transport`: "Connection", `Bluetooth` gives `bluetooth`, `USB` gives `usb`.
- `outcome`: "What happened", `Downloaded dives` gives `works`,
  `Downloaded with problems` gives `caveats`, `Did not work` gives `fails`.
- `appVersion`: "Submersion version" when it is dotted numbers (a leading `v`
  dropped), otherwise `null`.
- `date`: the issue's `createdAt` date.
- `source`: `github-issue`; `url`: the issue's `url`; `sourceRef`: `null`.
- `note`: a paraphrase of "Details" in our own words, at most 120 characters,
  or `Reported through the form` when it is empty.
- A maintainer comment on the issue that links a fixing PR gives `fixedBy`.

## Candidate file

Each source produces `sweep-<source>.json` in a scratch directory (never in
the repo):

```json
{
  "reports": [ { "model": "...", "platform": "...", "transport": "...",
                 "outcome": "...", "appVersion": null, "date": "...",
                 "source": "...", "url": "...", "sourceRef": null,
                 "note": "...", "fixedBy": null } ],
  "unmapped": [ { "text": "Suunto D-series", "url": "...", "why": "family name" } ],
  "watermarks": { "<source>": { } },
  "failed": null
}
```

`failed` is a one-line reason when the source could not be read; then
`reports` is empty and `watermarks` leaves that source out, so its watermark
stays where it was.

A source is all or nothing. When a source is split across agents, or read in
several parts (the two `github` rows share one watermark), the source failed
if any part failed: every part leaves the watermark out. Only when every part
succeeded does the combined watermark take the highest value across the parts.
Advancing a watermark past a part that failed loses its items for good.

## Sources

Read each from its watermark in `reports.json`. Split a source across
parallel agents when it has more than about 10 pages or 100 items to read.

| Source key | Read | Watermark written |
|---|---|---|
| `scubaboard` | `https://scubaboard.com/community/threads/submersion-free-open-source-dive-log-app-all-platforms-looking-for-dive-computer-testers.667061/` and `.../page-N`, fetched with `curl -sL -A "Mozilla/5.0"`. Posts are `<article ... data-content="post-<id>">`; permalink `https://scubaboard.com/community/threads/submersion-free-open-source-dive-log-app-all-platforms-looking-for-dive-computer-testers.667061/post-<id>`. Skip posts with id at or below `lastPostId`. | `{ "lastPostId": <highest id read>, "sweptAt": "<today>" }` |
| `github` (report form) | Issues labelled `computer-report`: `gh issue list --repo submersion-app/submersion --label computer-report --state all --limit 1000 --json number,title,body,url,createdAt,updatedAt`, keeping those updated after `github.since`. Parsed field by field, see "Reports from the form". | shares the `github` watermark |
| `github` (issues, PRs, discussions) | `gh api --paginate "repos/submersion-app/submersion/issues?state=all&per_page=100&since=<since>"` (issues and PRs), `gh api --paginate "repos/submersion-app/submersion/issues/comments?per_page=100&since=<since>"`, and discussions over REST (`gh api --paginate "repos/submersion-app/submersion/discussions?per_page=100&sort=updated&direction=desc"`, then `.../discussions/<number>/comments` for each one updated after `since`; GraphQL is not available in the cloud routine). Dump to files and grep locally for catalog vendor and product names; never use the search API in a loop (it rate-limits). Issue and comment permalinks are their `html_url`. Skip issues labelled `computer-report`; the form row reads them. | `{ "since": "<sweep start, ISO 8601 UTC>" }` |
| `appStore` | `https://itunes.apple.com/<cc>/rss/customerreviews/page=<1..10>/id=6757456915/sortby=mostrecent/json` for `cc` in us gb ca au nz ie de at ch fr be nl es it pt se no dk fi pl cz jp mx br sg za; stop a country at the first empty page or the first review at or below `lastReviewId`. | `{ "lastReviewId": <highest numeric id read>, "sweptAt": "<today>" }` |

Google Play and Reddit are not swept; do not add either as a source. Google
Play reviews can only be read from a Play Console export bucket, which needs a
service account, and Reddit answers HTTP 429 to the sweep's network on the
first request.

## Steps

1. In an app repo checkout (`git submodule update --init packages/libdivecomputer_plugin/third_party/libdivecomputer`, `git fetch --tags`), regenerate the catalog:
   `python3 scripts/export_support_matrix_catalog.py --previous <website>/computers/data/catalog.json --out <website>/computers/data/catalog.json`.
   Note any `removed` ids.
2. Read every source into its candidate file (in parallel where possible).
3. Resolve `fixedBy`: for each PR number, `gh pr view <n> --repo submersion-app/submersion --json mergeCommit -q .mergeCommit.oid`, then `node tools/support-matrix/fixed-in.mjs <app checkout> <sha>`; set `fixedIn` on that report, and keep `fixedBy` only when the result is `unreleased`. Then re-resolve every report already in `reports.json` whose `fixedIn` is `"unreleased"` the same way from its `fixedBy`; when the fix has shipped, add a copy of that report with the new `fixedIn` as a candidate.
4. Combine the candidate files into one `sweep.json` (concatenate `reports`; combine `watermarks` under the all-or-nothing rule above), then `node tools/support-matrix/merge.mjs sweep.json`. It prints how many reports it added and how many had `fixedIn` upgraded; the PR body lists both.
5. `node tools/support-matrix/validate.mjs` and `node --test tests/*.test.mjs`. Fix or drop any report the validator rejects; never weaken the validator.
6. If every source has `failed`, open no PR; report the reasons instead. Otherwise open one PR titled `data(computers): support matrix sweep <YYYY-MM-DD>` whose body lists: reports added per source; reports whose `fixedIn` was upgraded, with the release; every `unmapped` item with its link; reports whose model appears in `removed`; every source with `failed` and its reason. No attribution lines.
