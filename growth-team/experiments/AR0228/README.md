# AR0228 — Essentials VSMB churn discount offer

A clickable HTML prototype of the archive → Essentials-offer flow, built from
Figma section
[`141:10069`](https://www.figma.com/design/C6zD5OvCHjVV58h0SOe4HO/AR0228--Essentials-VSMB-Churn-Discount-Offer?node-id=141-10069)
and cross-checked against `app/javascript/components/organization_archive/`
in `hubstaff-server`.

## Run it

```bash
python3 -m http.server 4006 --directory experiments/AR0228
```

Wired into `.claude/launch.json` as `AR0228` (port 4006). Opens as a plain
`file://` too — no build step.

## Flow

The consequences come **first**, then the offer — which is also the order the
shipped `ArchiveOrganizationFlow.vue` uses (`FLOWS.with_offer =
['consequences', 'offer', 'feedback']`). This has changed direction across
revisions; the current design agrees with the code.

```
Actions ▾ → Archive organization
  → 01 Archive organization           156:16588   600 × 566
       "Archive organization" → 02
       "Keep organization"    → close
  → 02 Switch to Essentials instead   153:11279   600 × 566
       "Switch to Essentials" → 03
       "Continue to cancel"   → the plan page (outside this section)
  → 03 Essentials starts when your plan ends   153:11761   410 × 420
```

**Nothing in this flow archives an organization any more.** The archived toast
is gone, and "Continue to cancel" hands off to a plan page the section doesn't
draw. Worth confirming where cancellation actually completes.

## Files

```
index.html   markup: Organizations page + 3 modals
styles.css   page and modal styles (shell chrome excluded)
flow.js      dialog state machine
demo.js      self-running walkthrough (not part of the design)
layout.js    shell init (activeItem: 'settings')
assets/      icon + banner SVGs, and assets/success/ (66 illustration layers)
tools/       build-illustration.py — regenerates the success illustration
```

Built on the shared `hubstaff-shell.js` from `design assets/`, which already
provides the top bar, sidebar and popovers.

## Pixel verification

All measured checkpoints match the Figma exactly (0px delta): every modal's
outer size, header/body/content/footer heights, the plan-comparison card, both
keep/lose columns, the callout banner, its illustration and the success
illustration frame. Page geometry was verified separately to within 1px.

Two things had to be right for that:

- **`box-sizing: border-box` globally.** Figma frame sizes are border-box —
  `141:6262` is 600px wide *including* its 1px stroke, and the 57px Header
  includes its own 20/10 padding. Without it the offer modal measured 602 × 598.
- **Figma strokes are *inside* strokes and don't consume layout.** A CSS
  `border` does, which left every modal 2px too tall and the keep/lose columns
  1px too narrow. They are now `box-shadow: inset 0 0 0 1px` instead, which
  paints in the same place without taking space. Real borders are kept on the
  Organizations table, where the measurements were taken *with* borders.

One bug worth recording, because it has now bitten twice: a selector written as
`.cq__item span` also matched the icon wrapper and outranked `.errico`
(specificity 0,1,1 vs 0,1,0), stretching a 14px icon to `flex: 1`. Text inside
an icon-plus-label row needs its own class.

The Organizations page geometry is measured off a flattened screenshot
(node `image 15`, a 2374px capture of a 1200px layout) because that page is a
bitmap in the Figma, not vector layers — content box x 30 → 1170, table rules
2px header / 1px rows in `gray/200`, 16px cell padding, 64px row pitch. Tab
tracking was solved for rather than guessed: `.8px` reproduces the measured
98.6px active-tab underline and 215.4px strip.

## Demo mode

The old jump-to-step control panel is gone — it permanently covered the third
organization row, and the flow is now only two clicks deep. In its place:

- **Play demo** — runs both branches with captions (~22s), then resets itself.
  It drives the real controls with `.click()`, so it exercises the same code
  paths as manual use. Any real click or Escape hands control back immediately.
- **Reset** — clears the switched state.
- Keys **1–3** jump straight to a step, for reviewers who want one state.

Both live in a small pill bottom-left. Not part of the design.

## Verified against the repo

- Flow naming (`consequences` / `offer`) comes from `ArchiveOrganizationFlow.vue`,
  whose `FLOWS.with_offer` is `['consequences', 'offer', 'feedback']`. This
  revision's order matches it; earlier revisions ran the first two inverted.
- The experiment flag exists: `offerSgtEssentialsPlan: sgt_essentials_experiment.enabled?`
  at `app/decorators/organization_decorator.rb:102`, and `cheapestPlanName`
  already resolves to `'Essentials'` when it's on.
- `ArchiveOfferDialog.vue` today is a plan-comparison modal ("Want to try a more
  affordable plan?"). The Figma replaces it wholesale — neither "Switch to
  Essentials instead" nor "Essentials includes" exists anywhere in
  `hubstaff-server`. This is net-new design.

## Token audit

Values verified against the **shipped** source, `config/zone/tailwind-tokens.json` —
not the Figma, which disagrees with it. `styles.css` defines Zone tokens as
`--z-*` and quarantines off-system values as `--x-*` so drift can't pass as
design-system usage.

**A second red ramp.** The archive modal binds `semantics/red/*`, a different
collection from Zone's `red/*`, disagreeing at every stop:

| | design | Zone |
|---|---|---|
| red/50 | `#fff1f1` | `#fdf2f2` |
| red/100 | `#fcdada` | `#fde8e8` |
| red/800 | `#970909` | `#9b1c1c` |

Reproduced as designed, but worth resolving: Zone's `red/*` is what the rest of
the product uses for this same semantic role, so the callout is the odd one out.

Other findings, unchanged from the previous pass: `gray/900` resolves to
`#111928` in the Figma vs `#111827` shipped; the Organizations page predates
Zone and uses the legacy Product DSM palette (`#2d3137`, `#7a8798`) while the
modals use Zone properly.

**Contrast.** Every primary CTA is `primary/500 #2aa7ff`, **2.2:1** with white
text — below WCAG AA's 4.5:1. `primary/700 #0168dd` gives 5.22:1. Zone-wide
rather than AR0228-specific, but this flow puts it on all three dialogs —
Keep organization, Switch to Essentials and Close.

## Open questions — flagged, not resolved

1. **Two typos in the archive copy.** The bold line reads *"The following data
   will be immediately removed immediately after the end of you current billing
   cycle:"* — "immediately" twice, and "you current" for "your current".
   Reproduced verbatim so the prototype matches the design; needs fixing at
   source.
2. **"Continue to cancel" leaves the flow.** The Figma annotates it "Goes to
   plan page". Since nothing here archives any more, confirm where cancellation
   completes — and whether `ArchiveFeedbackDialog` sits on that path.
3. **The targeting rule is still written as a question** — *"exclude where
   member_count > 4 at assignment — orgs over the cap never see this offer??"*.
   The `??` is the designer's. Built as written, which is why there is no
   member-count branch.
4. **`font/style/upppercase`** — the uppercase type token is spelled with three
   p's in the Figma variable collection.

Resolved since the last revision: the callout rows carry live counts again
("1 Project", "All recorded screenshots for 1 member") rather than the static
copy that replaced `ArchiveConsequencesDialog.vue`'s interpolation, so the
prototype rebuilds them with real pluralisation per organization.

## Known simplifications

- Org avatars are initials circles; the Figma's flattened screenshot shows real
  logos, which weren't fabricated.
- `ARCHIVED` tab and `Add organization` are inert.
- Usage counts per organization are fictional, but pluralise for real.
- `trackEvent()` logs to the console. Names reuse the real ones where they exist
  (`Keep organization clicked`, `Archive offer viewed`); the rest are proposals.
- Org names and the plan dates are fictional; `<plan end date>` is left as the
  literal placeholder the design shows.
- Colour scheme is pinned to light — Zone's `Colors` collection has a Light mode
  only.

## Regenerating the success illustration

`tools/build-illustration.py` downloads the 66 vector exports and emits the
72 positioned layers. Two things it encodes that are easy to get wrong:

- Coordinates resolve against the **370 × 220 illustration frame**. Figma's
  `display: contents` wrappers make this ambiguous in the generated code; it was
  settled by measuring Figma's own render — the blue disc spans x 93→276,
  matching `left: 93`.
- Percentage insets are resolved to explicit px. An `<img>` is a replaced
  element: with all four insets and `auto` dimensions it renders at its
  *intrinsic* size and the insets only position it.

The asset endpoint answers `202` with an empty body while rendering, so the
script fetches with curl and retries; `urllib` silently yields zero bytes.
