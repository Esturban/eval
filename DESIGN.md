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
- **Dark mode posture:** Existing site dark mode can remain, but homepage decisions should optimize for light-mode editorial clarity first.
- **Dark plate:** The hero is the single dark plate on the homepage; the rest of the page stays light-first. The plate uses Ink as its ground, Graphite for atmospheric falloff, Rule at low opacity for pane edges, Accent cyan for the one line and the handled rows, and Off-white for the headline.

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
- **Approach:** One restrained hero element, otherwise minimal-functional
- **Use:** hover and focus feedback throughout, plus one contained hero plate: a row of abstract tool panes receding in one-point perspective, with a single cyan line threading through each pane toward a light at the vanishing point. It represents agents carrying work across the tools a team already runs.
- **Hero timeline:** one non-looping settle under 4 seconds (panes settle into focus, the line draws through each pane and lights its top row, the light rises), then fully static. Mobile shows fewer panes and a shorter timeline.
- **Scroll:** light depth parallax as the hero scrolls away, CSS scroll-driven animation only, applied only where the browser supports it; no scroll JavaScript.
- **Fallback:** poster first. The inline static plate is the complete image and is what first paint, reduced-motion visitors, and no-JS or failed-load cases see. The motion layer loads only after page load, when idle and in view.
- **Containment:** the plate lives in its own bounded column and never sits behind the headline, subheadline, or body copy. It is decorative and hidden from assistive technology; the copy carries the meaning.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-25 | Homepage moved to restrained technical editorial system | Tightens credibility and better matches the audit-first offer |
| 2026-09-24 | Motion approach changed from no decorative motion to one restrained hero element (decision node graph) with light scroll motion, lazy-loaded, reduced-motion-safe, contained so it never crosses body copy | Homepage modernization pass |
| 2026-09-24 | Hero node graph replaced by the hero plate (layered SVG and CSS with a small Web Animations module, no WebGL); the hero becomes the single dark plate; the Live Audit card moves to its own section below the hero | The node graph and real-time 3D were rejected by the site owner; depth now comes from perspective, atmosphere and one light source at a fraction of the weight |
