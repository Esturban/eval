// REUSE_CHECKED: none -- searched repos/ and web/eval for *beatgrid*, *beat-grid*,
// "closed-form spring", "stepResponse", "beatTime" (js/mjs/py). Nothing existed.
// This is new, single-purpose plumbing for the code-only motion pipeline
// (CRO-6814). DEV-6816 is the ticket that later lifts this into a shared kit;
// this file is written so that lift is a move, not a rewrite.
//
// Engine: beat grid. Reusable across any code-only motion scene. Pure math,
// no DOM, no timers, no state carried between frames.
//
// The grid is authored as bars/beats (musical time). A scene picks BPM and
// bar count; this file turns that into second offsets. This scene retimes
// to 112 BPM (28 beats over 7 bars lands on exactly 15.0s), not the 120 BPM
// the original template used, so the rendered clip matches the ticket's
// 15.0s duration requirement exactly. See scene.js for the call site.

(function (global) {
  function createBeatGrid({ bpm, beatsPerBar, bars }) {
    const beatDur = 60 / bpm;
    const totalBeats = beatsPerBar * bars;
    const duration = totalBeats * beatDur;

    // 1-indexed beat number -> seconds at which that beat starts.
    function beatTime(beatNumber) {
      return (beatNumber - 1) * beatDur;
    }

    // seconds -> fractional beat position (1-indexed), for debugging/QA labels.
    function beatAt(t) {
      return t / beatDur + 1;
    }

    return {
      bpm,
      beatsPerBar,
      bars,
      beatDur,
      totalBeats,
      duration,
      beatTime,
      beatAt,
    };
  }

  global.EngineBeatGrid = { createBeatGrid };
})(typeof window !== "undefined" ? window : globalThis);
