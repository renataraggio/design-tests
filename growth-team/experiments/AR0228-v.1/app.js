/* AR0228 — Unusual Activity → Slack activation
   Shared vanilla-JS state/behavior for both mockup pages. No framework, no CDN
   dependency — plain DOM. State persists in localStorage so the two pages (and
   reloads) stay in sync for a reviewer walking the flow.

   Two independent booleans, not one — an org can have Slack connected at the
   integration level (used for its existing timer/task notifications) without
   ever having turned it on for Unusual Activity / Smart Notifications:
     orgConnected — Settings > Integrations > Slack is authorized at all
     usedHere     — this feature already has an active Slack-delivered alert
   usedHere implies orgConnected, but not the reverse. The CTA copy and the
   embedded connect flow both branch on this — a re-authorized org should never
   be asked to "Allow" Slack access again.
*/
(function () {
  "use strict";

  var LS_ORG = "ar0228_orgConnected";
  var LS_USED = "ar0228_usedHere";
  var LS_DISMISSED = "ar0228_modalDismissed";
  var DEFAULT_CHANNEL = "#hubstaff-alerts";

  var state = {
    orgConnected: localStorage.getItem(LS_ORG) === "1",
    usedHere: localStorage.getItem(LS_USED) === "1",
    modalDismissed: localStorage.getItem(LS_DISMISSED) === "1",
  };
  // usedHere can't be true without orgConnected — guard against stale/edited storage.
  if (state.usedHere) state.orgConnected = true;

  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function show(el) { if (el) el.classList.remove("d-none"); }
  function hide(el) { if (el) el.classList.add("d-none"); }

  function persist() {
    localStorage.setItem(LS_ORG, state.orgConnected ? "1" : "0");
    localStorage.setItem(LS_USED, state.usedHere ? "1" : "0");
    localStorage.setItem(LS_DISMISSED, state.modalDismissed ? "1" : "0");
  }

  function closeAllModals() {
    $all(".modal-backdrop, .modal-wrap").forEach(hide);
  }

  function openModal(id) {
    closeAllModals();
    show($("#" + id + "-backdrop"));
    show($("#" + id));
  }

  function closeModal(id) {
    hide($("#" + id + "-backdrop"));
    hide($("#" + id));
  }

  // ---------- Render pass: reflect state into whichever growth surfaces exist on this page ----------
  function render() {
    var org = state.orgConnected, used = state.usedHere;
    var connectedUnused = org && !used;

    $all("[data-if=org-connected]").forEach(function (el) { el.classList.toggle("d-none", !org); });
    $all("[data-if=org-not-connected]").forEach(function (el) { el.classList.toggle("d-none", org); });
    $all("[data-if=used-here]").forEach(function (el) { el.classList.toggle("d-none", !used); });
    $all("[data-if=not-used-here]").forEach(function (el) { el.classList.toggle("d-none", used); });
    $all("[data-if=connected-unused]").forEach(function (el) { el.classList.toggle("d-none", !connectedUnused); });

    // Slack checkbox in the create-notification form: the real gate is org-level
    // integration status, not whether this feature has used it before.
    var slackCb = $("#cf-slack-checkbox");
    if (slackCb) {
      slackCb.disabled = !org;
      if (!org) slackCb.checked = false;
    }

    var protoState = $("#proto-state-label");
    if (protoState) {
      protoState.textContent = used ? "Fully set up — " + DEFAULT_CHANNEL
        : org ? "Slack connected, not used here"
        : "Not connected";
    }
    $all(".proto-option").forEach(function (el) {
      var v = el.getAttribute("data-arg");
      var active = (v === "used" && used) || (v === "unused" && connectedUnused) || (v === "none" && !org);
      el.classList.toggle("active", active);
    });
  }

  // ---------- Growth entry points ----------
  function openGrowthEntry() {
    if (state.usedHere) {
      openCreateForm(true);
    } else {
      openModal("popup");
    }
  }

  function openConnectFlow() {
    var step1 = $("#connect-step-1"), step2 = $("#connect-step-2");
    if (state.orgConnected) {
      // Already authorized — never re-run "Allow", jump straight to channel choice.
      if (step1) hide(step1);
      if (step2) show(step2);
    } else {
      if (step1) show(step1);
      if (step2) hide(step2);
    }
    openModal("connect");
  }

  function connectStep1Continue() {
    var btn = $("#connect-authorize-btn");
    if (btn) { btn.disabled = true; btn.textContent = "Connecting…"; }
    setTimeout(function () {
      if (btn) { btn.disabled = false; btn.textContent = "Allow"; }
      hide($("#connect-step-1"));
      show($("#connect-step-2"));
    }, 550);
  }

  function connectStep2Finish() {
    state.orgConnected = true;
    state.usedHere = true;
    persist();
    render();
    closeModal("connect");
    showToast("Slack alerts are on — sent to " + DEFAULT_CHANNEL + ".");
    setTimeout(function () { openCreateForm(true); }, 450);
  }

  function openCreateForm(prefillSlack) {
    var nameField = $("#cf-name");
    var metricField = $("#cf-metric");
    if (nameField && !nameField.value) nameField.value = "Unusual activity alert";
    if (metricField) metricField.value = "Unusual activity";
    updateMetricHint();
    var slackCb = $("#cf-slack-checkbox");
    if (slackCb && state.orgConnected) slackCb.checked = !!prefillSlack;
    render();
    openModal("create-form");
  }

  function updateMetricHint() {
    var metricField = $("#cf-metric");
    var thresholdRow = $("#cf-threshold-row");
    var uaHint = $("#cf-ua-hint");
    if (!metricField) return;
    var isUA = metricField.value === "Unusual activity";
    if (thresholdRow) thresholdRow.classList.toggle("d-none", isUA);
    if (uaHint) uaHint.classList.toggle("d-none", !isUA);
  }

  function dismissDetectModal(permanent) {
    if (permanent) { state.modalDismissed = true; persist(); }
    closeModal("detect");
  }

  function showToast(msg) {
    var toast = $("#toast");
    if (!toast) return;
    $("#toast-msg").textContent = msg;
    show(toast);
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { hide(toast); }, 4200);
  }

  // ---------- Prototype controls (not part of production UI) ----------
  function protoSetState(v) {
    if (v === "none") { state.orgConnected = false; state.usedHere = false; }
    if (v === "unused") { state.orgConnected = true; state.usedHere = false; }
    if (v === "used") { state.orgConnected = true; state.usedHere = true; }
    persist();
    render();
  }

  function protoReset() {
    localStorage.removeItem(LS_ORG);
    localStorage.removeItem(LS_USED);
    localStorage.removeItem(LS_DISMISSED);
    location.reload();
  }

  // ---------- Wire up on load ----------
  document.addEventListener("DOMContentLoaded", function () {
    render();

    $all("[data-action]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        var action = el.getAttribute("data-action");
        var arg = el.getAttribute("data-arg");
        switch (action) {
          case "growth-entry": openGrowthEntry(); break;
          case "open-connect": openConnectFlow(); break;
          case "connect-step1-continue": connectStep1Continue(); break;
          case "connect-step2-finish": connectStep2Finish(); break;
          case "open-create-form": openCreateForm(arg === "slack"); break;
          case "close-modal": closeModal(arg); break;
          case "dismiss-detect": dismissDetectModal(false); break;
          case "dismiss-detect-permanent": dismissDetectModal(true); break;
          case "dismiss-banner": hide(el.closest(".growth-banner")); break;
          case "dismiss-alert": hide(el.closest(".growth-alert")); break;
          case "proto-set-state": protoSetState(arg); break;
          case "proto-reset": protoReset(); break;
          case "save-notification":
            closeModal("create-form");
            showToast("Notification saved" + ($("#cf-slack-checkbox") && $("#cf-slack-checkbox").checked ? " — sent to Slack." : "."));
            break;
          case "noop": break;
        }
      });
    });

    var metricField = $("#cf-metric");
    if (metricField) metricField.addEventListener("change", updateMetricHint);

    // Auto-fire the proactive "moment of detection" modal once per browser,
    // only on pages that declare it, only if this feature hasn't been wired to
    // Slack yet, and only if not permanently dismissed.
    var detectModal = $("#detect");
    if (detectModal && !state.usedHere && !state.modalDismissed) {
      setTimeout(function () { openModal("detect"); }, 700);
    }
  });
})();
