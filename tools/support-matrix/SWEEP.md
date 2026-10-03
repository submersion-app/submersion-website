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
- `url`: the permalink to the exact post or comment. Store reviews use the
  listing (App Store
  `https://apps.apple.com/us/app/submersion-dive-log/id6757456915`, Google Play
  `https://play.google.com/store/apps/details?id=app.submersion`) and put the
  review id in `sourceRef` (`appstore:<country>:<id>`, `play:<submit millis>`).
- `note`: at most 120 characters, our own words, no quotes, no usernames, no
  em dash. Say what happened ("Downloaded 40 dives after re-pairing").
- `model`: a catalog id from `computers/data/catalog.json`. A report that names
  a family ("Suunto D-series") or an ambiguous name goes in `unmapped` with the
  text it used. Never guess.
- `fixedBy`: when the thread or issue links a fixing PR, its number. The merge
  step turns it into `fixedIn`.

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

## Sources

Read each from its watermark in `reports.json`. Split a source across
parallel agents when it has more than about 10 pages or 100 items to read.

| Source key | Read | Watermark written |
|---|---|---|
| `scubaboard` | `https://scubaboard.com/community/threads/submersion-free-open-source-dive-log-app-all-platforms-looking-for-dive-computer-testers.667061/` and `.../page-N`, fetched with `curl -sL -A "Mozilla/5.0"`. Posts are `<article ... data-content="post-<id>">`; permalink `https://scubaboard.com/community/threads/submersion-free-open-source-dive-log-app-all-platforms-looking-for-dive-computer-testers.667061/post-<id>`. Skip posts with id at or below `lastPostId`. | `{ "lastPostId": <highest id read>, "sweptAt": "<today>" }` |
| `github` (report form) | Issues labelled `computer-report`: `gh issue list --repo submersion-app/submersion --label computer-report --state all --limit 1000 --json number,title,body,url,createdAt,updatedAt`, keeping those updated after `github.since`. Parsed field by field, see "Reports from the form". | shares the `github` watermark |
| `github` (issues, PRs, discussions) | `gh api --paginate "repos/submersion-app/submersion/issues?state=all&per_page=100&since=<since>"` (issues and PRs), `gh api --paginate "repos/submersion-app/submersion/issues/comments?per_page=100&since=<since>"`, and discussions with comments over GraphQL. Dump to files and grep locally for catalog vendor and product names; never use the search API in a loop (it rate-limits). Issue and comment permalinks are their `html_url`. Skip issues labelled `computer-report`; the form row reads them. | `{ "since": "<sweep start, ISO 8601 UTC>" }` |
| `reddit` | `curl -s -A "submersion-support-matrix/1.0" "https://www.reddit.com/r/submersion/new.json?limit=100"` (follow `after`), then `https://www.reddit.com<permalink>.json` per post for comments. Skip items with `created_utc` at or below `lastCreatedUtc`. Permalinks are `https://www.reddit.com<permalink>`. | `{ "lastCreatedUtc": <highest read> }` |
| `appStore` | `https://itunes.apple.com/<cc>/rss/customerreviews/page=<1..10>/id=6757456915/sortby=mostrecent/json` for `cc` in us gb ca au nz ie de at ch fr be nl es it pt se no dk fi pl cz jp mx br sg za; stop a country at the first empty page or the first review at or below `lastReviewId`. | `{ "lastReviewId": <highest numeric id read>, "sweptAt": "<today>" }` |
| `playStore` | Play Console review exports: `gcloud storage ls gs://$PLAY_REVIEWS_BUCKET/reviews/` then `gcloud storage cp` each `reviews_app.submersion_<YYYYMM>.csv` after `lastExportMonth` (UTF-16; read with `iconv -f UTF-16 -t UTF-8`). Use the `Device`, `App Version Name`, `Review Submit Date and Time`, `Review Submit Millis Since Epoch` and `Review Text` columns. Needs `PLAY_REVIEWS_BUCKET` and a service account key in `GOOGLE_APPLICATION_CREDENTIALS`; without them, set `failed`. | `{ "lastExportMonth": "<YYYYMM of the newest file read>" }` |

## Steps

1. In an app repo checkout (`git submodule update --init packages/libdivecomputer_plugin/third_party/libdivecomputer`, `git fetch --tags`), regenerate the catalog:
   `python3 scripts/export_support_matrix_catalog.py --previous <website>/computers/data/catalog.json --out <website>/computers/data/catalog.json`.
   Note any `removed` ids.
2. Read every source into its candidate file (in parallel where possible).
3. Resolve `fixedBy`: for each PR number, `gh pr view <n> --repo submersion-app/submersion --json mergeCommit -q .mergeCommit.oid`, then `node tools/support-matrix/fixed-in.mjs <app checkout> <sha>`; set `fixedIn` on that report and drop `fixedBy`.
4. Combine the candidate files into one `sweep.json` (concatenate `reports`, merge `watermarks`), then `node tools/support-matrix/merge.mjs sweep.json`.
5. `node tools/support-matrix/validate.mjs` and `node --test tests/*.test.mjs`. Fix or drop any report the validator rejects; never weaken the validator.
6. If every source has `failed`, open no PR; report the reasons instead. Otherwise open one PR titled `data(computers): support matrix sweep <YYYY-MM-DD>` whose body lists: reports added per source; every `unmapped` item with its link; reports whose model appears in `removed`; every source with `failed` and its reason. No attribution lines.
