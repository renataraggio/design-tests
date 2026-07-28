window.DESIGN_ANNOTATIONS_DATA = {
  pages: [
    { id: "onboarding", label: "AR0228 — Onboarding", route: "index.html" },
  ],

  annotations: [
    {
      id: "step1-download-simulated",
      page: "onboarding",
      kind: "required",
      title: "\"Download the desktop app\" is simulated",
      description:
        "Clicking the button just flips local UI state (button becomes an outline \"Downloaded\" state, Continue unlocks). It doesn't detect OS, trigger a real download, or confirm the app was actually installed.",
      target: "#main-action",
      priority: "high",
      sub: [
        "Wire to real OS detection + the actual desktop app installer link",
        "Consider gating Continue on a real \"app installed\" signal instead of the click alone",
      ],
    },
    {
      id: "ar0228-pivot-from-ar0227",
      page: "onboarding",
      kind: "suggestion",
      title: "This experiment is a pivot away from AR0227's fake-app-window approach",
      description:
        "AR0227's Step 2 mimicked the real desktop app in a browser mockup (traffic-light titlebar, a fake play button, a fake counting timer) — feedback was that this made it look like you could actually track time from the web page, when tracking can only ever happen in the real desktop app. AR0228 duplicates AR0227 and replaces just that idea: Step 2 is now a 3-step \"story\" (Download → Open the app → Press play), plus an honest \"Listening for a signal from your desktop app…\" status line — no element on the page claims to be a working control. Steps 1 and 3 are unchanged from AR0227.",
      target: ".setup-story",
      sub: ["Compare directly against AR0227 with stakeholders before deciding which direction to carry forward"],
    },
    {
      id: "step2-signal-simulated",
      page: "onboarding",
      kind: "required",
      title: "\"Simulate\" link stands in for the real desktop-app signal — no real signal exists yet",
      description:
        "The 3-step list and \"Listening for a signal…\" status are driven entirely by the \"Simulate: desktop app started tracking\" link, since this static prototype has no way to hear from a real desktop app. Clicking it marks \"Open Hubstaff\" and \"Press play\" complete and unlocks Continue. It's explicitly marked as a testing affordance (dashed border, \"Simulate:\" copy) and isn't part of the real design — and it always succeeds, so it can't reproduce a \"no project assigned\" or \"app never reports back\" failure case the way AR0227's build attempted to.",
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
        "The final hand-off replaced the modal's old \"Skip\" + \"Request project\" footer buttons with a single \"Continue without tracking time\" button, and moved \"Reach out to our support team\" into the modal body. This build interprets the new button as unlocking Continue for Step 2 only (bypassing the tracking gate without exiting onboarding) — separate from the page footer's \"Skip\" (which still exits the whole flow via the onboarding:skip event). That distinction was inferred from the wording, not explicitly confirmed. The \"Request a project\" button now on the main Step 2 view (not just in the modal) simply opens this same help modal — there's still no real project-request flow behind it.",
      target: "#help-modal-bypass",
      sub: [
        "Confirm \"Continue without tracking time\" should only bypass Step 2's gate, not skip the whole experiment",
        "Wire \"Request a project\" to a real org/manager lookup or in-app request flow instead of just opening the help modal",
      ],
    },
    {
      id: "skip-visible-steps-1-2",
      page: "onboarding",
      kind: "suggestion",
      title: "\"Skip\" is visible on Steps 1-2 but means something different on each",
      description:
        "Earlier rounds of this experiment went back and forth on whether Skip should exist at all, then limited it to Step 2 only. The final hand-off's Step 1 frames (both before and after clicking Download) show a footer \"Skip\" link, so it's shown on Steps 1-2 and hidden only on the final Step 3 screen, matching the hand-off. Per direct product feedback, Step 1's Skip only advances to Step 2 (there's nothing to exit to yet) rather than exiting the whole flow — Step 2's Skip still dispatches the full onboarding:skip exit.",
      target: "#btn-skip",
      sub: ["No action needed unless product wants Skip scoped differently than the final Figma shows"],
    },
    {
      id: "progress-bar-value-inferred",
      page: "onboarding",
      kind: "suggestion",
      title: "Progress bar now fills per-step — Figma showed the same fixed amount on every screen",
      description:
        "The final hand-off replaced the old 3-segment progress pills with a single continuous bar (Zone DS \"ProgressBars\" component). Every one of its 5 screens — including the very last \"Get familiar with Hubstaff\" step — renders that bar at the same fixed ~25% fill, suggesting it may represent progress through a larger onboarding checklist outside this 3-screen experiment, not progress through these screens specifically. This build instead scales the fill by currentStep/3 so it visibly advances, since a bar that never moves would look broken in this isolated prototype — but that per-step scaling is this build's inference, not something the hand-off actually shows.",
      target: "#progress-fill",
      sub: ["Confirm with design whether this bar should track progress through this experiment specifically, or reflect something broader that this prototype can't represent in isolation"],
    },
    {
      id: "step1-widgets-approximated",
      page: "onboarding",
      kind: "suggestion",
      title: "Utilization gauge + benchmark bar are CSS approximations",
      description:
        "The gauge (conic-gradient arc + needle) recreates Figma's gray-then-blue dial, and the activity benchmark bar (org/job-type ticks at 40%/72%) recreates that widget's look — but neither is pixel-matched to Figma's assets. In particular, Figma's gauge uses discrete dashed tick marks around the arc; this build uses a smooth two-tone ring instead.",
      target: ".widgets-row",
      sub: ["If this experiment needs exact benchmark values or the dashed-tick gauge style, confirm against Figma node 20110-7094 rather than this approximation"],
    },
    {
      id: "step3-video-descoped",
      page: "onboarding",
      kind: "suggestion",
      title: "Step 3 uses a static image, not a real video embed",
      description:
        "Originally scoped as an embedded video (support.hubstaff.com quick-start guide), but that page has no actual video. Per stakeholder decision, this step currently just shows the Figma promo screenshot as a static image with no playback.",
      target: ".step3-image",
      sub: ["If a real onboarding video becomes available, swap this for a real embed and revisit the \"Finish\" CTA placement relative to it"],
    },
    {
      id: "step3-necessity-open-question",
      page: "onboarding",
      kind: "suggestion",
      title: "Open question: does this experiment need Step 3 at all?",
      description:
        "Unlike Steps 1-2, Step 3 doesn't gate on any real activation behavior — it's just a static promo image with a Finish button. Steps 1-2 alone already cover this experiment's core activation loop (download the app, confirm tracking works). Cutting Step 3 would shorten the flow and likely reduce drop-off, at the cost of losing the one touchpoint that surfaces the quick-start video/further-help content to new users.",
      target: "#step-panel-3",
      sub: [
        "If kept: consider it optional/skippable rather than a required step",
        "If cut: fold the quick-start link into Step 2's help modal so that content isn't lost entirely",
      ],
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
