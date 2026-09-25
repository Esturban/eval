// REUSE_CHECKED: none          searched the repo tree, only home-motion.js's own inline arc-section[data-tone] query does this today
//
// Shared read of the homepage colour arc's authored tone stops: the
// `data-tone` hex values already set on each `.arc-section` in the Hugo
// templates (hero-intro.html, default-mission.html, home-flow.html, and
// so on). home-motion.js's background blend and highway-scene.js's
// day/night setDayProgress() lerp both import this instead of each
// keeping their own hardcoded palette, so there is one authored source
// of truth for "what colour is this point in the page."
export function readToneStops(root) {
  const doc = root || (typeof document !== 'undefined' ? document : null);
  if (!doc) return [];
  return Array.from(doc.querySelectorAll('.arc-section[data-tone]')).map((el) => el.dataset.tone);
}
