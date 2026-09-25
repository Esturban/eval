// REUSE_CHECKED: none -- this is the offer-specific scene for CRO-6814 (AI
// Agent Implementation explainer). No prior scene file exists anywhere in
// repos/ or web/eval; searched alongside engine/beatgrid.js (see that file's
// header for the exact search commands run).
//
// Scene: AI Agent Implementation, 12 states, one shape, never cut.
// Inbox pill -> loader -> checkmark -> agent capsule -> ticket card ->
// status toggle -> progress scrub -> confidence slider -> approval toggle ->
// tab indicator -> weekly chart -> command palette -> toast -> back to pill.
//
// Beat grid retimed to 112 BPM / 4-4 / 7 bars = 28 beats = exactly 15.0s
// (the template's own 120 BPM would give 14.0s; see engine/beatgrid.js).
// Everything below is a pure function of t: no timers, no CSS transitions,
// no state read from a previous seek() call.

(function () {
  const { Timeline } = window.EngineSprings;
  const { createBeatGrid } = window.EngineBeatGrid;
  const { createCursor } = window.EngineCursor;
  const { fitCameraToBox, applyCamera } = window.EngineCamera;

  // ---- palette (site palette, from the CRO-6814 design pass) ----------
  const CANVAS_BG = "#f7f4ee";
  const SHAPE_FILL = "#0f172a"; // graphite
  const HAIRLINE = "#dbe3ee";
  const ACCENT = "#22d3ee";
  const ON_DARK = "#f7f4ee";
  const ON_DARK_MUTED = "rgba(247, 244, 238, 0.55)";
  const FONT_STACK = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, Roboto, sans-serif';
  // Font note: the template names Geist. No local Geist files exist in this
  // machine's asset tree and fetching it from a CDN would make the headless
  // render depend on network access mid-render. Using the OS UI font stack
  // instead: same "one clean UI font" read, zero license question, zero
  // network dependency. Flagged in the closing PAD comment for the reviewer.

  // ---- math helpers -----------------------------------------------------
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const smoothstep = (x) => {
    const p = clamp01(x);
    return p * p * (3 - 2 * p);
  };

  // Plain ramp envelope for opacity/reveal (not a spring -- these are simple
  // ease curves for content swaps, still a pure function of t).
  function fadeWindow(t, tStart, fadeIn, holdEnd, fadeOut) {
    if (t < tStart) return 0;
    if (t < tStart + fadeIn) return smoothstep((t - tStart) / fadeIn);
    if (t < holdEnd) return 1;
    if (t < holdEnd + fadeOut) return 1 - smoothstep((t - holdEnd) / fadeOut);
    return 0;
  }

  function withFade(ctx, opacity, blurPx, draw) {
    if (opacity <= 0.002) return;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.filter = blurPx > 0.05 ? `blur(${blurPx}px)` : "none";
    draw();
    ctx.restore();
  }

  // Bakes a "drag follows a moving target" feel as a sum of closed-form
  // spring events sampled along targetFn -- still a pure function of time
  // once built, per the build template's closed-form-spring rule.
  function dragFollow(timeline, tStart, tEnd, targetFn, steps, opts) {
    for (let i = 1; i <= steps; i++) {
      const t = tStart + ((tEnd - tStart) * i) / steps;
      timeline.springTo(t, targetFn(t), opts);
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  // ---- beat grid ----------------------------------------------------------
  const grid = createBeatGrid({ bpm: 112, beatsPerBar: 4, bars: 7 });
  const B = (n) => grid.beatTime(n);
  const DURATION = grid.duration; // 15.0s exactly

  // ---- outer shape: the one element that never cuts ----------------------
  const boxW = new Timeline(300);
  const boxH = new Timeline(76);
  const boxR = new Timeline(38);

  boxW.springTo(B(2), 96);
  boxH.springTo(B(2), 96);
  boxR.springTo(B(2), 48);

  boxW.springTo(B(6), 260);
  boxH.springTo(B(6), 64);
  boxR.springTo(B(6), 32);

  boxW.springTo(B(9), 340);
  boxH.springTo(B(9), 300);
  boxR.springTo(B(9), 28);

  boxW.springTo(B(15), 96);
  boxH.springTo(B(15), 380);
  boxR.springTo(B(15), 48);

  boxW.springTo(B(19), 140);
  boxH.springTo(B(19), 72);
  boxR.springTo(B(19), 36);

  boxW.springTo(B(21), 340);
  boxH.springTo(B(21), 80);
  boxR.springTo(B(21), 40);

  boxW.springTo(B(23), 340);
  boxH.springTo(B(23), 320);
  boxR.springTo(B(23), 28);

  boxW.springTo(B(25), 380);
  boxH.springTo(B(25), 76);
  boxR.springTo(B(25), 38);

  boxW.springTo(B(27), 220);
  boxH.springTo(B(27), 64);
  boxR.springTo(B(27), 32);

  // Loop-closing event: snappier spring so the box is fully settled back at
  // beat-1 dimensions well before the last exported frame (frame 899, at
  // t=14.9833s), so frame 0 and frame 899 diff to zero.
  const SNAP = { omega: 17, zeta: 0.92 };
  boxW.springTo(B(28), 300, SNAP);
  boxH.springTo(B(28), 76, SNAP);
  boxR.springTo(B(28), 38, SNAP);

  // ---- scrub / slider fill ------------------------------------------------
  const scrubFrac = new Timeline(0);
  dragFollow(scrubFrac, B(14), B(15), (t) => lerp(0, 0.8, clamp01((t - B(14)) / (B(15) - B(14)))), 10, {
    omega: 20,
    zeta: 0.95,
  });

  const sliderFrac = new Timeline(0.8);
  dragFollow(
    sliderFrac,
    B(17),
    B(18),
    (t) => lerp(0.8, 1.35, Math.sqrt(clamp01((t - B(17)) / (B(18) - B(17))))),
    14,
    { omega: 18, zeta: 0.97 } // near-critically damped: overshoot only, no bounce, while held
  );
  sliderFrac.springTo(B(18), 0.68, { omega: 11, zeta: 0.88 });

  // ---- toggle -------------------------------------------------------------
  const TOGGLE_TRAVEL = 34;
  const knobLead = new Timeline(-TOGGLE_TRAVEL / 2);
  const knobTrail = new Timeline(-TOGGLE_TRAVEL / 2);
  knobLead.springTo(B(20), TOGGLE_TRAVEL / 2, { omega: 19, zeta: 0.95 });
  knobTrail.springTo(B(20), TOGGLE_TRAVEL / 2, { omega: 9, zeta: 0.9 });
  const toggleOn = new Timeline(0);
  toggleOn.springTo(B(20), 1, { omega: 15, zeta: 0.9 });

  // ---- tab indicator (two-spring liquid stretch) ---------------------------
  const TAB_SLOT = 340 * 0.82 / 3;
  const TAB_L0 = -1.5 * TAB_SLOT + 10;
  const TAB_R0 = -0.5 * TAB_SLOT - 10;
  const TAB_L1 = -0.5 * TAB_SLOT + 10;
  const TAB_R1 = 0.5 * TAB_SLOT - 10;
  const tabLead = new Timeline(TAB_L0);
  const tabTrail = new Timeline(TAB_R0);
  tabLead.springTo(B(22), TAB_L1, { omega: 19, zeta: 0.95 });
  tabTrail.springTo(B(22), TAB_R1, { omega: 9, zeta: 0.9 });

  // ---- weekly chart bars ----------------------------------------------------
  const BAR_TARGETS = [0.42, 0.7, 0.36, 0.82, 0.58];
  const barTracks = BAR_TARGETS.map((target, i) => {
    const tl = new Timeline(0);
    tl.springTo(B(23) + i * 0.05, target, { omega: 12, zeta: 0.88 });
    return tl;
  });

  // ---- typed "characters" in the command palette (abstract, wordless) ------
  const TYPED_SLOTS = [16, 22, 14, 20]; // widths of abstract dash glyphs

  // ---- cursor ---------------------------------------------------------------
  const REST_X = 70;
  const REST_Y = 0;
  const cursor = createCursor({ x: REST_X, y: REST_Y });

  function pulsePress(t0, downDur = 0.1) {
    cursor.pressTrack.springTo(t0, 1, { omega: 34, zeta: 0.7 });
    cursor.pressTrack.springTo(t0 + downDur, 0, { omega: 22, zeta: 0.92 });
  }

  pulsePress(B(2));

  cursor.xTrack.springTo(B(12) - 0.22, 118, { omega: 15, zeta: 0.9 });
  cursor.yTrack.springTo(B(12) - 0.22, -108, { omega: 15, zeta: 0.9 });
  pulsePress(B(12));

  const SCRUB_X0 = -110;
  const SCRUB_X1 = 96;
  const SCRUB_Y = -16;
  cursor.xTrack.springTo(B(14) - 0.06, SCRUB_X0, { omega: 20 });
  cursor.yTrack.springTo(B(14) - 0.06, SCRUB_Y, { omega: 20 });
  cursor.pressTrack.springTo(B(14) - 0.02, 1, { omega: 30 });
  cursor.xTrack.hold(B(14), (t) => lerp(SCRUB_X0, SCRUB_X1, clamp01((t - B(14)) / (B(15) - B(14)))));
  cursor.yTrack.hold(B(14), () => SCRUB_Y);
  cursor.pressTrack.springTo(B(15) + 0.02, 0, { omega: 20 });

  const SLIDER_Y_BOTTOM = 150;
  const SLIDER_Y_TOP = -150;
  const SLIDER_Y_OVER = -190;
  cursor.xTrack.springTo(B(17) - 0.05, 0, { omega: 20 });
  cursor.yTrack.springTo(B(17) - 0.05, lerp(SLIDER_Y_BOTTOM, SLIDER_Y_TOP, 0.8), { omega: 20 });
  cursor.pressTrack.springTo(B(17) - 0.02, 1, { omega: 30 });
  cursor.xTrack.hold(B(17), () => 0);
  cursor.yTrack.hold(B(17), (t) => {
    const p = Math.sqrt(clamp01((t - B(17)) / (B(18) - B(17))));
    return lerp(lerp(SLIDER_Y_BOTTOM, SLIDER_Y_TOP, 0.8), SLIDER_Y_OVER, p);
  });
  cursor.pressTrack.springTo(B(18) + 0.02, 0, { omega: 20 });
  cursor.xTrack.springTo(B(18) + 0.1, 0, { omega: 11, zeta: 0.88 });
  cursor.yTrack.springTo(B(18) + 0.1, lerp(SLIDER_Y_BOTTOM, SLIDER_Y_TOP, 0.68), { omega: 11, zeta: 0.88 });

  cursor.xTrack.springTo(B(20) - 0.2, TOGGLE_TRAVEL / 2, { omega: 15 });
  cursor.yTrack.springTo(B(20) - 0.2, 0, { omega: 15 });
  pulsePress(B(20));

  cursor.xTrack.springTo(B(22) - 0.2, (TAB_L1 + TAB_R1) / 2, { omega: 15 });
  cursor.yTrack.springTo(B(22) - 0.2, 0, { omega: 15 });
  pulsePress(B(22));

  const HOVER_BAR = 3; // index into BAR_TARGETS, 0-based
  cursor.xTrack.springTo(B(24) - 0.15, -102 + HOVER_BAR * 51, { omega: 13 });
  cursor.yTrack.springTo(B(24) - 0.15, 40, { omega: 13 });

  cursor.xTrack.springTo(B(26), 150, { omega: 13 });
  cursor.yTrack.springTo(B(26), 0, { omega: 13 });
  pulsePress(B(27), 0.08);

  cursor.xTrack.springTo(B(28), REST_X, SNAP);
  cursor.yTrack.springTo(B(28), REST_Y, SNAP);

  // ---- drawing ----------------------------------------------------------

  function drawUnreadDot(ctx, t) {
    // The clip opens already idle (no prior state to fade in from) and must
    // land on that same idle dot by the last exported frame so frame 0 and
    // the loop-closing frame match exactly. A fade-in sampled at its own
    // t=0 start evaluates to 0 (smoothstep(0)=0), which is what the
    // first/last-frame diff check caught: full opacity at the loop close,
    // zero at t=0. Plain presence before beat 2, fade back in after the
    // loop-closing beat.
    const fadeOutEnd = B(2) + 0.15;
    let opacity;
    if (t <= B(2)) {
      opacity = 1;
    } else if (t < fadeOutEnd) {
      opacity = 1 - smoothstep((t - B(2)) / 0.15);
    } else {
      opacity = fadeWindow(t, B(28) + 0.22, 0.25, DURATION + 1, 0.001);
    }
    if (opacity <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = clamp01(opacity);
    ctx.beginPath();
    ctx.arc(-boxW.value(t) / 2 + 26, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = ACCENT;
    ctx.fill();
    ctx.restore();
  }

  function drawSpinner(ctx, t) {
    const op = fadeWindow(t, B(2) + 0.2, 0.15, B(5), 0.12);
    if (op <= 0.01) return;
    const spin = clamp01((t - B(2)) / (B(4) - B(2)));
    const angle = spin * Math.PI * 2 * 1.35 - Math.PI / 2;
    withFade(ctx, op, 0, () => {
      ctx.beginPath();
      ctx.arc(0, 0, 22, angle, angle + Math.PI * 1.15);
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.stroke();
    });
  }

  function drawCheckmark(ctx, t) {
    const op = fadeWindow(t, B(5), 0.18, B(6) + 0.2, 0.18);
    if (op <= 0.01) return;
    const draw = smoothstep(clamp01((t - B(5)) / 0.32));
    withFade(ctx, op, 0, () => {
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      const p1 = [-13, 1];
      const p2 = [-3, 12];
      const p3 = [16, -11];
      const leg1 = draw < 0.5 ? draw / 0.5 : 1;
      const leg2 = draw < 0.5 ? 0 : (draw - 0.5) / 0.5;
      ctx.moveTo(p1[0], p1[1]);
      ctx.lineTo(lerp(p1[0], p2[0], leg1), lerp(p1[1], p2[1], leg1));
      if (leg2 > 0) {
        ctx.lineTo(lerp(p2[0], p3[0], leg2), lerp(p2[1], p3[1], leg2));
      }
      ctx.stroke();
    });
  }

  function drawLabel(ctx, text, t, tStart, holdEnd) {
    const op = fadeWindow(t, tStart, 0.22, holdEnd, 0.16);
    if (op <= 0.01) return;
    const blur = (1 - smoothstep(op)) * 3;
    withFade(ctx, op, blur, () => {
      ctx.fillStyle = ON_DARK;
      ctx.font = `600 22px ${FONT_STACK}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 0, 0);
    });
  }

  function drawIslandLabel(ctx, t) {
    // Anticipated slightly before beat 8 so the label reads as already
    // there at the beat instead of mid fade-in (caught in the per-beat QA
    // pass: sampling exactly at B(8) showed an empty capsule).
    drawLabel(ctx, "Agent", t, B(8) - 0.18, B(9) + 0.12);
  }

  function drawCard(ctx, t) {
    const w = boxW.value(t);
    const h = boxH.value(t);
    const op = fadeWindow(t, B(9) + 0.1, 0.2, B(15), 0.15);
    if (op <= 0.01) return;
    withFade(ctx, op, 0, () => {
      const left = -w / 2 + 26;
      const top = -h / 2 + 30;

      const titleReveal = smoothstep(clamp01((t - B(10)) / 0.3));
      ctx.fillStyle = ON_DARK;
      roundRect(ctx, left, top, 92 * titleReveal, 10, 5);
      ctx.fill();

      const metaReveal = smoothstep(clamp01((t - B(10) - 0.08) / 0.3));
      ctx.fillStyle = ON_DARK_MUTED;
      roundRect(ctx, left, top + 22, 130 * metaReveal, 7, 3.5);
      ctx.fill();

      const iconOp = fadeWindow(t, B(11), 0.15, B(12), 0.12);
      const progOp = fadeWindow(t, B(12), 0.15, B(15), 0.15);
      withFade(ctx, iconOp * op, (1 - smoothstep(iconOp)) * 2, () => {
        ctx.beginPath();
        ctx.arc(118, -108, 13, 0, Math.PI * 2);
        ctx.strokeStyle = HAIRLINE;
        ctx.lineWidth = 3;
        ctx.stroke();
      });
      withFade(ctx, progOp * op, (1 - smoothstep(progOp)) * 2, () => {
        ctx.beginPath();
        ctx.arc(118, -108, 13, -Math.PI / 2, Math.PI * 1.1);
        ctx.strokeStyle = ACCENT;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.stroke();
      });

      const trackOp = fadeWindow(t, B(13), 0.18, B(15), 0.15);
      if (trackOp > 0.01) {
        withFade(ctx, trackOp * op, 0, () => {
          const trackW = 220;
          roundRect(ctx, -trackW / 2, SCRUB_Y - 3, trackW, 6, 3);
          ctx.fillStyle = HAIRLINE;
          ctx.fill();
          const fillW = trackW * clamp01(scrubFrac.value(t));
          roundRect(ctx, -trackW / 2, SCRUB_Y - 3, fillW, 6, 3);
          ctx.fillStyle = ACCENT;
          ctx.fill();
        });
      }
    });
  }

  function drawSlider(ctx, t) {
    const op = fadeWindow(t, B(15) + 0.1, 0.2, B(19), 0.15);
    if (op <= 0.01) return;
    withFade(ctx, op, 0, () => {
      const trackH = 300;
      roundRect(ctx, -12, -trackH / 2, 24, trackH, 12);
      ctx.fillStyle = HAIRLINE;
      ctx.fill();
      const frac = clamp01(sliderFrac.value(t));
      const fillH = trackH * frac;
      roundRect(ctx, -12, trackH / 2 - fillH, 24, fillH, 12);
      ctx.fillStyle = ACCENT;
      ctx.fill();

      const knobY = trackH / 2 - fillH;
      ctx.beginPath();
      ctx.arc(0, knobY, 17, 0, Math.PI * 2);
      ctx.fillStyle = SHAPE_FILL;
      ctx.strokeStyle = ON_DARK;
      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();
    });
  }

  // The "Approved" label and the toggle graphic (track + knob) share the
  // same small container and both fully occupy its center, so they cannot
  // be visible at once -- the QA pass caught them overlapping into an
  // illegible mess. Label shows first, in the brief window right after the
  // shape settles into toggle dimensions; it is fully gone before the
  // graphic starts fading in, which in turn is fully settled before the
  // beat-20 click needs it visible. Each gets its own enter/exit timing per
  // the build template's gotcha on morphing-container content swaps.
  function drawApprovedLabel(ctx, t) {
    const op = fadeWindow(t, B(19), 0.16, B(19) + 0.22, 0.14);
    if (op <= 0.01) return;
    const blur = (1 - smoothstep(op)) * 3;
    withFade(ctx, op, blur, () => {
      ctx.fillStyle = ON_DARK;
      ctx.font = `600 22px ${FONT_STACK}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Approved", 0, 0);
    });
  }

  function drawToggle(ctx, t) {
    const op = fadeWindow(t, B(19) + 0.32, 0.15, B(21), 0.15);
    if (op <= 0.01) return;
    withFade(ctx, op, 0, () => {
      const trackW = 88;
      const trackH = 40;
      roundRect(ctx, -trackW / 2, -trackH / 2, trackW, trackH, trackH / 2);
      const onMix = clamp01(toggleOn.value(t));
      ctx.fillStyle = onMix > 0.5 ? ACCENT : HAIRLINE;
      ctx.fill();

      const lead = knobLead.value(t);
      const trail = knobTrail.value(t);
      const x0 = Math.min(lead, trail) - 16;
      const x1 = Math.max(lead, trail) + 16;
      roundRect(ctx, x0, -16, x1 - x0, 32, 16);
      ctx.fillStyle = SHAPE_FILL;
      ctx.fill();
    });
  }

  function drawTabIndicatorAndIcons(ctx, t) {
    const op = fadeWindow(t, B(21) + 0.1, 0.2, B(23), 0.15);
    if (op <= 0.01) return;
    withFade(ctx, op, 0, () => {
      const lead = tabLead.value(t);
      const trail = tabTrail.value(t);
      roundRect(ctx, Math.min(lead, trail), -22, Math.abs(trail - lead), 44, 20);
      ctx.fillStyle = ACCENT;
      ctx.fill();

      const centers = [(TAB_L0 + TAB_R0) / 2, (TAB_L1 + TAB_R1) / 2, (TAB_L1 + TAB_R1) / 2 + TAB_SLOT];
      ctx.strokeStyle = ON_DARK;
      ctx.fillStyle = ON_DARK;
      ctx.lineWidth = 2.4;

      ctx.beginPath();
      ctx.arc(centers[0], 0, 8, 0, Math.PI * 2);
      ctx.stroke();

      const barX = centers[1];
      for (let i = -1; i <= 1; i++) {
        roundRect(ctx, barX + i * 7 - 2, -9 + i * 2, 4, 18 - i * 2, 2);
        ctx.fill();
      }

      const gridX = centers[2];
      for (let gx = -1; gx <= 0; gx++) {
        for (let gy = -1; gy <= 0; gy++) {
          roundRect(ctx, gridX + gx * 9 + 1, gy * 9 + 1, 7, 7, 1.5);
          ctx.stroke();
        }
      }
    });
  }

  function drawChart(ctx, t) {
    const op = fadeWindow(t, B(23) + 0.15, 0.2, B(25), 0.15);
    if (op <= 0.01) return;
    withFade(ctx, op, 0, () => {
      const baseY = 130;
      const barW = 34;
      const gap = 17;
      const startX = -((barTracks.length - 1) * (barW + gap)) / 2;
      barTracks.forEach((tl, i) => {
        const frac = clamp01(tl.value(t));
        const h = frac * 220;
        const x = startX + i * (barW + gap);
        roundRect(ctx, x - barW / 2, baseY - h, barW, h, 8);
        ctx.fillStyle = ACCENT;
        ctx.fill();
      });

      const tipOp = fadeWindow(t, B(24), 0.15, B(25) - 0.1, 0.15);
      if (tipOp > 0.01) {
        const bx = startX + HOVER_BAR * (barW + gap);
        withFade(ctx, tipOp, 0, () => {
          roundRect(ctx, bx - 40, baseY - 220 - 46, 80, 30, 10);
          ctx.fillStyle = SHAPE_FILL;
          ctx.fill();
          ctx.strokeStyle = HAIRLINE;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          // wordless before/after glyph: a short muted dash, an arrow, a
          // longer accent dash -- no digits, no text (design pass keeps the
          // 3-label budget for Agent / Approved / Done only).
          const cy = baseY - 220 - 31;
          roundRect(ctx, bx - 28, cy - 2, 12, 4, 2);
          ctx.fillStyle = ON_DARK_MUTED;
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(bx - 12, cy);
          ctx.lineTo(bx - 2, cy);
          ctx.strokeStyle = ON_DARK_MUTED;
          ctx.lineWidth = 2;
          ctx.stroke();
          roundRect(ctx, bx + 2, cy - 2.5, 26, 5, 2.5);
          ctx.fillStyle = ACCENT;
          ctx.fill();
        });
      }
    });
  }

  function drawPalette(ctx, t) {
    const op = fadeWindow(t, B(25) + 0.1, 0.2, B(27), 0.15);
    if (op <= 0.01) return;
    withFade(ctx, op, 0, () => {
      ctx.beginPath();
      ctx.arc(-150, 0, 9, 0, Math.PI * 2);
      ctx.strokeStyle = HAIRLINE;
      ctx.lineWidth = 2.4;
      ctx.stroke();

      let x = -118;
      TYPED_SLOTS.forEach((w, i) => {
        const charOp = fadeWindow(t, B(26) + i * 0.09, 0.09, B(27) - 0.05, 0.08);
        if (charOp > 0.01) {
          withFade(ctx, charOp, (1 - smoothstep(charOp)) * 3, () => {
            roundRect(ctx, x, -6, w, 12, 4);
            ctx.fillStyle = ON_DARK;
            ctx.fill();
          });
        }
        x += w + 8;
      });
    });
  }

  function drawDoneLabel(ctx, t) {
    drawLabel(ctx, "Done", t, B(27) + 0.12, B(28) + 0.05);
  }

  function drawToast(ctx, t) {
    const op = fadeWindow(t, B(27), 0.15, B(28) + 0.02, 0.2);
    if (op <= 0.01) return;
    withFade(ctx, op, 0, () => {
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 2;
      roundRect(ctx, -boxW.value(t) / 2 + 3, -boxH.value(t) / 2 + 3, boxW.value(t) - 6, boxH.value(t) - 6, boxR.value(t) - 3);
      ctx.stroke();
    });
  }

  function seek(t) {
    const canvas = document.getElementById("stage");
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, w, h);

    const bw = boxW.value(t);
    const bh = boxH.value(t) + Math.max(0, sliderFrac.value(t) - 1) * 90;
    const br = boxR.value(t);

    const camera = fitCameraToBox({ canvasW: w, canvasH: h, boxW: bw, boxH: bh });
    applyCamera(ctx, camera);

    ctx.lineWidth = 1.6;
    roundRect(ctx, -bw / 2, -bh / 2, bw, bh, br);
    ctx.fillStyle = SHAPE_FILL;
    ctx.fill();
    ctx.strokeStyle = HAIRLINE;
    ctx.stroke();

    drawUnreadDot(ctx, t);
    drawSpinner(ctx, t);
    drawCheckmark(ctx, t);
    drawIslandLabel(ctx, t);
    drawCard(ctx, t);
    drawSlider(ctx, t);
    drawApprovedLabel(ctx, t);
    drawToggle(ctx, t);
    drawTabIndicatorAndIcons(ctx, t);
    drawChart(ctx, t);
    drawPalette(ctx, t);
    drawToast(ctx, t);
    drawDoneLabel(ctx, t);

    cursor.draw(ctx, t, { ink: SHAPE_FILL, ring: HAIRLINE });
  }

  window.SCENE_DURATION = DURATION;
  window.SCENE_BEAT_TIME = B;
  window.SCENE_TOTAL_BEATS = grid.totalBeats;
  window.EngineSeek.register(seek);
})();
