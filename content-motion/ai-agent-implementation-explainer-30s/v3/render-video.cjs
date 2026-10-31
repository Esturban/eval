/* REUSE_CHECKED: /Users/EVA/Desktop/eva/03_development/_dev/web/eval/content-motion/ai-agent-implementation-explainer-30s/v2/render-video.cjs
   Copied and adapted (v2 stays untouched): same Playwright seek-and-pipe-to-ffmpeg shell, same ffprobe, faststart,
   hold and 9:16 ink-bound checks. The still comparison is replaced by a live layout check (checks.js), since
   v3 has no approved stills.

   CMO-8464: renders the v3 explainer as silent H.264 MP4s in 4:5 and 9:16.
   Opens ../index.html for the palette, font and drawing helpers, injects beats.js (data), interaction.js
   (the one Interaction component) and checks.js, seeks every frame and pipes PNG screenshots into ffmpeg.
   Usage: node render-video.cjs                (both formats)
          node render-video.cjs only=4x5       (one format)
          node render-video.cjs preview=120,300 out=/some/dir   (PNG stills only, both formats, no video) */
const path = require("path");
const fs = require("fs");
const { once } = require("events");
const { spawn, execFileSync } = require("child_process");
const { chromium } = require("/Users/EVA/Desktop/eva/03_development/_dev/web/shop-benchmark/node_modules/playwright");

const DIR = __dirname;
const SCENE = path.join(DIR, "..", "index.html");
const FRAMES = path.join(DIR, "frames");
const SHELL = "/Users/EVA/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const FONT = "/Users/EVA/Library/Fonts/InstrumentSans-1.ttf";
const SHEET_BG = "#d6d1c7";
const MIN_HOLD_FRAMES = 45;           /* 1.5 s at 30 fps */
const DURATION = { min: 30, max: 45 };
const MIN_LABEL_9X16 = 46;            /* px, smallest text after the 9:16 scale */
const SAFE_9X16 = { x0: 120, x1: 960, y0: 250, y1: 1500 };
const MAX_GAP_9X16 = 160;
/* 9:16 recomposition: the 4:5 art scaled 0.97 (the largest that keeps x 108 to 972 inside x 120 to 960), centred
   horizontally, message and stage separated by GAP and the whole stack centred between y 250 and y 1500.
   The stage does not move between beats, so one placement serves every beat. */
function place916() {
  const s = 0.97; const GAP = 8; const artTop = 135; const artBottom = 1084;
  const tx = (1080 - 864 * s) / 2 - 108 * s;
  const top = SAFE_9X16.y0 + (SAFE_9X16.y1 - SAFE_9X16.y0 - ((artBottom - artTop) * s + GAP)) / 2;
  const msgTy = top - artTop * s; const gfxTy = top + GAP - artTop * s;
  return { s, msgTy, gfxTy, place: { msg: `translate(${tx}px, ${msgTy}px) scale(${s})`, gfx: `translate(${tx}px, ${gfxTy}px) scale(${s})` } };
}
const P916 = place916();
const FORMATS = {
  "4x5": { name: "4x5", w: 1080, h: 1350, s: 1 },
  "9x16": { name: "9x16", w: 1080, h: 1920, s: P916.s, place: P916.place }
};

const args = Object.fromEntries(process.argv.slice(2).map(a => a.split("=")));
const lines = [];
const log = s => { lines.push(s); console.log(s); };
const fail = s => { log(s + " FAIL"); process.exitCode = 1; };
const pass = (ok, s) => (ok ? log(s + " PASS") : fail(s));
const run = (cmd, a) => execFileSync(cmd, a, { encoding: "utf8" }).trim();

async function openScene(browser, fmt) {
  const page = await browser.newPage({ viewport: { width: fmt.w, height: fmt.h }, deviceScaleFactor: 1 });
  await page.goto("file://" + SCENE + "?beat=1");
  await page.waitForFunction(() => window.__report);
  await page.addScriptTag({ content: `window.__FMT = ${JSON.stringify(fmt)};` });
  for (const f of ["beats.js", "interaction.js", "checks.js"]) await page.addScriptTag({ path: path.join(DIR, f) });
  await page.waitForFunction(() => window.__v3 && window.__v3check);
  return page;
}
const shot = page => page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 1080, height: page.viewportSize().height } });
/* One settled frame per beat: 4 frames before the beat ends (the last beat: before the video ends). */
const contactFrames = v => v.BEATS.map(B => B.f1 - 4);

async function structuralChecks(page, fmt, v) {
  for (const f of contactFrames(v)) {
    const r = await page.evaluate(n => window.__v3check(n), f);
    const B = v.BEATS.find(b => f >= b.f0 && f < b.f1);
    if (fmt.name === "4x5") {
      pass(r.settled && r.fails.length === 0, `4x5 ${B.id} frame ${f}: settled ${r.settled}, ${r.texts} text blocks, ${r.shapes} shapes, layout faults ${r.fails.length}`);
      r.fails.forEach(x => log(`  ${x}`));
    } else {
      const label = r.minText * fmt.s;
      pass(label >= MIN_LABEL_9X16, `9x16 ${B.id}: smallest text ${r.minText} px x ${fmt.s} = ${label.toFixed(1)} px (min ${MIN_LABEL_9X16})`);
      const g = await page.evaluate(n => {
        const V = window.__v3; V.seek(n); let msgB = 0; let diaT = Infinity;
        for (const el of V.ELEMENTS) {
          const I = V.info(el.id); if (I.op < 0.99) continue;
          for (const T of Object.values(V.TEXTS[el.id] || {})) if (Number(T.node.style.opacity) > 0.99 && (el.group === "msg")) msgB = Math.max(msgB, parseFloat(T.node.style.top) + T.spec.h);
          if (el.group === "msg" && I.rect) msgB = Math.max(msgB, I.rect.y + I.rect.h);
          if (el.group !== "msg" && I.rect && !el.id.startsWith("pip-") && el.kind !== "group") diaT = Math.min(diaT, I.rect.y);
          if (el.kind === "ctapath") diaT = Math.min(diaT, 903);
        }
        return { msgB, diaT };
      }, f);
      const msgY = P916.msgTy + g.msgB * fmt.s; const diaY = P916.gfxTy + g.diaT * fmt.s; const gap = diaY - msgY;
      pass(gap >= 0 && gap <= MAX_GAP_9X16, `9x16 ${B.id} stack: message ends y ${msgY.toFixed(0)}, stage starts y ${diaY.toFixed(0)}, gap ${gap.toFixed(0)} (max ${MAX_GAP_9X16})`);
    }
  }
  /* Seam: the incoming headline is visible on the beat's first frame and the outgoing one is gone. */
  for (let i = 1; i < v.BEATS.length; i += 1) {
    const B = v.BEATS[i]; const prev = v.BEATS[i - 1];
    const shown = await page.evaluate(n => window.__v3.seek(n).shown, B.f0);
    const inc = shown[`${v.HEADS[B.id]}:main`] || 0; const out = shown[`${v.HEADS[prev.id]}:main`] || 0;
    pass(inc > 0.2 && out === 0, `${fmt.name} seam ${prev.id} to ${B.id} frame ${B.f0}: incoming headline opacity ${inc.toFixed(2)}, outgoing ${out.toFixed(2)}`);
  }
  /* CTA swap inside B6: the timeline headline is gone before the offer name shows. */
  const B6 = v.BEATS[v.BEATS.length - 1]; const swapF = B6.f0 + 180;
  const s6 = await page.evaluate(n => window.__v3.seek(n).shown, swapF);
  pass(!s6["m6-head:main"] && (s6["cta-offer-name:main"] || 0) > 0, `${fmt.name} B6 swap frame ${swapF}: timeline headline gone, offer name ${(s6["cta-offer-name:main"] || 0).toFixed(2)}`);
}

async function renderFormat(browser, fmt) {
  const page = await openScene(browser, fmt);
  const v = await page.evaluate(() => ({ TOTAL: window.__v3.TOTAL, FPS: window.__v3.FPS, BEATS: window.__v3.BEATS, HEADS: window.__v3.HEADS }));
  await structuralChecks(page, fmt, v);
  const out = path.join(DIR, `explainer-${fmt.name}.mp4`);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(v.FPS), "-c:v", "png", "-i", "-",
    "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-tune", "animation", "-pix_fmt", "yuv420p", "-profile:v", "high",
    "-r", String(v.FPS), "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
  const settled = [];
  for (let f = 0; f < v.TOTAL; f += 1) {
    const r = await page.evaluate(n => window.__v3.seek(n), f);
    settled.push(r.settled);
    const buf = await shot(page);
    if (!ff.stdin.write(buf)) await once(ff.stdin, "drain");
  }
  ff.stdin.end();
  const [code] = await once(ff, "close");
  if (code !== 0) throw new Error(`ffmpeg exited ${code} for ${fmt.name}`);
  await page.close();
  /* Static hold per beat: consecutive settled frames ending on the beat's last frame. */
  for (const B of v.BEATS) {
    let f = B.f1 - 1; let hold = 0;
    while (f >= B.f0 && settled[f]) { hold += 1; f -= 1; }
    pass(hold >= MIN_HOLD_FRAMES, `${fmt.name} ${B.id}: ${B.dur.toFixed(1)} s, static hold ${hold} frames (${(hold / v.FPS).toFixed(2)} s)`);
  }
  return { out, contact: contactFrames(v) };
}

function extractFrames(mp4, contact, name) {
  return contact.map((f, i) => {
    const file = path.join(FRAMES, `beat-${i + 1}-${name}.png`);
    run("ffmpeg", ["-y", "-loglevel", "error", "-i", mp4, "-vf", `select=eq(n\\,${f})`, "-fps_mode", "vfr", "-frames:v", "1", file]);
    return file;
  });
}

function probe(mp4) {
  const json = JSON.parse(run("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type,codec_name,width,height,pix_fmt,r_frame_rate", "-of", "json", mp4]));
  const vids = json.streams.filter(s => s.codec_type === "video"); const auds = json.streams.filter(s => s.codec_type === "audio");
  const d = Number(json.format.duration);
  const ok = d >= DURATION.min && d <= DURATION.max && auds.length === 0 && vids.length === 1 && vids[0].codec_name === "h264" && vids[0].pix_fmt === "yuv420p" && vids[0].r_frame_rate === "30/1";
  pass(ok, `${path.basename(mp4)}: duration ${d.toFixed(3)} s, ${vids[0].width}x${vids[0].height}, ${vids[0].codec_name} ${vids[0].pix_fmt} ${vids[0].r_frame_rate}, audio streams ${auds.length}`);
  const head = fs.readFileSync(mp4).subarray(0, 64 * 1024).toString("latin1");
  const fast = head.indexOf("moov") > -1 && head.indexOf("moov") < (head.indexOf("mdat") === -1 ? Infinity : head.indexOf("mdat"));
  pass(fast, `${path.basename(mp4)}: faststart (moov before mdat)`);
}

function inkBounds916(files) {
  files.forEach((file, i) => {
    const [w, h, x, y] = run("magick", [file, "-fuzz", "3%", "-trim", "-format", "%w %h %X %Y", "info:"]).split(" ").map(Number);
    const b = { x0: x, x1: x + w, y0: y, y1: y + h };
    const ok = b.x0 >= SAFE_9X16.x0 && b.x1 <= SAFE_9X16.x1 && b.y0 >= SAFE_9X16.y0 && b.y1 <= SAFE_9X16.y1;
    pass(ok, `9x16 beat ${i + 1} ink bounds x ${b.x0} to ${b.x1} (margins ${b.x0}/${1080 - b.x1}), y ${b.y0} to ${b.y1}`);
  });
}

function proseCheck() {
  const bad = new RegExp(`${String.fromCharCode(8212)}|-{2}`);
  for (const f of ["README.md", "check-output.txt"]) {
    const p = path.join(DIR, f);
    if (!fs.existsSync(p)) continue;
    const hit = fs.readFileSync(p, "utf8").split("\n").findIndex(l => bad.test(l));
    pass(hit === -1, `prose ${f}: no em dash and no double hyphen${hit === -1 ? "" : ` (line ${hit + 1})`}`);
  }
}

async function preview(browser) {
  const outDir = args.out || path.join(DIR, "frames");
  fs.mkdirSync(outDir, { recursive: true });
  for (const fmt of Object.values(FORMATS).filter(f => !args.only || f.name === args.only)) {
    const page = await openScene(browser, fmt);
    for (const f of args.preview.split(",").map(Number)) {
      const r = await page.evaluate(n => window.__v3check(n), f);
      fs.writeFileSync(path.join(outDir, `preview-${fmt.name}-${f}.png`), await shot(page));
      console.log(`${fmt.name} ${f}: settled ${r.settled} faults ${r.fails.length}${r.fails.length ? "\n  " + r.fails.join("\n  ") : ""}`);
    }
    await page.close();
  }
}

(async () => {
  const browser = await chromium.launch({ executablePath: SHELL });
  if (args.preview) { await preview(browser); await browser.close(); return; }
  fs.mkdirSync(FRAMES, { recursive: true });
  for (const fmt of Object.values(FORMATS).filter(f => !args.only || f.name === args.only)) {
    const { out, contact } = await renderFormat(browser, fmt);
    probe(out);
    const files = extractFrames(out, contact, fmt.name);
    if (fmt.name === "4x5") {
      run("magick", ["montage", ...files, "+set", "label", "-font", FONT, "-tile", "3x2", "-geometry", "1080x1350+0+0", "-background", SHEET_BG, path.join(FRAMES, "contact-sheet-4x5.png")]);
      run("magick", ["montage", ...files, "+set", "label", "-font", FONT, "-resize", "360x450", "-tile", "3x2", "-geometry", "360x450+8+8", "-background", SHEET_BG, path.join(FRAMES, "contact-sheet-4x5-phone-360.png")]);
    } else {
      inkBounds916(files);
      run("magick", ["montage", ...files, "+set", "label", "-font", FONT, "-resize", "360x640", "-tile", "3x2", "-geometry", "360x640+8+8", "-background", SHEET_BG, path.join(FRAMES, "contact-sheet-9x16-phone-360.png")]);
    }
  }
  await browser.close();
  proseCheck();
  log(process.exitCode ? "CHECKS FAILED" : "ALL CHECKS PASS");
  fs.writeFileSync(path.join(DIR, args.only ? `check-output-${args.only}.txt` : "check-output.txt"), lines.join("\n") + "\n");
})().catch(e => { console.error(e); process.exit(1); });
