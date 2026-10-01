/* AR0239 — Member dashboard sneak-peek (standalone copy)
   Vanilla JS port of the Kit version (product/squads/growth/experiments/
   AR0239/dashboard-sneak-peek/) — same data, same autoplay/tooltip/reveal
   behavior, no Alpine (this repo's prototypes are plain HTML/CSS/JS, no
   build step). Render is a full innerHTML rebuild of #app on every state
   change rather than a reactive diff — simpler to keep correct by hand for
   a component this size, and the state changes are infrequent (timer-paced,
   not per-frame). */

const MEMBERS = [
  { name: 'Dana Whitfield', initials: 'DW', color: '#0168dd', workingOn: 'Website redesign',
    totalWorkTime: '7:40:12', avgActivity: 82, idleTime: '0:22:05', manualTime: '0:00:00',
    weekly: [
      { day: 'Mon', date: 'Sep 22', hours: '1:18:40', pct: 84, screenshots: 9 },
      { day: 'Tue', date: 'Sep 23', hours: '1:24:10', pct: 88, screenshots: 10 },
      { day: 'Wed', date: 'Sep 24', hours: '1:10:55', pct: 79, screenshots: 8 },
      { day: 'Thu', date: 'Sep 25', hours: '0:38:20', pct: 24, screenshots: 3 },
      { day: 'Fri', date: 'Sep 26', hours: '1:29:50', pct: 91, screenshots: 11 },
      { day: 'Sat', date: 'Sep 27', hours: '0:00:00', pct: null, screenshots: 0 },
      { day: 'Sun', date: 'Sep 28', hours: '0:00:00', pct: null, screenshots: 0 },
    ] },
  { name: 'Marcus Reyes', initials: 'MR', color: '#31c48d', workingOn: 'Mobile app',
    totalWorkTime: '6:05:30', avgActivity: 64, idleTime: '0:41:18', manualTime: '0:15:00',
    weekly: [
      { day: 'Mon', date: 'Sep 22', hours: '1:05:10', pct: 68, screenshots: 7 },
      { day: 'Tue', date: 'Sep 23', hours: '0:58:45', pct: 61, screenshots: 6 },
      { day: 'Wed', date: 'Sep 24', hours: '1:12:20', pct: 70, screenshots: 8 },
      { day: 'Thu', date: 'Sep 25', hours: '0:52:05', pct: 57, screenshots: 5 },
      { day: 'Fri', date: 'Sep 26', hours: '0:29:10', pct: 19, screenshots: 2 },
      { day: 'Sat', date: 'Sep 27', hours: '1:28:20', pct: 73, screenshots: 9 },
      { day: 'Sun', date: 'Sep 28', hours: '0:00:00', pct: null, screenshots: 0 },
    ] },
  { name: 'Priya Anand', initials: 'PA', color: '#9061f9', workingOn: 'Client onboarding',
    totalWorkTime: '6:52:45', avgActivity: 71, idleTime: '0:33:52', manualTime: '0:00:00',
    weekly: [
      { day: 'Mon', date: 'Sep 22', hours: '1:11:30', pct: 74, screenshots: 8 },
      { day: 'Tue', date: 'Sep 23', hours: '1:02:15', pct: 69, screenshots: 7 },
      { day: 'Wed', date: 'Sep 24', hours: '0:24:40', pct: 22, screenshots: 3 },
      { day: 'Thu', date: 'Sep 25', hours: '1:18:05', pct: 80, screenshots: 9 },
      { day: 'Fri', date: 'Sep 26', hours: '1:09:50', pct: 76, screenshots: 8 },
      { day: 'Sat', date: 'Sep 27', hours: '1:06:25', pct: 68, screenshots: 7 },
      { day: 'Sun', date: 'Sep 28', hours: '0:00:00', pct: null, screenshots: 0 },
    ] },
  { name: 'Tom Okafor', initials: 'TO', color: '#e3a008', workingOn: 'Support tickets',
    totalWorkTime: '5:20:10', avgActivity: 58, idleTime: '0:48:30', manualTime: '0:30:00',
    weekly: [
      { day: 'Mon', date: 'Sep 22', hours: '0:51:20', pct: 55, screenshots: 5 },
      { day: 'Tue', date: 'Sep 23', hours: '0:18:10', pct: 17, screenshots: 2 },
      { day: 'Wed', date: 'Sep 24', hours: '0:47:35', pct: 60, screenshots: 5 },
      { day: 'Thu', date: 'Sep 25', hours: '0:55:05', pct: 63, screenshots: 6 },
      { day: 'Fri', date: 'Sep 26', hours: '0:49:20', pct: 59, screenshots: 5 },
      { day: 'Sat', date: 'Sep 27', hours: '0:38:40', pct: 51, screenshots: 4 },
      { day: 'Sun', date: 'Sep 28', hours: '0:00:00', pct: null, screenshots: 0 },
    ] },
  { name: 'Lena Fischer', initials: 'LF', color: '#c81e1e', workingOn: 'Content production',
    totalWorkTime: '7:05:20', avgActivity: 77, idleTime: '0:27:10', manualTime: '0:00:00',
    weekly: [
      { day: 'Mon', date: 'Sep 22', hours: '1:15:40', pct: 81, screenshots: 9 },
      { day: 'Tue', date: 'Sep 23', hours: '1:08:55', pct: 75, screenshots: 8 },
      { day: 'Wed', date: 'Sep 24', hours: '1:11:10', pct: 78, screenshots: 8 },
      { day: 'Thu', date: 'Sep 25', hours: '0:33:15', pct: 26, screenshots: 3 },
      { day: 'Fri', date: 'Sep 26', hours: '1:19:30', pct: 84, screenshots: 9 },
      { day: 'Sat', date: 'Sep 27', hours: '1:16:50', pct: 79, screenshots: 8 },
      { day: 'Sun', date: 'Sep 28', hours: '0:00:00', pct: null, screenshots: 0 },
    ] },
];

const state = {
  selectedId: MEMBERS[0].name,
  phase: 'idle', // 'idle' | 'membersHint' | 'hoverHint' | 'clickHint'
  openDay: null,
  timer: null,
};

function active() { return MEMBERS.find((m) => m.name === state.selectedId) || MEMBERS[0]; }
function firstDataDay() { return active().weekly.find((d) => d.pct !== null) || null; }
function band(pct) {
  if (pct === null) return 'empty';
  if (pct < 30) return 'red';
  if (pct < 60) return 'yellow';
  return 'green';
}
function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function renderPills() {
  const m = active();
  return `
    <div class="callout above ${state.phase === 'membersHint' ? 'is-visible' : ''}">View other members</div>
    ${MEMBERS.map((row) => `
      <button type="button" class="member-pill ${row.name === state.selectedId ? 'is-active' : ''}" data-select="${esc(row.name)}">
        <span class="avatar" style="background:${row.color}">${esc(row.initials)}</span>
        <span class="name">${esc(row.name)}</span>
      </button>
    `).join('')}
  `;
}

function renderProfile() {
  const m = active();
  const metrics = [
    { icon: 'timer', label: 'Total work time', value: m.totalWorkTime },
    { icon: 'show_chart', label: 'Avg. activity', value: `${m.avgActivity}%` },
    { icon: 'dark_mode', label: 'Idle time', value: m.idleTime },
    { icon: 'history', label: 'Manual time', value: m.manualTime },
  ];
  return `
    <div class="profile-row">
      <div class="profile-id">
        <span class="avatar" style="background:${m.color}">${esc(m.initials)}</span>
        <div>
          <p class="name">${esc(m.name)}</p>
          <span class="working-on">Working on<b>${esc(m.workingOn)}</b></span>
        </div>
      </div>
      <button type="button" class="btn-outline"><span class="material-symbols-rounded">image</span>View latest screenshot</button>
    </div>
    <div class="metric-grid">
      ${metrics.map((mt) => `
        <div class="metric-card">
          <span class="metric-icon"><span class="material-symbols-rounded">${mt.icon}</span></span>
          <div>
            <p class="metric-label">${esc(mt.label)}</p>
            <p class="metric-value">${esc(mt.value)}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderStrip() {
  const m = active();
  const fdd = firstDataDay();
  const days = m.weekly.map((day) => {
    const isDemoDay = fdd && day.day === fdd.day;
    const b = band(day.pct);
    return `
      <div class="day-cell">
        <div class="callout above ${state.phase === 'hoverHint' && isDemoDay ? 'is-visible' : ''}">Hover to see what happened here</div>
        <div class="callout below ${state.phase === 'clickHint' && isDemoDay ? 'is-visible' : ''}">Click for screenshots</div>
        <button type="button" class="day-btn" data-day="${esc(day.day)}">
          <span class="day-name">${esc(day.day)}</span>
          <span class="bar-track"><span class="bar-fill ${b}" style="width:${day.pct ?? 0}%"></span></span>
          <span class="pct-pill ${b}">${day.pct === null ? '&#8211;' : day.pct + '%'}</span>
          <span class="shot-tile ${day.pct === null ? 'empty' : ''}"><span class="material-symbols-rounded">image</span></span>
          <span class="shot-count">${day.pct === null ? '&#8211;' : day.screenshots + ' screenshots'}</span>
        </button>
      </div>
    `;
  }).join('');
  const openDay = state.openDay;
  return `
    <p class="strip-title">Time &amp; activity</p>
    <div class="day-grid">${days}</div>
    <div class="reveal ${openDay ? 'is-open' : ''}">
      ${openDay ? `<p><b>${esc(openDay.day)}, ${esc(openDay.date)}</b> &mdash; ${esc(openDay.hours)} tracked, ${openDay.screenshots} screenshots</p>` : '<p></p>'}
      <button type="button" class="close-btn" data-close-reveal aria-label="Close"><span class="material-symbols-rounded">close</span></button>
    </div>
  `;
}

function render() {
  document.getElementById('pills').innerHTML = renderPills();
  document.getElementById('profile-card').innerHTML = renderProfile();
  document.getElementById('strip-card').innerHTML = renderStrip();
}

/* ── interaction ──────────────────────────────────────────────────────── */
document.addEventListener('click', (e) => {
  const pill = e.target.closest('[data-select]');
  if (pill) {
    state.phase = 'idle';
    state.selectedId = pill.dataset.select;
    state.openDay = null;
    render();
    return;
  }
  const dayBtn = e.target.closest('[data-day]');
  if (dayBtn) {
    state.phase = 'idle';
    state.openDay = active().weekly.find((d) => d.day === dayBtn.dataset.day) || null;
    render();
    return;
  }
  if (e.target.closest('[data-close-reveal]')) {
    state.openDay = null;
    render();
  }
});

/* ── autoplay — three AR0219 callouts (view other members / hover / click),
   then a real reveal, then advance to the next member, forever. Runs
   continuously since this page's whole job is to demo the interaction, not
   wait for a visitor's cursor. Respects prefers-reduced-motion by skipping
   straight to the reveal instead of holding on each callout. ─────────────── */
const STEP_MS = { toMembersHint: 500, toHoverHint: 1700, toClickHint: 2200, toReveal: 1600, toClose: 2600, toNext: 700 };
const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function runStep(step) {
  clearTimeout(state.timer);
  if (reducedMotion && (step === 'toMembersHint' || step === 'toHoverHint' || step === 'toClickHint')) step = 'toReveal';
  state.timer = setTimeout(() => {
    switch (step) {
      case 'toMembersHint': state.phase = 'membersHint'; render(); runStep('toHoverHint'); break;
      case 'toHoverHint': state.phase = 'hoverHint'; render(); runStep('toClickHint'); break;
      case 'toClickHint': state.phase = 'clickHint'; render(); runStep('toReveal'); break;
      case 'toReveal': state.phase = 'idle'; state.openDay = firstDataDay(); render(); runStep('toClose'); break;
      case 'toClose': state.openDay = null; render(); runStep('toNext'); break;
      case 'toNext': {
        const i = MEMBERS.findIndex((m) => m.name === state.selectedId);
        state.selectedId = MEMBERS[(i + 1) % MEMBERS.length].name;
        render();
        runStep('toMembersHint');
        break;
      }
    }
  }, STEP_MS[step]);
}

render();
runStep('toMembersHint');
