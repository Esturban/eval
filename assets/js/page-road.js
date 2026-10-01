// REUSE_CHECKED: /Users/EVA/Desktop/eva/03_development/_dev/web/eval-cro6837-round4/assets/js/home-motion.js   its round 3 ride-along lane is moved here and extended
//
// Full-page highway (round 4). The hero's Inbox agent drives the
// length of the page past a repeating beat of step signs: email arrives,
// the agent picks it up, reads it, drafts the reply, the reply lands.
// - From 1024px: the road is drawn into the page itself (.hwy). It runs
//   down the right margin, sweeps across the page in the dark to light
//   blend (.arc-seam, the one stretch with no text), and runs down the left
//   margin to the end of the last section. The car is fixed in the viewport
//   and the road scrolls under it; the car follows the road's line, changes
//   lanes as the story moves on, and turns into every curve.
// - Below 1024px: a route strip under the header with the five step icons;
//   the car drives across it once per loop.
// - still: true (reduced motion, data saver, low memory) draws the road and
//   its signs without the car, below 1024px nothing.
// Transforms, custom properties and classes only after the first measure.

const WIDE = '(min-width: 1024px)';
const SVG_NS = 'http://www.w3.org/2000/svg';
const CAR_Y = 0.42;         // share of the viewport height where the car drives
const ROAD_W = 72;          // px, matches .hwy__asphalt
const LABEL_COL = 30;       // px, sign label column plus its gap, outer side
const EDGE_MIN = 18;        // px, road block never closer to the edge than this
const LANE = 18;            // px, road centre to a lane centre
const LANE_CHANGE = 240;    // px of road one lane change takes
const LOOPS = 2;            // the step beat repeats this many times down the page
const MIN_SPACING = 420;    // px between signs, or the beat runs once
const SWEEP_STEP = 4;       // px, sampling of the sweep curve
const CAR_PARK = 70;        // px, car parks this far inside each road end
const MAX_YAW = 75;         // degrees
const STRIP_CAR = 39;       // px, car centre at the strip start (left + half length)
const STRIP_LANE = 9;       // px, lane offset on the strip

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function smootherstep(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function smootherslope(t) {
  return 30 * t * t * (1 - t) * (1 - t);
}

function isLightTone(hex) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255) > 140;
}

function docTop(el) {
  return el.getBoundingClientRect().top + window.scrollY;
}

// Lane position, -1 to 1, eased through each change at the given points
// along the road, and its rate of change per px of road.
function laneAt(y, changes) {
  let lane = -1;
  let rate = 0;
  let delta = 2;
  changes.forEach((c) => {
    const t = clamp((y - (c - LANE_CHANGE / 2)) / LANE_CHANGE, 0, 1);
    lane += delta * smoothstep(t);
    rate += (delta * 6 * t * (1 - t)) / LANE_CHANGE;
    delta = -delta;
  });
  return [lane, rate];
}

function icon(name) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.appendChild(use);
  return svg;
}

function makeSign(step, n, isLast) {
  const sign = document.createElement('div');
  sign.className = `hwy-sign${isLast ? ' is-last' : ''}`;
  const badge = document.createElement('span');
  badge.className = 'hwy-sign__badge';
  badge.appendChild(icon(step.icon));
  const label = document.createElement('span');
  label.className = 'hwy-sign__label';
  const num = document.createElement('b');
  num.textContent = String(n).padStart(2, '0');
  label.append(num, document.createTextNode(step.text));
  sign.append(badge, label);
  return sign;
}

// The road's line: x as a function of y (layer coordinates), right margin,
// then a smootherstep sweep to the left margin between sweepA and sweepB.
function roadLine(width, sweepA, sweepB) {
  const outer = Math.max(0, (width - 1280) / 2);
  const edge = Math.max(EDGE_MIN, (outer - 70) / 2);
  const xR = width - edge - LABEL_COL - ROAD_W / 2;
  const xL = edge + LABEL_COL + ROAD_W / 2;
  const span = Math.max(1, sweepB - sweepA);
  return {
    xR,
    xL,
    x(y) {
      if (y <= sweepA) return xR;
      if (y >= sweepB) return xL;
      return xR + (xL - xR) * smootherstep((y - sweepA) / span);
    },
    slope(y) {
      if (y <= sweepA || y >= sweepB) return 0;
      return ((xL - xR) * smootherslope((y - sweepA) / span)) / span;
    },
  };
}

export function setupRoad({ ride, layer, sections, seam, steps, still }) {
  const main = layer.parentElement;
  const wideQuery = window.matchMedia(WIDE);
  const svg = layer.querySelector('.hwy__svg');
  const paths = Array.from(svg.querySelectorAll('path'));
  const bend = layer.querySelector('.hwy__bend');
  const trails = Array.from(bend.querySelectorAll('path'));
  const runA = layer.querySelector('[data-run="a"]');
  const runB = layer.querySelector('[data-run="b"]');
  const signBox = layer.querySelector('.hwy__signs');
  const stops = Array.from(ride.querySelectorAll('.ride__stops li'));
  const capNum = ride.querySelector('.ride__caption b');
  const capText = ride.querySelector('.ride__caption span');
  let capStep = -1;
  const header = document.querySelector('.site-header');
  const tones = Array.from(document.querySelectorAll('.arc-section[data-tone], .arc-seam[data-tone]'));

  let wide = wideQuery.matches;
  let line = null;
  let top = 0;        // layer top, document px
  let height = 0;     // road length along y
  let samples = [];   // [y, cumulative length] along the sweep
  let lenB = 0;
  let changes = [];
  let signs = [];     // [el, y]
  let loop = -1;
  let first = 0;
  let end = 0;
  let geometry = '';
  let sweep = [0, 0];
  let bendLen = 0;
  let lastDash = '';

  function lengthAt(y) {
    if (!samples.length || y <= samples[0][0]) return y;
    const last = samples[samples.length - 1];
    if (y >= last[0]) return lenB + (y - last[0]);
    const i = Math.min(samples.length - 2, Math.floor((y - samples[0][0]) / SWEEP_STEP));
    const [y0, l0] = samples[i];
    const [y1, l1] = samples[i + 1];
    return l0 + ((l1 - l0) * (y - y0)) / Math.max(1e-6, y1 - y0);
  }

  function toneAt(docY) {
    let tone = '#020617';
    tones.forEach((el) => {
      const r = el.getBoundingClientRect();
      const t = r.top + window.scrollY + (el.classList.contains('arc-seam') ? r.height / 2 : 0);
      if (docY >= t) tone = el.dataset.tone;
    });
    return tone;
  }

  function measureWide() {
    const mainTop = docTop(main);
    top = docTop(sections[0]);
    const last = sections[sections.length - 1];
    height = last.getBoundingClientRect().bottom + window.scrollY - top;
    const seamRect = seam.getBoundingClientRect();
    const sweepA = seamRect.top + window.scrollY - top;
    const sweepB = sweepA + seamRect.height;
    const width = layer.clientWidth;
    // Rebuild only when the page's geometry really changed.
    const key = [top, height, sweepA, sweepB, width, window.innerHeight].map(Math.round).join(',');
    if (key === geometry && line) return;
    geometry = key;
    line = roadLine(width, sweepA, sweepB);

    layer.style.top = `${top - mainTop}px`;
    layer.style.height = `${height}px`;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    // Straight, sweep sampled every few px, straight.
    samples = [];
    let len = sweepA;
    let prev = [line.x(sweepA), sweepA];
    for (let y = sweepA; y <= sweepB + 0.1; y += SWEEP_STEP) {
      const pt = [line.x(y), y];
      len += Math.hypot(pt[0] - prev[0], pt[1] - prev[1]);
      samples.push([y, len]);
      prev = pt;
    }
    lenB = samples.length ? samples[samples.length - 1][1] : sweepA;
    sweep = [sweepA, sweepB];
    bendLen = lenB - sweepA;
    const pts = [`M${line.xR.toFixed(1)} 0`, `L${line.xR.toFixed(1)} ${sweepA.toFixed(1)}`];
    samples.forEach(([y]) => pts.push(`L${line.x(y).toFixed(1)} ${y.toFixed(1)}`));
    pts.push(`L${line.xL.toFixed(1)} ${height.toFixed(1)}`);
    paths.forEach((p) => p.setAttribute('d', pts.join(' ')));
    // Asphalt tone: dark until a quarter of the way into the sweep, the
    // lighter cream-side tone from three quarters of the way.
    const grad = svg.querySelector('#hwy-tone');
    if (grad) {
      grad.setAttribute('y2', String(height));
      const [s0, s1, s2, s3] = grad.querySelectorAll('stop');
      const at = (y) => clamp(y / Math.max(1, height), 0, 1).toFixed(4);
      s0.setAttribute('offset', '0');
      s1.setAttribute('offset', at(sweepA + (sweepB - sweepA) * 0.25));
      s2.setAttribute('offset', at(sweepA + (sweepB - sweepA) * 0.75));
      s3.setAttribute('offset', '1');
    }

    // Trail pieces: the two straights and the sweep, each only its own size.
    Object.assign(runA.style, { left: `${line.xR}px`, top: '0px', height: `${sweepA}px` });
    Object.assign(runB.style, { left: `${line.xL}px`, top: `${sweepB}px`, height: `${Math.max(0, height - sweepB)}px` });
    const span = Math.max(1, sweepB - sweepA);
    Object.assign(bend.style, { top: `${sweepA}px`, width: `${width}px`, height: `${span}px` });
    bend.setAttribute('viewBox', `0 ${sweepA} ${width} ${span}`);
    const bendPts = samples.map(([y], i) => `${i ? 'L' : 'M'}${line.x(y).toFixed(1)} ${y.toFixed(1)}`).join(' ');
    trails.forEach((t) => t.setAttribute('d', bendPts));
    lastDash = '';

    // Lane changes halfway through each section, never inside the sweep.
    changes = sections
      .map((s) => {
        const r = s.getBoundingClientRect();
        return r.top + window.scrollY - top + r.height / 2;
      })
      .filter((y) => y < sweepA - LANE_CHANGE || y > sweepB + LANE_CHANGE);

    placeSigns();
  }

  function placeSigns() {
    signBox.textContent = '';
    const vh = window.innerHeight;
    const pad = Math.min(vh * 0.4, height * 0.08);
    const beats = steps.length;
    let count = beats * LOOPS;
    if ((height - pad * 2) / (count - 1) < MIN_SPACING) count = beats;
    const spacing = (height - pad * 2) / (count - 1);
    signs = [];
    for (let i = 0; i < count; i += 1) {
      const y = pad + i * spacing;
      const k = i % beats;
      const step = i >= beats && k === 0 && steps[0].again ? { ...steps[0], text: steps[0].again } : steps[k];
      const sign = makeSign(step, k + 1, k === beats - 1);
      const x = line.x(y);
      const half = x > layer.clientWidth / 2 ? 'right' : 'left';
      const side = Math.abs(line.slope(y)) > 0.6 ? `flat-${half}` : half;
      sign.dataset.side = side;
      sign.style.left = `${x.toFixed(1)}px`;
      sign.style.top = `${y.toFixed(1)}px`;
      if (isLightTone(toneAt(top + y))) sign.classList.add('is-light');
      if (still) sign.classList.add('is-passed');
      signBox.appendChild(sign);
      signs.push([sign, y]);
    }
  }

  function updateWide() {
    const vh = window.innerHeight;
    const carY = clamp(window.scrollY + vh * CAR_Y - top, CAR_PARK, height - CAR_PARK);
    const x = line.x(carY);
    const slope = line.slope(carY);
    const [lane, rate] = laneAt(carY, changes);
    // Lane offset along the road's normal, so it holds through the sweep.
    const norm = Math.hypot(1, slope);
    const off = lane * LANE;
    const cx = x + off / norm;
    const cy = carY - (off * slope) / norm;
    // Down the page, a move to the right turns the nose anticlockwise.
    const yaw = clamp(-(Math.atan(slope + rate * LANE) * 180) / Math.PI, -MAX_YAW, MAX_YAW);
    ride.style.setProperty('--car-x', `${cx.toFixed(1)}px`);
    ride.style.setProperty('--car-y', `${(cy + top - window.scrollY).toFixed(1)}px`);
    ride.style.setProperty('--car-yaw', `${yaw.toFixed(2)}deg`);
    // Only the piece the car is on changes; the sweep's dash is written
    // only when it actually moves.
    const [sweepA, sweepB] = sweep;
    runA.style.setProperty('--run', clamp(carY / Math.max(1, sweepA), 0, 1).toFixed(4));
    runB.style.setProperty('--run', clamp((carY - sweepB) / Math.max(1, height - sweepB), 0, 1).toFixed(4));
    const lit = clamp(lengthAt(carY) - sweepA, 0, bendLen);
    const dash = `${lit.toFixed(1)} ${(bendLen + 10).toFixed(1)}`;
    if (dash !== lastDash) {
      lastDash = dash;
      trails.forEach((t) => { t.style.strokeDasharray = dash; });
    }
    let lastPassed = -1;
    signs.forEach(([el, y], i) => {
      const passed = y <= carY;
      el.classList.toggle('is-passed', passed);
      if (passed) lastPassed = i;
    });
    ride.classList.toggle('is-done', lastPassed >= 0 && lastPassed % steps.length === steps.length - 1);
  }

  function measureNarrow() {
    if (header) ride.style.setProperty('--ride-top', `${header.offsetHeight}px`);
    first = docTop(sections[0]);
    end = sections[sections.length - 1].getBoundingClientRect().bottom + window.scrollY;
    const track = Math.max(0, ride.clientWidth - STRIP_CAR * 2);
    stops.forEach((li, i) => li.style.setProperty('--stop-x', `${(STRIP_CAR + ((i + 0.5) / stops.length) * track).toFixed(1)}px`));
    ride.dataset.track = String(track);
  }

  function updateNarrow() {
    const vh = window.innerHeight;
    const y = window.scrollY;
    ride.classList.toggle('is-shown', y + vh * 0.35 > first && y + vh * 0.8 < end);
    const p = clamp((y + vh * 0.5 - first) / Math.max(1, end - first), 0, 1);
    const pos = p * LOOPS;
    const idx = Math.min(LOOPS - 1, Math.floor(pos));
    const frac = pos - idx;
    if (idx !== loop) {
      // Next loop: the car comes back in at the left without sliding back.
      if (loop !== -1) {
        ride.classList.add('is-wrap');
        requestAnimationFrame(() => requestAnimationFrame(() => ride.classList.remove('is-wrap')));
      }
      loop = idx;
    }
    const track = Number(ride.dataset.track || 0);
    // One gentle lane change per loop, eased, with the nose turned into it.
    const t = clamp((frac - 0.4) / 0.2, 0, 1);
    const lane = -1 + 2 * smoothstep(t);
    const rate = (2 * 6 * t * (1 - t)) / 0.2;
    const yaw = track > 0 ? clamp((Math.atan((rate * STRIP_LANE) / track) * 180) / Math.PI, -22, 22) : 0;
    ride.style.setProperty('--ride-p', frac.toFixed(4));
    ride.style.setProperty('--ride-along', `${(frac * track).toFixed(1)}px`);
    ride.style.setProperty('--ride-cross', `${(lane * STRIP_LANE).toFixed(1)}px`);
    ride.style.setProperty('--ride-yaw', `${yaw.toFixed(2)}deg`);
    const threshold = frac * stops.length - 0.5;
    stops.forEach((li, i) => li.classList.toggle('is-passed', i <= threshold));
    // Caption: the step the car last passed (the first one before it gets
    // there), so every icon has its words on screen.
    const step = clamp(Math.floor(threshold), 0, steps.length - 1);
    const key = step + idx * steps.length;
    if (key !== capStep && capText) {
      capStep = key;
      const data = idx > 0 && step === 0 && steps[0].again ? steps[0].again : steps[step].text;
      capNum.textContent = String(step + 1).padStart(2, '0');
      capText.textContent = data;
    }
  }

  function measure() {
    wide = wideQuery.matches;
    layer.classList.toggle('is-on', wide);
    ride.classList.toggle('is-on', !still);
    main.classList.toggle('has-road', wide);
    main.classList.toggle('has-ride', !still && !wide);
    if (wide) measureWide();
    else if (!still) measureNarrow();
  }

  function update() {
    if (still) return;
    if (wide && line) updateWide();
    else if (!wide) updateNarrow();
  }

  // Remeasure on resize and whenever the page's height settles (fonts,
  // lazy images), one frame later so layout has finished.
  let pending = false;
  function remeasure() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      measure();
      update();
    });
  }

  measure();
  window.addEventListener('resize', remeasure, { passive: true });
  window.addEventListener('load', remeasure);
  if (typeof window.ResizeObserver === 'function') new ResizeObserver(remeasure).observe(main);
  return update;
}
