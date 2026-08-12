window.DESIGN_ANNOTATIONS_DATA = {
  pages: [
    { id: "onboarding", label: "AR0227 — Onboarding", route: "index.html" },
  ],

  annotations: [
    {
      id: "step1-download-screen-removed",
      page: "onboarding",
      kind: "suggestion",
      title: "The old \"Download the desktop app\" screen has been removed",
      description:
        "AR0223 (and AR0227's first draft) opened with a dedicated screen: an org-requires-this alert, a preview of the utilization/activity widgets, and a \"Download the desktop app\" button gating Continue. Per direct product feedback, that screen is now cut entirely — this experiment starts on what used to be Step 2, and the \"Download the app\" item in its 3-step story is the only place download happens now (see \"setup-download-is-the-primary-path\" below). The tradeoff: this shortens the flow by a full screen, but loses the explicit \"your organization requires this\" framing and the motivating preview of the utilization/activity widgets before asking for the install.",
      target: "#setup-step-download",
      sub: ["Confirm losing the \"org requires this\" framing and widget preview is acceptable, or find another place for that messaging if not"],
    },
    {
      id: "setup-download-is-the-primary-path",
      page: "onboarding",
      kind: "required",
      title: "\"Download the app\" always starts unconfirmed — this is the only download entry point now",
      description:
        "With the old download screen gone, this experiment now starts directly on the 2-step story with nothing downloaded yet. \"Download the app\" shows a download icon, a blue-outline highlight, and two CTAs — \"Download\" and \"I already did this\" (confirmDownload()) — clicking either just flips local state; neither detects OS, triggers a real download, nor confirms the app was actually installed. \"Press play\" stays dimmed until download completes, then its icon picks up that same blue-outline highlight while it waits on tracking — its label stays dimmed until it actually completes, matching the final Figma hand-off (AR0227 — Aggressive track version, node 23:1611), which also dropped the pulsing/wave animations this build originally had in favor of static highlight states (the pulse was later restored on this build per direct product feedback).",
      target: "#setup-step-download-cta",
      priority: "high",
      sub: [
        "Wire \"Download\" to real OS detection + the actual desktop app installer link",
        "Consider gating progress on a real \"app installed\" signal instead of either click alone",
      ],
    },
    {
      id: "ar0228-pivot-from-ar0227",
      page: "onboarding",
      kind: "suggestion",
      title: "This experiment is a pivot away from AR0223's fake-app-window approach — now down to 2 screens and a 2-item story",
      description:
        "AR0223's Step 2 mimicked the real desktop app in a browser mockup (traffic-light titlebar, a fake play button, a fake counting timer) — feedback was that this made it look like you could actually track time from the web page, when tracking can only ever happen in the real desktop app. AR0227 started as a duplicate of AR0223 with that idea replaced by a 3-step \"story\" (Download → Open the app → Press play) plus an honest \"Waiting to hear back from your desktop app…\" status line. It has since dropped AR0223's separate \"Download the desktop app\" screen entirely, and — matching the final Figma hand-off (AR0227 — Aggressive track version) — also dropped the middle \"Open Hubstaff\" item, since it had no distinct signal to promote it to active on its own. The story is now just 2 items: Download the app → Press play to start the timer. This experiment is 2 screens total: the setup story (with download folded in), then \"Get familiar with Hubstaff.\"",
      target: ".setup-story",
      sub: ["Compare directly against AR0223 with stakeholders before deciding which direction to carry forward"],
    },
    {
      id: "step2-signal-simulated",
      page: "onboarding",
      kind: "required",
      title: "Two \"Simulate\" links stand in for the real desktop-app signal — no real signal exists yet",
      description:
        "The 2-step list and \"Waiting to hear back…\" status are driven entirely by two testing affordances (dashed border, \"Simulate:\" copy), since this static prototype has no way to hear from a real desktop app. \"Simulate: desktop app started tracking\" marks \"Download the app\" and \"Press play\" complete (even if the Download CTA was never explicitly clicked), fades out the top reminder alert and \"Need help\" link, and unlocks Continue. \"Simulate: no project detected\" — added per the final Figma hand-off (AR0227 — Aggressive track version, node 23:1611) — marks only \"Download the app\" complete, shows an amber \"No project detected for time tracking. An email was sent to your manager.\" notice, and also unlocks Continue without ever confirming tracking, resolving this build's earlier open question about how to represent that failure case.",
      target: "#simulate-tracking",
      priority: "high",
      sub: [
        "Replace both with a real signal: desktop-app heartbeat / tracking-session-started event (with or without a project) tied to that specific user",
        "Confirm the real \"no project detected\" notice should actually unlock Continue, or whether it should block until a project is assigned",
        "Wire the email-to-manager mentioned in the no-project copy to a real notification",
        "Remove both \"Simulate\" links once real signals exist",
      ],
    },
    {
      id: "help-modal-bypass-behavior",
      page: "onboarding",
      kind: "suggestion",
      title: "Modal's \"Continue without tracking time\" bypasses this step only — inferred",
      description:
        "The final hand-off replaced the modal's old \"Skip\" + \"Request project\" footer buttons with a single \"Continue without tracking time\" button, and moved \"Reach out to our support team\" into the modal body. This build interprets the new button as unlocking Continue for this step only (bypassing the tracking gate without exiting onboarding) — that was inferred from the wording, not explicitly confirmed. The page footer's own Skip button has since been removed entirely (there's no other exit from onboarding left in this build). The main view's standalone \"Request a project\" button has also been removed to match the final hand-off — none of its 5 screens show it; the \"no project detected\" case is instead handled automatically (see \"step2-signal-simulated\").",
      target: "#help-modal-bypass",
      sub: [
        "Confirm \"Continue without tracking time\" should only bypass this step's gate, not skip the whole experiment",
        "Decide whether onboarding needs its own exit/skip path now that the footer button is gone",
      ],
    },
    {
      id: "progress-bar-value-inferred",
      page: "onboarding",
      kind: "suggestion",
      title: "Progress bar fills per-step — confirmed against the final Figma hand-off",
      description:
        "This build scales the fill by currentStep/2 (50% on the setup-story screen, 100% on \"Get familiar\"). The final Figma hand-off (AR0227 — Aggressive track version, node 23:1611) shows the same: its 5 screens go from a half-filled bar through the setup-story states to a fully-filled bar on \"Get familiar,\" confirming this per-step scaling matches the intended design rather than being an unconfirmed inference.",
      target: "#progress-fill",
      sub: ["No action needed — resolved by the final hand-off"],
    },
    {
      id: "step2-video-descoped",
      page: "onboarding",
      kind: "suggestion",
      title: "Final step uses a static image, not a real video embed",
      description:
        "Originally scoped as an embedded video (support.hubstaff.com quick-start guide), but that page has no actual video. Per stakeholder decision, this step currently just shows the Figma promo screenshot as a static image with no playback.",
      target: ".step3-image",
      sub: ["If a real onboarding video becomes available, swap this for a real embed and revisit the \"Finish\" CTA placement relative to it"],
    },
    {
      id: "footer-navigation-local-only",
      page: "onboarding",
      kind: "required",
      title: "Back / Continue only manage local step state",
      description:
        "Navigation currently just moves an in-memory currentStep counter and dispatches onboarding:complete on Finish. No real routing, progress persistence, or analytics tracking is wired up yet.",
      target: ".onboarding-footer__actions",
      sub: [
        "Wire onboarding:complete to real app routing",
        "Add analytics events per step transition before this ships",
      ],
    },
  ],
};
