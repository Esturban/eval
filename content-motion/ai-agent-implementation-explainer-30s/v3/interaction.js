/* REUSE_CHECKED: /Users/EVA/Desktop/eva/03_development/_dev/web/eval/content-motion/ai-agent-implementation-explainer-30s/v2/motion.js
   v2 animates one still per beat with a camera move; v3 needs one persistent stage driven by state rows, so this
   is a separate component. It reuses v2's text construction and the drawing primitives of ../index.html
   (C, TYPE, rrect, glyph, person, badge, drawLine, inkMetrics), so palette, type and shapes stay single-sourced.

   CMO-8464 Interaction component. The ONE renderer for every beat: it reads rows (el, from, to, at, dur, cue)
   from beats.js and returns each element's state at time t. Pure function of the frame, no timers.
   Enforced at load: a cued row never starts before its parent ends; every row's `from` equals the
   element's state at that moment. window.__FMT picks 4:5 or the 9:16 recomposition. */
(() => {
  const FPS = 30;
  const FMT = window.__FMT || { name: "4x5", w: 1080, h: 1350 };
  const { ELEMENTS, BEATS, HEADS } = window.__V3DATA;
  const BY = Object.fromEntries(ELEMENTS.map(e => [e.id, e]));
  const DIM_FADE = 0.45;     /* children of a dim card fade by this much */
  const LINE_DIM = 0.35;     /* a dimmed line keeps 35 percent */
  const ENTER_RISE = 16;     /* px an entering element settles from */
  const isSlot = s => typeof s === "string" && s.startsWith("slot:");
  const clamp01 = v => Math.min(1, Math.max(0, v));
  const fx = v => Math.round(v * 100) / 100;
  function spring(t, dur) {
    if (dur <= 0) return t >= 0 ? 1 : 0;
    if (t <= 0) return 0;
    if (t >= dur) return 1;
    const x = 9.23 * t / dur;
    return 1 - (1 + x) * Math.exp(-x);
  }

  /* ---------- compile rows into per-element tracks, enforcing the rules ---------- */
  const TRACKS = {};
  const ALL = [];
  let acc = 0;
  for (const B of BEATS) {
    B.start = acc; acc += B.dur;
    const local = {};
    for (const r of B.rows) {
      if (!BY[r.el]) throw new Error(`row ${r.id}: unknown element ${r.el}`);
      const R = { ...r, beat: B.id, start: B.start + r.at, end: B.start + r.at + r.dur };
      if (r.cue) {
        const parent = local[r.cue.replace("after:", "")];
        if (!parent) throw new Error(`row ${r.id}: cue ${r.cue} not found in ${B.id}`);
        if (R.start < parent.end - 1e-6) throw new Error(`row ${r.id}: starts at ${r.at}s, before ${parent.id} ends`);
      }
      local[r.id] = R; ALL.push(R);
      const T = TRACKS[r.el] || (TRACKS[r.el] = { state: [], slot: [] });
      if (isSlot(r.from) && isSlot(r.to)) T.slot.push({ ...R, from: r.from.slice(5), to: r.to.slice(5) });
      else if (isSlot(r.to)) {
        if (r.to.slice(5) !== BY[r.el].slot) throw new Error(`row ${r.id}: enters at ${r.to}, element home is ${BY[r.el].slot}`);
        T.state.push({ ...R, to: BY[r.el].base || "default" });
      } else T.state.push(R);
    }
  }
  const TOTAL = Math.round(acc * FPS);
  for (const id of Object.keys(TRACKS)) {
    for (const name of ["state", "slot"]) {
      const list = TRACKS[id][name].sort((a, b) => a.start - b.start);
      let cur = name === "slot" ? BY[id].slot : (BY[id].init || "default");
      for (const r of list) {
        if (r.from !== cur) throw new Error(`row ${r.id}: from "${r.from}" but ${id} is "${cur}" at ${r.start.toFixed(2)}s`);
        cur = r.to;
      }
    }
  }
  function track(el, name, t) {
    let cur = name === "slot" ? el.slot : (el.init || "default");
    for (const r of (TRACKS[el.id] || {})[name] || []) {
      if (t < r.start) break;
      if (t < r.end) return { from: r.from, to: r.to, p: spring(t - r.start, r.dur), row: r };
      cur = r.to;
    }
    return { from: cur, to: cur, p: 1, row: null };
  }
  /* Visual pair: an absent end shows the other end's look (presence handles the fade). */
  function vis(s) { return { a: s.from === "absent" ? s.to : s.from, b: s.to === "absent" ? s.from : s.to, p: s.p }; }
  const dimOf = s => { const v = vis(s); return (v.a === "dim" ? 1 - v.p : 0) + (v.b === "dim" ? v.p : 0); };

  /* ---------- per-frame element info: presence, inherited fade, position ---------- */
  let cache = {}; let T_NOW = 0;
  function own(el, t) {
    const s = track(el, "state", t);
    let o = 1;
    if (s.from === "absent" && s.to === "absent") o = 0;
    else if (s.from === "absent") {
      if (el.drawIn) o = t >= s.row.start ? 1 : 0;
      else if (el.quick) { const u = clamp01((t - s.row.start + 1 / FPS) / Math.max(1 / FPS, s.row.dur * 0.6)); o = 1 - Math.pow(1 - u, 3); }
      else o = s.p;
    } else if (s.to === "absent") o = s.row && s.row.dur === 0 ? 0 : 1 - s.p;
    const rise = el.rise === undefined ? ENTER_RISE : el.rise;
    const dy = s.from === "absent" && s.p < 1 && !el.drawIn && !el.quick ? rise * (1 - s.p) : 0;
    const cop = el.drawIn && s.from === "absent" && s.to !== "absent" ? s.p : o;   /* children of a drawing element fade in with it */
    return { s, o, dy, cop };
  }
  function lerpRect(A, B, p) { return { x: A.x + (B.x - A.x) * p, y: A.y + (B.y - A.y) * p, w: A.w + (B.w - A.w) * p, h: A.h + (B.h - A.h) * p }; }
  function info(id) {
    if (cache[id]) return cache[id];
    const el = BY[id]; const O = own(el, T_NOW);
    let op = O.o; let dy = O.dy; let cop = O.cop; let fade = 0;
    if (el.parent) { const P = info(el.parent); op *= P.cop; cop *= P.cop; dy += P.dy; }
    for (const src of el.dimWith || (el.parent ? [el.parent] : [])) { const S = info(src); fade = Math.max(fade, S.dimSelf, S.fade); }
    const sl = track(el, "slot", T_NOW);
    let rect = el.rect || null;
    if (el.slots) rect = lerpRect(el.slots[sl.from], el.slots[sl.to], sl.p);
    if (el.rel) { const P = info(el.parent); rect = { x: P.rect.x + el.rel.x, y: P.rect.y + el.rel.y, w: el.rel.w, h: el.rel.h }; }
    return (cache[id] = { el, s: O.s, op, cop, dy, fade, dimSelf: dimOf(O.s), sl, rect });
  }

  /* ---------- kinds: how each element draws a state (SVG string + text opacities) ---------- */
  function blend(s, draw) {
    const v = vis(s);
    if (v.a === v.b || v.p >= 1) return draw(v.p >= 1 ? v.b : v.a);
    return draw(v.a) + `<g opacity="${fx(v.p)}">${draw(v.b)}</g>`;
  }
  function mix(a, b, k) {
    const h = (c, i) => parseInt(c.slice(1 + 2 * i, 3 + 2 * i), 16);
    return "#" + [0, 1, 2].map(i => Math.round(h(a, i) + (h(b, i) - h(a, i)) * k).toString(16).padStart(2, "0")).join("");
  }
  function smallBadge(x, y, s) {
    const sw = Math.max(3, s * 5 / 64);
    return `<circle cx="${x + s / 2}" cy="${y + s / 2}" r="${s / 2 - sw / 2}" fill="${C.accent}" stroke="${C.ink}" stroke-width="${sw}"/>` +
      glyph("check", x + s * 0.19, y + s * 0.19, s * 0.62, C.ink);
  }
  const CARD = {
    dim: { fill: C.dimFill, stroke: C.dimStroke, sw: 3 }, default: { fill: C.card, stroke: C.graphite, sw: 4 },
    active: { fill: C.card, stroke: C.ink, sw: 6, band: true }, done: { fill: C.card, stroke: C.ink, sw: 6, check: true },
    approved: { fill: C.card, stroke: C.ink, sw: 6 }
  };
  function partial(pts, f) {
    const segs = []; let L = 0;
    for (let i = 1; i < pts.length; i += 1) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(l); L += l; }
    let rem = L * f; const out = [pts[0]];
    for (let i = 0; i < segs.length; i += 1) {
      if (rem >= segs[i]) { out.push(pts[i + 1]); rem -= segs[i]; continue; }
      const k = rem / segs[i]; out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]); break;
    }
    return { pts: out, len: L * f };
  }
  const KIND = {
    group: () => ({ svg: "" }),
    text: () => ({ svg: "" }),
    card(el, I) {
      const r = el.rect;
      const draw = st => {
        const S = CARD[st]; const rad = r.r || 24; const id = `cl-${el.id}-${st}`;
        let o = rrect(r.x, r.y, r.w, r.h, rad, S.fill);
        if (S.band) o += `<clipPath id="${id}">${rrect(r.x, r.y, r.w, r.h, rad, "#000")}</clipPath><rect x="${r.x}" y="${r.y}" width="20" height="${r.h}" fill="${C.accent}" clip-path="url(#${id})"/>`;
        o += rrect(r.x, r.y, r.w, r.h, rad, "none", S.stroke, S.sw);
        if (el.glyph) o += glyph(el.glyph.g, el.glyph.x, el.glyph.y, el.glyph.s, st === "dim" ? C.slate : C.ink);
        if (S.check && el.check) o += smallBadge(el.check.x, el.check.y, el.check.s);
        return o;
      };
      const col = mix(C.ink, C.slate, I.dimSelf);
      return { svg: blend(I.s, draw), texts: Object.fromEntries(Object.keys(el.texts || {}).map(k => [k, { color: col }])) };
    },
    chip(el, I) { const r = I.rect; return { svg: rrect(r.x, r.y, r.w, r.h, 16, C.card, C.graphite, 4) }; },
    bar(el, I) {
      const r = I.rect;
      return { svg: blend(I.s, st => st === "active" ? rrect(r.x, r.y, r.w, r.h, r.h / 2, C.accent, C.ink, 3) : rrect(r.x, r.y, r.w, r.h, r.h / 2, C.rule)) };
    },
    dot(el, I) { const r = I.rect; return { svg: `<circle cx="${r.x + r.w / 2}" cy="${r.y + r.h / 2}" r="${r.w / 2 - 1.5}" fill="${C.accent}" stroke="${C.ink}" stroke-width="3"/>` }; },
    line(el, I) {
      const s = I.s; const v = vis(s);
      const styleOf = st => st === "solid" ? el.solidStyle : st === "dashed" ? "manual" : el.style;
      const draw = (st, f) => {
        const P = partial(el.pts, f); const head = LINE[styleOf(st)].head;
        if (P.len < 2) return "";
        return drawLine({ style: styleOf(st), pts: P.pts, arrow: el.arrow && P.len > head + 4 });
      };
      if (s.from === "absent" && s.p < 1) return { svg: draw(v.b, s.p) };
      if (v.a === "dashed" && v.b === "solid") return { svg: draw("dashed", 1) + draw("solid", s.p) };
      const op = st => (st === "dim" ? LINE_DIM : 1);
      const k = op(v.a) + (op(v.b) - op(v.a)) * v.p; const st = v.b === "dim" ? v.a : v.b;
      return { svg: `<g opacity="${fx(k)}">${draw(st === "dim" ? el.style : st, 1)}</g>` };
    },
    person(el, I) {
      const r = el.rect;
      const draw = st => {
        if (st === "dim") return `<g opacity="0.6">${person(r.x, r.y, r.w, true)}</g>`;
        return person(r.x, r.y, r.w, false) + (st === "active" && el.check ? smallBadge(el.check.x, el.check.y, el.check.s) : "");
      };
      return { svg: blend(I.s, draw) };
    },
    fieldchips(el, I) {
      const sl = I.sl; const hidden = sl.from === el.slot && sl.to === el.slot;
      const p = sl.from === sl.to ? 1 : sl.p; const textOp = hidden ? 0 : clamp01((p - 0.55) / 0.45);
      let svg = ""; const texts = {};
      for (const it of el.items) {
        const r = lerpRect(it[sl.from], it[sl.to], p); const end = it.agent;
        if (!hidden) svg += rrect(r.x, r.y, r.w, r.h, Math.min(16, r.h / 2), C.accent, C.ink, r.h > 30 ? 4 : 3);
        texts[it.key] = { op: textOp, x: r.x + r.w / 2 - end.w / 2, y: r.y + r.h / 2 - end.h / 2 };
      }
      return { svg, texts };
    },
    swap(el, I) {
      const v = vis(I.s); const k = key => (key === v.a && key === v.b ? 1 : key === v.a ? 1 - v.p : key === v.b ? v.p : 0);
      let mult = 1;
      if (el.fadeOnParentSlot) {
        const P = info(el.parent).sl;
        if (P.to === el.fadeOnParentSlot) mult = P.from === P.to ? 0 : 1 - clamp01(P.p * 2);
      }
      let svg = ""; const r = I.rect;
      for (const key of el.bars || []) {
        const o = k(key) * mult;
        if (o > 0) svg += `<g opacity="${fx(o)}">${rrect(r.x + 16, r.y + 14, 134, 10, 5, C.rule)}${rrect(r.x + 16, r.y + 32, 86, 10, 5, C.rule)}</g>`;
      }
      return { svg, texts: Object.fromEntries(Object.keys(el.texts || {}).map(key => [key, { op: k(key) * mult }])) };
    },
    button(el, I) {
      const r = el.rect;
      const draw = st => st === "approved"
        ? rrect(r.x, r.y, r.w, r.h, r.h / 2, C.accent, C.ink, 4) + glyph("check", el.check.x, el.check.y, 40, C.ink)
        : rrect(r.x, r.y, r.w, r.h, r.h / 2, C.card, C.graphite, 4);
      return { svg: blend(I.s, draw) };
    },
    badge(el) { return { svg: badge(el.rect.x, el.rect.y) }; },
    panel(el, I) {
      const p = I.s.from === "absent" ? I.s.p : 1; const b = el.bars; const widths = [0.8, 0.6, 0.7];
      const svg = widths.map((w, i) => `<g opacity="${fx(clamp01(p * 3 - i))}">${rrect(b.x, b.y + i * 14, b.w * w, 8, 4, C.rule)}</g>`).join("");
      return { svg, texts: { label: { op: clamp01(p * 2) } } };
    },
    page(el, I) {
      const p = I.s.from === "absent" ? I.s.p : 1;
      const moved = I.sl.from !== el.slot || I.sl.to !== el.slot;
      /* keepHome: the source keeps its page; a copy travels. */
      const home = el.keepHome && moved ? KIND.pageAt(el.slots[el.slot], 1) : "";
      return { svg: home + KIND.pageAt(I.rect, p) };
    },
    pageAt(r, p) {
      const f = 16;
      const outline = `<path d="M${r.x + 2} ${r.y + 2} H${r.x + r.w - f} L${r.x + r.w - 2} ${r.y + f} V${r.y + r.h - 2} H${r.x + 2} Z" fill="${C.card}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>` +
        `<path d="M${r.x + r.w - f} ${r.y + 2} V${r.y + f} H${r.x + r.w - 2}" fill="none" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>`;
      const bars = [0.8, 0.6, 0.7].map((w, i) => `<g opacity="${fx(clamp01(p * 4 - 1 - i))}">${rrect(r.x + 12, r.y + 32 + i * 15, (r.w - 24) * w, 8, 4, C.graphite)}</g>`).join("");
      return `<g opacity="${fx(clamp01(p * 3))}">${outline}</g>` + bars;
    },
    pip(el, I) {
      const r = el.rect;
      const draw = st => `<circle cx="${r.x + r.w / 2}" cy="${r.y + r.h / 2}" r="${r.w / 2 - 1.5}" fill="${st === "done" ? C.accent : C.card}" stroke="${st === "done" ? C.ink : C.graphite}" stroke-width="3"/>`;
      return { svg: blend(I.s, draw) };
    },
    stage(el, I) {
      const r = el.rect;
      const tileOf = st => st === "done" ? rrect(r.x, r.y, 72, 72, 16, C.ink) + glyph("check", r.x + 16, r.y + 16, 40, C.card)
        : st === "active" ? rrect(r.x, r.y, 72, 72, 16, C.accent, C.ink, 4) + glyph(el.g, r.x + 16, r.y + 16, 40, C.ink)
          : rrect(r.x, r.y, 72, 72, 16, C.card, C.graphite, 4) + glyph(el.g, r.x + 16, r.y + 16, 40, C.ink);
      const pillOf = st => el.pill ? rrect(el.pill.x, el.pill.y, el.pill.w, el.pill.h, el.pill.h / 2, st === "active" ? C.accent : C.card, st === "active" ? C.ink : C.graphite, 4) : "";
      return { svg: blend(I.s, st => pillOf(st) + tileOf(st)) };
    },
    rail(el, I) { const r = el.rect; const p = I.s.from === "absent" ? I.s.p : 1; return { svg: p * r.w < 12 ? "" : rrect(r.x, r.y, r.w * p, r.h, 6, C.graphite) }; },
    window(el, I) {
      const r = el.rect; const p = I.s.from === "absent" ? I.s.p : 1; const w = r.w * p;
      let svg = w < 20 ? "" : rrect(r.x, r.y, w, r.h, 10, C.ink) + rrect(r.x + 4, r.y + 4, w - 8, r.h - 8, 6, C.accent);
      svg += `<g opacity="${fx(p)}">${el.ticks.map(k => rrect(k.x, k.y, k.w, k.h, 3, C.graphite)).join("")}</g>`;
      return { svg, texts: { w2: { op: clamp01(p * 1.5) }, w6: { op: clamp01(p * 1.5 - 0.5) } } };
    },
    ring(el, I) { const r = I.rect; return { svg: rrect(r.x, r.y, r.w, r.h, 22, "none", C.ink, 10) + rrect(r.x + 3, r.y + 3, r.w - 6, r.h - 6, 19, "none", C.accent, 4) }; },
    pill(el, I) { const r = el.rect; return { svg: blend(I.s, st => rrect(r.x, r.y, r.w, r.h, el.r || r.h / 2, st === "active" ? C.accent : C.card, st === "active" ? C.ink : C.graphite, 4)) }; },
    ctapath(el) {
      const R = el.rail; let svg = rrect(R.x, R.y, R.w, R.h, 6, C.graphite);
      for (const t of el.tiles) svg += t.live ? rrect(t.x, 903, 72, 72, 16, C.accent, C.ink, 4) + glyph(t.g, t.x + 16, 919, 40, C.ink)
        : rrect(t.x, 903, 72, 72, 16, C.card, C.graphite, 4) + glyph(t.g, t.x + 16, 919, 40, C.ink);
      return { svg };
    }
  };

  /* ---------- stage: two groups (message, graphics), each an SVG plus a text layer ---------- */
  const stage = document.getElementById("stage");
  stage.innerHTML = "";
  document.documentElement.style.background = C.bg; document.body.style.background = C.bg;
  Object.assign(stage.style, { width: FMT.w + "px", height: FMT.h + "px", background: C.bg });
  const GROUPS = {};
  for (const g of ["gfx", "msg"]) {
    const layer = document.createElement("div");
    Object.assign(layer.style, { position: "absolute", left: 0, top: 0, width: "1080px", height: "1350px", transformOrigin: "0 0", transform: FMT.place ? FMT.place[g] : "none" });
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    for (const [k, v] of Object.entries({ width: 1080, height: 1350, viewBox: "0 0 1080 1350" })) svg.setAttribute(k, v);
    Object.assign(svg.style, { position: "absolute", left: 0, top: 0, overflow: "visible" });
    layer.appendChild(svg); stage.appendChild(layer); GROUPS[g] = { layer, svg };
  }
  function makeText(spec) {
    const ts = TYPE[spec.st]; const d = document.createElement("div"); d.className = "t";
    Object.assign(d.style, { width: spec.w + "px", height: spec.h + "px", position: "absolute",
      font: `${ts.wt} ${ts.size}px/${ts.lh}px "Instrument Sans", "Helvetica Neue", Helvetica, Arial, sans-serif`,
      letterSpacing: ts.track + "em", color: C[spec.col], textAlign: spec.al || "left", opacity: 0 });
    for (const line of spec.lines) {
      const ln = document.createElement("div"); ln.className = "ln";
      const sp = document.createElement("span"); sp.textContent = line;
      const m = inkMetrics(ts, line);
      if ((spec.al || "left") === "left" && m.left > 0) ln.style.paddingLeft = Math.ceil(m.left) + "px";
      ln.appendChild(sp); d.appendChild(ln);
    }
    return d;
  }
  const TEXTS = {};
  for (const el of ELEMENTS) {
    if (!el.texts) continue;
    TEXTS[el.id] = {};
    for (const [k, spec] of Object.entries(el.texts)) {
      const node = makeText(spec); GROUPS[el.group || "gfx"].layer.appendChild(node); TEXTS[el.id][k] = { node, spec };
    }
  }
  for (const el of ELEMENTS.filter(e => e.kind === "fieldchips")) {
    TEXTS[el.id] = {};
    for (const it of el.items) {
      const spec = { lines: [it.label], st: "label", col: "ink", al: "center", x: it.agent.x, y: it.agent.y, w: it.agent.w, h: it.agent.h };
      const node = makeText(spec); GROUPS.gfx.layer.appendChild(node); TEXTS[el.id][it.key] = { node, spec };
    }
  }

  function seek(frame) {
    T_NOW = frame / FPS; cache = {};
    const out = { gfx: "", msg: "" }; const shown = {};
    for (const el of ELEMENTS) {
      const I = info(el.id); const kind = KIND[el.kind];
      if (!kind) throw new Error(`no kind ${el.kind}`);
      const opacity = I.op * (el.kind === "card" ? 1 : 1 - DIM_FADE * I.fade);
      const r = opacity > 0.001 ? kind(el, I) : null;
      if (r && r.svg) out[el.group || "gfx"] += `<g data-id="${el.id}" opacity="${fx(opacity)}"${I.dy ? ` transform="translate(0 ${fx(I.dy)})"` : ""}>${r.svg}</g>`;
      for (const [k, T] of Object.entries(TEXTS[el.id] || {})) {
        const o = r ? (r.texts && r.texts[k] && r.texts[k].op !== undefined ? r.texts[k].op : 1) * opacity : 0;
        const over = (r && r.texts && r.texts[k]) || {};
        const x = over.x !== undefined ? over.x : T.spec.rel ? I.rect.x + T.spec.x : T.spec.x;
        const y = (over.y !== undefined ? over.y : T.spec.rel ? I.rect.y + T.spec.y : T.spec.y) + I.dy;
        T.node.style.opacity = fx(o); T.node.style.left = fx(x) + "px"; T.node.style.top = fx(y) + "px";
        if (over.color) T.node.style.color = over.color;
        if (o > 0.001) shown[`${el.id}:${k}`] = o;
      }
    }
    GROUPS.gfx.svg.innerHTML = out.gfx; GROUPS.msg.svg.innerHTML = out.msg;
    return { t: T_NOW, settled: settled(frame), shown };
  }

  /* A frame is settled when no row with a duration is in progress. */
  function settled(frame) { const t = frame / FPS; return !ALL.some(r => r.dur > 0 && t > r.start + 1e-6 && t < r.end - 1e-6); }

  window.__v3 = { seek, settled, FPS, TOTAL, FMT, BEATS: BEATS.map(B => ({ id: B.id, start: B.start, dur: B.dur, f0: Math.round(B.start * FPS), f1: Math.round((B.start + B.dur) * FPS) })),
    HEADS, ELEMENTS, TEXTS, info: id => info(id), ROWS: ALL };
})();
