window.DESIGN_ANNOTATIONS_DATA = {
  pages: [
    { id: "onboarding", label: "Onboarding skeleton", route: "index.html" },
  ],

  annotations: [
    {
      id: "onboarding-step-title",
      page: "onboarding",
      kind: "required",
      title: "Replace step title placeholder",
      description:
        "\"Title for section\" is a Lorem-ipsum placeholder. Each onboarding step needs its own real, short title here.",
      target: "#onboarding-title",
      sub: ["Copy comes from the step config, not hard-coded", "Keep to one line at desktop widths"],
    },
    {
      id: "onboarding-step-body",
      page: "onboarding",
      kind: "required",
      title: "Replace step description placeholder",
      description:
        "\"Lorem ipsum sentence\" is placeholder body copy. Swap in the real one-line description for the current step.",
      target: "#onboarding-body",
    },
    {
      id: "onboarding-step-content",
      page: "onboarding",
      kind: "required",
      title: "Build real step content",
      description:
        "The dashed box is an empty slot for the actual step UI (form, checklist, video, integration picker, etc.). It currently renders nothing.",
      target: "#onboarding-slot",
      priority: "high",
      sub: [
        "Content should scroll internally if it exceeds the available height",
        "Swap this slot's contents per step — layout, footer, and header stay fixed",
      ],
    },
    {
      id: "onboarding-progress-segments",
      page: "onboarding",
      kind: "suggestion",
      title: "Wire progress segments to real step count",
      description:
        "Segments are hard-coded to 4 in this skeleton. Drive the count and the \"complete\" state from the actual onboarding flow's step list.",
      target: "#segments",
    },
    {
      id: "onboarding-main-action-slot",
      page: "onboarding",
      kind: "suggestion",
      title: "Use the centered main-action button for single-CTA steps",
      description:
        "This button exists in Figma as an optional variant (hidden by default) for steps that need one centered CTA instead of the Back/Continue footer — e.g. a final \"All set, go to dashboard\" step.",
      target: "#main-action",
      sub: ["Toggle visibility by adding the `has-main-action` class to the .onboarding root for that step"],
    },
    {
      id: "onboarding-footer-navigation",
      page: "onboarding",
      kind: "required",
      title: "Wire Back / Continue to real step navigation",
      description:
        "Back and Continue currently just move a local step counter (onboarding.js). Replace with real navigation, persistence of progress, and analytics events. Continue should also handle validation before advancing.",
      target: ".onboarding-footer__actions",
    },
    {
      id: "onboarding-explore-skip",
      page: "onboarding",
      kind: "required",
      title: "Wire \"Explore on my own\" to the real skip action",
      description:
        "Should exit onboarding, mark it as skipped for this user, and route to the main app. Currently only dispatches a local `onboarding:skip` event.",
      target: "#btn-explore",
    },
  ],
};
