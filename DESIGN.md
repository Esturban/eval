# Design System: EV Advisory Homepage

## Product Context
- **What this is:** A consulting homepage for EV Advisory focused on Shopify, ecommerce, conversion, and revenue-signal trust.
- **Who it's for:** Ecommerce operators, growth leads, and commerce teams who do not trust the numbers behind performance decisions.
- **Space/industry:** Ecommerce diagnostics, analytics, conversion optimization, operator consulting.
- **Project type:** Marketing site with an audit-first funnel.

## Aesthetic Direction
- **Direction:** Restrained technical editorial
- **Decoration level:** Intentional. One static grain texture is allowed, on the hero plate only (a small tiling noise image at about 4 to 5% opacity); no other textures, blur effects, or drop shadows on the plate.
- **Mood:** Clear, commercial, analytical, and operator-facing. The homepage should feel like a sharp audit memo, not a symbolic agency pitch.
- **Image rule:** No fantasy, cosmic, bird, abstract-inspiration, or vague consultancy visuals. Homepage visuals must read as diagnostics, systems, commerce, reporting, or operational clarity.

## Typography
- **Display/Hero:** General Sans
- **Body/UI:** Instrument Sans
- **Data/Labels:** JetBrains Mono
- **Scale (raised 2026-09-24):** Hero 52-96px, section headings 36-72px, card headings 24-30px, stat figures 60-72px, body 18-20px, supporting copy 16-18px, mono labels 12-14px uppercase

## Color
- **Approach:** Restrained with one strong accent
- **Ink:** `#020617`
- **Graphite:** `#0f172a`
- **Off-white surface:** `#f7f4ee`
- **Panel white:** `#f8fafc`
- **Rule/border:** `#dbe3ee`
- **Accent cyan:** `#22d3ee`
- **Accent deep:** `#0891b2`
- **Dark mode posture:** Existing site dark mode can remain, but homepage decisions should optimize for light-mode editorial clarity first, outside the dark plate band described below.
- **Colour arc (2026-09-24, supersedes the dark plate band):** the homepage is one continuous dark-to-light arc. Each section declares a tone (`data-tone`): hero Ink `#020617`, Why-work-gets-stuck `#050c1c`, How-it-works `#0b1426`, then a strong flip to Off-white `#f7f4ee` for Tools, white `#ffffff` for Proof, Off-white for Reviews and the closing CTA. `home-motion.js` blends `<main>`'s background between neighbouring tones as each boundary crosses the viewport (smoothstep over 45% of the viewport height), so it reads as one arc with big Apple-style flips, never hard colour blocks. Without JS every section keeps its own static tone. Text colour is fixed per section (light on the dark three, Ink/slate on the light four).
- **Agent accents:** each agent has one accent used for its vehicle stripe, roof sensor, label dot and tag: Inbox cyan `#22d3ee`, CRM emerald `#34d399`, Project violet `#a78bfa`, Procurement amber `#fbbf24`, Docs blue `#60a5fa`. Finished-work states use emerald.

## Spacing
- **Base unit:** 8px
- **Density:** Comfortable but tight
- **Spacing scale:** 8 / 12 / 16 / 24 / 32 / 48 / 64 / 80

## Layout
- **Approach:** Hybrid editorial
- **Content width:** `max-w-7xl`
- **Text width:** keep most body copy at `max-w-2xl` or narrower
- **Border radius:** 16px for small surfaces, 24px for major cards, 32px for hero/CTA shells

## Motion
- **Approach (2026-09-24 highway pass):** one scroll-driven Three.js hero, a literal highway, then CSS-only motion in the process flow; minimal-functional elsewhere.
- **Highway hero:** a tall section (250svh desktop, 230svh phone) with a sticky 100svh stage. The road is real highway structure: four lanes, dashed lane markings, solid edge lines, cyan road studs, guardrails with posts, street lamps with light pools, and one overhead gantry carrying two signs (Your tools / Finished work). Agent vehicles (low-poly car bodies with an accent stripe, a roof sensor that reads as self-driving, headlights and a headlight beam on the road) drive toward the viewer and loop out of the fog. Each vehicle carries an HTML header (name and job) and a live event tag with its tool icon, projected from the vehicle every frame, scaled mildly by distance, faded near the horizon and at the frame edges, dimmed when it would sit on the headline, and stepped back when a nearer label overlaps it. Tags cycle every 2.6s through each agent's events (New email, Email updated, Calendar invite, CRM record added, Project task updated, Invoice matched, and so on) and switch to finished-work states in the last scroll step.
- **Camera:** fixed. No zoom, no push, no orbit. A level, straight-ahead camera with `setViewOffset` places the vanishing point per layout (desktop: right of the headline at 72% / 44%; phone: centred, below the copy at 50% / 64%).
- **Scroll:** progress through the pinned stage drives a four-step rail (Inputs arrive, Agents pick up, Tools get used, Work lands) and adds forward travel to the traffic. Traffic also cruises on its own, so the scene never stops.
- **Roster:** `data/highway.yaml` is the single source for the vehicles, the static poster, the process-flow rows and the screen-reader description. The agents are labelled as examples on the page.
- **Process flow ("How it works"):** a marquee of tool icons, then one row per agent: input icons, a dashed wire with a travelling packet, the agent, a second wire, and the finished output. CSS animation only.
- **Lazy-load and fallback:** `home-motion.js` ships unconditionally (small IIFE). The three.js scene bundle is only fetched via dynamic `import()` once the hero is within 600px of the viewport. `prefers-reduced-motion: reduce`, no `IntersectionObserver`, no JS, and failed loads all keep the inline SVG poster (same road, same agents, static labels); reduced motion also freezes the flow wires and marquee. Script URLs go through `resources.PostProcess` so they stay root-relative after `canonifyURLs`.
- **Rendering budget:** MeshStandardMaterial and additive textured planes only, no post-processing or bloom, shared vehicle geometry, instanced lane dashes, studs, posts and lamps, pixel ratio capped at 1.75 desktop and 1.25 phone, the build is staged across yielded tasks with async shader compile so no single task blocks for long, the bundle is fetched only after `load` and an idle slot, render loop stops when the hero leaves the viewport or the tab is hidden.
- **Nav:** sticky at all breakpoints. On the homepage it links only to homepage anchors (How it works, Tools, Proof, Reviews) plus the Scorecard call to action; the Services dropdown is removed for now. Other pages keep Store and Insights.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-25 | Homepage moved to restrained technical editorial system | Tightens credibility and better matches the audit-first offer |
| 2026-09-24 | Motion approach changed from no decorative motion to one restrained hero element (decision node graph) with light scroll motion, lazy-loaded, reduced-motion-safe, contained so it never crosses body copy | Homepage modernization pass |
| 2026-09-24 | Hero node graph replaced by the hero plate (layered SVG and CSS with a small Web Animations module, no WebGL); the hero becomes the single dark plate; the Live Audit card moves to its own section below the hero | The node graph and real-time 3D were rejected by the site owner; depth now comes from perspective, atmosphere and one light source at a fraction of the weight |
| 2026-09-24 | EV rejected a Remotion-rendered video hero and a video-hero-plus-live-section hybrid, both explored the same day. Picked instead: keep the current site theme (not a redesign), add a sticky nav with section anchors, and add one persistent, scroll-driven Three.js background layer showing an agent moving between real tool nodes, pinned behind a reorganized Tools / Proof / Reviews narrative. The hero plate's settle-in JS module is retired in the same change (a permanent static poster replaces it) so the page carries one scroll-driven motion system instead of two. | EV's literal pick, recorded verbatim on TASK-5844: "Base: concept 3, on the CURRENT site theme... Scroll-driven, not click-driven... A Three.js background layer that animates with scroll: AI agents moving along and picking up tools, emails, messages and integration access... Practical over flashy: dense and informative (benchmark: the immigration deck), readable on phone, fast." |
| 2026-09-24 | Finish-gate rework, same-day follow-up: EV rejected the first build ("still looks cheap"). Retired the separate static hero plate entirely - the agent-network scene is now the only hero, running from the top of the page. Reworked the 3D story from one courier agent visiting four static tool-icon nodes into four named agents handing a task/tool/message glyph directly to each other in sequence (one handoff in flight at a time, not four back-and-forth ramp trips from a single mesh). Added a continuous, scroll-independent ambient particle stream along the lane for a sustained "keeps moving" feel, plus a tiny continuous camera idle drift. Folded the Mission section into the same continuous dark band instead of a separate light section, and lightened most card grids from filled boxes to a plain top-rule treatment. Compressed walkthrough-style card copy in Tools/Validation/Reviews to short lines. | EV's 7-point verbatim rejection on TASK-5844 (one hero only; remove competing banners; cut repetitive back-and-forth motion; keep a continuous flowing feel; cut text-heavy copy; make the 3D story one idea - agent-to-agent protocol; Apple-grade restraint), plus a follow-up reference note pointing at AggLayer Visualizer-style "nodes with messages moving between them" as the quality bar and explicitly leaving the choice of three.js-vs-lighter-motion to this pass's judgment - three.js was kept and simplified rather than replaced, since the existing lazy-load/reduced-motion/rendering-budget contract was already sound and a full rewrite would not fit the pass's scope. |
| 2026-09-24 | Highway pass: the agent-network scene (icosahedron agents handing a glyph along lanes, with a camera that pushed in and out) is retired and replaced by a literal highway with labelled agent vehicles and live event tags. This supersedes the earlier "information highway" camera zoom entry and the dark plate band. Same pass: icon process flow section, explicit which-tool / what-the-agent-does / what-stays-human table, continuous dark-to-light colour arc, raised type scale, Past clients rebuilt as uniform logo tiles, nav limited to homepage anchors. | EV's review of the previous preview: the zoom-in/zoom-out highway looked cheesy and the back-and-forth network read as a poor graphic; he asked for a structured road with lanes and markings, bots carrying a name-and-job header and live event tags with tool icons, structure over abstraction, a picture-first process flow full of icons, a dark-to-light colour arc, bigger type, clear tool handling, a working Past clients section and nav, at award-grade quality. Three.js was kept for the hero because the road needs real perspective; labels are HTML so text stays crisp and cheap. |
