/* ==========================================================================
   AR0226 — Member Switcher prototype: mock roster data
   Numbers for Adrian Goia are pulled directly from the real Dashboard
   screenshot this pattern extends (work time, activity %, unusual-activity
   copy). Everyone else is invented but shaped the same way, so switching
   between people never hits an empty/broken state.
   ========================================================================== */

function initials(name) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

// Deterministic pastel-to-solid gradient per name, so avatars are stable
// across renders without needing photo assets.
const AVATAR_PALETTE = [
  ["#bfabff", "#8b73ff"],
  ["#1cf1d0", "#0ecb95"],
  ["#ffd166", "#f4a418"],
  ["#7fd6ff", "#2aa7ff"],
  ["#ff9b9b", "#ff5f57"],
  ["#b8f2a1", "#4caf50"],
  ["#ffb6e6", "#e05fc4"],
  ["#c7ceff", "#6f7bf7"],
];

function avatarGradient(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const [a, b] = AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
  return `linear-gradient(153deg, ${a} 16%, ${b} 100%)`;
}

// Builds a plausible 5-weekday activity strip (Mon-Fri, index 0-4).
// `overrides` lets story members hand-author specific days (screenshots,
// flags); everyone else gets a believable default shape. Day labels are
// NOT baked in here — they're derived from the currently selected week
// in app.js, so the date picker actually drives what's on screen.
function buildWeek(overrides = {}) {
  return [0, 1, 2, 3, 4].map((i) => ({
    hours: null,
    pct: null,
    screenshots: null,
    flag: null,
    ...overrides[i],
  }));
}

const MEMBERS = {
  "adrian-goia": {
    id: "adrian-goia",
    name: "Adrian Goia",
    role: "Product Designer",
    status: "Working on Product Design",
    workTime: "30:24:43",
    avgActivity: 47,
    idleTime: "02:15:16",
    week: buildWeek({
      0: { hours: "7:25", pct: 51, screenshots: 48 },
      1: { hours: "8:01", pct: 66, screenshots: 76, flag: "highly-unusual" },
      2: { hours: "6:40", pct: 58, screenshots: 57 },
      3: { hours: "0:00", pct: null, screenshots: 0 },
      4: { hours: "8:18", pct: 71, screenshots: 63 },
    }),
    projects: [
      { name: "Client presentations", time: "22:30:00", pct: 78 },
      { name: "Marketing", time: "9:20:00", pct: 32 },
      { name: "Product Design", time: "5:30:00", pct: 19 },
    ],
    apps: [
      { name: "Chrome", time: "22:30:00", pct: 78 },
      { name: "Figma", time: "9:20:00", pct: 32 },
      { name: "Slack", time: "5:30:00", pct: 19 },
    ],
    unusual: {
      highlyUnusual: 1,
      unusual: 1,
      details: [
        { level: "highly-unusual", text: "Activity remained above 95% for over 90 minutes on 7/4/2024." },
      ],
    },
    manualTime: [
      { date: "Aug 21, 2026", project: "Product Design", action: "Add", time: "2:30:00" },
      { date: "Aug 21, 2026", project: "Product Design", action: "Add", time: "2:30:00" },
      { date: "Aug 21, 2026", project: "Product Design", action: "Delete", time: "2:30:00" },
    ],
  },

  "aaron-carter": {
    id: "aaron-carter",
    name: "Aaron Carter",
    role: "Account Executive",
    status: "Working on Client outreach",
    workTime: "34:10:05",
    avgActivity: 62,
    idleTime: "01:05:40",
    week: buildWeek({
      0: { hours: "8:02", pct: 60, screenshots: 41 },
      1: { hours: "7:55", pct: 64, screenshots: 39 },
      2: { hours: "8:20", pct: 59, screenshots: 44 },
      3: { hours: "7:48", pct: 66, screenshots: 38 },
      4: { hours: "2:05", pct: 70, screenshots: 12 },
    }),
    projects: [
      { name: "Client outreach", time: "18:00:00", pct: 53 },
      { name: "Pipeline review", time: "10:30:00", pct: 31 },
      { name: "Onboarding calls", time: "5:40:00", pct: 16 },
    ],
    apps: [
      { name: "Gmail", time: "16:10:00", pct: 47 },
      { name: "Salesforce", time: "12:20:00", pct: 36 },
      { name: "Zoom", time: "5:40:00", pct: 17 },
    ],
    unusual: { highlyUnusual: 0, unusual: 0, details: [] },
    manualTime: [],
  },

  "david-edwards": {
    id: "david-edwards",
    name: "David Edwards",
    role: "Support Lead",
    status: "Working on Ticket triage",
    workTime: "29:45:00",
    avgActivity: 55,
    idleTime: "03:20:10",
    week: buildWeek({
      0: { hours: "6:50", pct: 52, screenshots: 33 },
      1: { hours: "7:10", pct: 57, screenshots: 36 },
      2: { hours: "6:45", pct: 54, screenshots: 34 },
      3: { hours: "5:30", pct: 58, screenshots: 27 },
      4: { hours: "3:30", pct: 53, screenshots: 18 },
    }),
    projects: [
      { name: "Ticket triage", time: "16:00:00", pct: 54 },
      { name: "Support docs", time: "8:15:00", pct: 28 },
      { name: "Team 1:1s", time: "5:30:00", pct: 18 },
    ],
    apps: [
      { name: "Zendesk", time: "17:20:00", pct: 58 },
      { name: "Slack", time: "7:40:00", pct: 26 },
      { name: "Notion", time: "4:45:00", pct: 16 },
    ],
    unusual: { highlyUnusual: 0, unusual: 0, details: [] },
    manualTime: [],
  },

  "sofia-ramirez": {
    id: "sofia-ramirez",
    name: "Sofia Ramirez",
    role: "Marketing Specialist",
    status: "Working on Q3 campaign",
    workTime: "27:30:00",
    avgActivity: 58,
    idleTime: "02:40:00",
    week: buildWeek({
      0: { hours: "6:10", pct: 55, screenshots: 30 },
      1: { hours: "6:40", pct: 60, screenshots: 33 },
      2: { hours: "5:50", pct: 57, screenshots: 29 },
      3: { hours: "6:20", pct: 61, screenshots: 31 },
      4: { hours: "2:30", pct: 56, screenshots: 14 },
    }),
    projects: [
      { name: "Q3 campaign", time: "14:00:00", pct: 51 },
      { name: "Social content", time: "8:30:00", pct: 31 },
      { name: "Analytics review", time: "5:00:00", pct: 18 },
    ],
    apps: [
      { name: "Canva", time: "12:00:00", pct: 44 },
      { name: "Chrome", time: "10:30:00", pct: 38 },
      { name: "Slack", time: "5:00:00", pct: 18 },
    ],
    unusual: { highlyUnusual: 0, unusual: 0, details: [] },
    manualTime: [],
  },

  "priya-nair": {
    id: "priya-nair",
    name: "Priya Nair",
    role: "QA Engineer",
    status: "Working on Regression suite",
    workTime: "31:00:00",
    avgActivity: 64,
    idleTime: "01:50:00",
    week: buildWeek({
      0: { hours: "7:30", pct: 62, screenshots: 40 },
      1: { hours: "7:20", pct: 66, screenshots: 38 },
      2: { hours: "7:40", pct: 63, screenshots: 41 },
      3: { hours: "6:50", pct: 67, screenshots: 35 },
      4: { hours: "1:40", pct: 61, screenshots: 9 },
    }),
    projects: [
      { name: "Regression suite", time: "17:00:00", pct: 55 },
      { name: "Bug triage", time: "9:00:00", pct: 29 },
      { name: "Release testing", time: "5:00:00", pct: 16 },
    ],
    apps: [
      { name: "Jira", time: "14:30:00", pct: 47 },
      { name: "Chrome", time: "11:00:00", pct: 35 },
      { name: "Slack", time: "5:30:00", pct: 18 },
    ],
    unusual: { highlyUnusual: 0, unusual: 0, details: [] },
    manualTime: [],
  },

  // Carl — the UC1/UC3 story member. Not on the manager's immediate team,
  // not pinned or recent by default. His unusual-activity pattern is
  // written to mirror the real GAP-persona churn trigger (maxed-out
  // activity as a fraud tell), not a generic flag.
  "carl-mendes": {
    id: "carl-mendes",
    name: "Carl Mendes",
    role: "Virtual Assistant — Contractor",
    status: "Working on Lead list cleanup",
    workTime: "39:58:00",
    avgActivity: 98,
    idleTime: "00:04:00",
    week: buildWeek({
      0: { hours: "8:00", pct: 99, screenshots: 96, flag: "highly-unusual" },
      1: { hours: "8:00", pct: 100, screenshots: 96, flag: "highly-unusual" },
      2: { hours: "7:58", pct: 97, screenshots: 94, flag: "unusual" },
      3: { hours: "8:00", pct: 100, screenshots: 96, flag: "highly-unusual" },
      4: { hours: "8:00", pct: 98, screenshots: 95, flag: "unusual" },
    }),
    projects: [
      { name: "Lead list cleanup", time: "28:00:00", pct: 70 },
      { name: "Appointment setting", time: "11:58:00", pct: 30 },
    ],
    apps: [
      { name: "Chrome", time: "39:00:00", pct: 98 },
      { name: "Sheets", time: "0:58:00", pct: 2 },
    ],
    unusual: {
      highlyUnusual: 3,
      unusual: 2,
      details: [
        { level: "highly-unusual", text: "Activity remained at 100% for 6+ consecutive hours on 3 separate days this week." },
        { level: "unusual", text: "Mouse/keyboard input detected during a scheduled break window on 8/22." },
      ],
    },
    manualTime: [],
  },

  "marta-djokovic": {
    id: "marta-djokovic",
    name: "Marta Djokovic",
    role: "Freelance Copywriter",
    status: "Working on Blog content",
    workTime: "18:20:00",
    avgActivity: 53,
    idleTime: "02:00:00",
    week: buildWeek({
      0: { hours: "4:00", pct: 50, screenshots: 20 },
      1: { hours: "4:20", pct: 54, screenshots: 22 },
      2: { hours: "3:40", pct: 52, screenshots: 18 },
      3: { hours: "4:10", pct: 55, screenshots: 21 },
      4: { hours: "2:10", pct: 51, screenshots: 11 },
    }),
    projects: [{ name: "Blog content", time: "18:20:00", pct: 100 }],
    apps: [{ name: "Google Docs", time: "18:20:00", pct: 100 }],
    unusual: { highlyUnusual: 0, unusual: 0, details: [] },
    manualTime: [],
  },

  "ben-ostrowsky": {
    id: "ben-ostrowsky",
    name: "Ben Ostrowsky",
    role: "Sales Rep",
    status: "Working on Cold outreach",
    workTime: "33:05:00",
    avgActivity: 59,
    idleTime: "01:40:00",
    week: buildWeek({
      0: { hours: "7:50", pct: 57, screenshots: 40 },
      1: { hours: "7:40", pct: 60, screenshots: 38 },
      2: { hours: "7:55", pct: 58, screenshots: 39 },
      3: { hours: "7:20", pct: 61, screenshots: 36 },
      4: { hours: "2:20", pct: 56, screenshots: 12 },
    }),
    projects: [
      { name: "Cold outreach", time: "20:00:00", pct: 60 },
      { name: "Demo calls", time: "13:05:00", pct: 40 },
    ],
    apps: [
      { name: "Salesforce", time: "19:00:00", pct: 57 },
      { name: "Zoom", time: "14:05:00", pct: 43 },
    ],
    unusual: { highlyUnusual: 0, unusual: 0, details: [] },
    manualTime: [],
  },

  "layla-haddad": {
    id: "layla-haddad",
    name: "Layla Haddad",
    role: "Recruiter",
    status: "Working on Candidate screening",
    workTime: "26:15:00",
    avgActivity: 50,
    idleTime: "02:30:00",
    week: buildWeek({
      0: { hours: "6:00", pct: 48, screenshots: 26 },
      1: { hours: "6:15", pct: 52, screenshots: 28 },
      2: { hours: "5:45", pct: 49, screenshots: 25 },
      3: { hours: "5:30", pct: 51, screenshots: 24 },
      4: { hours: "2:45", pct: 50, screenshots: 12 },
    }),
    projects: [{ name: "Candidate screening", time: "26:15:00", pct: 100 }],
    apps: [{ name: "LinkedIn", time: "15:00:00", pct: 57 }, { name: "Greenhouse", time: "11:15:00", pct: 43 }],
    unusual: { highlyUnusual: 0, unusual: 0, details: [] },
    manualTime: [],
  },

  "tom-whitfield": {
    id: "tom-whitfield",
    name: "Tom Whitfield",
    role: "Data Analyst",
    status: "Working on Churn dashboard",
    workTime: "32:40:00",
    avgActivity: 68,
    idleTime: "01:10:00",
    week: buildWeek({
      0: { hours: "7:40", pct: 66, screenshots: 42 },
      1: { hours: "7:50", pct: 70, screenshots: 44 },
      2: { hours: "7:30", pct: 67, screenshots: 41 },
      3: { hours: "7:20", pct: 71, screenshots: 40 },
      4: { hours: "2:20", pct: 65, screenshots: 13 },
    }),
    projects: [{ name: "Churn dashboard", time: "22:00:00", pct: 67 }, { name: "Ad-hoc queries", time: "10:40:00", pct: 33 }],
    apps: [{ name: "SQL client", time: "20:00:00", pct: 61 }, { name: "Metabase", time: "12:40:00", pct: 39 }],
    unusual: { highlyUnusual: 0, unusual: 0, details: [] },
    manualTime: [],
  },

  "grace-kim": {
    id: "grace-kim",
    name: "Grace Kim",
    role: "UX Researcher",
    status: "Working on Interview synthesis",
    workTime: "24:50:00",
    avgActivity: 54,
    idleTime: "02:10:00",
    week: buildWeek({
      0: { hours: "5:40", pct: 52, screenshots: 27 },
      1: { hours: "6:00", pct: 56, screenshots: 29 },
      2: { hours: "5:20", pct: 53, screenshots: 25 },
      3: { hours: "5:30", pct: 55, screenshots: 26 },
      4: { hours: "2:20", pct: 54, screenshots: 12 },
    }),
    projects: [{ name: "Interview synthesis", time: "16:00:00", pct: 64 }, { name: "Usability testing", time: "8:50:00", pct: 36 }],
    apps: [{ name: "Dovetail", time: "14:00:00", pct: 56 }, { name: "Figma", time: "10:50:00", pct: 44 }],
    unusual: { highlyUnusual: 0, unusual: 0, details: [] },
    manualTime: [],
  },

  "noah-fischer": {
    id: "noah-fischer",
    name: "Noah Fischer",
    role: "DevOps Engineer",
    status: "Working on CI pipeline",
    workTime: "36:05:00",
    avgActivity: 71,
    idleTime: "00:50:00",
    week: buildWeek({
      0: { hours: "8:10", pct: 69, screenshots: 46 },
      1: { hours: "8:00", pct: 73, screenshots: 45 },
      2: { hours: "7:50", pct: 70, screenshots: 43 },
      3: { hours: "7:45", pct: 74, screenshots: 42 },
      4: { hours: "4:20", pct: 68, screenshots: 21 },
    }),
    projects: [{ name: "CI pipeline", time: "24:00:00", pct: 67 }, { name: "Infra migration", time: "12:05:00", pct: 33 }],
    apps: [{ name: "Terminal", time: "22:00:00", pct: 61 }, { name: "GitHub", time: "14:05:00", pct: 39 }],
    unusual: { highlyUnusual: 0, unusual: 0, details: [] },
    manualTime: [],
  },
};

// Initial switcher state — mirrors the P1 use cases out of the box (a
// steady team of 4 already pinned) while leaving Carl unpinned so the
// UC1 -> UC3 flow (search him, then pin him) is something you actually do
// in the prototype rather than a pre-solved end state. Pinning is a single
// concept now (no Team/Watching split) — just who's pinned.
const PIN_LIMIT = 6;

const INITIAL_STATE = {
  selectedId: "adrian-goia",
  pinned: ["adrian-goia", "aaron-carter", "david-edwards", "sofia-ramirez"],
  recent: ["marta-djokovic", "ben-ostrowsky"],
  compareMode: false,
  weekOffset: 0,
};
