/* ==========================================================================
   AR0226 — Member Switcher prototype: interaction logic
   Pure client-side state over data.js's mock roster. No backend — this is
   a UX prototype, not a wired feature.
   ========================================================================== */

const state = JSON.parse(JSON.stringify(INITIAL_STATE));
const RECENT_LIMIT = 4;
const BASE_WEEK_START = new Date(2026, 1, 2); // Mon, Feb 2, 2026 — matches the source screenshot

const els = {
  pillRow: document.getElementById("pill-row"),
  pinCounter: document.getElementById("pin-counter"),
  searchPanel: document.getElementById("search-panel"),
  searchInput: document.getElementById("search-input"),
  recentList: document.getElementById("recent-list"),
  allList: document.getElementById("all-list"),
  recentSection: document.getElementById("recent-section"),
  main: document.getElementById("dashboard-main"),
  pageRange: document.getElementById("page-range"),
  dateBtn: document.getElementById("date-btn"),
  dateBtnLabel: document.getElementById("date-btn-label"),
  datePopover: document.getElementById("date-popover"),
  calMonthLabel: document.getElementById("cal-month-label"),
  calGrid: document.getElementById("cal-grid"),
};

function pinnedIds() {
  return state.pinned;
}

function avatarHTML(member, size = 32) {
  return `<span class="avatar" style="width:${size}px;height:${size}px;background:${avatarGradient(member.name)};font-size:${Math.round(size * 0.38)}px">${initials(member.name)}</span>`;
}

function badgeHTML() {
  return `<span class="pin-badge" title="Pinned" aria-label="Pinned"><span class="material-symbols-rounded" aria-hidden="true">push_pin</span></span>`;
}

function flagLabel(flag) {
  if (flag === "highly-unusual") return `<span class="daychip__flag daychip__flag--high" title="Highly unusual activity">!</span>`;
  if (flag === "unusual") return `<span class="daychip__flag daychip__flag--mid" title="Unusual activity">!</span>`;
  return "";
}

/* ── Week / date range ────────────────────────────────────────────────── */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function currentWeekStart() {
  const d = new Date(BASE_WEEK_START);
  d.setDate(d.getDate() + state.weekOffset * 7);
  return d;
}
function weekEnd(start) {
  const d = new Date(start);
  d.setDate(d.getDate() + 6);
  return d;
}
function shortRange(start) {
  const end = weekEnd(start);
  const sameMonth = start.getMonth() === end.getMonth();
  return sameMonth
    ? `${MONTHS[start.getMonth()]} ${start.getDate()} – ${end.getDate()}`
    : `${MONTHS[start.getMonth()]} ${start.getDate()} – ${MONTHS[end.getMonth()]} ${end.getDate()}`;
}
function longRange(start) {
  const end = weekEnd(start);
  return `${WEEKDAYS_SHORT[start.getDay()]}, ${MONTHS[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()} – ${WEEKDAYS_SHORT[end.getDay()]}, ${MONTHS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
}
function weekdayLabel(start, dayIndex) {
  const d = new Date(start);
  d.setDate(d.getDate() + dayIndex);
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function renderDateRange() {
  const start = currentWeekStart();
  els.pageRange.textContent = longRange(start);
  els.dateBtnLabel.textContent = shortRange(start);
}

// Which month the mini-calendar is currently showing — independent of the
// selected week, so browsing months doesn't change your selection until
// you actually click a day. Starts on the selected week's month.
let calViewMonth = new Date(currentWeekStart().getFullYear(), currentWeekStart().getMonth(), 1);

function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}
function mondayOf(date) {
  const d = new Date(date);
  const mondayIndex = (d.getDay() + 6) % 7; // Mon=0 ... Sun=6
  d.setDate(d.getDate() - mondayIndex);
  return d;
}
function renderCalendar() {
  els.calMonthLabel.textContent = `${["January","February","March","April","May","June","July","August","September","October","November","December"][calViewMonth.getMonth()]} ${calViewMonth.getFullYear()}`;

  const firstOfMonth = new Date(calViewMonth.getFullYear(), calViewMonth.getMonth(), 1);
  const gridStart = mondayOf(firstOfMonth);
  const selectedWeekStart = currentWeekStart();
  const selectedWeekEnd = weekEnd(selectedWeekStart);

  // Always render a fixed 6-week (42-cell) grid — simplest, standard, no
  // edge-case math for months that need 4 vs 5 vs 6 rows.
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    const inSelectedWeek = d >= selectedWeekStart && d <= selectedWeekEnd;
    const outsideMonth = d.getMonth() !== calViewMonth.getMonth();
    cells.push(`<button type="button" class="cal-day ${outsideMonth ? "is-outside" : ""} ${inSelectedWeek ? "is-selected-week" : ""}" data-date="${d.toISOString()}" data-row="${Math.floor(i / 7)}">${d.getDate()}</button>`);
  }
  els.calGrid.innerHTML = cells.join("");
}

function openDatePopover() {
  calViewMonth = new Date(currentWeekStart().getFullYear(), currentWeekStart().getMonth(), 1);
  renderCalendar();
  els.datePopover.hidden = false;
  document.addEventListener("click", onOutsideDateClick, { capture: true });
}
function closeDatePopover() {
  els.datePopover.hidden = true;
  document.removeEventListener("click", onOutsideDateClick, { capture: true });
}
function onOutsideDateClick(e) {
  if (!els.datePopover.contains(e.target) && !e.target.closest("#date-btn")) closeDatePopover();
}

els.dateBtn.addEventListener("click", () => {
  els.datePopover.hidden ? openDatePopover() : closeDatePopover();
});
document.getElementById("cal-prev-month").addEventListener("click", () => {
  calViewMonth = new Date(calViewMonth.getFullYear(), calViewMonth.getMonth() - 1, 1);
  renderCalendar();
});
document.getElementById("cal-next-month").addEventListener("click", () => {
  calViewMonth = new Date(calViewMonth.getFullYear(), calViewMonth.getMonth() + 1, 1);
  renderCalendar();
});
document.getElementById("date-today").addEventListener("click", () => {
  state.weekOffset = 0;
  renderDateRange();
  renderMain();
  closeDatePopover();
});

els.calGrid.addEventListener("click", (e) => {
  const cell = e.target.closest(".cal-day");
  if (!cell) return;
  const clicked = new Date(cell.dataset.date);
  const clickedMonday = mondayOf(clicked);
  state.weekOffset = Math.round(daysBetween(mondayOf(BASE_WEEK_START), clickedMonday) / 7);
  renderDateRange();
  renderMain();
  closeDatePopover();
});

els.calGrid.addEventListener("mouseover", (e) => {
  const cell = e.target.closest(".cal-day");
  if (!cell) return;
  const row = cell.dataset.row;
  els.calGrid.querySelectorAll(".cal-day").forEach((c) => c.classList.toggle("is-hover-week", c.dataset.row === row));
});
els.calGrid.addEventListener("mouseleave", () => {
  els.calGrid.querySelectorAll(".is-hover-week").forEach((c) => c.classList.remove("is-hover-week"));
});

/* ── Pill row ─────────────────────────────────────────────────────────── */

function renderPills() {
  const pins = pinnedIds();
  els.pillRow.innerHTML = "";

  if (pins.length === 0) {
    const empty = document.createElement("button");
    empty.type = "button";
    empty.id = "search-toggle";
    empty.className = "pill pill--prompt";
    empty.innerHTML = `<span class="material-symbols-rounded" aria-hidden="true">add</span> Pin your team →`;
    els.pillRow.appendChild(empty);
  } else {
    pins.forEach((id) => {
      const member = MEMBERS[id];
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "pill" + (id === state.selectedId && !state.compareMode ? " is-selected" : "");
      pill.setAttribute("aria-pressed", id === state.selectedId ? "true" : "false");
      pill.innerHTML = `
        <span class="pill__avatar-wrap">
          ${avatarHTML(member, 28)}
          ${badgeHTML()}
        </span>
        <span class="pill__name">${member.name}</span>
        <span class="pill__unpin material-symbols-rounded" aria-hidden="true" title="Unpin ${member.name}">close</span>
      `;
      pill.addEventListener("click", (e) => {
        if (e.target.closest(".pill__unpin")) {
          setPinned(id, false);
          return;
        }
        selectMember(id);
      });
      els.pillRow.appendChild(pill);
    });

    // "+" lives inside the scrollable row, right after the last avatar pill —
    // a standard chip-list pattern. Click handled via document delegation
    // below (togglable, no per-render rebinding needed).
    const addPill = document.createElement("button");
    addPill.type = "button";
    addPill.id = "search-toggle";
    addPill.className = "pill pill--add";
    addPill.setAttribute("aria-label", "Search for a member");
    addPill.innerHTML = `<span class="material-symbols-rounded" aria-hidden="true">add</span>`;
    els.pillRow.appendChild(addPill);
  }

  els.pinCounter.textContent = `${pins.length}/${PIN_LIMIT} pinned`;
  els.pinCounter.classList.toggle("is-full", pins.length >= PIN_LIMIT);
}

/* ── Search panel ─────────────────────────────────────────────────────── */

function memberRowHTML(id) {
  const member = MEMBERS[id];
  const isPinned = state.pinned.includes(id);
  const atLimit = !isPinned && state.pinned.length >= PIN_LIMIT;
  return `
    <li class="member-row" data-id="${id}">
      ${avatarHTML(member, 32)}
      <span class="member-row__text">
        <span class="member-row__name">${member.name}</span>
        <span class="member-row__role">${member.role}</span>
      </span>
      <button type="button" class="pin-toggle ${isPinned ? "is-active" : ""}" data-id="${id}"
        ${atLimit ? "disabled" : ""}
        title="${atLimit ? `Pin limit reached (${PIN_LIMIT}/${PIN_LIMIT}) — unpin someone first` : isPinned ? "Unpin" : "Pin"}"
        aria-pressed="${isPinned}">
        <span class="material-symbols-rounded" aria-hidden="true">push_pin</span>
      </button>
    </li>
  `;
}

function renderSearchLists(query) {
  const q = query.trim().toLowerCase();

  const atLimit = state.pinned.length >= PIN_LIMIT;
  const limitBanner = atLimit
    ? `<p class="search-panel__banner">You've pinned the max of ${PIN_LIMIT} — unpin someone to add another.</p>`
    : "";

  const recentIds = state.recent.filter((id) => !q || MEMBERS[id].name.toLowerCase().includes(q));
  els.recentSection.hidden = recentIds.length === 0;
  els.recentList.innerHTML = recentIds.map(memberRowHTML).join("");

  const allIds = Object.keys(MEMBERS)
    .filter((id) => !q || MEMBERS[id].name.toLowerCase().includes(q))
    .sort((a, b) => MEMBERS[a].name.localeCompare(MEMBERS[b].name));
  els.allList.innerHTML =
    limitBanner +
    (allIds.length ? allIds.map(memberRowHTML).join("") : `<li class="member-row member-row--empty">No members match "${query}"</li>`);
}

// The "+" chip lives inside #pill-row's horizontal scroll container, so a
// CSS-relative anchor would get clipped by that container's overflow. Instead,
// compute the chip's live viewport position on open and position the panel
// with `position: fixed` to those coordinates — works regardless of where the
// chip currently sits in the scrolled row.
function positionSearchPanel() {
  const trigger = document.getElementById("search-toggle");
  if (!trigger) return;
  const rect = trigger.getBoundingClientRect();
  const panelWidth = els.searchPanel.offsetWidth || 320;
  const left = Math.min(rect.left, window.innerWidth - panelWidth - 12);
  els.searchPanel.style.top = `${rect.bottom + 8}px`;
  els.searchPanel.style.left = `${Math.max(12, left)}px`;
}

function openSearch() {
  els.searchPanel.hidden = false;
  positionSearchPanel();
  els.searchInput.value = "";
  renderSearchLists("");
  els.searchInput.focus();
  document.addEventListener("click", onOutsideSearchClick, { capture: true });
}
function closeSearch() {
  els.searchPanel.hidden = true;
  document.removeEventListener("click", onOutsideSearchClick, { capture: true });
}
function toggleSearch() {
  els.searchPanel.hidden ? openSearch() : closeSearch();
}
function onOutsideSearchClick(e) {
  if (!els.searchPanel.contains(e.target) && !e.target.closest("#search-toggle")) closeSearch();
}

els.searchInput?.addEventListener("input", (e) => renderSearchLists(e.target.value));

document.addEventListener("click", (e) => {
  const searchToggleBtn = e.target.closest("#search-toggle");
  if (searchToggleBtn) {
    toggleSearch();
    return;
  }

  const compareBtn = e.target.closest("#compare-toggle");
  if (compareBtn) {
    setCompareMode(!state.compareMode);
    return;
  }

  const pinBtn = e.target.closest(".pin-toggle");
  if (pinBtn) {
    e.stopPropagation();
    if (pinBtn.disabled) return;
    const id = pinBtn.dataset.id;
    setPinned(id, !state.pinned.includes(id));
    renderSearchLists(els.searchInput.value);
    return;
  }

  const row = e.target.closest(".member-row");
  if (row) {
    selectMember(row.dataset.id);
    closeSearch();
  }
});

/* ── State mutations ─────────────────────────────────────────────────── */

function addRecent(id) {
  state.recent = [id, ...state.recent.filter((x) => x !== id)].slice(0, RECENT_LIMIT);
}

function setPinned(id, shouldPin) {
  const already = state.pinned.includes(id);
  if (shouldPin) {
    if (already || state.pinned.length >= PIN_LIMIT) return;
    state.pinned.push(id);
  } else {
    if (!already) return;
    state.pinned = state.pinned.filter((x) => x !== id);
  }
  renderPills();
  if (state.compareMode) renderMain();
}

function selectMember(id) {
  state.selectedId = id;
  state.compareMode = false;
  if (!state.pinned.includes(id)) addRecent(id);
  renderPills();
  renderMain();
}

function setCompareMode(on) {
  state.compareMode = on;
  renderPills();
  renderMain();
}

/* ── Main content: single-person view ────────────────────────────────── */

function activityStripHTML(member) {
  const start = currentWeekStart();
  return member.week
    .map(
      (d, i) => `
    <div class="daychip ${d.pct == null ? "daychip--off" : ""}">
      <div class="daychip__flags">${flagLabel(d.flag)}</div>
      <p class="daychip__day">${weekdayLabel(start, i)}</p>
      <div class="daychip__bar"><span style="width:${d.pct ?? 0}%"></span></div>
      <p class="daychip__hours">${d.hours ?? "0:00"}</p>
      ${d.pct != null ? `<span class="daychip__pct">${d.pct}%</span>` : `<span class="daychip__pct daychip__pct--muted">-</span>`}
      ${d.screenshots ? `<p class="daychip__shots">${d.screenshots} screenshots</p>` : ""}
    </div>`
    )
    .join("");
}

function breakdownListHTML(rows) {
  return rows
    .map(
      (r) => `
    <div class="breakdown-row">
      <span class="breakdown-row__name">${r.name}</span>
      <span class="breakdown-row__time">${r.time}</span>
      <div class="breakdown-row__bar"><span style="width:${r.pct}%"></span></div>
    </div>`
    )
    .join("");
}

function unusualHTML(member) {
  const u = member.unusual;
  if (u.highlyUnusual === 0 && u.unusual === 0) {
    return `<p class="unusual-clean"><span class="material-symbols-rounded" aria-hidden="true">check_circle</span> No unusual activity this week.</p>`;
  }
  return `
    <div class="unusual-counts">
      <div class="unusual-count unusual-count--high"><span>${u.highlyUnusual}</span><p>Highly unusual</p></div>
      <div class="unusual-count unusual-count--mid"><span>${u.unusual}</span><p>Unusual</p></div>
    </div>
    ${u.details
      .map(
        (d) => `
      <div class="unusual-detail">
        <span class="unusual-tag unusual-tag--${d.level === "highly-unusual" ? "high" : "mid"}">${d.level === "highly-unusual" ? "Highly unusual" : "Unusual"}</span>
        <p>${d.text}</p>
      </div>`
      )
      .join("")}
  `;
}

function manualTimeHTML(rows) {
  if (!rows.length) return `<p class="manual-empty">No manual time entries this week.</p>`;
  return `
    <table class="manual-table">
      <thead><tr><th>Date</th><th>Project</th><th>Action</th><th>Time</th></tr></thead>
      <tbody>
        ${rows
          .map(
            (r) => `<tr>
          <td>${r.date}</td><td>${r.project}</td>
          <td><span class="manual-action manual-action--${r.action.toLowerCase()}">${r.action}</span></td>
          <td>${r.time}</td>
        </tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function compareToggleHTML() {
  return `
    <button type="button" class="compare-toggle ${state.compareMode ? "is-on" : ""}" id="compare-toggle" aria-pressed="${state.compareMode}" aria-label="Toggle compare view">
      <span class="material-symbols-rounded" aria-hidden="true">grid_view</span>
      Compare view
    </button>
  `;
}

function renderSingleView(id) {
  const m = MEMBERS[id];
  els.main.innerHTML = `
    <div class="profile-card">
      <div class="profile-card__identity">
        ${avatarHTML(m, 56)}
        <div class="profile-card__text">
          <h2>${m.name}</h2>
          <p><span class="status-dot"></span>${m.status}</p>
        </div>
      </div>
      ${compareToggleHTML()}
    </div>

    <div class="stat-row">
      <div class="stat-card"><p class="stat-card__label">Total work time</p><p class="stat-card__value">${m.workTime}</p></div>
      <div class="stat-card"><p class="stat-card__label">Avg. activity</p><p class="stat-card__value stat-card__value--activity">${m.avgActivity}%</p></div>
      <div class="stat-card stat-card--idle"><p class="stat-card__label">Idle time</p><p class="stat-card__value">${m.idleTime}</p></div>
    </div>

    <section class="panel">
      <h3 class="panel__title">Time &amp; activity</h3>
      <div class="activity-strip">${activityStripHTML(m)}</div>
    </section>

    <div class="panel-grid">
      <section class="panel">
        <h3 class="panel__title">Project breakdown</h3>
        ${breakdownListHTML(m.projects)}
      </section>
      <section class="panel">
        <h3 class="panel__title">Apps &amp; URLs</h3>
        ${breakdownListHTML(m.apps)}
      </section>
    </div>

    <div class="panel-grid">
      <section class="panel">
        <h3 class="panel__title">Unusual activity details</h3>
        ${unusualHTML(m)}
      </section>
      <section class="panel">
        <h3 class="panel__title">Manual time</h3>
        ${manualTimeHTML(m.manualTime)}
      </section>
    </div>
  `;
}

/* ── Main content: compare / scan view (UC2) ─────────────────────────── */

function renderCompareView() {
  const ids = pinnedIds();
  if (ids.length === 0) {
    els.main.innerHTML = `
      <div class="profile-card profile-card--empty">
        <h2 class="panel__title panel__title--compare">Nobody pinned yet</h2>
        ${compareToggleHTML()}
      </div>
      <p class="compare-empty">Pin a few people to compare them here.</p>
    `;
    return;
  }
  els.main.innerHTML = `
    <div class="profile-card">
      <h2 class="panel__title panel__title--compare">Comparing ${ids.length} pinned member${ids.length === 1 ? "" : "s"}</h2>
      ${compareToggleHTML()}
    </div>
    <div class="compare-grid">
      ${ids
        .map((id) => {
          const m = MEMBERS[id];
          const flagged = m.week.some((d) => d.flag);
          return `
        <button type="button" class="mini-card" data-id="${id}">
          ${avatarHTML(m, 40)}
          <span class="mini-card__name">${m.name}</span>
          <span class="mini-card__role">${m.role}</span>
          <span class="mini-card__stats">
            <span><strong>${m.avgActivity}%</strong> activity</span>
            <span><strong>${m.workTime}</strong> this week</span>
          </span>
          ${flagged ? `<span class="mini-card__flag">Unusual activity</span>` : ""}
        </button>`;
        })
        .join("")}
    </div>
  `;
  els.main.querySelectorAll(".mini-card").forEach((card) =>
    card.addEventListener("click", () => selectMember(card.dataset.id))
  );
}

function renderMain() {
  if (state.compareMode) renderCompareView();
  else renderSingleView(state.selectedId);
}

/* ── Init ─────────────────────────────────────────────────────────────── */

renderDateRange();
renderPills();
renderMain();
