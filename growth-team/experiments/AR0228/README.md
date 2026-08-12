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

The offer now comes **first**; the archive consequences appear only if it is
declined. This is inverted from the earlier design, which asked for archive
confirmation before making the offer.

```
Actions ▾ → Archive organization
  → 01 Switch to Essentials instead        141:6262   600 × 566
       "Switch to Essentials"  → 03 confirmation
       "Archive organization"  → 02
  → 02 Archive organization                141:6710   600 × 497
       "Archive organization"  → row archived + 04 toast
       "Go back"               → 01
  → 03 Essentials starts when your plan ends  141:6390   410 × 420
  → 04 Toast — organization archived          141:6635   350 × 96
```

## Files

```
index.html   markup: Organizations page + 3 modals + toast
styles.css   page, modal and toast styles (shell chrome excluded)
flow.js      dialog state machine
demo.js      self-running walkthrough (not part of the design)
layout.js    shell init (activeItem: 'settings')
assets/      10 icon SVGs + assets/success/ (66 illustration layers)
tools/       build-illustration.py — regenerates the success illustration
```

Built on the shared `hubstaff-shell.js` from `design assets/`, which already
provides the top bar, sidebar and popovers.

## Pixel verification

All **24** measured checkpoints match the Figma exactly (0px delta): every
modal's outer size, header/body/content/footer heights, the plan-comparison
card, both keep/lose columns, the two warning panels, the toast, and the
illustration frame. Page geometry was verified separately to within 1px.

Two things had to be right for that:

- **`box-sizing: border-box` globally.** Figma frame sizes are border-box —
  `141:6262` is 600px wide *including* its 1px stroke, and the 57px Header
  includes its own 20/10 padding. Without it the offer modal measured 602 × 598.
- **Figma strokes are *inside* strokes and don't consume layout.** A CSS
  `border` does, which left every modal 2px too tall and the keep/lose columns
  1px too narrow. Nine of them are now `box-shadow: inset 0 0 0 1px` instead,
  which paints in the same place without taking space. Real borders are kept on
  the Organizations table, where the measurements were taken *with* borders.

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
- **Reset** — clears switched/archived state.
- Keys **1–4** jump straight to a step, for reviewers who want one state.

Both live in a small pill bottom-left. Not part of the design.

## Verified against the repo

- Flow naming (`consequences` / `offer`) comes from `ArchiveOrganizationFlow.vue`,
  whose `FLOWS.with_offer` is `['consequences', 'offer', 'feedback']` — note the
  Figma now runs the first two in the opposite order.
- The experiment flag exists: `offerSgtEssentialsPlan: sgt_essentials_experiment.enabled?`
  at `app/decorators/organization_decorator.rb:102`, and `cheapestPlanName`
  already resolves to `'Essentials'` when it's on.
- `ArchiveOfferDialog.vue` today is a plan-comparison modal ("Want to try a more
  affordable plan?"). The Figma replaces it wholesale — none of "Switch to
  Essentials instead", "Essentials includes", or "Access & Tool Lockout" exist
  anywhere in `hubstaff-server`. This is net-new design.

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

Reproduced as designed, but worth resolving — the same modal uses Zone's
`red/700 #c81e1e` for the destructive button and Zone's `red/800` for the
warning icon, so both ramps are live in one dialog.

Other findings, unchanged from the previous pass: `gray/900` resolves to
`#111928` in the Figma vs `#111827` shipped; the Organizations page predates
Zone and uses the legacy Product DSM palette (`#2d3137`, `#7a8798`) while the
modals use Zone properly.

**Contrast.** Every primary CTA is `primary/500 #2aa7ff`, **2.2:1** with white
text — below WCAG AA's 4.5:1. `primary/700 #0168dd` gives 5.22:1. Zone-wide
rather than AR0228-specific, but this flow puts it on three dialogs. The
destructive `red/700` button passes at 5.9:1.

## Open questions — flagged, not resolved

1. **The targeting rule is written as a question.** The section's own note
   reads *"exclude where member_count > 4 at assignment — orgs over the cap
   never see this offer??"* — the `??` is the designer's. The prototype builds
   what that sentence says (no member-count branch, no removal step), but if
   the answer turns out to be "they do see it", a step is missing: the earlier
   design had a "Remove N members to switch" modal that this section drops.
2. **The consequences copy went static.** The redesign says "All projects and
   To-dos will be cleared" where `ArchiveConsequencesDialog.vue` interpolates
   live counts ("12 Projects and 34 To-dos", "10000+ Screenshots for 6 members")
   with real pluralisation and a 10,000 cap. Losing the specifics weakens the
   loss-aversion the dialog exists to create. Worth confirming this is
   intentional rather than placeholder copy.
3. **`ArchiveFeedbackDialog` is still absent.** Production ends the archive path
   with a feedback step; the Figma has never covered it. The prototype archives
   and toasts directly.
4. **`font/style/upppercase`** — the uppercase type token is spelled with three
   p's in the Figma variable collection.

## Known simplifications

- Org avatars are initials circles; the Figma's flattened screenshot shows real
  logos, which weren't fabricated.
- `ARCHIVED` tab and `Add organization` are inert.
- `trackEvent()` logs to the console. Names reuse the real ones where they exist
  (`Archive organization confirmed`, `Archive offer viewed`); the rest are proposals.
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
