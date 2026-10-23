---
author: EV Advisory
title: "Request a founding seat"
description: "Tell us what the agent should do and which tools it touches. We read it and reply by email with whether it fits."
nav_cta: quiet
layout: seat
hide_meta: true
lede: "Three questions, about two minutes. We read every answer and reply by email with whether it fits. You hear back within 2 business days."
terms:
  - "USD 1,995 a month, founding seat"
  - "Month to month"
  - "100 percent back if you cancel in the first 14 days"
  - "First agent live within 10 business days of access, or next month is free"
date: 2026-10-23T00:00:00.000Z
noindex: true
sitemap:
  disable: true
build:
  list: never
  render: always
---

<p class="seat-note">All fields are required (marked with *).</p>

<form class="seat-form not-prose" name="agent-seat" method="POST" netlify data-netlify="true" netlify-honeypot="bot-field" action="../thank-you-agent-seat/">
  <input type="hidden" name="form-name" value="agent-seat" />
  <input type="hidden" name="source" value="ai-agent-implementation" />
  <p class="seat-form-trap" hidden>
    <label>Leave this empty <input name="bot-field" tabindex="-1" autocomplete="off" /></label>
  </p>
  <p>
    <label for="agent_job">What should the agent do? One task is enough.<span class="seat-req" aria-hidden="true">*</span></label>
    <textarea id="agent_job" name="agent_job" rows="5" placeholder="Example: Read new project request emails and turn each one into a task with the client name, scope and due date." required></textarea>
    <span class="seat-chips" role="group" aria-label="Suggestions, tap to add" hidden>
      <button type="button" data-suggest="job" data-suggest-job="Triage inbound email" aria-pressed="false">Triage inbound email</button>
      <button type="button" data-suggest="job" data-suggest-job="Draft quotes from requests" aria-pressed="false">Draft quotes from requests</button>
      <button type="button" data-suggest="job" data-suggest-job="Update the CRM after calls" aria-pressed="false">Update the CRM after calls</button>
      <button type="button" data-suggest="job" data-suggest-job="Weekly report from spreadsheets" aria-pressed="false">Weekly report from spreadsheets</button>
      <button type="button" data-suggest="job" data-suggest-job="Answer staff policy questions" aria-pressed="false">Answer staff policy questions</button>
      <button type="button" data-suggest="job" data-suggest-job="Chase unpaid invoices" aria-pressed="false">Chase unpaid invoices</button>
    </span>
  </p>
  <p>
    <label for="systems">Which tools does it touch?<span class="seat-req" aria-hidden="true">*</span></label>
    <span class="seat-hint" id="systems-hint">For example: CRM, project tool, shared inbox. Names are fine, no technical detail needed.</span>
    <input type="text" id="systems" name="systems" aria-describedby="systems-hint" required />
    <span class="seat-chips" role="group" aria-label="Common tools, tap to toggle" hidden>
      <button type="button" data-suggest="tool" data-suggest-tool="Gmail" aria-pressed="false">Gmail</button>
      <button type="button" data-suggest="tool" data-suggest-tool="Outlook" aria-pressed="false">Outlook</button>
      <button type="button" data-suggest="tool" data-suggest-tool="Google Sheets" aria-pressed="false">Google Sheets</button>
      <button type="button" data-suggest="tool" data-suggest-tool="Excel" aria-pressed="false">Excel</button>
      <button type="button" data-suggest="tool" data-suggest-tool="HubSpot" aria-pressed="false">HubSpot</button>
      <button type="button" data-suggest="tool" data-suggest-tool="Salesforce" aria-pressed="false">Salesforce</button>
      <button type="button" data-suggest="tool" data-suggest-tool="Slack" aria-pressed="false">Slack</button>
      <button type="button" data-suggest="tool" data-suggest-tool="Shopify" aria-pressed="false">Shopify</button>
    </span>
  </p>
  <p>
    <label for="email">Email<span class="seat-req" aria-hidden="true">*</span></label>
    <input type="email" id="email" name="email" autocomplete="email" required />
  </p>
  <span class="seat-status" role="status" aria-live="polite"></span>
  <p>
    <button type="submit">Request my founding seat</button>
  </p>
  <p class="seat-note">No payment now. You hear back within 2 business days. Next: we reply, you book a 20-minute Live Audit, and your first agent goes live within 10 business days of access.</p>
</form>

<script src="/js/agent-seat.js" defer></script>

<p class="seat-proof">Reporting work for a past client: 30 hours a month down to 5 minutes.</p>

Not sure yet? <a class="seat-tap" href="/live-audit/">Book a free Live Audit</a>.
