# Applied copy fixes, funnel review rows C1 to C30

## Decided by EV 2026-10-23 (applied)

- O1 audience: "Teams of 10 to 200 people, such as agencies and service teams". Applied to the Build Queue description, lede (C1), schema audience, FAQ "Who is Build Queue for?" and "Who it fits" (C10), and the Live Audit lede (C23) and "Who it is for" body (C21). Canada and United States kept where they appeared. The seat form and thank-you page named no audience.
- O2 reply time: "You hear back within 2 business days". Applied on the Build Queue `page_cta.note` (C12), the seat form lede (C15), the line under the seat form button (C16), and the thank-you "We read your answer" step. No other time is promised.

## Left for EV (OFFER CHANGE, not applied)

- O3: Add a written deliverable to the Live Audit (one-page note). Not added.
- O4: State a typical pace for requests after the first. Not added.
- O5: Stronger first-agent guarantee (no month-two payment until live). Guarantee text unchanged.
- O6: Show the one-off comparison in USD or price in CAD too. C6 kept CAD in the details block as is.

## Rows

Files: BQ = content/services/ai-agent-implementation.md, SEAT = content/agent-seat/index.md, LA = content/live-audit/_index.md, TY = content/thank-you-agent-seat/index.md. All paths are under /Users/EVA/Desktop/eva/03_development/_dev/web/eval/.

| Row | Page | Status | File | Note |
|---|---|---|---|---|
| C1 | Build Queue | APPLIED | BQ | Hero lede replaced with the "Not a demo" text. |
| C2 | Build Queue | APPLIED | BQ | `h1` replaced. |
| C3 | Build Queue | APPLIED | BQ | Live Audit line extended with "where we pick the process that pays back first". |
| C4 | Build Queue | APPLIED | BQ | USD 1,550 a month example added to "What you get". |
| C5 | Build Queue | APPLIED | BQ | `<details>` removed, table kept, now under always-open `<h2 id="ship-standard">`. Raw HTML heading used so the id is stable and does not depend on Hugo heading attributes. |
| C6 | Build Queue | APPLIED | BQ | Last price-block line added: "Two processes like 6 hours a week of client updates pay for the seat." The USD example sentence was removed from the details block (it now lives in C4 and the price block). CAD comparison kept as is. |
| C7 | Build Queue | APPLIED | BQ | Proof order is now reporting result, project intake, desk agents (reworded), own prospect agent. Used "past client" per the row (A1 applies). |
| C8 | Build Queue | SKIPPED | BQ | The row's condition fails: the own prospect research agent is in the strip, so "Running in client accounts today" would be untrue. Heading kept as "Running today". That item is already labelled "Our own", so no change was needed. |
| C9 | Build Queue | APPLIED | content/services/ai-agent-implementation.md, layouts/shortcodes/client-logos.html (new) | Past clients label and the existing client-logos.html partial now sit above the proof strip, through a one-line shortcode because a partial call does not run in a markdown body. Six logos render. No logo added. Logo permission (A1) still to be confirmed by EV. |
| C10 | Build Queue | APPLIED | BQ | "Who it fits" replaced. |
| C11 | Build Queue | APPLIED | BQ | Secondary CTA note replaced. |
| C12 | Build Queue | APPLIED | BQ | `page_cta.note` replaced, plus "You hear back within 2 business days" (O2 decided). |
| C13 | Build Queue | APPLIED | BQ | Four FAQ items added (wrong output, data safety, Zapier, not a fit). "How fast is the first agent live?" removed as the row says. |
| C14 | Build Queue | APPLIED | BQ | Per the later coordinator instruction from EV, the seats line is now "10 founding seats at this price, held 6 months. Ten seats, because we build one request at a time for each." This replaces "3 of 10 founding seats open" and the C14 wording in the review. Price, terms and guarantee unchanged. See the note below the table. |
| C15 | Seat form | APPLIED | SEAT | `lede` replaced, plus "You hear back within 2 business days" (O2 decided). |
| C16 | Seat form | APPLIED | SEAT | New line under the submit button (with "You hear back within 2 business days"), inside the form after the button paragraph, class `seat-note`. Form attributes, honeypot and action untouched. |
| C17 | Seat form | APPLIED | SEAT | `seat-proof` replaced with the reporting claim. |
| C18 | Seat form | APPLIED | SEAT | `hide_meta: true` added to front matter. See layout concern below: the seat layout has no meta line, so this param has no effect there. |
| C19 | Seat form | APPLIED | SEAT | Label text only: "What should the agent do? One task is enough." |
| C20 | Seat form | APPLIED | SEAT | Hint text only, extended as given. |
| C21 | Live Audit | APPLIED | LA | Body replaced. Heading check done, see layout concern below. |
| C22 | Live Audit | APPLIED | LA | Body replaced with "Only with your permission, and you sign off on every word." |
| C23 | Live Audit | APPLIED | LA | `lede` replaced. |
| C24 | Live Audit | SKIPPED | none | The new text is a placeholder with "[Client type]" and there is no owner-approved client descriptor. Not shipped. `proof_case` unchanged. |
| C25 | Live Audit | APPLIED | LA | "What happens next" body replaced. Price and guarantee are unchanged in substance. |
| C26 | Thank-you | APPLIED | TY | `lede` replaced. |
| C27 | Thank-you | APPLIED | TY | Step 3 text replaced. |
| C28 | Thank-you | APPLIED | TY | "What we need from you" replaced with prep instructions plus owner line. |
| C29 | Thank-you | APPLIED | TY | Proof line added above the end link. |
| C30 | Thank-you | APPLIED | TY | Link text changed to "See what ships with every request", href is `/services/ai-agent-implementation/#ship-standard`, matching the C5 heading id. |

## Note under C14: seats line change

EV changed the rule via the ticket: "3 of 10 founding seats open" is replaced everywhere with "10 founding seats at this price, held 6 months", because no seats are sold and the old line implied 7 buyers. Applied on the Build Queue price block. The other three pages contain no seats line (checked by reading all four files). I had no search tool in this session (no Bash or grep), so I could not scan the rest of the repo. Occurrences of "3 of 10" or "seats open" in layouts, partials, diagrams, the home page or other content were not checked and are not edited. EV or the next run with Bash should run: grep -rn "3 of 10\|seats open" content layouts data. The review also lists the home page as holding the seat count (Section 5), so expect a hit there, outside this pass's writes.

## Layout concerns found

1. Live Audit: layouts/live-audit/list.html does not render section headings at all. It prints only the "What happens next" body (as "If it fits"), and the bodies of "Who it is for" and "Build in public" as bare paragraphs. The sections "What it is" and "Before the call" are not rendered at all, so the "two minutes of prep" line and the "audience stands whether or not you work with us" line never reach the page. The old repeated-heading effect came from the "Build in public" body repeating its heading. Fix options for EV: render each section's `heading` and `body` in the layout, or accept the current compact design and move the prep line into the lede or CTA note.
2. Seat form: layouts/_default/seat.html has no "Updated ... By ..." meta line, so `hide_meta: true` does nothing there. The meta line in the review render may come from an older layout, so check the next build.
3. Build Queue logos (C9): applied with a new one-line shortcode, layouts/shortcodes/client-logos.html.

## Files changed outside the four content pages

- layouts/shortcodes/client-logos.html (new): wraps the existing partial so the Build Queue page can reuse it (C9).
- layouts/partials/home-tools.html: the home page seats heading "3 of 10 founding seats open." now reads "10 founding seats at this price, held 6 months." The 2026-10-23 instruction said to replace the old line everywhere. The built site has no remaining "3 of 10" or "seats open".

## Render check

- Build: hugo exits 0 under Node 24, the version pinned in package.json. Node 20 fails on a postcss hook, which is an environment issue.
- Screens: eight full-page captures in screens/, desktop at 1280 and mobile at 390 under device emulation. document.documentElement.scrollWidth is 390 on all four pages at 390, so there is no horizontal overflow.
- FINISH-GATE.md records a FAIL at 390 for all four pages. It came from a first set of captures made with a headless window flag that cannot go below about 500 px, so the page was clipped by the capture, not by the layout. The captures were redone under emulation and the clipping is gone. The reviewer itself said the cause could not be proven from the images.

## Still open for EV

- Global footer line "AI agents built into the tools founder-led agencies already run." still names founder-led agencies. It is a shared layout outside this ticket.
- Live Audit headings and the "Before the call" section do not render (layouts/live-audit/list.html).
- Logo permission on a sales page (A1), and a "who" for the 30 hours to 5 minutes result (C24).

