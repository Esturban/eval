---
type: reference
title: "Entity: Landing Page"
created: "2026-09-25"
updated: "2026-09-25"
status: active
project: ""
tags: [web, vault]
---

Navigation: [[CRO Ontology]] | [[CRO Collection Cadence]] | [[Eval Wiki Index]]

# Entity: Landing Page

A public-facing Hugo page built to move a visitor toward a specific action: booking the
Live Audit, buying a store item, or requesting a lead magnet. Distinct from an insight or
answer article, which informs rather than converts.

## Where it lives today

- Page copy: `content/services/*.md`, `content/store/_index.md`,
  `content/get/*/index.md`, `content/live-audit/_index.md`.
- These pages use Hugo TOML front matter (`+++` blocks), not the wiki schema in this
  folder. That is intentional: Hugo content and this wiki are separate systems, the wiki
  documents and links to Hugo content, it does not restructure it.
- Per-page lifecycle status (keep, refresh, or limited until refreshed) is tracked in
  `data/content_ledger.toml`.

## Relation to other entities

A landing page usually sells or delivers an [[Entity: Offer]], sometimes cites an
[[Entity: Case Study]] as proof, and is where an [[Entity: Lead Magnet]] gets requested.
See [[CRO Ontology]] for the full map.
