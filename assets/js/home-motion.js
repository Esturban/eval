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

// Moves the hero's own canvas (never a second one) into the fixed `.hw-rail`
// host once the hero's pinned stage has scrolled past, and back into the
// hero stage if the user scrolls back up above it. The rail host is a
// static, empty element already in the page (layouts/index.html) so its
// authored width is measurable even before the scene has loaded.
function setupRail(canvas) {
  const host = document.querySelector('.hw-rail');
  const stageParent = canvas.parentNode;
  const stageNextSibling = canvas.nextSibling;
  let inRail = false;

  return {
    get inRail() { return inRail; },
    mount() {
      if (inRail || !host) return;
      host.appendChild(canvas);
      inRail = true;
    },
    unmount() {
      if (!inRail) return;
      stageParent.insertBefore(canvas, stageNextSibling);
      inRail = false;
    },
    width() {
      return host ? host.getBoundingClientRect().width : 0;
    },
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
  const rail = setupRail(canvas);

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
    // Re-parents the canvas between the hero stage and the fixed rail host
    // as the hero's pinned stage crosses the top of the viewport, and keeps
    // --rail-w in sync so every arc-section's content gutter tracks the
    // rail's real (clamp()-shrunk) width.
    updateRail() {
      if (!isDesktop()) {
        if (rail.inRail) {
          rail.unmount();
          if (controller) { controller.setRailMode(false); controller.resize(); }
        }
        document.documentElement.style.setProperty('--rail-w', '0px');
        return;
      }
      const pastHero = hero.getBoundingClientRect().bottom <= 0;
      if (pastHero && !rail.inRail && controller) {
        rail.mount();
        controller.setRailMode(true);
        controller.resize();
      } else if (!pastHero && rail.inRail) {
        rail.unmount();
        if (controller) { controller.setRailMode(false); controller.resize(); }
      }
      document.documentElement.style.setProperty('--rail-w', `${rail.width()}px`);
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
