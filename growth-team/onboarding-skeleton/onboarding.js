(function () {
  "use strict";

  var TOTAL_STEPS = 4;
  var currentStep = 1;

  var sidebar = document.getElementById("sidebar-toggle");
  var segments = document.querySelectorAll("#segments .onboarding-segments__item");
  var btnBack = document.getElementById("btn-back");
  var btnContinue = document.getElementById("btn-continue");
  var btnExplore = document.getElementById("btn-explore");

  function renderStep() {
    segments.forEach(function (segment, index) {
      segment.classList.toggle("is-complete", index < currentStep);
    });
    document.getElementById("segments").setAttribute("aria-valuenow", String(currentStep));
    btnBack.disabled = currentStep === 1;
    btnContinue.textContent = "";
    var label = document.createElement("span");
    label.textContent = currentStep === TOTAL_STEPS ? "Finish" : "Continue";
    btnContinue.appendChild(label);
    var icon = document.createElement("span");
    icon.className = "material-symbols-rounded";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "arrow_forward";
    btnContinue.appendChild(icon);
  }

  sidebar.addEventListener("click", function () {
    var expanded = sidebar.classList.toggle("is-expanded");
    sidebar.setAttribute("aria-expanded", String(expanded));
    sidebar.setAttribute("aria-label", expanded ? "Collapse sidebar" : "Expand sidebar");
  });

  btnBack.addEventListener("click", function () {
    if (currentStep > 1) {
      currentStep -= 1;
      renderStep();
    }
  });

  btnContinue.addEventListener("click", function () {
    if (currentStep < TOTAL_STEPS) {
      currentStep += 1;
      renderStep();
    } else {
      window.dispatchEvent(new CustomEvent("onboarding:complete"));
    }
  });

  btnExplore.addEventListener("click", function () {
    window.dispatchEvent(new CustomEvent("onboarding:skip"));
  });

  renderStep();
})();
