/* REUSE_CHECKED: /Users/EVA/Desktop/eva/03_development/_dev/web/eval/content-motion/ai-agent-implementation-explainer-30s/render.cjs
   extended in spirit (same Playwright shell, same ImageMagick checks), kept as a separate file because the
   ticket forbids editing the approved stills folder. The rejected cut's engine/render.mjs is not used (DESIGN.md rule 12).

   CMO-8460: renders the 30 s explainer as silent H.264 MP4s in 4:5 and 9:16.
   Deterministic: opens ../index.html (the approved stills page), injects motion.js, seeks every frame,
   pipes PNG screenshots into ffmpeg. Then extracts one settled frame per beat FROM THE MP4 for the contact sheets.
   Usage: node render-video.cjs            (both formats)
          node render-video.cjs --only 4x5 (one format) */
const path = require("path");
const fs = require("fs");
const os = require("os");
const { once } = require("events");
const { spawn, execFileSync, spawnSync } = require("child_process");
const { chromium } = require("/Users/EVA/Desktop/eva/03_development/_dev/web/shop-benchmark/node_modules/playwright");

const DIR = __dirname;
const SCENE = path.join(DIR, "..", "index.html");
const STILLS = path.join(DIR, "..", "stills");
const FRAMES = path.join(DIR, "frames");
const SHELL = "/Users/EVA/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const FONT = "/Users/EVA/Library/Fonts/InstrumentSans-1.ttf";
const SHEET_BG = "#d6d1c7";
const MIN_HOLD_FRAMES = 45; /* 1.5 s at 30 fps */
/* 9:16 recomposition (see placement() in motion.js): art scaled 0.97, the largest that keeps the full-width
   diagrams inside x 120 to 960 (equal side margins, clear of the action rail); message block and diagram
   stacked 150 px apart and centred between the top UI (y 250) and the bottom caption zone (y 1500). */
const FORMATS = {
  "4x5": { name: "4x5", w: 1080, h: 1350, dx: 0, headDy: 0, gfxDy: 0 },
  "9x16": { name: "9x16", w: 1080, h: 1920, scale: 0.97, gap: 150, bandTop: 250, bandBottom: 1500 }
};
/* Where ink may sit in a settled 9:16 frame: below the top UI, above the bottom caption band, inside the rail. */
const SAFE_9X16 = { x0: 120, x1: 960, y0: 250, y1: 1500 };
const MAX_GAP_9X16 = 160;

const lines = [];
const log = s => { lines.push(s); console.log(s); };
const run = (cmd, args) => execFileSync(cmd, args, { encoding: "utf8" }).trim();
function compare(metric, a, b, fuzz) {
  const r = spawnSync("magick", ["compare", ...(fuzz ? ["-fuzz", fuzz] : []), "-metric", metric, a, b, "null:"], { encoding: "utf8" });
  return r.stderr.trim().split(" ")[0];
}

async function openScene(browser, fmt) {
  const page = await browser.newPage({ viewport: { width: fmt.w, height: fmt.h }, deviceScaleFactor: 1 });
  await page.goto("file://" + SCENE + "?beat=1");
  await page.waitForFunction(() => window.__report);
  await page.addScriptTag({ content: `window.__FMT = ${JSON.stringify(fmt)};` });
  await page.addScriptTag({ path: path.join(DIR, "motion.js") });
  await page.waitForFunction(() => window.__v2);
  return page;
}

/* One settled frame per beat: a few frames before its exit (the final beat: before its end). */
function contactFrames(v) {
  return v.START.map((s, i) => s + v.DUR[i] - (i < v.START.length - 1 ? v.EXIT : 0) - 4);
}

async function renderFormat(browser, fmt, tmp) {
  const page = await openScene(browser, fmt);
  const v = await page.evaluate(() => ({ TOTAL: window.__v2.TOTAL, START: window.__v2.START, DUR: window.__v2.DUR, EXIT: window.__v2.EXIT, FPS: window.__v2.FPS }));
  for (const L of await page.evaluate(() => window.__v2.LAYOUT)) {
    const gap = L.diaTop - L.msgBottom; const ok = gap <= MAX_GAP_9X16;
    log(`${fmt.name} beat ${L.beat} stack: message y ${L.msgTop.toFixed(0)} to ${L.msgBottom.toFixed(0)}, gap ${gap.toFixed(0)}, diagram y ${L.diaTop.toFixed(0)} to ${L.diaBottom.toFixed(0)} ${ok ? "PASS" : "FAIL"}`);
    if (!ok) process.exitCode = 1;
  }
  const out = path.join(DIR, `explainer-${fmt.name}.mp4`);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(v.FPS), "-c:v", "png", "-i", "-",
    "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-tune", "animation", "-pix_fmt", "yuv420p", "-profile:v", "high",
    "-r", String(v.FPS), "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
  const contact = contactFrames(v);
  const settled = [];
  for (let f = 0; f < v.TOTAL; f += 1) {
    const r = await page.evaluate(n => window.__v2.seek(n), f);
    settled.push(r.settled);
    const buf = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: fmt.w, height: fmt.h } });
    if (fmt.name === "4x5" && contact.includes(f)) fs.writeFileSync(path.join(tmp, `html-beat-${contact.indexOf(f) + 1}.png`), buf);
    if (!ff.stdin.write(buf)) await once(ff.stdin, "drain");
  }
  ff.stdin.end();
  const [code] = await once(ff, "close");
  if (code !== 0) throw new Error(`ffmpeg exited ${code} for ${fmt.name}`);
  await page.close();
  /* Settled hold per beat: consecutive fully settled frames ending where the exit starts. */
  v.START.forEach((s, i) => {
    let f = s + v.DUR[i] - (i < v.START.length - 1 ? v.EXIT : 0) - 1; let hold = 0;
    while (f >= s && settled[f]) { hold += 1; f -= 1; }
    const ok = hold >= MIN_HOLD_FRAMES;
    log(`${fmt.name} beat ${i + 1}: ${(v.DUR[i] / v.FPS).toFixed(2)} s, settled hold ${hold} frames (${(hold / v.FPS).toFixed(2)} s) ${ok ? "PASS" : "FAIL"}`);
    if (!ok) process.exitCode = 1;
  });
  return { out, v, contact };
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
  const ok = d >= 28 && d <= 32 && auds.length === 0 && vids.length === 1 && vids[0].codec_name === "h264" && vids[0].pix_fmt === "yuv420p" && vids[0].r_frame_rate === "30/1";
  log(`${path.basename(mp4)}: duration ${d.toFixed(3)} s, ${vids[0].width}x${vids[0].height}, ${vids[0].codec_name} ${vids[0].pix_fmt} ${vids[0].r_frame_rate}, audio streams ${auds.length} ${ok ? "PASS" : "FAIL"}`);
  if (!ok) process.exitCode = 1;
  const head = fs.readFileSync(mp4).subarray(0, 64 * 1024).toString("latin1");
  const fast = head.indexOf("moov") > -1 && head.indexOf("moov") < (head.indexOf("mdat") === -1 ? Infinity : head.indexOf("mdat"));
  log(`${path.basename(mp4)}: faststart (moov before mdat) ${fast ? "PASS" : "FAIL"}`);
  if (!fast) process.exitCode = 1;
}

(async () => {
  const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
  const fmts = Object.values(FORMATS).filter(f => !only || f.name === only);
  fs.mkdirSync(FRAMES, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cmo8460-"));
  const browser = await chromium.launch({ executablePath: SHELL });
  for (const fmt of fmts) {
    const { out, contact } = await renderFormat(browser, fmt, tmp);
    probe(out);
    const files = extractFrames(out, contact, fmt.name);
    if (fmt.name === "4x5") {
      /* The settled 4:5 frame must be the approved still: the HTML frame within antialiasing
         (fewer than 20 px off by more than 2 percent), the MP4 frame within H.264 yuv420p loss (PSNR >= 38 dB). */
      files.forEach((file, i) => {
        const still = path.join(STILLS, `beat-${i + 1}.png`);
        const ae = compare("AE", path.join(tmp, `html-beat-${i + 1}.png`), still, "2%");
        const psnr = compare("PSNR", file, still);
        const ok = Number(ae) < 20 && (psnr === "inf" || Number(psnr) >= 38);
        log(`4x5 beat ${i + 1} settled frame ${contact[i]}: HTML vs approved still px off by >2% ${ae}; MP4 frame vs still PSNR ${psnr} dB ${ok ? "PASS" : "FAIL"}`);
        if (!ok) process.exitCode = 1;
      });
      run("magick", ["montage", ...files, "+set", "label", "-font", FONT, "-tile", "4x2", "-geometry", "1080x1350+0+0", "-background", SHEET_BG, path.join(FRAMES, "contact-sheet-v2.png")]);
      run("magick", ["montage", ...files, "+set", "label", "-font", FONT, "-resize", "360x450", "-tile", "4x2", "-geometry", "360x450+8+8", "-background", SHEET_BG, path.join(FRAMES, "contact-sheet-v2-phone-360.png")]);
    } else {
      files.forEach((file, i) => {
        const [w, h, x, y] = run("magick", [file, "-fuzz", "3%", "-trim", "-format", "%w %h %X %Y", "info:"]).split(" ").map(Number);
        const b = { x0: x, x1: x + w, y0: y, y1: y + h };
        const ok = b.x0 >= SAFE_9X16.x0 && b.x1 <= SAFE_9X16.x1 && b.y0 >= SAFE_9X16.y0 && b.y1 <= SAFE_9X16.y1;
        log(`9x16 beat ${i + 1} ink bounds x ${b.x0} to ${b.x1} (margins ${b.x0}/${fmt.w - b.x1}), y ${b.y0} to ${b.y1} ${ok ? "PASS" : "FAIL"}`);
        if (!ok) process.exitCode = 1;
      });
      run("magick", ["montage", ...files, "+set", "label", "-font", FONT, "-resize", "360x640", "-tile", "4x2", "-geometry", "360x640+8+8", "-background", SHEET_BG, path.join(FRAMES, "contact-sheet-v2-9x16-phone-360.png")]);
    }
  }
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  log(process.exitCode ? "CHECKS FAILED" : "ALL CHECKS PASS");
  fs.writeFileSync(path.join(DIR, only ? `check-output-${only}.txt` : "check-output.txt"), lines.join("\n") + "\n");
})().catch(e => { console.error(e); process.exit(1); });
