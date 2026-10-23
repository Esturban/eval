(function () {
  "use strict";
  var form = document.querySelector("form[name=agent-seat]");
  if (!form) return;
  var job = form.querySelector("#agent_job");
  var systems = form.querySelector("#systems");
  if (!job || !systems) return;

  function tools() {
    return systems.value.split(",").map(function (t) { return t.trim(); }).filter(Boolean);
  }
  function indexOfTool(list, name) {
    var key = name.toLowerCase();
    for (var i = 0; i < list.length; i++) {
      if (list[i].toLowerCase() === key) return i;
    }
    return -1;
  }
  function syncTools() {
    var list = tools();
    form.querySelectorAll("[data-suggest-tool]").forEach(function (chip) {
      var on = indexOfTool(list, chip.getAttribute("data-suggest-tool")) !== -1;
      chip.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }
  function toggleTool(name) {
    var list = tools();
    var at = indexOfTool(list, name);
    if (at === -1) list.push(name); else list.splice(at, 1);
    systems.value = list.join(", ");
    syncTools();
  }
  function addJob(text) {
    var current = job.value.trim();
    if (current.toLowerCase().indexOf(text.toLowerCase()) !== -1) return;
    job.value = current ? current + "\n" + text : text;
  }

  form.querySelectorAll("[data-suggest-job]").forEach(function (chip) {
    chip.addEventListener("click", function () { addJob(chip.getAttribute("data-suggest-job")); });
  });
  form.querySelectorAll("[data-suggest-tool]").forEach(function (chip) {
    chip.addEventListener("click", function () { toggleTool(chip.getAttribute("data-suggest-tool")); });
  });
  systems.addEventListener("input", syncTools);

  form.querySelectorAll(".seat-chips").forEach(function (box) { box.hidden = false; });
  syncTools();
})();
