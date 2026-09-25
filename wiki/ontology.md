---
type: reference
title: "CRO Ontology"
created: "2026-09-25"
updated: "2026-09-25"
status: active
project: ""
tags: [vault]
---

Navigation: [[Eval Wiki Index]] | [[CRO Collection Cadence]]

# CRO Ontology

Map of the recurring entities in this space (web, conversion, design, sales, offers) and
where each one lives today. Single entry point, each row links to the note that documents
it in detail.

| # | Entity | Where it lives | Key relations | Read/write point |
|---|---|---|---|---|
| 1 | Landing page | `content/services/`, `content/store/`, `content/get/`, `content/live-audit/` | Sells an offer, cites a case study, hosts a lead magnet | [[Entity: Landing Page]] |
| 2 | Offer | `data/store.toml`, `content/store/`, spec in sibling repo `thinking` | Presented on a landing page, backed by a case study | [[Entity: Offer]] |
| 3 | Case study | `content/proof.md`, `content/insights/resources/case-study-*.md` | Backs an offer, can originate from an audit | [[Entity: Case Study]] |
| 4 | Audit | `content/live-audit/`, `content/scorecard.md`, `data/revenue_signal_scorecard.json` | Entry point to a landing page, can become a case study | [[Entity: Audit]] |
| 5 | Content article | `content/insights/`, `content/answers/`, lifecycle in `data/content_ledger.toml` | Cites case studies, reviewed on a cadence | [[Entity: Content Article]] |
| 6 | Lead magnet | `content/get/`, spec in sibling repo `lead-intel` | Offered from a landing page, a rung of the offer ladder | [[Entity: Lead Magnet]] |
| 7 | Design asset | `docs/design/` | Drafted for a landing page before it ships | [[Entity: Design Asset]] |

## Gap: campaign

No dedicated folder or record for a marketing campaign (a bounded push across channels
with a start and end date) exists in this repo today. Individual campaign execution
(social posts, ad copy) happens outside eval entirely, in tools this repo does not track.
This is a real gap, not filled here: no new folder is created speculatively to hold it.

## Reading notes

- Closed tag list and front matter schema: see `AGENTS.md`, section "Wiki LLM".
- When and how each entity gets collected or reviewed: [[CRO Collection Cadence]].
