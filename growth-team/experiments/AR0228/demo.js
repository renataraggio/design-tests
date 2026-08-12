/* AR0228 — demo mode
 *
 * Self-running walkthrough of both branches, for showing the flow without
 * anyone having to drive it. Replaces the old jump-to-step control panel:
 * the flow is now short enough that stepping through it manually is trivial,
 * and the panel permanently covered the third organization row.
 *
 * Drives the prototype the way a person would — by clicking real controls —
 * so it exercises the same code paths as manual use rather than a parallel
 * scripted path that could drift from it.
 *
 * Not part of the design. Reviewers can also press 1–4 to jump to a step.
 */

(function () {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };

  var SCRIPT = [
    ['Admin opens the Actions menu on Acme Corp Ltd',        900,  '[data-actions-toggle="acme"]'],
    ['…and chooses Archive organization',                    1400, '[data-archive-org="acme"]'],
    ['The Essentials offer is shown first, before any archive confirmation', 3200, null],
    ['They take the offer',                                  1200, '[data-action="switch-to-essentials"]'],
    ['Switch confirmed — nothing changes until the plan ends', 3000, '[data-action="done-close"]'],
    ['Now the other branch — same start',                    1200, '.demo__reset'],
    ['Actions → Archive organization',                       900,  '[data-actions-toggle="acme"]'],
    ['',                                                     900,  '[data-archive-org="acme"]'],
    ['This time they decline the offer',                     2200, '[data-action="offer-archive"]'],
    ['Only now do the archive consequences appear',          3400, null],
    ['They confirm the archive',                             1400, '[data-action="archive-confirm"]'],
    ['Organization archived',                                3000, null]
  ];

  var timer = null;
  var index = 0;
  var running = false;
  /* The demo drives the UI with real .click() calls, which are indistinguishable
     from the viewer's own clicks in the capture handler below. This flag marks
     the demo's clicks so it doesn't treat itself as a takeover and stop. */
  var synthetic = false;

  function clickTarget(sel) {
    var el = $(sel);
    if (!el) { return; }
    synthetic = true;
    el.click();          /* dispatched synchronously, so the flag is safe */
    synthetic = false;
  }

  function caption(text) {
    var el = $('#demo-caption');
    el.textContent = text;
    el.hidden = !text;
  }

  function stop(reason) {
    running = false;
    clearTimeout(timer);
    timer = null;
    index = 0;
    $('#demo-play').textContent = 'Play demo';
    document.body.classList.remove('is-demo');
    caption(reason || '');
    if (reason) { setTimeout(function () { if (!running) { caption(''); } }, 2000); }
  }

  function step() {
    if (!running) { return; }

    if (index >= SCRIPT.length) { stop('Demo finished'); return; }

    var entry = SCRIPT[index++];
    var text = entry[0], wait = entry[1], target = entry[2];

    if (text) { caption(text); }

    timer = setTimeout(function () {
      if (!running) { return; }
      if (target) { clickTarget(target); }
      step();
    }, wait);
  }

  function start() {
    clickTarget('.demo__reset');
    running = true;
    index = 0;
    $('#demo-play').textContent = 'Stop';
    document.body.classList.add('is-demo');
    step();
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('#demo-play')) {
      if (running) { stop(); } else { start(); }
      return;
    }
    /* Any other real click is the viewer taking over — yield immediately
       rather than fighting them for control of the prototype. */
    if (running && !synthetic) { stop(); }
  }, true);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && running) { stop(); return; }
    if (running) { return; }

    /* Undocumented-on-screen step jumps, for reviewers who want one state. */
    var jump = { '1': 'offer', '2': 'archive', '3': 'done' }[e.key];
    if (jump) {
      $('.demo__reset').click();
      $('[data-archive-org="acme"]').click();
      if (jump === 'archive') { $('[data-action="offer-archive"]').click(); }
      if (jump === 'done')    { $('[data-action="switch-to-essentials"]').click(); }
    }
    if (e.key === '4') {
      $('.demo__reset').click();
      $('[data-archive-org="acme"]').click();
      $('[data-action="offer-archive"]').click();
      $('[data-action="archive-confirm"]').click();
    }
  });
}());
