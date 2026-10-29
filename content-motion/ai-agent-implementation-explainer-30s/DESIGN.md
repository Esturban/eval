# AI Agent Implementation, 30 s explainer: eight still frames (design spec)

Stage 1 of 3 (design pass). This file is the only input the Frontend Developer needs to build `stills/beat-1.png` to `stills/beat-8.png` (1080x1350 each) and the contact sheet. No video, no audio, no cursor.

Source of truth: the "Converged 30-second storyboard" (8-beat table) and the "Converged house prompt template" sections E and F on the ticket, plus the 2026-10-29 owner direction. All visible words below are copied verbatim from the storyboard rows. Where this spec adds or omits a word, it is listed in "Deviations" at the end.

## 1. What the owner rejected, and the rule that answers it

| Rejected in the 15 s cut | Rule in this spec |
|:-|:-|
| Nothing is clearly stated | Every still carries its headline and supporting line as real text in the upper safe zone, on a quiet field, never over a diagram. |
| The cursor is really ugly | No cursor in any still. No pointer. Human action is shown with a person glyph and dashed hand-off lines. |
| Graphics could be improved | Flat, recognisable tool cards (shared inbox, ticket queue, CRM, documents), a concrete agent workflow card with steps, a process-owner review card with an Approve button, a real timeline. No nodes, orbs, particles, floating agent shapes, glows or gradients. Nothing is reused from the old 15 s folder. |

## 2. Canvas, safe zone, grid

- Canvas: 1080 x 1350 px, background Off-white `#f7f4ee`, solid.
- Safe zone (10 percent inset): x 108 to 972 (w 864), y 135 to 1215 (h 1080).
- Lower platform-control exclusion: nothing meaningful (no text, no required graphic) at y >= 1100. All content in this spec ends by y 1084. The band y 1100 to 1350 stays empty Off-white.
- Content column: x 108, w 864. All x/y/w/h below are absolute canvas pixels, origin top-left, boxes are outer bounds (stroke included).
- Standard vertical rhythm for a two-line headline:
  - Headline box: y 135 to 351 (2 lines x 108 px).
  - Gap 28 px.
  - Supporting line box: y 379 to 515 (2 lines x 68 px).
  - Gap 56 px.
  - Diagram zone: y 571 to 1080 (h 509).
- Text never overlaps the diagram zone and nothing in the diagram zone moves under a word.

## 3. Tokens

### 3.1 Colour

| Token | Hex | Use |
|:-|:-|:-|
| `bg` | `#f7f4ee` | Canvas (site Off-white surface) |
| `ink` | `#020617` | Headlines, labels, active strokes, glyphs |
| `graphite` | `#0f172a` | Default card stroke, rails, connectors |
| `slate` | `#334155` | Supporting line, dim-card labels |
| `muted` | `#64748b` | Dashed manual hand-off lines only (never text) |
| `rule` | `#dbe3ee` | Placeholder content bars inside cards |
| `dim-fill` | `#eef2f6` | Dim card fill |
| `dim-stroke` | `#94a3b8` | Dim card stroke |
| `card` | `#ffffff` | Default and active card fill |
| `accent` | `#22d3ee` | The ONE accent. Fill only: active band, selected chip, approved badge, Approve button, CTA button, live stage. Never used as text colour or as a thin line on `bg`. |

Accent rule: cyan on `bg` is 1.65:1, so cyan is never a stand-alone line or text. Every cyan shape carries an `ink` stroke or sits inside an ink-stroked card; every cyan connector is a "cased line" (14 px `ink` line with an 8 px `accent` core).

No gradients, glows, shadows, blur, textures or particles. The site's hero grain does not apply here.

### 3.2 Contrast (WCAG 2.x, computed)

| Text / foreground | Background | Ratio | Status |
|:-|:-|:-|:-|
| `ink` #020617 | `bg` #f7f4ee | 18.38:1 | headline, labels on canvas: pass 7:1 |
| `ink` #020617 | `card` #ffffff | 20.17:1 | card labels: pass |
| `ink` #020617 | `accent` #22d3ee | 11.16:1 | CTA text, Approve, Go live: pass |
| `slate` #334155 | `bg` #f7f4ee | 9.43:1 | supporting line: pass |
| `slate` #334155 | `card` #ffffff | 10.35:1 | pass |
| `slate` #334155 | `dim-fill` #eef2f6 | 9.20:1 | dim-card labels stay readable: pass |
| `graphite` #0f172a | `bg` #f7f4ee | 16.26:1 | card strokes, rails (non-text, 3:1 needed): pass |
| `graphite` #0f172a | `rule` #dbe3ee | 13.80:1 | pass |
| `muted` #64748b | `bg` #f7f4ee | 4.34:1 | dashed lines only, non-text 3:1: pass; banned as text |
| `dim-stroke` #94a3b8 | `dim-fill` #eef2f6 | 2.28:1 | decorative edge of a de-emphasised card only; the card is identified by its 9.2:1 label, not its edge |
| `accent` #22d3ee | `bg` #f7f4ee | 1.65:1 | banned as text or bare line; always ink-cased |

Every word on every still meets the 7:1 target. Nothing relies on the 4.5:1 floor.

### 3.3 Type

One typeface: **Instrument Sans**, installed locally at `~/Library/Fonts/InstrumentSans-*.ttf` (Bold and SemiBold present). Load with a local `@font-face` (`src: local("Instrument Sans")` plus the file URL), no network. Fallback stack: `"Instrument Sans", "Helvetica Neue", Helvetica, Arial, sans-serif`. Second typeface: none (JetBrains Mono is not used; at 48 px minimum it adds noise without meaning).

| Token | Weight | Size | Line height | Tracking | Colour |
|:-|:-|:-|:-|:-|:-|
| `h1` | 700 | 104 px | 108 px | -0.01em | `ink` |
| `h1-xl` (beat 6 only) | 700 | 184 px | 184 px | -0.02em | `ink` |
| `support` | 600 | 58 px | 68 px | 0 | `slate` |
| `label` | 600 | 48 px | 56 px | 0 | `ink` (or `slate` on dim card) |
| `button` | 700 | 58 px | 68 px | 0 | `ink` on `accent` |

Sentence case everywhere. No all caps, no condensed or thin weights, no italics. Left aligned except inside buttons and pills (centred).

Readability check at 360 x 450 (one third scale): h1 renders at 34.7 px, support at 19.3 px, label at 16 px. All readable without zoom.

Line breaks are set explicitly (see section 5). The builder measures each line in code; any line wider than its box is a hard failure. If the primary break overflows, use the listed fallback break. Never shrink type below the token size to make a line fit.

## 4. Visual vocabulary (flat UI mock cards)

Shared rules: flat fills, no shadows. Corner radius 24 px on cards, 16 px on chips and tiles, fully round on pills. Icons are line glyphs on a 64 x 64 box (56 x 56 in compact cards), 6 px stroke, round caps and joins, `ink`, no fill (except the accent badge cases). No brand logos, no app names, no real UI text inside cards: content is shown as `rule`-coloured bars (height 18 px, radius 9 px, widths 60 / 80 / 45 percent of the body width, 14 px apart).

### 4.1 Card states

| State | Fill | Stroke | Label colour | Accent |
|:-|:-|:-|:-|:-|
| `dim` | `dim-fill` | 3 px `dim-stroke` | `slate` | none |
| `default` | `card` | 4 px `graphite` | `ink` | none |
| `active` / `selected` | `card` | 6 px `ink` | `ink` | 20 px `accent` band inside the left edge, clipped to the corner radius |
| `approved` | `card` | 6 px `ink` | `ink` | 64 px `accent` circle badge with 5 px `ink` ring and 8 px `ink` check, top-right corner, 20 px inset |

### 4.2 Card layouts

- **Row variant** (card w >= 480): padding 28. Icon 64 at left, vertically centred; label 48 px to its right, 20 px gap. Body bars to the right of the label or below it.
- **Stacked variant** (cards 300 to 479 wide): padding 24. Icon 56 top-left; label below the icon, 14 px gap; total height 170.
- **Icon tile** (compact, 72 to 264 wide): icon centred, no label. Used only after the tool has already been named on screen in an earlier beat.

### 4.3 Glyphs and objects

| Object | Glyph / construction |
|:-|:-|
| Shared inbox | Open tray (U-shaped base with a centre notch) with an envelope above it: 52 x 36 rectangle with a V flap line. |
| Ticket queue | Ticket stub: rounded rectangle 52 x 32 with semicircle notches (r 6) on both short sides, plus two short list lines stacked beneath it. |
| CRM | Contact card: rounded rectangle 56 x 44, circle head (r 8) at left, two horizontal lines at right. |
| Documents | Page 40 x 52 with a folded top-right corner (12 px) and two lines. |
| Agent workflow | Step chain: three 14 px squares in a row, joined by a line, arrowhead after the third. This is the agent's mark everywhere; there is no robot, brain, sparkle or orb. |
| AI agent card | Row or stacked card with the step-chain glyph. When the agent is doing work it is in `active` state. |
| Person (team member, process owner) | Circle 120 px dia (`card` fill, 5 px `ink` stroke) containing a head circle (r 16) and a shoulder arc, 6 px `ink`. |
| Process-owner review card | `default` card, person glyph and label at top, an output preview panel (`bg` fill, radius 16, three `rule` bars), and an Approve button (see below). |
| Approve button | Pill, `accent` fill, 4 px `ink` stroke, 8 px `ink` check glyph at left, `button`-weight text at 48 px "Approve". |
| Work item chip | 200 x 64 (or as given), radius 16, `card` fill, 4 px `graphite` stroke, two `rule` bars inside. Active item: `accent` fill, `ink` stroke, `ink` bars. |
| Manual hand-off line | 6 px `muted`, dashed 18 on 14 off, round caps, arrowhead 18 px. Means "a person copies this by hand". |
| Agent path | Cased line: 14 px `ink` with 8 px `accent` core, arrowhead 22 px `ink`. Means "the agent moves this". |
| Plain connector | 6 px `graphite` solid. |
| Timeline | Rail 12 px `graphite`, radius 6. Stage tiles 72 x 72, radius 16. Window segment: 20 px `ink` casing with 12 px `accent` core. |
| Pill tag (factual term) | Height 80, fully rounded, `card` fill, 4 px `graphite` stroke, `label` text centred, 32 px side padding. |

## 5. Visible text per beat (verbatim from the storyboard)

`/` marks the explicit line break. Fallback breaks apply only if measurement fails.

| # | Midpoint frame (60 fps) | Headline | Supporting line | Diagram labels |
|:-|:-|:-|:-|:-|
| 1 | 120 (2.0 s) | Still moving / tickets by hand? | We build the AI agent / inside your tools. | Shared inbox; Ticket queue; CRM; (added) AI agent |
| 2 | 360 (6.0 s) | One narrow / agent. | Built into the tools / you already use. | CRM; Ticketing; Shared inbox; Documents |
| 3 | 570 (9.5 s) | Start with a / free Live Audit. | Leave knowing which / process comes first. | 20 minutes; Process owner |
| 4 | 780 (13.0 s) | Build it in / your workflow. | Your tools stay the / system of record. | Existing tools; Agent workflow |
| 5 | 1020 (17.0 s) | Test it on / real work. | Your process owner / checks the output. | Real work; Process owner; Approve |
| 6 | 1260 (21.0 s) | Live in / 2 to 6 / weeks. (see beat 6 sizing) | One process, tested / before launch. | Week 2; Week 6; Go live |
| 7 | 1470 (24.5 s) | The agent / handles the / repeatable work. | Your team stays in control. | Draft; Route; Update; Approve |
| 8 | 1680 (28.0 s) | AI Agent / Implementation | Book a free 20-minute / Live Audit. (CTA button) | Leave knowing which / process comes first. (benefit line) |

Fallback breaks: beat 1 `Still / moving tickets / by hand?`; beat 3 `Start with / a free / Live Audit.`; beat 7 `The agent / handles the / repeatable / work.` (support then moves down 108 px and the diagram zone shrinks by 108 px from the top; all diagram y values in beat 7 shift down by 108 and row height drops from 88 to 72). No other beat needs a fallback at 864 px.

Text must contain exactly these strings, including punctuation. The builder's "missing required words" check compares each rendered text node against this table.

## 6. Per-beat layouts

Headline and supporting line positions follow the standard rhythm in section 2 unless the beat says otherwise. Every block below is x, y, w, h.

### Beat 1. Frames 0 to 240, midpoint 120. Stop the scroll.

What a muted viewer learns: someone on the team is copying the same ticket between the shared inbox, the ticket queue and the CRM by hand, and this is an offer to build an AI agent inside those tools.

| Block | x | y | w | h | Content and state |
|:-|:-|:-|:-|:-|:-|
| Headline | 108 | 135 | 864 | 216 | "Still moving / tickets by hand?" `h1`. Fully visible at frame 0 (no reveal). |
| Supporting line | 108 | 379 | 864 | 136 | "We build the AI agent / inside your tools." `support`. Present from 0.8 s, so fully visible at frame 120. |
| Card: Shared inbox | 108 | 571 | 480 | 136 | Row variant, `default`. Body: one work item chip 150 x 56 at x 410, y 611. |
| Card: Ticket queue | 108 | 755 | 480 | 136 | Row variant, `default`. Same work item chip at x 410, y 795 (a visible copy of the same item). |
| Card: CRM | 108 | 939 | 480 | 136 | Row variant, `default`. Same work item chip at x 410, y 979. |
| Manual spine | 606 | 639 | 6 | 372 | Vertical manual hand-off line (dashed `muted`) from y 639 to 1011, with three 18 px dashed ticks and arrowheads pointing left into each card's right edge at y 639, 823, 1007. |
| Manual link | 612 | 728 | 126 | 6 | Dashed `muted` line from the spine to the person glyph. |
| Person glyph | 738 | 671 | 120 | 120 | Team member, `default` (no label: the headline says "by hand"). |
| Card: AI agent | 624 | 899 | 348 | 180 | Stacked variant, `active` (cyan left band), step-chain glyph, label "AI agent". Not yet connected to anything: the path is paused before the agent takes over. |

Accent: only the AI agent card band. Motion note for later: cards static from frame 0; the agent card enters at 1.2 s by 24 px upward translation plus opacity, settled by 1.6 s.

### Beat 2. Frames 240 to 480, midpoint 360. Scope: one narrow agent, no platform replacement.

What a muted viewer learns: it is one narrow agent that works across the CRM, ticketing, shared inbox and documents the team already has.

| Block | x | y | w | h | Content and state |
|:-|:-|:-|:-|:-|:-|
| Headline | 108 | 135 | 864 | 216 | "One narrow / agent." `h1` |
| Supporting line | 108 | 379 | 864 | 136 | "Built into the tools / you already use." `support` |
| Card: CRM | 108 | 571 | 420 | 170 | Stacked, `default`. |
| Card: Ticketing | 552 | 571 | 420 | 170 | Stacked, `active` (the work item is being handled here). |
| Agent lane | 108 | 777 | 864 | 96 | Pill, `card` fill, 6 px `ink` stroke. Step-chain glyph 56 at x 132, y 797. A cased agent path runs inside the pill from x 212 to x 940 at y 825. |
| Work item chip | 470 | 793 | 200 | 64 | `accent` fill, on the lane, mid-journey. |
| Lane stubs | 312, 756 | 741 and 873 | 6 | 36 | Plain connectors from the lane to the centre bottom of each top card (y 741 to 777) and to the centre top of each bottom card (y 873 to 909). The stub under Ticketing is a cased agent path. |
| Card: Shared inbox | 108 | 909 | 420 | 170 | Stacked, `default`. |
| Card: Documents | 552 | 909 | 420 | 170 | Stacked, `default`. |
| Old manual handoff | behind | | | | Two dashed `muted` diagonals at 35 percent opacity crossing the gap between cards, drawn under the lane and cards, visible only in the gaps. Dimmed, never over a label. |

Accent: Ticketing band, work item chip, cased stub. All four labels are static before any motion.

### Beat 3. Frames 480 to 660, midpoint 570. The free entry point.

What a muted viewer learns: it starts with a free 20-minute Live Audit with the process owner, which picks the one process that comes first.

| Block | x | y | w | h | Content and state |
|:-|:-|:-|:-|:-|:-|
| Headline | 108 | 135 | 864 | 216 | "Start with a / free Live Audit." `h1` |
| Supporting line | 108 | 379 | 864 | 136 | "Leave knowing which / process comes first." `support` |
| Candidate task A | 108 | 571 | 504 | 132 | `dim`. Content: a mini chain of two tool glyphs (Shared inbox, arrow, Ticket queue), 56 px glyphs, centred vertically, starting x 148. |
| Candidate task B | 108 | 727 | 504 | 132 | `selected` (cyan band, 6 px ink). Mini chain: Ticket queue, arrow, CRM. Approved-style badge (64 px cyan check) at top-right. |
| Candidate task C | 108 | 883 | 504 | 132 | `dim`. Mini chain: Documents, arrow, CRM. |
| Connector | 612 | 790 | 126 | 6 | Plain connector from task B's right edge to the person glyph. |
| Person glyph | 738 | 595 | 120 | 120 | Process owner, `default`. |
| Label: Process owner | 648 | 731 | 324 | 112 | "Process / owner" `label`, centred under the glyph (two lines). |
| Pill: 20 minutes | 648 | 899 | 324 | 80 | Pill tag "20 minutes", `default` (a factual term, not a countdown; no clock, no ticking). |

Accent: task B band and badge only.

### Beat 4. Frames 660 to 900, midpoint 780. Built into the workflow.

What a muted viewer learns: the agent is built as a workflow between the team's existing tools, which stay where the records live, with a person approving at the end.

| Block | x | y | w | h | Content and state |
|:-|:-|:-|:-|:-|:-|
| Headline | 108 | 135 | 864 | 216 | "Build it in / your workflow." `h1` |
| Supporting line | 108 | 379 | 864 | 136 | "Your tools stay the / system of record." `support` |
| Label: Existing tools | 108 | 571 | 864 | 56 | "Existing tools" `label`, left aligned, sits directly above the row it names. |
| Tile: Shared inbox | 108 | 643 | 264 | 150 | Icon tile, `default`. |
| Tile: Ticket queue | 408 | 643 | 264 | 150 | Icon tile, `active` (cyan band): the tool the selected task starts in. |
| Tile: CRM | 708 | 643 | 264 | 150 | Icon tile, `default`. |
| Stubs | 237, 537, 837 | 793 | 6 | 60 | Connectors from each tile down to the workflow card (y 793 to 853). Middle stub is a cased agent path; outer two plain. |
| Card: Agent workflow | 108 | 853 | 864 | 226 | Row variant, `default` stroke 6 px `ink`. Header at y 877: step-chain glyph 64 + label "Agent workflow". Body row at y 975 to 1047: three step tiles 72 x 72 at x 160, 504, 848, joined by a path. Step 1 `ink` fill with `card` check (done); step 2 `accent` fill, `ink` stroke (active); step 3 `card` fill with a small person glyph (human approval point, future). Path from step 1 to step 2 is a cased agent path; step 2 to step 3 is plain `graphite`. |

Accent: Ticket queue band, middle stub, step 2, the drawn path segment. Labels never sit on a connector.

### Beat 5. Frames 900 to 1140, midpoint 1020. Tested on real work, owner checks.

What a muted viewer learns: before launch the agent is run on the team's real work and the process owner checks and approves each output.

| Block | x | y | w | h | Content and state |
|:-|:-|:-|:-|:-|:-|
| Headline | 108 | 135 | 864 | 216 | "Test it on / real work." `h1` |
| Supporting line | 108 | 379 | 864 | 136 | "Your process owner / checks the output." `support` |
| Label: Real work | 108 | 571 | 300 | 56 | "Real work" `label`. |
| Work item 1 | 108 | 643 | 300 | 96 | Work item chip, `approved` (64 px badge at right). |
| Work item 2 | 108 | 755 | 300 | 96 | Work item chip, `active` (`accent` fill): the one under review now. |
| Work item 3 | 108 | 867 | 300 | 96 | Work item chip, `default` (waiting). |
| Agent tile | 432 | 755 | 96 | 96 | Icon tile with step-chain glyph, `default`. |
| Agent path in | 408 | 800 | 24 | 14 | Cased path from item 2 to the agent tile. |
| Agent path out | 528 | 800 | 36 | 14 | Cased path from the agent tile to the review card, arrowhead at x 564. |
| Card: Process-owner review | 564 | 571 | 408 | 508 | `default`, 6 px `ink`. Person glyph 64 at x 588, y 595. Label "Process owner" at x 588, y 675, w 360, h 56. Output preview panel x 588, y 755, w 360, h 180. Approve button x 588, y 959, w 360, h 96: pill, `accent`, check glyph + "Approve". |

Accent: item 2 fill, item 1 badge, cased paths, Approve button. Count of items is three as drawn objects, never as a number on screen.

### Beat 6. Frames 1140 to 1380, midpoint 1260. Delivery window.

What a muted viewer learns: one tested process goes live in 2 to 6 weeks.

| Block | x | y | w | h | Content and state |
|:-|:-|:-|:-|:-|:-|
| Headline lead | 108 | 135 | 864 | 108 | "Live in" `h1` (104 px). |
| Time claim | 108 | 251 | 864 | 368 | "2 to 6 / weeks." `h1-xl` (184 px, two lines). Largest type in the frame and in the whole set. |
| Supporting line | 108 | 651 | 864 | 136 | "One process, tested / before launch." `support` |
| Pill: Go live | 646 | 856 | 220 | 80 | Pill, `accent` fill, 4 px `ink` stroke, "Go live" `label` in `ink`. Centred over the window segment. |
| Rail | 108 | 974 | 864 | 12 | Timeline rail, `graphite`. |
| Window segment | 540 | 970 | 432 | 20 | Cased `accent` segment from the Week 2 tick to the Week 6 tick. |
| Stage tiles | 108, 236, 364 | 944 | 72 | 72 | Three tiles on the rail: selected task (check glyph), build (step-chain), owner test (person glyph). All `default` with a small `ink` check at the corner (complete). |
| Live tile | 720 | 944 | 72 | 72 | `accent` fill, `ink` stroke, flag glyph. On the window segment. |
| Ticks | 537, 966 | 950 | 6 | 60 | Ticks at Week 2 (x 540) and Week 6 (x 969). |
| Label: Week 2 | 465 | 1028 | 150 | 56 | "Week 2" `label`, centred on x 540. |
| Label: Week 6 | 822 | 1028 | 150 | 56 | "Week 6" `label`, right aligned to x 972. |

All four stages are visible together. Accent: window, Go live pill, live tile.

### Beat 7. Frames 1380 to 1560, midpoint 1470. The outcome, no numbers.

What a muted viewer learns: the same four steps that a person does by hand today are drafted, routed and updated by the agent, and the person only approves.

| Block | x | y | w | h | Content and state |
|:-|:-|:-|:-|:-|:-|
| Headline | 108 | 135 | 864 | 324 | "The agent / handles the / repeatable work." `h1`, three lines. |
| Supporting line | 108 | 487 | 864 | 68 | "Your team stays in control." `support`, one line. |
| Left column (before) | 108 | 611 | 420 | 400 | Four rows, each 420 x 88, 16 px gap (y 611, 715, 819, 923). Every row `dim`, person glyph 48 at left, labels "Draft", "Route", "Update", "Approve" in `slate`. Rows joined by short dashed `muted` hand-off lines in the 16 px gaps. |
| Right column (after) | 552 | 611 | 420 | 400 | Same four rows at the same y values. Draft, Route, Update: `active` (cyan band), step-chain glyph 48 at left, `ink` labels, joined by cased agent paths. Approve: `approved`, person glyph 48 at left, label "Approve", cyan badge. |

The two columns are structurally identical so the difference reads as "who does each step", with no counter, percentage or savings claim. Accent: right column only.

### Beat 8. Frames 1560 to 1800, midpoint 1680. Offer name and one CTA.

What a muted viewer learns: the offer is called AI Agent Implementation, the next step is a free 20-minute Live Audit, and they leave it knowing which process comes first.

| Block | x | y | w | h | Content and state |
|:-|:-|:-|:-|:-|:-|
| Offer name | 108 | 135 | 864 | 216 | "AI Agent / Implementation" `h1` |
| CTA button | 108 | 415 | 864 | 216 | Radius 32, `accent` fill, 4 px `ink` stroke. Text "Book a free 20-minute / Live Audit." `button` (58 px, 700), centred, two lines in a 136 px text box at y 455. |
| Benefit line | 108 | 671 | 864 | 136 | "Leave knowing which / process comes first." `support` weight, colour `ink` (18.38:1) for the final frame. |
| Delivery path | 108 | 903 | 864 | 72 | The four stage tiles from beat 6 (selected task, build, owner test, live) at x 108, 372, 636, 900 (72 x 72), joined by a 12 px `graphite` rail at y 933. Live tile in `accent`, others `default`. No labels: small supporting evidence only. |

The final frame is static from 27.0 s. Accent: CTA button and live tile. Nothing below y 975 except Off-white.

## 7. Building as a pure function of time (for the later video)

- One data array `BEATS[8]` holds start frame, end frame, midpoint frame, headline lines, support lines, labels, and every block box above. Still `n` is `seek(midFrame[n])`.
- Each block's opacity and translateY are closed-form functions of the frame: entrance is a critically damped spring (no overshoot) over about 60 frames, 24 px rise. No CSS transitions, timers or random values.
- At every midpoint frame all entrances for that beat are complete (progress 1.0). The stills are therefore the beat's resting state, not a mid-animation frame.
- Text measurement: compute every line's width with the loaded font before rendering; fail the build on overflow, on any box intersecting another box listed for that beat, on any text box outside x 108 to 972 or y 135 to 1100, or on any text/background pair below 7:1.
- Read times (template rule E): every headline is visible for at least 1.0 s + 0.4 s per word and every supporting line for at least 1.0 s + 0.35 s per word within its beat. Beat 7's headline (6 words) needs 3.4 s but its beat is 3.0 s (23.0 to 26.0 s). Fix at the video stage: show it from frame 1380 and hold it to 26.4 s while beat 8 fades in by 26.5 s, never with both message blocks fully visible. The still is unaffected.

## 8. Failure modes guarded against

1. Wordless abstraction: every still has an h1 and a supporting line; no frame relies on a diagram to carry meaning.
2. The agent as a floating shape: the agent is always a labelled card, a lane, or the step-chain glyph inside a tool workflow, never an orb, node cluster or mascot.
3. Cursor: none, anywhere. Human work is a person glyph with dashed hand-off lines.
4. Text over motion: diagram zones start below text boxes; connectors and moving items never cross a word.
5. Accent sprawl: cyan appears only on the active, selected, approved, live or CTA element, and always ink-cased.
6. Unreadable labels at phone size: 48 px minimum labels, 2x2 cards are stacked variant so labels never truncate; tiles only appear once the tool has been named.
7. Invented proof: no client names, logos, metrics, savings, percentages, case counts or testimonials. Three work items are objects, not a number.
8. Lower-control collision: nothing meaningful at y >= 1100.
9. Fake urgency: "20 minutes" is a pill tag, not a clock or countdown.
10. Silent font fallback: the build fails if `document.fonts.check('700 104px "Instrument Sans"')` is false.
11. Forbidden characters: the build greps every visible string for U+2014 and for a double hyphen and fails on either. No internal ticket refs or agent names on screen.
12. Reusing the rejected cut: no file is imported from `content-motion/ai-agent-implementation-explainer/`.

## 9. Deviations from the storyboard, for owner review

- Beat 1 adds the label "AI agent" on the agent card. The storyboard has the agent enter at 1.2 s but lists no label for it; an unlabelled agent shape is exactly the failure the owner rejected.
- Beat 1 replaces the storyboard's "human cursor" with a person glyph and dashed hand-off lines, per the owner's no-cursor direction.
- Beat 4 shows the three existing tools as icon tiles under the group label "Existing tools" (each tool was named in beats 1 and 2). At 264 px wide, individual 48 px labels would not fit.
- Beat 6 uses the three storyboard labels as: "Week 2" and "Week 6" as rail ticks bounding the go-live window, "Go live" as a pill over that window. The four stages are shown as tiles without labels.
- Offer facts conflict to resolve before the video: the live service page (`content/services/ai-agent-implementation.md`) is now titled "Build Queue" and promises the first agent live in 10 business days, while this storyboard says "AI Agent Implementation" and "2 to 6 weeks". This spec follows the storyboard as instructed. The Live Audit CTA and "you leave knowing which process goes first" do match the page.
