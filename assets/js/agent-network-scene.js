// REUSE_CHECKED: this repo's own agent-network-scene.js (pre-TASK-5844-rework
// version; see git history, commit 138302a and earlier on this branch).
//
// TASK-5844 finish-gate rework: EV's "still looks cheap" review (7 points,
// plus a follow-up reference note pointing at AggLayer Visualizer-style
// "nodes with messages moving between them, restrained, hover-quality") asked
// for the 3D story to be one idea - agents passing tasks/tools/messages to
// EACH OTHER - not one courier agent visiting four static tool-icon nodes.
// It also asked to cut repetitive back-and-forth slide motion and add a
// sustained, continuous flowing feel instead of scroll-gated bursts.
//
// Kept from the prior build: the straight main-lane + diagonal on-ramp
// geometry (EV's literal "information highway" pick, unchanged below), the
// lazy-load/reduced-motion contract in agent-network-loader.js, and the
// rendering budget (MeshStandardMaterial, no post-processing/bloom, capped
// pixel ratio, pause-when-offscreen via the second IntersectionObserver in
// the loader).
//
// Changed: the four lane nodes are now framed as four named agents (still
// honestly tied to the real tools this practice connects to), each handing a
// task/tool/message glyph directly to the next agent in sequence as the
// visitor scrolls - one handoff in flight at a time, never four in a row from
// a single roaming mesh. The single always-visible courier agent + its
// orbiting collected-items are gone; that repeated ramp-out-and-back trip was
// the literal "slides back and forth, looks repetitive" the finish-gate
// review flagged. A small set of dim ambient points now streams the length
// of the shared lane continuously, independent of scroll, for the sustained
// "keeps moving" feel EV asked for. The camera keeps its scroll-driven path
// but gains a tiny, slow idle drift so the scene never reads as fully frozen
// between scroll events.

import * as THREE from 'three';

// Four agents this practice actually builds, each named for the real tool it
// plugs into (see content/services/ai-agent-implementation.md: "a CRM, a
// project tool, shared inboxes, a document system") so the visual stays
// honest rather than becoming four generic unlabeled dots. "item" is the
// glyph each agent hands to the next: a message, a contact record, a
// completed check, and an access key, in that handoff order.
const NODE_DEFS = [
  { id: 'inbox', label: 'Inbox agent', item: 'mail' },
  { id: 'crm', label: 'CRM agent', item: 'contact' },
  { id: 'project', label: 'Project agent', item: 'check' },
  { id: 'docs', label: 'Docs agent', item: 'key' },
];

// TASK-5844: EV rejected the earlier crescent/bow arrangement ("it should
// feel like agents on an information highway"). Geometry is UNCHANGED by this
// rework: one straight main lane running along Z (receding away from camera
// at MAIN_LANE_Z_FAR, passing near/toward the viewer at MAIN_LANE_Z_NEAR)
// with each agent node sitting off to alternating sides, joined to the lane
// by a short diagonal on-ramp spur instead of lying directly on a single
// curve. Nodes alternate left/right and up/down purely for on-ramp
// readability; handoff order (inbox -> crm -> project -> docs) is unchanged.
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

// Simple glyph textures for the handoff items. Flat, legible shapes rather
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
  // Thin ring around each node: the visual cue that this is an agent
  // (something that acts and hands work onward), not a static tool-icon
  // waypoint. Rotates slowly and continuously (point 4's "keeps moving").
  const ringGeo = new THREE.TorusGeometry(0.62, 0.018, 8, 48);
  const halo = makeGlowTexture('#22d3ee');

  const nodeMeshes = NODES.map((node, i) => {
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

    const ring = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.22 })
    );
    ring.position.copy(node.position);
    ring.rotation.x = Math.PI / 2.3;
    ring.rotation.y = i * 0.6;
    scene.add(ring);

    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: halo, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.45 })
    );
    sprite.scale.setScalar(1.4);
    sprite.position.copy(node.position);
    scene.add(sprite);

    return { ...node, mesh, ring, sprite };
  });

  // Shared lane + on-ramp path: every handoff below travels along this same
  // curve between two agents' arrival points, so the visual reads as "the
  // message goes out onto the shared lane, then up the next agent's on-ramp"
  // rather than a line floating across open space. Built from straight
  // LineCurve3 segments only (no CatmullRom smoothing), matching the earlier
  // straight-lane fix.
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

  // Arc-length fraction (0-1 of the whole lane+ramp path) at which each agent
  // sits, used both to time each handoff and to decide which node's label is
  // "active" at a given scroll position.
  const segmentLengths = curve.curves.map((c) => c.getLength());
  const totalLength = segmentLengths.reduce((a, b) => a + b, 0);
  const cumLengths = [0];
  segmentLengths.forEach((len) => cumLengths.push(cumLengths[cumLengths.length - 1] + len));
  const nodeT = nodeArrivalIndex.map((idx) => cumLengths[idx] / totalLength);
  const NODE_NEAR_WINDOW = 0.09;

  const lineGeo = new THREE.BufferGeometry().setFromPoints(waypoints);
  scene.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x0891b2, transparent: true, opacity: 0.28 })));

  // Three handoffs (agent 0->1, 1->2, 2->3): each is one glyph sprite that
  // travels the shared curve between the two agents' nodeT positions exactly
  // once, during that window of scroll progress. Nothing travels the whole
  // lane repeatedly - this is the direct fix for "the scroll elements that
  // slide back and forth look repetitive": the prior build had one courier
  // mesh make this same ramp-out-and-back trip four times in a row.
  const handoffs = nodeMeshes.slice(0, -1).map((fromNode, i) => {
    const toNode = nodeMeshes[i + 1];
    const tex = makeItemTexture(fromNode.item, ITEM_COLORS[fromNode.item] || '#22d3ee');
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 })
    );
    sprite.scale.setScalar(0.24);
    scene.add(sprite);
    return { sprite, fromT: nodeT[i], toT: nodeT[i + 1], fromNode, toNode };
  });

  // Ambient stream: a handful of small, dim glowing points cycle the full
  // lane continuously, independent of scroll, so the scene reads as
  // sustained and always-moving (EV's "starlight stream" note) rather than
  // only animating in scroll-gated bursts. Kept small, few, and dim - this is
  // background texture, not a second focal point (point 7's restraint bar).
  const STREAM_COUNT = 16;
  const streamTex = makeGlowTexture('#67e8f9');
  const streamSprites = Array.from({ length: STREAM_COUNT }, (_, i) => {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: streamTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.45 })
    );
    sprite.scale.setScalar(0.085);
    scene.add(sprite);
    return { sprite, offset: i / STREAM_COUNT };
  });
  const STREAM_SPEED = 0.05; // full lane-lengths per second - slow and confident, not busy

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
      // TASK-5844 finish-gate fix, part 1: this used to always reveal node
      // 0's label ("|| i === 0"), which was harmless when the scene only ran
      // behind the Tools/Proof/Reviews sections. Now that the scene also
      // runs behind the hero (point 1), an always-on label at progress 0 can
      // project onto the hero headline itself. agent-network-loader.js now
      // reports a flat 0 for the entire hero+mission "prologue" (see its
      // getPrologueFraction), so "progress > 0" alone is enough to keep
      // every label hidden until the story actually starts.
      //
      // Part 2: reveal used to be one-sided ("progress > threshold"), so
      // every agent's label stayed lit at 0.45 opacity for the rest of the
      // scroll once passed - by the Reviews section all four were stacked up
      // dim and several projected close enough together to visually overlap
      // (a restraint regression, point 7). Reveal is now a window centered
      // on each agent's own moment, so only the current and immediately
      // adjacent agents are ever visible at once, matching the "one idea at
      // a time" bar.
      const dist = Math.abs(progress - nodeT[i]);
      const revealed = progress > 0 && dist < NODE_NEAR_WINDOW * 1.6;
      const isActive = revealed && i === nearestIndex;
      el.classList.toggle('is-active', isActive);
      // Dim inactive-but-revealed labels so they read as background context
      // instead of competing with whatever real body copy is scrolling past
      // at that moment; only the node nearest the current scroll position
      // gets full opacity.
      el.style.opacity = revealed ? (isActive ? '1' : '0.45') : '0';
    });
  }

  function render(dt, elapsed) {
    const { pos, look } = lerpCameraPath(progress);
    // Slow idle drift on top of the scroll-driven path so the camera never
    // reads as fully frozen between scroll events - amplitude kept tiny to
    // stay restrained, not gamey.
    pos.x += Math.sin(elapsed * 0.12) * 0.05;
    pos.y += Math.sin(elapsed * 0.09) * 0.03;
    camera.position.copy(pos);
    camera.lookAt(look);

    const pathT = clamp(progress, 0, 1);

    nodeMeshes.forEach((node, i) => {
      const isNear = Math.abs(pathT - nodeT[i]) < NODE_NEAR_WINDOW;
      const targetIntensity = isNear ? 1.05 : 0.4;
      const targetColor = isNear ? BRIGHT : DIM;
      node.mesh.material.emissiveIntensity += (targetIntensity - node.mesh.material.emissiveIntensity) * 0.08;
      node.mesh.material.color.lerp(targetColor, 0.06);
      node.mesh.material.emissive.lerp(targetColor, 0.06);
      node.sprite.material.opacity += ((isNear ? 0.55 : 0.22) - node.sprite.material.opacity) * 0.08;
      node.ring.rotation.z = elapsed * 0.22 + i;
      node.ring.material.opacity += ((isNear ? 0.5 : 0.2) - node.ring.material.opacity) * 0.08;
    });

    handoffs.forEach((h) => {
      const span = h.toT - h.fromT;
      const local = span > 0 ? clamp((pathT - h.fromT) / span, 0, 1) : (pathT >= h.fromT ? 1 : 0);
      const point = curve.getPointAt(clamp(lerpNum(h.fromT, h.toT, local), 0, 1));
      h.sprite.position.copy(point);
      h.sprite.position.y += Math.sin(elapsed * 1.6) * 0.02;
      const inFlight = pathT > h.fromT && pathT < h.toT;
      const arrived = pathT >= h.toT;
      const targetOpacity = arrived ? 0.55 : inFlight ? 0.95 : 0;
      h.sprite.material.opacity += (targetOpacity - h.sprite.material.opacity) * 0.12;
    });

    streamSprites.forEach((s) => {
      const t = (elapsed * STREAM_SPEED + s.offset) % 1;
      s.sprite.position.copy(curve.getPointAt(t));
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
