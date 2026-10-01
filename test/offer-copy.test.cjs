const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const files = [
  "content/services/_index.md",
  "content/services/ai-agent-implementation.md",
  "content/answers/ai-agent-implementation-cost.md",
  "layouts/partials/home-tools.html",
];

test("Build Queue copy does not carry retired terms", () => {
  const retired = [/75 percent/i, /locked (for|6)/i, /price lock/i, /ongoing tuning/i, /first ai agent implementation free/i];
  for (const file of files) {
    const text = fs.readFileSync(path.join(root, file), "utf8");
    for (const pattern of retired) {
      assert.doesNotMatch(text, pattern, `${file} matches ${pattern}`);
    }
  }
});
