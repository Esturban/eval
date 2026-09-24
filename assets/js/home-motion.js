// REUSE_CHECKED: none - assets/js holds no other lazy-load, scroll or
// reduced-motion code since the previous hero loader was retired.
//
// Homepage motion, the small part that always ships:
// 1. Highway hero: decides whether to animate at all (reduced motion wins),
//    lazy-loads the three.js bundle only when the hero is near the viewport,
//    and feeds it scroll progress through the pinned stage.
// 2. Step rail: highlights the current story step from scroll position.
// 3. Colour arc: one continuous background colour across the page, blended
//    between each section's tone as its boundary crosses the viewport.
//    Without this script every section keeps its own static background.

const ROOT_MARGIN = '600px 0px';
const STEP_COUNT = 4;
const ARC_BLEND = 0.45; // share of the viewport height used to blend two tones

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

  const canAnimate = !prefersReducedMotion() && canvas && sceneSrc && typeof window.IntersectionObserver === 'function';
  if (!canAnimate) return { progress: onProgress };

  function start() {
    if (loading || controller) return;
    loading = true;
    import(sceneSrc)
      .then((mod) => {
        controller = mod.createHighwayScene({ canvas, root: hero });
        if (!controller) return;
        hero.classList.add('is-live');
        controller.setProgress(heroProgress(hero));
        controller.setVisible(true);
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
    entries.forEach((e) => controller && controller.setVisible(e.isIntersecting));
  }, { threshold: 0 }).observe(hero);

  canvas.addEventListener('webglcontextlost', () => hero.classList.remove('is-live'));

  return {
    progress(value) {
      onProgress(value);
      if (controller) controller.setProgress(value);
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

function setupArc(main) {
  const sections = Array.from(main.querySelectorAll('.arc-section[data-tone]'));
  if (sections.length < 2) return () => {};
  const tones = sections.map((s) => parseHex(s.dataset.tone));
  let tops = [];

  function measure() {
    const base = window.scrollY;
    tops = sections.map((s) => s.getBoundingClientRect().top + base);
  }

  function update() {
    const vh = window.innerHeight;
    const probe = window.scrollY + vh * 0.6;
    let i = 0;
    while (i < tops.length - 1 && probe >= tops[i + 1]) i += 1;
    let color = tones[i];
    const next = i + 1;
    if (next < tops.length) {
      const blendStart = tops[next] - vh * ARC_BLEND;
      const t = clamp((probe - blendStart) / (vh * ARC_BLEND), 0, 1);
      if (t > 0) {
        const k = smooth(t);
        color = tones[i].map((c, j) => Math.round(c + (tones[next][j] - c) * k));
      }
    }
    main.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  }

  measure();
  document.documentElement.classList.add('arc-live');
  window.addEventListener('resize', () => { measure(); update(); }, { passive: true });
  window.addEventListener('load', () => { measure(); update(); });
  return update;
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
