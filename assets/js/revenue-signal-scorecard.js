function normalizeOption(option, index) {
  return {
    index,
    label: option.label,
    score: Number(option.score || 0),
    finding: option.finding || option.label,
  };
}

function scoreResponses(config, answerIndexes) {
  const answers = [];
  let total = 0;
  const unanswered = [];

  config.questions.forEach((question) => {
    const selectedIndex = answerIndexes[question.id];

    if (selectedIndex === undefined || selectedIndex === null || selectedIndex === "") {
      unanswered.push(question.id);
      return;
    }

    const option = normalizeOption(question.options[Number(selectedIndex)], Number(selectedIndex));
    total += option.score;
    answers.push({
      id: question.id,
      label: question.label,
      option,
    });
  });

  const band = config.bands.find((candidate) => total >= candidate.min && total <= candidate.max);

  return {
    total,
    maxScore: Number(config.maxScore || 0),
    band,
    answers,
    unanswered,
  };
}

function buildFindings(result) {
  return result.answers
    .filter((answer) => answer.option.score >= 3)
    .map((answer) => answer.option.finding)
    .slice(0, 3);
}

function buildContactHref(href, result) {
  const url = new URL(href, window.location.origin);
  url.searchParams.set("source", "scorecard");
  url.searchParams.set("score", String(result.total));
  url.searchParams.set("band", result.band.slug);
  return url.toString();
}

function renderResult(container, result) {
  if (!result.band) {
    container.innerHTML = '<p class="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">Something is off in the scoring setup. Reload and try again.</p>';
    return;
  }

  const findings = buildFindings(result);
  const primaryHref = buildContactHref(result.band.primaryCta.href, result);
  const secondaryHref = buildContactHref(result.band.secondaryCta.href, result);
  const findingsMarkup = findings.length
    ? findings.map((finding) => `<li>${finding}</li>`).join("")
    : "<li>Your answers suggest the signal is relatively stable, but future changes should still be guarded carefully.</li>";

  container.innerHTML = `
    <div class="rounded-xl border border-indigo-400/30 bg-indigo-400/10 p-4">
      <p class="text-sm uppercase tracking-[0.2em] text-indigo-200">Score</p>
      <div class="mt-2 flex items-end gap-3">
        <p class="text-4xl font-black text-white">${result.total}<span class="text-lg text-indigo-100">/${result.maxScore}</span></p>
        <p class="mb-1 text-sm font-semibold text-indigo-100">${result.band.label}</p>
      </div>
    </div>
    <p class="text-sm leading-6 text-gray-200">${result.band.summary}</p>
    <div class="rounded-xl border border-white/10 bg-white/5 p-4">
      <p class="text-sm font-semibold uppercase tracking-[0.2em] text-gray-300">Immediate findings</p>
      <ul class="mt-3 space-y-2 text-sm leading-6 text-gray-100">${findingsMarkup}</ul>
    </div>
    <div class="grid gap-3 sm:grid-cols-2">
      <a href="${primaryHref}" class="inline-flex items-center justify-center rounded-md bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-400">${result.band.primaryCta.label}</a>
      <a href="${secondaryHref}" class="inline-flex items-center justify-center rounded-md border border-white/20 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10">${result.band.secondaryCta.label}</a>
    </div>
  `;
}

function initScorecard(doc) {
  const form = doc.getElementById("revenue-signal-scorecard");
  const dataNode = doc.getElementById("revenue-signal-scorecard-data");
  const output = doc.getElementById("scorecard-output");

  if (!form || !dataNode || !output) {
    return;
  }

  const config = JSON.parse(dataNode.textContent);

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

    renderResult(output, result);
    output.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => initScorecard(document));
}

module.exports = {
  buildFindings,
  initScorecard,
  scoreResponses,
};
