/* REUSE_CHECKED: /Users/EVA/Desktop/eva/03_development/_dev/web/eval/content-motion/ai-agent-implementation-explainer-30s/index.html
   Its check() validates the static stills' BEATS blocks; v3 has no stills, so this applies the same rules
   (text fits its box, safe zone, no collisions) to the live Interaction stage at a given frame.

   CMO-8464 layout check, run on settled frames of the 4:5 render (art coordinates). */
(() => {
  const SAFE = { x0: 108, x1: 972, y0: 135, y1: 1084 };
  const SOLID = new Set(["card", "chip", "person", "badge", "pill", "button", "page", "stage", "pip"]);
  const inter = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const contains = (o, i) => i.x >= o.x - 0.5 && i.y >= o.y - 0.5 && i.x + i.w <= o.x + o.w + 0.5 && i.y + i.h <= o.y + o.h + 0.5;
  const inSafe = b => b.x >= SAFE.x0 - 0.5 && b.x + b.w <= SAFE.x1 + 0.5 && b.y >= SAFE.y0 - 0.5 && b.y + b.h <= SAFE.y1 + 0.5;
  function lineBoxOf(el) {
    /* Padded across the line only (half the casing or arrowhead width), not along it. */
    const xs = el.pts.map(p => p[0]); const ys = el.pts.map(p => p[1]); const pad = 12;
    const px = xs[0] === xs[xs.length - 1] ? pad : 0; const py = ys[0] === ys[ys.length - 1] ? pad : 0;
    return { x: Math.min(...xs) - px, y: Math.min(...ys) - py, w: Math.max(...xs) - Math.min(...xs) + 2 * px, h: Math.max(...ys) - Math.min(...ys) + 2 * py };
  }

  window.__v3check = frame => {
    const V = window.__v3; const res = V.seek(frame); const fails = []; const texts = []; const shapes = []; const lines = [];
    for (const el of V.ELEMENTS) {
      const I = V.info(el.id);
      if (I.op < 0.99) continue;
      if (SOLID.has(el.kind) && I.rect) shapes.push({ id: el.id, box: I.rect, el });
      if (el.kind === "line") lines.push({ id: el.id, box: lineBoxOf(el) });
      for (const [k, T] of Object.entries(V.TEXTS[el.id] || {})) {
        if (Number(T.node.style.opacity) < 0.99) continue;
        const box = { x: parseFloat(T.node.style.left), y: parseFloat(T.node.style.top), w: T.spec.w, h: T.spec.h };
        /* Glyph ink of every line must sit inside the box (canvas metrics placed at the span's origin). */
        const lns = [...T.node.querySelectorAll(".ln")]; const ts = TYPE[T.spec.st]; const nodeX = T.node.getBoundingClientRect().left;
        lns.forEach((ln, i) => {
          const sp = ln.querySelector("span").getBoundingClientRect(); const m = inkMetrics(ts, T.spec.lines[i]);
          const x0 = sp.left - nodeX - m.left; const x1 = sp.left - nodeX + m.right;
          if (x0 < -0.5 || x1 > T.spec.w + 0.5) fails.push(`overflow: ${el.id}:${k} "${T.spec.lines[i]}" ink ${x0.toFixed(1)} to ${x1.toFixed(1)} outside box w ${T.spec.w}`);
        });
        const lineSum = lns.reduce((a, ln) => a + ln.getBoundingClientRect().height, 0);
        if (lineSum > T.spec.h + 0.5) fails.push(`overflow: ${el.id}:${k} line boxes ${lineSum} > box h ${T.spec.h}`);
        if (!inSafe(box)) fails.push(`safe-zone: text ${el.id}:${k} ${JSON.stringify(box)}`);
        texts.push({ id: `${el.id}:${k}`, owner: el.id, box, size: TYPE[T.spec.st].size });
      }
    }
    for (const s of shapes) if (!inSafe(s.box)) fails.push(`safe-zone: ${s.id} ${JSON.stringify(s.box)}`);
    for (let i = 0; i < texts.length; i += 1) for (let j = i + 1; j < texts.length; j += 1) {
      if (inter(texts[i].box, texts[j].box) > 0.5) fails.push(`collision: text ${texts[i].id} x text ${texts[j].id}`);
    }
    for (const t of texts) {
      for (const s of shapes) if (inter(t.box, s.box) > 0.5 && !contains(s.box, t.box)) fails.push(`collision: text ${t.id} x ${s.id}`);
      for (const l of lines) if (inter(t.box, l.box) > 0.5) fails.push(`collision: text ${t.id} x line ${l.id}`);
    }
    for (let i = 0; i < shapes.length; i += 1) for (let j = i + 1; j < shapes.length; j += 1) {
      const A = shapes[i].box; const B = shapes[j].box;
      if (inter(A, B) > 0.5 && !contains(A, B) && !contains(B, A)) fails.push(`collision: ${shapes[i].id} x ${shapes[j].id}`);
    }
    return { frame, settled: res.settled, texts: texts.length, shapes: shapes.length, minText: Math.min(...texts.map(t => t.size)), fails };
  };
})();
