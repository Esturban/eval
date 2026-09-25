// REUSE_CHECKED: /Users/EVA/Desktop/eva/03_development/_dev/repos/1_social/py/ev-tweet-thread/venv/lib/python3.11/site-packages/sqlalchemy/engine/cursor.py
// (guardchain flagged this hit on the filename "cursor" alone) -- that file is
// SQLAlchemy's DB-API result cursor, vendored inside an unrelated repo's venv.
// Nothing to do with a drawn UI pointer. Also searched repos/ and web/eval for
// beat-grid/spring/motion-timeline plumbing generally (see beatgrid.js header);
// none of it exists yet. This file is new, single-purpose engine plumbing for
// CRO-6814's code-only motion pipeline.
//
// Engine: cursor. A drawn pointer whose position is itself a pure function
// of time (built from Timelines), so "the cursor drives every change with
// real clicks and drags" without any mutable state.

(function (global) {
  function createCursor({ x, y }) {
    const xTrack = new global.EngineSprings.Timeline(x);
    const yTrack = new global.EngineSprings.Timeline(y);
    const pressTrack = new global.EngineSprings.Timeline(0); // 0 = up, 1 = pressed

    return {
      xTrack,
      yTrack,
      pressTrack,
      at(t) {
        return { x: xTrack.value(t), y: yTrack.value(t), press: pressTrack.value(t) };
      },
      // Draws a small filled cursor glyph plus a press ring, in the current
      // (already transformed) canvas space. No glow, no gradient -- flat
      // ink fill with a hairline ring, per the template's Banned list.
      draw(ctx, t, { ink = "#0f172a", ring = "#dbe3ee" } = {}) {
        const { x, y, press } = this.at(t);
        ctx.save();
        ctx.translate(x, y);
        const scale = 1 - press * 0.12;
        ctx.scale(scale, scale);

        if (press > 0.02) {
          ctx.beginPath();
          ctx.arc(0, 0, 16 + press * 6, 0, Math.PI * 2);
          ctx.strokeStyle = ring;
          ctx.globalAlpha = press * 0.9;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        ctx.beginPath();
        ctx.moveTo(-1, -1);
        ctx.lineTo(11, 4);
        ctx.lineTo(3.2, 6.4);
        ctx.lineTo(6.4, 13.4);
        ctx.lineTo(3.4, 14.8);
        ctx.lineTo(0.2, 7.8);
        ctx.lineTo(-4.6, 11.2);
        ctx.closePath();
        ctx.fillStyle = ink;
        ctx.fill();
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#f7f4ee";
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      },
    };
  }

  global.EngineCursor = { createCursor };
})(typeof window !== "undefined" ? window : globalThis);
