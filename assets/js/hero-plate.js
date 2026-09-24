// REUSE_CHECKED: none - the only related code was the old hero graph loader
// in this folder; its gating (reduced motion, load event, IntersectionObserver,
// requestIdleCallback) is carried over here, and that loader plus the WebGL
// module it deferred are removed. This file replaces both.
//
// Hero plate motion: one short settle after load, then stillness.
//
// Progressive enhancement only. The inline poster SVG is already the complete
// image (line drawn, rows lit), so if this script never runs, fails, or the
// visitor prefers reduced motion, nothing is missing. When allowed, it fetches
// the detailed plate, lays it over the poster, and plays one timeline with the
// Web Animations API on transform, opacity and stroke-dashoffset.

const VIEWPORT_MARGIN = '200px';
const IDLE_TIMEOUT_MS = 1500;
const MOBILE_QUERY = '(max-width: 1023px)';
const MOBILE_TIME_SCALE = 2.6 / 3.5;
const EASE_SETTLE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';

const TIMELINE = {
  settleMs: 900,
  lineStartMs: 500,
  lineEndMs: 2900,
  rowMs: 180,
  lightMs: 600,
};

// Camera dolly distance in world units: each pane starts scaled by z / (z - d)
// about the vanishing point, so near panes move most (about 1.035 at the front).
const DOLLY = 0.04;

function prefersReducedMotion() {
  return Boolean(window.matchMedia) && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function canAnimate() {
  return typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function';
}

function isRendered(el) {
  return window.getComputedStyle(el).display !== 'none';
}

async function fetchPlate(url) {
  // canonifyURLs makes the attribute absolute to the production host; fetch the
  // same path from whichever origin served the page (previews, www, local).
  const target = new URL(url, window.location.href);
  const response = await fetch(target.pathname, { credentials: 'same-origin' });
  if (!response.ok) throw new Error(`Hero plate request failed: ${response.status}`);
  const text = await response.text();
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const svg = doc.documentElement;
  if (!svg || svg.nodeName.toLowerCase() !== 'svg') throw new Error('Hero plate is not an SVG');
  return document.importNode(svg, true);
}

function orderedPanes(svg) {
  // Panes are painted far to near; order them near to far for the line's path.
  return Array.from(svg.querySelectorAll('.hp-pane'))
    .filter(isRendered)
    .map((pane) => ({ pane, z: Number(pane.dataset.z) }))
    .filter((entry) => Number.isFinite(entry.z) && entry.z > DOLLY)
    .sort((a, b) => a.z - b.z);
}

function settlePanes(panes, t) {
  return panes
    .map(({ pane, z }) => {
      const inner = pane.querySelector('.hp-pane-inner');
      if (!inner) return null;
      const start = z / (z - DOLLY);
      return inner.animate(
        [{ transform: `scale(${start.toFixed(4)})` }, { transform: 'scale(1)' }],
        { duration: t(TIMELINE.settleMs), easing: EASE_SETTLE, fill: 'both' }
      );
    })
    .filter(Boolean);
}

// The line runs from the plate edge straight to the vanishing point. On screen,
// distance from the vanishing point scales with 1 / z, so the undrawn fraction
// when the head reaches a port at depth z is zStart / z. Keyframes land the head
// on each port at an even interval, which reads as constant speed in depth.
function drawLine(svg, panes, timing) {
  const group = svg.querySelector('.hp-line');
  const zStart = Number(group?.dataset.zStart);
  if (!group || !Number.isFinite(zStart) || zStart <= 0) return [];

  const keyframes = [{ strokeDashoffset: 1, offset: 0 }];
  panes.forEach(({ z }, index) => {
    keyframes.push({ strokeDashoffset: zStart / z, offset: (index + 1) / timing.steps });
  });
  keyframes.push({ strokeDashoffset: 0, offset: 1 });

  return Array.from(group.querySelectorAll('path')).map((path) => {
    path.setAttribute('stroke-dasharray', '1 1');
    return path.animate(keyframes, {
      duration: timing.duration,
      delay: timing.delay,
      easing: 'linear',
      fill: 'both',
    });
  });
}

function lightRows(panes, timing, t) {
  return panes
    .map(({ pane }, index) => {
      const row = pane.querySelector('.hp-row-lit');
      if (!row) return null;
      return row.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: t(TIMELINE.rowMs),
        delay: timing.delay + (timing.duration * (index + 1)) / timing.steps,
        easing: EASE_OUT,
        fill: 'both',
      });
    })
    .filter(Boolean);
}

function raiseLight(svg, t) {
  const light = svg.querySelector('.hp-light');
  if (!light) return [];
  return [
    light.animate([{ opacity: 0.6 }, { opacity: 1 }], {
      duration: t(TIMELINE.lightMs),
      delay: t(TIMELINE.lineEndMs),
      easing: EASE_OUT,
      fill: 'both',
    }),
  ];
}

function buildTimeline(svg, scale) {
  const t = (ms) => ms * scale;
  const panes = orderedPanes(svg);
  const timing = {
    delay: t(TIMELINE.lineStartMs),
    duration: t(TIMELINE.lineEndMs - TIMELINE.lineStartMs),
    steps: panes.length + 1,
  };
  return [
    ...settlePanes(panes, t),
    ...drawLine(svg, panes, timing),
    ...lightRows(panes, timing, t),
    ...raiseLight(svg, t),
  ];
}

async function play(plate) {
  const svg = await fetchPlate(plate.dataset.plateUrl);
  const layer = document.createElement('div');
  layer.className = 'hero-plate__detail is-intro';
  layer.appendChild(svg);

  const scale = window.matchMedia(MOBILE_QUERY).matches ? MOBILE_TIME_SCALE : 1;
  const fade = layer.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: TIMELINE.settleMs * scale,
    easing: EASE_SETTLE,
    fill: 'both',
  });
  plate.appendChild(layer);
  const animations = [fade, ...buildTimeline(svg, scale)];

  await Promise.all(animations.map((animation) => animation.finished));
  layer.classList.remove('is-intro');
  plate.classList.add('is-settled');
}

function whenIdle(callback) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout: IDLE_TIMEOUT_MS });
  } else {
    window.setTimeout(callback, 200);
  }
}

function whenVisible(el, callback) {
  if (!('IntersectionObserver' in window)) {
    callback();
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        callback();
      }
    },
    { rootMargin: VIEWPORT_MARGIN }
  );
  observer.observe(el);
}

function boot() {
  const plate = document.getElementById('hero-plate');
  if (!plate || !plate.dataset.plateUrl) return;
  if (prefersReducedMotion() || !canAnimate()) return;

  const start = () =>
    whenVisible(plate, () =>
      whenIdle(() => {
        play(plate).catch((error) => {
          // The poster stays in place; warn once so a broken asset is findable.
          console.warn('Hero plate motion skipped:', error);
        });
      })
    );

  if (document.readyState === 'complete') {
    start();
  } else {
    window.addEventListener('load', start, { once: true });
  }
}

boot();
