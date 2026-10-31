# AI Agent Implementation explainer, v3 interaction cadence

Silent 40.0 s render of the six interactions in beats.md. One work item moves through the stage, and every beat is a state change on an object that stays on screen. There are no camera moves.

## Re-render

```
node content-motion/ai-agent-implementation-explainer-30s/v3/render-video.cjs
```

Writes explainer-4x5.mp4 (1080x1350), explainer-9x16.mp4 (1080x1920), frames/ (one settled frame per beat per format, taken from each MP4, plus contact sheets) and check-output.txt. Exits non-zero if any check fails. `only=4x5` renders one format. `preview=120,300 out=DIR` writes PNG stills and runs the layout check without encoding. Needs ffmpeg, ImageMagick and the Playwright headless shell named in render-video.cjs.

## How it works

- beats.js is data only. ELEMENTS lists every object on stage (geometry, kind, parent) in paint order. BEATS lists each beat as rows: `el, from, to, at, dur, cue`, as in beats.md.
- interaction.js is the one Interaction component. It compiles the rows into a state track and a slot track per element, then draws any frame as a pure function of time. No beat has its own animation code. At load it rejects any row whose `cue` starts before its parent row ends, and any row whose `from` is not the element's state at that moment.
- A change is a fill, stroke, accent band, badge, text swap, line draw or slot move. Everything settles on a critically damped spring with no overshoot. A child inherits its parent's presence and dims with it.
- Pixels come from ../index.html: palette, Instrument Sans and the drawing helpers (cards, glyphs, person, badge, cased lines). The same Playwright seek and pipe to ffmpeg pipeline as v2 is used. v2 is unchanged.
- checks.js runs on every settled frame. Glyph ink must stay inside its text box. Nothing may leave the safe zone (x 108 to 972, y 135 to 1084). No text may touch another text, a shape or a line, and no two shapes may partly overlap.

## Checks (all in check-output.txt)

- Each beat holds fully static for at least 1.5 s, measured from the rows.
- Seams: the next headline is visible on the beat's first frame and the outgoing headline is already gone. Inside B6, the timeline headline is gone before the offer name appears.
- 9:16: the art is scaled 0.97 and centred, with side margins of 120 px. The stage sits 8 px further below the message than in 4:5 (B1, the loosest beat, stays under the 160 px gap limit), and the whole stack is centred between y 250 and y 1500. The stage never moves between beats, so one placement serves every beat. The smallest text is 48 x 0.97 = 46.6 px. The stack gap stays at or under 160 px, and the ink bounds of every settled frame stay inside x 120 to 960 and y 250 to 1500.
- MP4: 30 to 45 s, H.264 yuv420p at 30 fps, no audio stream, moov before mdat.
- Prose: README.md and check-output.txt contain no em dash and no double hyphen.

## Beats

| id | Time | Interaction | Rows |
|:-|:-|:-|:-|
| B1 | 0.0 to 5.5 s | The work chip drops into the Shared inbox, the card goes active, an unread dot lands, and the dashed hand-off line draws to the person | 1a to 1e |
| B2 | 5.5 to 11.5 s | The AI agent card enters and the hand-off line dims to 35 percent. The dot clears, three message fields light one by one, then travel to the agent as Who, What and How urgent | 2a to 2h |
| B3 | 11.5 to 17.5 s | An agent path draws to the Ticket queue and a ticket chip reads New, then Routed. A second path draws to the CRM, the row changes to Updated, and the CRM card takes a check | 3a to 3j |
| B4 | 17.5 to 23.5 s | The tools dim and the review card enters around the person. The ticket chip slides in and becomes the Draft reply panel. The person link turns solid, then Approve becomes Approved and the badge lands | 4a to 4j |
| B5 | 23.5 to 29.0 s | The review card dims. Documents assembles a report, and a copy travels along a cased path to three team members, who flip to checked. Sent appears and Documents takes a check | 5a to 5j |
| B6 | 29.0 to 40.0 s | The rail draws, then the playhead steps Audit, Build and Test, each taking a check. The Week 2 to Week 6 window draws and Go live goes active. The stage clears for the offer name, the CTA, the benefit line and the four-stage path, which hold static from 36.8 s | 6a to 6n |

Six cadence pips sit at y 1060 to 1084, left aligned so they stay clear of the B6 week labels. A pip fills when its beat's last change lands.

## Deviations from beats.md, for the reviewer

| What | Why |
|:-|:-|
| B3 headline is set on 3 lines ("It opens the / ticket and / updates the CRM.") and B4 on 3 lines ("Your process / owner / approves it.") | At the 104 px token, "It opens the ticket" is 868 px wide and "Your process owner" is 955 px, so neither fits the 864 px column. The words are unchanged and type is not shrunk. |
| B4 support is set on one line ("Nothing goes out unchecked.") | The words are unchanged. One line gives the review card room under a 3-line headline. |
| Tool labels break onto two lines ("Shared / inbox", "Ticket / queue") | This lets three tool tiles, each holding its item, sit in one row inside the 4:5 safe zone. |
| Pip rows fire when the beat's last change lands, not at the beats.md times | At the beats.md times the pip change itself broke the 1.5 s static hold in every beat. |
| Retimed to satisfy the cue rule: 3a to 3i, 4h and 4i (3.9 to 4.0 s), 5c to 5i, 6b to 6h, 6l to 6n | Several beats.md rows start before the row they cue on ends (3i, 4h, 4i, 5h, 5i, 6l), and B3, B5 and the B6 timeline left under 1.5 s of hold. Every change and its order is kept; only durations and start times are tightened. |
| ADDED 4a1 to 4a5: the inbox dims; the agent card, the hand-off line and both agent paths leave | The review card needs the band the agent card used. With the 3-line headlines, the 4:5 stage cannot hold everything at once at 48 px labels. |
| ADDED 4h1: the review card goes to `approved` | Row 5a starts from `approved`. |
| ADDED 5a1 to 5a3: the dimmed tool tiles leave; 5b1 to 5b3: team members enter as `dim`; 5d1: the report path draws with the travel | Documents and the team take the tiles' row. beats.md has the team on stage and `dim` before 5e, and the path drawn with the travel. |
| ADDED 6x: the B1 to B5 stage leaves in the first 0.3 s of B6. The "2 to 6 weeks." line enters at 0.3 s and the support line at 0.5 s | This keeps the large type clear of the outgoing review card. "Live in" is still on screen from the beat's first frame. |
| B6 playhead ends on Test, and Go live lights by state | beats.md has no playhead move to Go live. |

The offer fact conflict recorded in ../DESIGN.md section 9 (the "2 to 6 weeks" claim and the Live Audit CTA) still needs an owner call before publishing. There is no link on screen, so the post caption must carry it.
