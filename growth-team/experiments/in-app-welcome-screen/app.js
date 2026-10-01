// The five-beat state machine for the "in-app welcome screen" concept,
// driven by one persistent 3-person roster: each tick re-renders every
// row's trailing slot, measures the new natural height, and transitions
// #iw-stage-body to it. Replaced by a single static frame (beat 5, full
// roster, no cursor) under reduced motion.
//
// Standalone port of product/squads/growth/in-app-welcome-screen/
// prototype/index.html's inline <script> — same logic, Tailwind utility
// classes swapped for this folder's styles.css classes.
(function () {
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // hours/pay are strings so trailing zeros stay put. `dipped` is each
  // row's OWN unusual-activity figure, used whenever the rotation below
  // flags that row (not just Priya's any more).
  var ROWS = [
    { name: 'Maya Chen', pct: 92, hours: '8.6', pay: '215.00', elapsed: null /* ticks live */, dipped: 40 },
    { name: 'Tom Alvarez', pct: 78, hours: '7.9', pay: '197.50', elapsed: '02:48', dipped: 33 },
    { name: 'Priya Raman', pct: 85, hours: '8.1', pay: '202.50', elapsed: '03:05', dipped: 36 },
  ];

  // Round-robins which row the "unusual activity" beat flags, one step
  // per full pass through the 5 beats — deterministic, not random, so it
  // never repeats the same person back to back.
  var unusualTurn = 0;
  var activeFlaggedIndex = 0;
  var NUM_BEATS = 5;

  function pillPrimary(pct) {
    return '<span class="pill pill--primary">' + pct + '%</span>';
  }
  function pillWarning(pct) {
    return '<span class="pill--warning"><span class="material-symbols-rounded">warning</span>' + pct + '%</span>';
  }
  function trailingHTML(beatIdx, r, rowIdx) {
    if (beatIdx === 0) {
      return '<span class="material-symbols-rounded trailing-timer-icon">timer</span>' +
        '<span class="tabular-nums trailing-timer-value" data-row-timer="' + rowIdx + '">' + (r.elapsed || '00:00:00') + '</span>';
    }
    if (beatIdx === 1) return pillPrimary(r.pct);
    if (beatIdx === 2) return rowIdx === activeFlaggedIndex ? pillWarning(r.dipped) : pillPrimary(r.pct);
    if (beatIdx === 3) return '<span class="hours-trailing">' + r.hours + 'h</span>';
    return '<span class="pay-trailing">$' + r.pay + '</span>' +
      '<span class="pill pill--paid">Paid</span>';
  }

  var stageBody = document.getElementById('iw-stage-body');
  var stageInner = document.getElementById('iw-stage-inner');
  var cursorEl = document.getElementById('iw-cursor');
  var rowEls = Array.prototype.slice.call(document.querySelectorAll('[data-row]'));

  function renderBeat(idx) {
    // The header reads "My team" always (no dynamic per-beat title) —
    // only the rows' trailing content (and, for beat 2, which row is
    // flagged) change.
    if (idx === 2) {
      activeFlaggedIndex = unusualTurn % ROWS.length;
      unusualTurn++;
    }

    rowEls.forEach(function (rowEl, i) {
      var r = ROWS[i];
      rowEl.querySelector('[data-row-trailing="' + i + '"]').innerHTML = trailingHTML(idx, r, i);
      var dotEl = rowEl.querySelector('[data-row-dot="' + i + '"]');
      if (idx === 0) {
        setTimeout(function () { dotEl.style.display = 'flex'; }, i * 280);
      } else {
        dotEl.style.display = 'flex';
      }
      var isFlaggedNow = idx === 2 && i === activeFlaggedIndex;
      rowEl.classList.toggle('roster-row--flagged', isFlaggedNow);
    });
  }

  // The cursor only ever visits beat 2's flagged row — the one brief
  // individual-highlight exception. It stays hidden the rest of the time.
  function positionCursor() {
    var row = rowEls[activeFlaggedIndex];
    var trailing = row.querySelector('[data-row-trailing="' + activeFlaggedIndex + '"]');
    var rowRect = row.getBoundingClientRect();
    var stageRect = stageBody.getBoundingClientRect();
    var tRect = trailing.getBoundingClientRect();
    cursorEl.style.left = (tRect.left - stageRect.left) + 'px';
    cursorEl.style.top = (rowRect.top - stageRect.top + rowRect.height / 2) + 'px';
  }

  function goToBeat(idx, animate) {
    if (animate) {
      stageBody.style.height = stageBody.getBoundingClientRect().height + 'px';
    }
    renderBeat(idx);
    var newHeight = stageInner.scrollHeight;
    if (animate) {
      requestAnimationFrame(function () { stageBody.style.height = newHeight + 'px'; });
      if (idx === 2) positionCursor();
    } else {
      stageBody.style.height = newHeight + 'px';
    }
    updatePopovers(idx, animate);
  }

  // ── Member popovers — always visible, synced to the beat ────────────
  // Two fixed, permanently-visible widgets flanking the stage. Content
  // rotates through the three widget kinds as a sliding 2-wide window, so
  // both are always relevant to what the roster is doing and every kind
  // gets screen time across a full pass:
  //   beat 0 (online)    -> current + project
  //   beat 1 (insights)  -> project + unusual
  //   beat 2 (unusual)   -> unusual + current
  //   beat 3 (timesheet) -> current + project
  //   beat 4 (payments)  -> project + unusual
  var POPOVER_KINDS = ['current', 'project', 'unusual'];
  function pairForBeat(idx) {
    return { right: POPOVER_KINDS[idx % 3], left: POPOVER_KINDS[(idx + 1) % 3] };
  }

  // `current` keeps only identity + "currently working on" + the live
  // timer (no icon row / activity % line). `project` and `unusual` show
  // the same content as the Kit prototype (unusual is modeled on the real
  // Figma "Unusual activity" reference, node 4905:1785 — stacked ghost
  // blocks behind one detailed front card; initials avatar, never a
  // photo). `flow-root` on the unusual wrapper (styles.css) keeps the
  // front card's margin from collapsing through it.
  function widgetMarkup(kind) {
    if (kind === 'current') {
      return '' +
        '<div class="widget--current widget-card-shadow">' +
          '<div class="widget__head">' +
            '<span class="widget__avatar" style="background:var(--purple-500)">MC</span>' +
            '<div class="widget__id">' +
              '<p class="widget__name">Maya Chen</p>' +
              '<p class="widget__status"><span class="widget__status-dot"></span>Active now</p>' +
            '</div>' +
          '</div>' +
          '<p class="widget__eyebrow">Currently working on</p>' +
          '<p class="widget__task">Homepage redesign</p>' +
          '<div class="widget__timer-row">' +
            '<span class="widget__timer-label"><span class="material-symbols-rounded">timer</span>Today</span>' +
            '<span class="widget__timer tabular-nums" data-widget-timer>04:12:36</span>' +
          '</div>' +
        '</div>';
    }
    if (kind === 'project') {
      return '' +
        '<div class="widget--project widget-card-shadow">' +
          '<div class="widget__head">' +
            '<span class="widget__avatar" style="background:var(--teal-500)">TA</span>' +
            '<div class="widget__id">' +
              '<p class="widget__name">Tom Alvarez</p>' +
              '<p class="widget__subtitle">Project progress, this week</p>' +
            '</div>' +
          '</div>' +
          '<div class="widget__projects">' +
            '<div>' +
              '<div class="widget__project-row-head"><span class="widget__project-name">Client onboarding</span><span class="widget__project-hours">14.2h</span></div>' +
              '<div class="widget__bar-row">' +
                '<div class="widget__bar-track"><div class="widget__bar-fill widget__bar-fill--green" style="width:92%"></div></div>' +
                '<span class="widget__bar-pct widget__bar-pct--green">92%</span>' +
              '</div>' +
            '</div>' +
            '<div>' +
              '<div class="widget__project-row-head"><span class="widget__project-name">Internal tools</span><span class="widget__project-hours">6.4h</span></div>' +
              '<div class="widget__bar-row">' +
                '<div class="widget__bar-track"><div class="widget__bar-fill widget__bar-fill--orange" style="width:48%"></div></div>' +
                '<span class="widget__bar-pct widget__bar-pct--orange">48%</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<p class="widget__footnote">20.6h logged across 2 projects</p>' +
        '</div>';
    }
    return '' + // unusual — Priya Raman
      '<div class="widget--unusual-wrap">' +
        '<div class="widget--unusual-ghost widget--unusual-ghost--1"></div>' +
        '<div class="widget--unusual-ghost widget--unusual-ghost--2"></div>' +
        '<div class="widget--unusual widget-card-shadow">' +
          '<div class="widget__head--unusual">' +
            '<span class="widget__avatar widget__avatar--unusual" style="background:var(--orange-500)">PR' +
              '<span class="widget__avatar-badge"><span class="material-symbols-rounded">priority_high</span></span>' +
            '</span>' +
            '<p class="widget__title--unusual">Unusually consistent activity</p>' +
          '</div>' +
          '<div class="widget__flag-row">' +
            '<span class="widget__flag-pill"><span class="material-symbols-rounded">warning</span>Highly unusual</span>' +
            '<div class="widget__activity-value">' +
              '<p class="widget__activity-label">Activity</p>' +
              '<p class="widget__activity-pct">36%</p>' +
            '</div>' +
          '</div>' +
          '<p class="widget__timestamp">Wed, this week &middot; 11:40 am&ndash;3:15 pm</p>' +
          '<p class="widget__breakdown-label">Activity breakdown</p>' +
          '<div class="widget__breakdown-bar">' +
            '<div style="width:64%;background:var(--green-500)"></div>' +
            '<div style="width:36%;background:var(--teal-400)"></div>' +
          '</div>' +
          '<div class="widget__breakdown-legend">' +
            '<span class="widget__legend-dot"><span class="dot" style="background:var(--green-500)"></span>64% keyboard</span>' +
            '<span class="widget__legend-dot"><span class="dot" style="background:var(--teal-400)"></span>36% mouse</span>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  var popovers = {
    right: { root: document.getElementById('iw-popover-right'), inner: document.getElementById('iw-popover-right-inner'), kind: null, side: 'right' },
    left: { root: document.getElementById('iw-popover-left'), inner: document.getElementById('iw-popover-left-inner'), kind: null, side: 'left' },
  };

  // Swaps a popover's content. On first paint (`animate: false`) it just
  // sets the HTML so the very first measurement (in `initPopovers`) is
  // already correct — no oversized/empty frame. On every later swap it
  // measures the OLD size, locks the wrapper to it, swaps the HTML, then
  // measures the NEW natural size and animates the wrapper to that, so
  // the popover keeps hugging its content instead of jump-cutting.
  function setPopoverContent(slot, kind, animate) {
    if (slot.kind === kind) return;
    slot.kind = kind;
    var html = widgetMarkup(kind);
    if (!animate) {
      slot.inner.innerHTML = html;
      return;
    }
    var startRect = slot.inner.getBoundingClientRect();
    slot.inner.style.width = startRect.width + 'px';
    slot.inner.style.height = startRect.height + 'px';
    slot.inner.innerHTML = html;
    var newW = slot.inner.scrollWidth;
    var newH = slot.inner.scrollHeight;
    requestAnimationFrame(function () {
      slot.inner.style.width = newW + 'px';
      slot.inner.style.height = newH + 'px';
    });
  }

  // Each popover is docked to its own fixed slot right beside the stage
  // card, both vertically centered against it, and hides itself
  // independently if its side doesn't have room — so a mid-width viewport
  // still shows whichever side fits instead of neither. The right slot
  // anchors via `left` (grows away from the card); the left slot anchors
  // via `right` (grows away from the card in the other direction) —
  // either way the card-facing edge never drifts while width/height are
  // mid-transition.
  function positionPopovers() {
    var stageRect = document.getElementById('iw-stage-wrap').getBoundingClientRect();
    var ctaRect = document.getElementById('iw-cta').getBoundingClientRect();
    var margin = 16, gap = 14;

    function place(slot) {
      var rect = slot.inner.getBoundingClientRect();
      var w = rect.width, h = rect.height, top;
      var fits = slot.side === 'right'
        ? window.innerWidth - stageRect.right - gap >= w + margin
        : stageRect.left - gap - margin >= w;
      if (!fits) { slot.root.style.opacity = '0'; return; }
      top = stageRect.top + stageRect.height / 2 - h / 2; // centered against the card, both sides
      top = Math.max(margin, Math.min(top, window.innerHeight - h - margin));
      top = Math.min(top, ctaRect.top - h - 14); // never overlap the CTA
      if (slot.side === 'right') {
        slot.root.style.left = (stageRect.right + gap) + 'px';
      } else {
        slot.root.style.right = (window.innerWidth - stageRect.left + gap) + 'px';
      }
      slot.root.style.top = top + 'px';
      slot.root.style.opacity = '1';
    }
    place(popovers.right);
    place(popovers.left);
  }

  function updatePopovers(idx, animate) {
    var pair = pairForBeat(idx);
    setPopoverContent(popovers.right, pair.right, animate);
    setPopoverContent(popovers.left, pair.left, animate);
    requestAnimationFrame(positionPopovers);
  }

  // The popover's fix for a "renders oversized, then snaps" loading bug:
  // wait for Roboto to actually be painted (`document.fonts.ready`) plus
  // two animation frames for layout to settle, THEN measure natural size
  // and reveal — so the very first frame the viewer sees is already the
  // right size.
  function whenFontsReady(cb) {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        requestAnimationFrame(function () { requestAnimationFrame(cb); });
      });
    } else {
      setTimeout(cb, 50);
    }
  }

  function initPopovers(beatIdx) {
    var pair = pairForBeat(beatIdx);
    setPopoverContent(popovers.right, pair.right, false);
    setPopoverContent(popovers.left, pair.left, false);
    whenFontsReady(positionPopovers);
  }

  window.addEventListener('resize', positionPopovers);

  if (reduced) {
    // Static end state only: beat 5, full roster, no cursor.
    goToBeat(4, false);
    return;
  }

  var i = 0;
  goToBeat(0, false);
  initPopovers(0);

  setInterval(function () {
    cursorEl.style.opacity = '0';
    setTimeout(function () {
      i = (i + 1) % NUM_BEATS;
      goToBeat(i, true);
      if (i === 2) setTimeout(function () { cursorEl.style.opacity = '1'; }, 60);
    }, 260);
  }, 2400);

  // Maya's timer (row 0, and the "current" popover when it's showing)
  // genuinely ticks while beat 1 (online) is visible.
  var secs = 0;
  setInterval(function () {
    if (i !== 0) { secs = 0; return; }
    secs += 1;
    var m = Math.floor(secs / 60), s = secs % 60;
    var text = '00:' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    var rowTimerEl = document.querySelector('[data-row-timer="0"]');
    if (rowTimerEl) rowTimerEl.textContent = text;
    var widgetTimerEl = document.querySelector('[data-widget-timer]');
    if (widgetTimerEl) widgetTimerEl.textContent = text;
  }, 1000);
})();
