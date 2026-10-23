# Hormozi Funnel Review: Agent Seat Funnel

Reviewed 2026-10-23 against the `dev` branch of the eval site (head 2876801) and the renders in `output/cro-funnel-design-pass/` and `output/cro-seat-deploy/`.

Pages in funnel order:

1. Build Queue offer page: `content/services/ai-agent-implementation.md`
2. Request a founding seat form: `content/agent-seat/index.md`
3. Thank-you page: `content/thank-you-agent-seat/index.md`
4. Live Audit page: `content/live-audit/_index.md` (the side door from 1 and 2, and the next step from 3)

Buyer used for the review: a founder or operations lead at a company of 10 to 200 people. They want AI agents doing real work, they have been burned by demos, and they are not technical.

## Assumptions (stated instead of asked)

| # | Assumption | Why it matters |
|---|---|---|
| A1 | The proof on the pages is accurate, and the six logos in `partials/client-logos.html` are real past clients you are allowed to show. | Fix 3 reuses the logo strip on the Build Queue page. If the logos cannot be used there, drop that part of the fix. |
| A2 | "3 of 10 founding seats open" is true today and gets updated as seats fill. | Fake scarcity costs more trust than it earns. Check it before every deploy. |
| A3 | The Live Audit is a required step before a seat starts ("Every seat starts with a free 20-minute Live Audit"). | The thank-you page currently treats it as optional ("While you wait"). Fix 4 depends on this. |
| A4 | Submitting the form takes no payment and books nothing. | Fix 5 adds "No payment now" under the submit button. Only ship that line if it is true. |
| A5 | The page audience (founder-led agencies and service teams) is a deliberate niche, not a draft. | The buyer in this brief is wider (any 10 to 200 person company). See OFFER CHANGE row O1. |
| A6 | The seat form screenshot comes from `cro-seat-deploy/2-job-pressed-light.png` (390 wide). It shows a lede and a "See the full terms" link that the markdown does not contain, so the layout adds them. The `seat-proof` line in the markdown does not show in that render. | The form fixes target the markdown. The layout line needs a check on the next render. |

## 1. Value Equation Scorecard

Each lever is scored out of 10, where 10 means the page does that lever as well as it can. For Time delay and Effort, a high score means the page makes the wait feel short and the work feel small.

| Page | Dream outcome | Likelihood | Time delay | Effort | Total /40 | Score /10 |
|---|---|---|---|---|---|---|
| Build Queue | 5 | 6 | 9 | 7 | 27 | 6.8 |
| Seat form | 3 | 4 | 5 | 9 | 21 | 5.3 |
| Live Audit | 5 | 7 | 9 | 9 | 30 | 7.5 |
| Thank-you | 4 | 4 | 5 | 7 | 20 | 5.0 |

### Build Queue (6.8)

- **Dream outcome 5.** "Your team's repeated work, handed to AI agents" names a task, not a result. The buyer cannot picture the end state: hours back, a reply sent before lunch, a report that writes itself. The page's best outcome number (6 hours a week, about USD 1,550 a month) is hidden in a collapsed `<details>` block.
- **Likelihood 6.** The page has strong mechanisms: real examples, a person approves, you own the accounts, a before and after measure, an 8-part Ship Standard. But the Ship Standard is collapsed. The lead proof item ("a real request sent to each, a real answer received") is a smoke test, and to a buyer burned by demos it reads like one more demo. The page shows no founder face or name, and no logos, even though the Live Audit page has six.
- **Time delay 9.** "First one live in 10 business days" sits in the H1, and the Gantt makes the timeline visual. This is the best lever on the page. The only gap is that the page never says how fast requests 2 and 3 ship.
- **Effort 7.** "1 to 2 hours a week" and "one owner per process" are clear. "Share 20 to 30 real past examples" and "least-privilege access" are jargon to a non-technical buyer, with no "we do the setup" line next to them.

### Seat form (5.3)

- **Dream outcome 3.** This is a form page, so a low score is expected. It still never restates what the buyer gets for filling it in.
- **Likelihood 4.** The proof line repeats the weakest proof item. Nothing next to the button lowers risk: no "no payment", no "no call needed to apply".
- **Time delay 5.** "We reply by email with whether it fits" gives no time frame. The buyer submits and cannot tell whether a reply comes today or in two weeks.
- **Effort 9.** Three fields, tap chips, plain labels. This is excellent. The only clutter is the "Updated October 23, 2026, By EV Advisory" meta line in the hero, which is blog chrome on a form.

### Live Audit (7.5)

- **Dream outcome 5.** "The first automation named" is a thin deliverable: a name and a reason. The buyer wants hours back, and this page sells a recommendation.
- **Likelihood 7.** The six past-client logos help a lot. "The audit stands whether or not you work with us" removes the fear of a sales call, but it sits inside a card bullet. The 30 hours to 5 minutes result has no "who" attached.
- **Time delay 9.** 20 minutes, and you leave with the answer.
- **Effort 9.** "Two minutes of prep" is excellent. The render shows two section bodies without their headings, and one section repeats its heading as its body ("Your call can become your case study. Your call can become your case study, only with...").

### Thank-you (5.0)

- **Dream outcome 4.** Step 3 ("Your first agent goes live") is the only outcome on the page, and it opens with access language instead of the result.
- **Likelihood 4.** The page has no proof at all at the moment the buyer has just committed. It is the cheapest place to stop buyer's remorse.
- **Time delay 5.** No reply time is given. "While you wait" tells the buyer there is a wait without saying how long.
- **Effort 7.** Steps are clear. "One owner, 1 to 2 hours a week" is good. It does not say what to prepare for the audit, even though the Live Audit page already has that line.

## 2. Buyer Objections

"Current answer" quotes the page or says "none". Each destroyer line uses only facts already on the pages.

| # | Objection (buyer's words) | Page where it bites | Current answer | Destroyer line |
|---|---|---|---|---|
| 1 | "I've seen slick AI demos. It will fall apart on our real work." | Build Queue hero | Partial, below the fold: "tested on your real examples" | "No demos. We test it on 20 to 30 of your own past emails, briefs or tickets, and you see every output before it goes live." |
| 2 | "It will send something wrong to a client and embarrass us." | Build Queue | Diagram only: "A person approves. Before anything goes out" | "Nothing leaves your account until a person on your team approves it." |
| 3 | "I'm not technical. I can't run or fix this." | Build Queue, Seat form | FAQ: "The process owner you already have can run each agent" | "If you can approve an email, you can run the agent. You get a runbook and a recorded handoff with your process owner." |
| 4 | "Giving an outside firm access to our systems is a security risk." | Build Queue | Collapsed: "least-privilege access, your accounts, your keys, revocable without calling us" | "Your accounts, your keys. Every access we hold is on a list you keep, and you can revoke any of it without calling us." |
| 5 | "USD 1,995 a month for something I haven't seen work is a lot." | Build Queue price block | Collapsed: the 6 hours a week, USD 1,550 a month example | "One process that eats 6 hours a week costs about USD 1,550 a month. Hand off two and the seat has paid for itself." |
| 6 | "Subscriptions trap you. If I stop paying, I lose everything." | Build Queue | Diagram plus FAQ: "If you cancel, the agents keep running in your accounts" | "Cancel any month. The agents stay in your accounts and keep running. You own every one." |
| 7 | "One request at a time is too slow. I have ten processes." | Build Queue Gantt | Partial: "unlimited queue behind it" | "One at a time is why each one ships: built, tested on your examples, handed off, measured, then the next one starts." (See OFFER CHANGE O4: also state a typical pace for later requests.) |
| 8 | "My team has no time to set this up." | Build Queue, Thank-you | "One owner per process, 1 to 2 hours a week" | "You give one person 1 to 2 hours a week. We do the build, the testing and the handoff." |
| 9 | "Who are you? A small firm might not be around next year." | Build Queue, Seat form | None. No founder name or face, and no logos on the Build Queue page | "If we ever stop, your agents do not. They run in your accounts, with a runbook and every credential listed." (Proof needed: founder name, photo and one-line track record, see Section 5.) |
| 10 | "Our process is too messy or too custom for this." | Build Queue | Collapsed "Not yet" list: "a process that is not written down" | "If one person can walk us through it with 20 real examples, it can be a request. If not, the free Live Audit tells you that first." |
| 11 | "The free audit is just a sales call." | Live Audit | In a card bullet: "Stands whether or not you work with us" | "You leave with the first automation named and why. Build it with us, with someone else, or yourself." |
| 12 | "When will I hear back?" | Seat form, Thank-you | None | Needs an owner commitment first (OFFER CHANGE O2). Once set: "We reply by email within [N] business days." |
| 13 | "Isn't this just Zapier or ChatGPT with a markup?" | Build Queue | None | "Zapier moves data between tools. An agent reads the request, drafts the work, and waits for your approval, built and tested on your own examples." |
| 14 | "What if it doesn't actually save time?" | Build Queue | "We measure before and after. If the after number is not better, you see that too." | "We measure time, frequency and error rate before and after. If the number does not move, you see it, and you can cancel any month." |
| 15 | "We're not an agency. Is this for us?" | Build Queue, Live Audit | "Founder-led agencies and service teams" (excludes the buyer in this brief) | Depends on OFFER CHANGE O1. If the audience widens: "If your team answers the same emails, builds the same reports or chases the same invoices every week, it fits." |
| 16 | "'3 of 10 seats open' is fake urgency." | Build Queue | The claim itself, with no context | Keep it only while it is true (A2). Add the reason the limit exists: "Ten founding seats because we build one request at a time for each seat." |

## 3. Copy Fixes

These are text changes only. No price, seat count, guarantee or term changes. Rows marked LAYOUT touch a template string or a layout element, not the markdown body.

| # | Page | Section | Current text | New text |
|---|---|---|---|---|
| C1 | Build Queue | `lede` (hero) | "Founder-led agencies and service teams in Canada and the United States. One agent at a time, inside the tools you already run, in accounts you own." | "Not a demo. Each agent is tested on 20 to 30 of your own past examples, a person on your team approves before anything goes out, and it runs in accounts you own. For founder-led agencies and service teams in Canada and the United States." |
| C2 | Build Queue | `h1` | "Your team's repeated work, handed to AI agents. First one live in 10 business days." | "The work your team repeats every week, done by an AI agent in your own tools. First one live in 10 business days." |
| C3 | Build Queue | Body line under hero | "Every seat starts with a free 20-minute Live Audit." | "Every seat starts with a free 20-minute Live Audit, where we pick the process that pays back first." |
| C4 | Build Queue | "What you get" paragraph | "A working agent in accounts you own, tested on your real examples, with a runbook and a recorded handoff. We measure before and after. If the after number is not better, you see that too." | "A working agent in accounts you own, tested on your real examples, with a runbook and a recorded handoff. Example: 6 hours a week of client updates costs about USD 1,550 a month at a USD 60 loaded hourly cost. We measure your number before and after. If the after number is not better, you see that too." |
| C5 | Build Queue | `<details>` "What ships with every request" | Collapsed by default, with the 8-row table hidden | Make it an always-open section headed "The 8-Part Ship Standard: what you get with every request". Keep the table as is. This is the strongest likelihood asset on the page, and a buyer burned by demos needs to see it without clicking. |
| C6 | Build Queue | `<details>` "How does this compare to a one-off project?" | Collapsed. "A one-off agent project runs about CAD 5,000 to 15,000 ... so two processes like that pay for the seat." | Move the ROI sentence into the price block as its last line: "Two processes like 6 hours a week of client updates pay for the seat." Keep the CAD comparison in the details block. (Mixing CAD and USD in one block confuses the buyer. See O6.) |
| C7 | Build Queue | Proof strip, order and wording | Item 1: "Three desk agents for a client: a real request sent to each in September 2026, a real answer received." Item 4: "Earlier reporting work: 30 hours a month down to 5 minutes." | Put the reporting result first: "Reporting work for a past client: 30 hours a month down to 5 minutes." Move the desk agents line to third: "Three desk agents live for a client since September 2026, each tested with a real request." Keep the words "past client" only if that result came from a client (A1). Replace both with measured numbers once Section 5 proof exists. |
| C8 | Build Queue | Proof strip heading | "Running today" | "Running in client accounts today" (only if items 1 to 3 are all client or live systems; item 3 is your own agent, so either keep "Running today" or label item 3 "Our own:"). |
| C9 | Build Queue | LAYOUT: proof strip | No logos | Add `{{ partial "client-logos.html" . }}` above the proof strip, labelled "Past clients", the same as on the Live Audit page (A1). |
| C10 | Build Queue | "Who it fits" | "Founder-led agencies and service teams with real tools and one owner per process, 1 to 2 hours a week." | "Founder-led agencies and service teams that run on email, a CRM, a project tool or spreadsheets. You give one owner per process 1 to 2 hours a week. We do the build." |
| C11 | Build Queue | Secondary CTA note | "Not sure yet? Book a free Live Audit. No obligation. You leave knowing which process goes first." | "Not sure yet? Book a free 20-minute Live Audit. You leave knowing which process goes first, whether or not you work with us." |
| C12 | Build Queue | `page_cta.note` | "Three questions. We reply by email with whether it fits." | "Three questions, about two minutes. No payment. We reply by email with whether it fits." (Add a reply time once O2 is decided.) |
| C13 | Build Queue | FAQ: add four items | FAQ repeats price, guarantee and speed, which the price block already covers | Add: (a) "What if the agent gets something wrong?" with the answer "A person on your team approves its work before anything goes out. The runbook shows how to pause it." (b) "Is my data safe?" with the answer "The agent runs in your accounts with least-privilege access. You get a list of every account, key and permission, and you can revoke any of it without calling us." (c) "How is this different from Zapier?" with destroyer 13 as the answer. (d) "What if my process is not a fit?" with destroyer 10 as the answer. To keep the FAQ short, cut "How fast is the first agent live?", because the H1 and the price block already answer it. |
| C14 | Build Queue | Price block, seat line | "3 of 10 founding seats open." | "3 of 10 founding seats open. Ten seats, because we build one request at a time for each." (Wording only, same count.) |
| C15 | Seat form | `lede` | "Three questions. We reply by email with whether it fits." | "Three questions, about two minutes. We read every answer and reply by email with whether it fits." |
| C16 | Seat form | Under the submit button (new line) | None | "No payment now. Next: we reply, you book a 20-minute Live Audit, and your first agent goes live within 10 business days of access." (A4.) |
| C17 | Seat form | `seat-proof` | "Three desk agents for a client: a real request sent to each in September 2026, a real answer received." | "Reporting work for a past client: 30 hours a month down to 5 minutes." (Same claim as on the Build Queue page, A1.) |
| C18 | Seat form | LAYOUT: hero meta | "Updated October 23, 2026, By EV Advisory" | Remove it. Set `hide_meta: true`, the way the Build Queue page does. |
| C19 | Seat form | Field label 1 | "What should the agent do?" | "What should the agent do? One task is enough." |
| C20 | Seat form | Field hint 2 | "For example: CRM, project tool, shared inbox" | "For example: CRM, project tool, shared inbox. Names are fine, no technical detail needed." |
| C21 | Live Audit | Section "Who it is for", body (renders without its heading) | "Real tools and openness to adopting an agent. Missing either? Not yet." | "For teams that run on email, a CRM, a project tool or spreadsheets, and want an agent doing part of the work. No tools yet? Start there first." (LAYOUT: also check why the section heading does not render.) |
| C22 | Live Audit | Section "Build in public", body | "Your call can become your case study, only with your permission and sign-off." (repeats the heading) | "Only with your permission, and you sign off on every word." |
| C23 | Live Audit | `lede` | "For founder-led agencies and service teams. We name the first automation to build." | "For founder-led agencies and service teams. Share your screen, and in 20 minutes we name the first automation to build and why. It is yours whether or not you work with us." |
| C24 | Live Audit | `proof_case` | "30 hours a month of reporting, down to 5 minutes." | Same number, with a "who" added when the owner can say it: "[Client type]: 30 hours a month of reporting, down to 5 minutes." (Section 5. Do not ship the placeholder.) |
| C25 | Live Audit | Section "What happens next", body | "A Build Queue seat starts with the automation named on the call. First request live within 10 business days of access, or next month is free. Founding seats: USD 1,995/mo." | "If it fits, the automation named on the call becomes your first request. It is live in your accounts within 10 business days of access, or your next month is free. Founding seats: USD 1,995 a month, month to month." |
| C26 | Thank-you | `lede` | "While you wait, book your free Live Audit." | "Fastest next step: book your free 20-minute Live Audit now. Every seat starts with one." (A3.) |
| C27 | Thank-you | Step 3 `text` | "Access is least-privilege and revocable, in accounts you own. Your first agent is live within 10 business days of access, or your next month is free." | "Your first agent is live in your own accounts within 10 business days of access, or your next month is free. Access is least-privilege, and you can revoke it any time." |
| C28 | Thank-you | Body "What we need from you" | "One owner for the process, and 1 to 2 hours a week." | "Before the audit: pick two or three repeated tasks and have their tools open. After that, we need one owner for the process and 1 to 2 hours a week." |
| C29 | Thank-you | Body, new proof line above the end link | None | "Reporting work for a past client: 30 hours a month down to 5 minutes." (A1.) |
| C30 | Thank-you | End link | "Read the full offer" | "See what ships with every request" (link to the Build Queue page anchor for the Ship Standard section from C5). |

## 4. OFFER CHANGE, needs owner decision

These are not copy fixes. Each one changes a commitment, a deliverable or a term, so the owner decides.

| # | Proposed change | Why | Objection it kills |
|---|---|---|---|
| O1 | Decide the audience. Either keep "founder-led agencies and service teams", or widen it to "service and operations teams of 10 to 200 people". | The buyer in this brief (an ops lead at a 10 to 200 person company, any sector) does not see themselves in the current wording. Widening may lower the conversion rate per visitor while raising the number of fits. A narrow niche converts better when traffic matches it. | 15 |
| O2 | Commit to a reply time for seat requests, for example within 1 business day. | The biggest time-delay gap in the funnel. The form and the thank-you page both say "we reply" with no "when". | 12 |
| O3 | Add a written deliverable to the Live Audit, for example a one-page note with the named automation, why it comes first, and the rough hours it could save. | It turns "a name" into something the buyer can forward to a partner. That raises the dream-outcome score of the free offer. | 11 |
| O4 | State a typical pace for requests after the first, for example "most later requests ship in N business days". | "One at a time" sounds slow without a number. Only state the pace once delivery data supports it. | 7 |
| O5 | Consider a stronger first-agent guarantee: "you do not pay month two until your first agent is live", instead of "next month is free". | The buyer burned by demos fears paying for nothing. The current terms already refund the first 14 days and credit a month. This would only reframe the risk, and it is a term change. | 1, 5 |
| O6 | Show the one-off project comparison in USD, or price the seat in CAD as well. | CAD 5,000 to 15,000 next to a USD seat price forces mental conversion inside the anchor. Needs a sourced figure, not a guessed exchange rate. | 5 |

## 5. Proof Needed (do not invent; collect these)

| Gap | What would close it | Where it goes |
|---|---|---|
| The desk agents have only a smoke test ("a real request, a real answer") | Volume and time: requests handled a week, hours saved, error rate before and after. A client quote if permitted. | Build Queue proof strip item 1, seat form proof line |
| "30 hours a month down to 5 minutes" has no "who" | Client type or role, with permission. A name and logo if allowed. | Build Queue, Live Audit `proof_case`, thank-you |
| No human behind the offer on the Build Queue page | Founder name, photo and one line of track record (the `authorimage` already exists in frontmatter and `hide_meta` hides it) | Build Queue near the price block, and the Live Audit page |
| No artefact a buyer can see | One redacted test log page or a 30-second clip of a recorded handoff | Build Queue, next to the Ship Standard |
| Logo permission | Confirm the six logos in `client-logos.html` can sit on a sales page, not only the home testimonials | Build Queue (C9) |
| Seat count | A live source of truth for "3 of 10" | Build Queue price block, home page |

## 6. Top 5 Fixes, ranked by expected conversion lift

| Rank | Fix | Rows | Why it ranks here |
|---|---|---|---|
| 1 | Rewrite the Build Queue hero for a buyer burned by demos: "Not a demo, tested on your own examples, a person approves, your accounts". | C1, C2 | The hero is where the main objection (1) is won or lost, and today the answer sits below the fold. All visitors see it. |
| 2 | Open the 8-Part Ship Standard and move the USD 1,550 a month math into the price block. | C4, C5, C6 | The two biggest likelihood and value assets on the page are hidden behind clicks. Showing them costs nothing and answers objections 1, 5 and 14 on the page. |
| 3 | Lead the proof with the strongest result, and add the past-client logos to the Build Queue page. | C7, C9, C17, C29 | Today the lead proof reads like a demo to a buyer who distrusts demos. The logos already exist on the Live Audit page. |
| 4 | Make the Live Audit the required next step on the thank-you page, with prep instructions. | C26, C28 | This step converts a form fill into a booked call. "While you wait" tells the buyer the audit is optional. |
| 5 | Remove risk at the seat form button: "No payment now" plus the three next steps. Remove the blog meta line. | C16, C18, C15 | The last click is where hesitation peaks. Two lines remove the "what am I signing up for" fear. |

The biggest lever that is not a copy fix: commit to a reply time (O2). It is the most common gap across the seat form and the thank-you page.
