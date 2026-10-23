---
author: EV Advisory
title: "Request a founding seat"
description: "Tell us what the agent should do and which tools it touches. We read it and reply by email with whether it fits."
date: 2026-10-23T00:00:00.000Z
noindex: true
sitemap:
  disable: true
build:
  list: never
  render: always
---

Three questions. We read your answer and reply by email with whether it fits. Founding seats are USD 1,995 a month, month to month, with 100 percent back if you cancel in the first 14 days. See the <a class="seat-tap" href="/services/ai-agent-implementation/">full terms</a>.

<p class="seat-note">All fields are required (marked with *).</p>

<form class="seat-form not-prose" name="agent-seat" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/thank-you-agent-seat/">
  <input type="hidden" name="form-name" value="agent-seat" />
  <input type="hidden" name="source" value="ai-agent-implementation" />
  <p class="seat-form-trap" hidden>
    <label>Leave this empty <input name="bot-field" tabindex="-1" autocomplete="off" /></label>
  </p>
  <p>
    <label for="agent_job">What should the agent do?<span class="seat-req" aria-hidden="true">*</span></label>
    <textarea id="agent_job" name="agent_job" rows="5" required></textarea>
  </p>
  <p>
    <label for="systems">Which tools does it touch?<span class="seat-req" aria-hidden="true">*</span></label>
    <span class="seat-hint" id="systems-hint">For example: CRM, project tool, shared inbox</span>
    <input type="text" id="systems" name="systems" aria-describedby="systems-hint" required />
  </p>
  <p>
    <label for="email">Email<span class="seat-req" aria-hidden="true">*</span></label>
    <input type="email" id="email" name="email" autocomplete="email" required />
  </p>
  <p>
    <button type="submit">Request my founding seat</button>
  </p>
</form>

Not sure yet? <a class="seat-tap" href="/live-audit/">Book a free Live Audit</a>.
