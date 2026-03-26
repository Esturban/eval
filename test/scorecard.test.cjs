const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

global.window = { location: { origin: "https://evadvisory.ca" } };

const {
  buildFindings,
  buildTrackedHref,
  buildWhatsAppHref,
  scoreResponses,
} = require("../assets/js/revenue-signal-scorecard.js");

const configPath = path.join(__dirname, "..", "data", "revenue_signal_scorecard.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

test("scoreResponses maps low scores into the trusted band", () => {
  const result = scoreResponses(config, {
    source_of_truth: 0,
    attribution: 0,
    funnel_visibility: 0,
    reporting_rhythm: 0,
    site_changes: 0,
    operating_load: 0,
  });

  assert.equal(result.total, 0);
  assert.equal(result.band.slug, "trusted");
  assert.equal(result.dominantIssue.key, "revenue_signal_trust");
  assert.deepEqual(result.unanswered, []);
});

test("scoreResponses maps severe answers into the broken band", () => {
  const result = scoreResponses(config, {
    source_of_truth: 3,
    attribution: 3,
    funnel_visibility: 3,
    reporting_rhythm: 3,
    site_changes: 3,
    operating_load: 3,
  });

  assert.equal(result.total, 24);
  assert.equal(result.band.slug, "broken");
  assert.equal(result.dominantIssue.key, "conversion_friction");
});

test("buildFindings surfaces the highest-risk findings", () => {
  const result = scoreResponses(config, {
    source_of_truth: 3,
    attribution: 2,
    funnel_visibility: 0,
    reporting_rhythm: 3,
    site_changes: 0,
    operating_load: 0,
  });

  const findings = buildFindings(result);

  assert.equal(findings.length, 3);
  assert.match(findings[0], /executive level/i);
  assert.match(findings[1], /channel allocation is exposed/i);
  assert.match(findings[2], /operational tax/i);
});

test("scoreResponses resolves dominant issue from accumulated issue weights", () => {
  const result = scoreResponses(config, {
    source_of_truth: 1,
    attribution: 1,
    funnel_visibility: 0,
    reporting_rhythm: 3,
    site_changes: 0,
    operating_load: 3,
  });

  assert.equal(result.band.slug, "watchlist");
  assert.equal(result.dominantIssue.key, "reporting_drag");
  assert.equal(result.recommendations[0].title, "Lightning Fast Reporting");
});

test("scoreResponses reports unanswered questions", () => {
  const result = scoreResponses(config, {
    source_of_truth: 0,
    attribution: 0,
  });

  assert.deepEqual(result.unanswered, [
    "funnel_visibility",
    "reporting_rhythm",
    "site_changes",
    "operating_load",
  ]);
});

test("buildTrackedHref preserves scorecard context in follow-up links", () => {
  const result = scoreResponses(config, {
    source_of_truth: 3,
    attribution: 0,
    funnel_visibility: 0,
    reporting_rhythm: 0,
    site_changes: 0,
    operating_load: 0,
  });

  const href = new URL(buildTrackedHref("/contact/", result));

  assert.equal(href.pathname, "/contact/");
  assert.equal(href.searchParams.get("source"), "scorecard");
  assert.equal(href.searchParams.get("score"), "4");
  assert.equal(href.searchParams.get("band"), "trusted");
  assert.equal(href.searchParams.get("issue"), "revenue_signal_trust");
});

test("buildWhatsAppHref sanitizes the phone number and enriches the message", () => {
  const result = scoreResponses(config, {
    source_of_truth: 3,
    attribution: 3,
    funnel_visibility: 0,
    reporting_rhythm: 0,
    site_changes: 0,
    operating_load: 0,
  });

  const href = buildWhatsAppHref("+1 (305) 776-9385", result);

  assert.match(href, /^https:\/\/wa\.me\/13057769385\?text=/);
  assert.match(decodeURIComponent(href), /Revenue Signal Scorecard/);
  assert.match(decodeURIComponent(href), /Attribution Confidence|Revenue Signal Trust/);
});
