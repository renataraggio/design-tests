/* AR0239 V3 ("New layout") — standalone vanilla-JS port of the Kit
   prototype's V3 direction (product/squads/growth/experiments/AR0239/
   prototype/, quickstart.js + the V3-specific markup in index.html).
   Same steps, same gating, same copy — no Alpine/Vite, plain state +
   innerHTML rebuilds, same pattern as the AR0239-v.1 sneak-peek standalone
   port. Requires data.js (WIZARD/TEAM/STEPS/DASHBOARD) loaded first. */

function freshStep(s) {
  return {
    ...s,
    skipped: false,
    chips: (s.pane.options || []).filter((o) => o.checked).map((o) => o.label),
    added: [],
    chosen: [],
    values: s.id === 'member-limits' ? { weekly: '40', daily: '8' } : {},
    individualLimits: TEAM.reduce((acc, m) => ({ ...acc, [m.name]: { weekly: '40', daily: '8' } }), {}),
    provider: null,
    platform: (s.pane.platforms || [])[0] ? s.pane.platforms[0].id : null,
    custom: '',
    invites: [],
    inviteEmail: '',
    inviteRole: 'user',
    error: '',
  };
}

const state = {
  stage: 'welcome', // 'welcome' | 'app' | 'dashboard'
  activeId: 'create-org',
  plan: 'enterprise',
  payroll: false,
  allSteps: STEPS.map(freshStep),
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
function visibleSteps() {
  return state.allSteps.filter((s) => (!s.insightsOnly || hasInsights()) && (!s.payrollOnly || hasPayroll()));
}
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
      <div class="callout above ${state.coPreviewPhase === 'membersHint' ? 'is-visible' : ''}" style="left:0">View other members</div>
      ${TEAM.map((row) => `
        <button type="button" class="member-pill ${row.name === state.coPreviewId ? 'is-active' : ''}" data-co-select="${esc(row.name)}">
          <span class="avatar" style="width:2.4rem;height:2.4rem;font-size:1.1rem;background:${row.color}">${esc(row.initials)}</span>
          <span>${esc(row.name)}</span>
        </button>
      `).join('')}
    </div>
    <div class="card" style="border:1px solid var(--gray-200);border-radius:var(--radius-lg);padding:1.6rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:1.2rem;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:.8rem;">
          <span class="avatar" style="width:4rem;height:4rem;font-size:1.4rem;background:${m.color}">${esc(m.initials)}</span>
          <div>
            <p style="margin:0;font-size:1.6rem;font-weight:600;">${esc(m.name)}</p>
            <span style="display:inline-flex;margin-top:.3rem;padding:.2rem .8rem;border-radius:999px;background:var(--green-100);color:var(--green-800);font-size:1.1rem;">Working on <b style="margin-left:.4rem">${esc(m.workingOn)}</b></span>
          </div>
        </div>
        <button type="button" class="btn btn-outline" style="font-size:1.2rem;padding:.5rem 1rem;"><span class="material-symbols-rounded" style="font-size:1.6rem">image</span>View latest screenshot</button>
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
          return `
            <div class="day-cell">
              <div class="callout above ${state.coPreviewPhase === 'hoverHint' && isDemo ? 'is-visible' : ''}">Hover to see what happened here</div>
              <div class="callout below ${state.coPreviewPhase === 'clickHint' && isDemo ? 'is-visible' : ''}">Click for screenshots</div>
              <button type="button" class="day-btn" data-co-day="${esc(day.day)}">
                <span class="day-name">${esc(day.day)}</span>
                <span class="bar-track"><span class="bar-fill ${b}" style="width:${day.pct ?? 0}%"></span></span>
                <span class="pct-pill ${b}">${day.pct === null ? '&#8211;' : day.pct + '%'}</span>
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

function renderPaymentTable(s) {
  return renderHeader(s, `<button type="button" class="btn btn-primary" data-complete="${esc(s.id)}">${esc(s.pane.cta)}</button>`) + `
    <table class="pay-table">
      <thead><tr><th>Email</th><th>Payment details</th><th></th></tr></thead>
      <tbody>
        ${TEAM.map((m) => {
          const pd = state.paymentData[m.name];
          return `
            <tr>
              <td><div class="who-cell"><span class="avatar" style="background:${m.color}">${esc(m.initials)}</span><div><div>${esc(m.name)}</div><div class="email">${esc(m.email)}</div></div></div></td>
              <td>${pd.saved ? `${esc(pd.payRate || '0.00')} USD/hr` : 'Details not set'}</td>
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
          <div class="head"><span class="title">${esc(t.title)}</span><button type="button" class="btn ${s.chosen.includes(t.id) ? 'btn-secondary' : 'btn-primary'}" style="padding:.5rem 1.2rem;font-size:1.2rem;" data-toggle-template="${esc(s.id)}" data-template-id="${esc(t.id)}">${s.chosen.includes(t.id) ? esc(s.pane.templateDoneCta || 'Done') : esc(s.pane.templateCta)}</button></div>
          <div class="meta">${t.meta.map((mm) => `<span>${esc(mm)}</span>`).join('')}</div>
          <p class="desc">${esc(t.desc)}</p>
        </div>
      `).join('')}
    </div>
  `;
}

function renderProviderList(s) {
  return renderHeader(s, `<button type="button" class="btn btn-primary" ${!s.provider ? 'disabled' : ''} data-complete="${esc(s.id)}">${esc(s.pane.cta)}</button>`) + `
    ${s.pane.providers.map((p) => `
      <button type="button" class="provider-row ${s.provider === p.id ? 'on' : ''}" data-choose-provider="${esc(s.id)}" data-provider-id="${esc(p.id)}">
        <span class="logo"></span>
        <span style="flex:1;min-width:0;"><span class="name">${esc(p.label)}</span><br><span class="hint">${esc(p.hint)}</span></span>
        ${s.provider === p.id ? '<span class="material-symbols-rounded" style="color:var(--primary-700)">check_circle</span>' : ''}
      </button>
    `).join('')}
  `;
}

function renderDownload(s) {
  const platform = (s.pane.platforms.find((p) => p.id === s.platform) || s.pane.platforms[0]);
  return renderHeader(s, `<button type="button" class="btn btn-primary" data-download="${esc(s.id)}"><span class="material-symbols-rounded">download</span>${esc(s.pane.cta)} ${esc(platform.label)}</button>`) + `
    ${s.pane.platforms.map((p) => `
      <button type="button" class="platform-row ${p.id === s.platform ? 'primary' : ''}" data-choose-platform="${esc(s.id)}" data-platform-id="${esc(p.id)}">
        <span class="material-symbols-rounded" style="font-size:2.4rem;color:var(--gray-500)">${p.icon}</span>
        <span style="flex:1;"><span class="name">${esc(p.label)}</span><br><span class="hint">${esc(p.meta)}</span></span>
        ${p.id === s.platform ? '<span class="material-symbols-rounded" style="color:var(--primary-700)">check_circle</span>' : ''}
      </button>
    `).join('')}
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

function renderDone() {
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

function renderPaneBody(s) {
  switch (s.pane.kind) {
    case 'done': return renderDone();
    case 'chips-plus-input': return renderChipsPlusInput(s);
    case 'selectable-list': return renderSelectableList(s);
    case 'form': return renderForm(s);
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
  return `
    <div class="rail">
      <div class="rail-header">
        <h2>Get Started</h2>
        <p class="sub">Complete the tasks to get started</p>
        <p class="count">${completedCount()}/${totalCount()} steps</p>
        <div class="rail-progress"><span style="width:${percent()}%"></span></div>
      </div>
      <ul class="rail-steps">
        ${steps.map((s) => `
          <li><button type="button" class="step-row ${s.id === state.activeId ? 'active' : ''} ${s.done ? 'done' : ''}" data-select-step="${esc(s.id)}">
            <span class="material-symbols-rounded ic">${s.done ? 'check_circle' : 'radio_button_unchecked'}</span>
            <span class="label">${esc(s.label)}</span>
          </button></li>
        `).join('')}
      </ul>
      <div class="org-setup">
        <h3>Organization set-up</h3>
        <div class="org-row"><span class="lbl">Org name</span><span class="pill-count">${esc(WIZARD.org)}</span></div>
        <div class="org-row"><span class="lbl">Team size</span><span class="pill-count">${esc(WIZARD.sizeLabel)}</span></div>
        <div class="org-row"><span class="lbl">Tracking preferences</span><span class="pill-count">${esc(WIZARD.tracking)}</span></div>
        <div class="org-row"><span class="lbl">Goals</span><span class="pill-count">${esc(wizardGoals()[0])}</span>${wizardGoals().length > 1 ? `<span class="pill-count">+${wizardGoals().length - 1}</span>` : ''}</div>
      </div>
    </div>
  `;
}

function renderPane() {
  const el = document.getElementById('pane');
  if (!el) return;
  el.innerHTML = renderPaneBody(activeStep());
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

function renderWelcome() {
  return `
    <div class="welcome-backdrop">
      <div class="welcome-card">
        <div class="welcome-scene" aria-hidden="true">
          <div class="mini-card">
            <div class="mini-head"><span><span class="material-symbols-rounded" style="color:var(--primary-500)">rocket_launch</span> Get Started</span><span style="font-size:1.1rem;color:var(--gray-500);">${completedCount()} of ${totalCount()}</span></div>
            <div class="mini-progress"><span style="width:${percent()}%"></span></div>
            <ul class="mini-rows">
              <li><span class="material-symbols-rounded" style="color:var(--green-400)">check_circle</span> Create your org</li>
              <li><span class="material-symbols-rounded" style="color:var(--gray-300)">groups</span> Create teams</li>
              <li><span class="material-symbols-rounded" style="color:var(--gray-300)">folder</span> Select projects</li>
              <li><span class="material-symbols-rounded" style="color:var(--gray-300)">tune</span> Set member limits</li>
            </ul>
          </div>
        </div>
        <div class="welcome-body">
          <h1>${esc(WIZARD.org)} <span class="pill-count" style="background:var(--primary-100);color:var(--primary-800);">${totalCount() - completedCount()} steps left</span></h1>
          <p>Everything you picked is in place. Just ${totalCount() - completedCount()} quick steps to go.</p>
          <div class="welcome-actions">
            <button type="button" class="btn btn-secondary" data-skip-welcome>Skip &mdash; I'll explore first</button>
            <button type="button" class="btn btn-primary" data-enter-app><span class="material-symbols-rounded">rocket_launch</span>Set up my workspace</button>
          </div>
        </div>
      </div>
    </div>
  `;
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
        <button type="button" class="toggle-track ${pd.approval ? 'on' : ''}" id="pay-approval" aria-pressed="${pd.approval}"></button>
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
  if (state.stage === 'welcome') root.innerHTML = renderWelcome();
  else if (state.stage === 'dashboard') root.innerHTML = renderDashboard();
  else root.innerHTML = allDone() && !state.successSeen ? renderSuccess() : renderApp();
  renderPaymentModal();
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
  if (t('#pay-approval')) { const name = state.paymentModalFor; state.paymentData[name].approval = !state.paymentData[name].approval; return renderPaymentModal(); }

  if (t('[data-toggle-template]')) {
    const btn = t('[data-toggle-template]'); const s = state.allSteps.find((x) => x.id === btn.dataset.toggleTemplate);
    const id = btn.dataset.templateId; const i = s.chosen.indexOf(id);
    if (i === -1) s.chosen.push(id); else s.chosen.splice(i, 1);
    return renderPane();
  }
  if (t('[data-choose-provider]')) {
    const btn = t('[data-choose-provider]'); const s = state.allSteps.find((x) => x.id === btn.dataset.chooseProvider);
    s.provider = s.provider === btn.dataset.providerId ? null : btn.dataset.providerId;
    return renderPane();
  }
  if (t('[data-choose-platform]')) {
    const btn = t('[data-choose-platform]'); const s = state.allSteps.find((x) => x.id === btn.dataset.choosePlatform);
    s.platform = btn.dataset.platformId;
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
      project: 'AR0239 — Get Started checklist (V3)',
      notice: 'Prototype — not a live product',
      note: 'Concept prototype · nothing here is real',
      groups: [{ label: 'Directions', versions: [{ id: 'v3', code: 'V3', name: 'New layout', el: '#shell-content' }] }],
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
