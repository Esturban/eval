// REUSE_CHECKED: .qa/design-options/direction-2-decision.html (repo-relative, gitignored scratch dir)
// is the only prior implementation of this animation (inline prototype script).
// No other hero, Three.js, or node-graph module exists in this repo or sibling
// web repos (searched: find -iname '*hero*' under repos, grep -rl 'THREE\.'
// across web repos - only hit was an unrelated leerix repo eyeball effect).
// This file ports that prototype into a proper ES module, fixing the
// panel-containment issue the ticket flagged, instead of leaving a second
// copy of the logic elsewhere.
// Named imports (not `import * as THREE`) so esbuild can tree-shake the
// unused parts of the three.js module and keep this lazy-loaded bundle small.
import {
  Scene,
  OrthographicCamera,
  WebGLRenderer,
  BufferGeometry,
  BufferAttribute,
  PointsMaterial,
  Points,
  Group,
  LineBasicMaterial,
  Line,
  Vector3,
} from 'three';

// Renders a small node graph converging into one highlighted decision point.
// Contained entirely within the panel element passed in - never draws outside
// its own bounds, and stops rendering once the convergence settles so it
// stays a quiet, one-time signal rather than a looping showpiece.

const NODE_COUNT = 9;
const CONVERGE_MS = 2600;
const SETTLE_MS = 1600;
const TOTAL_MS = CONVERGE_MS + SETTLE_MS;

function buildNodePositions(width, height) {
  const positions = [];
  const decision = new Vector3(width * 0.34, 0, 0);

  for (let i = 0; i < NODE_COUNT - 1; i += 1) {
    const angle = (i / (NODE_COUNT - 1)) * Math.PI * 1.5 - Math.PI * 0.75;
    const radius = height * 0.42;
    positions.push(
      new Vector3(
        -width * 0.36 + Math.cos(angle) * radius * 0.6,
        Math.sin(angle) * radius,
        0
      )
    );
  }

  positions.push(decision);
  return { positions, decision };
}

export default function initHeroGraph(canvas, panel) {
  const width = panel.clientWidth || 400;
  const height = panel.clientHeight || 160;

  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new Scene();
  const camera = new OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 1, 1000);
  camera.position.z = 100;

  const { positions: nodePositions, decision } = buildNodePositions(width, height);

  const nodeGeometry = new BufferGeometry();
  const nodeArray = new Float32Array(nodePositions.length * 3);
  nodePositions.forEach((point, i) => {
    nodeArray[i * 3] = point.x;
    nodeArray[i * 3 + 1] = point.y;
    nodeArray[i * 3 + 2] = point.z;
  });
  nodeGeometry.setAttribute('position', new BufferAttribute(nodeArray, 3));
  const nodeMaterial = new PointsMaterial({ color: 0x0f172a, size: 4, transparent: true, opacity: 0.55 });
  scene.add(new Points(nodeGeometry, nodeMaterial));

  const decisionGeometry = new BufferGeometry();
  decisionGeometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array([decision.x, decision.y, decision.z]), 3)
  );
  const decisionMaterial = new PointsMaterial({ color: 0x22d3ee, size: 9, transparent: true, opacity: 0.9 });
  scene.add(new Points(decisionGeometry, decisionMaterial));

  const lineGroup = new Group();
  const lines = nodePositions.slice(0, -1).map((from, i) => {
    const geometry = new BufferGeometry();
    geometry.setFromPoints([from, from]);
    const material = new LineBasicMaterial({ color: 0x0891b2, transparent: true, opacity: 0.35 });
    const line = new Line(geometry, material);
    lineGroup.add(line);
    return { line, from, to: decision, delay: i * 0.06 };
  });
  scene.add(lineGroup);

  let start = null;
  let rafId = null;

  function frame(ts) {
    if (start === null) start = ts;
    const elapsed = ts - start;
    const convergeProgress = Math.min(1, elapsed / CONVERGE_MS);
    const eased = 1 - Math.pow(1 - convergeProgress, 3);

    lines.forEach(({ line, from, to, delay }) => {
      const localProgress = Math.max(0, Math.min(1, (eased - delay) / (1 - delay)));
      const current = from.clone().lerp(to, localProgress);
      line.geometry.setFromPoints([from, current]);
      line.geometry.attributes.position.needsUpdate = true;
    });

    decisionMaterial.opacity = 0.65 + Math.sin(elapsed * 0.0025) * 0.25;
    renderer.render(scene, camera);

    if (elapsed < TOTAL_MS) {
      rafId = requestAnimationFrame(frame);
    } else {
      rafId = null;
    }
  }

  rafId = requestAnimationFrame(frame);

  function handleResize() {
    const w = panel.clientWidth || width;
    const h = panel.clientHeight || height;
    renderer.setSize(w, h, false);
    camera.left = -w / 2;
    camera.right = w / 2;
    camera.top = h / 2;
    camera.bottom = -h / 2;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', handleResize);

  return function dispose() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', handleResize);
    renderer.dispose();
  };
}
