# AI Agent Implementation explainer, v3 beat sheet (CMO-8464)

Owner direction on v2: more video, more connecting things that change, several interactions in a step cadence. v3 answers with six interactions. Each one is a visible state change on an object that stays on screen, never a camera move over a static diagram. One work item chip travels through all six beats, so each beat hands the next one something that already changed.

Total runtime 40.0 s. Both formats (4x5 and 9x16) use the same beat data. Tokens, type, card states, tool glyphs, safe zones and the single cyan accent come from ../DESIGN.md and are not restated here. No cursor, no gradients, no glow, no shadow, no client names, no real tenant screens, no emoji. Labels are generic: shared inbox, ticket queue, CRM, documents.

## 1. One component, beats as data

One `Interaction` component renders every beat. It takes rows and returns the state of each element at time t. No beat has its own animation code.

| Field | Meaning |
|:-|:-|
| `el` | Element id (a card, chip, pill, field, button, rail tile, pip). |
| `from` | State before: `absent`, `dim`, `default`, `active`, `approved`, `done`, or `slot:<id>` for a position. |
| `to` | State after, same vocabulary. A `slot:` to `slot:` row is a travel. |
| `at` | Seconds from the beat start when the change begins. |
| `dur` | Seconds the change takes. Critically damped spring, no overshoot. |
| `cue` | Optional. `after:<row id>` so a change waits for the one before it (cause, then effect). |

Rules the component enforces:

- A state change is a fill, stroke, accent band, badge, text swap or slot move. Never a pan or zoom of the whole stage.
- Cause then effect: a row with `cue` cannot start before its parent row ends.
- Every beat holds fully static for at least 1.5 s before the next headline takes over.
- Seam: the next headline is visible on its first frame, the outgoing headline is gone by then, so two message blocks are never both fully visible.
- Cadence rail: six small pips at y 1060 to 1084, inside the safe zone and clear of the lower control band. A pip fills `accent` (ink cased) when its beat completes. No numbers or words on the pips.

## 2. Timeline

| id | Start | End | Dur | Interaction |
|:-|:-|:-|:-|:-|
| B1 | 0.0 | 5.5 | 5.5 | A request lands in the shared inbox |
| B2 | 5.5 | 11.5 | 6.0 | The agent reads it and the fields light up |
| B3 | 11.5 | 17.5 | 6.0 | The ticket changes status and the CRM record updates |
| B4 | 17.5 | 23.5 | 6.0 | A person approves |
| B5 | 23.5 | 29.0 | 5.5 | The report goes out to the team |
| B6 | 29.0 | 40.0 | 11.0 | The timeline advances to Go live, then the offer and the call to action |

## 3. Beats

### B1. 0.0 to 5.5 s. A request lands in the shared inbox.

| Item | Value |
|:-|:-|
| Trigger | Time. The work item chip drops into the Shared inbox card at 1.2 s. |
| BEFORE | Three tool cards on stage: Shared inbox, Ticket queue, CRM. All `default`, bodies empty. A person glyph with a dashed hand-off line sits beside them, idle. The AI agent card is not yet on stage. |
| AFTER | The Shared inbox card is `active` (cyan left band) and holds one work item chip, marked unread with a small accent dot. The dashed hand-off line has drawn from the inbox toward the person glyph, showing the by-hand route. Pip 1 filled. |
| On-screen words | Headline: "Still moving / tickets by hand?" Support: "A new request lands / in the shared inbox." Labels: "Shared inbox", "Ticket queue", "CRM". |

| row | el | from | to | at | dur | cue |
|:-|:-|:-|:-|:-|:-|:-|
| 1a | work-chip | absent | slot:inbox | 1.2 | 0.8 | none |
| 1b | card-inbox | default | active | 2.0 | 0.4 | after:1a |
| 1c | chip-unread-dot | absent | active | 2.2 | 0.3 | after:1a |
| 1d | handoff-line | absent | default | 2.8 | 0.8 | after:1b |
| 1e | pip-1 | default | done | 5.0 | 0.3 | none |

### B2. 5.5 to 11.5 s. The agent reads it and the fields light up.

| Item | Value |
|:-|:-|
| Trigger | The AI agent card enters at 5.9 s and the work chip opens into a small message card in the inbox. |
| BEFORE | The inbox holds the unread chip. The AI agent card is absent. The dashed by-hand line is still drawn. |
| AFTER | The by-hand line has dimmed to 35 percent. The AI agent card is `active`. The opened message shows three body bars; each is now highlighted `accent` with an ink stroke and mirrored as a labelled field chip on the agent card: Who, What, How urgent. The unread dot is gone (read). Pip 2 filled. |
| On-screen words | Headline: "The agent / reads it." Support: "It pulls out the details / that matter." Labels: "AI agent", "Who", "What", "How urgent". |

| row | el | from | to | at | dur | cue |
|:-|:-|:-|:-|:-|:-|:-|
| 2a | card-agent | absent | active | 0.4 | 0.6 | none |
| 2b | handoff-line | default | dim | 0.6 | 0.4 | none |
| 2c | chip-unread-dot | active | absent | 1.2 | 0.3 | after:2a |
| 2d | field-who | default | active | 1.8 | 0.4 | after:2a |
| 2e | field-what | default | active | 2.3 | 0.4 | after:2d |
| 2f | field-urgency | default | active | 2.8 | 0.4 | after:2e |
| 2g | field-chips | slot:inbox | slot:agent | 3.3 | 0.7 | after:2f |
| 2h | pip-2 | default | done | 5.6 | 0.3 | none |

### B3. 11.5 to 17.5 s. The ticket changes status and the CRM record updates.

| Item | Value |
|:-|:-|
| Trigger | The agent path draws from the AI agent card to the Ticket queue at 12.0 s, carrying the three fields. |
| BEFORE | The Ticket queue and CRM cards are `default` with empty bodies. The agent holds the three field chips. |
| AFTER | The Ticket queue holds a new ticket chip whose status pill moved from "New" to "Routed". The CRM card holds a contact row with a check and its line changed to "Updated". Both cards are `done` (ink stroke, small check), the tools stay the system of record. Pip 3 filled. |
| On-screen words | Headline: "It opens the ticket / and updates the CRM." Support: "Your tools stay / the system of record." Labels: "Ticket queue", "CRM", "New", "Routed", "Updated". |

| row | el | from | to | at | dur | cue |
|:-|:-|:-|:-|:-|:-|:-|
| 3a | agent-path-ticket | absent | default | 0.5 | 0.8 | none |
| 3b | ticket-chip | absent | slot:ticket | 1.3 | 0.6 | after:3a |
| 3c | ticket-status | New | New | 1.9 | 0.5 | after:3b |
| 3d | ticket-status | New | Routed | 2.8 | 0.5 | after:3c |
| 3e | card-ticket | default | active | 2.8 | 0.4 | after:3c |
| 3f | agent-path-crm | absent | default | 3.4 | 0.8 | after:3d |
| 3g | crm-row | absent | slot:crm | 4.2 | 0.5 | after:3f |
| 3h | crm-row-text | stale | Updated | 4.7 | 0.4 | after:3g |
| 3i | card-crm | default | done | 4.9 | 0.3 | after:3h |
| 3j | pip-3 | default | done | 5.7 | 0.3 | none |

Row 3c is a hold on "New" so the viewer reads the starting status before it changes. The change is the point of the beat.

### B4. 17.5 to 23.5 s. A person approves.

| Item | Value |
|:-|:-|
| Trigger | The ticket chip, now Routed, slides to the process owner review card at 18.0 s, and a draft reply appears in its preview panel. |
| BEFORE | The review card is on stage with the person glyph and an empty preview panel. The Approve button is `default` (white fill, graphite stroke), reading "Approve". The Ticket queue and CRM cards recede to `dim`. |
| AFTER | The preview panel shows the draft reply as three bars. The Approve button is `approved`: accent fill, ink stroke, check glyph, and the cyan check badge lands on the review card corner. The card label reads "Approved". Nothing moved a cursor; the button changed state because the person glyph's solid line completed. Pip 4 filled. |
| On-screen words | Headline: "Your process owner / approves it." Support: "Nothing goes out / unchecked." Labels: "Process owner", "Draft reply", "Approve", "Approved". |

| row | el | from | to | at | dur | cue |
|:-|:-|:-|:-|:-|:-|:-|
| 4a | card-ticket | active | dim | 0.3 | 0.4 | none |
| 4b | card-crm | done | dim | 0.3 | 0.4 | none |
| 4c | card-review | absent | default | 0.5 | 0.6 | none |
| 4d | ticket-chip | slot:ticket | slot:review | 1.1 | 0.8 | after:4c |
| 4e | draft-bars | absent | active | 2.0 | 0.8 | after:4d |
| 4f | person-link | dashed | solid | 3.0 | 0.6 | after:4e |
| 4g | btn-approve | default | approved | 3.6 | 0.4 | after:4f |
| 4h | badge-approved | absent | active | 3.9 | 0.4 | after:4g |
| 4i | btn-approve-text | Approve | Approved | 3.9 | 0.3 | after:4g |
| 4j | pip-4 | default | done | 5.7 | 0.3 | none |

### B5. 23.5 to 29.0 s. The report goes out to the team.

| Item | Value |
|:-|:-|
| Trigger | The approved chip moves from the review card to the Documents card at 24.0 s, which assembles a report page. |
| BEFORE | The Documents card is on stage, `default`, with an empty page. Three team person glyphs on the right are `dim`, each with an empty delivery mark. |
| AFTER | The report page is complete (three bars and a folded corner). It has travelled along a cased agent path and each of the three team glyphs now shows a check and is `active`. The Documents card is `done`. Pip 5 filled. |
| On-screen words | Headline: "The report / goes out." Support: "Your team sees / the result." Labels: "Documents", "Report", "Sent". |

| row | el | from | to | at | dur | cue |
|:-|:-|:-|:-|:-|:-|:-|
| 5a | card-review | approved | dim | 0.3 | 0.4 | none |
| 5b | card-docs | absent | default | 0.5 | 0.6 | none |
| 5c | report-page | absent | active | 1.2 | 0.9 | after:5b |
| 5d | report-page | slot:docs | slot:team | 2.3 | 0.8 | after:5c |
| 5e | team-1 | dim | active | 3.1 | 0.3 | after:5d |
| 5f | team-2 | dim | active | 3.4 | 0.3 | after:5e |
| 5g | team-3 | dim | active | 3.7 | 0.3 | after:5f |
| 5h | team-sent-text | absent | Sent | 3.7 | 0.3 | after:5g |
| 5i | card-docs | default | done | 3.9 | 0.3 | after:5g |
| 5j | pip-5 | default | done | 5.2 | 0.3 | none |

### B6. 29.0 to 40.0 s. The timeline advances to Go live, then the offer and the call to action.

| Item | Value |
|:-|:-|
| Trigger | The rail draws across the stage at 29.4 s and a playhead tile starts at the first stage. |
| BEFORE | Four stage tiles on the rail: Audit, Build, Test, Go live. All `default` and empty, the playhead tile at Audit, the window segment undrawn. |
| AFTER (29.0 to 35.0) | The playhead has advanced tile by tile. Audit, Build and Test each took a check (`done`); the Week 2 to Week 6 window segment is drawn; Go live is `active` (accent fill, ink stroke, flag). Pip 6 filled. |
| AFTER (35.0 to 40.0) | The stage resolves to the v2 closing beat: offer name, one call to action, benefit line, the four-stage path as evidence. Static from 37.0 s. No link on screen; the link belongs in the post caption. |
| On-screen words | 29.0 to 35.0 headline: "Live in / 2 to 6 weeks." Support: "One process, tested / before launch." Labels: "Audit", "Build", "Test", "Go live", "Week 2", "Week 6". 35.0 to 40.0 headline: "AI Agent / Implementation". CTA button: "Book a free 20-minute / Live Audit." Benefit line: "Leave knowing which / process comes first." |

| row | el | from | to | at | dur | cue |
|:-|:-|:-|:-|:-|:-|:-|
| 6a | rail | absent | default | 0.4 | 0.7 | none |
| 6b | tile-audit | default | done | 1.2 | 0.4 | after:6a |
| 6c | playhead | slot:audit | slot:build | 1.6 | 0.5 | after:6b |
| 6d | tile-build | default | done | 2.1 | 0.4 | after:6c |
| 6e | playhead | slot:build | slot:test | 2.5 | 0.5 | after:6d |
| 6f | tile-test | default | done | 3.0 | 0.4 | after:6e |
| 6g | window-segment | absent | active | 3.4 | 0.7 | after:6f |
| 6h | tile-golive | default | active | 4.1 | 0.4 | after:6g |
| 6i | pip-6 | default | done | 4.6 | 0.3 | none |
| 6j | stage-exit | default | absent | 5.7 | 0.3 | none |
| 6k | cta-offer-name | absent | default | 6.0 | 0.5 | after:6j |
| 6l | cta-button | absent | active | 6.4 | 0.5 | after:6k |
| 6m | cta-benefit | absent | default | 6.9 | 0.4 | after:6l |
| 6n | cta-path | absent | default | 7.3 | 0.4 | after:6m |

Final frame is static from 37.0 s to 40.0 s (3.0 s hold).

## 4. Distinctness check

| id | What changes | Type of change |
|:-|:-|:-|
| B1 | An item appears in the shared inbox and is marked unread | Arrival |
| B2 | Three fields on the item highlight and are copied to the agent | Extraction |
| B3 | A ticket status text changes New to Routed, then a CRM row updates | Status change |
| B4 | The Approve button changes from default to approved | Human approval |
| B5 | A report page travels to the team and three recipients flip to sent | Delivery |
| B6 | A playhead advances through four stages to Go live | Progress |

Six different state changes on six different objects. The one chip and the fields carry through B1 to B4 so the story reads as one case moving, not six slides.

## 5. Read-time check (template rule E)

Headline needs 1.0 s + 0.4 s per word; support needs 1.0 s + 0.35 s per word, both inside the beat.

| id | Headline words / need | Support words / need | Beat dur |
|:-|:-|:-|:-|
| B1 | 4 / 2.6 s | 7 / 3.5 s | 5.5 s |
| B2 | 3 / 2.2 s | 6 / 3.1 s | 6.0 s |
| B3 | 7 / 3.8 s | 6 / 3.1 s | 6.0 s |
| B4 | 4 / 2.6 s | 3 / 2.1 s | 6.0 s |
| B5 | 4 / 2.6 s | 5 / 2.8 s | 5.5 s |
| B6 timeline | 5 / 3.0 s | 5 / 2.8 s | 6.0 s |
| B6 call to action | 3 / 2.2 s | 8 / 3.8 s | 5.0 s |

Every beat fits. Headlines are on screen from the beat's first frame; support lines follow within 0.8 s.

## 6. Notes for the builder

- Tool choice follows the CMO-7401 verdict; Remotion is the fallback. The component and the rows above are the same either way.
- Reused unchanged from v2: palette, Instrument Sans, card states, tool glyphs, person glyph, Approve button, work item chip, cased agent path, timeline, closing beat.
- New in v3 (all built from existing parts): status pill text swap, field chips, report page, team recipients, cadence pips, playhead tile.
- The opening hook is the v2 headline unchanged. The v2 claim "2 to 6 weeks" and the Live Audit CTA are kept; the open offer-fact conflict recorded in ../DESIGN.md section 9 still needs an owner call before publishing.
- 9:16 follows the v2 recomposition rule (0.97 scale, side margins 120 px, stack centred between y 250 and y 1500).
