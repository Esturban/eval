// Homepage hero: a divided highway at night with one overpass. Each agent
// vehicle runs a loop: it drives toward the viewer on the near carriageway
// carrying a live event tag, passes under the overpass (the tag turns into
// finished work there), leaves the frame under the camera, then drives away
// on the far carriageway still carrying its finished-work tag. Labels are
// plain type on a thin stem, projected from the vehicle every frame; no
// panels. The camera is fixed: no zoom, no push, no orbit. Traffic cruises
// on its own; scroll adds forward travel.
//
// Each live event lists the tools it can come from; every time the event
// comes round again its tag names the next one as a small "works with" chip
// (a monochrome Simple Icons glyph where one exists, otherwise the name only).
//
// Budget: MeshStandardMaterial and additive planes only, no post-processing,
// shared geometry, instancing for repeated road furniture, pixel ratio capped,
// render loop stops whenever the hero is off screen.

import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  Clock,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';

import { readToneStops } from './tone-stops.js';

const LANE_WIDTH = 1.5;
// Near carriageway (toward the viewer) on +z, far carriageway (away) on -z.
const LANES_IN = [0.75, 2.25];
const LANES_OUT = [-0.75, -2.25];
const ROAD_HALF = 3.1;
const ROAD_FAR = -70;
const ROAD_NEAR = 18;
const TRAVEL_START = -62; // vehicles appear out of the fog here
const TRAVEL_SPAN = 78; // and pass under the camera at TRAVEL_START + SPAN
const LOOP_SECONDS = 36; // time for a speed-1 vehicle to drive in and back out
const SCROLL_PUSH = 0.4; // extra loops added across the full hero scroll
const TAG_SECONDS = 2.2;
const OVERPASS_X = -9; // the tag turns into finished work under here
const DECK_Y = 3.45; // deck centre height; clearance reads right against the cars
const ROOF_Y = 0.95;
const LABEL_Y = 1.9;
const FLASH_SECONDS = 0.7;

const LAYOUTS = {
  wide: { fov: 30, camY: 2.3, camZ: 1.5, vx: 0.7, vy: 0.46, dpr: 1.75, fade: [40, 52] },
  tall: { fov: 44, camY: 2.9, camZ: 0.2, vx: 0.5, vy: 0.7, dpr: 1.25, fade: [30, 42] },
  // Desktop side rail: a narrow, tall column (~22vw wide, full viewport
  // height). A tighter FOV and a view offset that keeps the road centred
  // in the strip reads better than reusing the phone "tall" tuning, which
  // is built for a much less extreme aspect ratio.
  rail: { fov: 24, camY: 2.6, camZ: 2.4, vx: 0.5, vy: 0.5, dpr: 1.5, fade: [26, 40] },
};

const DAY_PROGRESS_LAMP_FADE = 0.4; // lamps are fully off by this share of day progress

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

function fract(v) {
  return v - Math.floor(v);
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function canvasTexture(draw, w = 128, h = 128) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

function radialTexture() {
  return canvasTexture((g, w, h) => {
    const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.4, 'rgba(255,255,255,0.35)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, w, h);
  });
}

function beamTexture() {
  // Bright at the lamp end (right), fading and widening down the road.
  return canvasTexture((g, w, h) => {
    const lin = g.createLinearGradient(w, 0, 0, 0);
    lin.addColorStop(0, 'rgba(255,255,255,0.9)');
    lin.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = lin;
    g.beginPath();
    g.moveTo(w, h * 0.38);
    g.lineTo(0, 0);
    g.lineTo(0, h);
    g.lineTo(w, h * 0.62);
    g.fill();
  }, 128, 64);
}

function skyTexture() {
  // Night overhead, a cyan city glow, and a thin first light of dawn on the
  // horizon: the direction finished work drives off toward.
  return canvasTexture((g, w, h) => {
    const lin = g.createLinearGradient(0, 0, 0, h);
    lin.addColorStop(0, 'rgba(2,6,23,0)');
    lin.addColorStop(0.5, 'rgba(14,116,144,0.5)');
    lin.addColorStop(0.585, 'rgba(34,211,238,0.34)');
    lin.addColorStop(0.61, 'rgba(253,186,116,0.3)');
    lin.addColorStop(0.64, 'rgba(34,211,238,0.12)');
    lin.addColorStop(1, 'rgba(2,6,23,0)');
    g.fillStyle = lin;
    g.fillRect(0, 0, w, h);
  }, 8, 256);
}

function placeInstances(mesh, points) {
  const m = new Matrix4();
  points.forEach(([x, y, z], i) => {
    m.makeTranslation(x, y, z);
    mesh.setMatrixAt(i, m);
  });
  return mesh;
}

function buildRoad(scene, textures) {
  const groundMat = new MeshStandardMaterial({ color: 0x030b18, roughness: 1 });
  const ground = new Mesh(new PlaneGeometry(400, 200), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  scene.add(ground);

  const length = ROAD_NEAR - ROAD_FAR;
  const midX = (ROAD_NEAR + ROAD_FAR) / 2;
  const roadMat = new MeshStandardMaterial({ color: 0x0e1829, roughness: 0.82, metalness: 0.05 });
  const road = new Mesh(new PlaneGeometry(length, ROAD_HALF * 2 + 0.8), roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(midX, 0, 0);
  scene.add(road);

  const paint = new MeshBasicMaterial({ color: 0xe8edf4 });
  [-ROAD_HALF, ROAD_HALF].forEach((z) => {
    const edge = new Mesh(new PlaneGeometry(length, 0.1), paint);
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(midX, 0.005, z);
    scene.add(edge);
  });

  // Dashed lane dividers, long paint and longer gaps like a real highway.
  const dashPts = [];
  [-LANE_WIDTH, LANE_WIDTH].forEach((z) => {
    for (let x = ROAD_FAR; x < ROAD_NEAR; x += 6.4) dashPts.push([x, 0.006, z]);
  });
  const dashGeo = new PlaneGeometry(2.4, 0.09).rotateX(-Math.PI / 2);
  scene.add(placeInstances(new InstancedMesh(dashGeo, paint, dashPts.length), dashPts));

  // Median: a low concrete barrier splits the two directions of travel.
  const median = new Mesh(
    new BoxGeometry(length, 0.34, 0.22),
    new MeshStandardMaterial({ color: 0x3b4658, roughness: 0.85 })
  );
  median.position.set(midX, 0.17, 0);
  scene.add(median);

  // Reflective road studs along both edges: the small cyan dots of a night road.
  const studPts = [];
  const postPts = [];
  for (let x = ROAD_FAR; x < ROAD_NEAR; x += 3) {
    studPts.push([x, 0.008, -ROAD_HALF + 0.22], [x, 0.008, ROAD_HALF - 0.22]);
  }
  for (let x = ROAD_FAR; x < ROAD_NEAR; x += 2.5) {
    postPts.push([x, 0.27, -ROAD_HALF - 0.55], [x, 0.27, ROAD_HALF + 0.55]);
  }
  const studGeo = new PlaneGeometry(0.12, 0.12).rotateX(-Math.PI / 2);
  scene.add(placeInstances(new InstancedMesh(studGeo, new MeshBasicMaterial({ color: 0x22d3ee }), studPts.length), studPts));

  const railMat = new MeshStandardMaterial({ color: 0x64748b, roughness: 0.5, metalness: 0.6 });
  [-ROAD_HALF - 0.55, ROAD_HALF + 0.55].forEach((z) => {
    const rail = new Mesh(new BoxGeometry(length, 0.14, 0.05), railMat);
    rail.position.set(midX, 0.52, z);
    scene.add(rail);
  });
  scene.add(placeInstances(new InstancedMesh(new BoxGeometry(0.07, 0.55, 0.07), railMat, postPts.length), postPts));

  const lamps = buildLamps(scene, textures);

  const skyMat = new MeshBasicMaterial({ map: textures.sky, transparent: true, depthWrite: false, fog: false });
  const sky = new Mesh(new PlaneGeometry(260, 34), skyMat);
  sky.rotation.y = Math.PI / 2;
  sky.position.set(ROAD_FAR - 20, 4, 0);
  scene.add(sky);

  return { groundMat, roadMat, skyMat, lamps };
}

// Returns the four instanced meshes so setDayProgress() can fade the lamps
// out by day and pull them back out of the render list (mesh.visible, not
// just opacity 0) instead of only relying on a transparent material to hide
// draw calls that still run every frame.
function buildLamps(scene, textures) {
  const spacing = 16;
  const poles = [];
  const arms = [];
  const heads = [];
  const pools = [];
  for (let x = ROAD_FAR + 6; x < ROAD_NEAR - 12; x += spacing) {
    [-1, 1].forEach((side) => {
      const px = side === 1 ? x + spacing / 2 : x;
      const pz = side * (ROAD_HALF + 1.1);
      poles.push([px, 2.3, pz]);
      arms.push([px, 4.55, pz - side * 0.75]);
      heads.push([px, 4.5, pz - side * 1.5]);
      pools.push([px, 0.01, pz - side * 2.2]);
    });
  }
  const metalMat = new MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.5, transparent: true });
  const headMat = new MeshBasicMaterial({ color: 0xfff4d6, transparent: true });
  const poolMat = new MeshBasicMaterial({
    map: textures.radial, color: 0xffe7b8, transparent: true, opacity: 0.16, blending: AdditiveBlending, depthWrite: false,
  });
  const poleMesh = placeInstances(new InstancedMesh(new CylinderGeometry(0.05, 0.06, 4.6, 6), metalMat, poles.length), poles);
  const armMesh = placeInstances(new InstancedMesh(new BoxGeometry(0.06, 0.06, 1.6), metalMat, arms.length), arms);
  const headMesh = placeInstances(new InstancedMesh(new BoxGeometry(0.5, 0.08, 0.22), headMat, heads.length), heads);
  const poolMesh = placeInstances(new InstancedMesh(new PlaneGeometry(5.5, 5.5).rotateX(-Math.PI / 2), poolMat, pools.length), pools);
  scene.add(poleMesh, armMesh, headMesh, poolMesh);
  return { meshes: [poleMesh, armMesh, headMesh], metalMat, headMat, poolMat, poolBaseOpacity: 0.16 };
}

// One overpass across both carriageways. No signs on it: a concrete deck,
// piers, a parapet, and a thin light line on the fascia that flashes in a
// vehicle's colour as it passes under and its work is finished.
function buildOverpass(scene, textures) {
  const x = OVERPASS_X;
  const span = ROAD_HALF * 2 + 9;
  const concrete = new MeshStandardMaterial({ color: 0x1a2436, roughness: 0.9, metalness: 0.05 });
  const deck = new Mesh(new BoxGeometry(1.8, 0.4, span), concrete);
  deck.position.set(x, DECK_Y, 0);
  const parapet = new Mesh(new BoxGeometry(0.12, 0.4, span), concrete);
  parapet.position.set(x + 0.82, DECK_Y + 0.4, 0);
  scene.add(deck, parapet);
  [-(ROAD_HALF + 1.6), 0, ROAD_HALF + 1.6].forEach((z) => {
    const pier = new Mesh(new BoxGeometry(0.9, DECK_Y - 0.2, z === 0 ? 0.3 : 0.5), concrete);
    pier.position.set(x, (DECK_Y - 0.2) / 2, z);
    scene.add(pier);
  });
  const stripMat = new MeshBasicMaterial({ color: 0x22d3ee, fog: false });
  const strip = new Mesh(new BoxGeometry(0.02, 0.06, ROAD_HALF * 2 + 1.2), stripMat);
  strip.position.set(x + 0.91, DECK_Y - 0.12, 0);
  scene.add(strip);
  // Light spilling onto the road under the deck.
  const pool = new Mesh(
    new PlaneGeometry(4, ROAD_HALF * 2).rotateX(-Math.PI / 2),
    new MeshBasicMaterial({
      map: textures.radial, color: 0x7dd3fc, transparent: true, opacity: 0.22, blending: AdditiveBlending, depthWrite: false,
    })
  );
  pool.position.set(x + 0.6, 0.012, 0);
  scene.add(pool);
  return { stripMat, pool: pool.material };
}

function sharedVehicleParts(textures) {
  return {
    radial: textures.radial,
    beam: textures.beam,
    // Tapered lozenge silhouette: a flattened, elongated ellipsoid reads as
    // a moving light/data-packet instead of a boxed sedan, and it is
    // naturally shorter and rounded at both ends without a separate cabin
    // mesh. ~30% shorter vertically than the old BoxGeometry(1.9, 0.38,
    // 0.92) body (0.38 tall -> ~0.26 tall here).
    bodyGeo: new SphereGeometry(0.4, 16, 10).scale(2.15, 0.33, 1.15),
    stripeGeo: new BoxGeometry(1.66, 0.035, 1.0),
    beaconGeo: new CylinderGeometry(0.08, 0.1, 0.08, 12), // roof sensor: reads as a self-driving bot
    lightGeo: new BoxGeometry(0.04, 0.05, 0.6),
    tailGeo: new BoxGeometry(0.04, 0.05, 0.16),
    // Trailing light streak: longer and more transparent than the old
    // forward headlight beam, and tinted per vehicle in buildVehicle
    // instead of the old shared white glow.
    beamGeo: new PlaneGeometry(5.4, 1.6).rotateX(-Math.PI / 2),
    underGeo: new PlaneGeometry(2.8, 1.8).rotateX(-Math.PI / 2),
    bodyMat: new MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.4 }),
    headMat: new MeshBasicMaterial({ color: 0xffffff }),
    tailMat: new MeshBasicMaterial({ color: 0xff3b4e }),
  };
}

function buildVehicle(color, shared) {
  const group = new Group();
  const accent = new Color(color);
  const accentMat = new MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.9 });
  const streakMat = new MeshBasicMaterial({
    map: shared.beam, color: accent, transparent: true, opacity: 0.22, blending: AdditiveBlending, depthWrite: false,
  });
  const parts = [
    [shared.bodyGeo, shared.bodyMat, 0, 0.24],
    [shared.stripeGeo, accentMat, 0, 0.34],
    [shared.beaconGeo, accentMat, -0.1, 0.42],
    [shared.lightGeo, shared.headMat, 0.86, 0.28],
    [shared.beamGeo, streakMat, -2.9, 0.012],
  ];
  parts.forEach(([geo, mat, x, y]) => {
    const mesh = new Mesh(geo, mat);
    mesh.position.set(x, y, 0);
    group.add(mesh);
  });
  [0.28, -0.28].forEach((z) => {
    const tail = new Mesh(shared.tailGeo, shared.tailMat);
    tail.position.set(-0.86, 0.28, z);
    group.add(tail);
  });
  const under = new Mesh(
    shared.underGeo,
    new MeshBasicMaterial({ map: shared.radial, color: accent, transparent: true, opacity: 0.7, blending: AdditiveBlending, depthWrite: false })
  );
  under.position.y = 0.011;
  group.add(under);
  return { group };
}

function readBrands(root) {
  try {
    return JSON.parse(root.dataset.brands || '{}');
  } catch (err) {
    return {};
  }
}

function readBots(root) {
  return Array.from(root.querySelectorAll('.hw-bot')).map((el) => {
    let events = [];
    let done = null;
    try {
      events = JSON.parse(el.dataset.events || '[]');
      done = JSON.parse(el.dataset.done || 'null');
    } catch (err) {
      events = [];
    }
    const lane = Math.max(0, Math.round(Number(el.dataset.lane) || 0));
    return {
      el,
      laneIn: LANES_IN[lane % 2],
      laneOut: LANES_OUT[(lane + 1) % 2],
      offset: Number(el.dataset.offset) || 0,
      speed: Number(el.dataset.speed) || 1,
      color: el.dataset.color || '#22d3ee',
      events,
      done,
      icon: el.querySelector('.hw-bot__icon use'),
      text: el.querySelector('.hw-bot__text'),
      tag: el.querySelector('.hw-bot__tag'),
      tool: el.querySelector('.hw-bot__tool'),
      toolGlyph: el.querySelector('.hw-bot__brand use'),
      toolLogo: el.querySelector('.hw-bot__brand-img'),
      toolName: el.querySelector('.hw-bot__toolname'),
      shown: null,
      lastX: null,
    };
  });
}

// The chip names one tool: where a live event came from, or where the
// finished work landed. Three tools (Outlook, Slack, Salesforce) carry an
// officialLogo instead of a Simple Icons glyph: a bounded, documented
// exception to the monochrome chip rule (see DESIGN.md, data/brands.json).
// officialLogo wins over glyph when both would somehow be present; glyph
// wins over the name-only default; the branches are mutually exclusive.
function setTool(bot, brand, sprite) {
  if (!bot.tool) return;
  const show = Boolean(brand && brand.name);
  bot.tool.hidden = !show;
  if (!show) return;
  bot.toolName.textContent = brand.name;
  const hasOfficialLogo = Boolean(brand.officialLogo && bot.toolLogo);
  const hasGlyph = !hasOfficialLogo && Boolean(brand.glyph && sprite);
  bot.tool.classList.toggle('has-official-logo', hasOfficialLogo);
  bot.tool.classList.toggle('has-glyph', hasGlyph);
  if (hasOfficialLogo) {
    bot.toolLogo.src = brand.officialLogo;
  } else if (hasGlyph) {
    bot.toolGlyph.setAttribute('href', `${sprite}#b-${brand.glyph}`);
  }
}

function setTag(bot, item, isDone, brand, sprite) {
  if (!item || !bot.icon || !bot.text) return;
  bot.icon.setAttribute('href', `#i-${item.icon}`);
  bot.text.textContent = item.text;
  setTool(bot, brand, sprite);
  bot.el.classList.toggle('is-done', isDone);
  bot.tag.classList.remove('is-swap');
  void bot.tag.offsetWidth; // restart the pop animation
  bot.tag.classList.add('is-swap');
  bot.width = 0; // tag text changed, re-measure
}

// Where a bot is on its loop: inbound toward the camera for the first half,
// outbound away from it for the second. Returns world x, lane z and heading.
function travel(loop) {
  if (loop < 0.5) return { x: TRAVEL_START + loop * 2 * TRAVEL_SPAN, inbound: true };
  return { x: TRAVEL_START + (1 - loop) * 2 * TRAVEL_SPAN, inbound: false };
}

// Give the main thread back between build stages so no single task runs long.
function yieldToMain() {
  if (window.scheduler && typeof window.scheduler.yield === 'function') return window.scheduler.yield();
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export async function createHighwayScene({ canvas, root }) {
  if (!canvas || !window.WebGLRenderingContext) return null;
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
  } catch (err) {
    return null;
  }
  renderer.setClearColor(0x020617, 1);
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  scene.fog = new Fog(0x061426, 18, 66);
  const hemi = new HemisphereLight(0x3b6a8f, 0x020617, 1.3);
  scene.add(hemi);
  const moon = new DirectionalLight(0xbcd3ee, 1.4);
  moon.position.set(12, 10, 6);
  const fill = new DirectionalLight(0x9fdcf0, 0.9);
  fill.position.set(30, 3, -4);
  scene.add(moon, fill);

  const textures = { radial: radialTexture(), beam: beamTexture(), sky: skyTexture() };
  await yieldToMain();
  const { groundMat, roadMat, skyMat, lamps } = buildRoad(scene, textures);
  const overpass = buildOverpass(scene, textures);
  const stripBase = new Color(0x22d3ee);
  const flashColor = new Color();
  let flash = { at: -10, color: stripBase };

  // Full-page rail day/night: rather than a second authored palette, lerp
  // between the same colour-arc tone stops home-motion.js already blends
  // <main>'s background across (the hero's night tone and the closing
  // CTA's day tone).
  const stops = readToneStops(root.ownerDocument || document);
  const nightTone = new Color(stops[0] || '#020617');
  const dayTone = new Color(stops[stops.length - 1] || '#f7f4ee');
  const dayFog = dayTone.clone();
  const dayHemiSky = new Color(0xdcf3ff);
  const daySun = new Color(0xfff2d6);
  const dayFill = new Color(0xffe3b8);
  const dayRoad = new Color(0xc7cdd4);
  const dayGround = dayTone.clone().lerp(new Color(0x9aa3ad), 0.35);
  const nightFog = new Color(0x061426);
  const nightHemiSky = new Color(0x3b6a8f);
  const nightHemiGround = new Color(0x020617);
  const nightMoon = new Color(0xbcd3ee);
  const nightFill = new Color(0x9fdcf0);
  const nightRoad = new Color(0x0e1829);
  const nightGround = new Color(0x030b18);
  const sunDisc = new Mesh(
    new PlaneGeometry(6, 6),
    new MeshBasicMaterial({ map: textures.radial, color: nightMoon, transparent: true, opacity: 0.6, blending: AdditiveBlending, depthWrite: false, fog: false })
  );
  sunDisc.position.set(ROAD_FAR - 14, 9, -6);
  scene.add(sunDisc);
  let dayProgress = 0;
  const clearColor = new Color();

  function applyDayProgress(value) {
    dayProgress = clamp(value, 0, 1);
    const t = smoothstep(dayProgress);
    scene.fog.color.copy(nightFog).lerp(dayFog, t);
    // The renderer's own clear colour and the static night-city sky plane
    // both sit behind everything else; without lerping them too, whatever
    // fills the frame past the fog (a lot of it, in the rail's narrow,
    // close-up framing) stayed hard-coded night navy no matter how bright
    // the rest of the scene got.
    renderer.setClearColor(clearColor.copy(nightFog).lerp(dayFog, t), 1);
    skyMat.opacity = 1 - t;
    hemi.color.copy(nightHemiSky).lerp(dayHemiSky, t);
    hemi.groundColor.copy(nightHemiGround).lerp(dayTone, t);
    hemi.intensity = 1.3 + t * 0.9;
    moon.color.copy(nightMoon).lerp(daySun, t);
    moon.intensity = 1.4 + t * 0.3;
    fill.color.copy(nightFill).lerp(dayFill, t);
    fill.intensity = 0.9 + t * 0.5;
    roadMat.color.copy(nightRoad).lerp(dayRoad, t);
    groundMat.color.copy(nightGround).lerp(dayGround, t);
    // A small disc rising along a fixed arc: the moon by night, the sun by
    // day, using the same radial glow already used for the vehicle
    // undercarriage and lamp pools.
    const arc = Math.sin(dayProgress * Math.PI);
    sunDisc.position.y = 5 + arc * 9;
    sunDisc.material.color.copy(nightMoon).lerp(daySun, t);
    sunDisc.material.opacity = 0.35 + arc * 0.35;
    // Lamps fade out by DAY_PROGRESS_LAMP_FADE and drop out of the render
    // list past it, not just out of sight, to keep the daylight draw-call
    // count down.
    const lampT = 1 - clamp(dayProgress / DAY_PROGRESS_LAMP_FADE, 0, 1);
    lamps.metalMat.opacity = lampT;
    lamps.headMat.opacity = lampT;
    lamps.poolMat.opacity = lamps.poolBaseOpacity * lampT;
    const lampsOn = dayProgress < DAY_PROGRESS_LAMP_FADE;
    lamps.meshes.forEach((mesh) => { mesh.visible = lampsOn; });
  }
  applyDayProgress(0);
  await yieldToMain();

  const shared = sharedVehicleParts(textures);
  const bots = readBots(root);
  const brands = readBrands(root);
  const sprite = root.dataset.brandSprite || '';
  bots.forEach((bot) => {
    const v = buildVehicle(bot.color, shared);
    bot.group = v.group;
    bot.accent = new Color(bot.color);
    scene.add(bot.group);
  });
  await yieldToMain();

  const camera = new PerspectiveCamera(36, 1, 0.1, 160);
  const copyEl = root.querySelector('[data-hw-copy]');
  const projected = new Vector3();
  const roofPoint = new Vector3();
  const clock = new Clock();
  let layout = LAYOUTS.wide;
  let copyRect = null;
  let progress = 0;
  let wanted = false;
  let running = false;
  let railMode = false;
  let size = { w: 1, h: 1 };

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    size = { w, h };
    bots.forEach((bot) => { bot.width = 0; bot.height = 0; });
    layout = railMode ? LAYOUTS.rail : (w / h >= 1 ? LAYOUTS.wide : LAYOUTS.tall);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, layout.dpr));
    renderer.setSize(w, h, false);
    camera.fov = layout.fov;
    camera.aspect = w / h;
    camera.position.set(ROAD_NEAR - 2, layout.camY, layout.camZ);
    camera.lookAt(camera.position.x - 100, layout.camY, layout.camZ);
    // A level, straight-ahead camera puts the vanishing point dead centre;
    // the view offset slides the frame so it lands where the layout wants.
    camera.setViewOffset(w, h, (0.5 - layout.vx) * w, (0.5 - layout.vy) * h, w, h);
    camera.updateProjectionMatrix();
    if (railMode) {
      copyRect = null;
      return;
    }
    const stage = canvas.getBoundingClientRect();
    const r = copyEl ? copyEl.getBoundingClientRect() : null;
    copyRect = r ? { l: r.left - stage.left - 16, t: r.top - stage.top - 16, r: r.right - stage.left + 16, b: r.bottom - stage.top + 16 } : null;
  }

  // Live events cycle on the way in; past the overpass the tag is the
  // finished work, and it stays that way on the way back out. The flip
  // timing is unchanged; each pass through the event list moves every
  // event's chip on to its next tool, and each loop moves the finished
  // work's chip on to its next tool.
  function updateTag(bot, i, elapsed, isDone, lap) {
    const count = Math.max(1, bot.events.length);
    const tick = Math.floor(elapsed / TAG_SECONDS + i * 0.37);
    const slot = tick % count;
    const item = isDone ? bot.done : bot.events[slot];
    const tools = (item && item.tools) || [];
    const turn = isDone ? lap : Math.floor(tick / count);
    const pick = tools.length ? (turn + i) % tools.length : -1;
    const key = `${isDone ? 'done' : slot}:${pick}`;
    if (key === bot.shown) return;
    bot.shown = key;
    setTag(bot, item, isDone, pick >= 0 ? brands[tools[pick]] : null, sprite);
  }

  function toScreen(v) {
    return [(v.x * 0.5 + 0.5) * size.w, (1 - (v.y * 0.5 + 0.5)) * size.h];
  }

  // A label is type on a stem: the stem drops from the label's baseline to
  // the vehicle roof. The label slides sideways to stay on screen while the
  // stem stays on the vehicle.
  function placeLabel(bot, x, z) {
    projected.set(x, LABEL_Y, z).project(camera);
    roofPoint.set(x, ROOF_Y, z).project(camera);
    const [sx, sy] = toScreen(projected);
    const roofY = toScreen(roofPoint)[1];
    const dist = camera.position.x - x;
    const [fadeFrom, fadeTo] = layout.fade;
    const far = 1 - clamp((dist - fadeFrom) / (fadeTo - fadeFrom), 0, 1);
    const near = clamp((size.h * 0.97 - roofY) / (size.h * 0.14), 0, 1);
    const edge = clamp(Math.min(sx, size.w - sx) / 60, 0, 1);
    let opacity = projected.z < 1 && dist > 0.5 ? far * near * edge : 0;
    // Never let a label sit on the headline or the call to action.
    if (copyRect && sx > copyRect.l && sx < copyRect.r && sy > copyRect.t && sy < copyRect.b) opacity *= 0.08;
    const scale = clamp(20 / Math.max(dist, 1), 0.86, 1.12);
    const w = (bot.width || (bot.width = bot.el.offsetWidth)) * scale;
    const h = (bot.height || (bot.height = bot.el.offsetHeight)) * scale;
    const left = w + 24 < size.w ? clamp(sx - 4 * scale, 12, size.w - w - 12) : sx;
    const stem = Math.max(6, roofY - sy);
    bot.el.style.transform = `translate3d(${left.toFixed(1)}px, ${(sy - h).toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
    bot.el.style.setProperty('--stem-x', `${((sx - left) / scale).toFixed(1)}px`);
    bot.el.style.setProperty('--stem', `${(stem / scale).toFixed(1)}px`);
    bot.el.style.zIndex = String(1000 - Math.round(dist * 10));
    return { bot, dist, opacity, l: left, r: left + w, t: sy - h, b: sy };
  }

  function flashStrip(elapsed) {
    const t = clamp((elapsed - flash.at) / FLASH_SECONDS, 0, 1);
    flashColor.copy(flash.color).lerp(stripBase, t);
    overpass.stripMat.color.copy(flashColor);
    overpass.pool.opacity = 0.22 + (1 - t) * 0.2;
  }

  // Nearest label wins; a farther label that collides with it steps back.
  function resolveLabels(placed) {
    placed.sort((a, b) => a.dist - b.dist);
    const kept = [];
    placed.forEach((p) => {
      const hit = kept.some((k) => p.l < k.r && p.r > k.l && p.t < k.b && p.b > k.t);
      const opacity = hit ? p.opacity * 0.12 : p.opacity;
      if (!hit && p.opacity > 0.3) kept.push(p);
      p.bot.el.style.opacity = opacity.toFixed(3);
    });
  }

  function render() {
    const elapsed = clock.getElapsedTime();
    const placed = [];
    bots.forEach((bot, i) => {
      const run = bot.offset + (elapsed * bot.speed) / LOOP_SECONDS + progress * SCROLL_PUSH;
      const loop = fract(run);
      const { x, inbound } = travel(loop);
      const z = inbound ? bot.laneIn : bot.laneOut;
      const isDone = !inbound || x > OVERPASS_X;
      // Crossing under the overpass on the way in: the work gets finished.
      if (inbound && bot.lastX !== null && bot.lastX <= OVERPASS_X && x > OVERPASS_X) {
        flash = { at: elapsed, color: bot.accent };
      }
      bot.lastX = inbound ? x : null;
      bot.group.position.set(x, Math.sin(elapsed * 7 + i * 2) * 0.008, z);
      bot.group.rotation.y = inbound ? 0 : Math.PI;
      updateTag(bot, i, elapsed, isDone, Math.floor(run));
      // The rail is a narrow, fixed backdrop: the HTML labels live inside
      // the hero stage and scroll out of view with it, so skip the
      // per-frame label projection work once the canvas has moved to it.
      if (!railMode) placed.push(placeLabel(bot, x, z));
    });
    if (!railMode) resolveLabels(placed);
    flashStrip(elapsed);
    renderer.render(scene, camera);
  }

  function loop() {
    running = wanted && document.visibilityState !== 'hidden';
    if (!running) return;
    render();
    requestAnimationFrame(loop);
  }

  function kick() {
    if (!running && wanted && document.visibilityState !== 'hidden') {
      running = true;
      requestAnimationFrame(loop);
    }
  }

  document.addEventListener('visibilitychange', kick);
  resize();
  if (typeof renderer.compileAsync === 'function') {
    try {
      await renderer.compileAsync(scene, camera);
    } catch (err) {
      // fall through: the first render compiles instead
    }
  }
  await yieldToMain();
  render();

  return {
    setProgress(value) {
      progress = clamp(value, 0, 1);
    },
    setVisible(next) {
      wanted = Boolean(next);
      kick();
    },
    // Total-document-scroll-driven day/night, independent of the
    // hero-local `progress` above (which only drives the traffic's
    // forward-travel effect inside the pinned stage).
    setDayProgress(value) {
      applyDayProgress(value);
    },
    // Switches the camera/renderer tuning between the full-bleed hero
    // framing and the narrow rail column once the canvas is re-parented.
    // Callers must also call resize() after the canvas's new host has laid
    // out, since this only changes which LAYOUTS profile resize() reads.
    setRailMode(next) {
      railMode = Boolean(next);
    },
    resize,
  };
}
