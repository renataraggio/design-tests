(function () {
  "use strict";

  var TOTAL_STEPS = 3;
  var currentStep = 1;

  var step1Confirmed = false; // gated by clicking "Download the desktop app"
  var step2TimerStarted = false; // gated by pressing play on the timer
  var step2Bypassed = false; // gated by "Continue without tracking time" in the help modal

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
      step2AlertText.textContent = "We’ll let you know the moment we can see you tracking time.";
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

    syncSetupStory();
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
  // Shared by Step 1's own button and Step 2's "Download" CTA — reachable
  // there whenever Step 1 was skipped without confirming the download.

  function confirmDownload() {
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
    syncSetupStory();
  }

  mainAction.addEventListener("click", confirmDownload);

  // ── Step 2: setup story + signal status ───────────────────────────────────
  // Nothing here is a real control — a web page can't start, stop, or even
  // observe the real desktop app's timer, so there's no fake app window or
  // fake clickable timer. Instead this tells the story of what we expect
  // (download → open the app → press play) and honestly shows that this
  // page is just listening for a signal, not hosting the action itself.
  // The "Simulate" link stands in for that real signal, for demo purposes.

  var setupStepDownload = document.getElementById("setup-step-download");
  var setupStepDownloadCta = document.getElementById("setup-step-download-cta");
  var setupStepOpen = document.getElementById("setup-step-open");
  var setupStepPlay = document.getElementById("setup-step-play");
  var signalStatus = document.getElementById("signal-status");
  var signalStatusText = document.getElementById("signal-status-text");
  var signalStatusCheck = document.getElementById("signal-status-check");
  var btnRequestProject = document.getElementById("btn-request-project");
  var simulateTracking = document.getElementById("simulate-tracking");

  function markStepComplete(stepEl, glyph) {
    stepEl.classList.remove("is-current", "is-pending");
    stepEl.classList.add("is-complete");
    var icon = stepEl.querySelector(".setup-step__icon");
    icon.innerHTML = "";
    var span = document.createElement("span");
    span.className = "material-symbols-rounded";
    span.setAttribute("aria-hidden", "true");
    span.textContent = glyph;
    icon.appendChild(span);
  }

  // Keeps the 3-step story honest about what actually happened. Skip on
  // Step 1 can land someone on Step 2 without ever confirming the download —
  // in that case, show a CTA to go do it, right where it's needed, rather
  // than a checkmark that isn't true yet.
  function syncSetupStory() {
    if (step1Confirmed) {
      markStepComplete(setupStepDownload, "check");
      setupStepDownloadCta.hidden = true;
    } else {
      setupStepDownload.classList.remove("is-complete", "is-pending");
      setupStepDownload.classList.add("is-current");
      document.getElementById("setup-step-download-icon").textContent = "download";
      setupStepDownloadCta.hidden = false;
    }

    // Only one step is ever the active/highlighted one — "Open Hubstaff"
    // while we wait on the download, then "Press play" stays dimmed until
    // tracking is actually confirmed (there's no distinct "app opened"
    // signal to promote it to active on its own).
    if (!step2TimerStarted) {
      setupStepOpen.classList.remove("is-current", "is-pending");
      setupStepOpen.classList.add(step1Confirmed ? "is-current" : "is-pending");

      setupStepPlay.classList.remove("is-current", "is-pending");
      setupStepPlay.classList.add("is-pending");
    }
  }

  setupStepDownloadCta.addEventListener("click", confirmDownload);

  // Represents the desktop app reporting that tracking started. There's no
  // "undo" from here — this page never had a way to stop the real app's
  // timer either, only to hear that it started.
  function reportTrackingStarted() {
    if (step2TimerStarted) return;
    step2TimerStarted = true;

    markStepComplete(setupStepOpen, "check");
    markStepComplete(setupStepPlay, "check");

    signalStatus.classList.add("is-confirmed");
    signalStatusCheck.hidden = false;
    signalStatusText.textContent = "Got it — we can see you’re tracking time.";

    btnRequestProject.hidden = true;
    simulateTracking.hidden = true;

    if (currentStep === 2) {
      btnContinue.disabled = false;
      continueTooltip.hidden = true;
    }
  }

  simulateTracking.addEventListener("click", reportTrackingStarted);

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
    signalStatus.classList.add("is-bypassed");
    signalStatusText.textContent = "Continuing without tracking time for now.";
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
