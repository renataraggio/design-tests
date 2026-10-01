/* AR0239 — standalone vanilla-JS port of the Kit prototype (product/squads/
   growth/experiments/AR0239/prototype/, quickstart.js + index.html). Same
   steps, same gating, same copy — no Alpine/Vite, plain state + innerHTML
   rebuilds, same pattern as the AR0239-v.1 sneak-peek standalone port.
   Requires data.js (WIZARD/TEAM/STEPS/DASHBOARD/ASIDE/V4_PROJECT_PANE)
   loaded first.

   Four directions (Renata, 2026-10-01 — this file was V3-only before):
     a3 · V1 "Trimmed"         a  · V2 "All steps" (+ Integrations/1:1 banners)
     v3 · V3 "New layout"      v4 · V4 "Project redesign"
   One global `state`, not four separate instances (the Kit source's own
   Alpine component is instanced per direction) — switching direction
   rebuilds `allSteps` from scratch and resets to the first step, which
   reads fine for a review prototype even though it means progress doesn't
   carry across a switch the way the Kit source's does. */

// Which step ids each direction shows — the plain-array equivalent of the
// Kit source's per-step onlyIn/omitIn. V3/V4 share the same list (V4 only
// changes what's INSIDE select-projects' pane, not which steps exist).
const V3_V4_IDS = ['create-org', 'create-teams', 'select-projects', 'member-limits', 'member-payment-details', 'connect-payroll', 'smart-notifications', 'download-app', 'invite-members'];
const DIRECTION_STEPS = {
  a3: ['create-org', 'create-teams', 'select-projects', 'member-limits', 'smart-notifications', 'download-app', 'invite-members'],
  a: ['create-org', 'create-teams', 'select-projects', 'subscribe-reports', 'member-limits', 'connect-payroll', 'smart-notifications', 'invite-members'],
  v3: V3_V4_IDS,
  v4: V3_V4_IDS,
};
// member-payment-details is onlyIn: ['v3','v4'] in the Kit source — never
// reachable from V1/V2's own id lists above, so no separate check needed
// for it the way connect-payroll needs one below.

function freshStep(s, direction) {
  // V4 swaps Select your project's picker for the real "Customize your
  // first project" form — everywhere else keeps its own `pane` untouched,
  // same as quickstart.js's `allSteps` override (direction === 'v4' only).
  const isV4Project = direction === 'v4' && s.id === 'select-projects';
  const pane = isV4Project ? window.V4_PROJECT_PANE : s.pane;
  return {
    ...s,
    pane,
    // Rail label follows the pane swap (Renata, 2026-10-01) — V4 only.
    label: isV4Project ? 'Customize your first project' : s.label,
    skipped: false,
    chips: (pane.options || []).filter((o) => o.checked).map((o) => o.label),
    added: [],
    chosen: [],
    values: s.id === 'member-limits' ? { weekly: '40', daily: '8' }
      : (pane.fields ? pane.fields.reduce((acc, f) => ({ ...acc, [f.id]: f.value || '' }), {}) : {}),
    individualLimits: TEAM.reduce((acc, m) => ({ ...acc, [m.name]: { weekly: '40', daily: '8' } }), {}),
    provider: null,
    platform: (pane.platforms || [])[0] ? pane.platforms[0].id : null,
    custom: '',
    invites: [],
    inviteEmail: '',
    inviteRole: 'user',
    error: '',
  };
}

function buildAllSteps(direction) {
  const ids = DIRECTION_STEPS[direction];
  return STEPS.filter((s) => ids.includes(s.id)).map((s) => freshStep(s, direction));
}

// Wired to the version switcher's onChange. Rebuilds the step list fresh for
// the new direction and lands on its first step — see the file-level note on
// why this resets progress across a switch instead of keeping four separate
// instances the way the Kit source's Alpine components do.
function setDirection(id) {
  state.direction = id;
  state.allSteps = buildAllSteps(id);
  state.activeId = 'create-teams'; // Renata, 2026-10-01: land users on Create teams
  state.justDone = null;
  state.successSeen = false;
  render();
}

const state = {
  stage: 'welcome', // 'welcome' | 'app' | 'dashboard'
  direction: 'v3', // a3 (V1) | a (V2) | v3 (V3) | v4 (V4) — matches this port's pre-existing default
  activeId: 'create-teams',
  plan: 'enterprise',
  payroll: false,
  allSteps: buildAllSteps('v3'),
  justDone: null,
  justDoneTimer: null,
  successSeen: false,
  entryDismissed: false,
  orgAgeDays: 3,
  dash: 'empty',
  trackedSec: 0,
  trackTimer: null,
  sampleData: false,
  // create-org done-scene preview (ported from the AR0239-v.1 sneak-peek)
  coPreviewId: TEAM[0].name,
  coPreviewPhase: 'idle',
  coPreviewOpenDay: null,
  coPreviewTimer: null,
  // Edit Payment Details modal
  paymentModalFor: null,
  paymentData: TEAM.reduce((acc, m) => ({ ...acc, [m.name]: { payRate: '', payPeriod: 'None', approval: false, saved: false } }), {}),
};

function hasInsights() { return state.plan === 'team' || state.plan === 'enterprise'; }
function hasPayroll() { return state.payroll; }
// connect-payroll is payrollOnly but only GATED on the Goal toggle inside
// V3/V4 — V2 (and V1, though it never carries the step at all) show it
// unconditionally, same as the Kit source's `steps` getter.
function visibleSteps() {
  return state.allSteps.filter((s) => (!s.insightsOnly || hasInsights())
    && (!s.payrollOnly || !['v3', 'v4'].includes(state.direction) || hasPayroll()));
}
// Non-trimmed (V2 only) welcome card quotes this in its "N quick steps to
// go — about N minutes" line.
function minsLeft() {
  return visibleSteps().filter((s) => !s.done && !s.skipped).reduce((sum, s) => sum + (s.minutes || 0), 0);
}
// trimmed = no-CTA, auto-entering welcome card. Every direction now (V2 too,
// Renata 2026-10-01: "all versions should have the loading state") — kept as
// a function so the non-trimmed branch in renderWelcome() stays reachable.
function trimmed() { return true; }
function activeStep() { return visibleSteps().find((s) => s.id === state.activeId) || visibleSteps()[0]; }
function completedCount() { return visibleSteps().filter((s) => s.done).length; }
function resolvedCount() { return visibleSteps().filter((s) => s.done || s.skipped).length; }
function totalCount() { return visibleSteps().length; }
function percent() { return Math.round((completedCount() / totalCount()) * 100); }
function allDone() { return resolvedCount() === totalCount(); }
function nextStep() {
  const steps = visibleSteps();
  const i = steps.findIndex((s) => s.id === state.activeId);
  const after = steps.slice(i + 1).find((s) => !s.done && !s.skipped);
  if (after) return after;
  return steps.find((s) => !s.done && !s.skipped && s.id !== state.activeId) || null;
}
function wizardGoals() { return [...WIZARD.goals, ...(state.payroll ? ['Pay our staff'] : [])]; }
function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function band(pct) { if (pct === null) return 'empty'; if (pct < 30) return 'red'; if (pct < 60) return 'yellow'; return 'green'; }

function select(id) {
  state.justDone = null;
  state.activeId = id;
  render();
}
function complete(id) {
  const s = state.allSteps.find((x) => x.id === id);
  if (!s) return;
  s.done = true; s.skipped = false; s.error = '';
  state.justDone = id;
  clearTimeout(state.justDoneTimer);
  state.justDoneTimer = setTimeout(() => { state.justDone = null; render(); }, 1600);
  const n = nextStep();
  if (n) state.activeId = n.id;
  render();
}
function skip(id) {
  const s = state.allSteps.find((x) => x.id === id);
  if (!s || !s.skippable) return;
  s.skipped = true; s.done = false;
  const n = visibleSteps().find((x) => !x.done && !x.skipped);
  if (n) state.activeId = n.id;
  render();
}

/* ── create-org done-scene preview (ported from AR0239-v.1) ─────────── */
function coActive() { return TEAM.find((m) => m.name === state.coPreviewId) || TEAM[0]; }
function coFirstDataDay() { return coActive().weekly.find((d) => d.pct !== null) || null; }
const CO_STEP_MS = { toMembersHint: 500, toHoverHint: 1700, toClickHint: 2200, toReveal: 1600, toClose: 2600, toNext: 700 };
const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function runCoStep(step) {
  clearTimeout(state.coPreviewTimer);
  if (reducedMotion && (step === 'toMembersHint' || step === 'toHoverHint' || step === 'toClickHint')) step = 'toReveal';
  state.coPreviewTimer = setTimeout(() => {
    switch (step) {
      case 'toMembersHint': state.coPreviewPhase = 'membersHint'; renderPane(); runCoStep('toHoverHint'); break;
      case 'toHoverHint': state.coPreviewPhase = 'hoverHint'; renderPane(); runCoStep('toClickHint'); break;
      case 'toClickHint': state.coPreviewPhase = 'clickHint'; renderPane(); runCoStep('toReveal'); break;
      case 'toReveal': state.coPreviewPhase = 'idle'; state.coPreviewOpenDay = coFirstDataDay(); renderPane(); runCoStep('toClose'); break;
      case 'toClose': state.coPreviewOpenDay = null; renderPane(); runCoStep('toNext'); break;
      case 'toNext': {
        const i = TEAM.findIndex((m) => m.name === state.coPreviewId);
        state.coPreviewId = TEAM[(i + 1) % TEAM.length].name;
        renderPane();
        runCoStep('toMembersHint');
        break;
      }
    }
  }, CO_STEP_MS[step]);
}

function renderCoPreview() {
  const m = coActive();
  const fdd = coFirstDataDay();
  const metrics = [
    { icon: 'timer', label: 'Total work time', value: m.totalWorkTime },
    { icon: 'show_chart', label: 'Avg. activity', value: `${m.avgActivity}%` },
    { icon: 'dark_mode', label: 'Idle time', value: m.idleTime },
    { icon: 'history', label: 'Manual time', value: m.manualTime },
  ];
  return `
    <div class="member-row">
      <div class="callout above ${state.coPreviewPhase === 'membersHint' ? 'is-visible' : ''}">View other members</div>
      ${TEAM.map((row) => `
        <button type="button" class="member-pill ${row.name === state.coPreviewId ? 'is-active' : ''}" data-co-select="${esc(row.name)}">
          <span class="avatar" style="width:2.4rem;height:2.4rem;font-size:1.1rem;background:${row.color}">${esc(row.initials)}</span>
          <span>${esc(row.name)}</span>
        </button>
      `).join('')}
    </div>
    <div class="card" style="border:1px solid var(--gray-200);border-radius:var(--radius-lg);padding:2rem;">
      <div class="co-profile-row">
        <div class="co-profile-id">
          <span class="avatar" style="width:4.8rem;height:4.8rem;font-size:1.6rem;background:${m.color}">${esc(m.initials)}</span>
          <div>
            <p class="name">${esc(m.name)}</p>
            <span class="working-on">Working on <b>${esc(m.workingOn)}</b></span>
          </div>
        </div>
        <button type="button" class="btn btn-outline" style="font-size:1.2rem;padding:.4rem .8rem;"><span class="material-symbols-rounded">image</span>View latest screenshot</button>
      </div>
      <div class="metric-grid">
        ${metrics.map((mt) => `
          <div class="metric-card">
            <span class="metric-icon"><span class="material-symbols-rounded">${mt.icon}</span></span>
            <div><p class="metric-label">${esc(mt.label)}</p><p class="metric-value">${esc(mt.value)}</p></div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="strip-card">
      <p class="strip-title">Time &amp; activity</p>
      <div class="day-grid">
        ${m.weekly.map((day) => {
          const isDemo = fdd && day.day === fdd.day;
          const b = band(day.pct);
          const empty = day.pct === null;
          return `
            <div class="day-cell">
              <div class="callout above ${state.coPreviewPhase === 'hoverHint' && isDemo ? 'is-visible' : ''}">Hover to see what happened here</div>
              <div class="callout below ${state.coPreviewPhase === 'clickHint' && isDemo ? 'is-visible' : ''}">Click for screenshots</div>
              <button type="button" class="day-btn" data-co-day="${esc(day.day)}">
                <span class="day-name">${esc(day.day)}</span>
                <span class="bar-track"><span class="bar-fill ${b}" style="width:${day.pct ?? 0}%"></span></span>
                <span class="pct-pill ${b}">${empty ? '&#8211;' : day.pct + '%'}</span>
                <span class="shot-tile ${empty ? 'empty' : ''}"><span class="material-symbols-rounded">image</span></span>
                <span class="shot-count">${empty ? '&#8211;' : day.screenshots + ' screenshots'}</span>
              </button>
            </div>
          `;
        }).join('')}
      </div>
      <div class="reveal ${state.coPreviewOpenDay ? 'is-open' : ''}">
        ${state.coPreviewOpenDay ? `<p><b>${esc(state.coPreviewOpenDay.day)}, ${esc(state.coPreviewOpenDay.date)}</b> &mdash; ${esc(state.coPreviewOpenDay.hours)} tracked, ${state.coPreviewOpenDay.screenshots} screenshots</p>` : '<p></p>'}
        <button type="button" class="btn-ghost" data-co-close aria-label="Close"><span class="material-symbols-rounded">close</span></button>
      </div>
    </div>
  `;
}

/* ── pane renderers, one per kind ────────────────────────────────────── */
function renderHeader(s, ctaHtml) {
  return `
    <div class="pane-header">
      <div class="titles"><h2>${esc(s.pane.heading)}</h2><p>${esc(s.pane.body)}</p></div>
      <div class="ctas">
        ${s.skippable ? `<button type="button" class="btn btn-ghost" data-skip="${esc(s.id)}">${esc(s.pane.secondary || 'Skip for now')}</button>` : ''}
        ${ctaHtml}
      </div>
    </div>
  `;
}

function renderChipsPlusInput(s) {
  const items = [...(s.pane.suggestions || []), ...s.added.filter((a) => !(s.pane.suggestions || []).includes(a))];
  return renderHeader(s, `<button type="button" class="btn btn-primary" ${s.chips.length === 0 ? 'disabled' : ''} data-complete="${esc(s.id)}">${esc(s.pane.cta)}</button>`) + `
    <div class="chip-field">
      <label>${esc(s.pane.inputLabel)}</label>
      <div class="chip-input-row">
        <input type="text" id="chip-input" placeholder="${esc(s.pane.inputPlaceholder)}" value="${esc(s.custom)}" />
        <button type="button" class="btn btn-secondary" data-add-chip="${esc(s.id)}">Add</button>
      </div>
      <div class="chip-grid">
        ${items.map((name) => `<button type="button" class="chip ${s.chips.includes(name) ? 'on' : ''}" data-toggle-chip="${esc(s.id)}" data-chip-name="${esc(name)}">${esc(name)}</button>`).join('')}
      </div>
    </div>
  `;
}

function renderSelectableList(s) {
  return renderHeader(s, `<button type="button" class="btn btn-primary" ${s.chips.length === 0 ? 'disabled' : ''} data-complete="${esc(s.id)}">${esc(s.pane.cta)}</button>`) + `
    <div class="chip-field">
      <div class="chip-grid">
        ${s.pane.options.map((o) => `<button type="button" class="chip ${s.chips.includes(o.label) ? 'on' : ''}" data-toggle-chip="${esc(s.id)}" data-chip-name="${esc(o.label)}">${esc(o.label)}</button>`).join('')}
        ${s.added.map((name) => `<button type="button" class="chip on" data-toggle-chip="${esc(s.id)}" data-chip-name="${esc(name)}">${esc(name)}</button>`).join('')}
      </div>
      <label style="margin-top:1.6rem;">${esc(s.pane.inputLabel)}</label>
      <div class="chip-input-row">
        <input type="text" id="chip-input" placeholder="${esc(s.pane.inputPlaceholder)}" value="${esc(s.custom)}" />
        <button type="button" class="btn btn-secondary" data-add-chip="${esc(s.id)}">Add</button>
      </div>
    </div>
  `;
}

function renderForm(s) {
  return renderHeader(s, `<button type="button" class="btn btn-primary" style="background:var(--primary-900)" data-complete="${esc(s.id)}">${esc(s.pane.cta)}</button>`) + `
    <div class="limits-section">
      <h4>Global limits</h4>
      <div class="limits-row">
        <div class="who"><span class="avatar" style="background:var(--primary-500)"><span class="material-symbols-rounded" style="font-size:1.6rem">groups</span></span>All members</div>
        <div class="limits-fields">
          <div><input type="text" id="global-weekly" value="${esc(s.values.weekly)}" /><span class="suffix">hours / week</span></div>
          <div><input type="text" id="global-daily" value="${esc(s.values.daily)}" /><span class="suffix">hours / day</span></div>
        </div>
      </div>
      <div class="limits-alert">Members can also request more time above their limit. If a user has no set limit, they will use the global limit.</div>
      <h4>Individual limits</h4>
      ${TEAM.map((m) => `
        <div class="limits-row">
          <div class="who"><span class="avatar" style="background:${m.color}">${esc(m.initials)}</span>${esc(m.name)}</div>
          <div class="limits-fields">
            <div><input type="text" data-ind-weekly="${esc(m.name)}" value="${esc(s.individualLimits[m.name].weekly)}" placeholder="${esc(s.values.weekly)}" /><span class="suffix">hours / week</span></div>
            <div><input type="text" data-ind-daily="${esc(m.name)}" value="${esc(s.individualLimits[m.name].daily)}" placeholder="${esc(s.values.daily)}" /><span class="suffix">hours / day</span></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// V4 only — "Customize your first project" (reference screenshot, Renata
// 2026-10-01). Reuses this file's existing `.field`/`.toggle-row` CSS
// (already built for the payment modal's pay-rate/pay-period/approval
// fields) for Project name/Client, same convention as the rest of this
// file — a plain native <select>, not a custom Zone-style listbox, which
// is simpler than the Kit source's dropdown but consistent with how every
// other field in this standalone already works. The two toggles get their
// own bordered card (not in `.field`'s vocabulary) since the reference
// boxes them with an icon, a Recommended/Free pill and a description.
function renderProjectSetup(s) {
  const clientField = s.pane.fields.find((f) => f.id === 'client');
  const disabled = (f) => f.disabledUntil && !s.values[f.disabledUntil];
  // Layout from Growth Central node 21077:50973: Project name + Client on one
  // row, Weekly Budget + Client viewer on the next; one column below 480px of
  // the PANE (container query), not the viewport.
  return renderHeader(s, `<button type="button" class="btn btn-primary" ${s.values.projectName ? '' : 'disabled'} data-complete="${esc(s.id)}">${esc(s.pane.cta)}</button>`) + `
    <div class="pane-container">
    <div class="project-grid">
      <div class="field">
        <label>Project name <span style="color:var(--gray-600)">*</span></label>
        <input type="text" id="project-name" value="${esc(s.values.projectName || '')}" placeholder="e.g. Acme — website refresh" />
      </div>
      <div class="field">
        <label>Client</label>
        <select id="project-client">
          <option value="" ${!s.values.client ? 'selected' : ''}>No client</option>
          ${clientField.options.map((o) => `<option value="${esc(o.value)}" ${s.values.client === o.value ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
        </select>
        <p class="hint">${esc(clientField.helper)}</p>
      </div>
      ${s.pane.fields.filter((f) => f.type === 'toggle').map((f) => `
        <div class="toggle-card ${disabled(f) ? 'disabled' : ''}">
          <div class="head">
            <div class="left">
              <span class="material-symbols-rounded" style="font-size:1.8rem;color:var(--gray-500)">${f.icon}</span>
              <span class="name">${esc(f.label)}</span>
              <span class="badge">${esc(f.badge)}</span>
            </div>
            <button type="button" role="switch" class="toggle-track toggle-track--sm ${s.values[f.id] ? 'on' : ''}" data-toggle-project-field="${esc(f.id)}" ${disabled(f) ? 'disabled' : ''} aria-checked="${!!s.values[f.id]}" aria-label="${esc(f.label)}"></button>
          </div>
          <p>${esc(f.description)}</p>
        </div>
      `).join('')}
    </div>
    </div>
  `;
}

function renderPaymentTable(s) {
  return renderHeader(s, `<button type="button" class="btn btn-primary" data-complete="${esc(s.id)}">${esc(s.pane.cta)}</button>`) + `
    <table class="pay-table">
      <thead><tr><th>Email</th><th>Payment details</th><th>Timesheet approvals</th><th></th></tr></thead>
      <tbody>
        ${TEAM.map((m) => {
          const pd = state.paymentData[m.name];
          const period = pd.payPeriod && pd.payPeriod !== 'None' ? pd.payPeriod : 'Weekly';
          return `
            <tr>
              <td><div class="who-cell"><span class="avatar" style="background:${m.color}">${esc(m.initials)}</span><div><div>${esc(m.name)}</div><div class="email">${esc(m.email)}</div></div></div></td>
              <td>${pd.saved ? `${esc(pd.payRate || '0.00')} USD/hr / ${esc(period)}` : 'Details not set'}</td>
              <td><button type="button" role="switch" class="toggle-track toggle-track--sm ${pd.approval ? 'on' : ''}" data-row-approval="${esc(m.name)}" aria-checked="${pd.approval}" aria-label="Timesheet approvals for ${esc(m.name)}"></button></td>
              <td style="text-align:right;"><button type="button" class="btn btn-secondary" style="font-size:1.2rem;padding:.5rem 1rem;" data-open-payment="${esc(m.name)}">See details</button></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function renderTemplates(s) {
  return renderHeader(s, `<button type="button" class="btn btn-primary" ${s.chosen.length === 0 ? 'disabled' : ''} data-complete="${esc(s.id)}">${esc(s.pane.cta)}</button>`) + `
    <div class="template-grid">
      ${s.pane.templates.map((t) => `
        <div class="template-card ${s.chosen.includes(t.id) ? 'chosen' : ''}">
          <div class="head"><span class="title">${esc(t.title)}</span><button type="button" class="cta-outline ${s.chosen.includes(t.id) ? 'done' : ''}" data-toggle-template="${esc(s.id)}" data-template-id="${esc(t.id)}">${s.chosen.includes(t.id) ? esc(s.pane.templateDoneCta || 'Done') : esc(s.pane.templateCta)}</button></div>
          <div class="meta">${t.meta.map((mm) => `<span>${esc(mm)}</span>`).join('')}</div>
          <p class="desc">${esc(t.desc)}</p>
        </div>
      `).join('')}
    </div>
  `;
}

function renderProviderList(s) {
  // Vertical cards, one per provider. A card's own Connect button IS the
  // action (opens the connect flow + completes the step); the old header CTA
  // is gone. "I pay outside Hubstaff" (header secondary) marks the step
  // declined — see `.step-row.declined`.
  return renderHeader(s, '') + `
    <div class="provider-list">
    ${s.pane.providers.map((p) => `
      <div class="provider-card">
        <img class="logo" src="./assets/logo-${esc(p.logo)}.svg" alt="" />
        <div class="txt"><p class="name">${esc(p.label)}</p><p class="hint">${esc(p.hint)}</p></div>
        <button type="button" class="cta-outline ${s.provider === p.id ? 'done' : ''}" data-connect-provider="${esc(p.id)}">${s.provider === p.id ? 'Connected' : 'Connect'}</button>
      </div>
    `).join('')}
    </div>
  `;
}

/* Looping timer scene (state lives outside render(), which rebuilds the DOM):
   idle → run 10s → reset → repeat, painted into the live nodes each tick.
   The pill mirrors the shell's own .hs-timer when idle; the running look
   (blue fill + pause) is this scene's extension — the shell has no running
   state to copy. */
const dl = { sec: 0, running: false, timer: null, started: false };
function dlHMS() {
  const p = (n) => String(n).padStart(2, '0');
  return `${p(Math.floor(dl.sec / 3600))}:${p(Math.floor((dl.sec % 3600) / 60))}:${p(dl.sec % 60)}`;
}
function dlShort() { return `${Math.floor(dl.sec / 60)}:${String(dl.sec % 60).padStart(2, '0')}`; }
function dlPaint() {
  const pill = document.querySelector('[data-dl-pill]');
  if (!pill) return false;
  pill.classList.toggle('running', dl.running);
  pill.querySelector('[data-dl-time]').textContent = dlHMS();
  pill.querySelector('[data-dl-icon]').textContent = dl.running ? 'pause' : 'timer';
  const row = document.querySelector('[data-dl-row]');
  row.querySelector('[data-dl-row-icon]').textContent = dl.running ? 'pause' : 'play_arrow';
  row.querySelector('[data-dl-row-time]').textContent = dlShort();
  return true;
}
function dlStep() {
  clearTimeout(dl.timer);
  if (!document.querySelector('[data-dl-pill]')) { dl.started = false; return; }
  if (!dl.running) { dl.running = true; dl.sec = 0; dl.timer = setTimeout(dlStep, 1000); }
  else if (dl.sec >= 10) { dl.running = false; dl.sec = 0; dl.timer = setTimeout(dlStep, 1200); }
  else { dl.sec += 1; dl.timer = setTimeout(dlStep, 1000); }
  dlPaint();
}
function syncDownloadPreview() {
  if (!dlPaint()) { clearTimeout(dl.timer); dl.started = false; return; }
  if (!dl.started) { dl.started = true; dl.running = false; dl.sec = 0; dlPaint(); dl.timer = setTimeout(dlStep, 900); }
}

function renderDownload(s) {
  // Matched to AR0238's empty state: one CTA, no platform picker (the real
  // download link detects the OS itself), timer scene in place of the
  // blurred dashboard behind AR0238's card.
  return renderHeader(s, `<button type="button" class="btn btn-primary" data-download="${esc(s.id)}">${esc(s.pane.cta)}</button>`) + `
    <div class="dl-scene" aria-hidden="true">
      <div class="dl-pill" data-dl-pill>
        <span class="material-symbols-rounded dl-pill-icon" data-dl-icon>timer</span>
        <span class="dl-pill-time" data-dl-time>00:00:00</span>
        <span class="material-symbols-rounded dl-pill-arrow">arrow_outward</span>
      </div>
      <div class="dl-row" data-dl-row>
        <span class="material-symbols-rounded dl-row-folder">folder</span>
        <span class="dl-row-name">Onboarding</span>
        <span class="dl-row-play"><span class="material-symbols-rounded" data-dl-row-icon>play_arrow</span></span>
        <span class="dl-row-time" data-dl-row-time>0:00</span>
      </div>
    </div>
  `;
}

function renderInvite(s) {
  return renderHeader(s, `<button type="button" class="btn btn-primary" ${s.invites.length === 0 ? 'disabled' : ''} data-complete="${esc(s.id)}">${esc(s.pane.cta)}</button>`) + `
    <div class="invite-row">
      <input type="email" id="invite-email" placeholder="name@company.com" value="${esc(s.inviteEmail)}" />
      <select id="invite-role">${s.pane.roleOptions.map((r) => `<option value="${esc(r.value)}" ${r.value === s.inviteRole ? 'selected' : ''}>${esc(r.label)}</option>`).join('')}</select>
      <button type="button" class="btn btn-secondary" data-add-invite="${esc(s.id)}">Add</button>
    </div>
    ${s.error ? `<p style="color:var(--red-700);font-size:1.3rem;margin:-1rem 0 1.6rem;">${esc(s.error)}</p>` : ''}
    <div class="invite-link">
      <input type="text" readonly value="${esc(s.pane.link)}" />
      <button type="button" class="btn btn-secondary" data-copy-link="${esc(s.id)}">Copy</button>
    </div>
    <ul class="invite-list">
      ${s.invites.map((i) => `<li><span>${esc(i.email)} &middot; ${esc(i.role)}</span><button type="button" class="btn-ghost" data-remove-invite="${esc(s.id)}" data-invite-email="${esc(i.email)}"><span class="material-symbols-rounded">close</span></button></li>`).join('')}
    </ul>
  `;
}

// A1/A3's original illustration (V1 here), unchanged since it first shipped
// — the product coming to life: a window whose chart draws itself, bars that
// grow, two satellite cards that keep drifting. Every colour is a literal
// hex straight off the Kit source's own Zone-token values (ported, not
// re-picked), so it can't drift from the palette there. V2 shares it too —
// V2 was never given the dashboard-preview animation below; that's V3/V4
// only, per Renata's 2026-10-01 call to keep the two experiences distinct.
function renderDoneIllustration() {
  return `
    <div class="done-illustration" aria-hidden="true">
      <svg viewBox="0 0 264 180">
        <ellipse class="qs-node" style="--d:.1s" cx="130" cy="164" rx="76" ry="7" fill="#f3f4f6"/>
        <ellipse class="qs-node" style="--d:.2s" cx="232" cy="162" rx="20" ry="5" fill="#f3f4f6"/>
        <g class="qs-node" style="--d:.18s">
          <rect x="40" y="24" width="184" height="128" rx="9" fill="#1f2e54"/>
          <rect x="40" y="40" width="184" height="112" rx="9" fill="#fff"/>
          <rect x="40" y="40" width="184" height="10" fill="#fff"/>
        </g>
        <circle class="qs-node" style="--d:.34s" cx="51" cy="32" r="2.6" fill="#f05252"/>
        <circle class="qs-node" style="--d:.39s" cx="59" cy="32" r="2.6" fill="#ffac51"/>
        <circle class="qs-node" style="--d:.44s" cx="67" cy="32" r="2.6" fill="#31c48d"/>
        <g class="qs-node" style="--d:.52s">
          <circle cx="59" cy="66" r="10" fill="#d4edff"/>
          <circle cx="59" cy="63" r="3.4" fill="#0168dd"/>
          <path d="M53.4 72.6a5.9 5.9 0 0 1 11.2 0Z" fill="#0168dd"/>
        </g>
        <rect class="qs-node" style="--d:.62s" x="49" y="84" width="20" height="5" rx="2.5" fill="#2aa7ff"/>
        <rect class="qs-node" style="--d:.68s" x="49" y="93" width="20" height="5" rx="2.5" fill="#a7d9fc"/>
        <rect class="qs-node" style="--d:.74s" x="49" y="102" width="20" height="5" rx="2.5" fill="#a7d9fc"/>
        <path class="qs-draw" style="--len:72;--d:.6s" d="M84 60 V132" stroke="#e5e7eb" stroke-width="1.5" stroke-linecap="round"/>
        <path class="qs-draw" style="--len:124;--d:.7s" d="M84 132 H208" stroke="#e5e7eb" stroke-width="1.5" stroke-linecap="round"/>
        <rect class="qs-grow" style="--d:.9s" x="92" y="106" width="9" height="26" rx="2" fill="#eaf6ff"/>
        <rect class="qs-grow" style="--d:.98s" x="112" y="92" width="9" height="40" rx="2" fill="#eaf6ff"/>
        <rect class="qs-grow" style="--d:1.06s" x="132" y="98" width="9" height="34" rx="2" fill="#eaf6ff"/>
        <rect class="qs-grow" style="--d:1.14s" x="152" y="78" width="9" height="54" rx="2" fill="#eaf6ff"/>
        <rect class="qs-grow" style="--d:1.22s" x="172" y="86" width="9" height="46" rx="2" fill="#eaf6ff"/>
        <rect class="qs-grow" style="--d:1.3s" x="192" y="66" width="9" height="66" rx="2" fill="#d4edff"/>
        <path class="qs-draw" style="--len:132;--d:1.15s" d="M96 112 L116 98 L136 104 L156 84 L176 92 L196 72" stroke="#0168dd" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        <path class="qs-draw" style="--len:132;--d:1.35s" d="M96 122 L116 116 L136 120 L156 108 L176 112 L196 100" stroke="#2aa7ff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        <path class="qs-draw" style="--len:132;--d:1.55s" d="M96 126 L116 124 L136 128 L156 122 L176 120 L196 116" stroke="#31c48d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle class="qs-node" style="--d:1.75s" cx="196" cy="72" r="4" fill="#fff" stroke="#0168dd" stroke-width="2.4"/>
        <g class="qs-float" style="--d:.2s"><g class="qs-node" style="--d:1.5s">
          <rect x="212" y="18" width="46" height="34" rx="6" fill="#d4edff"/>
          <rect x="218" y="25" width="26" height="4" rx="2" fill="#0168dd"/>
          <rect x="218" y="33" width="34" height="3" rx="1.5" fill="#a7d9fc"/>
          <rect x="218" y="40" width="30" height="3" rx="1.5" fill="#a7d9fc"/>
        </g></g>
        <g class="qs-float" style="--d:1.4s"><g class="qs-node" style="--d:1.62s">
          <path d="M6 46h30a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H18l-7 7v-7H6a6 6 0 0 1-6-6V52a6 6 0 0 1 6-6Z" fill="#1f2e54"/>
          <circle class="qs-blink" style="--d:0s" cx="14" cy="59" r="2.4" fill="#fff"/>
          <circle class="qs-blink" style="--d:.2s" cx="21" cy="59" r="2.4" fill="#fff"/>
          <circle class="qs-blink" style="--d:.4s" cx="28" cy="59" r="2.4" fill="#fff"/>
        </g></g>
        <g class="qs-node" style="--d:1.8s">
          <path d="M232 136c-9-3-13-11-12-20 8 1 13 8 12 20Z" fill="#31c48d"/>
          <path d="M234 136c8-4 11-12 9-21-8 2-12 10-9 21Z" fill="#0e9f6e"/>
          <path d="M233 122v18" stroke="#046c4e" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M223 138h20l-2.4 16a2 2 0 0 1-2 1.8h-11.2a2 2 0 0 1-2-1.8L223 138Z" fill="#1f2e54"/>
        </g>
      </svg>
    </div>
    <div class="done-illustration-body">
      <p class="title">Your organization is all set</p>
      <p class="desc">You created it when you signed up &mdash; every step below builds on it.</p>
      <button type="button" class="btn btn-primary" data-resume>${nextStep() ? `Start with: ${esc(nextStep().label)}` : 'Go to dashboard'}</button>
    </div>
  `;
}

function renderDone() {
  if (['v3', 'v4'].includes(state.direction)) {
    return `
      <div class="done-scene">
        <div class="top-row">
          <div><h2>Your organization is all set</h2><p>You created it when you signed up &mdash; every step below builds on it.</p></div>
          <button type="button" class="btn btn-primary" data-resume>${nextStep() ? `Start with: ${esc(nextStep().label)}` : 'Go to dashboard'}</button>
        </div>
        ${renderCoPreview()}
      </div>
    `;
  }
  return `<div class="done-scene done-scene--illustration">${renderDoneIllustration()}</div>`;
}

function renderPaneBody(s) {
  switch (s.pane.kind) {
    case 'done': return renderDone();
    case 'chips-plus-input': return renderChipsPlusInput(s);
    case 'selectable-list': return renderSelectableList(s);
    case 'form': return renderForm(s);
    case 'project-setup': return renderProjectSetup(s);
    case 'payment-table': return renderPaymentTable(s);
    case 'templates': return renderTemplates(s);
    case 'provider-list': return renderProviderList(s);
    case 'download': return renderDownload(s);
    case 'invite': return renderInvite(s);
    default: return '';
  }
}

/* ── rail + pane + app-stage render ──────────────────────────────────── */
function renderRail() {
  const steps = visibleSteps();
  const richHeader = ['v3', 'v4'].includes(state.direction);
  return `
    <div class="rail">
      ${richHeader ? `
      <div class="rail-header">
        <h2>Get Started</h2>
        <p class="sub">Complete the tasks to get started</p>
        <p class="count">${completedCount()}/${totalCount()} steps</p>
        <div class="rail-progress"><span style="width:${percent()}%"></span></div>
      </div>
      ` : `
      <div class="rail-header rail-header--compact">
        <div class="rail-header-row"><h2>Get Started</h2><span class="pct-badge">${percent()}%</span></div>
        <div class="rail-progress"><span style="width:${percent()}%"></span></div>
      </div>
      `}
      <ul class="rail-steps">
        ${steps.map((s) => `
          <li><button type="button" class="step-row ${s.id === state.activeId ? 'active' : ''} ${s.done ? 'done' : ''} ${s.id === 'connect-payroll' && s.skipped ? 'declined' : ''}" data-select-step="${esc(s.id)}">
            <span class="material-symbols-rounded ic">${s.done ? 'check_circle' : 'radio_button_unchecked'}</span>
            <span class="label">${esc(s.label)}</span>
          </button></li>
        `).join('')}
      </ul>
    </div>
  `;
}

function renderPane() {
  const el = document.getElementById('pane');
  if (!el) return;
  el.innerHTML = renderPaneBody(activeStep());
  syncDownloadPreview();
}

// V2 only — Integrations card + "Get 1:1 setup walkthroughs" banner, below
// the checklist. Content from window.ASIDE (data.js); the setup-call
// banner's copy is hardcoded here same as the Kit source (it was never
// data-driven there either).
function renderAsideBanners() {
  const a = window.ASIDE.integrations;
  return `
    <div class="aside-stack">
      <section class="aside-card">
        <div class="aside-card-head">
          <div><h2>${esc(a.heading)}</h2><p>${esc(a.body)}</p></div>
          <button type="button" class="btn btn-secondary">${esc(a.link)}</button>
        </div>
        <div class="tool-row">
          ${a.tools.map((t) => `<span class="tool-pill"><img src="./assets/logo-${esc(t.logo)}.svg" alt="" class="tool-logo" />${esc(t.name)}</span>`).join('')}
        </div>
      </section>
      <section class="aside-card">
        <div class="aside-card-head">
          <div class="avatar-stack-head">
            <div class="avatar-stack">
              <img src="./assets/avatar-1.png" alt="" aria-hidden="true" />
              <img src="./assets/avatar-2.png" alt="" aria-hidden="true" />
              <img src="./assets/avatar-3.png" alt="" aria-hidden="true" />
            </div>
            <h2>Get 1:1 setup walkthroughs on</h2>
          </div>
          <button type="button" class="btn btn-primary"><span class="material-symbols-rounded">event_note</span>Schedule a call</button>
        </div>
        <div class="topic-grid">
          <div class="topic-tile"><span class="material-symbols-rounded">insert_chart</span><div><p class="title">Customize accountability</p><p class="desc">Set up idle time detection, activity and screenshot settings, and automatic alerts.</p></div></div>
          <div class="topic-tile"><span class="material-symbols-rounded">check_circle</span><div><p class="title">Integrations</p><p class="desc">Walk through the tools your team uses and how they can connect with Hubstaff.</p></div></div>
          <div class="topic-tile"><span class="material-symbols-rounded">lightbulb</span><div><p class="title">Any additional topics</p><p class="desc">Schedules, location tracking, client and project workflows, and more.</p></div></div>
        </div>
      </section>
    </div>
  `;
}

function renderApp() {
  return `
    <div class="qs-topbar">
      <h1>&#128075; Welcome, ${esc(WIZARD.name)}!</h1>
      <span class="plan-pill">Your plan: ${esc(WIZARD.plan)}</span>
    </div>
    <div class="qs-wrap">
      ${renderRail()}
      <div class="pane" id="pane">${renderPaneBody(activeStep())}</div>
    </div>
    ${state.direction === 'a' ? renderAsideBanners() : ''}
    ${renderToast()}
  `;
}

function renderToast() {
  const s = state.allSteps.find((x) => x.id === state.justDone);
  return `
    <div class="toast ${state.justDone ? 'is-visible' : ''}">
      <div class="row">
        <span class="material-symbols-rounded check">check_circle</span>
        <p style="flex:1;font-weight:600;">${s ? esc(s.label) : ''} done!</p>
        <button type="button" class="close-btn" data-dismiss-toast><span class="material-symbols-rounded">close</span></button>
      </div>
      <p>Nice work &mdash; moving you to the next step.</p>
    </div>
  `;
}

/* Renata, 2026-09-30: "remove the CTAs on the welcome screen" — matches the
   Kit source's `trimmed` card exactly: no decision, no CTA row, just the
   copy below and an auto-advance into the checklist (see
   startWelcomeAutoEnter()). All 6 rows now render (was 4, hardcoded) so
   nothing in the mini-card preview is missing. */
// V2 (direction 'a') is the one direction that still asks instead of
// auto-entering — same copy/CTAs as the Kit source's non-trimmed branch.
function renderWelcome() {
  const left = totalCount() - completedCount();
  // Rows come from THIS version's live steps (create-org is the card's own
  // pre-done first row), so the preview always matches the real checklist.
  const rows = visibleSteps().filter((st) => st.id !== 'create-org');
  return `
    <div class="welcome-backdrop">
      <div class="welcome-wrap">
        <div class="welcome-glow" aria-hidden="true"></div>
        <div class="welcome-glass">
      <div class="welcome-card">
        <div class="welcome-scene" aria-hidden="true">
          <div class="mini-card">
            <div class="mini-head">
              <span><span class="material-symbols-rounded" style="color:var(--primary-500)">rocket_launch</span> Get Started</span>
              ${trimmed() ? '' : `<span class="mini-count">${completedCount()} of ${totalCount()}</span>`}
            </div>
            <div class="mini-progress"><span style="width:${percent()}%"></span></div>
            <ul class="mini-rows">
              <li><span class="material-symbols-rounded" style="color:var(--green-400)">check_circle</span> Create your org</li>
              ${rows.map((st, i) => `<li><span class="mini-lit" style="animation-delay:${1380 + i * 180}ms"><span class="material-symbols-rounded">${esc(st.icon)}</span></span> ${esc(st.label)}</li>`).join('')}
            </ul>
          </div>
        </div>
        <div class="welcome-body">
          <h1>${esc(WIZARD.org)}${trimmed() ? '' : `<span class="pill-primary">${left} steps left</span>`}</h1>
          ${trimmed() ? `
          <p>We're getting your <span style="color:var(--gray-700)">workforce analytics</span> ready &mdash; so you can see how the work really happens, and help your team work smarter.</p>
          <div class="welcome-loading">
            <span class="material-symbols-rounded">progress_activity</span>
            Setting up your workspace
          </div>
          ` : `
          <p>Everything you picked is in place. Just <span style="color:var(--gray-700)">${left} quick steps</span> to go &mdash; about <span style="color:var(--gray-700)">${minsLeft()} minutes</span>.</p>
          <div class="welcome-actions">
            <button type="button" class="btn btn-secondary" data-skip-welcome>Skip &mdash; I'll explore first</button>
            <button type="button" class="btn btn-primary" data-enter-app><span class="material-symbols-rounded">rocket_launch</span>Set up my workspace</button>
          </div>
          `}
        </div>
      </div>
        </div>
      </div>
    </div>
  `;
}

/* V1/V3/V4 in the Kit source have no CTA, so the welcome scene has to end by
   itself — same timing as quickstart.js's autoEnter(): the meter/row
   choreography finishes around 3040ms, plus a 400ms hold. Reduced motion
   skips the choreography, so the hold drops to a flat 1200ms with it. V2
   (direction 'a') keeps its CTAs and waits for a real click instead. */
let welcomeTimer = null;
function startWelcomeAutoEnter() {
  clearTimeout(welcomeTimer);
  if (!trimmed()) return;
  welcomeTimer = setTimeout(() => {
    if (state.stage === 'welcome') { state.stage = 'app'; render(); }
  }, reducedMotion ? 1200 : 3440);
}

function renderDashboard() {
  if (state.dash === 'empty') {
    return `
      <div class="dash-state">
        <div class="disc"><span class="material-symbols-rounded">timer</span></div>
        <h2>You're not tracking time yet</h2>
        <p>Start the timer and this page fills in &mdash; hours worked, activity levels and where your team's time actually goes.</p>
        <div class="actions">
          <button type="button" class="btn btn-primary" data-start-tracking>Start tracking time</button>
          <button type="button" class="btn-ghost" data-show-sample>Explore sample data</button>
        </div>
      </div>
    `;
  }
  if (state.dash === 'warming') {
    const unlockSec = DASHBOARD.unlockMinutes * 60;
    const pct = Math.min(100, Math.round((state.trackedSec / unlockSec) * 100));
    const m = Math.floor(state.trackedSec / 60); const sec = String(state.trackedSec % 60).padStart(2, '0');
    return `
      <div class="dash-state">
        <div class="disc"><span class="material-symbols-rounded">progress_activity</span></div>
        <h2>Collecting your first data</h2>
        <p>Your dashboard fills in once there's about ${DASHBOARD.unlockMinutes} minutes of tracked time to work with.</p>
        <div style="max-width:34rem;margin:2.4rem auto 0;">
          <div style="display:flex;justify-content:space-between;font-size:1.3rem;"><span>${m}:${sec}</span><span style="color:var(--gray-400)">${DASHBOARD.unlockMinutes}:00</span></div>
          <div class="rail-progress" style="margin-top:.6rem;"><span style="width:${pct}%"></span></div>
        </div>
        <div class="actions"><button type="button" class="btn btn-secondary" data-show-sample>Explore sample data instead</button><button type="button" class="btn-ghost" data-back-to-checklist>Back to Get Started</button></div>
      </div>
    `;
  }
  return `
    <div class="dash-state">
      <div class="disc"><span class="material-symbols-rounded">check_circle</span></div>
      <h2>Your dashboard is ready</h2>
      <p>This is a standalone preview — the real Dashboard page lives behind the sidebar link.</p>
      <div class="actions"><button type="button" class="btn-ghost" data-back-to-checklist>Back to Get Started</button></div>
    </div>
  `;
}

function renderSuccess() {
  return `
    <div class="qs-wrap" style="justify-content:center;">
      <div class="pane success-card" style="max-width:56rem;">
        <div class="medallion"><span class="material-symbols-rounded">check</span></div>
        <h2>Setup complete</h2>
        <p style="color:var(--gray-500);margin-top:.8rem;">Everything's in place — your team can start tracking real time.</p>
        <div class="success-actions">
          <button type="button" class="btn btn-secondary" data-review-setup>Review what you set up</button>
          <button type="button" class="btn btn-primary" data-go-dashboard>Go to dashboard<span class="material-symbols-rounded">arrow_forward</span></button>
        </div>
      </div>
    </div>
  `;
}

/* ── payment modal ────────────────────────────────────────────────────── */
function renderPaymentModal() {
  const name = state.paymentModalFor;
  const el = document.getElementById('payment-modal');
  if (!name) { el.classList.remove('is-open'); el.innerHTML = ''; return; }
  const m = TEAM.find((t) => t.name === name);
  const pd = state.paymentData[name];
  el.classList.add('is-open');
  el.innerHTML = `
    <div class="modal-panel">
      <button type="button" class="close-btn" data-close-payment aria-label="Close"><span class="material-symbols-rounded">close</span></button>
      <h1>Edit Payment Details</h1>
      <div class="field"><label>Member</label><p style="margin:0;font-size:1.4rem;">${esc(m.email)}</p></div>
      <div class="field">
        <div class="lbl-row"><label>Pay rate</label><span class="material-symbols-rounded" style="font-size:1.4rem;color:var(--gray-400)" title="The hourly rate this member is paid.">info</span></div>
        <input type="text" id="pay-rate" value="${esc(pd.payRate)}" placeholder="0.00" />
        <p class="hint">USD/hr</p>
      </div>
      <div class="field">
        <div class="lbl-row"><label>Pay period</label><span class="material-symbols-rounded" style="font-size:1.4rem;color:var(--gray-400)" title="How often this member is paid.">info</span></div>
        <select id="pay-period">
          ${['None', 'Weekly', 'Bi-weekly', 'Monthly'].map((o) => `<option ${pd.payPeriod === o ? 'selected' : ''}>${o}</option>`).join('')}
        </select>
      </div>
      <div class="toggle-row">
        <button type="button" role="switch" class="toggle-track toggle-track--sm ${pd.approval ? 'on' : ''}" id="pay-approval" aria-checked="${pd.approval}" aria-label="Require timesheet approval"></button>
        <span style="font-size:1.3rem;color:var(--gray-600);">Require timesheet approval</span>
        <span class="material-symbols-rounded" style="font-size:1.4rem;color:var(--gray-400)" title="Managers must approve a timesheet before it's paid.">info</span>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-close-payment>Cancel</button>
        <button type="button" class="btn btn-primary" data-save-payment>Save</button>
      </div>
    </div>
  `;
}

/* ── master render ────────────────────────────────────────────────────── */
function render() {
  const root = document.getElementById('shell-content');
  if (state.stage === 'welcome') { root.innerHTML = renderWelcome(); startWelcomeAutoEnter(); }
  else if (state.stage === 'dashboard') root.innerHTML = renderDashboard();
  else root.innerHTML = allDone() && !state.successSeen ? renderSuccess() : renderApp();
  renderPaymentModal();
  syncDownloadPreview();
}

/* ── events (delegated on document) ──────────────────────────────────── */
document.addEventListener('click', (e) => {
  const t = (sel) => e.target.closest(sel);

  if (t('[data-select-step]')) return select(t('[data-select-step]').dataset.selectStep);
  if (t('[data-complete]')) return complete(t('[data-complete]').dataset.complete);
  if (t('[data-skip]')) return skip(t('[data-skip]').dataset.skip);
  if (t('[data-resume]')) { const n = nextStep(); if (n) select(n.id); else { state.stage = 'dashboard'; render(); } return; }

  if (t('[data-toggle-chip]')) {
    const btn = t('[data-toggle-chip]'); const s = state.allSteps.find((x) => x.id === btn.dataset.toggleChip);
    const name = btn.dataset.chipName; const i = s.chips.indexOf(name);
    if (i === -1) s.chips.push(name); else s.chips.splice(i, 1);
    return renderPane();
  }
  if (t('[data-add-chip]')) {
    const id = t('[data-add-chip]').dataset.addChip; const s = state.allSteps.find((x) => x.id === id);
    const input = document.getElementById('chip-input'); const v = (input.value || '').trim();
    if (v) { if (!s.added.includes(v)) s.added.push(v); if (!s.chips.includes(v)) s.chips.push(v); }
    return renderPane();
  }

  if (t('[data-open-payment]')) { state.paymentModalFor = t('[data-open-payment]').dataset.openPayment; return renderPaymentModal(); }
  if (t('[data-close-payment]')) { state.paymentModalFor = null; return renderPaymentModal(); }
  if (t('[data-save-payment]')) {
    const name = state.paymentModalFor; const pd = state.paymentData[name];
    pd.payRate = document.getElementById('pay-rate').value;
    pd.payPeriod = document.getElementById('pay-period').value;
    pd.saved = true;
    state.paymentModalFor = null;
    renderPaymentModal();
    return renderPane();
  }
  if (t('#pay-approval')) { const name = state.paymentModalFor; state.paymentData[name].approval = !state.paymentData[name].approval; renderPaymentModal(); return renderPane(); }

  if (t('[data-toggle-template]')) {
    const btn = t('[data-toggle-template]'); const s = state.allSteps.find((x) => x.id === btn.dataset.toggleTemplate);
    const id = btn.dataset.templateId; const i = s.chosen.indexOf(id);
    if (i === -1) s.chosen.push(id); else s.chosen.splice(i, 1);
    return renderPane();
  }
  if (t('[data-toggle-project-field]')) {
    const btn = t('[data-toggle-project-field]');
    if (btn.disabled) return;
    const id = btn.dataset.toggleProjectField;
    activeStep().values[id] = !activeStep().values[id];
    return renderPane();
  }
  if (t('[data-connect-provider]')) {
    const s = state.allSteps.find((x) => x.id === 'connect-payroll');
    s.provider = t('[data-connect-provider]').dataset.connectProvider;
    window.open('https://app.staging.hbstf.co/organizations/61/integrations/new', '_blank', 'noopener');
    return complete('connect-payroll');
  }
  if (t('[data-row-approval]')) {
    const pd = state.paymentData[t('[data-row-approval]').dataset.rowApproval];
    pd.approval = !pd.approval;
    return renderPane();
  }
  if (t('[data-download]')) {
    window.open('https://hubstaff.com/download', '_blank', 'noopener');
    return complete(t('[data-download]').dataset.download);
  }
  if (t('[data-add-invite]')) {
    const id = t('[data-add-invite]').dataset.addInvite; const s = state.allSteps.find((x) => x.id === id);
    const v = (document.getElementById('invite-email').value || '').trim();
    const role = document.getElementById('invite-role').value;
    if (!v) s.error = 'Enter an email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) s.error = `"${v}" isn't a valid email address.`;
    else if (s.invites.some((i) => i.email.toLowerCase() === v.toLowerCase())) s.error = 'That address is already on the list.';
    else { s.invites.push({ email: v, role }); s.inviteEmail = ''; s.error = ''; }
    return renderPane();
  }
  if (t('[data-remove-invite]')) {
    const btn = t('[data-remove-invite]'); const s = state.allSteps.find((x) => x.id === btn.dataset.removeInvite);
    s.invites = s.invites.filter((i) => i.email !== btn.dataset.inviteEmail);
    return renderPane();
  }
  if (t('[data-copy-link]')) {
    const id = t('[data-copy-link]').dataset.copyLink; const s = state.allSteps.find((x) => x.id === id);
    navigator.clipboard && navigator.clipboard.writeText(s.pane.link).catch(() => {});
    return;
  }

  if (t('[data-co-select]')) { state.coPreviewPhase = 'idle'; state.coPreviewId = t('[data-co-select]').dataset.coSelect; state.coPreviewOpenDay = null; return renderPane(); }
  if (t('[data-co-day]')) { state.coPreviewPhase = 'idle'; state.coPreviewOpenDay = coActive().weekly.find((d) => d.day === t('[data-co-day]').dataset.coDay) || null; return renderPane(); }
  if (t('[data-co-close]')) { state.coPreviewOpenDay = null; return renderPane(); }

  if (t('[data-dismiss-toast]')) { state.justDone = null; return render(); }
  if (t('[data-enter-app]')) { state.stage = 'app'; return render(); }
  if (t('[data-skip-welcome]')) { state.stage = 'dashboard'; return render(); }
  if (t('[data-start-tracking]')) { state.dash = 'warming'; state.trackedSec = 0; runTracking(); return render(); }
  if (t('[data-show-sample]')) { clearInterval(state.trackTimer); state.sampleData = true; state.dash = 'ready'; return render(); }
  if (t('[data-back-to-checklist]')) { state.stage = 'app'; return render(); }
  if (t('[data-review-setup]')) { state.successSeen = true; return render(); }
  if (t('[data-go-dashboard]')) { state.successSeen = true; state.stage = 'dashboard'; return render(); }
});

document.addEventListener('change', (e) => {
  if (e.target.id === 'global-weekly') activeStep().values.weekly = e.target.value;
  if (e.target.id === 'global-daily') activeStep().values.daily = e.target.value;
  if (e.target.dataset.indWeekly) activeStep().individualLimits[e.target.dataset.indWeekly].weekly = e.target.value;
  if (e.target.dataset.indDaily) activeStep().individualLimits[e.target.dataset.indDaily].daily = e.target.value;
  if (e.target.id === 'project-name') { activeStep().values.projectName = e.target.value; renderPane(); }
  if (e.target.id === 'project-client') { activeStep().values.client = e.target.value; renderPane(); }
});

function runTracking() {
  clearInterval(state.trackTimer);
  const unlockSec = DASHBOARD.unlockMinutes * 60;
  state.trackTimer = setInterval(() => {
    state.trackedSec += 6;
    if (state.trackedSec < unlockSec) { render(); return; }
    state.trackedSec = unlockSec; clearInterval(state.trackTimer); state.dash = 'ready'; render();
  }, 60);
}

/* ── Conditions wiring (prototype-conditions.js is vanilla — used as-is) ── */
window.addEventListener('DOMContentLoaded', () => {
  render();
  runCoStep('toMembersHint');

  window.ReviewToolbar.init({
    topOffset: 48,
    conditions: {
      roles: [{ id: 'org-owner', label: 'Org Owner / Manager' }],
      plansLabel: 'Plan',
      plans: [
        { id: 'enterprise', label: 'Enterprise', note: 'Insights included' },
        { id: 'team', label: 'Team', note: 'Insights included' },
        { id: 'grow', label: 'Grow', note: 'No Insights' },
        { id: 'starter', label: 'Starter', note: 'No Insights' },
      ],
      customLabel: 'Goal',
      custom: [
        { id: 'none', label: 'No payroll goal' },
        { id: 'payroll', label: 'Pay your team', note: '+2 steps' },
      ],
      onChange(c) { state.plan = c.plan; state.payroll = c.custom === 'payroll'; render(); },
    },
    versions: {
      project: 'AR0239 — Get Started checklist',
      notice: 'Prototype — not a live product',
      note: 'Concept prototype · nothing here is real',
      // No `el` on any entry: this port has one persistent root, not a
      // separate hidden/shown block per direction like the Kit source's
      // Alpine components — giving every entry the same el would make
      // VersionSwitcher.show() fight itself over that one node's `hidden`
      // state. setDirection() (app.js) owns the swap instead, via onChange.
      groups: [{ label: 'Directions', versions: [
        { id: 'a3', code: 'V1' },
        { id: 'a', code: 'V2' },
        { id: 'v3', code: 'V3', current: true },
        { id: 'v4', code: 'V4' },
      ] }],
      onChange(v) { setDirection(v.id); },
    },
    annotations: {
      pages: window.DESIGN_ANNOTATIONS_DATA.pages,
      annotations: window.DESIGN_ANNOTATIONS_DATA.annotations,
      mount: '#shell-content',
    },
  });

  window.HubstaffShell.init({
    activeItem: 'quick-start', logoHref: '#', expanded: true,
    navPrepend: [{ key: 'quick-start', icon: 'rocket_launch', title: 'Get Started' }],
  });
  document.addEventListener('click', (e) => {
    const row = e.target.closest('#hs-sidebar .hs-nav-item[data-key="quick-start"], #hs-sidebar .hs-nav-item[data-key="dashboard"]');
    if (!row) return;
    const key = row.getAttribute('data-key');
    if (key === 'dashboard') { state.stage = 'dashboard'; } else { state.stage = 'app'; }
    render();
    if (window.HubstaffShell.setActiveItem) window.HubstaffShell.setActiveItem(key);
  });
});
