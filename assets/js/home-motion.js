// Homepage motion, the small part that always ships:
// 1. Highway hero: decides whether to animate at all (reduced motion wins),
//    lazy-loads the 3D scene bundle only when the hero is near the viewport,
//    and feeds it scroll progress through the pinned stage.
// 2. Step rail: highlights the current story step from scroll position.
// 3. Ride-along lane: the hero's first agent keeps driving down a thin lane
//    in the right gutter as the reader scrolls (full-motion path only).
// The colour arc between sections is pure CSS now (main.css, .arc-section).

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

// Ride-along lane: the hero's first agent keeps driving down a thin lane
// pinned in the right gutter while the reader moves through the page. Its
// position is scroll progress through the sections named in data-ride;
// the caption and colour step through the same four story steps as the
// hero rail. Transform and one class per step, nothing that lays out.
const RIDE_IN = 0.35;  // shown once the hero has left: first section's top this far down the viewport
const RIDE_OUT = 0.8;  // hidden once the last section's bottom rises above this share of the viewport
const RIDE_LANES = [0, 6, 6, 0]; // px: the car eases one lane over while it works

function parseHex(hex) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function isLightTone(hex) {
  const [r, g, b] = parseHex(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 140;
}

function setupRide(ride) {
  const ids = (ride.dataset.ride || '').split(/\s+/).filter(Boolean);
  const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
  if (sections.length < 2) return () => {};
  // Seams count from their middle, where their colour turns over.
  const tones = Array.from(document.querySelectorAll('.arc-section[data-tone], .arc-seam[data-tone]'));
  const steps = JSON.parse(ride.dataset.steps || '[]');
  const car = ride.querySelector('.ride__car');
  const caption = ride.querySelector('.ride__caption span');
  const label = ride.querySelector('.ride__caption b');
  let tops = [];
  let toneTops = [];
  let height = 0;
  let current = -1;
  let theme = '';

  function measure() {
    const base = window.scrollY;
    tops = sections.map((s) => s.getBoundingClientRect().top + base);
    const last = sections[sections.length - 1];
    tops.push(last.getBoundingClientRect().bottom + base);
    toneTops = tones
      .map((s) => {
        const r = s.getBoundingClientRect();
        const top = r.top + base + (s.classList.contains('arc-seam') ? r.height / 2 : 0);
        return [top, s.dataset.tone];
      })
      .sort((a, b) => a[0] - b[0]);
    height = ride.clientHeight;
  }

  function setStep(i) {
    if (i === current || !steps[i]) return;
    current = i;
    label.textContent = steps[i].n;
    caption.textContent = steps[i].text;
    caption.classList.remove('is-swap');
    void caption.offsetWidth; // restart the swap animation
    caption.classList.add('is-swap');
    ride.classList.toggle('is-done', i === steps.length - 1);
    ride.style.setProperty('--ride-x', `${RIDE_LANES[i] || 0}px`);
  }

  function update() {
    const vh = window.innerHeight;
    const y = window.scrollY;
    const first = tops[0];
    const end = tops[tops.length - 1];
    ride.classList.toggle('is-shown', y + vh * RIDE_IN > first && y + vh * RIDE_OUT < end);

    // Progress runs from the first section reaching mid screen to the last
    // one leaving it, so the car arrives as the story does.
    const mid = y + vh * 0.5;
    const p = clamp((mid - first) / Math.max(1, end - first), 0, 1);
    ride.style.setProperty('--ride-p', p.toFixed(4));
    ride.style.setProperty('--ride-y', `${(p * height).toFixed(1)}px`);

    let i = 0;
    while (i < sections.length - 1 && mid >= tops[i + 1]) i += 1;
    setStep(i);

    // Light or dark ink, from the tone of the section behind the car.
    const carY = y + vh * 0.24 + p * height;
    let tone = toneTops.length ? toneTops[0][1] : '#020617';
    toneTops.forEach(([top, t]) => { if (carY >= top) tone = t; });
    const next = isLightTone(tone) ? 'light' : 'dark';
    if (next !== theme) {
      theme = next;
      ride.dataset.theme = next;
    }
  }

  measure();
  ride.classList.add('is-on');
  window.addEventListener('resize', () => { measure(); update(); }, { passive: true });
  window.addEventListener('load', () => { measure(); update(); });
  return update;
}

function init() {
  const hero = document.querySelector('[data-highway]');
  const ride = document.querySelector('[data-ride]');
  // The lane is motion: same gate as the 3D scene, so reduced motion,
  // data saver and low memory keep the static page they had before.
  const updateRide = ride && !prefersReducedMotion() && !prefersPoster() ? setupRide(ride) : () => {};
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
