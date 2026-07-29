window.DESIGN_ANNOTATIONS_DATA = {
  pages: [
    { id: "onboarding", label: "AR0227-v.2 — Onboarding", route: "index.html" },
  ],

  annotations: [
    {
      id: "step1-download-screen-removed",
      page: "onboarding",
      kind: "suggestion",
      title: "The old \"Download the desktop app\" screen has been removed",
      description:
        "AR0227-v.1 (and AR0227-v.2's first draft) opened with a dedicated screen: an org-requires-this alert, a preview of the utilization/activity widgets, and a \"Download the desktop app\" button gating Continue. Per direct product feedback, that screen is now cut entirely — this experiment starts on what used to be Step 2, and the \"Download the app\" item in its 3-step story is the only place download happens now (see \"setup-download-is-the-primary-path\" below). The tradeoff: this shortens the flow by a full screen, but loses the explicit \"your organization requires this\" framing and the motivating preview of the utilization/activity widgets before asking for the install.",
      target: "#setup-step-download",
      sub: ["Confirm losing the \"org requires this\" framing and widget preview is acceptable, or find another place for that messaging if not"],
    },
    {
      id: "setup-download-is-the-primary-path",
      page: "onboarding",
      kind: "required",
      title: "\"Download the app\" always starts unconfirmed — this is the only download entry point now",
      description:
        "With the old download screen gone, this experiment now starts directly on the 3-step story with nothing downloaded yet. \"Download the app\" shows a download icon, a pulsing highlight, and an inline \"Download\" button (confirmDownload()) — clicking it just flips local state; it doesn't detect OS, trigger a real download, or confirm the app was actually installed. \"Open Hubstaff\"/\"Press play\" stay dimmed until it's done.",
      target: "#setup-step-download-cta",
      priority: "high",
      sub: [
        "Wire to real OS detection + the actual desktop app installer link",
        "Consider gating progress on a real \"app installed\" signal instead of the click alone",
      ],
    },
    {
      id: "ar0228-pivot-from-ar0227",
      page: "onboarding",
      kind: "suggestion",
      title: "This experiment is a pivot away from AR0227-v.1's fake-app-window approach — now down to 2 steps",
      description:
        "AR0227-v.1's Step 2 mimicked the real desktop app in a browser mockup (traffic-light titlebar, a fake play button, a fake counting timer) — feedback was that this made it look like you could actually track time from the web page, when tracking can only ever happen in the real desktop app. AR0227-v.2 started as a duplicate of AR0227-v.1 with that idea replaced by a 3-step \"story\" (Download → Open the app → Press play) plus an honest \"Waiting to hear back from your desktop app…\" status line. It has since also dropped AR0227-v.1's separate \"Download the desktop app\" screen entirely — this experiment is now 2 steps total: the setup story (with download folded in), then \"Get familiar with Hubstaff.\"",
      target: ".setup-story",
      sub: ["Compare directly against AR0227-v.1 with stakeholders before deciding which direction to carry forward"],
    },
    {
      id: "step2-signal-simulated",
      page: "onboarding",
      kind: "required",
      title: "\"Simulate\" link stands in for the real desktop-app signal — no real signal exists yet",
      description:
        "The 3-step list and \"Waiting to hear back…\" status are driven entirely by the \"Simulate: desktop app started tracking\" link, since this static prototype has no way to hear from a real desktop app. Clicking it marks \"Open Hubstaff\" and \"Press play\" complete and unlocks Continue. It's explicitly marked as a testing affordance (dashed border, \"Simulate:\" copy) and isn't part of the real design — and it always succeeds, so it can't reproduce a \"no project assigned\" or \"app never reports back\" failure case the way AR0227-v.1's build attempted to.",
      target: "#simulate-tracking",
      priority: "high",
      sub: [
        "Replace with a real signal: desktop-app heartbeat / tracking-session-started event tied to that specific user",
        "Decide how (or whether) to represent a \"no project assigned\" failure case in this new illustration style before this ships",
        "Remove the \"Simulate\" link once a real signal exists",
      ],
    },
    {
      id: "help-modal-bypass-vs-skip",
      page: "onboarding",
      kind: "suggestion",
      title: "Modal's \"Continue without tracking time\" is distinct from the footer's Skip — inferred",
      description:
        "The final hand-off replaced the modal's old \"Skip\" + \"Request project\" footer buttons with a single \"Continue without tracking time\" button, and moved \"Reach out to our support team\" into the modal body. This build interprets the new button as unlocking Continue for this step only (bypassing the tracking gate without exiting onboarding) — separate from the page footer's \"Skip\" (which exits the whole flow via the onboarding:skip event). That distinction was inferred from the wording, not explicitly confirmed. The \"Request a project\" button on the main view (not just in the modal) simply opens this same help modal — there's still no real project-request flow behind it.",
      target: "#help-modal-bypass",
      sub: [
        "Confirm \"Continue without tracking time\" should only bypass this step's gate, not skip the whole experiment",
        "Wire \"Request a project\" to a real org/manager lookup or in-app request flow instead of just opening the help modal",
      ],
    },
    {
      id: "skip-exits-onboarding",
      page: "onboarding",
      kind: "suggestion",
      title: "\"Skip\" now always exits the whole flow",
      description:
        "Earlier rounds of this experiment went back and forth on whether Skip should exist at all, then gave Step 1 its own \"just advance, don't exit\" behavior since it was possible to reach Step 2 without downloading. Now that the download screen is gone and downloading is folded into this step's own story (with its own \"Download\" CTA), there's no separate screen left to \"just advance\" past — Skip is shown on this step and hidden on the final \"Get familiar\" screen, and always dispatches the full onboarding:skip exit.",
      target: "#btn-skip",
      sub: ["No action needed unless product wants a softer Skip behavior on this step"],
    },
    {
      id: "progress-bar-value-inferred",
      page: "onboarding",
      kind: "suggestion",
      title: "Progress bar now fills per-step — Figma showed the same fixed amount on every screen",
      description:
        "The final hand-off (a 5-screen, 3-step version of this flow) used a single continuous bar (Zone DS \"ProgressBars\" component) that rendered at the same fixed ~25% fill on every screen, suggesting it may represent progress through a larger onboarding checklist outside this experiment, not progress through these screens specifically. This build instead scales the fill by currentStep/2 so it visibly advances across this now-2-step flow, since a bar that never moves would look broken in an isolated prototype — but that per-step scaling is this build's inference, not something the hand-off actually shows.",
      target: "#progress-fill",
      sub: ["Confirm with design whether this bar should track progress through this experiment specifically, or reflect something broader that this prototype can't represent in isolation"],
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
      title: "Back / Continue / Skip only manage local step state",
      description:
        "Navigation currently just moves an in-memory currentStep counter and dispatches onboarding:complete (Finish) or onboarding:skip (Skip) events. No real routing, progress persistence, or analytics tracking is wired up yet.",
      target: ".onboarding-footer__actions",
      sub: [
        "Wire onboarding:complete / onboarding:skip to real app routing",
        "Add analytics events per step transition before this ships",
      ],
    },
  ],
};
