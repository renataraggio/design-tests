/* AR0228 — Essentials VSMB churn discount offer
 *
 * Dialog state machine. Rebuilt against Figma section 141:10069, which
 * restructured the flow: the offer now comes FIRST and the archive
 * consequences second, only if the offer is declined.
 *
 *   Actions ▾ → Archive organization
 *     → 01 offer (141:6262)
 *          "Switch to Essentials"  → 03 confirmation (141:6390)
 *          "Archive organization"  → 02 archive consequences (141:6710)
 *     → 02 archive
 *          "Archive organization"  → row archived + 04 toast (141:6635)
 *          "Go back"               → 01 offer
 *
 * Two things the earlier build had are deliberately gone:
 *
 *  - The member-removal step. The section's own targeting note reads
 *    "exclude where member_count > 4 at assignment — orgs over the cap never
 *    see this offer??", so no org reaching this flow needs to shed members.
 *    The trailing "??" is the designer's, not a settled decision — see README.
 *  - The usage-data interpolation. The redesigned consequences copy is static
 *    ("All projects and To-dos will be cleared"), where the real
 *    ArchiveConsequencesDialog.vue interpolates live counts. Also flagged.
 */

(function () {
  'use strict';

  var ORGS = [
    { id: 'acme',     name: 'Acme Corp Ltd', initials: 'AC', color: '#374151' },
    { id: 'hubstaff', name: 'Hubstaff',      initials: 'H',  color: '#2aa7ff' },
    { id: 'kontrast', name: 'Kontrast',      initials: 'K',  color: '#1f2937' }
  ];

  var STEPS = {
    offer:   '#dlg-offer',
    archive: '#dlg-archive',
    done:    '#dlg-done'
  };

  var state = { step: null, activeOrgId: null, switched: {}, archived: {} };

  var $  = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  /* Stand-in for AnalyticsResource.create. Names reuse the real ones where an
     equivalent exists in hubstaff-server; the rest are proposals. */
  function trackEvent(name, props) {
    console.log('[analytics]', name, props || {});
  }

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
      if (state.archived[org.id]) { return; }

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

    var active = ORGS.length - Object.keys(state.archived).length;
    var archived = 1 + Object.keys(state.archived).length;
    $$('.tabs__tab')[0].textContent = 'ACTIVE (' + active + ')';
    $$('.tabs__tab')[1].textContent = 'ARCHIVED (' + archived + ')';
  }

  /* ── Step control ───────────────────────────────────────────────────── */

  function show(step) {
    Object.keys(STEPS).forEach(function (k) { $(STEPS[k]).hidden = true; });
    state.step = step;

    if (!step) { $('#scrim').hidden = true; return; }

    $('#scrim').hidden = false;
    $(STEPS[step]).hidden = false;

    var first = $(STEPS[step]).querySelector('button:not([disabled])');
    if (first) { first.focus(); }

    emitStepChange();
  }

  /* Design Annotations treats each dialog as a "page" (APPLY-DESIGN-ANNOTATIONS
     Step 4B, single-page app), so it needs to know when the step changes. */
  function emitStepChange() {
    window.dispatchEvent(new CustomEvent('ar0228:stepchange'));
  }

  function closeFlow() { show(null); }

  function showToast() {
    $('#toast').hidden = false;
  }

  function archiveOrg() {
    var org = activeOrg();
    state.archived[org.id] = true;
    trackEvent('Archive organization confirmed', { organization: org.id });
    renderOrgRows();
    closeFlow();
    $('#toast .toast__copy').textContent =
      org.name + ' is archived and your subscription is cancelled.';
    showToast();
  }

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
      $('#toast').hidden = true;
      trackEvent('Archive organization flow button clicked', { organization: state.activeOrgId });
      trackEvent('Archive offer viewed', { organization: state.activeOrgId });
      show('offer');
      return;
    }

    closeAllMenus();

    if (e.target.closest('[data-toast-close]')) { $('#toast').hidden = true; return; }
    if (e.target.closest('[data-close]'))       { closeFlow(); return; }

    var action = e.target.closest('[data-action]');
    if (!action) { return; }

    switch (action.getAttribute('data-action')) {
      case 'switch-to-essentials':
        state.switched[activeOrg().id] = true;
        trackEvent('Essentials offer accepted', { organization: state.activeOrgId });
        renderOrgRows();
        show('done');
        break;

      case 'offer-archive':
        trackEvent('Archive offer declined', { organization: state.activeOrgId });
        show('archive');
        break;

      case 'archive-back':
        trackEvent('Archive consequences dismissed', { organization: state.activeOrgId });
        show('offer');
        break;

      case 'archive-confirm':
        archiveOrg();
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
    else { $('#toast').hidden = true; }
  });

  $('#scrim').addEventListener('click', closeFlow);

  /* Reset — used by the demo-mode controls, not part of the design. */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-goto="reset"]')) { return; }
    state.switched = {};
    state.archived = {};
    state.activeOrgId = null;
    $('#toast').hidden = true;
    renderOrgRows();
    closeFlow();
  });

  /* Adapter for the Design Annotations engine, which treats each dialog as a
     page and needs to open one before it can highlight inside it. */
  window.AR0228Flow = {
    goToPage: function (pageId) {
      $('#toast').hidden = true;
      if (pageId === 'organizations') { closeFlow(); return; }
      if (!state.activeOrgId) { state.activeOrgId = ORGS[0].id; }
      if (pageId === 'toast') {
        closeFlow();
        $('#toast .toast__copy').textContent =
          activeOrg().name + ' is archived and your subscription is cancelled.';
        showToast();
        emitStepChange();
        return;
      }
      show(pageId);
    },
    currentPageId: function () {
      if (state.step) { return state.step; }
      return $('#toast').hidden ? 'organizations' : 'toast';
    }
  };

  renderOrgRows();
}());
