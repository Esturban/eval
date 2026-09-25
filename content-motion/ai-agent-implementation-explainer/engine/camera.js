// REUSE_CHECKED: /Users/EVA/Desktop/eva/03_development/_dev/repos/3_utilities/go/bfr/.venv-docs/lib/python3.14/site-packages/material/templates/.icons/fontawesome/regular/camera.svg
// (guardchain flagged this hit on the filename "camera" alone) -- that is a
// vendored FontAwesome icon glyph inside an unrelated repo's docs venv, not
// a camera-fit/viewport helper. Also searched repos/ and web/eval generally
// for beat-grid/spring/camera motion plumbing (see beatgrid.js header); none
// exists. This file is new, single-purpose engine plumbing for CRO-6814.
//
// Engine: camera. "The camera zooms so each state fills the frame" (template
// <direction>). Implemented as a pure derivation from the shape's current
// box size, not a separately animated parameter -- since the box itself is
// already a spring-interpolated function of time, the camera derived from it
// is automatically continuous, with zero extra state. Works for any canvas
// aspect ratio, so the same scene renders a 1:1 master and a 16:9 cut without
// a crop/pad pass: each resolution gets its own honest re-fit.

(function (global) {
  function fitCameraToBox({ canvasW, canvasH, boxW, boxH, margin = 0.78, minScale = 0.9, maxScale = 3.4 }) {
    const scaleX = (canvasW * margin) / boxW;
    const scaleY = (canvasH * margin) / boxH;
    let scale = Math.min(scaleX, scaleY);
    scale = Math.max(minScale, Math.min(maxScale, scale));
    return {
      scale,
      centerX: canvasW / 2,
      centerY: canvasH / 2,
    };
  }

  // Applies the camera to a canvas context that has already been cleared.
  // Everything drawn after this call happens in "shape space" (box centered
  // on the origin); the camera maps shape space to canvas pixels.
  function applyCamera(ctx, camera) {
    ctx.setTransform(camera.scale, 0, 0, camera.scale, camera.centerX, camera.centerY);
  }

  global.EngineCamera = { fitCameraToBox, applyCamera };
})(typeof window !== "undefined" ? window : globalThis);
