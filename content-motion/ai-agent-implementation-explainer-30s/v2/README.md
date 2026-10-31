# AI Agent Implementation explainer, motion v2

Silent 30.8 s motion render of the 8 approved stills (../stills, ../index.html), with a 3D depth pass.

## Re-render

```
node content-motion/ai-agent-implementation-explainer-30s/v2/render-video.cjs
```

Writes explainer-4x5.mp4 (1080x1350), explainer-9x16.mp4 (1080x1920), frames/ (one settled frame per beat taken from each MP4, plus the contact sheets) and check-output.txt. Exits non-zero if any check fails. Needs ffmpeg, ImageMagick and the Playwright headless shell named in render-video.cjs.

## How it works

- render-video.cjs opens ../index.html (the approved stills page, unchanged), injects motion.js, seeks every frame at 30 fps and pipes PNG screenshots into ffmpeg (H.264, yuv420p, faststart, no audio track).
- motion.js reuses the page's own BEATS geometry, palette, type and drawing functions, so nothing is redesigned. It splits each beat into four depth layers: background (the dimmed old handoff in beat 2), graphics (cards, connectors and their labels), caption (supporting line, CTA) and headline.
- Each beat opens with one camera move. The layers start apart in Z under a 2000 px perspective and settle together on a critically damped spring (no overshoot) in 1.5 s. Graphics assemble top to bottom (16 px rise). Beats 1 to 7 end with a 0.3 s depth exit.
- Every settled frame is checked against the approved still: the HTML frame within antialiasing, and the MP4 frame at PSNR 38 dB or better. Each beat must also hold fully static for at least 1.5 s.
- 9:16 is a recomposition, not a crop: the message block sits under the top safe line (y 260), the diagram moves 110 px lower, everything shifts 36 px left to clear the right-hand action rail, and nothing sits below y 1320.

## Beats

| # | Time | Camera move | Beat motion |
|---|---|---|---|
| 1 | 0.0 to 4.2 s | dolly in | headline and cards on screen from frame 0; supporting line at 0.8 s; AI agent card rises in at 1.2 s |
| 2 | 4.2 to 7.7 s | orbit in from the right | tool cards assemble, agent lane draws left to right, the work item travels along the lane |
| 3 | 7.7 to 11.3 s | tilt down | candidate tasks settle one at a time, then the selection badge lands on Ticket triage |
| 4 | 11.3 to 14.9 s | crane up | tool tiles, then the workflow card; the agent path draws from Read to Route, then Route lights |
| 5 | 14.9 to 18.5 s | orbit in from the left | three work items arrive in sequence, the first is approved, then the Approve button lands |
| 6 | 18.5 to 22.4 s | push in | rail draws, Audit, Build and Test step in, the 2 to 6 week window draws, Go live lands last |
| 7 | 22.4 to 26.3 s | orbit in from the right | the By hand column arrives first, then the AI agent column row by row |
| 8 | 26.3 to 30.8 s | settle onto the CTA | name, CTA, benefit line, then the four-stage path; static 3.0 s final hold |

The CTA has no link on screen: the post caption must carry it.
