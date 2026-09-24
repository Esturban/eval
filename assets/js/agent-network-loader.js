// REUSE_CHECKED: none - the lazy-load pattern this follows (reduced motion
// check, IntersectionObserver, poster-first fallback) lived in hero-plate.js,
// which this change retires; there is nothing left in the tree to point at,
// so this header is written fresh instead of naming a path that no longer
// exists after the retirement.
//
// Agent network background: scroll-driven, not timer-driven. This file finds the
// scene wrapper, decides whether to animate at all (prefers-reduced-motion wins),
// and when it should, lazy-loads assets/js/agent-network-scene.js (the heavy,
// three.js-containing bundle) and feeds it a live scroll-progress value.

const ROOT_MARGIN = '600px 0px';

function prefersReducedMotion() {
  return Boolean(window.matchMedia) && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function computeProgress(wrapper) {
  const rect = wrapper.getBoundingClientRect();
  const total = wrapper.offsetHeight - window.innerHeight;
  if (total <= 0) return 0;
  // rect.top is how far the wrapper's start is above the viewport top; as the
  // visitor scrolls, rect.top goes from 0 to -total across the pinned range.
  return clamp(-rect.top / total, 0, 1);
}

function init() {
  const wrapper = document.querySelector('[data-agent-scene]');
  if (!wrapper) return;

  const canvas = wrapper.querySelector('.agent-scene__canvas');
  const sceneSrc = wrapper.dataset.sceneSrc;

  // Reduced motion, no canvas support, or a missing bundle URL: keep the poster,
  // never fetch the WebGL bundle at all. This is the complete fallback state.
  if (prefersReducedMotion() || !canvas || !sceneSrc || typeof window.IntersectionObserver !== 'function') {
    return;
  }

  let controller = null;
  let loading = false;
  let ticking = false;

  function onScroll() {
    if (!controller || ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      controller.setProgress(computeProgress(wrapper));
      ticking = false;
    });
  }

  function startScene() {
    if (loading || controller) return;
    loading = true;
    import(sceneSrc)
      .then((mod) => {
        controller = mod.createAgentScene({ canvas, wrapper });
        if (!controller) return;
        wrapper.classList.add('is-live');
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', () => controller && controller.resize(), { passive: true });
        onScroll();
      })
      .catch(() => {
        // Leave the poster in place; nothing else to do on a failed fetch.
        loading = false;
      });
  }

  function onVisibilityChange(entries) {
    entries.forEach((entry) => {
      if (!controller) return;
      controller.setVisible(entry.isIntersecting);
    });
  }

  const loadObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        startScene();
      }
    },
    { rootMargin: ROOT_MARGIN }
  );
  loadObserver.observe(wrapper);

  const visibilityObserver = new IntersectionObserver(onVisibilityChange, { threshold: 0 });
  visibilityObserver.observe(wrapper);

  // If a WebGL context ever gets lost (backgrounded tab, GPU reset), fall back
  // to the poster instead of showing a frozen or blank canvas.
  canvas.addEventListener('webglcontextlost', () => {
    wrapper.classList.remove('is-live');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
