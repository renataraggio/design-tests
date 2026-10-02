/* AR0239 V5 — standalone vanilla-JS port of the Kit prototype's V5 direction
   (V3 base + V4 "Customize your first project" + V5 welcome/tracking step/V2 org art;
   ported 2026-10-02 from the V3 port in ../AR0239-v3). Original V3 header follows:
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
    values: s.id === 'member-limits' ? { weekly: '40', daily: '8' } : s.id === 'select-projects' ? { projectName: '', client: '', weeklyBudget: false, clientViewer: false } : {},
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
function renderCoIfVisible() { const a = activeStep(); if (state.stage === 'app' && a && a.pane.kind === 'download') renderPane(); }
function runCoStep(step) {
  clearTimeout(state.coPreviewTimer);
  if (reducedMotion && (step === 'toMembersHint' || step === 'toHoverHint' || step === 'toClickHint')) step = 'toReveal';
  state.coPreviewTimer = setTimeout(() => {
    switch (step) {
      case 'toMembersHint': state.coPreviewPhase = 'membersHint'; renderCoIfVisible(); runCoStep('toHoverHint'); break;
      case 'toHoverHint': state.coPreviewPhase = 'hoverHint'; renderCoIfVisible(); runCoStep('toClickHint'); break;
      case 'toClickHint': state.coPreviewPhase = 'clickHint'; renderCoIfVisible(); runCoStep('toReveal'); break;
      case 'toReveal': state.coPreviewPhase = 'idle'; state.coPreviewOpenDay = coFirstDataDay(); renderCoIfVisible(); runCoStep('toClose'); break;
      case 'toClose': state.coPreviewOpenDay = null; renderCoIfVisible(); runCoStep('toNext'); break;
      case 'toNext': {
        const i = TEAM.findIndex((m) => m.name === state.coPreviewId);
        state.coPreviewId = TEAM[(i + 1) % TEAM.length].name;
        renderCoIfVisible();
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

function renderProjectSetup(s) {
  const v = s.values;
  const header = renderHeader(s, `<button type="button" class="btn btn-primary" data-complete="${esc(s.id)}" ${v.projectName.trim() ? '' : 'disabled'}>${esc(s.pane.cta)}</button>`);
  const fields = s.pane.fields.map((f) => {
    if (f.type === 'text') return `<div class="field"><div class="lbl-row"><label for="proj-${f.id}">${esc(f.label)}${f.required ? ' <span aria-hidden="true">*</span>' : ''}</label></div><input type="text" id="proj-${f.id}" data-proj-field="${f.id}" value="${esc(v[f.id])}" placeholder="${esc(f.placeholder)}" aria-required="true" /></div>`;
    if (f.type === 'select') return `<div class="field"><div class="lbl-row"><label for="proj-${f.id}">${esc(f.label)}</label></div><select id="proj-${f.id}" data-proj-select="${f.id}"><option value="">${esc(f.placeholder)}</option>${f.options.map((o) => `<option value="${o.value}" ${v[f.id] === o.value ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select><p class="hint">${esc(f.helper)}</p></div>`;
    const off = f.disabledUntil && !v[f.disabledUntil];
    return `<div class="toggle-card ${off ? 'is-off' : ''}"><div class="toggle-card-top"><span class="tc-title"><span class="material-symbols-rounded">${f.icon}</span><b>${esc(f.label)}</b><span class="tc-badge">${esc(f.badge)}</span></span><button type="button" role="switch" aria-checked="${!!v[f.id]}" aria-label="${esc(f.label)}" class="toggle-track ${v[f.id] ? 'on' : ''}" data-proj-toggle="${f.id}" ${off ? 'disabled' : ''}></button></div><p>${esc(f.description)}</p></div>`;
  }).join('');
  return header + `<div class="proj-grid">${fields}</div>`;
}

/* V5 "Start tracking time": heading + CTAs, then the dashboard sneak-peek (replaces the fake timer). */
function renderDownload(s) {
  return renderHeader(s, `<button type="button" class="btn btn-primary" data-download="${esc(s.id)}">${esc(s.pane.cta)}</button>`) + `
    <div class="co-frame" aria-hidden="true"><div class="co-inner">${renderCoPreview()}</div></div>
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

/* V5 Create your org = V2's illustration + title/CTA block (Renata, 2026-10-02). */
function renderDone() {
  return `
    <div class="done-scene v2-done">
      <div class="v2-art" aria-hidden="true"><svg class="v2-svg" viewBox="0 0 264 180" fill="none">
                        <!-- ground -->
                        <ellipse class="qs-node fill-gray-100" style="--d: .1s;" cx="130" cy="164" rx="76" ry="7"/>
                        <ellipse class="qs-node fill-gray-100" style="--d: .2s;" cx="232" cy="162" rx="20" ry="5"/>

                        <!-- ── the app window ─────────────────────────────── -->
                        <g class="qs-node" style="--d: .18s;">
                          <rect class="fill-primary-900" x="40" y="24" width="184" height="128" rx="9"/>
                          <rect class="fill-white" x="40" y="40" width="184" height="112" rx="9"/>
                          <rect class="fill-white" x="40" y="40" width="184" height="10"/>
                        </g>
                        <circle class="qs-node fill-red-500" style="--d: .34s;" cx="51" cy="32" r="2.6"/>
                        <circle class="qs-node fill-orange-400" style="--d: .39s;" cx="59" cy="32" r="2.6"/>
                        <circle class="qs-node fill-green-400" style="--d: .44s;" cx="67" cy="32" r="2.6"/>

                        <!-- left column: the member and their rows -->
                        <g class="qs-node" style="--d: .52s;">
                          <circle class="fill-primary-100" cx="59" cy="66" r="10"/>
                          <circle class="fill-primary-700" cx="59" cy="63" r="3.4"/>
                          <path class="fill-primary-700" d="M53.4 72.6a5.9 5.9 0 0 1 11.2 0Z"/>
                        </g>
                        <rect class="qs-node fill-primary-500" style="--d: .62s;" x="49" y="84"  width="20" height="5" rx="2.5"/>
                        <rect class="qs-node fill-primary-200" style="--d: .68s;" x="49" y="93"  width="20" height="5" rx="2.5"/>
                        <rect class="qs-node fill-primary-200" style="--d: .74s;" x="49" y="102" width="20" height="5" rx="2.5"/>

                        <!-- ── the chart ──────────────────────────────────── -->
                        <path class="qs-draw stroke-gray-200" style="--len: 72; --d: .6s;" d="M84 60 V132" stroke-width="1.5" stroke-linecap="round"/>
                        <path class="qs-draw stroke-gray-200" style="--len: 124; --d: .7s;" d="M84 132 H208" stroke-width="1.5" stroke-linecap="round"/>

                        <!-- bars grow from the axis, then the trend lines draw over them -->
                        <rect class="qs-grow fill-primary-50" style="--d: .9s;"  x="92"  y="106" width="9" height="26" rx="2"/>
                        <rect class="qs-grow fill-primary-50" style="--d: .98s;" x="112" y="92"  width="9" height="40" rx="2"/>
                        <rect class="qs-grow fill-primary-50" style="--d: 1.06s;" x="132" y="98" width="9" height="34" rx="2"/>
                        <rect class="qs-grow fill-primary-50" style="--d: 1.14s;" x="152" y="78" width="9" height="54" rx="2"/>
                        <rect class="qs-grow fill-primary-50" style="--d: 1.22s;" x="172" y="86" width="9" height="46" rx="2"/>
                        <rect class="qs-grow fill-primary-100" style="--d: 1.3s;"  x="192" y="66" width="9" height="66" rx="2"/>

                        <path class="qs-draw stroke-primary-700" style="--len: 132; --d: 1.15s;"
                              d="M96 112 L116 98 L136 104 L156 84 L176 92 L196 72"
                              stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
                        <path class="qs-draw stroke-primary-500" style="--len: 132; --d: 1.35s;"
                              d="M96 122 L116 116 L136 120 L156 108 L176 112 L196 100"
                              stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
                        <path class="qs-draw stroke-green-400" style="--len: 132; --d: 1.55s;"
                              d="M96 126 L116 124 L136 128 L156 122 L176 120 L196 116"
                              stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>

                        <!-- the head of the trend, last -->
                        <circle class="qs-node fill-white stroke-primary-700" style="--d: 1.75s;" cx="196" cy="72" r="4" stroke-width="2.4"/>

                        <!-- ── satellites: they drift, so the scene keeps breathing ── -->
                        <g class="qs-float" style="--d: .2s;">
                          <g class="qs-node" style="--d: 1.5s;">
                            <rect class="fill-primary-100" x="212" y="18" width="46" height="34" rx="6"/>
                            <rect class="fill-primary-700" x="218" y="25" width="26" height="4" rx="2"/>
                            <rect class="fill-primary-200" x="218" y="33" width="34" height="3" rx="1.5"/>
                            <rect class="fill-primary-200" x="218" y="40" width="30" height="3" rx="1.5"/>
                          </g>
                        </g>

                        <g class="qs-float" style="--d: 1.4s;">
                          <g class="qs-node" style="--d: 1.62s;">
                            <path class="fill-primary-900" d="M6 46h30a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H18l-7 7v-7H6a6 6 0 0 1-6-6V52a6 6 0 0 1 6-6Z"/>
                            <circle class="qs-blink fill-white" style="--d: 0s;"   cx="14" cy="59" r="2.4"/>
                            <circle class="qs-blink fill-white" style="--d: .2s;"  cx="21" cy="59" r="2.4"/>
                            <circle class="qs-blink fill-white" style="--d: .4s;"  cx="28" cy="59" r="2.4"/>
                          </g>
                        </g>

                        <!-- ── the plant, for the same reason it is in every one
                                 of these illustrations: it makes the frame a place -->
                        <g class="qs-node" style="--d: 1.8s;">
                          <path class="fill-green-400" d="M232 136c-9-3-13-11-12-20 8 1 13 8 12 20Z"/>
                          <path class="fill-green-500" d="M234 136c8-4 11-12 9-21-8 2-12 10-9 21Z"/>
                          <path class="stroke-green-700" d="M233 122v18" stroke-width="1.6" stroke-linecap="round"/>
                          <path class="fill-primary-900" d="M223 138h20l-2.4 16a2 2 0 0 1-2 1.8h-11.2a2 2 0 0 1-2-1.8L223 138Z"/>
                        </g>
                      </svg></div>
      <div class="v2-copy">
        <h2>Your organization is all set</h2>
        <p>You created it when you signed up &mdash; every step below builds on it.</p>
        <button type="button" class="btn btn-primary" data-resume>${nextStep() ? `Start with: ${esc(nextStep().label)}` : 'Go to dashboard'}</button>
      </div>
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
    case 'project-setup': return renderProjectSetup(s);
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
    </div>
  `;
}

function renderPane() {
  const el = document.getElementById('pane');
  if (!el) return;
  el.innerHTML = renderPaneBody(activeStep());
  fitCo();
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

/* V5 welcome — Figma "step-1-welcome-screen" (AR0219 node 10113:293). Same markup
   and coordinates as the Kit's V5 block (stage 872x611, design coords shifted up by
   the removed logo's 98px), scaled DOWN to fit by fitWelcome(). No auto-advance:
   "Get started" enters the checklist. Below 768px a short stacked version shows. */
const W5_DAYS = [
  { day: 'Mon, Aug 20', fill: 72, t: '7:25', p: '51%', c: 'g' }, { day: 'Tue, Aug 21', fill: 72, t: '8:01', p: '66%', c: 'g' },
  { day: 'Wed, Aug 22', fill: 48, t: '6:40', p: '36%', c: 'o' }, { day: 'Thu, Aug 23', fill: 0 },
  { day: 'Fri, Aug 24', fill: 96, t: '8:18', p: '71%', c: 'g' }, { day: 'Sat, Aug 25', fill: 0 }, { day: 'Sun, Aug 26', fill: 0 },
];
const W5 = 'assets/v5-welcome/';
function renderWelcome() {
  const copy = `In just a few minutes, you’ll have clear visibility into your team’s work — without constant check-ins. Built for teams with <b>virtual assistants</b>, <b>contractors</b>, and <b>remote employees</b>.`;
  return `
    <div class="w5-root">
      <div class="w5-bg" aria-hidden="true">
        <img src="${W5}62d8d.svg" alt="" style="width:2272px;height:1448px;left:calc(50% - 352px - 1136px);top:-724px;transform:rotate(180deg)">
        <img src="${W5}eb73a.svg" alt="" style="width:1648px;height:1105px;left:calc(50% - 1014px - 824px);top:-532px;transform:rotate(180deg)">
        <img src="${W5}79dc8.svg" alt="" style="width:1648px;height:1448px;left:calc(50% + 912px - 824px);top:80px;transform:rotate(180deg)">
      </div>
      <div class="w5-fit" id="w5-fit"><div class="w5-stage" id="w5-stage"><div class="w5-shift">
        <div class="w5-copy v5-rise" style="--d:0ms"><h1>Manage your team without micromanaging.</h1><p>${copy}</p></div>
        <div aria-hidden="true">
          <img class="w5-abs v5-dots" src="${W5}b5dea.svg" alt="" style="left:0;top:352px;width:80px;height:80px;--d:0s">
          <img class="w5-abs v5-dots" src="${W5}b5dea.svg" alt="" style="left:762px;top:479px;width:80px;height:80px;--d:-1.4s">
          <div class="w5-abs w5-week v5-rise" style="--d:150ms;top:272px;left:480px;transform:translateX(-50%)">
            ${W5_DAYS.map((d, i) => `
              <div class="w5-day">
                <p class="w5-date">${d.day}</p>
                <div class="w5-bar"><i class="v5-grow" style="width:${d.fill}px;--d:${500 + i * 90}ms"></i></div>
                <p class="w5-time ${d.t ? 'on' : ''}">${d.t || '0:00'}</p>
                ${d.t ? `<span class="w5-badge ${d.c} v5-pop" style="--d:${800 + i * 90}ms">${d.p}</span>` : '<span class="w5-none">-</span>'}
              </div>`).join('')}
          </div>
          <div class="w5-abs w5-person v5-float-a" style="--d:350ms;left:221px;top:412px">
            <div class="w5-av"><span style="background:linear-gradient(153.9deg,#1cf1d0 19.5%,#0ecb95 90.2%)"><img src="${W5}2b58a.png" alt="" style="left:-3.33%;top:2.9%;width:105.9%;height:107.4%;transform:rotate(-2deg)"></span><img class="st" src="${W5}a141c.svg" alt=""></div>
            <div><p class="nm">Adrian Goia</p><p class="wk"><img src="${W5}e882a.svg" alt=""><span><i>Working on</i> <b>Product Design</b></span></p></div>
          </div>
          <div class="w5-abs w5-person v5-float-b" style="--d:500ms;left:378px;top:510px;width:317px">
            <div class="w5-av"><span style="background:linear-gradient(-7.28deg,#e59e00 1.96%,#ffc600 73.7%)"><img src="${W5}54972.png" alt="" style="left:-0.78%;top:5.43%;width:100.78%;height:102.32%"></span><img class="st" src="${W5}27f90.svg" alt=""></div>
            <div><p class="nm">Madeline Peterson</p><p class="wk"><img src="${W5}2e99e.svg" alt=""><span><i>Not working</i></span></p></div>
          </div>
          <div class="w5-abs w5-thumb v5-float-b" style="--d:650ms;left:60px;top:458px"><img src="${W5}8535c.png" alt=""></div>
          <span class="w5-abs w5-badge g w5-tb v5-pop" style="--d:800ms;left:112px;top:537px">60%</span>
          <div class="w5-abs w5-thumb v5-float-a" style="--d:800ms;left:732px;top:412px"><img src="${W5}c48bb.png" alt=""></div>
          <span class="w5-abs w5-badge g w5-tb v5-pop" style="--d:890ms;left:784px;top:491px">71%</span>
        </div>
        <button type="button" class="btn btn-primary w5-cta v5-rise" style="--d:900ms" data-enter-app>Get started</button>
      </div></div></div>
      <div class="w5-stack">
        <h1>Manage your team without micromanaging.</h1><p>${copy}</p>
        <button type="button" class="btn btn-primary" data-enter-app>Get started</button>
      </div>
    </div>`;
}
function fitWelcome() {
  const fit = document.getElementById('w5-fit'), stage = document.getElementById('w5-stage');
  if (!fit || !stage) return;
  const w = fit.parentElement.clientWidth - 32, h = window.innerHeight - 48 - 44;
  const s = Math.max(0.5, Math.min(1, w / 872, h / 611));
  stage.style.transform = `scale(${s})`;
  fit.style.width = `${872 * s}px`; fit.style.height = `${611 * s}px`;
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
  if (state.stage === 'welcome') { root.innerHTML = renderWelcome(); fitWelcome(); }
  else if (state.stage === 'dashboard') root.innerHTML = renderDashboard();
  else root.innerHTML = allDone() && !state.successSeen ? renderSuccess() : renderApp();
  renderPaymentModal();
  fitCo();
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

  if (t('[data-proj-toggle]')) { const f = t('[data-proj-toggle]').dataset.projToggle; const v = activeStep().values; v[f] = !v[f]; return renderPane(); }
  if (t('[data-dismiss-toast]')) { state.justDone = null; return render(); }
  if (t('[data-enter-app]')) { state.stage = 'app'; return render(); }
  if (t('[data-skip-welcome]')) { state.stage = 'dashboard'; return render(); }
  if (t('[data-start-tracking]')) { state.dash = 'warming'; state.trackedSec = 0; runTracking(); return render(); }
  if (t('[data-show-sample]')) { clearInterval(state.trackTimer); state.sampleData = true; state.dash = 'ready'; return render(); }
  if (t('[data-back-to-checklist]')) { state.stage = 'app'; return render(); }
  if (t('[data-review-setup]')) { state.successSeen = true; return render(); }
  if (t('[data-go-dashboard]')) { state.successSeen = true; state.stage = 'dashboard'; return render(); }
});

document.addEventListener('input', (e) => {
  if (e.target.dataset && e.target.dataset.projField) {
    const s = activeStep(); s.values[e.target.dataset.projField] = e.target.value;
    const btn = document.querySelector('[data-complete="select-projects"]'); if (btn) btn.disabled = !s.values.projectName.trim();
  }
});

document.addEventListener('change', (e) => {
  if (e.target.dataset && e.target.dataset.projSelect) { const st = activeStep(); st.values[e.target.dataset.projSelect] = e.target.value; if (!e.target.value) st.values.clientViewer = false; renderPane(); }
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
      project: 'AR0239 — Get Started checklist (V5)',
      notice: 'Prototype — not a live product',
      note: 'Concept prototype · nothing here is real',
      groups: [{ label: 'Directions', versions: [{ id: 'v5', code: 'V5', el: '#shell-content' }] }],
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


/* Sneak-peek scale-to-fit (Kit: fitCreateOrgPreview). Authored at a fixed 900px and scaled;
   the frame is capped at 520px (styles.css) so it stops growing on wide screens. */
function fitCo() {
  const frame = document.querySelector('.co-frame'); const inner = frame && frame.querySelector('.co-inner');
  if (!frame || !inner) return;
  inner.style.transform = 'none';
  const w = inner.offsetWidth, h = inner.offsetHeight; if (!w || !h) return;
  const scale = frame.clientWidth / w;
  inner.style.transform = `scale(${scale})`;
  frame.style.height = `${h * scale}px`;
}
window.addEventListener('resize', () => { fitCo(); fitWelcome(); });
