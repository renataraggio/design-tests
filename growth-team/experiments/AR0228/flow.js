/* AR0228 — Essentials VSMB churn discount offer
 *
 * Dialog state machine, rebuilt against Figma section 141:10069.
 *
 * The order has reverted to consequences-first, which is also the order the
 * shipped ArchiveOrganizationFlow.vue uses (FLOWS.with_offer =
 * ['consequences', 'offer', 'feedback']):
 *
 *   Actions ▾ → Archive organization
 *     → 01 archive consequences (156:16588)
 *          "Archive organization" → 02 offer
 *          "Keep organization"    → close
 *     → 02 Essentials offer (153:11279)
 *          "Switch to Essentials" → 03 confirmation
 *          "Continue to cancel"   → the plan page (outside this prototype)
 *     → 03 confirmation (153:11761)
 *
 * Two things this revision removed: the archived toast, and any path that
 * actually archives. "Continue to cancel" hands off to the plan page, so no
 * organization is archived inside this flow.
 */

(function () {
  'use strict';

  var ORGS = [
    { id: 'acme',     name: 'Acme Corp Ltd', initials: 'AC', color: '#374151' },
    { id: 'hubstaff', name: 'Hubstaff',      initials: 'H',  color: '#2aa7ff' },
    { id: 'kontrast', name: 'Kontrast',      initials: 'K',  color: '#1f2937' }
  ];

  /* The callout rows carry live counts again, the way
     ArchiveConsequencesDialog.vue builds them, rather than the static copy the
     previous revision used. Seeded per org so the numbers aren't a constant. */
  var USAGE = {
    acme:     { projects: 1, members: 1 },
    hubstaff: { projects: 4, members: 3 },
    kontrast: { projects: 2, members: 2 }
  };

  var STEPS = {
    archive: '#dlg-archive',
    offer:   '#dlg-offer',
    done:    '#dlg-done'
  };

  var state = { step: null, activeOrgId: null, switched: {} };

  var $  = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  function trackEvent(name, props) {
    console.log('[analytics]', name, props || {});
  }

  function pluralize(n, one, many) { return n === 1 ? one : many; }

  function activeOrg() {
    for (var i = 0; i < ORGS.length; i++) {
      if (ORGS[i].id === state.activeOrgId) { return ORGS[i]; }
    }
    return ORGS[0];
  }

  /* ── Rendering ──────────────────────────────────────────────────────── */

  function renderOrgRows() {
    var tbody = $('#org-rows');
    tbody.innerHTML = '';

    ORGS.forEach(function (org) {
      var tr = document.createElement('tr');

      var tdName = document.createElement('td');
      tdName.className = 'orgs__td';
      tdName.innerHTML =
        '<div class="orgs__name">' +
          '<span class="avatar avatar--lg" style="background:' + org.color + '">' + org.initials + '</span>' +
          '<a class="orgs__name-link" href="#">' + org.name + '</a>' +
          (state.switched[org.id] ? '<span class="orgs__plan">Essentials</span>' : '') +
        '</div>';

      var tdActions = document.createElement('td');
      tdActions.className = 'orgs__td orgs__td--actions';
      tdActions.innerHTML =
        '<div class="actions">' +
          '<button type="button" class="actions__btn" data-actions-toggle="' + org.id + '">' +
            'Actions <span class="material-symbols-rounded">expand_more</span>' +
          '</button>' +
          '<div class="actions__menu" id="menu-' + org.id + '" hidden>' +
            '<button type="button" class="actions__item" data-archive-org="' + org.id + '">Archive organization</button>' +
          '</div>' +
        '</div>';

      tr.appendChild(tdName);
      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });
  }

  function renderArchive() {
    var u = USAGE[activeOrg().id] || USAGE.acme;
    var items = [
      u.projects + ' ' + pluralize(u.projects, 'Project', 'Projects'),
      'All recorded screenshots for ' + u.members + ' ' + pluralize(u.members, 'member', 'members'),
      'Productivity and performance metrics for ' + u.members + ' ' + pluralize(u.members, 'member', 'members')
    ];

    $('#cq-items').innerHTML = items.map(function (text) {
      return '<li class="cq__item">' +
        '<span class="errico" aria-hidden="true">' +
          '<img src="assets/error-circle-red-group.svg" alt="" />' +
          '<img src="assets/error-circle-red-stroke.svg" alt="" />' +
        '</span><span class="cq__item-text">' + text + '</span></li>';
    }).join('');
  }

  /* ── Step control ───────────────────────────────────────────────────── */

  function show(step) {
    Object.keys(STEPS).forEach(function (k) { $(STEPS[k]).hidden = true; });
    state.step = step;

    if (!step) { $('#scrim').hidden = true; emitStepChange(); return; }

    if (step === 'archive') { renderArchive(); }

    $('#scrim').hidden = false;
    $(STEPS[step]).hidden = false;

    var first = $(STEPS[step]).querySelector('button:not([disabled])');
    if (first) { first.focus(); }

    emitStepChange();
  }

  /* Design Annotations treats each dialog as a "page", so it needs to know
     when the step changes. */
  function emitStepChange() {
    window.dispatchEvent(new CustomEvent('ar0228:stepchange'));
  }

  function closeFlow() { show(null); }

  function closeAllMenus() {
    $$('.actions__menu').forEach(function (m) { m.hidden = true; });
  }

  /* ── Events ─────────────────────────────────────────────────────────── */

  document.addEventListener('click', function (e) {
    var toggle = e.target.closest('[data-actions-toggle]');
    if (toggle) {
      var menu = $('#menu-' + toggle.getAttribute('data-actions-toggle'));
      var wasOpen = !menu.hidden;
      closeAllMenus();
      menu.hidden = wasOpen;
      return;
    }

    var start = e.target.closest('[data-archive-org]');
    if (start) {
      closeAllMenus();
      state.activeOrgId = start.getAttribute('data-archive-org');
      trackEvent('Archive organization flow button clicked', { organization: state.activeOrgId });
      show('archive');
      return;
    }

    closeAllMenus();

    if (e.target.closest('[data-close]')) { closeFlow(); return; }

    var action = e.target.closest('[data-action]');
    if (!action) { return; }

    switch (action.getAttribute('data-action')) {
      case 'keep-organization':
        trackEvent('Keep organization clicked', { organization: state.activeOrgId });
        closeFlow();
        break;

      case 'archive-continue':
        trackEvent('Archive offer viewed', { organization: state.activeOrgId });
        show('offer');
        break;

      case 'switch-to-essentials':
        state.switched[activeOrg().id] = true;
        trackEvent('Essentials offer accepted', { organization: state.activeOrgId });
        renderOrgRows();
        show('done');
        break;

      case 'continue-to-cancel':
        /* The Figma annotates this as "Goes to plan page" — a destination
           outside this prototype, so the flow just ends here. */
        trackEvent('Archive offer declined', { organization: state.activeOrgId });
        console.log('[flow] Real flow would navigate to the plan page here.');
        closeFlow();
        break;

      case 'done-close':
        closeFlow();
        break;
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') { return; }
    closeAllMenus();
    if (state.step) { closeFlow(); }
  });

  $('#scrim').addEventListener('click', closeFlow);

  /* Reset — used by the demo-mode controls, not part of the design. */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-goto="reset"]')) { return; }
    state.switched = {};
    state.activeOrgId = null;
    renderOrgRows();
    closeFlow();
  });

  /* Adapter for the Design Annotations engine, which treats each dialog as a
     page and needs to open one before it can highlight inside it. */
  window.AR0228Flow = {
    goToPage: function (pageId) {
      if (pageId === 'organizations') { closeFlow(); return; }
      if (!state.activeOrgId) { state.activeOrgId = ORGS[0].id; }
      show(pageId);
    },
    currentPageId: function () {
      return state.step || 'organizations';
    }
  };

  renderOrgRows();
}());
