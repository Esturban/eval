---
type: reference
title: "Entity: Content Article"
created: "2026-09-25"
updated: "2026-09-25"
status: active
project: ""
tags: [content, seo, vault]
---

Navigation: [[CRO Ontology]] | [[CRO Collection Cadence]] | [[Eval Wiki Index]]

# Entity: Content Article

An informational page written to answer a question or explain a concept, not to sell
directly. Two shapes exist on this site: an insight (a longer explainer) and an answer
(a short, direct response to one search-style question).

## Where it lives today

- Insights: `content/insights/*.md`.
- Answers: `content/answers/*.md`.
- Lifecycle status per page (keep, refresh, or limited until refreshed) is tracked
  centrally in `data/content_ledger.toml`, one entry per page path.

## Relation to other entities

A content article can cite or link to a [[Entity: Case Study]], and its ongoing health is
reviewed on the cadence described in [[CRO Collection Cadence]]. See [[CRO Ontology]] for
the full map.
