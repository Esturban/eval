---
type: reference
title: "CRO Collection Cadence"
created: "2026-09-25"
updated: "2026-09-25"
status: active
project: ""
tags: [vault]
---

Navigation: [[CRO Ontology]] | [[Eval Wiki Index]]

# CRO Collection Cadence

What gets collected or reviewed, from where, how often, where it lands, and who records it.

## Sources and frequency

| Source | What it delivers | Frequency | Where it lands | Who records |
|---|---|---|---|---|
| A new offer approved for the ladder | An offer entry | Ad hoc, when a product ships | `data/store.toml`, a new `[[product]]` block with a `ticket` field | The agent that ships it |
| A finished client engagement | A case study draft | Ad hoc, with client sign-off | `content/insights/resources/case-study-*.md`, indexed from `content/proof.md` | The agent, only after sign-off |
| Weekly AI discoverability review | Crawl health, indexed pages, AI-assisted traffic counts | Weekly, after each deploy | `docs/weekly-ai-discoverability-scorecard.md` | Whoever runs the post-deploy check, per `docs/ai-discoverability-ops.md` |
| Content ledger review | Per-page refresh status (keep, refresh, limit until refreshed) | Reviewed whenever a page is touched or audited | `data/content_ledger.toml` | The agent editing that page |
| A design review round | A mockup or screenshot | Ad hoc, before a page or CSS change ships | `docs/design/` | The agent running the review |
| A new lead magnet | A delivery page plus a store row | Ad hoc, coordinated with the `lead-intel` repo, which owns the magnet spec and DM ladder | `content/get/<slug>/index.md`, `data/store.toml` | The agent shipping it in this repo |

## Standing rule already in this repo

`docs/ai-discoverability-ops.md` already documents the post-deploy verification list and
what to check in Search Console after a deploy. That rule is reused here as-is, it is not
re-invented: the weekly scorecard row above cites it rather than duplicating its content.

## What is not collected here

Raw client material and export files belong in `.raw/`, never in `wiki/`. See
`.raw/README.md` for the convention.
