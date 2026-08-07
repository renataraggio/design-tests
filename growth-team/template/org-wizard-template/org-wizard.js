/* ==========================================================================
   Org wizard — behaviour
   Vanilla JS, no build step. Mirrors getting-started-template/onboarding.js.
   ========================================================================== */

(function () {
  "use strict";

  /* ── Step config ───────────────────────────────────────────────────────
     Copy lives here, not in the markup, so each step's heading is driven by
     one source. Fixes two source-file defects: step 2 shipped with no
     heading at all, and the "All platforms" variant of step 3 carried step
     1's subtitle. ------------------------------------------------------- */

  var STEPS = [
    {
      id: "step-1",
      title: "Create your organization",
      subtitle: "This is how your workspace will display to your team.",
    },
    {
      id: "step-2",
      title: "Set your goals",
      subtitle: "Tell us what you want to get out of Hubstaff so we can tailor your workspace.",
    },
    {
      id: "step-3",
      title: "How do you want your team to track time?",
      subtitle: "Hubstaff supports multiple ways to track time. You can change this for your org or for individuals in your org settings.",
    },
    {
      id: "step-4",
      title: "Invite your team",
      subtitle: "Accelerate your setup by inviting your first manager, team lead, or user. You can always change permissions later.",
    },
  ];

  var currentStep = 1;

  var progress = document.getElementById("progress");
  var segments = progress.querySelectorAll(".wizard-progress__seg");
  var titleEl = document.getElementById("step-title");
  var subtitleEl = document.getElementById("step-subtitle");
  var announcer = document.getElementById("step-announcer");
  var btnBack = document.getElementById("btn-back");
  var btnContinue = document.getElementById("btn-continue");
  var btnContinueLabel = document.getElementById("btn-continue-label");
  var scroller = document.querySelector(".wizard__body");

  /* ── Step navigation ─────────────────────────────────────────────────── */

  function renderStep() {
    var config = STEPS[currentStep - 1];

    STEPS.forEach(function (step, index) {
      document.getElementById(step.id).hidden = index !== currentStep - 1;
    });

    titleEl.textContent = config.title;
    subtitleEl.textContent = config.subtitle;

    // Segments fill 1..n inclusive — the current step counts as reached.
    // The source file filled n-1, so step 1 showed an empty bar.
    segments.forEach(function (segment, index) {
      segment.classList.toggle("is-complete", index < currentStep);
    });
    progress.setAttribute("aria-valuenow", String(currentStep));
    progress.setAttribute("aria-valuetext", "Step " + currentStep + " of " + STEPS.length);

    btnBack.disabled = currentStep === 1;
    btnContinueLabel.textContent = currentStep === STEPS.length ? "Finish" : "Continue";

    announcer.textContent = "Step " + currentStep + " of " + STEPS.length + ": " + config.title;
    scroller.scrollTop = 0;

    // Design Annotations treats each step as a "page" — keep it in sync.
    window.dispatchEvent(
      new CustomEvent("orgwizard:stepchange", { detail: { pageId: config.id } })
    );
  }

  function goTo(step) {
    currentStep = Math.min(Math.max(step, 1), STEPS.length);
    renderStep();
  }

  /* Public API — used by the Design Annotations SPA adapter in index.html. */
  window.OrgWizard = {
    goToPage: function (pageId) {
      var index = STEPS.findIndex(function (s) {
        return s.id === pageId;
      });
      if (index >= 0) goTo(index + 1);
    },
    currentPageId: function () {
      return STEPS[currentStep - 1].id;
    },
    expandInviteUsers: function () {
      var toggle = document.getElementById("invite-users-toggle");
      if (toggle.getAttribute("aria-expanded") !== "true") toggle.click();
    },
  };

  btnBack.addEventListener("click", function () {
    if (currentStep > 1) goTo(currentStep - 1);
  });

  btnContinue.addEventListener("click", function () {
    if (currentStep < STEPS.length) {
      goTo(currentStep + 1);
    } else {
      window.dispatchEvent(new CustomEvent("orgwizard:complete"));
    }
  });

  /* ── Radio groups (chips + option cards) ──────────────────────────────
     One keyboard/selection implementation shared by every radiogroup on
     every step: roving tabindex, arrow-key cycling, Home/End. ---------- */

  function initRadioGroup(group) {
    var radios = Array.prototype.slice.call(group.querySelectorAll('[role="radio"]'));
    if (!radios.length) return;

    function syncTabindex() {
      var checked = radios.filter(function (r) {
        return r.getAttribute("aria-checked") === "true";
      })[0];
      radios.forEach(function (radio) {
        radio.tabIndex = radio === (checked || radios[0]) ? 0 : -1;
      });
    }

    function select(radio, focus) {
      radios.forEach(function (r) {
        r.setAttribute("aria-checked", String(r === radio));
      });
      syncTabindex();
      if (focus) radio.focus();
      group.dispatchEvent(
        new CustomEvent("radiochange", { detail: { value: radio.value }, bubbles: true })
      );
    }

    radios.forEach(function (radio, index) {
      radio.addEventListener("click", function () {
        select(radio, false);
      });

      radio.addEventListener("keydown", function (event) {
        var next = null;
        switch (event.key) {
          case "ArrowRight":
          case "ArrowDown":
            next = radios[(index + 1) % radios.length];
            break;
          case "ArrowLeft":
          case "ArrowUp":
            next = radios[(index - 1 + radios.length) % radios.length];
            break;
          case "Home":
            next = radios[0];
            break;
          case "End":
            next = radios[radios.length - 1];
            break;
          default:
            return;
        }
        event.preventDefault();
        select(next, true);
      });
    });

    syncTabindex();
  }

  document.querySelectorAll("[data-radiogroup]").forEach(initRadioGroup);

  /* ── Step 2 — goal selection drives the preview sidebar ──────────────── */

  var GOAL_NAV = {
    monitor: [
      { group: "Activity", icon: "monitoring" },
      { item: "Screenshots" },
      { item: "Apps & URLs" },
      { group: "Insights", icon: "bar_chart" },
      { item: "Performance" },
      { item: "Unusual activity" },
    ],
    schedules: [
      { group: "Schedules", icon: "calendar_month" },
      { item: "Shifts" },
      { item: "Time off" },
      { group: "Reports", icon: "bar_chart" },
      { item: "Attendance" },
      { item: "Time & activity" },
    ],
    pay: [
      { group: "Financials", icon: "account_balance_wallet" },
      { item: "Payments" },
      { item: "Invoices" },
      { group: "Reports", icon: "bar_chart" },
      { item: "Payroll" },
      { item: "Amounts owed" },
    ],
    productivity: [
      { group: "Insights", icon: "bar_chart" },
      { item: "Performance" },
      { item: "Unusual activity" },
      { group: "Activity", icon: "monitoring" },
      { item: "Apps & URLs" },
      { item: "Work breaks" },
    ],
    exploring: null, // no tailoring — keep the neutral skeleton
  };

  var goalsNav = document.getElementById("goals-nav");

  function renderGoalsNav(value) {
    var rows = GOAL_NAV[value];
    goalsNav.textContent = "";

    if (!rows) {
      for (var i = 0; i < 4; i += 1) {
        var skeleton = document.createElement("div");
        skeleton.className = "sk-row";
        skeleton.appendChild(el("span", "sk-dot"));
        skeleton.appendChild(el("span", "sk-bar sk-bar--strong"));
        goalsNav.appendChild(skeleton);
      }
      return;
    }

    rows.forEach(function (row) {
      if (row.group) {
        var group = el("span", "mock-nav__group");
        var icon = el("span", "material-symbols-rounded");
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = row.icon;
        group.appendChild(icon);
        group.appendChild(document.createTextNode(row.group));
        goalsNav.appendChild(group);
      } else {
        var item = el("span", "mock-nav__item");
        item.textContent = row.item;
        goalsNav.appendChild(item);
      }
    });
  }

  document.getElementById("goals").addEventListener("radiochange", function (event) {
    renderGoalsNav(event.detail.value);
  });
  renderGoalsNav("monitor");

  /* ── Step 3 — tracking method drives the device preview ──────────────── */

  var phone = document.getElementById("all-platforms-phone");
  var silentStack = document.getElementById("silent-stack");

  function renderTrackingPreview(value) {
    phone.hidden = value !== "all";
    silentStack.hidden = value !== "silent";
  }

  document.getElementById("tracking").addEventListener("radiochange", function (event) {
    renderTrackingPreview(event.detail.value);
  });
  renderTrackingPreview("desktop");

  /* ── Step 4 — disclosure, dynamic rows, copy link, preview ───────────── */

  var disclosureToggle = document.getElementById("invite-users-toggle");
  var disclosurePanel = document.getElementById("invite-users-panel");

  disclosureToggle.addEventListener("click", function () {
    var expanded = disclosureToggle.getAttribute("aria-expanded") === "true";
    disclosureToggle.setAttribute("aria-expanded", String(!expanded));
    disclosurePanel.hidden = expanded;
    renderInvitePreview();
  });

  document.querySelectorAll("[data-add-row]").forEach(function (button) {
    button.addEventListener("click", function () {
      var list = document.getElementById(button.dataset.addRow);
      var role = button.dataset.role;

      var group = el("div", "input-group");

      var input = el("input", "input");
      input.type = "email";
      input.autocomplete = "off";
      input.placeholder = "name@company.com";
      input.setAttribute("aria-label", role + " email address");

      var select = el("select", "input-group__addon");
      select.setAttribute("aria-label", "Role for new " + role.toLowerCase());
      ["Manager", "Member", "Viewer"].forEach(function (option) {
        var opt = document.createElement("option");
        opt.textContent = option;
        opt.selected = option === role;
        select.appendChild(opt);
      });

      group.appendChild(input);
      group.appendChild(select);
      list.appendChild(group);
      input.focus();
      renderInvitePreview();
    });
  });

  var copyBtn = document.getElementById("copy-link");
  var copyStatus = document.getElementById("copy-status");
  var inviteLink = document.getElementById("invite-link");

  copyBtn.addEventListener("click", function () {
    var done = function () {
      copyBtn.textContent = "Copied";
      copyStatus.textContent = "Invite link copied to clipboard";
      window.setTimeout(function () {
        copyBtn.textContent = "Copy";
      }, 2000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(inviteLink.value).then(done, function () {
        inviteLink.select();
        copyStatus.textContent = "Press Ctrl or Cmd + C to copy the invite link";
      });
    } else {
      inviteLink.select();
      copyStatus.textContent = "Press Ctrl or Cmd + C to copy the invite link";
    }
  });

  /* Zone: Blue 600, Red 600, Purple 600, Green 500, Orange 600, Teal 500. */
  var AVATAR_COLORS = ["#2f8af4", "#e02424", "#7f3cf2", "#0e9f6e", "#e7721a", "#0694a2"];
  var invitePreviewGrid = document.getElementById("invite-preview-grid");
  var step4 = document.getElementById("step-4");

  function renderInvitePreview() {
    var invitees = [];

    step4.querySelectorAll(".input-group").forEach(function (group) {
      // Rows inside a collapsed disclosure are not part of the invite yet.
      if (group.closest(".disclosure__panel[hidden]")) return;
      var input = group.querySelector('input[type="email"]');
      var select = group.querySelector("select");
      if (input && select && input.value.trim()) {
        invitees.push({ email: input.value.trim(), role: select.value });
      }
    });

    invitePreviewGrid.textContent = "";

    invitees.slice(0, 9).forEach(function (person, index) {
      var row = el("div", "mock-member");

      var avatar = el("span", "mock-member__avatar");
      avatar.style.background = AVATAR_COLORS[index % AVATAR_COLORS.length];
      avatar.textContent = person.email.charAt(0).toUpperCase();

      var text = el("div", "");
      text.style.minWidth = "0";
      var email = el("div", "mock-member__email");
      email.textContent = person.email;
      var role = el("div", "mock-member__role");
      role.textContent = person.role;
      text.appendChild(email);
      text.appendChild(role);

      row.appendChild(avatar);
      row.appendChild(text);
      invitePreviewGrid.appendChild(row);
    });

    for (var i = invitees.length; i < 9; i += 1) {
      var placeholder = el("div", "sk-row");
      placeholder.appendChild(el("span", "sk-dot"));
      placeholder.appendChild(el("span", "sk-bar"));
      invitePreviewGrid.appendChild(placeholder);
    }
  }

  step4.addEventListener("input", renderInvitePreview);
  step4.addEventListener("change", renderInvitePreview);
  renderInvitePreview();

  /* ── Helpers ─────────────────────────────────────────────────────────── */

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  renderStep();
})();
