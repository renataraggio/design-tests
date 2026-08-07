/* Authored against NetsoftHoldings/design-team → general/design-annotations/AUTHORING.md
   The wizard is a single-page, four-step flow, so each step is registered as a
   "page" (see APPLY-DESIGN-ANNOTATIONS.md → Step 4B, single-page app). Targets
   must resolve inside their own step; annotations whose element only exists
   after a disclosure opens carry a `reveal` key. */

window.DESIGN_ANNOTATIONS_DATA = {
  pages: [
    { id: "step-1", label: "1 · Create your organization", route: "index.html" },
    { id: "step-2", label: "2 · Set your goals", route: "index.html" },
    { id: "step-3", label: "3 · Track time", route: "index.html" },
    { id: "step-4", label: "4 · Invite your team", route: "index.html" },
  ],

  annotations: [
    /* ── Design-system gaps ─────────────────────────────────────────────── */
    {
      id: "ds-primary-cta-contrast",
      page: "step-1",
      kind: "required",
      group: "Design-system gaps",
      title: "Confirm the primary CTA colour change",
      description:
        "Figma specifies primary/500 (#2aa7ff) for the Continue button. White text on it is 2.2:1 — below the WCAG AA 4.5:1 minimum. Shipped default is primary/700 (#0168dd, 5.22:1). Zone needs a documented accessible primary-button token either way.",
      target: "#btn-continue",
      match: "Continue",
      priority: "high",
      sub: [
        "Revert by pointing --btn-primary-bg back at --primary-500 in styles.css",
        "Same question applies to the getting-started-template footer button",
      ],
    },
    {
      id: "ds-selected-state-token",
      page: "step-1",
      kind: "required",
      group: "Design-system gaps",
      title: "Pick one selected-state colour for Zone",
      description:
        "The source file used #294dff (Hubstaff/Primary/Electric blue) for selected size chips and a different blue for selected cards. Both are now primary/700 with a primary/50 tint. Zone has no documented 'selected' semantic token.",
      target: "#team-size",
      priority: "high",
      sub: ["Selected borders are 2px so they clear the 3:1 non-text contrast bar"],
    },
    {
      id: "ds-label-gray-variant",
      page: "step-3",
      kind: "suggestion",
      group: "Design-system gaps",
      title: "Recommendation badge needs a Zone Label variant",
      description:
        "\"Recommended, most used\" is built from purple tokens by hand. Zone's Label component has Purple but no small overlapping-pill size, and no neutral/gray colour for lower-emphasis flags.",
      target: "#step-3 .badge",
      match: "Recommended, most used",
    },
    {
      id: "ds-input-addon",
      page: "step-4",
      kind: "suggestion",
      group: "Design-system gaps",
      title: "Add an input-with-addon component to Zone",
      description:
        "Email + role select, and invite link + Copy, are the same pattern: a field with an attached trailing control. Built locally as .input-group because Zone's Input field component has no addon slot.",
      target: "#invite-link",
      reveal: "expand-invite-users",
    },
    {
      id: "ds-border-contrast",
      page: "step-1",
      kind: "suggestion",
      group: "Design-system gaps",
      title: "gray/300 control borders fail WCAG 1.4.11",
      description:
        "The resting border on inputs, chips and cards is gray/300 on white — 1.47:1, against the 3:1 that 1.4.11 requires for control boundaries. Left as designed on purpose: changing it is a Zone-wide decision, not a one-screen fix.",
      target: "#org-website",
      sub: ["Affects every Zone form control, not just this flow"],
    },

    /* ── Wiring left for engineering ────────────────────────────────────── */
    {
      id: "wire-navigation",
      page: "step-1",
      kind: "required",
      group: "Wiring",
      title: "Wire Back / Continue to real navigation",
      description:
        "Buttons currently move a local step counter in org-wizard.js. Replace with real routing, progress persistence, validation before advancing, and analytics events.",
      target: ".wizard-footer",
      priority: "high",
    },
    {
      id: "wire-org-form",
      page: "step-1",
      kind: "required",
      group: "Wiring",
      title: "Validate and submit the organization form",
      description:
        "Organization name is required and website should be URL-validated. Neither has an error state yet — Zone has no documented field error pattern for this form.",
      target: "#org-name",
      sub: ["Prefilled values are demo data and must come from the signup record"],
    },
    {
      id: "wire-preview-assets",
      page: "step-1",
      kind: "suggestion",
      group: "Wiring",
      title: "Preview illustrations are CSS mocks, not exported images",
      description:
        "The in-product previews are rebuilt from tokens rather than exported from Figma, so they stay responsive, theme-able, and free of expiring asset URLs. Confirm the fidelity is acceptable before launch.",
      target: "#step-1 .preview",
    },
    {
      id: "wire-goal-tailoring",
      page: "step-2",
      kind: "suggestion",
      group: "Wiring",
      title: "Confirm the goal → navigation mapping",
      description:
        "The preview sidebar changes per selected goal using a mapping invented for this build (GOAL_NAV in org-wizard.js). Only the 'Monitor our employees' mapping was specified in Figma; the rest need product sign-off.",
      target: "#goals",
    },
    {
      id: "wire-tracking-preview",
      page: "step-3",
      kind: "suggestion",
      group: "Wiring",
      title: "Confirm the per-method device previews",
      description:
        "Selecting Desktop app / All platforms / Silent app swaps the device preview. The three Figma variants only differed by this illustration, so they were collapsed into one screen with three states.",
      target: "#tracking",
    },
    {
      id: "wire-invite",
      page: "step-4",
      kind: "required",
      group: "Wiring",
      title: "Wire invites and the invite link",
      description:
        "Rows are client-side only. Needs real email validation, duplicate detection, a per-org invite link from the API, and a resend/remove affordance per row.",
      target: "#invite-users-panel",
      reveal: "expand-invite-users",
      priority: "high",
      sub: ["Added rows currently have no remove button"],
    },
  ],
};
