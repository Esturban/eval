/* Renders the 8 stills at 1080x1350 (device scale 1), runs the in-page checks,
   checks the rendered pixels outside the safe zone, then builds the contact sheets.
   Usage: node render.cjs */
const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");
const { chromium } = require("/Users/EVA/Desktop/eva/03_development/_dev/web/shop-benchmark/node_modules/playwright");

const DIR = __dirname;
const OUT = path.join(DIR, "stills");
const SHELL = "/Users/EVA/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const BG = "#F7F4EE";
const BEAT_COUNT = 8;
/* Regions that must be pure background: outside the 10 percent safe zone, plus the y >= 1084 platform band. */
const MARGINS = [
  ["left x<108", "108x1350+0+0"],
  ["right x>=972", "108x1350+972+0"],
  ["top y<135", "1080x135+0+0"],
  ["bottom y>=1084", "1080x266+0+1084"]
];

function magick(args) { return execFileSync("magick", args, { encoding: "utf8" }).trim(); }
function nonBgPixels(file, geom) {
  /* Paint every pixel that is not exactly the background white, everything else black, then count white. */
  const out = magick([file, "-crop", geom, "+repage", "-alpha", "off", "-fill", "white", "+opaque", BG, "-fill", "black", "-opaque", BG, "-colorspace", "gray", "-format", "%[fx:mean*w*h]", "info:"]);
  return Math.round(Number(out));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: SHELL });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  const lines = []; let failCount = 0;
  const log = s => { lines.push(s); console.log(s); };
  for (let n = 1; n <= BEAT_COUNT; n += 1) {
    await page.goto("file://" + path.join(DIR, "index.html") + "?beat=" + n);
    await page.waitForFunction(() => window.__report);
    const r = await page.evaluate(() => window.__report);
    const file = path.join(OUT, `beat-${n}.png`);
    await page.locator("#stage").screenshot({ path: file });
    const size = magick(["identify", "-format", "%wx%h", file]);
    if (size !== "1080x1350") r.fails.push(`size: ${size}`);
    const px = MARGINS.map(([name, g]) => [name, nonBgPixels(file, g)]);
    for (const [name, c] of px) if (c > 0) r.fails.push(`pixels: ${c} non-background px in ${name}`);
    log(`beat ${n} frame ${r.frame} | ${size} | font loaded ${r.fontsOk} | ${r.textBlocks} text blocks | ${r.pairsChecked} box pairs | outside-safe-zone non-bg px: ${px.map(p => p[1]).join("/")}`);
    for (const t of r.rows) log(`  ${t.id.padEnd(5)} widest ${String(t.widest).padStart(3)}/${t.boxW} slack ${String(t.slack).padStart(3)} | ${t.fg} on ${t.bg} ${t.ratio}:1 | "${t.text}"`);
    log(r.fails.length ? r.fails.map(f => "  FAIL " + f).join("\n") : "  PASS overflow, collision, safe zone, contrast >= 7:1, words, motion settled");
    failCount += r.fails.length;
  }
  await browser.close();
  /* Contact sheet: all 8 stills in a 3x3 grid at full scale, 4:5 overall. */
  const files = Array.from({ length: BEAT_COUNT }, (_, i) => path.join(OUT, `beat-${i + 1}.png`));
  magick(["montage", ...files, "+set", "label", "-font", "/Users/EVA/Library/Fonts/InstrumentSans-1.ttf", "-tile", "3x3", "-geometry", "1080x1350+0+0", "-background", "#d6d1c7", path.join(OUT, "contact-sheet.png")]);
  magick([path.join(OUT, "contact-sheet.png"), "-resize", "360x450!", path.join(OUT, "contact-sheet-360x450.png")]);
  /* Phone-scale proof: each still at 360x450, the one-third readability check from DESIGN.md 3.3. */
  magick(["montage", ...files, "+set", "label", "-font", "/Users/EVA/Library/Fonts/InstrumentSans-1.ttf", "-resize", "360x450", "-tile", "3x3", "-geometry", "360x450+8+8", "-background", "#d6d1c7", path.join(OUT, "contact-sheet-phone-scale.png")]);
  log(`contact-sheet.png ${magick(["identify", "-format", "%wx%h", path.join(OUT, "contact-sheet.png")])}, contact-sheet-360x450.png ${magick(["identify", "-format", "%wx%h", path.join(OUT, "contact-sheet-360x450.png")])}`);
  log(failCount ? `TOTAL FAILURES: ${failCount}` : "ALL CHECKS PASS");
  fs.writeFileSync(path.join(OUT, "check-output.txt"), lines.join("\n") + "\n");
  process.exit(failCount ? 1 : 0);
})();
