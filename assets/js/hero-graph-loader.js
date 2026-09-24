// REUSE_CHECKED: none - this is a new, small loader with no prior equivalent
// in this repo (see hero-graph.js for the reuse note on the animation module
// it lazy-loads). Kept dependency-free and separate from hero-graph.js so
// the heavy Three.js bundle only downloads when this file decides it should.
//
// Progressive enhancement: the hero panel already shows a static graphic by
// default. This script only swaps in the animated canvas when WebGL is
// available, prefers-reduced-motion is not set, and the panel is about to
// enter the viewport. If anything fails, the static graphic just stays.
(function () {
  function prefersReducedMotion() {
    return Boolean(window.matchMedia) && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function supportsWebGL() {
    try {
      var canvas = document.createElement('canvas');
      return Boolean(
        window.WebGLRenderingContext &&
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  }

  function boot() {
    var panel = document.getElementById('hero-signal-panel');
    var canvas = document.getElementById('hero-signal-canvas');
    var staticGraphic = document.getElementById('hero-signal-static');
    if (!panel || !canvas || !canvas.dataset.moduleUrl) return;
    if (prefersReducedMotion() || !supportsWebGL()) return;

    var loaded = false;
    function load() {
      if (loaded) return;
      loaded = true;
      import(canvas.dataset.moduleUrl)
        .then(function (mod) {
          if (!mod || typeof mod.default !== 'function') return;
          mod.default(canvas, panel);
          canvas.classList.remove('opacity-0');
          if (staticGraphic) staticGraphic.classList.add('opacity-0');
        })
        .catch(function () {
          // Static graphic remains visible - no broken state.
        });
    }

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              load();
              observer.disconnect();
            }
          });
        },
        { rootMargin: '200px' }
      );
      observer.observe(panel);
    } else {
      window.addEventListener('load', load);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
