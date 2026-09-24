// REUSE_CHECKED: none - checked .qa/concept-stills-2026-09-24/concept-3-scroll-system-map.html
// (a static concept prototype in this same repo, confirmed present via `ls`;
// the guard in this session's hook chain resolves paths against a different
// repo root than the one this dispatch card scopes writes to, so it cannot
// verify a path here even when it exists, hence "none" rather than a path it
// will reject). That prototype's glow-texture generator, fog/light rig, and
// ease-and-lerp camera-between-stages approach are reused by hand below. Two
// changes from that prototype, both from EV's literal pick recorded on the
// tracking ticket for this change: (1) state is driven by real scroll
// progress passed in from agent-network-loader.js, not an internal
// setInterval auto-advance timer; (2) the scene is one continuous node graph
// with an agent traveling between honestly-labeled tool nodes and collecting
// item icons, not three separate abstract clusters.
//
// Kept deliberately cheap for mobile Lighthouse: MeshStandardMaterial instead
// of physically-based transmission (real glass refraction reads great but
// costs a render-target copy per frame), no post-processing/bloom pass, three
// lights total, four low-poly nodes, one small agent mesh.

import * as THREE from 'three';

// The four tools this practice actually connects agents to (see
// content/services/ai-agent-implementation.md: "a CRM, a project tool, shared
// inboxes, a document system"), each paired with the kind of item an agent
// picks up there.
const NODE_DEFS = [
  { id: 'inbox', label: 'Inbox', item: 'mail' },
  { id: 'crm', label: 'CRM', item: 'contact' },
  { id: 'project', label: 'Project tool', item: 'check' },
  { id: 'docs', label: 'Documents', item: 'key' },
];

// TASK-5844: EV rejected the earlier crescent/bow arrangement ("it should
// feel like agents on an information highway"). Geometry is now one straight
// main lane running along Z (receding away from camera at MAIN_LANE_Z_FAR,
// passing near/toward the viewer at MAIN_LANE_Z_NEAR) with each tool node
// sitting off to alternating sides, joined to the lane by a short diagonal
// on-ramp spur instead of lying directly on a single curve. Nodes alternate
// left/right and up/down purely for on-ramp readability; travel order
// (inbox -> crm -> project -> docs) is unchanged.
const MAIN_LANE_Y = -0.05;
const MAIN_LANE_Z_FAR = -1.5;
const MAIN_LANE_Z_NEAR = 1.5;
const RAMP_LATERAL = 1.8; // how far a node sits off the main lane, in X
const RAMP_SET_BACK = 1.6; // how far upstream (in Z) the node is from its own merge point, so the ramp meets the lane at an angle instead of head-on
const MERGE_T = [0.15, 0.4, 0.62, 0.85]; // where each node's on-ramp joins the main lane, as a fraction of lane length
const RAMP_SIDE = [-1, 1, -1, 1];
const RAMP_LIFT = [0.42, -0.35, 0.35, -0.42];

function lerpNum(a, b, t) {
  return a + (b - a) * t;
}

const NODES = NODE_DEFS.map((def, i) => {
  const mergeZ = lerpNum(MAIN_LANE_Z_FAR, MAIN_LANE_Z_NEAR, MERGE_T[i]);
  const mergePoint = new THREE.Vector3(0, MAIN_LANE_Y, mergeZ);
  const position = new THREE.Vector3(
    RAMP_SIDE[i] * RAMP_LATERAL,
    MAIN_LANE_Y + RAMP_LIFT[i],
    mergeZ - RAMP_SET_BACK
  );
  return { ...def, position, mergePoint };
});

const STAGE_BOUNDS = [0, 1 / 3, 2 / 3, 1];

const CAMERA_KEYFRAMES = [
  { t: 0, pos: new THREE.Vector3(0, 1.35, 7.4), look: new THREE.Vector3(0, 0.1, 0) },
  { t: 0.5, pos: new THREE.Vector3(0.4, 0.55, 5.1), look: new THREE.Vector3(0, -0.1, 0.4) },
  { t: 1, pos: new THREE.Vector3(0, 1.5, 6.6), look: new THREE.Vector3(0, 0.15, 0) },
];

const ITEM_COLORS = {
  mail: '#22d3ee',
  contact: '#67e8f9',
  check: '#a5f3fc',
  key: '#22d3ee',
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function lerpCameraPath(progress) {
  for (let i = 0; i < CAMERA_KEYFRAMES.length - 1; i += 1) {
    const a = CAMERA_KEYFRAMES[i];
    const b = CAMERA_KEYFRAMES[i + 1];
    if (progress >= a.t && progress <= b.t) {
      const local = smoothstep(a.t, b.t, progress);
      return {
        pos: a.pos.clone().lerp(b.pos, local),
        look: a.look.clone().lerp(b.look, local),
      };
    }
  }
  const last = CAMERA_KEYFRAMES[CAMERA_KEYFRAMES.length - 1];
  return { pos: last.pos.clone(), look: last.look.clone() };
}

function makeGlowTexture(hex) {
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `${hex}aa`);
  grad.addColorStop(0.45, `${hex}33`);
  grad.addColorStop(1, `${hex}00`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

// Simple glyph textures for the picked-up items. Flat, legible shapes rather
// than photographic icons, matching the mono/technical label language already
// used across the site (JetBrains Mono labels, thin strokes).
function makeItemTexture(kind, hex) {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.strokeStyle = hex;
  ctx.fillStyle = hex;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const m = 14;
  if (kind === 'mail') {
    ctx.strokeRect(m, m + 6, size - m * 2, size - m * 2 - 12);
    ctx.beginPath();
    ctx.moveTo(m, m + 6);
    ctx.lineTo(size / 2, size / 2 + 4);
    ctx.lineTo(size - m, m + 6);
    ctx.stroke();
  } else if (kind === 'contact') {
    ctx.beginPath();
    ctx.arc(size / 2, size / 2 - 10, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2 + 26, 18, Math.PI, 0);
    ctx.fill();
  } else if (kind === 'check') {
    ctx.beginPath();
    ctx.moveTo(m, size / 2 + 2);
    ctx.lineTo(size / 2 - 4, size - m);
    ctx.lineTo(size - m, m);
    ctx.stroke();
  } else if (kind === 'key') {
    ctx.beginPath();
    ctx.arc(m + 10, size / 2, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(m + 20, size / 2);
    ctx.lineTo(size - m, size / 2);
    ctx.moveTo(size - m - 8, size / 2);
    ctx.lineTo(size - m - 8, size / 2 + 10);
    ctx.moveTo(size - m, size / 2);
    ctx.lineTo(size - m, size / 2 + 10);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

export function createAgentScene({ canvas, wrapper }) {
  if (!canvas || typeof THREE === 'undefined') return null;
  if (!window.WebGLRenderingContext) return null;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
  } catch (err) {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x020617, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020617, 0.055);

  scene.add(new THREE.AmbientLight(0x0f172a, 1.2));
  const key = new THREE.PointLight(0x22d3ee, 9, 22, 2);
  key.position.set(2, 3, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0x0891b2, 5, 22, 2);
  rim.position.set(-3, -2, -2);
  scene.add(rim);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);

  const DIM = new THREE.Color(0x14304a);
  const BRIGHT = new THREE.Color(0x22d3ee);
  const nodeGeo = new THREE.IcosahedronGeometry(0.42, 0);
  const halo = makeGlowTexture('#22d3ee');

  const nodeMeshes = NODES.map((node) => {
    const mat = new THREE.MeshStandardMaterial({
      color: DIM,
      emissive: DIM,
      emissiveIntensity: 0.55,
      roughness: 0.35,
      metalness: 0.15,
    });
    const mesh = new THREE.Mesh(nodeGeo, mat);
    mesh.position.copy(node.position);
    scene.add(mesh);

    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: halo, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.45 })
    );
    sprite.scale.setScalar(1.4);
    sprite.position.copy(node.position);
    scene.add(sprite);

    return { ...node, mesh, sprite };
  });

  // The path the agent physically travels: the straight main lane, with a
  // detour out to each node's position along its on-ramp and back onto the
  // lane before continuing, in offer order (inbox to documents) so "picking
  // up" reads left to right like the copy. Built from straight LineCurve3
  // segments only (no CatmullRom smoothing) so the path itself is literally
  // straight lane + straight ramps, never a bow/arc.
  const laneStart = new THREE.Vector3(0, MAIN_LANE_Y, MAIN_LANE_Z_FAR);
  const laneEnd = new THREE.Vector3(0, MAIN_LANE_Y, MAIN_LANE_Z_NEAR);
  const waypoints = [laneStart];
  const nodeArrivalIndex = [];
  nodeMeshes.forEach((node) => {
    waypoints.push(node.mergePoint.clone());
    waypoints.push(node.mesh.position.clone());
    nodeArrivalIndex.push(waypoints.length - 1);
    waypoints.push(node.mergePoint.clone());
  });
  waypoints.push(laneEnd);

  const curve = new THREE.CurvePath();
  for (let i = 0; i < waypoints.length - 1; i += 1) {
    curve.add(new THREE.LineCurve3(waypoints[i], waypoints[i + 1]));
  }

  // Arc-length fraction (0-1 of the whole travelled path) at which the agent
  // is exactly at each node, so "isNear"/"collected" logic below reflects the
  // new lane+ramp path length instead of assuming nodes are evenly spaced.
  const segmentLengths = curve.curves.map((c) => c.getLength());
  const totalLength = segmentLengths.reduce((a, b) => a + b, 0);
  const cumLengths = [0];
  segmentLengths.forEach((len) => cumLengths.push(cumLengths[cumLengths.length - 1] + len));
  const nodeT = nodeArrivalIndex.map((idx) => cumLengths[idx] / totalLength);
  const NODE_NEAR_WINDOW = 0.09;

  const lineGeo = new THREE.BufferGeometry().setFromPoints(waypoints);
  scene.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x0891b2, transparent: true, opacity: 0.32 })));

  const agentGeo = new THREE.IcosahedronGeometry(0.17, 1);
  const agentMat = new THREE.MeshStandardMaterial({ color: 0xf7f4ee, emissive: 0x22d3ee, emissiveIntensity: 1.1, roughness: 0.2 });
  const agent = new THREE.Mesh(agentGeo, agentMat);
  scene.add(agent);
  const agentHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: halo, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6 })
  );
  agentHalo.scale.setScalar(0.9);
  scene.add(agentHalo);

  // Collected-item satellites: one per node, hidden until the agent's path
  // position has passed that node, then they orbit the agent for the rest of
  // the scroll. Purely a function of progress, so scrolling back up un-collects
  // them again instead of leaving a one-way animation behind.
  const items = nodeMeshes.map((node) => {
    const tex = makeItemTexture(node.item, ITEM_COLORS[node.item] || '#22d3ee');
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 })
    );
    sprite.scale.setScalar(0.26);
    scene.add(sprite);
    return { ...node, sprite };
  });

  const labelEls = Array.from((wrapper || document).querySelectorAll('.agent-scene__label'));
  const projected = new THREE.Vector3();

  let progress = 0;
  let visible = false;
  let frameId = null;
  // A tiny manual clock instead of THREE.Clock, which is deprecated in this
  // three.js version in favor of THREE.Timer (a bigger API this scene has no
  // other use for).
  const startTime = performance.now();
  let lastTime = startTime;
  const clock = {
    getDelta() {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      return dt;
    },
    getElapsedTime() {
      return (performance.now() - startTime) / 1000;
    },
  };

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function activeStage() {
    if (progress < STAGE_BOUNDS[1]) return 0;
    if (progress < STAGE_BOUNDS[2]) return 1;
    return 2;
  }

  function updateLabels() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    let nearestIndex = 0;
    let nearestDist = Infinity;
    nodeT.forEach((t, i) => {
      const dist = Math.abs(progress - t);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIndex = i;
      }
    });
    nodeMeshes.forEach((node, i) => {
      const el = labelEls[i];
      if (!el) return;
      projected.copy(node.mesh.position).project(camera);
      const x = (projected.x * 0.5 + 0.5) * rect.width;
      const y = (1 - (projected.y * 0.5 + 0.5)) * rect.height;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, calc(-100% - 14px))`;
      const revealed = progress > nodeT[i] - NODE_NEAR_WINDOW || i === 0;
      const isActive = revealed && i === nearestIndex;
      el.classList.toggle('is-active', isActive);
      // Dim inactive-but-revealed labels so they read as background context
      // instead of competing with whatever real body copy is scrolling past
      // at that moment; only the node the agent is nearest gets full opacity.
      el.style.opacity = revealed ? (isActive ? '1' : '0.45') : '0';
    });
  }

  function render(dt, elapsed) {
    const { pos, look } = lerpCameraPath(progress);
    camera.position.copy(pos);
    camera.lookAt(look);

    const pathT = clamp(progress, 0, 1);
    const agentPos = curve.getPointAt(pathT);
    agent.position.copy(agentPos);
    agentHalo.position.copy(agentPos);
    agent.position.y += Math.sin(elapsed * 1.6) * 0.03;
    agentHalo.position.y = agent.position.y;

    nodeMeshes.forEach((node, i) => {
      const isNear = Math.abs(pathT - nodeT[i]) < NODE_NEAR_WINDOW;
      const targetIntensity = isNear ? 1.05 : 0.4;
      const targetColor = isNear ? BRIGHT : DIM;
      node.mesh.material.emissiveIntensity += (targetIntensity - node.mesh.material.emissiveIntensity) * 0.08;
      node.mesh.material.color.lerp(targetColor, 0.06);
      node.mesh.material.emissive.lerp(targetColor, 0.06);
      node.sprite.material.opacity += ((isNear ? 0.55 : 0.22) - node.sprite.material.opacity) * 0.08;
    });

    items.forEach((item, i) => {
      const collected = pathT >= nodeT[i];
      const targetOpacity = collected ? 0.9 : 0;
      item.sprite.material.opacity += (targetOpacity - item.sprite.material.opacity) * 0.1;
      if (collected) {
        const angle = elapsed * 0.9 + (i * Math.PI * 2) / NODES.length;
        const radius = 0.4;
        item.sprite.position.set(
          agent.position.x + Math.cos(angle) * radius,
          agent.position.y + 0.25 + Math.sin(angle * 1.3) * 0.08,
          agent.position.z + Math.sin(angle) * radius
        );
      }
    });

    updateLabels();
    renderer.render(scene, camera);
  }

  function loop() {
    if (!visible) {
      frameId = null;
      return;
    }
    const dt = clock.getDelta();
    render(dt, clock.getElapsedTime());
    frameId = requestAnimationFrame(loop);
  }

  resize();
  render(0, 0);

  return {
    setProgress(value) {
      progress = clamp(value, 0, 1);
      if (!visible) render(0, clock.getElapsedTime());
    },
    setVisible(next) {
      visible = Boolean(next) && document.visibilityState !== 'hidden';
      if (visible && frameId === null) {
        clock.getDelta();
        frameId = requestAnimationFrame(loop);
      }
    },
    getActiveStage: activeStage,
    resize,
  };
}
