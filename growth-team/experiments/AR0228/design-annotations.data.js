/* AR0228 — design annotations
 *
 * Authored against NetsoftHoldings/design-team → general/design-annotations/AUTHORING.md.
 *
 * The flow is a single page with three stacked dialogs, so each dialog is
 * registered as its own "page" (APPLY-DESIGN-ANNOTATIONS.md → Step 4B,
 * single-page app). The `navigate` adapter in index.html opens the right dialog
 * before the engine highlights, so cross-dialog links work.
 *
 * Every entry below is a recorded delta between the Figma (section 141:10069)
 * and either the shipped Zone tokens or the existing hubstaff-server
 * implementation — not invented work. Sources are named in each description so
 * they can be checked rather than taken on trust.
 */

window.DESIGN_ANNOTATIONS_DATA = {
  pages: [
    { id: 'organizations', label: 'Organizations (list)',     route: 'index.html' },
    { id: 'archive',       label: '1 · Archive organization', route: 'index.html' },
    { id: 'offer',         label: '2 · Switch to Essentials', route: 'index.html' },
    { id: 'done',          label: '3 · Confirmation',         route: 'index.html' },
  ],

  annotations: [
    /* ── Open questions from the design itself ──────────────────────────── */
    {
      id: 'targeting-rule-unconfirmed',
      page: 'offer',
      kind: 'required',
      group: 'Open questions',
      title: 'Confirm the targeting rule before build',
      description:
        'The Figma section note reads "exclude where member_count > 4 at assignment — orgs over the cap never see this offer??". The "??" is in the design. This prototype builds what that sentence says, which is why there is no member-count branch and no member-removal step. If orgs over the cap DO see the offer, a step is missing — an earlier revision had a "Remove N members to switch" modal.',
      target: '.offer__cap',
      match: 'Essentials is capped at 4 members',
      priority: 'high',
      sub: [
        'If they never see it: nothing to build, close this out',
        'If they do: the removal modal from the earlier revision needs reinstating',
      ],
    },
    {
      id: 'archive-copy-typos',
      page: 'archive',
      kind: 'required',
      group: 'Open questions',
      title: 'Two typos in the data-removal line',
      description:
        'The bold line reads "The following data will be immediately removed immediately after the end of you current billing cycle:" — "immediately" appears twice, and "you current" should be "your current". Reproduced verbatim so the prototype matches the design; needs fixing at source.',
      target: '.archive__lede--strong',
      match: 'immediately removed immediately',
      priority: 'high',
    },
    {
      id: 'continue-to-cancel-destination',
      page: 'offer',
      kind: 'required',
      group: 'Open questions',
      title: '"Continue to cancel" leaves the flow',
      description:
        'The Figma annotates this button as "Goes to plan page", a destination outside this section. Nothing in this flow archives an organization any more, so confirm where cancellation actually completes — and whether ArchiveFeedbackDialog still sits on that path.',
      target: '[data-action="continue-to-cancel"]',
      match: 'Continue to cancel',
      priority: 'high',
    },
    {
      id: 'feedback-dialog-missing',
      page: 'archive',
      kind: 'required',
      group: 'Open questions',
      title: 'No feedback step after Archive organization',
      description:
        'FLOWS.with_offer in ArchiveOrganizationFlow.vue ends with a "feedback" step (ArchiveFeedbackDialog.vue), which the Figma has never covered. This revision removed the toast and every path that completes an archive — "Continue to cancel" hands off to the plan page instead. Decide whether the feedback step is dropped or simply lives on that page.',
      target: '.dialog--archive .btn--subtle',
      match: 'Archive organization',
      priority: 'medium',
    },
    {
      id: 'plan-end-date-binding',
      page: 'offer',
      kind: 'required',
      group: 'Open questions',
      title: 'Bind <plan end date> to the real renewal date',
      description:
        'The offer copy carries a literal "<plan end date>" placeholder, reproduced as-is. Needs the organization\'s actual annual-plan end date, and a decision on format (e.g. "12 March 2027") and on what shows if the org is on a monthly plan.',
      target: '.offer__lede strong',
      match: '<plan end date>',
      priority: 'medium',
    },
    {
      id: 'ds-semantics-red-fork',
      page: 'archive',
      kind: 'required',
      group: 'Design-system gaps',
      title: 'Two red ramps are live in this one dialog',
      description:
        'The callout banner binds semantics/red/* (#fff1f1 bg, #fcdada border, #970909 text), a different collection from Zone red/* (#fdf2f2, #fde8e8, #9b1c1c) — they disagree at every stop. Zone red/* is used elsewhere in the product for the same semantic role. Pick one before this ships.',
      target: '.cq__banner',
      priority: 'high',
      sub: ['Verified against hubstaff-server config/zone/tailwind-tokens.json'],
    },
    {
      id: 'ds-primary-cta-contrast',
      page: 'offer',
      kind: 'required',
      group: 'Design-system gaps',
      title: 'Primary CTA fails WCAG AA at 2.2:1',
      description:
        'Every primary CTA in this flow is primary/500 (#2aa7ff); white text on it is 2.2:1, under the 4.5:1 AA minimum. primary/700 (#0168dd) gives 5.22:1. Zone-wide rather than AR0228-specific, but this flow puts it on all three dialogs — Keep organization, Switch to Essentials and Close.',
      target: '.dialog--offer .btn--primary, .dialog--done .btn--primary, .dialog--archive .btn--primary',
      priority: 'high',
    },
    {
      id: 'ds-gray-900-drift',
      page: 'offer',
      kind: 'suggestion',
      group: 'Design-system gaps',
      title: 'gray/900 in Figma does not match the shipped token',
      description:
        'Modal titles bind gray/900, which resolves to #111928 in this Figma file but is #111827 in the shipped Zone tokens. The prototype uses the shipped value. Worth reconciling in the library rather than per file.',
      target: '.mdl__title',
      priority: 'low',
    },
  ],
};
