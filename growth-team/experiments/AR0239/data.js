/* AR0239 — standalone data, four directions (Renata, 2026-10-01: "build out
   V4 + V2 and rename it to just AR0239" — was V3-only before this).
   Content copied verbatim from product-team's product/squads/growth/
   experiments/AR0239/prototype/steps.data.js. STEPS below is the UNION of
   every direction's steps; app.js's DIRECTION_STEPS picks which ids each
   direction actually shows (same onlyIn/omitIn facts as the Kit source,
   just resolved as plain id lists instead of re-evaluated per render).
   Step order is V3/V4's real rail order: connect-payroll sits ahead of
   smart-notifications (Renata, 2026-09-30: "move create smart notification
   below connect payroll"); V1/V2 share that same array order, minus
   whichever ids they omit. */

window.WIZARD = {
  name: 'Henrique',
  org: 'Acme Corps',
  sizeLabel: '7-50',
  tracking: 'Desktop',
  goals: ['Monitor our employees', 'Track productivity'],
  plan: 'Enterprise — Monthly',
};

// Reused across the checklist (member-limits, member-payment-details) and
// the create-org done-scene preview — one roster, not three invented ones.
window.TEAM = [
  { name: 'Dana Whitfield', initials: 'DW', color: '#0168dd', email: 'dana.whitfield@acmecorps.com',
    workingOn: 'Website redesign', totalWorkTime: '7:40:12', avgActivity: 82, idleTime: '0:22:05', manualTime: '0:00:00',
    weekly: [
      { day: 'Mon', date: 'Sep 22', hours: '1:18:40', pct: 84, screenshots: 9 },
      { day: 'Tue', date: 'Sep 23', hours: '1:24:10', pct: 88, screenshots: 10 },
      { day: 'Wed', date: 'Sep 24', hours: '1:10:55', pct: 79, screenshots: 8 },
      { day: 'Thu', date: 'Sep 25', hours: '0:38:20', pct: 24, screenshots: 3 },
      { day: 'Fri', date: 'Sep 26', hours: '1:29:50', pct: 91, screenshots: 11 },
      { day: 'Sat', date: 'Sep 27', hours: '0:00:00', pct: null, screenshots: 0 },
      { day: 'Sun', date: 'Sep 28', hours: '0:00:00', pct: null, screenshots: 0 },
    ] },
  { name: 'Marcus Reyes', initials: 'MR', color: '#31c48d', email: 'marcus.reyes@acmecorps.com',
    workingOn: 'Mobile app', totalWorkTime: '6:05:30', avgActivity: 64, idleTime: '0:41:18', manualTime: '0:15:00',
    weekly: [
      { day: 'Mon', date: 'Sep 22', hours: '1:05:10', pct: 68, screenshots: 7 },
      { day: 'Tue', date: 'Sep 23', hours: '0:58:45', pct: 61, screenshots: 6 },
      { day: 'Wed', date: 'Sep 24', hours: '1:12:20', pct: 70, screenshots: 8 },
      { day: 'Thu', date: 'Sep 25', hours: '0:52:05', pct: 57, screenshots: 5 },
      { day: 'Fri', date: 'Sep 26', hours: '0:29:10', pct: 19, screenshots: 2 },
      { day: 'Sat', date: 'Sep 27', hours: '1:28:20', pct: 73, screenshots: 9 },
      { day: 'Sun', date: 'Sep 28', hours: '0:00:00', pct: null, screenshots: 0 },
    ] },
  { name: 'Priya Anand', initials: 'PA', color: '#9061f9', email: 'priya.anand@acmecorps.com',
    workingOn: 'Client onboarding', totalWorkTime: '6:52:45', avgActivity: 71, idleTime: '0:33:52', manualTime: '0:00:00',
    weekly: [
      { day: 'Mon', date: 'Sep 22', hours: '1:11:30', pct: 74, screenshots: 8 },
      { day: 'Tue', date: 'Sep 23', hours: '1:02:15', pct: 69, screenshots: 7 },
      { day: 'Wed', date: 'Sep 24', hours: '0:24:40', pct: 22, screenshots: 3 },
      { day: 'Thu', date: 'Sep 25', hours: '1:18:05', pct: 80, screenshots: 9 },
      { day: 'Fri', date: 'Sep 26', hours: '1:09:50', pct: 76, screenshots: 8 },
      { day: 'Sat', date: 'Sep 27', hours: '1:06:25', pct: 68, screenshots: 7 },
      { day: 'Sun', date: 'Sep 28', hours: '0:00:00', pct: null, screenshots: 0 },
    ] },
  { name: 'Tom Okafor', initials: 'TO', color: '#e3a008', email: 'tom.okafor@acmecorps.com',
    workingOn: 'Support tickets', totalWorkTime: '5:20:10', avgActivity: 58, idleTime: '0:48:30', manualTime: '0:30:00',
    weekly: [
      { day: 'Mon', date: 'Sep 22', hours: '0:51:20', pct: 55, screenshots: 5 },
      { day: 'Tue', date: 'Sep 23', hours: '0:18:10', pct: 17, screenshots: 2 },
      { day: 'Wed', date: 'Sep 24', hours: '0:47:35', pct: 60, screenshots: 5 },
      { day: 'Thu', date: 'Sep 25', hours: '0:55:05', pct: 63, screenshots: 6 },
      { day: 'Fri', date: 'Sep 26', hours: '0:49:20', pct: 59, screenshots: 5 },
      { day: 'Sat', date: 'Sep 27', hours: '0:38:40', pct: 51, screenshots: 4 },
      { day: 'Sun', date: 'Sep 28', hours: '0:00:00', pct: null, screenshots: 0 },
    ] },
  { name: 'Lena Fischer', initials: 'LF', color: '#c81e1e', email: 'lena.fischer@acmecorps.com',
    workingOn: 'Content production', totalWorkTime: '7:05:20', avgActivity: 77, idleTime: '0:27:10', manualTime: '0:00:00',
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

window.DASHBOARD = {
  unlockMinutes: 10,
};

window.STEPS = [
  {
    id: 'create-org', icon: 'workspaces', label: 'Create your org', minutes: 0, skippable: false, done: true,
    pane: { kind: 'done' },
  },
  {
    id: 'create-teams', icon: 'groups', label: 'Create teams', minutes: 2, skippable: true, done: false,
    pane: {
      kind: 'chips-plus-input', heading: 'Create your first teams',
      body: 'Teams keep your account organized. Pick a few to start with.',
      suggestions: ['Admin', 'Customer Service', 'Data Entry', 'Design', 'Development', 'Marketing', 'Sales', 'Operations', 'Finance', 'QA'],
      inputLabel: 'Team name', inputPlaceholder: 'e.g. Marketing', cta: 'Create teams',
    },
  },
  {
    id: 'select-projects', icon: 'folder', label: 'Select your project', minutes: 1, skippable: true, done: false,
    pane: {
      kind: 'selectable-list', heading: 'Select your project',
      body: 'Create the project your team can track time toward.',
      options: [
        { id: 'org', label: "Henrique's Organization project", hint: 'Created with your org' },
        { id: 'admin', label: 'Admin' }, { id: 'cs', label: 'Customer Services' },
        { id: 'data', label: 'Data Entry' }, { id: 'design', label: 'Design' },
        { id: 'website', label: 'Website redesign' }, { id: 'mobile', label: 'Mobile app' },
        { id: 'onboarding', label: 'Client onboarding' }, { id: 'support', label: 'Support tickets' },
        { id: 'content', label: 'Content production' },
      ],
      inputLabel: 'Or name a new project', inputPlaceholder: 'e.g. Website redesign', cta: 'Save projects',
    },
  },
  {
    // V2 only (omitted from V1/V3/V4, which "keep only the steps that
    // produce data" — same Kit source comment).
    id: 'subscribe-reports', icon: 'summarize', label: 'Subscribe to reports', minutes: 1, skippable: true, done: false,
    pane: {
      kind: 'templates', heading: 'Subscribe to a report',
      body: 'Pick a report to have delivered. You can change the schedule later.',
      templateCta: 'Subscribe', templateDoneCta: 'Subscribed',
      templates: [
        { id: 'time-activity', icon: 'query_stats', title: 'Time & Activity', desc: "See team members' time worked, activity levels, and amounts earned per project or work order.", meta: ['Weekly', 'Email'] },
        { id: 'amounts-owed', icon: 'attach_money', title: 'Amounts owed', desc: 'See how much the hourly paid team members are currently owed.', meta: ['Weekly', 'Email'] },
        { id: 'daily-totals', icon: 'bar_chart', title: 'Daily totals', desc: "See team members' time worked, activity levels, and amount earned per day.", meta: ['Daily', 'Email'] },
        { id: 'apps-urls', icon: 'devices', title: 'Apps & URLs', desc: 'See which apps and sites work time actually went to.', meta: ['Weekly', 'Email'] },
      ],
      cta: 'Subscribe',
    },
  },
  {
    id: 'member-limits', icon: 'tune', label: 'Set member limits', minutes: 2, skippable: true, done: false,
    pane: {
      kind: 'form', heading: 'Set member limits', body: 'Cap how many hours members can track.',
      cta: 'Save limits',
    },
  },
  {
    id: 'member-payment-details', icon: 'account_balance_wallet', label: 'Set member payment details', minutes: 3, skippable: true, done: false, payrollOnly: true,
    pane: {
      kind: 'payment-table', heading: 'Set member payment details',
      body: 'Set pay rates and pay periods for your team. You can also set timesheets to require approval before payments are sent.',
      cta: 'Continue',
    },
  },
  {
    id: 'connect-payroll', icon: 'account_balance_wallet', label: 'Connect to payroll', minutes: 3, skippable: true, done: false, payrollOnly: true,
    pane: {
      kind: 'provider-list', heading: 'Connect to payroll', body: 'Pay your team based on tracked hours.',
      providers: [
        { id: 'wise', label: 'Wise', hint: 'Bank transfer in 40+ currencies', logo: 'wise' },
        { id: 'paypal', label: 'PayPal', hint: 'Fastest to set up', logo: 'paypal' },
        { id: 'payoneer', label: 'Payoneer', hint: 'Good for contractors', logo: 'payoneer' },
        { id: 'bitwage', label: 'Bitwage', hint: 'Crypto and multi-currency', logo: 'bitwage' },
      ],
      cta: 'Connect', secondary: 'I pay outside Hubstaff',
    },
  },
  {
    id: 'smart-notifications', icon: 'notifications_active', label: 'Create smart notification', minutes: 2, skippable: true, done: false, insightsOnly: true,
    pane: {
      kind: 'templates', heading: 'Create a smart notification',
      body: 'Get notified automatically when specific events happen in your organization.',
      templateCta: 'Create',
      templates: [
        { id: 'suspicious', icon: 'warning', title: 'Suspicious activity level', desc: 'Flags activity patterns that look automated rather than human.', meta: ['Daily', 'Email'] },
        { id: 'overworking', icon: 'speed', title: 'Members overworking', desc: 'Someone is tracking well beyond their agreed limit.', meta: ['Weekly', 'Email'] },
        { id: 'underworking', icon: 'hourglass_empty', title: 'Members underworking', desc: 'Someone is tracking far below their schedule.', meta: ['Weekly', 'Email'] },
        { id: 'low-activity', icon: 'insights', title: 'Members with low activity level', desc: 'Activity drops below the threshold you set.', meta: ['Weekly', 'Email'] },
      ],
      cta: 'Save smart notifications',
    },
  },
  {
    id: 'download-app', icon: 'install_desktop', label: 'Download app', minutes: 2, skippable: true, done: false,
    pane: {
      kind: 'download', heading: 'Download the Hubstaff app',
      body: "Install Hubstaff's app on your computer to start tracking time.",
      platforms: [
        { id: 'mac', label: 'macOS', icon: 'laptop_mac', meta: '11.0 or later' },
        { id: 'win', label: 'Windows', icon: 'desktop_windows', meta: '10 or later' },
        { id: 'linux', label: 'Linux', icon: 'monitor', meta: 'deb · rpm' },
      ],
      cta: 'Download for macOS',
    },
  },
  {
    id: 'invite-members', icon: 'person_add', label: 'Invite members', minutes: 1, skippable: false, done: false,
    pane: {
      kind: 'invite', heading: 'Invite your team', body: 'Hubstaff works best when your whole team is in it.',
      roleOptions: [
        { value: 'user', label: 'User', description: 'Tracks time, sees their own data' },
        { value: 'manager', label: 'Manager', description: 'Manages projects and members' },
        { value: 'viewer', label: 'Viewer', description: 'Read-only access to reports' },
      ],
      link: 'https://app.hubstaff.com/organizations/invite/5OP4lkzfF_czkN',
      cta: 'Send invites',
    },
  },
];

/* V2 only — Integrations card + "Get 1:1 setup walkthroughs" banner, below
   the checklist. Shipped on every direction originally, dropped everywhere
   on 2026-09-30, restored for V2 alone on 2026-10-01 (same history as the
   Kit source's window.QUICKSTART_ASIDE — see that file's own note). */
window.ASIDE = {
  integrations: {
    heading: 'Integrate with your favorite tools',
    body: 'We support over 30 popular integrations so you can continue using your favorite tools inside Hubstaff.',
    link: 'View all integrations',
    tools: [
      { name: 'ClickUp', logo: 'clickup' },
      { name: 'Asana', logo: 'asana' },
      { name: 'Slack', logo: 'slack' },
      { name: 'Wise', logo: 'wise' },
      { name: 'Trello', logo: 'trello' },
    ],
  },
};

/* V4 only — replaces Select your project's picker with the real "Customize
   your first project" form (reference screenshot, Renata 2026-10-01). See
   the Kit source's window.QUICKSTART_V4_PROJECT_PANE for the full file-level
   note, incl. the flagged assumption that `client` options are placeholder
   prototype content (the reference never opens that dropdown). */
window.V4_PROJECT_PANE = {
  kind: 'project-setup',
  heading: 'Customize your first project',
  body: 'Set up the first project your team will track time against — you can add more any time.',
  fields: [
    { id: 'projectName', type: 'text', label: 'Project name', required: true, placeholder: 'e.g. Acme — website refresh' },
    {
      id: 'client', type: 'select', label: 'Client', placeholder: 'No client',
      helper: 'Optional — used for reporting and invoicing.',
      options: [
        { value: 'acme', label: 'Acme Corp' },
        { value: 'globex', label: 'Globex Inc' },
      ],
    },
    {
      id: 'weeklyBudget', type: 'toggle', icon: 'bolt', label: 'Weekly Budget', badge: 'Recommended',
      description: 'We suggest 40 total hours per week. You can increase this if your team is larger.',
    },
    {
      id: 'clientViewer', type: 'toggle', icon: 'folder_shared', label: 'Client viewer', badge: 'Free',
      description: 'You can later add your client as a viewer to see live hours on this project for free — no seat cost.',
      disabledUntil: 'client',
    },
  ],
  cta: 'Save projects',
};
