#!/usr/bin/env python3
"""Lint for this repo's wiki/ folder.

# REUSE_CHECKED: /Users/EVA/Desktop/eva/03_development/_dev/repos/4_agents/sh/thinking/bin/vault-lint.py
# exists (sibling repo) and already uses an English schema, but it is tightly coupled to
# that repo's own folder layout (wiki/domains, wiki/meta, hot.md, _templates) and a closed
# tag list loaded from its own wiki/meta/tag-taxonomy.json. Importing it would couple this
# repo to that one. sig's scripts/boveda_lint.py made the same call for its own
# (Spanish-schema) repo and wrote a small standalone lint instead. This script follows
# that precedent: same shape, English field names, no cross-repo import, no new
# dependency.

Validates, over the notes in scope (wiki/*.md only, .raw/ is never linted):
1. front matter is present and well formed (a '---' block at the top).
2. 'type' is one of the 7 valid values.
3. 'status' is one of the 3 valid values.
4. every tag is in the closed taxonomy or carries the 'project/' prefix.
5. every [[Title]] wikilink in the body resolves to a real note in scope.
6. every note has 2 or more resolved outgoing links.
7. no note in scope is orphaned: referenced by another note, or catalogued in
   wiki/index.md.

Usage: python3 scripts/wiki_lint.py. No flags. Exit code 0 if there are no errors,
nonzero otherwise. Standard library only, no new dependency.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
WIKI_DIR = REPO_ROOT / "wiki"
INDEX_FILE = WIKI_DIR / "index.md"

VALID_TYPES = {
    "procedure",
    "decision",
    "project",
    "contact",
    "reference",
    "source",
    "note",
}
VALID_STATUSES = {"active", "draft", "archived"}
CLOSED_TAGS = {
    "web",
    "conversion",
    "design",
    "sales",
    "offers",
    "content",
    "seo",
    "analytics",
    "vault",
}

WIKILINK_RE = re.compile(r"\[\[([^\]|#]+?)(?:\|[^\]]*)?\]\]")


def find_notes() -> list[Path]:
    if not WIKI_DIR.exists():
        return []
    return sorted(WIKI_DIR.rglob("*.md"))


def parse_front_matter(text: str, path: Path, errors: list[str]) -> tuple[dict, str] | None:
    if not text.startswith("---\n"):
        errors.append(f"{path}: missing front matter or file does not start with '---'")
        return None
    end = text.find("\n---\n", 4)
    if end == -1:
        errors.append(f"{path}: front matter has no closing '---' block")
        return None
    body_start = end + 5

    block = text[4:end]
    body = text[body_start:]

    data: dict = {}
    for line_number, line in enumerate(block.splitlines(), start=2):
        if not line.strip():
            continue
        if ":" not in line:
            errors.append(f"{path}:{line_number}: front matter line has no ':' -> {line!r}")
            continue
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()
        if value.startswith('"') and value.endswith('"') and len(value) >= 2:
            value = value[1:-1].replace('\\"', '"')
        if key == "tags":
            list_value = value.strip()
            if list_value.startswith("[") and list_value.endswith("]"):
                inner = list_value[1:-1].strip()
                data[key] = [] if not inner else [item.strip().strip('"').strip("'") for item in inner.split(",")]
            else:
                errors.append(f"{path}:{line_number}: 'tags' must be a list '[..]' -> {line!r}")
                data[key] = []
        else:
            data[key] = value
    return data, body


def main() -> int:
    errors: list[str] = []
    notes = find_notes()

    title_to_path: dict[str, Path] = {}
    stem_to_path: dict[str, Path] = {}
    data_by_path: dict[Path, dict] = {}
    body_by_path: dict[Path, str] = {}

    for path in notes:
        text = path.read_text(encoding="utf-8")
        result = parse_front_matter(text, path, errors)
        if result is None:
            continue
        data, body = result
        data_by_path[path] = data
        body_by_path[path] = body

        title = data.get("title", "")
        if title:
            title_to_path[title] = path
        stem_to_path[path.stem] = path

        note_type = data.get("type")
        if note_type not in VALID_TYPES:
            errors.append(f"{path}: invalid 'type': {note_type!r} (valid: {sorted(VALID_TYPES)})")

        status = data.get("status")
        if status not in VALID_STATUSES:
            errors.append(f"{path}: invalid 'status': {status!r} (valid: {sorted(VALID_STATUSES)})")

        for tag in data.get("tags", []):
            if not tag:
                continue
            if tag.startswith("project/"):
                continue
            if tag not in CLOSED_TAGS:
                errors.append(f"{path}: tag '{tag}' is not in the closed taxonomy and has no 'project/' prefix")

    def resolve(link_title: str) -> Path | None:
        if link_title in title_to_path:
            return title_to_path[link_title]
        if link_title in stem_to_path:
            return stem_to_path[link_title]
        return None

    referenced_by: dict[Path, set[Path]] = {p: set() for p in notes}
    outgoing_links: dict[Path, set[Path]] = {p: set() for p in notes}

    for path, body in body_by_path.items():
        in_code_block = False
        for line_number, line in enumerate(body.splitlines(), start=1):
            if line.strip().startswith("```"):
                in_code_block = not in_code_block
                continue
            if in_code_block:
                continue
            line_no_inline_code = re.sub(r"`[^`]*`", "", line)
            for match in WIKILINK_RE.finditer(line_no_inline_code):
                target_title = match.group(1).strip()
                target = resolve(target_title)
                if target is None:
                    errors.append(f"{path}:{line_number}: broken link [[{target_title}]], does not resolve to any note in scope")
                    continue
                if target == path:
                    continue
                outgoing_links[path].add(target)
                referenced_by[target].add(path)

    for path in notes:
        if len(outgoing_links.get(path, set())) < 2:
            errors.append(f"{path}: has {len(outgoing_links.get(path, set()))} resolved outgoing link(s), 2 or more are required")

    index_text = INDEX_FILE.read_text(encoding="utf-8") if INDEX_FILE.exists() else ""
    for path in notes:
        if path == INDEX_FILE:
            continue
        if referenced_by.get(path):
            continue
        data = data_by_path.get(path, {})
        title = data.get("title", "")
        catalogued = bool(title) and title in index_text
        catalogued = catalogued or path.stem in index_text or path.name in index_text
        if not catalogued:
            errors.append(f"{path}: orphaned note, no other note references it and it is not catalogued in wiki/index.md")

    if errors:
        print(f"wiki_lint: {len(errors)} error(s) found\n")
        for error in errors:
            print(f"  - {error}")
        return 1

    print(f"wiki_lint: 0 errors over {len(notes)} notes in scope")
    return 0


if __name__ == "__main__":
    sys.exit(main())
