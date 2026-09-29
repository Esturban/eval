// Homepage motion, the small part that always ships:
// 1. Highway hero: decides whether to animate at all (reduced motion wins),
//    lazy-loads the 3D scene bundle only when the hero is near the viewport,
//    and feeds it scroll progress through the pinned stage.
// 2. Step rail: highlights the current story step from scroll position.
// 3. Ride-along road: the hero's first agent keeps driving as the reader
//    scrolls, changing lanes as the story moves on: down a two-lane road in
//    the right margin from 1024px, across a strip under the header below
//    that (full-motion path only).
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

// Ride-along road: the hero's first agent keeps driving while the reader
// moves through the sections named in data-ride. Its position is scroll
// progress through them. It changes lanes at every section boundary and
// halfway through each section, and turns into each change (yaw) so it
// reads as driving, not sliding. From 1024px the road runs down the right
// margin; below that it runs across a strip under the header. The caption
// and colour step through the same four story steps as the hero rail.
// Transforms, custom properties and one class per step: nothing that lays out.
const RIDE_IN = 0.35;  // shown once the hero has left: first section's top this far down the viewport
const RIDE_OUT = 0.8;  // hidden once the last section's bottom rises above this share of the viewport
const RIDE_WIDE = '(min-width: 1024px)';
const RIDE_LANE_WIDE = 18;   // px from the road centre to a lane centre, vertical road
const RIDE_LANE_NARROW = 9;  // same, header strip
const RIDE_CAR_NARROW = 44;  // px, car length on the strip
const RIDE_INSET_NARROW = 16; // px kept clear at each end of the strip
const RIDE_CHANGE_PX = 240;  // scroll distance one lane change takes
const RIDE_MAX_CHANGE = 0.06; // ...but never more than this share of the ride
const RIDE_MAX_YAW = 22;     // degrees

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

// Lane position, -1 to 1, eased through each change, and its rate of change
// per unit of progress (which sets the yaw).
function laneAt(p, changes, width) {
  let lane = -1;
  let rate = 0;
  let delta = 2;
  changes.forEach((c) => {
    const t = clamp((p - (c - width / 2)) / width, 0, 1);
    lane += delta * smoothstep(t);
    rate += (delta * 6 * t * (1 - t)) / width;
    delta = -delta;
  });
  return [lane, rate];
}

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
  const caption = ride.querySelector('.ride__caption span');
  const label = ride.querySelector('.ride__caption b');
  const header = document.querySelector('.site-header');
  const wideQuery = window.matchMedia(RIDE_WIDE);
  let tops = [];
  let toneTops = [];
  let changes = [];
  let changeWidth = RIDE_MAX_CHANGE;
  let track = 0;
  let rideTop = 0;
  let wide = true;
  let current = -1;
  let theme = '';

  function measure() {
    const base = window.scrollY;
    wide = wideQuery.matches;
    if (header) ride.style.setProperty('--ride-top', `${header.offsetHeight}px`);
    tops = sections.map((s) => s.getBoundingClientRect().top + base);
    tops.push(sections[sections.length - 1].getBoundingClientRect().bottom + base);
    toneTops = tones
      .map((s) => {
        const r = s.getBoundingClientRect();
        const top = r.top + base + (s.classList.contains('arc-seam') ? r.height / 2 : 0);
        return [top, s.dataset.tone];
      })
      .sort((a, b) => a[0] - b[0]);
    track = wide
      ? ride.clientHeight
      : Math.max(0, ride.clientWidth - RIDE_CAR_NARROW - RIDE_INSET_NARROW * 2);
    rideTop = ride.getBoundingClientRect().top;

    const first = tops[0];
    const span = Math.max(1, tops[tops.length - 1] - first);
    const toProgress = (docY) => (docY - first) / span;
    changes = [];
    sections.forEach((_, i) => {
      if (i > 0) changes.push(toProgress(tops[i]));
      changes.push(toProgress((tops[i] + tops[i + 1]) / 2));
    });
    changeWidth = Math.min(RIDE_MAX_CHANGE, RIDE_CHANGE_PX / span);
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
  }

  function setTheme(next) {
    if (next === theme) return;
    theme = next;
    ride.dataset.theme = next;
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
    const [lane, rate] = laneAt(p, changes, changeWidth);
    const half = wide ? RIDE_LANE_WIDE : RIDE_LANE_NARROW;
    const slope = track > 0 ? (rate * half) / track : 0;
    // Down the page, a move to the right turns the nose anticlockwise;
    // across the strip, a move down turns it clockwise.
    const yaw = clamp((Math.atan(slope) * 180) / Math.PI, -RIDE_MAX_YAW, RIDE_MAX_YAW) * (wide ? -1 : 1);
    ride.style.setProperty('--ride-p', p.toFixed(4));
    ride.style.setProperty('--ride-along', `${(p * track).toFixed(1)}px`);
    ride.style.setProperty('--ride-cross', `${(lane * half).toFixed(1)}px`);
    ride.style.setProperty('--ride-yaw', `${yaw.toFixed(2)}deg`);

    let i = 0;
    while (i < sections.length - 1 && mid >= tops[i + 1]) i += 1;
    setStep(i);

    // The strip under the header is always dark. On the vertical road, ink
    // follows the tone of the section behind the car.
    if (!wide) {
      setTheme('dark');
      return;
    }
    const carY = y + rideTop + p * track;
    let tone = toneTops.length ? toneTops[0][1] : '#020617';
    toneTops.forEach(([top, t]) => { if (carY >= top) tone = t; });
    setTheme(isLightTone(tone) ? 'light' : 'dark');
  }

  ride.classList.add('is-on');
  // The sections reserve their right margin for the road (main.css).
  ride.parentElement.classList.add('has-ride');
  measure();
  const remeasure = () => { measure(); update(); };
  window.addEventListener('resize', remeasure, { passive: true });
  window.addEventListener('load', remeasure);
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
