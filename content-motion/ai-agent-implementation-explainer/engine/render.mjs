// REUSE_CHECKED: none -- see beatgrid.js header for the search covering this
// engine/ folder; no existing Playwright + ffmpeg render harness anywhere in
// repos/ or web/eval.
//
// Engine: render harness. The only piece of this pipeline that is Node
// instead of browser JS. Talks to the page through the single seam
// engine/seek.js exposes (window.__seek(t)), so this file carries no
// per-scene knowledge either -- offer, resolution and mode are CLI flags.
//
// Modes:
//   --beats            one PNG per beat (QA pass, no video)
//   --frames           full render: N subframes per output frame, screenshot
//                       each, blend with ffmpeg tmix for motion blur, encode
//                       to MP4 at 60fps
//   --poster           single PNG of frame 0 (== last frame, since the scene
//                       loops)
//
// Usage:
//   node engine/render.mjs --beats  --w 1440 --h 1440 --out qa
//   node engine/render.mjs --frames --w 1440 --h 1440 --out out/1440.mp4
//   node engine/render.mjs --poster --w 1440 --h 1440 --out out/poster.png

import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, rm, readdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCENE_DIR = path.resolve(HERE, "..");
const FPS = 60;
const SUBFRAMES = 4;

function parseArgs(argv) {
  const args = { w: 1440, h: 1440, subframes: SUBFRAMES, fps: FPS };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--beats") args.mode = "beats";
    else if (a === "--frames") args.mode = "frames";
    else if (a === "--poster") args.mode = "poster";
    else if (a === "--w") args.w = parseInt(argv[++i], 10);
    else if (a === "--h") args.h = parseInt(argv[++i], 10);
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--subframes") args.subframes = parseInt(argv[++i], 10);
  }
  if (!args.mode) throw new Error("pass one of --beats, --frames, --poster");
  if (!args.out) throw new Error("pass --out <path>");
  return args;
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", ...opts });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function withPage(args, fn) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: args.w, height: args.h } });
  await page.goto(`file://${path.join(SCENE_DIR, "index.html")}?w=${args.w}&h=${args.h}`);
  await page.waitForFunction(() => window.__seekReady === true);
  try {
    await fn(page);
  } finally {
    await browser.close();
  }
}

async function seekAndShoot(page, t, outPath) {
  await page.evaluate((tt) => window.__seek(tt), t);
  await page.locator("#stage").screenshot({ path: outPath });
}

async function renderBeats(args) {
  await mkdir(args.out, { recursive: true });
  await withPage(args, async (page) => {
    const totalBeats = await page.evaluate(() => window.SCENE_TOTAL_BEATS);
    for (let b = 1; b <= totalBeats; b++) {
      const t = await page.evaluate((bb) => window.SCENE_BEAT_TIME(bb), b);
      const name = `beat-${String(b).padStart(2, "0")}.png`;
      await seekAndShoot(page, t, path.join(args.out, name));
      console.log(`beat ${b}/${totalBeats}  t=${t.toFixed(4)}s  -> ${name}`);
    }
  });
}

async function renderPoster(args) {
  await mkdir(path.dirname(args.out), { recursive: true });
  await withPage(args, async (page) => {
    await seekAndShoot(page, 0, args.out);
  });
  console.log(`poster -> ${args.out}`);
}

async function renderFrames(args) {
  const duration = 15.0;
  const totalFrames = Math.round(duration * args.fps); // 900 at 60fps/15s
  const tmp = await mkdtemp(path.join(os.tmpdir(), "cro6814-frames-"));
  console.log(`rendering ${totalFrames} frames x ${args.subframes} subframes into ${tmp}`);

  await withPage(args, async (page) => {
    for (let k = 0; k < totalFrames; k++) {
      for (let m = 0; m < args.subframes; m++) {
        const t = (k + m / args.subframes) / args.fps;
        const name = `f${String(k).padStart(5, "0")}_s${m}.png`;
        await seekAndShoot(page, t, path.join(tmp, name));
      }
      if (k % 60 === 0) console.log(`frame ${k}/${totalFrames}`);
    }
  });

  await mkdir(path.dirname(args.out), { recursive: true });

  // Blend each frame's 4 subframes with ffmpeg tmix (motion blur), then
  // downsample to 60fps. The subframe filenames are f{frame}_s{sub}.png, not
  // a single incrementing index, so build an explicit concat list ffmpeg can
  // read in order instead of relying on a printf pattern.
  const files = (await readdir(tmp)).sort();
  const listPath = path.join(tmp, "concat.txt");
  const { writeFile } = await import("node:fs/promises");
  await writeFile(listPath, files.map((f) => `file '${path.join(tmp, f)}'`).join("\n"));

  await run("ffmpeg", [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-r",
    String(args.fps * args.subframes),
    "-i",
    listPath,
    "-vf",
    `tmix=frames=${args.subframes}:weights=1 1 1 1,fps=${args.fps}`,
    "-pix_fmt",
    "yuv420p",
    "-c:v",
    "libx264",
    "-crf",
    "16",
    "-an",
    args.out,
  ]);

  await rm(tmp, { recursive: true, force: true });
  console.log(`rendered -> ${args.out}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.mode === "beats") await renderBeats(args);
  else if (args.mode === "poster") await renderPoster(args);
  else if (args.mode === "frames") await renderFrames(args);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
