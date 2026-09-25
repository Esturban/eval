// REUSE_CHECKED: /Users/EVA/Desktop/eva/03_development/_dev/repos/__archive/apple/YourVProApp/ios/Pods/Flipper-Boost-iOSX/boost/iostreams/seek.hpp
// (guardchain flagged this hit on the filename "seek" alone) -- that is a
// vendored Boost C++ iostreams header inside an archived, unrelated iOS
// Pods tree. Nothing to do with a time-based render seam. Also searched
// repos/ and web/eval generally for beat-grid/spring/seek motion plumbing
// (see beatgrid.js header); none exists. New, single-purpose engine
// plumbing for CRO-6814.
//
// Engine: seek harness. The single seam the Playwright render script talks
// to. A scene calls EngineSeek.register(fn) once at load; the render script
// then calls window.__seek(t) once per subframe. fn(t) must be a pure
// function of t: no timers, no CSS transitions, no state read from a
// previous call. This file carries no per-scene knowledge (box shapes,
// palette, beats) -- that all lives in scene.js -- so lifting this folder
// into a shared kit later (DEV-6816) is a move, not an untangle.

(function (global) {
  function register(seekFn) {
    global.__seek = function seek(t) {
      seekFn(t);
    };
    global.__seekReady = true;
  }

  global.EngineSeek = { register };
})(typeof window !== "undefined" ? window : globalThis);
