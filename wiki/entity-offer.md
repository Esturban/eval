---
type: reference
title: "Entity: Offer"
created: "2026-09-25"
updated: "2026-09-25"
status: active
project: ""
tags: [offers, vault]
---

Navigation: [[CRO Ontology]] | [[CRO Collection Cadence]] | [[Eval Wiki Index]]

# Entity: Offer

A priced product in the EV Advisory ladder, from a free checklist up to a paid engagement.
Each offer has a name, an outcome promise, a delivery mechanism, and a price.

## Where it lives today

- Structured data: `data/store.toml`, one `[[product]]` block per offer, including a
  `ticket` field citing the PAD ref the offer was added under and a `status` field
  (for example `live`).
- Rendered page: `content/store/_index.md`, which reads `data/store.toml` through
  `layouts/store/list.html` and hard-codes no product name, price, or URL.
- The canonical product-ladder spec this file is built from lives in a sibling repo:
  `thinking/wiki/domains/business/offers/store/blueprint.md` (cited in the header comment
  of `data/store.toml` itself). This wiki does not duplicate that spec, it points at it.

## Relation to other entities

An offer is presented on a [[Entity: Landing Page]], is sometimes delivered as an
[[Entity: Lead Magnet]] when free, and its credibility often leans on an
[[Entity: Case Study]]. See [[CRO Ontology]] for the full map.
