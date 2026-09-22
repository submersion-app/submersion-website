#!/usr/bin/env python3
"""Render a legal Markdown document into an existing site page.

The policy text lives in the app repository (submersion-app/submersion) as
PRIVACY.md and TERMS.md. This script is what keeps the website from holding a
second, drifting copy of it: it converts the Markdown and replaces only the
generated region of the target page, leaving the head, navigation, intro and
footer exactly as they are.

Two regions are replaced, each delimited by HTML comments in the page:

    <!-- legal:meta:begin -->  ... <!-- legal:meta:end -->
    <!-- legal:body:begin -->  ... <!-- legal:body:end -->

Anything outside those markers is never touched, so the page stays hand-owned
apart from the policy text itself.

Usage:
    render_legal.py --source PRIVACY.md --target privacy/index.html
    render_legal.py --source PRIVACY.md --target privacy/index.html --check

--check exits 1 when the page is out of date and writes nothing, which is what
CI uses to tell "needs regenerating" from "already current".

Deliberately dependency-free: it runs on a stock python3 in Actions with no
install step, and the Markdown it has to handle is a known, small subset
(headings, paragraphs, bullet lists, pipe tables, bold, links). It is not a
general Markdown implementation and should not become one. If the policy ever
needs a construct this does not cover, add it here with a fixture rather than
reaching for a library, or the CI job grows an install step for one page.
"""

from __future__ import annotations

import argparse
import html
import re
import sys
from pathlib import Path

META_BEGIN = "<!-- legal:meta:begin -->"
META_END = "<!-- legal:meta:end -->"
BODY_BEGIN = "<!-- legal:body:begin -->"
BODY_END = "<!-- legal:body:end -->"

# Dash characters that may separate a definition bullet's term from its
# description. Spelled as escapes so the source carries no literal dash.
DEFINITION_DASHES = "\u2014\u2013-"  # em dash, en dash, hyphen

# Indentation of the generated markup inside the page, matched to the
# surrounding hand-written HTML so the diff of a regeneration stays readable.

BODY_INDENT = " " * 12
META_INDENT = " " * 10


def slugify(text: str) -> str:
    """Heading text to the id the page anchors on.

    Matches the ids the hand-written page already used (`data-collection`,
    `cloud-backup`), so existing inbound links and the table of contents keep
    working after the first generated render.
    """
    slug = re.sub(r"<[^>]+>", "", text).lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-")


def render_inline(text: str) -> str:
    """Bold, links and escaping for a run of Markdown text.

    Order matters: escape first so policy text cannot inject markup, then
    reintroduce the tags this function is responsible for.
    """
    out = html.escape(text, quote=False)

    # Links before bold: a link label may contain bold, but a bold run that
    # swallowed a link's brackets would leave the URL rendered as text.
    def link(match: re.Match[str]) -> str:
        label, href = match.group(1), match.group(2)
        external = href.startswith("http")
        attrs = ' target="_blank" rel="noreferrer"' if external else ""
        return f'<a href="{href}"{attrs}>{label}</a>'

    out = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", link, out)
    out = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", out)
    return out


def render_list_item(text: str) -> str:
    """A bullet, with the site's `term: description` convention applied.

    The Markdown writes a definition bullet as a bolded term, then a dash,
    then the description. The site renders that as
    `<strong>Term:</strong> description`, which is the convention the
    convention the hand-written page established. Bullets that are not
    definitions pass through unchanged.
    """
    rendered = render_inline(text)
    return re.sub(
        rf"^<strong>([^<]+)</strong>\s*[{DEFINITION_DASHES}]\s*",
        r"<strong>\1:</strong> ",
        rendered,
    )


class Block:
    """One rendered HTML block, already indented."""

    def __init__(self, lines: list[str]):
        self.lines = lines


def render_table(rows: list[str]) -> list[str]:
    """A pipe table as the site's wrapped, scrollable table."""
    cells = [[c.strip() for c in r.strip().strip("|").split("|")] for r in rows]
    # Row 1 is the header, row 2 is the alignment rule, which carries no
    # content and is dropped.
    header, body = cells[0], cells[2:]

    out = ['<div class="legal__table">', "  <table>", "    <thead>", "      <tr>"]
    out += [f'        <th scope="col">{render_inline(c)}</th>' for c in header]
    out += ["      </tr>", "    </thead>", "    <tbody>"]
    for row in body:
        out.append("      <tr>")
        out += [f"        <td>{render_inline(c)}</td>" for c in row]
        out.append("      </tr>")
    out += ["    </tbody>", "  </table>", "</div>"]
    return out


def parse(markdown: str) -> tuple[str, list[str]]:
    """Split the document into its meta line and its rendered body blocks."""
    lines = markdown.replace("\r\n", "\n").split("\n")

    app = last_updated = ""
    body: list[str] = []
    i = 0
    paragraph: list[str] = []
    bullets: list[str] = []

    def flush_paragraph() -> None:
        nonlocal paragraph
        if paragraph:
            body.append(f"<p>{render_inline(' '.join(paragraph))}</p>")
            paragraph = []

    def flush_bullets() -> None:
        nonlocal bullets
        if bullets:
            # extend(), not `body += ...`: an augmented assignment would make
            # `body` local to this closure and shadow the list being built.
            body.append("<ul>")
            body.extend(f"  <li>{render_list_item(b)}</li>" for b in bullets)
            body.append("</ul>")
            bullets = []

    def flush() -> None:
        flush_paragraph()
        flush_bullets()

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if not stripped:
            flush()
            i += 1
            continue

        # The document's own H1 is dropped: the page supplies its title in
        # hand-written markup outside the generated region.
        if stripped.startswith("# "):
            flush()
            i += 1
            continue

        meta = re.match(r"^\*\*(App|Last Updated):\*\*\s*(.+)$", stripped)
        if meta:
            flush()
            if meta.group(1) == "App":
                app = meta.group(2).strip()
            else:
                last_updated = meta.group(2).strip()
            i += 1
            continue

        heading = re.match(r"^(#{2,4})\s+(.*)$", stripped)
        if heading:
            flush()
            level = len(heading.group(1))
            text = render_inline(heading.group(2))
            # Only H2 carries an id: those are the sections the page's
            # anchors and any inbound deep links point at.
            if level == 2:
                body.append(f'<h2 id="{slugify(heading.group(2))}">{text}</h2>')
            else:
                body.append(f"<h{level}>{text}</h{level}>")
            i += 1
            continue

        if stripped.startswith("|"):
            flush()
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                rows.append(lines[i])
                i += 1
            if len(rows) >= 2:
                body += render_table(rows)
            continue

        bullet = re.match(r"^[-*]\s+(.*)$", stripped)
        if bullet:
            flush_paragraph()
            item = bullet.group(1)
            i += 1
            # A bullet may wrap onto following indented lines.
            while i < len(lines) and lines[i].startswith(("  ", "\t")) and lines[i].strip():
                if re.match(r"^\s*[-*]\s+", lines[i]):
                    break
                item += " " + lines[i].strip()
                i += 1
            bullets.append(item)
            continue

        flush_bullets()
        paragraph.append(stripped)
        i += 1

    flush()

    meta_line = " · ".join(
        part for part in (f"App: {app}" if app else "", f"Last updated: {last_updated}" if last_updated else "") if part
    )
    return meta_line, body


def splice(page: str, begin: str, end: str, replacement: str) -> str:
    """Replace the text between two markers, keeping the markers."""
    start = page.find(begin)
    stop = page.find(end)
    if start == -1 or stop == -1:
        raise SystemExit(
            f"marker not found in target page: {begin if start == -1 else end}\n"
            "The page must carry the legal:meta and legal:body markers; see tools/render_legal.py."
        )
    if stop < start:
        raise SystemExit(f"markers out of order in target page: {end} precedes {begin}")
    return page[: start + len(begin)] + replacement + page[stop:]


def render(markdown: str, page: str) -> str:
    meta_line, body = parse(markdown)

    meta_html = (
        "\n"
        + META_INDENT
        + f'<p class="legal__meta">{html.escape(meta_line, quote=False)}</p>\n'
        + META_INDENT
    )
    body_html = "\n" + "\n".join(BODY_INDENT + line for line in body) + "\n" + BODY_INDENT

    page = splice(page, META_BEGIN, META_END, meta_html)
    page = splice(page, BODY_BEGIN, BODY_END, body_html)
    return page


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path, help="Markdown policy file")
    parser.add_argument("--target", required=True, type=Path, help="HTML page to update in place")
    parser.add_argument(
        "--check",
        action="store_true",
        help="Exit 1 if the page is out of date instead of writing it",
    )
    args = parser.parse_args()

    markdown = args.source.read_text(encoding="utf-8")
    page = args.target.read_text(encoding="utf-8")
    updated = render(markdown, page)

    if updated == page:
        print(f"{args.target}: up to date")
        return 0

    if args.check:
        print(f"{args.target}: OUT OF DATE, run tools/render_legal.py without --check", file=sys.stderr)
        return 1

    args.target.write_text(updated, encoding="utf-8")
    print(f"{args.target}: updated from {args.source}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
