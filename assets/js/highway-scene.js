// Homepage hero: a divided highway at night with one overpass. Each agent
// vehicle runs a loop: it drives toward the viewer on the near carriageway
// carrying a live event tag, passes under the overpass (the tag turns into
// finished work there), leaves the frame under the camera, then drives away
// on the far carriageway still carrying its finished-work tag. Labels are
// plain type on a thin stem, projected from the vehicle every frame; no
// panels. The camera is fixed: no zoom, no push, no orbit.
//
// Motion is deliberately calm: every vehicle cruises at the same steady
// speed (so nothing ever overtakes or overlaps), lane changes are eased with
// a slight turn of the body, and time advances by a clamped frame delta so a
// slow frame or a return to the tab never makes traffic jump.
//
// Each live event lists the tools it can come from; every time the event
// comes round again its tag names the next one as a small "works with" chip
// (a monochrome Simple Icons glyph where one exists, otherwise the name only).
//
// Budget: one extruded body shared by every car, a small prefiltered room
// reflection used only by car paint and glass, additive planes for light, no
// post-processing, instancing for repeated road furniture, pixel ratio
// capped, render loop stops whenever the hero is off screen.

import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  Clock,
  Color,
  CylinderGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Fog,
  Group,
  HemisphereLight,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  SRGBColorSpace,
  Scene,
  Shape,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const LANE_WIDTH = 1.5;
// Near carriageway (toward the viewer) on +z, far carriageway (away) on -z.
const LANES_IN = [0.75, 2.25];
const LANES_OUT = [-0.75, -2.25];
const ROAD_HALF = 3.1;
const ROAD_FAR = -70;
const ROAD_NEAR = 18;
const TRAVEL_START = -62; // vehicles appear out of the fog here
const TRAVEL_SPAN = 78; // and pass under the camera at TRAVEL_START + SPAN
const LOOP_SECONDS = 38; // time for a vehicle to drive in and back out
const MAX_FRAME_SECONDS = 1 / 20; // longest step time may take in one frame
const TAG_SECONDS = 2.4;
const OVERPASS_X = -9; // the tag turns into finished work under here
const DECK_Y = 3.45; // deck centre height; clearance reads right against the cars
const ROOF_Y = 0.79;
const LABEL_Y = 1.75;
const FLASH_SECONDS = 0.9;
// Inbound lane change: every other vehicle eases across one lane over this
// stretch of road, mid-distance, where it reads clearly without crowding the
// labels near the camera.
const LANE_CHANGE_FROM = -34;
const LANE_CHANGE_TO = -18;
const LABEL_EASE = 7; // per second: how fast a label fades toward its target
const LABEL_GAP = 18; // px of clear space kept between two visible labels

const LAYOUTS = {
  wide: { fov: 30, camY: 2.3, camZ: 1.5, vx: 0.7, vy: 0.46, dpr: 1.75, fade: [36, 48], maxLabels: 3 },
  tall: { fov: 44, camY: 2.5, camZ: 0.9, vx: 0.5, vy: 0.66, dpr: 1.5, fade: [26, 36], maxLabels: 2 },
};

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

function fract(v) {
  return v - Math.floor(v);
}

// Smootherstep and its slope: zero speed and zero acceleration at both ends,
// so a lane change starts and finishes without a visible kick.
function ease(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function easeSlope(t) {
  return 30 * t * t * (1 - t) * (1 - t);
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
  const ground = new Mesh(
    new PlaneGeometry(400, 200),
    new MeshStandardMaterial({ color: 0x030b18, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  scene.add(ground);

  const length = ROAD_NEAR - ROAD_FAR;
  const midX = (ROAD_NEAR + ROAD_FAR) / 2;
  const road = new Mesh(
    new PlaneGeometry(length, ROAD_HALF * 2 + 0.8),
    new MeshStandardMaterial({ color: 0x0e1829, roughness: 0.82, metalness: 0.05 })
  );
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
  scene.add(placeInstances(new InstancedMesh(studGeo, new MeshBasicMaterial({ color: 0x8aa0b8 }), studPts.length), studPts));

  const railMat = new MeshStandardMaterial({ color: 0x64748b, roughness: 0.5, metalness: 0.6 });
  [-ROAD_HALF - 0.55, ROAD_HALF + 0.55].forEach((z) => {
    const rail = new Mesh(new BoxGeometry(length, 0.14, 0.05), railMat);
    rail.position.set(midX, 0.52, z);
    scene.add(rail);
  });
  scene.add(placeInstances(new InstancedMesh(new BoxGeometry(0.07, 0.55, 0.07), railMat, postPts.length), postPts));

  buildLamps(scene, textures);

  const sky = new Mesh(
    new PlaneGeometry(260, 34),
    new MeshBasicMaterial({ map: textures.sky, transparent: true, depthWrite: false, fog: false })
  );
  sky.rotation.y = Math.PI / 2;
  sky.position.set(ROAD_FAR - 20, 4, 0);
  scene.add(sky);
}

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
  const metal = new MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.5 });
  const poolMat = new MeshBasicMaterial({
    map: textures.radial, color: 0xffe7b8, transparent: true, opacity: 0.16, blending: AdditiveBlending, depthWrite: false,
  });
  scene.add(
    placeInstances(new InstancedMesh(new CylinderGeometry(0.05, 0.06, 4.6, 6), metal, poles.length), poles),
    placeInstances(new InstancedMesh(new BoxGeometry(0.06, 0.06, 1.6), metal, arms.length), arms),
    placeInstances(new InstancedMesh(new BoxGeometry(0.5, 0.08, 0.22), new MeshBasicMaterial({ color: 0xfff4d6 }), heads.length), heads),
    placeInstances(new InstancedMesh(new PlaneGeometry(5.5, 5.5).rotateX(-Math.PI / 2), poolMat, pools.length), pools)
  );
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

// Side profile of the car body, nose toward +x: bumper, bonnet, beltline
// and a short rear deck, with both wheel arches cut out of the sill. The
// glass house sits on top as its own, narrower extrusion.
function bodyProfile() {
  const y = 0.19;
  const s = new Shape();
  s.moveTo(-0.98, y);
  s.lineTo(-0.87, y);
  s.absarc(-0.62, y, 0.245, Math.PI, 0, true);
  s.lineTo(0.375, y);
  s.absarc(0.62, y, 0.245, Math.PI, 0, true);
  s.lineTo(0.97, y);
  s.quadraticCurveTo(1.06, y, 1.06, 0.27);
  s.lineTo(1.05, 0.34);
  s.quadraticCurveTo(1.03, 0.42, 0.9, 0.43);
  s.lineTo(0.42, 0.47);
  s.lineTo(-0.86, 0.5);
  s.quadraticCurveTo(-1.03, 0.5, -1.05, 0.42);
  s.lineTo(-1.06, 0.27);
  s.quadraticCurveTo(-1.06, y, -0.98, y);
  return s;
}

// Raked windscreen that rolls into the roof, then a fastback to the deck.
function glassProfile() {
  const s = new Shape();
  s.moveTo(0.5, 0.44);
  s.quadraticCurveTo(0.22, 0.69, 0.0, 0.72);
  s.lineTo(-0.38, 0.72);
  s.quadraticCurveTo(-0.66, 0.7, -0.92, 0.47);
  s.lineTo(0.5, 0.44);
  return s;
}

function extrude(shape, depth, bevel) {
  const geo = new ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 10,
  });
  geo.translate(0, 0, -depth / 2);
  geo.computeVertexNormals();
  return geo;
}

function sharedVehicleParts(textures, envMap) {
  return {
    radial: textures.radial,
    bodyGeo: extrude(bodyProfile(), 0.92, 0.045),
    glassGeo: extrude(glassProfile(), 0.74, 0.035),
    roofGeo: new BoxGeometry(0.48, 0.02, 0.66),
    stripeGeo: new BoxGeometry(1.46, 0.026, 1.022),
    grilleGeo: new BoxGeometry(0.02, 0.07, 0.62),
    faceGeo: new BoxGeometry(0.014, 0.1, 0.92),
    wheelGeo: new CylinderGeometry(0.19, 0.19, 0.15, 20).rotateX(Math.PI / 2),
    hubGeo: new CylinderGeometry(0.105, 0.105, 0.02, 16).rotateX(Math.PI / 2),
    headGeo: new BoxGeometry(0.02, 0.018, 0.84),
    lampGeo: new BoxGeometry(0.022, 0.06, 0.2),
    tailGeo: new BoxGeometry(0.02, 0.045, 0.94),
    beamGeo: new PlaneGeometry(3.4, 1.5).rotateX(-Math.PI / 2),
    shadowGeo: new PlaneGeometry(2.7, 1.45).rotateX(-Math.PI / 2),
    underGeo: new PlaneGeometry(2.6, 1.7).rotateX(-Math.PI / 2),
    // Pearl clearcoat: the soft room reflection gives the paint real
    // highlights along the bonnet and roof without any post-processing.
    bodyMat: new MeshPhysicalMaterial({
      color: 0xaebacb, metalness: 0.25, roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.12, envMap, envMapIntensity: 0.55,
    }),
    glassMat: new MeshPhysicalMaterial({
      color: 0x070d18, metalness: 0.5, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, envMap, envMapIntensity: 0.55,
    }),
    tireMat: new MeshStandardMaterial({ color: 0x0b0f17, roughness: 0.85 }),
    trimMat: new MeshStandardMaterial({ color: 0x0b1220, roughness: 0.5, metalness: 0.3 }),
    hubMat: new MeshStandardMaterial({ color: 0xaab6c6, roughness: 0.3, metalness: 0.8, envMap, envMapIntensity: 0.8 }),
    headMat: new MeshBasicMaterial({ color: 0xf8fbff }),
    tailMat: new MeshBasicMaterial({ color: 0xff3b4e }),
    shadowMat: new MeshBasicMaterial({ map: textures.radial, color: 0x000000, transparent: true, opacity: 0.7, depthWrite: false }),
    beamMat: new MeshBasicMaterial({
      map: textures.beam, color: 0xdff6ff, transparent: true, opacity: 0.26, blending: AdditiveBlending, depthWrite: false,
    }),
  };
}

// A car, not a token: extruded body with wheel arches, a tinted glass
// house, painted roof, four wheels with hubs, and full-width light bars.
// The agent's colour runs as a thin line along the beltline and a soft
// glow underneath, so the label's colour lands on the car it names.
function buildVehicle(color, shared) {
  const group = new Group();
  const accent = new Color(color);
  const accentMat = new MeshBasicMaterial({ color: accent });
  const parts = [
    [shared.shadowGeo, shared.shadowMat, 0, 0.009, 0],
    [shared.bodyGeo, shared.bodyMat, 0, 0, 0],
    [shared.glassGeo, shared.glassMat, 0, 0, 0],
    [shared.roofGeo, shared.bodyMat, -0.19, 0.765, 0],
    [shared.stripeGeo, accentMat, -0.08, 0.4, 0],
    [shared.grilleGeo, shared.trimMat, 1.108, 0.25, 0],
    [shared.faceGeo, shared.trimMat, 1.102, 0.345, 0],
    [shared.headGeo, shared.headMat, 1.112, 0.345, 0],
    [shared.lampGeo, shared.headMat, 1.114, 0.345, 0.35],
    [shared.lampGeo, shared.headMat, 1.114, 0.345, -0.35],
    [shared.tailGeo, shared.tailMat, -1.108, 0.4, 0],
    [shared.beamGeo, shared.beamMat, 2.8, 0.012, 0],
  ];
  [[0.62, 0.44], [0.62, -0.44], [-0.62, 0.44], [-0.62, -0.44]].forEach(([x, z]) => {
    parts.push([shared.wheelGeo, shared.tireMat, x, 0.19, z]);
    parts.push([shared.hubGeo, shared.hubMat, x, 0.19, z + Math.sign(z) * 0.075]);
  });
  parts.forEach(([geo, mat, x, y, z]) => {
    const mesh = new Mesh(geo, mat);
    mesh.position.set(x, y, z);
    group.add(mesh);
  });
  const under = new Mesh(
    shared.underGeo,
    new MeshBasicMaterial({ map: shared.radial, color: accent, transparent: true, opacity: 0.38, blending: AdditiveBlending, depthWrite: false })
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
  return Array.from(root.querySelectorAll('.hw-bot')).map((el, index) => {
    let events = [];
    let done = null;
    try {
      events = JSON.parse(el.dataset.events || '[]');
      done = JSON.parse(el.dataset.done || 'null');
    } catch (err) {
      events = [];
    }
    const lane = Math.max(0, Math.round(Number(el.dataset.lane) || 0));
    const changesLane = index % 2 === 1;
    return {
      el,
      laneIn: LANES_IN[lane % 2],
      laneInEnd: LANES_IN[(lane + (changesLane ? 1 : 0)) % 2],
      laneOut: LANES_OUT[(lane + 1) % 2],
      alpha: 0,
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
      toolName: el.querySelector('.hw-bot__toolname'),
      shown: null,
      lastX: null,
    };
  });
}

// The chip names one tool: where a live event came from, or where the
// finished work landed.
function setTool(bot, brand, sprite) {
  if (!bot.tool) return;
  const show = Boolean(brand && brand.name);
  bot.tool.hidden = !show;
  if (!show) return;
  bot.toolName.textContent = brand.name;
  const hasGlyph = Boolean(brand.glyph && sprite);
  bot.tool.classList.toggle('has-glyph', hasGlyph);
  if (hasGlyph) bot.toolGlyph.setAttribute('href', `${sprite}#b-${brand.glyph}`);
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
// outbound away from it for the second. Inbound, the lane eases from laneIn
// to laneInEnd over the lane-change stretch; yaw follows the path's slope so
// the body turns into the change and straightens out of it.
function travel(bot, loop) {
  if (loop >= 0.5) return { x: TRAVEL_START + (1 - loop) * 2 * TRAVEL_SPAN, z: bot.laneOut, yaw: Math.PI, inbound: false };
  const x = TRAVEL_START + loop * 2 * TRAVEL_SPAN;
  const span = LANE_CHANGE_TO - LANE_CHANGE_FROM;
  const u = clamp((x - LANE_CHANGE_FROM) / span, 0, 1);
  const shift = bot.laneInEnd - bot.laneIn;
  const z = bot.laneIn + shift * ease(u);
  const yaw = -Math.atan((shift * easeSlope(u)) / span);
  return { x, z, yaw, inbound: true };
}

// Give the main thread back between build stages so no single task runs long.
function yieldToMain() {
  if (window.scheduler && typeof window.scheduler.yield === 'function') return window.scheduler.yield();
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// A small prefiltered studio reflection for car paint, glass and hubs only.
// It is never set as the scene environment, so the road keeps its night look.
function carReflections(renderer) {
  try {
    const pmrem = new PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const map = pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    pmrem.dispose();
    return map;
  } catch (err) {
    return null; // paint falls back to lights only
  }
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
  // Cool key from above and to the side, a low rim from the horizon: the cars
  // pick up a bright edge along roof and bonnet.
  scene.add(new HemisphereLight(0x35607f, 0x020617, 1.05));
  const key = new DirectionalLight(0xdbe8f7, 1.6);
  key.position.set(8, 12, 16); // from the side and above, so front, side and roof read as separate planes
  const rim = new DirectionalLight(0xcfe9ff, 0.9);
  rim.position.set(-60, 1.2, -6); // low from the horizon: a cool edge on the cars, a wet sheen on the road
  const fill = new DirectionalLight(0x9fdcf0, 0.6);
  fill.position.set(30, 3, -4);
  scene.add(key, rim, fill);

  const textures = { radial: radialTexture(), beam: beamTexture(), sky: skyTexture() };
  await yieldToMain();
  buildRoad(scene, textures);
  const overpass = buildOverpass(scene, textures);
  const stripBase = new Color(0x22d3ee);
  const flashColor = new Color();
  let flash = { at: -10, color: stripBase };
  await yieldToMain();

  const envMap = carReflections(renderer);
  const shared = sharedVehicleParts(textures, envMap);
  const bots = readBots(root);
  const brands = readBrands(root);
  const sprite = root.dataset.brandSprite || '';
  bots.forEach((bot) => {
    bot.group = buildVehicle(bot.color, shared).group;
    bot.accent = new Color(bot.color);
    scene.add(bot.group);
  });
  await yieldToMain();

  const camera = new PerspectiveCamera(36, 1, 0.1, 160);
  const copyEl = root.querySelector('[data-hw-copy]');
  const projected = new Vector3();
  const roofPoint = new Vector3();
  const clock = new Clock();
  let time = 0; // scene time: advances by a clamped delta, never jumps
  let layout = LAYOUTS.wide;
  let copyRect = null;
  let wanted = false;
  let running = false;
  let size = { w: 1, h: 1 };

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    size = { w, h };
    bots.forEach((bot) => { bot.width = 0; bot.height = 0; });
    layout = w / h >= 1 ? LAYOUTS.wide : LAYOUTS.tall;
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
    const stage = canvas.getBoundingClientRect();
    const r = copyEl ? copyEl.getBoundingClientRect() : null;
    copyRect = r ? { l: r.left - stage.left - 16, t: r.top - stage.top - 16, r: r.right - stage.left + 16, b: r.bottom - stage.top + 16 } : null;
  }

  // Live events cycle on the way in; past the overpass the tag is the
  // finished work, and it stays that way on the way back out. Each pass
  // through the event list moves every event's chip on to its next tool,
  // and each loop moves the finished work's chip on to its next tool.
  function updateTag(bot, i, isDone, lap) {
    const count = Math.max(1, bot.events.length);
    const tick = Math.floor(time / TAG_SECONDS + i * 0.37);
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
  // stem stays on the vehicle. Type never scales with distance: it stays at
  // its set size so it reads, instead of swimming.
  function placeLabel(bot, x, z) {
    projected.set(x, LABEL_Y, z).project(camera);
    roofPoint.set(x, ROOF_Y, z).project(camera);
    const [sx, sy] = toScreen(projected);
    const roofY = toScreen(roofPoint)[1];
    const dist = camera.position.x - x;
    const [fadeFrom, fadeTo] = layout.fade;
    const far = 1 - clamp((dist - fadeFrom) / (fadeTo - fadeFrom), 0, 1);
    const near = clamp((size.h * 0.93 - roofY) / (size.h * 0.14), 0, 1);
    const edge = clamp(Math.min(sx, size.w - sx) / 60, 0, 1);
    let target = projected.z < 1 && dist > 0.5 ? far * near * edge : 0;
    // Never let a label sit on the headline or the call to action.
    if (copyRect && sx > copyRect.l && sx < copyRect.r && sy > copyRect.t && sy < copyRect.b) target = 0;
    const w = bot.width || (bot.width = bot.el.offsetWidth);
    const h = bot.height || (bot.height = bot.el.offsetHeight);
    const left = w + 24 < size.w ? clamp(sx - 6, 12, size.w - w - 12) : sx;
    const stem = Math.max(6, roofY - sy);
    bot.el.style.transform = `translate3d(${left.toFixed(1)}px, ${(sy - h).toFixed(1)}px, 0)`;
    bot.el.style.setProperty('--stem-x', `${(sx - left).toFixed(1)}px`);
    bot.el.style.setProperty('--stem', `${stem.toFixed(1)}px`);
    bot.el.style.zIndex = String(1000 - Math.round(dist * 10));
    return { bot, dist, target, l: left, r: left + w, t: sy - h, b: sy + stem };
  }

  function flashStrip() {
    const t = clamp((time - flash.at) / FLASH_SECONDS, 0, 1);
    flashColor.copy(flash.color).lerp(stripBase, ease(t));
    overpass.stripMat.color.copy(flashColor);
    overpass.pool.opacity = 0.2 + (1 - ease(t)) * 0.18;
  }

  // Nearest label wins. A farther label that would collide with it, or one
  // past the layout's label budget, fades out completely: no ghost text.
  // Every label eases toward its target, so nothing pops in or out.
  function resolveLabels(placed, dt) {
    placed.sort((a, b) => a.dist - b.dist);
    const kept = [];
    const kIn = 1 - Math.exp(-dt * LABEL_EASE);
    const kOut = 1 - Math.exp(-dt * LABEL_EASE * 2.5); // step back quickly
    placed.forEach((p) => {
      const hit = kept.some((q) => p.l < q.r + LABEL_GAP && p.r + LABEL_GAP > q.l && p.t < q.b + LABEL_GAP && p.b + LABEL_GAP > q.t);
      const target = hit || kept.length >= layout.maxLabels ? 0 : p.target;
      if (target > 0.05) kept.push(p);
      p.bot.alpha += (target - p.bot.alpha) * (target < p.bot.alpha ? kOut : kIn);
      p.bot.el.style.opacity = p.bot.alpha < 0.01 ? '0' : p.bot.alpha.toFixed(3);
    });
  }

  function render() {
    const dt = Math.min(clock.getDelta(), MAX_FRAME_SECONDS);
    time += dt;
    const placed = bots.map((bot, i) => {
      const run = bot.offset + (time * bot.speed) / LOOP_SECONDS;
      const { x, z, yaw, inbound } = travel(bot, fract(run));
      const isDone = !inbound || x > OVERPASS_X;
      // Crossing under the overpass on the way in: the work gets finished.
      if (inbound && bot.lastX !== null && bot.lastX <= OVERPASS_X && x > OVERPASS_X) {
        flash = { at: time, color: bot.accent };
      }
      bot.lastX = inbound ? x : null;
      bot.group.position.set(x, 0, z);
      bot.group.rotation.y = yaw;
      updateTag(bot, i, isDone, Math.floor(run));
      return placeLabel(bot, x, z);
    });
    resolveLabels(placed, dt);
    flashStrip();
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
      clock.getDelta(); // drop the time spent paused
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
    // Scroll drives the step rail only. Traffic keeps one steady speed.
    setProgress() {},
    setVisible(next) {
      wanted = Boolean(next);
      kick();
    },
    resize,
  };
}
