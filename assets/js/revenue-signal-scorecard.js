function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizePhoneNumber(value) {
  return String(value ?? "").replace(/[^\d]/g, "");
}

function normalizeOption(option, index, question) {
  const safeOption = option || {};

  return {
    index,
    issue: question.issue || null,
    label: safeOption.label || "",
    score: Number(safeOption.score || 0),
    finding: safeOption.finding || safeOption.label || "",
  };
}

function resolveDominantIssue(config, issueTotals) {
  const issues = config.issues || {};
  const order = config.issuePriority || Object.keys(issues);

  if (order.length === 0) {
    return null;
  }

  let winnerKey = config.defaultIssue && issues[config.defaultIssue] ? config.defaultIssue : order[0];
  let winnerScore = Number.NEGATIVE_INFINITY;

  order.forEach((issueKey) => {
    const score = Number(issueTotals[issueKey] || 0);

    if (score > winnerScore) {
      winnerKey = issueKey;
      winnerScore = score;
    }
  });

  if (!issues[winnerKey]) {
    return null;
  }

  return {
    key: winnerKey,
    score: winnerScore > 0 ? winnerScore : 0,
    ...issues[winnerKey],
  };
}

function scoreResponses(config, answerIndexes) {
  const issues = config.issues || {};
  const issueTotals = Object.keys(issues).reduce((totals, issueKey) => {
    totals[issueKey] = 0;
    return totals;
  }, {});
  const answers = [];
  let total = 0;
  const unanswered = [];

  config.questions.forEach((question) => {
    const selectedIndex = answerIndexes[question.id];

    if (selectedIndex === undefined || selectedIndex === null || selectedIndex === "") {
      unanswered.push(question.id);
      return;
    }

    const option = normalizeOption(question.options[Number(selectedIndex)], Number(selectedIndex), question);
    total += option.score;

    if (option.issue) {
      issueTotals[option.issue] = Number(issueTotals[option.issue] || 0) + option.score;
    }

    answers.push({
      id: question.id,
      issue: option.issue,
      label: question.label,
      option,
    });
  });

  const band = config.bands.find((candidate) => total >= candidate.min && total <= candidate.max);
  const dominantIssue = resolveDominantIssue(config, issueTotals);
  const recommendations = dominantIssue && band
    ? ((dominantIssue.recommendations && dominantIssue.recommendations[band.slug]) || [])
    : [];

  return {
    total,
    maxScore: Number(config.maxScore || 0),
    band,
    answers,
    unanswered,
    issueTotals,
    dominantIssue,
    recommendations,
  };
}

function buildFindings(result) {
  return result.answers
    .filter((answer) => answer.option.score >= 3)
    .map((answer) => answer.option.finding)
    .slice(0, 3);
}

function buildTrackedHref(href, result) {
  const url = new URL(href, window.location.origin);
  const findings = buildFindings(result);

  url.searchParams.set("source", "scorecard");
  url.searchParams.set("score", String(result.total));
  url.searchParams.set("band", result.band.slug);

  if (result.dominantIssue) {
    url.searchParams.set("issue", result.dominantIssue.key);
  }

  if (findings[0]) {
    url.searchParams.set("finding", findings[0]);
  }

  return url.toString();
}

function buildActionLink(action, result, recommendations) {
  if (!action) {
    return null;
  }

  if (action.kind === "recommendation") {
    const card = recommendations[action.recommendationIndex || 0];

    return {
      label: action.label,
      href: buildTrackedHref(card ? card.href : action.href, result),
    };
  }

  return {
    label: action.label,
    href: buildTrackedHref(action.href, result),
  };
}

function buildWhatsAppHref(number, result) {
  const digits = sanitizePhoneNumber(number);

  if (!digits || !result.band) {
    return "";
  }

  const findings = buildFindings(result);
  const lines = [
    "Hi EV Advisory,",
    `I completed the Revenue Signal Scorecard and got ${result.total}/${result.maxScore} (${result.band.label}).`,
  ];

  if (result.dominantIssue) {
    lines.push(`The biggest bottleneck looks like ${result.dominantIssue.label}.`);
  }

  if (findings[0]) {
    lines.push(`Top finding: ${findings[0]}`);
  }

  lines.push("I want the recommended next step.");

  return `https://wa.me/${digits}?text=${encodeURIComponent(lines.join(" "))}`;
}

function renderRecommendationCards(cards) {
  if (!cards.length) {
    return "";
  }

  return `
    <div class="grid gap-3">
      ${cards
        .map(
          (card) => `
            <a href="${escapeHtml(card.href)}" class="group rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-300/40 hover:bg-white/10">
              <p class="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">${escapeHtml(card.eyebrow || "Next step")}</p>
              <h4 class="mt-3 text-base font-semibold text-white group-hover:text-cyan-200">${escapeHtml(card.title)}</h4>
              <p class="mt-2 text-sm leading-6 text-slate-300">${escapeHtml(card.description)}</p>
            </a>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderSocialPrompt(context) {
  const socialHref = context.twitterUrl || context.linkedinUrl;
  const socialLabel = context.twitterUrl ? "Follow ongoing operator notes on X" : "Follow EV Advisory on LinkedIn";

  if (!socialHref) {
    return "";
  }

  return `
    <a href="${escapeHtml(socialHref)}" class="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300 transition hover:border-cyan-300 hover:text-cyan-200">
      ${escapeHtml(socialLabel)}
    </a>
  `;
}

function renderLeadCapture(config, result, primaryAction, context) {
  const bandConfig = result.band || {};
  const leadCapture = bandConfig.leadCapture || {};
  const findings = buildFindings(result);
  const primaryRecommendation = result.recommendations[0];
  const whatsappHref = bandConfig.showWhatsapp ? buildWhatsAppHref(context.whatsappNumber, result) : "";

  return `
    <div data-scorecard-lead-capture class="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
      <p class="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">${escapeHtml(leadCapture.eyebrow || "Follow-up")}</p>
      <h4 class="mt-3 text-lg font-semibold text-white">${escapeHtml(leadCapture.title || "Send your result")}</h4>
      <p class="mt-2 text-sm leading-6 text-slate-200">${escapeHtml(leadCapture.description || "Leave a work email and EV Advisory will follow up with the right next step.")}</p>
      <form id="scorecard-lead-form" class="mt-4 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="form-name" value="scorecard-lead">
        <input type="hidden" name="source" value="scorecard">
        <input type="hidden" name="score" value="${escapeHtml(result.total)}">
        <input type="hidden" name="score_band" value="${escapeHtml(result.band.slug)}">
        <input type="hidden" name="dominant_issue" value="${escapeHtml(result.dominantIssue ? result.dominantIssue.key : "")}">
        <input type="hidden" name="top_findings" value="${escapeHtml(findings.join(" | "))}">
        <input type="hidden" name="primary_recommendation" value="${escapeHtml(primaryRecommendation ? primaryRecommendation.title : primaryAction.label)}">
        <input type="hidden" name="page" value="/scorecard/">
        <input type="hidden" name="bot-field" value="">
        <label class="space-y-2 text-sm text-slate-200">
          <span class="font-medium">Work email</span>
          <input type="email" name="email" required placeholder="name@company.com" class="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30">
        </label>
        <label class="space-y-2 text-sm text-slate-200">
          <span class="font-medium">Company or store</span>
          <input type="text" name="company" required placeholder="Brand or store name" class="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30">
        </label>
        <div class="sm:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button type="submit" class="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
            Send the tailored next step
          </button>
          ${whatsappHref ? `<a href="${escapeHtml(whatsappHref)}" class="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300 hover:text-cyan-200">Message on WhatsApp</a>` : ""}
        </div>
        <p class="sm:col-span-2 text-xs leading-5 text-slate-400">This keeps the score, band, and likely bottleneck attached so the follow-up starts with context.</p>
      </form>
    </div>
  `;
}

function renderLeadSuccess(target, result, primaryAction, context) {
  const successState = (result.band && result.band.successState) || {};
  const whatsappHref = result.band && result.band.showWhatsapp ? buildWhatsAppHref(context.whatsappNumber, result) : "";

  target.innerHTML = `
    <div class="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
      <p class="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200">Captured</p>
      <h4 class="mt-3 text-lg font-semibold text-white">${escapeHtml(successState.title || "Follow-up received")}</h4>
      <p class="mt-2 text-sm leading-6 text-slate-200">${escapeHtml(successState.description || "The result context is attached so EV Advisory can follow up with the right next step.")}</p>
      <div class="mt-4 flex flex-col gap-3 sm:flex-row">
        <a href="${escapeHtml(primaryAction.href)}" class="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">${escapeHtml(primaryAction.label)}</a>
        ${whatsappHref ? `<a href="${escapeHtml(whatsappHref)}" class="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300 hover:text-cyan-200">Message on WhatsApp</a>` : ""}
      </div>
    </div>
  `;
}

function renderResult(container, result, context) {
  if (!result.band || !result.dominantIssue) {
    container.innerHTML = '<p class="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">Something is off in the scoring setup. Reload and try again.</p>';
    return;
  }

  const findings = buildFindings(result);
  const recommendations = result.recommendations || [];
  const primaryAction = buildActionLink(result.band.primaryCta, result, recommendations);
  const secondaryAction = buildActionLink(result.band.secondaryCta, result, recommendations);
  const findingsMarkup = findings.length
    ? findings.map((finding) => `<li>${escapeHtml(finding)}</li>`).join("")
    : "<li>Your answers suggest the signal is relatively stable, but future changes should still be guarded carefully.</li>";
  const socialPrompt = result.band.slug === "trusted" ? renderSocialPrompt(context) : "";

  container.innerHTML = `
    <div class="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
      <p class="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">Score</p>
      <div class="mt-3 flex items-end gap-3">
        <p class="text-4xl font-black text-white">${escapeHtml(result.total)}<span class="text-lg text-cyan-100">/${escapeHtml(result.maxScore)}</span></p>
        <p class="mb-1 text-sm font-semibold text-cyan-100">${escapeHtml(result.band.label)}</p>
      </div>
    </div>
    <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p class="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">Diagnosis</p>
      <p class="mt-3 text-sm leading-6 text-slate-100">${escapeHtml(result.band.summary)}</p>
      <div class="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
        <p class="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">Dominant bottleneck</p>
        <h4 class="mt-2 text-lg font-semibold text-white">${escapeHtml(result.dominantIssue.label)}</h4>
        <p class="mt-2 text-sm leading-6 text-slate-300">${escapeHtml(result.dominantIssue.description)}</p>
      </div>
    </div>
    <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p class="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">Immediate findings</p>
      <ul class="mt-3 space-y-2 text-sm leading-6 text-gray-100">${findingsMarkup}</ul>
    </div>
    <div class="grid gap-3 sm:grid-cols-2">
      <a href="${escapeHtml(primaryAction.href)}" class="inline-flex items-center justify-center rounded-full bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">${escapeHtml(primaryAction.label)}</a>
      <a href="${escapeHtml(secondaryAction.href)}" class="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-300 hover:text-cyan-200">${escapeHtml(secondaryAction.label)}</a>
    </div>
    ${renderLeadCapture(context.config, result, primaryAction, context)}
    <div class="space-y-3">
      <div class="flex items-center justify-between gap-3">
        <p class="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">Recommended next steps</p>
        ${socialPrompt}
      </div>
      ${renderRecommendationCards(recommendations)}
    </div>
  `;
}

async function submitLeadForm(form) {
  const body = new URLSearchParams(new FormData(form)).toString();

  const response = await fetch("/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Lead form request failed with status ${response.status}`);
  }
}

function initScorecard(doc) {
  const root = doc.getElementById("revenue-signal-scorecard-shell");
  const form = doc.getElementById("revenue-signal-scorecard");
  const dataNode = doc.getElementById("revenue-signal-scorecard-data");
  const output = doc.getElementById("scorecard-output");

  if (!root || !form || !dataNode || !output) {
    return;
  }

  const config = JSON.parse(dataNode.textContent);
  const context = {
    config,
    whatsappNumber: root.dataset.whatsappNumber || "",
    twitterUrl: root.dataset.twitterUrl || "",
    linkedinUrl: root.dataset.linkedinUrl || "",
  };
  let latestResult = null;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const values = {};
    new FormData(form).forEach((value, key) => {
      values[key] = value;
    });

    const result = scoreResponses(config, values);

    if (result.unanswered.length > 0) {
      output.innerHTML = '<p class="rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-50">Answer all six questions to generate your score.</p>';
      return;
    }

    latestResult = result;
    renderResult(output, result, context);
    output.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  output.addEventListener("submit", async (event) => {
    const leadForm = event.target.closest("#scorecard-lead-form");

    if (!leadForm) {
      return;
    }

    event.preventDefault();

    if (!latestResult || !latestResult.band) {
      return;
    }

    const submitButton = leadForm.querySelector('button[type="submit"]');
    const leadTarget = output.querySelector("[data-scorecard-lead-capture]");
    const primaryAction = buildActionLink(latestResult.band.primaryCta, latestResult, latestResult.recommendations || []);

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending...";
      }

      await submitLeadForm(leadForm);

      if (leadTarget) {
        renderLeadSuccess(leadTarget, latestResult, primaryAction, context);
      }
    } catch (error) {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Send the tailored next step";
      }

      if (leadTarget) {
        const existingError = leadTarget.querySelector("[data-scorecard-lead-error]");

        if (!existingError) {
          leadTarget.insertAdjacentHTML(
            "beforeend",
            '<p data-scorecard-lead-error class="mt-3 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">The follow-up request did not go through. You can still use the contact or WhatsApp path while this is retried.</p>',
          );
        }
      }
    }
  });
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => initScorecard(document));
}

module.exports = {
  buildFindings,
  buildTrackedHref,
  buildWhatsAppHref,
  initScorecard,
  resolveDominantIssue,
  sanitizePhoneNumber,
  scoreResponses,
};
