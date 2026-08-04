(function () {
  "use strict";

  var TOTAL_STEPS = 2;
  var currentStep = 1;

  var appDownloaded = false; // gated by the "Download" CTA in the setup story
  var trackingConfirmed = false; // gated by the desktop app reporting tracking started
  var trackingBypassed = false; // gated by "Continue without tracking time" in the help modal
  var noProjectDetected = false; // gated by the desktop app reporting tracking with no project assigned

  var sidebar = document.getElementById("sidebar-toggle");
  var segmentsRoot = document.getElementById("segments");
  var progressFill = document.getElementById("progress-fill");
  var btnBack = document.getElementById("btn-back");
  var btnContinue = document.getElementById("btn-continue");
  var continueTooltip = document.getElementById("continue-tooltip");
  var step2AlertText = document.getElementById("step2-alert-text");

  var stepPanels = {
    1: document.getElementById("step-panel-1"),
    2: document.getElementById("step-panel-2"),
  };

  var STEP_COPY = {
    1: {
      title: "Install the desktop app and track time to a project",
      body: "Start the timer on the desktop app to confirm your setup",
    },
    2: {
      title: "Get familiar with Hubstaff",
      body: "Check out the video below and learn more about how to use Hubstaff",
    },
  };

  // Tooltip copy for a disabled Continue — only steps with a real gate need one
  var CONTINUE_TOOLTIP_COPY = {
    1: "Wait for the desktop app to confirm tracking",
  };

  function isContinueUnlocked() {
    if (currentStep === 1) return trackingConfirmed || trackingBypassed || noProjectDetected;
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
    document.getElementById("onboarding-title").textContent = STEP_COPY[currentStep].title;
    document.getElementById("onboarding-body").textContent = STEP_COPY[currentStep].body;
    if (currentStep === 1) {
      step2AlertText.textContent = "We’ll let you know the moment we can see you tracking time.";
    }

    // Progress bar — continuous fill (matches the Figma "ProgressBars" component)
    progressFill.style.width = Math.round((currentStep / TOTAL_STEPS) * 100) + "%";
    segmentsRoot.setAttribute("aria-valuenow", String(currentStep));

    // Step panels
    Object.keys(stepPanels).forEach(function (key) {
      stepPanels[key].hidden = Number(key) !== currentStep;
    });

    // Back button hidden only on step 1 (nothing to go back to)
    btnBack.hidden = currentStep === 1;
    btnBack.disabled = currentStep === 1;

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

  // ── Setup story + signal status ────────────────────────────────────────────
  // Nothing here is a real control — a web page can't start, stop, or even
  // observe the real desktop app's timer, so there's no fake app window or
  // fake clickable timer. Instead this tells the story of what we expect
  // (download → press play) and honestly shows that this page is just
  // listening for a signal, not hosting the action itself. The "Simulate"
  // link stands in for that real signal, for demo purposes.

  var setupStepDownload = document.getElementById("setup-step-download");
  var setupStepDownloadActions = document.getElementById("setup-step-download-actions");
  var setupStepDownloadCta = document.getElementById("setup-step-download-cta");
  var setupStepAlreadyDidCta = document.getElementById("setup-step-already-did-cta");
  var setupStepPlay = document.getElementById("setup-step-play");
  var signalStatus = document.getElementById("signal-status");
  var signalStatusText = document.getElementById("signal-status-text");
  var signalStatusCheck = document.getElementById("signal-status-check");
  var step2Alert = document.getElementById("step2-alert");
  var noProjectAlert = document.getElementById("no-project-alert");
  var simulateTracking = document.getElementById("simulate-tracking");
  var simulateNoProject = document.getElementById("simulate-no-project");

  function markStepComplete(stepEl, glyph) {
    stepEl.classList.remove("is-current", "is-next", "is-pending");
    stepEl.classList.add("is-complete");
    var icon = stepEl.querySelector(".setup-step__icon");
    icon.innerHTML = "";
    var span = document.createElement("span");
    span.className = "material-symbols-rounded";
    span.setAttribute("aria-hidden", "true");
    span.textContent = glyph;
    icon.appendChild(span);
  }

  // Keeps the 2-step story honest about what actually happened — nothing
  // downloads the app until one of the CTAs here is clicked.
  function syncSetupStory() {
    if (appDownloaded) {
      markStepComplete(setupStepDownload, "check");
      setupStepDownloadActions.hidden = true;
    } else {
      setupStepDownload.classList.remove("is-complete", "is-pending");
      setupStepDownload.classList.add("is-current");
      document.getElementById("setup-step-download-icon").textContent = "download";
      setupStepDownloadActions.hidden = false;
    }

    // "Press play" picks up the same active ring on its icon once the app is
    // downloaded — it has no in-page action of its own (it happens in the
    // real desktop app) so its label stays dimmed until it actually
    // completes, unlike Download's label which is live from the start.
    if (!trackingConfirmed) {
      setupStepPlay.classList.remove("is-next", "is-pending");
      setupStepPlay.classList.add(appDownloaded ? "is-next" : "is-pending");
    }
  }

  function confirmDownload() {
    if (appDownloaded) return;
    appDownloaded = true;
    syncSetupStory();
  }

  setupStepDownloadCta.addEventListener("click", confirmDownload);
  setupStepAlreadyDidCta.addEventListener("click", confirmDownload);

  // Represents the desktop app reporting that tracking started. There's no
  // "undo" from here — this page never had a way to stop the real app's
  // timer either, only to hear that it started.
  function reportTrackingStarted() {
    if (trackingConfirmed) return;
    trackingConfirmed = true;
    appDownloaded = true;

    markStepComplete(setupStepDownload, "check");
    setupStepDownloadActions.hidden = true;
    markStepComplete(setupStepPlay, "check");

    signalStatus.classList.add("is-confirmed");
    signalStatusCheck.hidden = false;
    signalStatusText.textContent = "Got it — we can see you’re tracking time.";

    step2Alert.classList.add("is-faded");
    helpLink.classList.add("is-faded");
    simulateTracking.hidden = true;
    simulateNoProject.hidden = true;

    if (currentStep === 1) {
      btnContinue.disabled = false;
      continueTooltip.hidden = true;
    }
  }

  simulateTracking.addEventListener("click", reportTrackingStarted);

  // Represents the desktop app reporting tracking with no project assigned —
  // an automated notice, not something the user resolves from this page
  // (the org's manager already got an email). Unlocks Continue like a
  // bypass, since there's no real "waiting" signal left to resolve here.
  function reportNoProjectDetected() {
    if (noProjectDetected) return;
    noProjectDetected = true;
    appDownloaded = true;
    syncSetupStory();

    noProjectAlert.hidden = false;
    simulateTracking.hidden = true;
    simulateNoProject.hidden = true;

    if (currentStep === 1) {
      btnContinue.disabled = false;
      continueTooltip.hidden = true;
    }
  }

  simulateNoProject.addEventListener("click", reportNoProjectDetected);

  // ── "Need help" modal ──────────────────────────────────────────────────────

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
  // actually starting the timer.
  function bypassTracking() {
    trackingBypassed = true;
    signalStatus.classList.add("is-bypassed");
    signalStatusText.textContent = "Continuing without tracking time for now.";
    simulateTracking.hidden = true;
    simulateNoProject.hidden = true;
    if (currentStep === 1) {
      btnContinue.disabled = false;
      continueTooltip.hidden = true;
    }
    closeHelpModal();
  }

  helpLink.addEventListener("click", openHelpModal);
  helpModalClose.addEventListener("click", closeHelpModal);
  helpModalBypass.addEventListener("click", bypassTracking);

  helpModalOverlay.addEventListener("click", function (event) {
    if (event.target === helpModalOverlay) closeHelpModal();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !helpModalOverlay.hidden) closeHelpModal();
  });

  renderStep();
})();
