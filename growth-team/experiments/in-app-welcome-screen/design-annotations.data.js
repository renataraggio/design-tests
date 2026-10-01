/* Design Annotations data for the "in-app welcome screen" concept.
   pages[]       — the screens in this prototype
   annotations[] — one entry per co-design task, anchored to a selector */
window.DESIGN_ANNOTATIONS_DATA = {
  pages: [
    { id: 'welcome', name: 'Welcome screen' },
  ],
  annotations: [
    {
      page: 'welcome',
      selector: '#iw-popover-right',
      title: 'Staging (app.staging.hbstf.co) could not be reviewed',
      body: 'This session\'s browser pane has its own isolated login, separate from any browser the viewer normally uses — no credentials were available or entered, and login did not carry over from elsewhere. The three popover widgets are grounded in the real Figma "Unusual activity" reference (node 4905:1785) and in marketing-pattern research gathered earlier in this build, not in a live staging capture. Worth a follow-up pass once staging access is available, to check real labels/spacing/data structure directly.',
      status: 'open',
    },
    {
      page: 'welcome',
      selector: '#iw-popover-left',
      title: 'Popover pairing is a generic rotation, not a per-beat script',
      body: 'The two always-on popovers cycle through the three widget kinds (current activity, project progress, unusual activity) as a sliding 2-wide window keyed only to the beat INDEX (0→current+project, 1→project+unusual, 2→unusual+current, …) — not a hand-authored "this exact widget for this exact beat" mapping. It reads as reasonably on-theme throughout (e.g. beat 2, "unusual activity," does show the unusual-activity widget), but flagging in case a stricter 1:1 mapping per beat is wanted instead.',
      status: 'open',
    },
    {
      page: 'welcome',
      selector: 'button',
      title: '"Get started" has no destination yet',
      body: 'By design, this single-screen concept ends at the one CTA — there is no second screen or real app behind it to send the click to. Wire it to the actual next step (dashboard, checklist, wizard) once this direction is chosen.',
      status: 'open',
    },
  ],
};
