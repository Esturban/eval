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

Three questions. We read your answer and reply by email with whether it fits. Founding seats are USD 1,995 a month, month to month, with 100 percent back if you cancel in the first 14 days. See the [full terms](/services/ai-agent-implementation/).

<form class="seat-form not-prose" name="agent-seat" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/thank-you-agent-seat/">
  <input type="hidden" name="form-name" value="agent-seat" />
  <input type="hidden" name="source" value="ai-agent-implementation" />
  <p class="seat-form-trap" hidden>
    <label>Leave this empty <input name="bot-field" tabindex="-1" autocomplete="off" /></label>
  </p>
  <p>
    <label for="agent_job">What should the agent do?</label>
    <textarea id="agent_job" name="agent_job" rows="5" required></textarea>
  </p>
  <p>
    <label for="systems">Which tools does it touch?</label>
    <input type="text" id="systems" name="systems" placeholder="For example: CRM, project tool, shared inbox" required />
  </p>
  <p>
    <label for="email">Email</label>
    <input type="email" id="email" name="email" autocomplete="email" required />
  </p>
  <p>
    <button type="submit">Request my founding seat</button>
  </p>
</form>

Not sure yet? [Book a free Live Audit](/live-audit/).
