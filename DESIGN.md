# Design System — EV Advisory Homepage

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
- **Scale:** Hero 56-72px, section headings 32-40px, body 18px, supporting copy 14-16px, mono labels 11-12px uppercase

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
- **Dark plate band (2026-09-24):** The hero's static plate and the Tools / Proof / Reviews narrative that follows it now form one continuous dark band, so the pinned agent-network canvas stays visible behind all three sections (their cards were already `bg-slate-900/80`-style translucent surfaces; only the section wrapper background changed from light to transparent-over-dark). The Mission section above and the final CTA below stay light-first, unchanged. The band uses Ink as its ground, Graphite for atmospheric falloff, Rule at low opacity for edges, Accent cyan for the line, nodes, and agent, and Off-white for the agent's own glow and any headline text inside it.

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
- **Approach:** A static hero, plus one persistent, scroll-driven Three.js background layer pinned behind three homepage sections; minimal-functional elsewhere.
- **Hero:** the hero plate is now a permanent static poster (no JS settle-in animation; the earlier Web Animations module was retired 2026-09-24). It stays a contained, decorative, aria-hidden column that never sits behind the headline, subheadline, or body copy.
- **Agent network background:** a sticky (`position: sticky`) WebGL canvas pinned behind the Tools & Integrations, Validation & Proof, and Reviews & Confirmations sections. It shows four honestly-labeled tool nodes (Inbox, CRM, Project tool, Documents, matching the real tool list in `content/services/ai-agent-implementation.md`) and one agent object that travels between them, collecting a small item icon at each stop, camera and state driven entirely by real scroll position (`agent-network-loader.js` computes progress from `getBoundingClientRect`, no timers advance the story). This is the literal illustration of the offer: one agent as the connective layer between the tools a team already runs.
- **Lazy-load and fallback:** the heavy three.js-containing bundle (`agent-network-scene.js`) is only fetched via a dynamic `import()` once the section nears the viewport (`IntersectionObserver`, 600px root margin); the tiny loader (`agent-network-loader.js`) ships unconditionally. `prefers-reduced-motion: reduce` visitors, browsers without `IntersectionObserver`, and no-JS/failed-load cases all see a static inline SVG poster instead and never fetch the WebGL bundle at all.
- **Rendering budget:** MeshStandardMaterial (not physically-based transmission), no post-processing/bloom pass, three lights, four low-poly nodes, pixel ratio capped at 1.75, and the render loop pauses via a second `IntersectionObserver` whenever the section scrolls out of view.
- **Nav:** the site nav is sticky at all breakpoints (previously desktop-only) and gains three homepage-only anchor links (Tools / Proof / Reviews) in the same pill style as the existing Store link.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-25 | Homepage moved to restrained technical editorial system | Tightens credibility and better matches the audit-first offer |
| 2026-09-24 | Motion approach changed from no decorative motion to one restrained hero element (decision node graph) with light scroll motion, lazy-loaded, reduced-motion-safe, contained so it never crosses body copy | Homepage modernization pass |
| 2026-09-24 | Hero node graph replaced by the hero plate (layered SVG and CSS with a small Web Animations module, no WebGL); the hero becomes the single dark plate; the Live Audit card moves to its own section below the hero | The node graph and real-time 3D were rejected by the site owner; depth now comes from perspective, atmosphere and one light source at a fraction of the weight |
| 2026-09-24 | EV rejected a Remotion-rendered video hero and a video-hero-plus-live-section hybrid, both explored the same day. Picked instead: keep the current site theme (not a redesign), add a sticky nav with section anchors, and add one persistent, scroll-driven Three.js background layer showing an agent moving between real tool nodes, pinned behind a reorganized Tools / Proof / Reviews narrative. The hero plate's settle-in JS module is retired in the same change (a permanent static poster replaces it) so the page carries one scroll-driven motion system instead of two. | EV's literal pick, recorded verbatim on TASK-5844: "Base: concept 3, on the CURRENT site theme... Scroll-driven, not click-driven... A Three.js background layer that animates with scroll: AI agents moving along and picking up tools, emails, messages and integration access... Practical over flashy: dense and informative (benchmark: the immigration deck), readable on phone, fast." |
