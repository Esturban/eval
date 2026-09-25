// REUSE_CHECKED: none -- see beatgrid.js header for the search that covered
// this whole engine/ folder; nothing in repos/ or web/eval already implements
// closed-form spring step responses or a change-event timeline.
//
// Engine: closed-form springs.
//
// A value that changes target many times is the sum of one spring per
// change, so it stays a pure function of time (per the build template's
// gotcha: no integration loop, no per-frame carried state). Every Timeline
// below is evaluated fresh from `t` alone.

(function (global) {
  // Underdamped step response of a damped harmonic oscillator, normalized
  // so h(0)=0 and h(tau->inf)=1. zeta close to 1 with omega tuned for a
  // ~0.3-0.45s settle gives "springs everywhere, a tiny overshoot at most"
  // per the template's <direction> -- never the bouncy/elastic easing the
  // template's Banned list rules out.
  function stepResponse(tau, { omega = 13, zeta = 0.86 } = {}) {
    if (tau <= 0) return 0;
    const omegaD = omega * Math.sqrt(1 - zeta * zeta);
    const envelope = Math.exp(-zeta * omega * tau);
    const value =
      1 -
      envelope *
        (Math.cos(omegaD * tau) + ((zeta * omega) / omegaD) * Math.sin(omegaD * tau));
    return value;
  }

  // A Timeline tracks one scalar UI parameter (a box width, a fade opacity,
  // a slider fraction, a cursor coordinate...) across the whole clip.
  //
  // Two kinds of segments:
  //  - spring(t, target, opts): value glides from wherever the timeline was
  //    to `target`, as the sum of step responses described above.
  //  - hold(tStart, tEnd, fn): direct manipulation while a drag/press is
  //    held; value is computed straight from fn(t) (itself a pure function
  //    of time, e.g. cursor position), bypassing the spring chain. Springs
  //    resume on the next event, chained from the value at release.
  class Timeline {
    constructor(initialValue) {
      this.segments = [{ type: "const", tStart: -Infinity, value: initialValue }];
      this._lastValue = initialValue;
    }

    _valueAtSegmentsBefore(t) {
      // Evaluate the timeline as built so far, at time t. Used only while
      // constructing (to seed the "fromValue" of the next segment), never
      // during per-frame render, so this cheap linear scan is fine.
      let active = this.segments[0];
      for (const seg of this.segments) {
        if (seg.tStart <= t) active = seg;
        else break;
      }
      return this._evalSegment(active, t);
    }

    _evalSegment(seg, t) {
      if (seg.type === "const") return seg.value;
      if (seg.type === "hold") return seg.fn(t);
      if (seg.type === "spring") {
        const tau = t - seg.tStart;
        return seg.fromValue + (seg.target - seg.fromValue) * stepResponse(tau, seg.opts);
      }
      return seg.value;
    }

    springTo(tStart, target, opts = {}) {
      const fromValue = this._valueAtSegmentsBefore(tStart);
      this.segments.push({ type: "spring", tStart, fromValue, target, opts });
      return this;
    }

    hold(tStart, fn) {
      this.segments.push({ type: "hold", tStart, fn });
      return this;
    }

    value(t) {
      let active = this.segments[0];
      for (const seg of this.segments) {
        if (seg.tStart <= t) active = seg;
        else break;
      }
      return this._evalSegment(active, t);
    }
  }

  global.EngineSprings = { stepResponse, Timeline };
})(typeof window !== "undefined" ? window : globalThis);
