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

    function scheduleLoad() {
      // Downloading and initializing the WebGL renderer is real main-thread
      // work. Running it the moment the panel is merely near the viewport
      // (as soon as DOMContentLoaded fires) competes with the page's own
      // initial paint/interactivity work and shows up as blocking time even
      // though the panel is "lazy loaded" in the download sense. Deferring
      // to requestIdleCallback keeps the download lazy (still gated on
      // visibility) while keeping the actual execution off the critical path.
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(load, { timeout: 1500 });
      } else {
        setTimeout(load, 200);
      }
    }

    function startObserving() {
      if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                scheduleLoad();
                observer.disconnect();
              }
            });
          },
          { rootMargin: '200px' }
        );
        observer.observe(panel);
      } else {
        scheduleLoad();
      }
    }

    // Wait for the page's own load event before even starting to watch the
    // panel, so this script never competes with first paint or the rest of
    // the page's initial scripts, regardless of where the panel sits.
    if (document.readyState === 'complete') {
      startObserving();
    } else {
      window.addEventListener('load', startObserving);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
