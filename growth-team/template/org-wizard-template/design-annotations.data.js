window.DESIGN_ANNOTATIONS_DATA = {
  pages: [
    { id: "org-wizard", label: "Org wizard", route: "index.html" },
  ],

  annotations: [
    /* ── Design-system gaps ─────────────────────────────────────────────── */
    {
      id: "ds-primary-cta-contrast",
      page: "org-wizard",
      kind: "required",
      title: "Confirm the primary CTA colour change",
      description:
        "Figma specifies primary/500 (#2aa7ff) for the Continue button. White text on it is 2.2:1 — below the WCAG AA 4.5:1 minimum. Shipped default is primary/700 (#0168dd, 4.6:1). Zone needs a documented accessible primary-button token either way.",
      target: "#btn-continue",
      priority: "high",
      sub: [
        "Revert by pointing --btn-primary-bg back at --primary-500 in styles.css",
        "Same question applies to the getting-started-template footer button",
      ],
    },
    {
      id: "ds-selected-state-token",
      page: "org-wizard",
      kind: "required",
      title: "Pick one selected-state colour for Zone",
      description:
        "The source file used #294dff (Hubstaff/Primary/Electric blue) for selected size chips and a different blue for selected cards. Both are now primary/700 with a primary/50 tint. Zone has no documented 'selected' semantic token.",
      target: "#team-size",
      priority: "high",
      sub: ["Selected borders are 2px so they clear the 3:1 non-text contrast bar"],
    },
    {
      id: "ds-label-gray-variant",
      page: "org-wizard",
      kind: "suggestion",
      title: "Recommendation badge needs a Zone Label variant",
      description:
        "\"Recommended, most used\" is built from purple tokens by hand. Zone's Label component has Purple but no small overlapping-pill size, and no neutral/gray colour for lower-emphasis flags.",
      target: ".badge",
    },
    {
      id: "ds-input-addon",
      page: "org-wizard",
      kind: "suggestion",
      title: "Add an input-with-addon component to Zone",
      description:
        "Email + role select, and invite link + Copy, are the same pattern: a field with an attached trailing control. Built locally as .input-group because Zone's Input field component has no addon slot.",
      target: "#invite-link",
    },

    /* ── Wiring left for engineering ────────────────────────────────────── */
    {
      id: "wire-navigation",
      page: "org-wizard",
      kind: "required",
      title: "Wire Back / Continue to real navigation",
      description:
        "Buttons currently move a local step counter in org-wizard.js. Replace with real routing, progress persistence, validation before advancing, and analytics events.",
      target: ".wizard-footer",
      priority: "high",
    },
    {
      id: "wire-org-form",
      page: "org-wizard",
      kind: "required",
      title: "Validate and submit the organization form",
      description:
        "Organization name is required and website should be URL-validated. Neither has an error state yet — Zone has no documented field error pattern for this form.",
      target: "#org-name",
      sub: ["Prefilled values are demo data and must come from the signup record"],
    },
    {
      id: "wire-goal-tailoring",
      page: "org-wizard",
      kind: "suggestion",
      title: "Confirm the goal → navigation mapping",
      description:
        "The preview sidebar changes per selected goal using a mapping invented for this build (GOAL_NAV in org-wizard.js). Only the 'Monitor our employees' mapping was specified in Figma; the rest need product sign-off.",
      target: "#goals",
    },
    {
      id: "wire-invite",
      page: "org-wizard",
      kind: "required",
      title: "Wire invites and the invite link",
      description:
        "Rows are client-side only. Needs real email validation, duplicate detection, a per-org invite link from the API, and a resend/remove affordance per row.",
      target: "#invite-users-panel",
      priority: "high",
      sub: ["Added rows currently have no remove button"],
    },
    {
      id: "wire-preview-assets",
      page: "org-wizard",
      kind: "suggestion",
      title: "Preview illustrations are CSS mocks, not exported images",
      description:
        "The in-product previews are rebuilt from tokens rather than exported from Figma, so they stay responsive, theme-able, and free of expiring asset URLs. Confirm the fidelity is acceptable before launch.",
      target: ".preview",
    },
  ],
};
