(function () {
  "use strict";

  var TOTAL_STEPS = 3;
  var currentStep = 1;

  var step1Confirmed = false; // gated by clicking "Download the desktop app"
  var step2TimerStarted = false; // gated by pressing play on the timer
  var step2Bypassed = false; // gated by "Continue without tracking time" in the help modal
  var step2ProjectAssigned = false; // no project means there's nothing to track time to

  var sidebar = document.getElementById("sidebar-toggle");
  var segmentsRoot = document.getElementById("segments");
  var progressFill = document.getElementById("progress-fill");
  var btnBack = document.getElementById("btn-back");
  var btnSkip = document.getElementById("btn-skip");
  var btnContinue = document.getElementById("btn-continue");
  var continueTooltip = document.getElementById("continue-tooltip");
  var onboardingRoot = document.getElementById("onboarding");
  var mainAction = document.getElementById("main-action");
  var step2AlertText = document.getElementById("step2-alert-text");

  var stepPanels = {
    1: document.getElementById("step-panel-1"),
    2: document.getElementById("step-panel-2"),
    3: document.getElementById("step-panel-3"),
  };

  var STEP_COPY = {
    1: {
      title: "Download the desktop app",
      body: "This is used to track time to your projects and tasks",
    },
    2: {
      title: "Install the desktop app and track time to a project",
      body: "Start the timer on the desktop app to confirm your setup",
    },
    3: {
      title: "Get familiar with Hubstaff",
      body: "Check out the video below and learn more about how to use Hubstaff",
    },
  };

  // Tooltip copy for a disabled Continue — only steps with a real gate need one
  var CONTINUE_TOOLTIP_COPY = {
    1: "Click the Download button for the desktop app to continue",
    2: "Wait for the desktop app to confirm tracking",
  };

  function isContinueUnlocked() {
    if (currentStep === 1) return step1Confirmed;
    if (currentStep === 2) return step2TimerStarted || step2Bypassed;
    return true;
  }

  function setContinueButtonContent() {
    btnContinue.textContent = "";
    var label = document.createElement("span");
    label.textContent = currentStep === TOTAL_STEPS ? "Finish" : "Continue";
    btnContinue.appendChild(label);
    var icon = document.createElement("span");
    icon.className = "material-symbols-rounded";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = currentStep === TOTAL_STEPS ? "check" : "arrow_forward";
    btnContinue.appendChild(icon);
  }

  function renderStep() {
    // Copy — static per step; step 2 no longer swaps copy on tracking start
    // (the final Figma hand-off only shows one title/body/alert state for it).
    document.getElementById("onboarding-title").textContent = STEP_COPY[currentStep].title;
    document.getElementById("onboarding-body").textContent = STEP_COPY[currentStep].body;
    if (currentStep === 2) {
      step2AlertText.textContent = "This timer will turn blue when you start tracking time. We’ll make sure everything is set up right.";
    }

    // Progress bar — continuous fill (matches the Figma "ProgressBars" component)
    progressFill.style.width = Math.round((currentStep / TOTAL_STEPS) * 100) + "%";
    segmentsRoot.setAttribute("aria-valuenow", String(currentStep));

    // Step panels
    Object.keys(stepPanels).forEach(function (key) {
      stepPanels[key].hidden = Number(key) !== currentStep;
    });

    // Main action button only exists on step 1
    onboardingRoot.classList.toggle("has-main-action", currentStep === 1);

    // Back button hidden only on step 1 (nothing to go back to)
    btnBack.hidden = currentStep === 1;
    btnBack.disabled = currentStep === 1;

    // Skip is available on steps 1-2, hidden on the final step
    btnSkip.hidden = currentStep === TOTAL_STEPS;

    // Continue/Finish button state
    setContinueButtonContent();
    btnContinue.disabled = !isContinueUnlocked();

    // Tooltip explains why Continue is disabled, on any step that has a real gate
    var tooltipText = CONTINUE_TOOLTIP_COPY[currentStep];
    continueTooltip.hidden = !(tooltipText && btnContinue.disabled);
    if (tooltipText) {
      continueTooltip.textContent = tooltipText;
    }

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
    if (btnContinue.disabled) return;
    if (currentStep < TOTAL_STEPS) {
      currentStep += 1;
      renderStep();
    } else {
      window.dispatchEvent(new CustomEvent("onboarding:complete"));
    }
  });

  function skipOnboarding() {
    window.dispatchEvent(new CustomEvent("onboarding:skip"));
  }

  btnSkip.addEventListener("click", function () {
    // On Step 1, Skip just moves past the download prompt to Step 2 — it
    // doesn't exit the whole flow (there's nothing to skip to yet on Step 1).
    if (currentStep === 1) {
      currentStep = 2;
      renderStep();
      return;
    }
    skipOnboarding();
  });

  // ── Step 1: "Download the desktop app" main action ──────────────────────

  mainAction.addEventListener("click", function () {
    if (step1Confirmed) return;
    step1Confirmed = true;
    mainAction.disabled = true;
    mainAction.classList.add("is-confirmed");
    mainAction.textContent = "";
    var label = document.createElement("span");
    label.textContent = "Downloaded";
    mainAction.appendChild(label);
    var icon = document.createElement("span");
    icon.className = "material-symbols-rounded";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "check";
    mainAction.appendChild(icon);
    if (currentStep === 1) {
      btnContinue.disabled = false;
      continueTooltip.hidden = true;
    }
  });

  // ── Step 2: timer status ──────────────────────────────────────────────────
  // Nothing here is a real control — a web page can't start, stop, or even
  // observe the real desktop app's timer. The mockup only mirrors what
  // tracking looks like once the desktop app reports it started; the
  // "Simulate" link below stands in for that real report, for demo purposes.

  var timerBar = document.getElementById("timer-bar");
  var timerBarReadout = document.getElementById("timer-bar-readout");
  var timerStatus = document.getElementById("timer-status");
  var taskRowStatus = document.getElementById("task-row-status");
  var taskRowTime = document.getElementById("task-row-time");
  var projectAlert = document.getElementById("project-alert");
  var groupLabel = document.getElementById("group-label");
  var taskRow = document.getElementById("task-row");
  var waitingIndicator = document.getElementById("waiting-indicator");
  var btnRequestProject = document.getElementById("btn-request-project");
  var simulateTracking = document.getElementById("simulate-tracking");

  var elapsedSeconds = 0;
  var timerInterval = null;

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function formatHHMMSS(totalSeconds) {
    var h = Math.floor(totalSeconds / 3600);
    var m = Math.floor((totalSeconds % 3600) / 60);
    var s = totalSeconds % 60;
    return pad(h) + ":" + pad(m) + ":" + pad(s);
  }

  function formatShort(totalSeconds) {
    var h = Math.floor(totalSeconds / 3600);
    var m = Math.floor((totalSeconds % 3600) / 60);
    var s = totalSeconds % 60;
    return h > 0 ? h + ":" + pad(m) + ":" + pad(s) : m + ":" + pad(s);
  }

  function tick() {
    elapsedSeconds += 1;
    timerBarReadout.textContent = formatHHMMSS(elapsedSeconds);
    taskRowTime.textContent = formatShort(elapsedSeconds);
  }

  function flashProjectAlert() {
    projectAlert.classList.remove("is-shaking");
    // Force a reflow so re-adding the class restarts the animation even if
    // it's already mid-shake from a previous click.
    void projectAlert.offsetWidth;
    projectAlert.classList.add("is-shaking");
  }

  // Represents the desktop app reporting that tracking started — there's no
  // "pause" from here, because this page never had a way to stop the real
  // app's timer either. Once it starts, it just keeps counting.
  function startTimer() {
    // No project assigned means there's nothing to track time to — the
    // timer can't start. Draw attention to the alert instead.
    if (!step2ProjectAssigned) {
      flashProjectAlert();
      return;
    }

    if (step2TimerStarted) return;
    step2TimerStarted = true;

    // Resolve the "no project assigned" mockup state — swap the empty-state
    // UI for the assigned-project task row.
    timerBar.hidden = false;
    projectAlert.hidden = true;
    groupLabel.hidden = false;
    taskRow.hidden = false;
    waitingIndicator.hidden = true;
    simulateTracking.hidden = true;
    btnRequestProject.hidden = true;

    timerBar.classList.add("is-running");
    timerStatus.classList.add("is-running");
    taskRowStatus.classList.add("is-running");
    timerBarReadout.textContent = formatHHMMSS(elapsedSeconds);
    taskRowTime.textContent = formatShort(elapsedSeconds);
    timerInterval = window.setInterval(tick, 1000);

    if (currentStep === 2) {
      btnContinue.disabled = false;
      continueTooltip.hidden = true;
    }
  }

  simulateTracking.addEventListener("click", function () {
    step2ProjectAssigned = true;
    startTimer();
  });

  // ── Step 2: "need help" modal ─────────────────────────────────────────────

  var helpLink = document.getElementById("help-link");
  var helpModalOverlay = document.getElementById("help-modal-overlay");
  var helpModalClose = document.getElementById("help-modal-close");
  var helpModalBypass = document.getElementById("help-modal-bypass");

  function openHelpModal() {
    helpModalOverlay.hidden = false;
  }

  function closeHelpModal() {
    helpModalOverlay.hidden = true;
  }

  // "Continue without tracking time" unlocks Continue for this step without
  // actually starting the timer — distinct from the footer's Skip, which
  // exits the whole onboarding flow.
  function bypassTracking() {
    step2Bypassed = true;
    waitingIndicator.hidden = true;
    simulateTracking.hidden = true;
    if (currentStep === 2) {
      btnContinue.disabled = false;
      continueTooltip.hidden = true;
    }
    closeHelpModal();
  }

  helpLink.addEventListener("click", openHelpModal);
  helpModalClose.addEventListener("click", closeHelpModal);
  helpModalBypass.addEventListener("click", bypassTracking);
  btnRequestProject.addEventListener("click", openHelpModal);

  helpModalOverlay.addEventListener("click", function (event) {
    if (event.target === helpModalOverlay) closeHelpModal();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !helpModalOverlay.hidden) closeHelpModal();
  });

  renderStep();
})();
