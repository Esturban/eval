/* REUSE_CHECKED: /Users/EVA/Desktop/eva/03_development/_dev/web/eval/content-motion/ai-agent-implementation-explainer/engine/seek.js
   found (plus render.mjs beside it); deliberately separate. DESIGN.md rule 12 bars importing anything
   from the rejected 15 s cut. This file instead reuses the approved stills page (../index.html).

   CMO-8460 motion layer for the approved 30 s explainer stills.
   Injected into ../index.html after it loads, so BEATS, DRAW, TYPE, C, boxOf and inkMetrics
   (the approved geometry, palette and type) are the single source of truth. Nothing is redrawn here.
   Every value is a pure function of the frame number: no timers, no CSS transitions, no randomness.
   window.__FMT picks the frame: 4:5 (1080x1350) or 9:16 (1080x1920, recomposed for safe zones). */
(() => {
  const FPS = 30;
  /* Beat lengths in frames, sized to each beat's read time (1.0 s + 0.4 s per headline word). */
  const DUR = [126, 114, 108, 117, 117, 117, 117, 135];
  const EXIT = 9;            /* 0.3 s depth exit at the end of beats 1 to 7 */
  const CAM = 45;            /* 1.5 s camera settle, critically damped */
  const PERSPECTIVE = 2000;
  const FMT = window.__FMT || { name: "4x5", w: 1080, h: 1350, dx: 0, headDy: 0, gfxDy: 0 };

  const START = [];
  let acc = 0;
  for (const d of DUR) { START.push(acc); acc += d; }
  const TOTAL = acc;

  /* One camera move per beat: start offsets that spring to neutral. s scale, rx/ry degrees, tx/ty px. */
  const CAMERA = {
    1: { s: 0.94, rx: 5, ty: 30 },   /* dolly in */
    2: { ry: -9, tx: 40 },           /* orbit in from the right */
    3: { rx: 9, ty: -30 },           /* tilt down onto the task list */
    4: { rx: -8, ty: 40 },           /* crane up to the workflow */
    5: { ry: 9, tx: -40 },           /* orbit in from the left */
    6: { s: 0.92 },                  /* push in on the time claim */
    7: { ry: -8, tx: 30 },           /* orbit in from the right */
    8: { rx: 6, s: 0.96 }            /* settle onto the CTA */
  };
  /* Depth of each layer at the start of a beat (px along Z) and at the end of its exit. */
  const Z0 = { bg: -260, gfx: -120, cap: 40, head: 90 };
  const ZEXIT = { bg: -200, gfx: -90, cap: 40, head: 70 };
  const LAYERS = ["bg", "gfx", "cap", "head"];
  const HEAD = new Set(["h", "hx"]);
  const CAP = new Set(["s", "ben", "cta", "ctat"]);

  function layerOf(b) {
    if (b.k === "decor") return "bg";
    if (HEAD.has(b.id)) return "head";
    if (CAP.has(b.id)) return "cap";
    return "gfx";
  }
  function spring(t, dur) {
    if (dur <= 0) return t >= 0 ? 1 : 0;
    if (t <= 0) return 0;
    if (t >= dur) return 1;
    const x = 9.23 * t / dur;
    return 1 - (1 + x) * Math.exp(-x);
  }
  const clamp01 = v => Math.min(1, Math.max(0, v));

  /* Per-beat overrides, seconds from the beat start. wipe: the block draws left to right. */
  const OVR = {
    /* Connectors wait for the cards: the lane path draws once the lane pill is in, the dimmed old handoff last. */
    2: { lanep: { at: 0.75, dur: 0.55, wipe: true, rise: 0 }, item: { at: 0.85, dur: 0.6, fromX: -250, rise: 0 },
      x: { at: 0.9, dur: 0.5, rise: 0 } },
    3: { tak: { at: 1.05, dur: 0.4, scale: 0.5, rise: 0 } },
    4: { p12: { at: 0.85, dur: 0.5, wipe: true, rise: 0 }, s2: { at: 1.1, dur: 0.4, scale: 0.7, rise: 0 } },
    5: { w1: { at: 0.5 }, w2: { at: 0.65 }, w3: { at: 0.8 }, w1b: { at: 0.95, dur: 0.4, scale: 0.5, rise: 0 },
      ap: { at: 1.1, dur: 0.4 }, apc: { at: 1.1, dur: 0.4 }, apt: { at: 1.1, dur: 0.4 } },
    6: { rail: { at: 0.35, dur: 0.5, wipe: true, rise: 0 },
      g1: { at: 0.45 }, g1l: { at: 0.45 }, g2: { at: 0.57 }, g2l: { at: 0.57 }, g3: { at: 0.69 }, g3l: { at: 0.69 },
      win: { at: 0.8, dur: 0.4, wipe: true, rise: 0 }, k1: { at: 0.8 }, k2: { at: 0.8 }, w2: { at: 0.85 }, w6: { at: 0.85 },
      g4: { at: 0.95, dur: 0.5, scale: 0.7, rise: 0 }, gl: { at: 1.05, dur: 0.45 }, glt: { at: 1.05, dur: 0.45 } },
    8: { rail: { at: 0.65, dur: 0.5, wipe: true, rise: 0 },
      d1: { at: 0.7 }, d1l: { at: 0.7 }, d2: { at: 0.8 }, d2l: { at: 0.8 }, d3: { at: 0.9 }, d3l: { at: 0.9 },
      d4: { at: 1.0, dur: 0.5, scale: 0.7, rise: 0 }, d4l: { at: 1.0, dur: 0.5 } }
  };

  function baseSpec(n, b) {
    const L = layerOf(b);
    if (L === "head") return { at: b.id === "hx" ? 0.15 : 0, dur: n === 1 ? 0 : 0.5, rise: 24 };
    if (L === "cap") return { at: (b.at || 18) / 60, dur: 0.5, rise: 24 };
    if (L === "bg") return { at: 0.2, dur: 0.6, rise: 0 };
    if (n === 1) return b.at ? { at: b.at / 60, dur: (b.dur || 24) / 60, rise: 24 } : { at: 0, dur: 0, rise: 0 };
    const box = boxOf(b);
    if (n === 7) {
      const f = clamp01((box.y - 600) / 480);
      return box.x < 540 ? { at: 0.35 + 0.25 * f, dur: 0.45, rise: 16 } : { at: 0.7 + 0.3 * f, dur: 0.5, rise: 16 };
    }
    /* Default: the diagram assembles top to bottom, a soft wipe in time keyed to each block's y. */
    const f = clamp01((box.y - 560) / 520);
    return { at: 0.35 + 0.55 * f, dur: 0.55, rise: 16 };
  }
  function spec(n, b) {
    const s = Object.assign({ fromX: 0, scale: 1, wipe: false, quickFade: layerOf(b) === "head" }, baseSpec(n, b), (OVR[n] || {})[b.id] || {});
    return { ...s, atF: Math.round(s.at * FPS), durF: Math.round(s.dur * FPS) };
  }

  function div(style) {
    const d = document.createElement("div");
    Object.assign(d.style, style);
    return d;
  }
  /* Same text construction as the approved stills (index.html render()). */
  function makeText(b) {
    const ts = TYPE[b.st];
    const d = div({ left: b.x + "px", top: b.y + "px", width: b.w + "px", height: b.h + "px",
      font: `${ts.wt} ${ts.size}px/${ts.lh}px "Instrument Sans", "Helvetica Neue", Helvetica, Arial, sans-serif`,
      letterSpacing: ts.track + "em", color: C[b.col], textAlign: b.al || "left" });
    d.className = "t";
    for (const line of b.lines) {
      const ln = document.createElement("div"); ln.className = "ln";
      const sp = document.createElement("span"); sp.textContent = line;
      const m = inkMetrics(ts, line);
      if ((b.al || "left") === "left" && m.left > 0) ln.style.paddingLeft = Math.ceil(m.left) + "px";
      ln.appendChild(sp); d.appendChild(ln);
    }
    return d;
  }

  const stage = document.getElementById("stage");
  document.documentElement.style.background = C.bg;
  document.body.style.background = C.bg;
  stage.innerHTML = "";
  Object.assign(stage.style, { width: FMT.w + "px", height: FMT.h + "px", background: C.bg,
    perspective: PERSPECTIVE + "px", perspectiveOrigin: `${FMT.w / 2}px ${FMT.h / 2}px` });
  const SVGNS = "http://www.w3.org/2000/svg";

  /* Placement of the 1080x1350 art inside the frame, per beat and per layer group.
     4:5: identity. 9:16 (FMT.scale set): the art is scaled and centred horizontally (equal side margins,
     clear of the right-hand action rail); the message block is pinned to FMT.headTop and the diagram's
     lowest edge to FMT.gfxBottom, so every beat fills the band between the top and bottom platform UI
     and the headline sits at the same height on every beat. */
  function placement(beat) {
    if (!FMT.scale) {
      return { head: `translate(${FMT.dx}px, ${FMT.headDy}px)`, gfx: `translate(${FMT.dx}px, ${FMT.gfxDy}px)` };
    }
    const s = FMT.scale; const tx = (FMT.w - SAFE_W * s) / 2 - SAFE_X0 * s;
    const low = Math.max(...beat.blocks.filter(b => { const L = layerOf(b); return L === "gfx" || L === "bg"; })
      .map(b => { const bx = boxOf(b); return bx.y + bx.h; }));
    const headTy = FMT.headTop - SAFE_Y0 * s; const gfxTy = FMT.gfxBottom - low * s;
    return { head: `translate(${tx}px, ${headTy}px) scale(${s})`, gfx: `translate(${tx}px, ${gfxTy}px) scale(${s})` };
  }
  const SAFE_X0 = 108; const SAFE_W = 864; const SAFE_Y0 = 135;

  const built = BEATS.map(beat => {
    const place = placement(beat);
    const world = div({ position: "absolute", left: 0, top: 0, width: FMT.w + "px", height: FMT.h + "px",
      transformOrigin: "50% 50%", display: "none" });
    stage.appendChild(world);
    const layers = {};
    for (const L of LAYERS) {
      const el = div({ position: "absolute", left: 0, top: 0, width: FMT.w + "px", height: FMT.h + "px", transformOrigin: "50% 50%" });
      const inner = div({ position: "absolute", left: 0, top: 0, width: "1080px", height: "1350px", transformOrigin: "0 0",
        transform: L === "head" || L === "cap" ? place.head : place.gfx });
      const svg = document.createElementNS(SVGNS, "svg");
      svg.setAttribute("width", "1080"); svg.setAttribute("height", "1350");
      svg.setAttribute("viewBox", "0 0 1080 1350"); svg.style.position = "absolute"; svg.style.overflow = "visible";
      inner.appendChild(svg); el.appendChild(inner); world.appendChild(el);
      layers[L] = { el, inner, svg, markup: "" };
    }
    const items = [];
    for (const b of beat.blocks) {
      const L = layerOf(b); const sp = spec(beat.n, b); const box = boxOf(b);
      if (b.k === "text") {
        const el = makeText(b); layers[L].inner.appendChild(el);
        items.push({ b, sp, box, el, text: true });
        continue;
      }
      const wid = `wipe-${beat.n}-${b.id}`;
      const body = DRAW[b.k](b);
      layers[L].markup += sp.wipe
        ? `<clipPath id="${wid}"><rect id="${wid}-r" x="${box.x - 30}" y="${box.y - 30}" width="0" height="${box.h + 60}"/></clipPath><g data-id="${b.id}"><g clip-path="url(#${wid})">${body}</g></g>`
        : `<g data-id="${b.id}">${body}</g>`;
      items.push({ b, sp, box, L, text: false });
    }
    for (const L of LAYERS) layers[L].svg.innerHTML = layers[L].markup;
    for (const it of items) {
      if (it.text) continue;
      it.el = layers[it.L].svg.querySelector(`g[data-id="${it.b.id}"]`);
      if (it.sp.wipe) it.rect = layers[it.L].svg.querySelector(`#wipe-${beat.n}-${it.b.id}-r`);
    }
    return { beat, world, layers, items };
  });

  function applyBlock(it, t) {
    const sp = it.sp; const p = spring(t - sp.atF, sp.durF);
    const settled = p === 1;
    /* Headlines fade on an ease-out that is already visible on the beat's first frame, so a seam never shows
       a blank frame (the rise still follows the spring). */
    const u = clamp01((t - sp.atF + 1) / Math.max(1, sp.durF * 0.6));
    const op = sp.wipe ? clamp01(p * 4) : (sp.quickFade && t >= sp.atF ? 1 - Math.pow(1 - u, 3) : p);
    const dx = sp.fromX * (1 - p); const dy = sp.rise * (1 - p);
    const sc = sp.scale + (1 - sp.scale) * p;
    if (it.rect) it.rect.setAttribute("width", settled ? it.box.w + 60 : (it.box.w + 60) * p);
    if (it.text) {
      it.el.style.opacity = op;
      it.el.style.transform = settled ? "none" : `translate(${dx}px, ${dy}px) scale(${sc})`;
      return settled;
    }
    it.el.setAttribute("opacity", op);
    if (settled) { it.el.removeAttribute("transform"); return true; }
    const cx = it.box.x + it.box.w / 2; const cy = it.box.y + it.box.h / 2;
    it.el.setAttribute("transform", `translate(${dx} ${dy}) translate(${cx} ${cy}) scale(${sc}) translate(${-cx} ${-cy})`);
    return false;
  }

  function seek(frame) {
    let i = 0;
    while (i + 1 < START.length && frame >= START[i + 1]) i += 1;
    const t = frame - START[i]; const D = DUR[i];
    built.forEach((B, j) => { B.world.style.display = j === i ? "block" : "none"; });
    const B = built[i]; const n = B.beat.n;
    const k = 1 - spring(t, CAM);
    const exiting = i < built.length - 1 && t >= D - EXIT;
    /* Exit peaks at 0.81 on the beat's last frame: the outgoing beat is down to 19 percent, never fully blank. */
    const e = exiting ? Math.pow((t - (D - EXIT) + 1) / (EXIT + 1), 2) : 0;
    const cam = CAMERA[n];
    const flat = k === 0 && e === 0;
    B.world.style.opacity = 1 - e;
    B.world.style.transformStyle = flat ? "flat" : "preserve-3d";
    B.world.style.transform = flat ? "none"
      : `translate3d(${(cam.tx || 0) * k}px, ${(cam.ty || 0) * k - 16 * e}px, 0) rotateX(${(cam.rx || 0) * k}deg) rotateY(${(cam.ry || 0) * k}deg) scale(${1 + ((cam.s || 1) - 1) * k})`;
    for (const L of LAYERS) {
      const z = Z0[L] * k + ZEXIT[L] * e;
      B.layers[L].el.style.transform = flat ? "none" : `translateZ(${z}px)`;
    }
    let blocksSettled = true;
    for (const it of B.items) blocksSettled = applyBlock(it, t) && blocksSettled;
    return { beat: n, t, settled: flat && blocksSettled };
  }

  window.__v2 = { seek, FPS, TOTAL, START, DUR, EXIT, FMT,
    specs: built.map(B => ({ beat: B.beat.n, blocks: B.items.map(it => ({ id: it.b.id, at: it.sp.at, dur: it.sp.dur })) })) };
})();
