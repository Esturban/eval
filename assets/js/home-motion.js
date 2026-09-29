// Homepage motion, the small part that always ships:
// 1. Highway hero: decides whether to animate at all (reduced motion wins),
//    lazy-loads the 3D scene bundle only when the hero is near the viewport,
//    and feeds it scroll progress through the pinned stage.
// 2. Step rail: highlights the current story step from scroll position.
// 3. Full-page highway: the hero's first agent drives the length of the
//    page past the step signs (page-road.js).
// The colour arc between sections is pure CSS now (main.css, .arc-section).

import { setupRoad } from './page-road.js';

const ROOT_MARGIN = '600px 0px';
const STEP_COUNT = 4;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function prefersReducedMotion() {
  return Boolean(window.matchMedia) && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Data saver on, or a device with very little memory: the static poster is
// the better experience, so the 3D scene is never downloaded.
function prefersPoster() {
  const conn = navigator.connection;
  const lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 2;
  return Boolean(conn && conn.saveData) || lowMemory;
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

  const canAnimate = !prefersReducedMotion() && !prefersPoster() && canvas && sceneSrc && typeof window.IntersectionObserver === 'function';
  if (!canAnimate) return { progress: onProgress };

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
        controller.setVisible(heroVisible);
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
      if (controller) controller.setVisible(heroVisible);
    });
  }, { threshold: 0 }).observe(hero);

  canvas.addEventListener('webglcontextlost', () => hero.classList.remove('is-live'));

  return {
    progress(value) {
      onProgress(value);
      if (controller) controller.setProgress(value);
    },
  };
}

function init() {
  const hero = document.querySelector('[data-highway]');
  const ride = document.querySelector('[data-ride]');
  const layer = document.querySelector('.hwy');
  const seam = document.querySelector('.arc-seam');
  // The road is drawn for everyone with JavaScript; the car is motion, so
  // it takes the same gate as the 3D scene: reduced motion, data saver and
  // low memory get the road and its signs standing still.
  let updateRide = () => {};
  if (ride && layer && seam) {
    const ids = (ride.dataset.ride || '').split(/\s+/).filter(Boolean);
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (sections.length >= 2) {
      updateRide = setupRoad({
        ride,
        layer,
        seam,
        sections,
        steps: JSON.parse(ride.dataset.steps || '[]'),
        still: prefersReducedMotion() || prefersPoster(),
      });
    }
  }
  const highway = hero ? setupHighway(hero, setupSteps(hero)) : null;

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      updateRide();
      if (highway) highway.progress(heroProgress(hero));
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
