// Homepage motion, the small part that always ships:
// 1. Highway hero: decides whether to animate at all (reduced motion wins),
//    lazy-loads the 3D scene bundle only when the hero is near the viewport,
//    and feeds it scroll progress through the pinned stage.
// 2. Step rail: highlights the current story step from scroll position.
// 3. Colour arc: one continuous background colour across the page, blended
//    between each section's tone as its boundary crosses the viewport.
//    Without this script every section keeps its own static background.

import { readToneStops } from './tone-stops.js';

const ROOT_MARGIN = '600px 0px';
const STEP_COUNT = 4;
const DESKTOP_QUERY = '(min-width: 1024px)';
// Colour arc: each blend between two tones spans this share of the viewport
// height. It starts where it always did (the next section 105% down the
// viewport) but runs on past the boundary instead of finishing at it, so the
// dark-to-light change is spread over twice the scroll.
const ARC_BLEND = 0.9;
const ARC_LEAD = 0.45; // how far past the probe line the blend keeps going
const ARC_PROBE = 0.6; // where in the viewport a boundary counts as crossed

// Full-page rail handoff (CRO-6731 Pass 5): matches the rail's own CSS
// clamp(220px, 22vw, 340px) in main.css so the JS-driven dock box lands
// exactly on the CSS-defined rail once docked.
const RAIL_MIN = 220;
const RAIL_MAX = 340;
const RAIL_VW = 0.22;
function railTargetWidth() {
  return clamp(window.innerWidth * RAIL_VW, RAIL_MIN, RAIL_MAX);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function prefersReducedMotion() {
  return Boolean(window.matchMedia) && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function heroProgress(hero) {
  const rect = hero.getBoundingClientRect();
  const total = hero.offsetHeight - window.innerHeight;
  if (total <= 0) return 0;
  return clamp(-rect.top / total, 0, 1);
}

function setupSteps(hero) {
  const items = Array.from(hero.querySelectorAll('.hw-steps__item'));
  let current = 0;
  return function update(progress) {
    const step = Math.min(STEP_COUNT - 1, Math.floor(progress * STEP_COUNT));
    if (step === current) return;
    current = step;
    items.forEach((el, i) => el.classList.toggle('is-active', i === step));
  };
}

function setupHighway(hero, onProgress) {
  const canvas = hero.querySelector('.hw__canvas');
  const sceneSrc = hero.dataset.sceneSrc;
  let controller = null;
  let loading = false;
  let heroVisible = true;
  let pastFooter = false;

  const canAnimate = !prefersReducedMotion() && canvas && sceneSrc && typeof window.IntersectionObserver === 'function';
  if (!canAnimate) return { progress: onProgress, updateRail() {}, setDayProgress() {} };

  const desktopQuery = window.matchMedia ? window.matchMedia(DESKTOP_QUERY) : null;
  const isDesktop = () => Boolean(desktopQuery && desktopQuery.matches);
  // On desktop the rail keeps running past the hero on purpose (that is the
  // whole feature); the footer sentinel is what stops it there instead. On
  // phone, which has no rail, the hero's own visibility is still the gate.
  const wantedVisible = () => (isDesktop() ? !pastFooter : heroVisible);
  let pinned = false; // true once the canvas is JS-positioned (desktop, live)

  // Restores the canvas to its default stylesheet-driven box (absolute,
  // filling the sticky hero stage) so mobile/tablet, and the moment before
  // the scene has loaded, are completely unaffected by the dock logic below.
  function unpin() {
    if (!pinned) return;
    canvas.style.cssText = '';
    pinned = false;
    if (controller) { controller.setRailT(0); controller.resize(); }
  }

  // The scene is decoration: fetch it after the page has loaded and the
  // browser is idle, so it never competes with the first paint.
  function whenIdle(fn) {
    const run = () => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 200));
    if (document.readyState === 'complete') run();
    else window.addEventListener('load', run, { once: true });
  }

  function start() {
    if (loading || controller) return;
    loading = true;
    whenIdle(load);
  }

  function load() {
    import(sceneSrc)
      .then((mod) => mod.createHighwayScene({ canvas, root: hero }))
      .then((created) => {
        controller = created;
        if (!controller) return;
        hero.classList.add('is-live');
        controller.setProgress(heroProgress(hero));
        controller.setVisible(wantedVisible());
        window.addEventListener('resize', () => controller.resize(), { passive: true });
        // CRO-6731 Pass 4: highway-scene.js caches each label's offsetWidth
        // on first measurement and only re-measures on resize. On a cold
        // load that first measurement can land before "JetBrains Mono"
        // finishes swapping in, caching the fallback font's narrower width
        // and clipping the label once the real (wider) font paints. Forcing
        // one resize() once fonts are ready clears that stale cache.
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => controller.resize());
      })
      .catch(() => {
        loading = false; // poster stays in place
      });
  }

  new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) start();
  }, { rootMargin: ROOT_MARGIN }).observe(hero);

  new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      heroVisible = e.isIntersecting;
      if (controller) controller.setVisible(wantedVisible());
    });
  }, { threshold: 0 }).observe(hero);

  // Observed the same way as the hero's own visibility gate above: once
  // this 1px marker at the true end of main is intersecting at all, the
  // closing CTA/footer is on screen, so the rail stops. Scrolling back up
  // takes it out of view again and resumes it. A rect.top<=0 "fully
  // scrolled past" check does not work here: the footer after main is
  // shorter than one viewport, so the sentinel can never scroll above the
  // top of the viewport on its own, and that check would never fire.
  const sentinel = document.querySelector('.hw-sentinel');
  if (sentinel) {
    new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        pastFooter = e.isIntersecting;
        if (controller) controller.setVisible(wantedVisible());
      });
    }, { threshold: 0 }).observe(sentinel);
  }

  canvas.addEventListener('webglcontextlost', () => hero.classList.remove('is-live'));

  return {
    progress(value) {
      onProgress(value);
      if (controller) controller.setProgress(value);
    },
    // Total-document-scroll day/night. Phone has no rail and keeps its
    // day/night story expressed the way it already is, through <main>'s
    // colour-arc background, so this only drives the scene on desktop.
    setDayProgress(value) {
      if (controller && isDesktop()) controller.setDayProgress(value);
    },
    // Docks the canvas by taking over its own position (fixed, not the
    // hero's native sticky) once the hero's pinned stage would otherwise
    // release it, and continuously shrinks it into the rail's box over the
    // next viewport height of scroll instead of re-parenting it at a
    // threshold. The canvas never moves in the DOM (CRO-6731 Pass 5: EV,
    // "midway down the page... a sudden jump and change... make that
    // handoff one continuous motion... no swap or pop").
    updateRail() {
      if (!isDesktop()) {
        unpin();
        document.documentElement.style.setProperty('--rail-w', '0px');
        return;
      }
      if (!controller) return;
      pinned = true;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const railW = railTargetWidth();
      // 0 while the hero's pinned stage still has room (the point at which
      // native sticky would itself release the canvas); 1 a further
      // viewport height of scroll later. Reusing exactly the scroll
      // distance sticky used to spend sliding the canvas off-screen means
      // the section height (250svh) does not need to change.
      const heroBottom = hero.getBoundingClientRect().bottom;
      const t = smooth(clamp((vh - heroBottom) / vh, 0, 1));

      canvas.style.position = 'fixed';
      canvas.style.inset = 'auto';
      canvas.style.top = '0px';
      canvas.style.left = `${(vw - railW) * t}px`;
      canvas.style.width = `${vw + (railW - vw) * t}px`;
      canvas.style.height = `${vh}px`;
      canvas.style.zIndex = '5';
      canvas.style.pointerEvents = 'none';
      // Same WCAG-guard mask the rail's own CSS box already carries, moved
      // onto the canvas itself since the canvas no longer re-parents into
      // .hw-rail; applied throughout the dock (not just once t reaches 1)
      // since the transition plays out over still-dark sections, well
      // above where the light sections' contrast risk actually begins.
      canvas.style.maskImage = 'linear-gradient(to left, white 62%, transparent 100%)';
      canvas.style.webkitMaskImage = canvas.style.maskImage;

      controller.setRailT(t);
      controller.resize();
      document.documentElement.style.setProperty('--rail-w', `${railW * t}px`);
    },
  };
}

function parseHex(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

// Half linear, half smoothstep: still eases in and out, but its steepest
// rate of change is well under smoothstep's, so no stretch of scroll flips
// the page hard.
function gentle(t) {
  return 0.5 * t + 0.5 * smooth(t);
}

function setupArc(main) {
  const sections = Array.from(main.querySelectorAll('.arc-section[data-tone]'));
  if (sections.length < 2) return () => {};
  const tones = readToneStops(main.ownerDocument).map(parseHex);
  let tops = [];

  function measure() {
    const base = window.scrollY;
    tops = sections.map((s) => s.getBoundingClientRect().top + base);
  }

  function update() {
    const vh = window.innerHeight;
    const probe = window.scrollY + vh * ARC_PROBE;
    let i = 0;
    while (i < tops.length - 1 && probe >= tops[i + 1]) i += 1;
    let color = tones[i];
    // The nearest boundary whose blend window holds the probe, whether it
    // is still ahead (next) or was just crossed (current).
    [i + 1, i].forEach((b) => {
      if (b < 1 || b >= tops.length) return;
      const blendStart = tops[b] - vh * (ARC_BLEND - ARC_LEAD);
      const t = (probe - blendStart) / (vh * ARC_BLEND);
      if (t <= 0 || t >= 1) return;
      const k = gentle(t);
      color = tones[b - 1].map((c, j) => Math.round(c + (tones[b][j] - c) * k));
    });
    main.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  }

  measure();
  document.documentElement.classList.add('arc-live');
  window.addEventListener('resize', () => { measure(); update(); }, { passive: true });
  window.addEventListener('load', () => { measure(); update(); });
  return update;
}

function documentScrollFraction() {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  if (total <= 0) return 0;
  return clamp(window.scrollY / total, 0, 1);
}

function init() {
  const main = document.querySelector('.home-arc');
  const hero = document.querySelector('[data-highway]');
  const updateArc = main ? setupArc(main) : () => {};
  const highway = hero ? setupHighway(hero, setupSteps(hero)) : null;

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      updateArc();
      if (highway) {
        highway.progress(heroProgress(hero));
        highway.setDayProgress(documentScrollFraction());
        highway.updateRail();
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
