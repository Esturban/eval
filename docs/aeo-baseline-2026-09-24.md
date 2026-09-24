# AEO Baseline: AI Agent Implementation (2026-09-24)

Internal working document. Not site copy. Phase 1 of TASK-5854 (baseline citation test).
Next readers: the AEO Foundations Architect (phase 2) and the Content Creator (phase 3), plus the CMO (TASK-5855) and EV.

## 0. Read this first

- **What this is:** a point-in-time snapshot of which websites four AI assistants cite when a buyer asks 15 questions about AI agent implementation.
- **Headline result:** evadvisory.ca was cited **0 times in 33 captured answers** (0 of about 210 source links). No surprise: the site is still positioned on Shopify and ecommerce revenue signal trust (see `static/llms.txt`), and it has no pages on this topic yet.
- **Headline opportunity:** no single competitor owns this topic. 173 distinct domains appeared, and the most-cited commercial domain showed up in only 4 of 33 answers. Small consultancies and studios win citations with one well-shaped, dated, question-titled page. This category is winnable by a solo advisor.
- **AI answers are non-deterministic.** Treat every cell below as one sample, not a ranking. Re-run the same 15 prompts monthly (see section 8).

## 1. Method and limitations (read before trusting any number)

| Assistant | How it was queried | Mode | Coverage |
|---|---|---|---|
| ChatGPT | chatgpt.com, logged out, web search on, in a fresh isolated browser context per question | Logged-out default model with search | 15 of 15 |
| Perplexity | perplexity.ai, logged out, fresh isolated browser context per question | Logged-out default ("Best") | **3 of 15** (Q1 to Q3). Q4 to Q15 returned "Sign up and repeat your request" (logged-out quota). |
| Google (AI Overview / organic / People Also Ask) | google.com and google.ca search | Logged out | **0 of 15.** Both attempts were redirected to Google's "unusual traffic" CAPTCHA page. Not solved, by design. |
| Claude | Claude's own web search tool, one search per question, US index | Search results plus synthesized answer | 15 of 15 |

Limitations, stated plainly:

1. **No CLI or API was available** for querying ChatGPT, Perplexity, or Google AI Overviews the way a real buyer sees them. The signed-in Chrome session was not available to this agent, so a separate automated Chrome was used, logged out. Logged-in and paid tiers may cite differently.
2. **Geography.** The browser egresses from Saudi Arabia. Asked plainly, ChatGPT answered Q1 with Saudi firms (agentteco.com, alwahah.ai, elvirasa.com, rapiddata.com). evadvisory.ca's buyers are North American, so **every ChatGPT prompt had " I'm based in Canada." appended** to simulate a target-market buyer. That suffix pulled in Canadian government sources on privacy questions. A buyer in Canada with no suffix will likely see something similar but not identical.
3. **Perplexity Q1 to Q3 were not geo-suffixed** and returned global (mostly US and India-based agency) sources.
4. **Claude column** uses the search tool's result list as the "cited" set, in the order returned. The claude.ai app with browsing may pick a subset.
5. **Google is the biggest gap.** Phase 2 or EV should re-run the 15 queries in a normal signed-in browser from Canada and record the AI Overview citations and top 5 organic results, using the same table format.

## 2. The 15 buyer questions

Posted to TASK-5854 at the start of this phase for the CMO (TASK-5855).

| # | Question | Intent |
|---|---|---|
| Q1 | Who can implement an AI agent for my business? | Provider discovery |
| Q2 | How much does an AI agent implementation cost for a small business? | Cost |
| Q3 | What should I automate first with AI in my business? | First use case |
| Q4 | What is the difference between an AI agent and automation (like Zapier or Make)? | Definition / category |
| Q5 | How do I find a good AI agent implementation consultant? | Provider evaluation |
| Q6 | Should I build or buy an AI agent for my small business? | Build vs buy |
| Q7 | How long does it take to implement an AI agent in a business? | Timeline |
| Q8 | What are the risks of using AI agents in my business, and how do I reduce them? | Risk |
| Q9 | What questions should I ask before hiring an AI agent developer or agency? | Evaluation criteria |
| Q10 | What is the best first AI agent for a small agency (marketing, creative, or services)? | Agency ICP, first agent |
| Q11 | Do I need an AI consultant or can I set up AI agents myself? | DIY vs hire |
| Q12 | What does an AI agent implementation project include (deliverables)? | Scope |
| Q13 | How do I measure ROI on an AI agent? | ROI |
| Q14 | What tasks can an AI agent actually handle for a service business today? | Capability |
| Q15 | Freelancer vs agency vs consultant for AI agent development: which is right for a founder-led business? | Provider type |

## 3. Citation table (question x assistant)

Domains are listed in the order they appeared. "Inline" means the domain was attached to a specific claim in the answer text, which is the most valuable kind of citation. "Named" means a company was recommended by name in the answer, with or without a link. EV Advisory appeared in no cell.

### Q1. Who can implement an AI agent for my business?

| Assistant | What was cited or surfaced | Answer shape |
|---|---|---|
| ChatGPT (Canada) | Google Maps local pack first (Agency7 AI Solutions, Edmonton; Markovate, Toronto; ZapTron AI; CARITY AI; Integrio Systems; Algoseed Labs). Then linked: autor.ca, futuresource.ca, chatgpt.ca (Kaxo named). | Named Canadian firms, map pack, then a "what I'd look for" checklist |
| ChatGPT (no suffix, KSA egress) | agentteco.com, alwahah.ai, elvirasa.com, rapiddata.com | 4 local firms, short |
| Perplexity | Inline: nix-united.com, hso.com, centricconsulting.com, decipherzone.com. Sources (15): decipherzone.com, nix-united.com, cieden.com, hso.com, centricconsulting.com, kanerika.com, argano.com, contus.com, phosailabs.com, cloudnsite.com, devcom.com, alicelabs.ai, analyticsinsight.net, bignewsnetwork.com, clutch.co. Named: Intuz, Markovate, BotsCrew, LeewayHertz, Accenture, IBM, Deloitte, Cognizant, Infosys, Capgemini. | Four provider types (specialist agency, big consultancy, platform partner, freelancer), then "what they should implement" and "how to choose" |
| Claude | netcomlearning.com, kellton.com, databricks.com, monday.com, bcg.com, gartner.com, commercepundit.com, dancumberlandlabs.com, cloudnsite.com | Internal no-code vs external partner; start with one workflow |
| Google | Not reached (CAPTCHA) | |

### Q2. How much does an AI agent implementation cost for a small business?

| Assistant | What was cited or surfaced | Answer shape |
|---|---|---|
| ChatGPT (Canada) | weblaunch.ca (inline, lead), deploylabs.ca, orbys-ai.com (a published small-business package price was quoted from it), openai.com (API pricing) | Direct CAD range in sentence one, then a budget structure (design, build, monthly) |
| Perplexity | Inline: bakedwith.com (lead), solulab.com, adevs.com, devcom.com, intellectyx.com. Sources (15): bakedwith.com, solulab.com (2 pages), thecrunch.io, braincuber.com, devcom.com, adevs.com, linkedin.com (Pulse article), thinklytics.com, intellectyx.com, technovapartners.com, riseuplabs.com, tripleminds.co, 75way.com, appinventiv.com | Direct USD range in sentence one, then a **table** by approach (SaaS, freelancer MVP, custom), then price drivers and example budgets |
| Claude | softteco.com, bakedwith.com, yardwork.dev, advantechits.com, omago.ai, productcrafters.io, nocodefinder.com, tfsfventures.com, adevs.com | Ranges by approach, ongoing costs, first-year budget |
| Google | Not reached | |

### Q3. What should I automate first with AI in my business?

| Assistant | What was cited or surfaced | Answer shape |
|---|---|---|
| ChatGPT (Canada) | priv.gc.ca (PIPEDA guide), canada.ca (CRA record keeping) | Opinionated single pick ("lead intake and follow-up first"), then a **table** of other first candidates |
| Perplexity | Inline: zapier.com (lead), sintra.ai, modernoperators.com, ibm.com. Sources: sintra.ai, modernoperators.com, zapier.com, saudidigitalconsulting.com, reddit.com (r/Entrepreneurship, r/automation), cyberadvisors.com, ibm.com, box.com, moveworks.com, managedsolution.com, cloud.google.com, glean.com, sandiego.edu, linkedin.com (post) | Scoring filter (repetitive, high volume, predictable, low risk, measurable) |
| Claude | rootstack.com, quora.com, thevirtualsavvy.com, commercepundit.com, whitebeardstrategies.com, resolvetech.com, evolvedsolutions.co, codelynx.co, forbes.com | Criteria, what not to automate first, examples |
| Google | Not reached | |

### Q4. AI agent vs automation (Zapier, Make)

| Assistant | What was cited or surfaced | Answer shape |
|---|---|---|
| ChatGPT (Canada) | help.zapier.com, make.com (AI agents guide) | One-line definition up top ("automation follows a recipe; an agent is given a goal"), then a **comparison table**, then a worked email example |
| Perplexity | Not reached (logged-out quota) | |
| Claude | make.com, zapier.com, arahi.ai, nimblebrain.ai, ai-crescent.com, mediaffy.com, remoteopenclaw.com, lubeckstudio.com, mindstudio.ai, substack.com | Deterministic vs probabilistic; when to use each; "most need both" |
| Google | Not reached | |

### Q5. How do I find a good AI agent implementation consultant?

| Assistant | What was cited or surfaced | Answer shape |
|---|---|---|
| ChatGPT (Canada) | deloitte.com (Canada agentic AI page), clutch.co (Canada AI consulting listing), saz.ca, mihronai.ca, agentika.ca, business-analysis.ca | "Implementation partner, not generic consultant," then a **named shortlist** of Canadian firms, each with one line on fit |
| Perplexity | Not reached | |
| Claude | talentelgia.com, neurons-lab.com, centricconsulting.com, upwork.com, leewayhertz.com, meethayat.com, cigen.io, jadasquad.com, oreateai.com | Evaluation criteria; cloud marketplaces as a source of vetted providers |
| Google | Not reached | |

### Q6. Should I build or buy an AI agent for my small business?

| Assistant | What was cited or surfaced | Answer shape |
|---|---|---|
| ChatGPT (Canada) | priv.gc.ca | "Buy first, build where customization creates value," then buy list, build list, pilot path (buy, pilot 30 to 60 days, measure, then build) |
| Perplexity | Not reached | |
| Claude | turing.com, aibusiness.com, dataiku.com, dust.tt, siit.io, retool.com, stmicro.net, g2.com, substack.com | Buy if AI is a tool, build if it is the product; hybrid |
| Google | Not reached | |

### Q7. How long does it take to implement an AI agent?

| Assistant | What was cited or surfaced | Answer shape |
|---|---|---|
| ChatGPT (Canada) | priv.gc.ca (AI principles), statcan.gc.ca | **Timeline table** by agent type (1 to 2 weeks up to 2 to 6+ months), then a default plan for a small business |
| Perplexity | Not reached | |
| Claude | pedowitzgroup.com, moveworks.com, anyreach.ai, yardwork.dev, klevere.ai, 360automation.ai, iqdigitalai.com, aiagentdevelopment.tech, viston.tech | Pilot, production, and scale ranges; "70% integrations, 30% AI logic" |
| Google | Not reached | |

### Q8. Risks of AI agents and how to reduce them

| Assistant | What was cited or surfaced | Answer shape |
|---|---|---|
| ChatGPT (Canada) | priv.gc.ca (inline, "Office of the Privacy Commissioner"), canada.ca (automated decision-making directive) | Seven risk buckets, each with a "reduce it" list; **tables** |
| Perplexity | Not reached | |
| Claude | obsidiansecurity.com, metomic.io, blueprism.com, livingsecurity.com, insight.com, ncbi.nlm.nih.gov, checkpoint.com, hbr.org, arxiv.org | Security-vendor framing: prompt injection, privilege, access control |
| Google | Not reached | |

### Q9. Questions to ask before hiring an AI agent developer or agency

| Assistant | What was cited or surfaced | Answer shape |
|---|---|---|
| ChatGPT (Canada) | priv.gc.ca | Numbered question list ("show me 2 to 3 agents in production, not demos"), **table** |
| Perplexity | Not reached | |
| Claude | botscrew.com, itwire.com, asapp.com, cognio.so, aiveda.io, greensighter.com, agintex.com, forbes.com, globalriskcommunity.com | Listicles of 5 to 12 questions: production proof, run cost vs build cost, IP ownership, monitoring |
| Google | Not reached | |

### Q10. Best first AI agent for a small agency

| Assistant | What was cited or surfaced | Answer shape |
|---|---|---|
| ChatGPT (Canada) | priv.gc.ca. Named products: ChatGPT Business, Claude Team, Microsoft 365 Copilot, Gemini for Workspace. | Recommends one general assistant first, then a **table** by agency type |
| Perplexity | Not reached | |
| Claude | superside.com, warmly.ai, blueshift.com, gartner.com (Peer Insights), lindy.ai, tofuhq.com, ninjapromo.io, arahi.ai, digitalagencynetwork.com | Tool listicles (Jasper, Pictory, Omneky, Levity) |
| Google | Not reached | |

Note: nothing cited here answers the agency owner's real question (which workflow in an agency to automate first). This is the most open question in the set.

### Q11. Do I need an AI consultant or can I DIY?

| Assistant | What was cited or surfaced | Answer shape |
|---|---|---|
| ChatGPT (Canada) | ised-isde.canada.ca (SME AI adoption blueprint, inline), design.canada.ca, canada.ca | "You can probably DIY first," then when to DIY and when to hire |
| Perplexity | Not reached | |
| Claude | cio.com, glideapps.com, linkedin.com, fernsidestudio.com, seedandsociety.com, justinmckelvey.com, aismartventures.com, substack.com, fiverr.com | DIY for standalone tools; hire when customer-facing or integrated; "if you can't name the workflow, don't hire an implementer" |
| Google | Not reached | |

### Q12. What does an AI agent implementation project include?

| Assistant | What was cited or surfaced | Answer shape |
|---|---|---|
| ChatGPT (Canada) | design.canada.ca (inline), canada.ca, ised-isde.canada.ca | Phase list: discovery, agent design, data and integrations, AI engineering, security and privacy, testing, deployment, monitoring |
| Perplexity | Not reached | |
| Claude | medium.com, atlassian.com, incremys.com, github.com, airtable.com, sketchdev.io, aitoolly.com, knowlix.ai | Weak match: results drift to "AI agents for project management" |
| Google | Not reached | |

Note: no provider owns a clear "what you get" deliverables page. This is a gap EV can fill directly with the entry offer page.

### Q13. How do I measure ROI on an AI agent?

| Assistant | What was cited or surfaced | Answer shape |
|---|---|---|
| ChatGPT (Canada) | No links. McKinsey named in text. | "Unit of business value" framing: cost per resolved ticket or qualified lead |
| Perplexity | Not reached | |
| Claude | fiddler.ai, druidai.com, pickaxe.co, blueprism.com, mintmcp.com, skysync.nyc, quivly.ai, mindstudio.ai, ibm.com | Formula, hidden costs, baseline before launch, 6 to 12 month window |
| Google | Not reached | |

### Q14. What tasks can an AI agent handle for a service business?

| Assistant | What was cited or surfaced | Answer shape |
|---|---|---|
| ChatGPT (Canada) | voxara.ca (inline), servicebooked.ca (inline, cited 3 times), priv.gc.ca | Task list (calls, booking, lead qualifying, follow-up, CRM updates, reviews, escalation) |
| Perplexity | Not reached | |
| Claude | azure.microsoft.com, mindstudio.ai, servicenow.com, bcg.com, aisera.com, microsoft.com, salesforce.com, relevanceai.com, claritywithai.org | Platform vendors plus one small-business explainer |
| Google | Not reached | |

### Q15. Freelancer vs agency vs consultant for AI agent development

| Assistant | What was cited or surfaced | Answer shape |
|---|---|---|
| ChatGPT (Canada) | statcan.gc.ca (inline: Canadian AI adoption statistic), canada.ca (CRA employee vs self-employed guide) | Canadian context stat, then a three-column **comparison table** |
| Perplexity | Not reached | |
| Claude | syntora.io (page now returns 404), ergini.com, rzailabs.com, teamday.ai, sfailabs.com, pertamapartners.com, abbacustechnologies.com, aismartventures.com, mindstudio.ai | Comparison pages written by small studios, each positioning "senior-led boutique" as the middle option |
| Google | Not reached | |

## 4. Scorecard

| Assistant | Prompts answered | EV Advisory cited | Distinct domains cited | Notes |
|---|---|---|---|---|
| ChatGPT (Canada) | 15 | 0 | 21 (plus a Maps local pack) | Leans on Canadian government sources for risk and privacy; names small Canadian firms for "who" questions |
| Perplexity | 3 | 0 | 41 | 15 sources per answer; favors agency listicles and cost guides |
| Claude (web search) | 15 | 0 | 122 | 9 to 10 sources per answer; very fragmented |
| Google | 0 | n/a | n/a | Not reached |
| **Total** | **33** | **0 (0%)** | **173** | |

## 5. Competitor set (domains cited more than once)

Counts are the number of question and assistant cells (out of 33) where the domain appeared. canada.ca includes ised-isde.canada.ca.

| Rank | Domain | Cells | Type | Where it won | Direct competitor for EV? |
|---|---|---|---|---|---|
| 1 | priv.gc.ca | 7 | Government (Privacy Commissioner) | ChatGPT: Q3, Q6, Q7, Q8, Q9, Q10, Q14 | No. Authority to cite, not to beat |
| 2 | canada.ca (incl. ISED, CRA) | 5 | Government | ChatGPT: Q3, Q8, Q11, Q12, Q15 | No. Cite it |
| 3 | mindstudio.ai | 4 | Agent platform blog | Claude: Q4, Q13, Q14, Q15 | Indirect |
| 4 | zapier.com | 3 | Automation platform | ChatGPT Q4, Perplexity Q3, Claude Q4 | Indirect (definition owner) |
| 5 | bakedwith.com | 2 | Agency cost guide | Perplexity Q2 (lead inline), Claude Q2 | **Yes** (cost answer) |
| 5 | adevs.com | 2 | Dev shop cost guide | Perplexity Q2, Claude Q2 | **Yes** |
| 5 | devcom.com | 2 | Dev shop | Perplexity Q1, Q2 | Yes |
| 5 | centricconsulting.com | 2 | Consultancy | Perplexity Q1, Claude Q5 | Yes (mid-market) |
| 5 | cloudnsite.com | 2 | AI automation consultancy | Perplexity Q1, Claude Q1 | **Yes** |
| 5 | clutch.co | 2 | Directory | Perplexity Q1, ChatGPT Q5 | Off-site channel (section 7) |
| 5 | make.com | 2 | Automation platform | ChatGPT Q4, Claude Q4 | Indirect |
| 5 | yardwork.dev | 2 | Small studio | Claude Q2, Q7 | **Yes** (closest analog to EV) |
| 5 | moveworks.com, ibm.com, bcg.com, gartner.com, blueprism.com | 2 each | Enterprise vendors and analysts | Mixed | No (enterprise) |
| 5 | aismartventures.com, arahi.ai, commercepundit.com, forbes.com, linkedin.com, substack.com, statcan.gc.ca, design.canada.ca | 2 to 3 each | Mixed | Mixed | See off-site list |

**Closest real competitors to EV** (small, founder-led or boutique firms whose answer pages got cited). Treat this as the list to study and out-answer:

| Domain | Cited for | Why it is relevant |
|---|---|---|
| weblaunch.ca | ChatGPT Q2, lead inline citation | Canadian, "How Much Does an AI Agent Cost in Canada? (2026 Pricing Guide)" |
| deploylabs.ca | ChatGPT Q2 | Canadian, "AI Consultant Pricing in Canada (2026)" with FAQPage and AggregateOffer schema |
| mihronai.ca | ChatGPT Q5 | Canadian "AI Implementation Partner for Canadian Businesses" service page, fixed-fee framing, FAQPage and Offer schema |
| saz.ca | ChatGPT Q5 | Canadian AI agents service page, ProfessionalService and FAQPage schema |
| agentika.ca, autor.ca, futuresource.ca | ChatGPT Q1, Q5 | Canadian agent builders with Service and FAQPage schema |
| yardwork.dev | Claude Q2, Q7 | Small studio; cost and timeline explainers with FAQPage, dated and updated |
| bakedwith.com, adevs.com | Perplexity and Claude Q2 | Cost guides with tables, FAQs, dated |
| fernsidestudio.com, justinmckelvey.com, meethayat.com, dancumberlandlabs.com | Claude Q1, Q5, Q11 | Solo or small consultants winning with a single "founder guide" or "hire vs DIY" post |
| rzailabs.com, sfailabs.com, ergini.com, pertamapartners.com | Claude Q15 | Small studios owning "freelancer vs agency vs boutique" comparisons |

## 6. Shape of a citable page for this topic

Measured on 11 cited pages fetched on 2026-09-24 (weblaunch.ca, deploylabs.ca, mihronai.ca, saz.ca, bakedwith.com, adevs.com, yardwork.dev, autor.ca, fernsidestudio.com, solulab.com, nix-united.com):

| Signal | Count of 11 | What it means for EV pages |
|---|---|---|
| Organization plus Person schema (named author or founder) | 9 | Every page carries the entity and a named human |
| FAQPage schema | 7 | Every answer page and the entry offer page need FAQPage |
| Visible dated publish or update, all in 2026 | 8 (all 2026; two updated in September) | Show "Updated YYYY-MM-DD" on the page and in `dateModified`. Stale pages lose |
| At least one HTML table | 7 | Cost, timeline, and comparison answers need a real `<table>` |
| Question-shaped H2 or H3 headings (6 or more) | 6 | Subheads should be the follow-up questions a buyer asks |
| Year in the title, "(2026)" | 5 | Cost and pricing titles carry the year |
| Geography in the title or H1 ("Canada", "Canadian") | 4 (all 4 Canadian winners) | The Canadian pages won the ChatGPT Canada answers. EV should state its market in titles and schema (`areaServed`) |
| Service or ProfessionalService schema with Offer or AggregateOffer | 4 | Service pages that got cited declare an offer. EV's entry offer page needs Service plus Offer, with price only once CRO-5568 locks it |

Answer patterns the assistants rewarded:

1. **Direct answer in sentence one** with a number or a verdict (for example a cost range, "buy first," or "4 to 8 weeks"). Perplexity and ChatGPT both lifted the opening sentence of the page they cited first.
2. **A table right after the answer** (cost by approach, timeline by agent type, freelancer vs agency vs consultant).
3. **Named, specific options** for "who" questions. ChatGPT's "who can implement" and "find a consultant" answers are a shortlist of named firms with one line each. To appear there, EV needs to be a named entity with a service page that plainly says "AI agent implementation" and the market it serves.
4. **One opinionated default** ("start with lead intake and follow-up"). ChatGPT answered with a single recommendation before offering alternatives.
5. **Authority links inside the page.** ChatGPT Canada cited priv.gc.ca, ISED, and StatCan for risk, scope, and adoption. An EV page that cites those same primary sources lines up with what the assistant already trusts.
6. **Production proof over demos.** Q5, Q9, and Q11 answers all told buyers to ask for agents running in production. Proof pages (with numbers and dates, per CRO-5570) are a citation lever, not only a sales asset.

Gaps no one owns yet, ranked by fit for EV's ICP (founder-led buyers, small agencies first):

| Gap | Evidence | Suggested answer page |
|---|---|---|
| First AI agent for a small agency, by workflow (not by tool) | Q10 answers were tool listicles; nobody answered "which agency workflow first" | Q10 page, agency-owner specific |
| What an implementation project actually includes | Q12 Claude results drifted off-topic; ChatGPT fell back to government guidance | Deliverables page, tied to the entry offer |
| Hire vs DIY decision for a founder | Won by solo consultants' single posts (fernsidestudio.com, justinmckelvey.com) | Q11 page with a decision table |
| Freelancer vs agency vs consultant | Won by small studios' comparison pages | Q15 page positioning the senior-led advisor option honestly |
| Cost in CAD for a small business | Owned by weblaunch.ca and deploylabs.ca; beatable with a fresher, dated page with a table | Q2 page (use ranges from public sources; do not state EV prices until CRO-5568 is locked) |

## 7. Off-site list (for EV and the CMO to review; nothing has been posted or submitted)

Ranked by how directly the assistants used them to find or vet providers.

| Rank | Property | Seen in | Why it matters | Suggested action (EV or CMO decides) |
|---|---|---|---|---|
| 1 | Google Business Profile / Maps local pack | ChatGPT Q1 (Canada) opened with a map pack of Canadian AI automation firms | ChatGPT pulls local business listings for "who can implement" questions | Check or create an EV Advisory profile with "AI agent implementation" as a service category |
| 2 | clutch.co (Canada AI consulting and AI agents categories) | Perplexity Q1, ChatGPT Q5 | Cited directly as the evidence for a recommended firm | Evaluate a Clutch profile; reviews are what make it count |
| 3 | LinkedIn (Pulse articles and posts) | Perplexity Q2, Q3; Claude Q11 | LinkedIn long-form gets cited for cost and use-case questions | Publish the baseline question answers as LinkedIn articles as well as posts (ties to TASK-5855) |
| 4 | Reddit (r/Entrepreneurship, r/automation) | Perplexity Q3 | Perplexity cites real practitioner threads | Genuine participation only; no promotion |
| 5 | Substack / Medium | Claude Q4, Q6, Q11, Q12 | Personal newsletters get cited on agent vs automation and DIY | Optional syndication channel for answer pages |
| 6 | Upwork / Fiverr AI consultant categories | Claude Q5, Q11 | Surfaced as the "where to find a consultant" answer | Low fit for positioning; watch only |
| 7 | Cloud marketplaces (Azure, AWS, Google Cloud) | Claude Q5 text | Named as where to find vetted agent service providers | Long-term, only if a platform partnership happens |
| 8 | G2 (AI agent builders, small business) and Gartner Peer Insights | Claude Q6, Q10 | Product review sites; cited for "which tool" | Not a fit for a service firm |
| 9 | Publications: Forbes (Q3, Q9), HBR (Q8), CIO.com (Q11), iTWire (Q9), AI Business (Q6), Analytics Insight and Big News Network listicles (Perplexity Q1) | Mixed | Listicles and bylines are how firms get into "top AI agent companies" answers | Consider contributed articles or listicle inclusion later; no paid placements without EV approval |
| 10 | Canadian government sources (priv.gc.ca, ISED SME AI Adoption Blueprint, StatCan, design.canada.ca) | ChatGPT Canada, 7 of 15 answers | Not a posting channel. The authority the assistant trusts on risk and privacy | Cite them on EV answer pages |

## 8. Re-run protocol (for phase 3 "after" test and monthly)

- Re-run date: **no earlier than 2026-10-22** (4 weeks after launch), then monthly. Citations can lag weeks after pages go live.
- Use the exact 15 questions in section 2. For ChatGPT, keep the " I'm based in Canada." suffix, or run from a Canadian connection without it and note which.
- Fill the gaps first: run Google (AI Overview plus top 5 organic plus People Also Ask) and Perplexity Q4 to Q15 from a signed-in or Canadian browser.
- Record per cell: cited domains in order, whether evadvisory.ca appears, and whether it is inline, in the sources list, or named in the answer.
- Success markers: evadvisory.ca cited in 3 or more of 15 ChatGPT answers, and appearing on 2 or more assistants for Q10, Q11, Q12, or Q15 (the open gaps).
