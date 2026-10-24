# UI Finish Gate: Hormozi funnel pass (4 pages, desktop 1280 and 390)

Goal of the pass: a founder burned by AI demos reads the funnel and books the Live Audit.
Evidence: 8 full-page captures in screens/. Desktop captures are 1280x3600, 390 captures are 390x5200. Copy source: APPLIED.md.

## Decision: HOLD (all four pages FAIL at 390, all four PASS at desktop)

| Page | Desktop 1280 | 390 | Page verdict |
|---|---|---|---|
| Build Queue (ai-agent-implementation) | PASS | FAIL | FAIL |
| Seat form (agent-seat) | PASS | FAIL | FAIL |
| Live Audit | PASS (known layout gaps, see below) | FAIL | FAIL |
| Thank-you (thank-you-agent-seat) | PASS | FAIL | FAIL |

## Blocking defect (one, shared by all four pages)

**B1. At 390px the page is wider than the viewport and content is clipped on the right edge, on every page.**

Evidence in the 390 captures:
- Build Queue: the h1 reads "The work your team re / every week, done by an AI / agent in your own tools / First one live in 10 busi / days." The lede, the "From Day 0 / By Day 10 / Monthly" timeline pills ("Mont" cut), the price block lines and the Ship Standard table's second column are all cut mid-word.
- Build Queue Past clients grid: six logos are present, but in 3 columns by 2 rows and the third column (Bio Seaweed Gel, CCO) is cut off at the edge.
- Seat form: h1 reads "Request a founding se". The textarea, tools field, Email field and the "Request my founding seat" button run past the right edge, so their right ends are not visible. Chips are cut ("Draft quotes from reque", "Excel", "Shopify" half shown).
- Live Audit: h1 and lede cut ("For teams of 10 to 200 people, such as agenci"), the three hero cards are cut, the logo grid third column is cut.
- Thank-you: h1 "Your request is in. Here is w", step cards and the "What we need from you" paragraph are cut.
- The site nav (theme toggle half visible at the top right) and the footer ("© 2026 EV Advisory. All rights reserved" cut) are clipped on all four pages, including pages whose copy changes are small. That points to a shared cause (layout or capture setup), not to this copy pass.

What I could not determine from images: whether this is a real layout overflow (a shared element wider than 390, or a missing or overridden viewport meta) or a capture artifact. The cause is not provable from a screenshot.

Verify the fix with: at a 390px viewport, `document.documentElement.scrollWidth <= 390` on all four URLs, then re-capture the 390 shots and confirm (a) the h1 wraps fully inside the margins, (b) the Past clients grid shows all six logos inside the viewport, (c) the seat form fields and submit button end inside the right margin, (d) the footer text wraps.

Until B1 is cleared, items 2, 4, 5 and 6 below are confirmed at desktop and only partly readable at 390 (their left halves match; the right halves are clipped).

## Per-page evidence

### Build Queue: desktop PASS
- Heading: one h1 ("The work your team repeats every week, done by an AI agent in your own tools. First one live in 10 business days."), then lede starting "Not a demo." No duplicate headings, no body shown as a heading.
- Past clients: label "PAST CLIENTS" over a clean single row of six logos at the time of that render (one has since been removed from the site), directly above the "RUNNING TODAY" proof strip. Criterion 2 met at desktop. Note: APPLIED.md says C9 (logos) was skipped, yet the strip renders. APPLIED.md is out of date on this row, or the layout already outputs it. Not a defect.
- Seats line: the price block reads "Founding seat: USD 1,995 per month, price held 6 months. 10 founding seats at this price, held 6 months. Ten seats, because we build one request at a time for each." No "3 of 10" anywhere in the visible page. Criterion 5 met.
- Ship Standard: "The 8-Part Ship Standard: what you get with every request" is an open h2 with the table fully visible (Workflow map, Baseline measure, The working agent, Test log, Runbook, Access and credentials list, then more rows at 390). Criterion 6 met.
- Placeholder text: none.
- Cut-off: the desktop capture ends inside the Ship Standard table (at "Access and credentials list"), so the rest of the page (FAQ, final CTA) is not visible at desktop. The 390 capture shows the page continuing to "What we need from you", "How does this compare to a one-off project?" and an "FAQ" heading, and it also ends cut off. I could not check the FAQ answers or the page bottom for "3 of 10" or "seats open".

### Seat form: desktop PASS
- Fields visible: "What should the agent do? One task is enough." textarea with example chips, "Which tools does it touch?" field with tool chips, Email, and the "Request my founding seat" button.
- Under the button: "No payment now. You hear back within 2 business days. Next: we reply, you book a 20-minute Live Audit, and your first agent goes live within 10 business days of access." Criterion 4 met.
- Lede carries "You hear back within 2 business days". Proof line "Reporting work for a past client: 30 hours a month down to 5 minutes." is present. No "Updated ... By ..." meta line shows.
- No seats line on this page, no placeholder text.
- The capture is complete (footer, then blank canvas).

### Live Audit: desktop PASS
- h1 "Find the first automation worth shipping, on one free call." plus lede and the "Book your Live Audit" button, then the three-card hero. No placeholder: "[Client type]" is absent (C24 correctly skipped). Past clients: six logos in a clean row, with "30 hours a month of reporting, down to 5 minutes."
- Known layout gaps, reported and not new: there are no visible section headings. "If it fits" shows only as an eyebrow, "Who it is for" is a bare paragraph, and "Only with your permission, and you sign off on every word." sits orphaned beside it with no heading, so it does not say what it refers to. "What it is" and "Before the call" are NOT visible. The "two minutes of prep" line and the "audience stands whether or not you work with us" line from the review do not reach the page.
- Optional: the audience sentence "For teams of 10 to 200 people, such as agencies and service teams" appears twice (lede and "Who it is for"). The lede opens with a fragment.

### Thank-you: desktop PASS
- h1 "Your request is in. Here is what happens next." Lede: "Fastest next step: book your free 20-minute Live Audit now. Every seat starts with one." plus a "Book your Live Audit" button.
- Steps: 1 NOW "We read your answer ... You hear back within 2 business days." 2 NEXT "Book your free Live Audit" (highlighted in cyan), 3 IF IT FITS "Your first agent goes live". Criterion 7 met: the Live Audit is the highlighted NEXT step and the 2 business days line is there.
- Below: "What we need from you. Before the audit: pick two or three repeated tasks and have their tools open ...", the proof line, and the link "See what ships with every request".
- Non-blocking: "Fastest next step" is softer than "required". The seat form says "Next: we reply, you book a 20-minute Live Audit" while the thank-you says book now. Two different orders to the same step. Optional fix: align the seat form note to "Next: book your 20-minute Live Audit, and we reply within 2 business days" or soften neither.

## Optional refinements (not blocking)
- Build Queue price block repeats "held 6 months" back to back ("price held 6 months. 10 founding seats at this price, held 6 months."). Trim the first.
- Build Queue hero timeline renders "1Name it" with no space between the number and the label.
- Live Audit orphan sentence and missing headings: EV's call per APPLIED.md (render heading and body in layouts/live-audit/list.html, or move the prep line into the lede or CTA note).

## Keep
- Build Queue: the Past clients strip above Running today, the open Ship Standard table, the single reporting-result proof line repeated on the seat and thank-you pages.
- Seat form: fields and button untouched, with the reassurance lines directly under the button.
- Thank-you: the highlighted NEXT step.

## PASS criteria (to flip HOLD to PASS)
1. B1 fixed: no horizontal overflow at 390 on all four pages (`scrollWidth <= 390`), re-captured.
2. At 390 the Build Queue logo grid shows all six logos, the seat form fields and button sit inside the margins, and "No payment now" and "You hear back within 2 business days" are fully readable under the button.
3. Re-run grep for "3 of 10" and "seats open" across content, layouts and data (not done in the copy pass), and confirm the Build Queue FAQ and page bottom.
