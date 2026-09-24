// Homepage hero: a literal highway at night. Four lanes with dashed lane
// markings, solid edge lines, guardrails, street lamps and one overhead sign
// gantry. Agent vehicles drive toward the viewer; each carries an HTML
// header (name and job) and a live event tag with its tool icon, projected
// from the vehicle every frame. The camera is fixed: no zoom, no push, no
// orbit. Traffic cruises continuously; scroll adds forward travel and moves
// the tags from live events to finished work.
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
  Vector3,
  WebGLRenderer,
} from 'three';

const LANE_WIDTH = 1.5;
const LANE_Z = [-2.25, -0.75, 0.75, 2.25];
const ROAD_HALF = 3.1;
const ROAD_FAR = -70;
const ROAD_NEAR = 16;
const TRAVEL_START = -62; // vehicles appear out of the fog here
const TRAVEL_SPAN = 76; // and leave under the camera at TRAVEL_START + SPAN
const LOOP_SECONDS = 26; // time for a speed-1 vehicle to cover the span
const SCROLL_PUSH = 0.55; // extra loops added across the full hero scroll
const TAG_SECONDS = 2.6;
const DONE_AT = 0.75;
const LABEL_LIFT = 1.35;

const LAYOUTS = {
  wide: { fov: 30, camY: 2.4, camZ: 2.2, vx: 0.72, vy: 0.44, dpr: 1.75, fade: [26, 36] },
  tall: { fov: 44, camY: 3.0, camZ: 0.3, vx: 0.5, vy: 0.64, dpr: 1.25, fade: [18, 26] },
};

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

function fract(v) {
  return v - Math.floor(v);
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
  return canvasTexture((g, w, h) => {
    const lin = g.createLinearGradient(0, 0, 0, h);
    lin.addColorStop(0, 'rgba(2,6,23,0)');
    lin.addColorStop(0.55, 'rgba(14,116,144,0.55)');
    lin.addColorStop(0.62, 'rgba(34,211,238,0.35)');
    lin.addColorStop(1, 'rgba(2,6,23,0)');
    g.fillStyle = lin;
    g.fillRect(0, 0, w, h);
  }, 8, 256);
}

function signTexture(lines, arrow) {
  return canvasTexture((g, w, h) => {
    g.fillStyle = '#0b4f63';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#f7f4ee';
    g.lineWidth = 6;
    g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#f7f4ee';
    g.textBaseline = 'middle';
    g.font = '600 58px "General Sans", "Instrument Sans", sans-serif';
    g.fillText(lines[0], 40, h * 0.36);
    g.font = '500 38px "Instrument Sans", sans-serif';
    g.fillText(lines[1], 40, h * 0.7);
    g.font = '700 84px sans-serif';
    g.textAlign = 'right';
    g.fillText(arrow, w - 36, h * 0.52);
  }, 512, 192);
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
  [-LANE_WIDTH, 0, LANE_WIDTH].forEach((z) => {
    for (let x = ROAD_FAR; x < ROAD_NEAR; x += 6.4) dashPts.push([x, 0.006, z]);
  });
  const dashGeo = new PlaneGeometry(2.4, 0.09).rotateX(-Math.PI / 2);
  scene.add(placeInstances(new InstancedMesh(dashGeo, paint, dashPts.length), dashPts));

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

  buildLamps(scene, textures);
  buildGantry(scene);

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

function buildGantry(scene) {
  const x = -14;
  const metal = new MeshStandardMaterial({ color: 0x475569, roughness: 0.5, metalness: 0.6 });
  [-1, 1].forEach((side) => {
    const post = new Mesh(new BoxGeometry(0.22, 5.2, 0.22), metal);
    post.position.set(x, 2.6, side * (ROAD_HALF + 0.9));
    scene.add(post);
  });
  const beam = new Mesh(new BoxGeometry(0.3, 0.3, ROAD_HALF * 2 + 2), metal);
  beam.position.set(x, 5.05, 0);
  scene.add(beam);
  [
    { z: 1.55, tex: signTexture(['Your tools', 'Email, CRM, tasks'], '↓') },
    { z: -1.55, tex: signTexture(['Finished work', 'Next exit'], '↗') },
  ].forEach(({ z, tex }) => {
    const plate = new Mesh(new PlaneGeometry(2.8, 1.05), new MeshBasicMaterial({ map: tex }));
    plate.rotation.y = Math.PI / 2;
    plate.position.set(x + 0.2, 4.35, z);
    scene.add(plate);
  });
}

function sharedVehicleParts(textures) {
  return {
    radial: textures.radial,
    bodyGeo: new BoxGeometry(1.9, 0.38, 0.92),
    cabinGeo: new BoxGeometry(1.05, 0.3, 0.8),
    stripeGeo: new BoxGeometry(1.92, 0.05, 0.94),
    beaconGeo: new CylinderGeometry(0.1, 0.12, 0.1, 12),
    lightGeo: new BoxGeometry(0.04, 0.07, 0.8),
    wheelGeo: new CylinderGeometry(0.2, 0.2, 0.16, 12).rotateX(Math.PI / 2),
    beamGeo: new PlaneGeometry(3.4, 1.5).rotateX(-Math.PI / 2),
    underGeo: new PlaneGeometry(2.8, 1.8).rotateX(-Math.PI / 2),
    bodyMat: new MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.35 }),
    glassMat: new MeshStandardMaterial({ color: 0x0f1d33, roughness: 0.15, metalness: 0.8 }),
    tireMat: new MeshStandardMaterial({ color: 0x0b0f17, roughness: 0.9 }),
    headMat: new MeshBasicMaterial({ color: 0xffffff }),
    beamMat: new MeshBasicMaterial({
      map: textures.beam, color: 0xdff6ff, transparent: true, opacity: 0.32, blending: AdditiveBlending, depthWrite: false,
    }),
  };
}

function buildVehicle(color, shared) {
  const group = new Group();
  const accent = new Color(color);
  const accentMat = new MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.9 });
  const parts = [
    [shared.bodyGeo, shared.bodyMat, 0, 0.36],
    [shared.cabinGeo, shared.glassMat, -0.12, 0.68],
    [shared.stripeGeo, accentMat, 0, 0.42],
    [shared.beaconGeo, accentMat, -0.12, 0.9], // roof sensor: reads as a self-driving bot
    [shared.lightGeo, shared.headMat, 0.96, 0.4],
    [shared.beamGeo, shared.beamMat, 2.6, 0.012],
  ];
  parts.forEach(([geo, mat, x, y]) => {
    const mesh = new Mesh(geo, mat);
    mesh.position.set(x, y, 0);
    group.add(mesh);
  });
  const under = new Mesh(
    shared.underGeo,
    new MeshBasicMaterial({ map: shared.radial, color: accent, transparent: true, opacity: 0.7, blending: AdditiveBlending, depthWrite: false })
  );
  under.position.y = 0.011;
  group.add(under);
  const wheels = [[0.6, 0.44], [0.6, -0.44], [-0.6, 0.44], [-0.6, -0.44]].map(([wx, wz]) => {
    const wheel = new Mesh(shared.wheelGeo, shared.tireMat);
    wheel.position.set(wx, 0.2, wz);
    group.add(wheel);
    return wheel;
  });
  return { group, wheels };
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
    return {
      el,
      lane: clamp(Number(el.dataset.lane) || 0, 0, LANE_Z.length - 1),
      offset: Number(el.dataset.offset) || 0,
      speed: Number(el.dataset.speed) || 1,
      color: el.dataset.color || '#22d3ee',
      events,
      done,
      icon: el.querySelector('.hw-bot__icon use'),
      text: el.querySelector('.hw-bot__text'),
      tag: el.querySelector('.hw-bot__tag'),
      shown: null,
    };
  });
}

function setTag(bot, item, isDone) {
  if (!item || !bot.icon || !bot.text) return;
  bot.icon.setAttribute('href', `#i-${item.icon}`);
  bot.text.textContent = item.text;
  bot.el.classList.toggle('is-done', isDone);
  bot.tag.classList.remove('is-swap');
  void bot.tag.offsetWidth; // restart the pop animation
  bot.tag.classList.add('is-swap');
  bot.width = 0; // tag text changed, re-measure
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
  scene.add(new HemisphereLight(0x3b6a8f, 0x020617, 1.3));
  const moon = new DirectionalLight(0xbcd3ee, 1.4);
  moon.position.set(12, 10, 6);
  const fill = new DirectionalLight(0x9fdcf0, 0.9);
  fill.position.set(30, 3, -4);
  scene.add(moon, fill);

  const textures = { radial: radialTexture(), beam: beamTexture(), sky: skyTexture() };
  await yieldToMain();
  buildRoad(scene, textures);
  await yieldToMain();

  const shared = sharedVehicleParts(textures);
  const bots = readBots(root);
  bots.forEach((bot) => {
    const v = buildVehicle(bot.color, shared);
    bot.group = v.group;
    bot.wheels = v.wheels;
    bot.group.position.z = LANE_Z[bot.lane];
    scene.add(bot.group);
  });
  await yieldToMain();

  const camera = new PerspectiveCamera(36, 1, 0.1, 160);
  const copyEl = root.querySelector('[data-hw-copy]');
  const projected = new Vector3();
  const clock = new Clock();
  let layout = LAYOUTS.wide;
  let copyRect = null;
  let progress = 0;
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

  function updateTag(bot, i, elapsed) {
    const isDone = progress >= DONE_AT;
    const count = Math.max(1, bot.events.length);
    const slot = isDone ? 'done' : Math.floor(elapsed / TAG_SECONDS + i * 0.37) % count;
    if (slot === bot.shown) return;
    bot.shown = slot;
    setTag(bot, isDone ? bot.done : bot.events[slot], isDone);
  }

  function placeLabel(bot, x) {
    projected.set(x, LABEL_LIFT, bot.group.position.z).project(camera);
    const sx = (projected.x * 0.5 + 0.5) * size.w;
    const sy = (1 - (projected.y * 0.5 + 0.5)) * size.h;
    const dist = camera.position.x - x;
    const [fadeFrom, fadeTo] = layout.fade;
    const far = 1 - clamp((dist - fadeFrom) / (fadeTo - fadeFrom), 0, 1);
    const near = clamp((size.h * 0.97 - sy) / (size.h * 0.12), 0, 1);
    const edge = clamp(Math.min(sx, size.w - sx) / 80, 0, 1); // fade as the car leaves the frame
    let opacity = projected.z < 1 ? far * near * edge : 0;
    // Never let a label sit on the headline or the call to action.
    if (copyRect && sx > copyRect.l && sx < copyRect.r && sy > copyRect.t && sy < copyRect.b) opacity *= 0.1;
    const scale = clamp(13 / Math.max(dist, 1), 0.62, 1.08);
    // Keep the whole label on screen at narrow widths.
    const half = ((bot.width || (bot.width = bot.el.offsetWidth)) * scale) / 2 + 8;
    const cx = half * 2 < size.w ? clamp(sx, half, size.w - half) : sx;
    bot.el.style.transform = `translate3d(${cx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -100%) scale(${scale.toFixed(3)})`;
    bot.el.style.zIndex = String(1000 - Math.round(dist * 10));
    const tall = (bot.height || (bot.height = bot.el.offsetHeight)) * scale;
    return { bot, dist, opacity, l: cx - half + 8, r: cx + half - 8, t: sy - tall, b: sy };
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
    const placed = bots.map((bot, i) => {
      const loop = fract(bot.offset + (elapsed * bot.speed) / LOOP_SECONDS + progress * SCROLL_PUSH);
      const x = TRAVEL_START + loop * TRAVEL_SPAN;
      bot.group.position.x = x;
      bot.group.position.y = Math.sin(elapsed * 7 + i * 2) * 0.008;
      bot.wheels.forEach((wheel) => { wheel.rotation.z = -elapsed * 9 * bot.speed; });
      updateTag(bot, i, elapsed);
      return placeLabel(bot, x);
    });
    resolveLabels(placed);
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
    resize,
  };
}
