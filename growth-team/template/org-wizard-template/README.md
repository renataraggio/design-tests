# Org wizard template

Production-ready rebuild of the Hubstaff organization-setup wizard, converted from Figma
onto the **[Zone] Tokens & Components** design system.

**Source** — [Growth Central — Design WIP Q3 2026](https://www.figma.com/design/mIutnQO9HnC08z3f4vvuzE/Growth-Central---Design-WIP--Q3-2026-?node-id=20709-23740)

| What | Figma node |
| --- | --- |
| Shell (the linked node — token-bound component) | `20709:23740` `blank-org-wizard` |
| Step screens (hand-built frames) | section `20603:8650` `Current Versions` |

Vanilla HTML/CSS/JS, no build step — same architecture as `../getting-started-template`.

```bash
python3 -m http.server 4005 --directory templates/org-wizard-template
```

Right-click anywhere, press <kbd>⌘⇧A</kbd>, or use the **Annotations** button to open the design-task drawer.

### Dev Mode

`dev-mode.js` is vendored unmodified from `NetsoftHoldings/product-team` →
`design/template/`. The **Dev Mode** toggle sits beside *Design tasks*: hover for a
box-model overlay, click any element for its resolved specs mapped back to Zone
tokens, click a colour row to recolour it live.

Use it to check this build actually uses the design system. Every colour on every
screen resolves to a named Zone token except three carried over from the Figma
source — `#617083`, `#dce2e8`, `#eaedf0` — which are flagged as a design task.

> Layout note: Dev Mode places its toggle immediately after `#da-tc-btn`, so
> mounting the Design tasks button into `#review-toolbar` (via the annotations
> engine's supported `taskCenter: { mount }` option) lands both buttons in that
> one container. They render as a single grouped control — one border, one
> shadow, a hairline between segments — and can't drift apart. Both engines
> stay unmodified fixed dependencies.

### Design annotations

The engine is vendored unmodified from the canonical source —
`NetsoftHoldings/design-team` → `general/design-annotations/` (see its `AUTHORING.md`
and `APPLY-DESIGN-ANNOTATIONS.md`).

This flow is a **single-page, four-step app**, so it's wired in SPA mode (Step 4B of
the apply guide): each wizard step is registered as a *page*, with a `currentPageId`
resolver, a `navigate` adapter, and a `reveal` handler for the collapsed
"Or, invite your users" disclosure. That matters — 4 of the 12 tasks target elements
that don't exist in the DOM until you're on the right step with the right section
open, so a single-page registration would leave their highlights dead.

One wrinkle worth knowing: the engine's cross-page path stashes the intent in
`sessionStorage` and expects a real page load to consume it. There isn't one here, so
the `navigate` adapter switches the step and re-enters `goToAnnotation`, which then
takes the same-page reveal-and-highlight branch.

All 12 tasks verified: each navigates to its step, reveals if needed, and highlights
exactly one element.

---

## The flow

Four steps, all driven from `STEPS` in `org-wizard.js`:

1. **Create your organization** — org name + website, team-size chips
2. **Set your goals** — 5 option cards; selection retailors the preview sidebar
3. **How do you want your team to track time?** — 3 option cards; selection swaps the device preview (desktop / desktop + phone / desktop + silent-app device stack)
4. **Invite your team** — manager invite, collapsible "Or, invite your users" with email invites + shareable link

---

## Per-screen summary

### Shell (all screens)

| Change | Detail |
| --- | --- |
| Font | **Ubuntu** (titles, field labels) and **Inter** (buttons) replaced with **Roboto**, the Zone product font. The page now renders in exactly two families: Roboto and Material Symbols Rounded. |
| Title | `34px` one-off → `font/size/4xl` **36 / 44 / 700**, `gray/900` |
| Subtitle | `grey/600(l)` → `--gray-500`, `font/size/sm` 14 / 20 |
| Progress bar | Was four absolutely-positioned 36×4 rects at 6–8px irregular gaps. Now a flex row, `--space-2` gap, `--radius-sm`, `gray/200` → `primary/500`. |
| Progress semantics | Source filled *n − 1* segments, so step 1 showed an empty bar and step 4 showed 3/4. Now fills *1…n*. |
| Footer | Padding standardised to `--space-3-5 --space-7-5`, `border-top` `gray/200`, buttons hug with a `124px` min-width instead of a fixed width. |
| Purple glow | Kept, but anchored to the shell rather than the scroll container so it can't ride up over the form on tall steps. |
| Content widths | Five ad-hoc column widths in the source (694 / 740 / 796 / 810 / 1000) collapsed to two tokens: `--content-wide: 1000px` (card grids, preview) and `--content-form: 740px` (form steps). |

### Step 1 — Create your organization

- Inputs: `39px` tall, `15px` left padding → `--space-10` (40) tall, `--space-2-5 --space-3-5` padding, `--radius-md`.
- Field labels: Ubuntu Medium `blue/900` → Roboto Medium `gray/900`.
- Team-size chips became a shared `.chip` radio component in a real `role="radiogroup"` — was seven independent unlabelled containers with one hardcoded `border-2 #294dff` selected state.
- Chip row is now a `repeat(auto-fit, minmax(88px, 1fr))` grid, so a short final row keeps its column width instead of stretching one chip across the container.

### Step 2 — Set your goals

- **The source frame had no heading at all** — no progress bar, no title, no subtitle. Restored from the shared shell; subtitle written to match (flagged for copy review).
- The five goal tiles became the same `.option-card` component used on step 3.
- The preview sidebar now re-renders per selected goal (`GOAL_NAV`). Only the *Monitor* mapping existed in Figma; the other four are proposals and are flagged for product sign-off.

### Step 3 — How do you want your team to track time?

- **Fixed a copy defect**: the "All platforms" variant carried step 1's subtitle ("This is how your workspace will display to your team."). All three variants now use the correct tracking-method subtitle.
- Three variant frames collapsed into **one screen with three selection states** — the device preview switches instead.
- "Recommended, most used" pill rebuilt on purple tokens as `.badge`.

### Step 4 — Invite your team

- Two variant frames (collapsed / expanded) collapsed into **one screen with a real disclosure** (`aria-expanded` / `aria-controls`).
- Email + role and link + Copy unified into one `.input-group` pattern.
- "+ Add another manager / member" now actually adds a row and focuses it.
- Copy button copies via the Clipboard API with a polite live-region confirmation and a select-text fallback.
- The preview member list is generated from what's actually been entered, and ignores rows inside the collapsed disclosure.

---

## Components replaced

| Figma / source | Now |
| --- | --- |
| 7 hand-drawn size pills | `.chip` in a shared `role="radiogroup"` |
| 8 hand-drawn goal / tracking tiles | one `.option-card` |
| 2 button styles (`Inter Medium`, fixed 124px) | `.btn` / `.btn--primary` |
| 4 absolutely-positioned progress rects | `.wizard-progress` |
| 5 `Field` instances at 3 sizes | `.input` on one 40px spec |
| email + role, link + Copy | `.input-group` |
| "Recommended, most used" | `.badge` (Zone `Label / Purple` tokens) |
| Raster preview images | CSS/HTML skeleton mocks — responsive, themeable, no 7-day expiring asset URLs |

---

## Design-system gaps

All flagged in-app as design tasks (Annotations drawer, `group: "Design-system gaps"`) — nothing was invented that Zone already covers.

1. **No accessible primary-button token.** Figma's `primary/500` (#2aa7ff) with white text is **2.2:1** — fails WCAG AA. Shipped default is `primary/700` (#0168dd) at **5.22:1**. One token to revert: `--btn-primary-bg`. `getting-started-template` has the same issue.
2. **No "selected" semantic token.** Source used `#294dff` for chips and a different blue for cards. Unified on `primary/700` + a `primary/50` tint at 2px (5.22:1, clears the 3:1 non-text bar).
3. **Resting borders fail 1.4.11.** `gray/300` on white is **1.47:1**, below the 3:1 required for control boundaries. Left as-is deliberately — changing it is a Zone-wide decision, not a one-screen fix.
4. **`Label` has no small overlapping-pill size and no gray.** The recommendation badge is hand-built from purple tokens.
5. **`Input field` has no addon slot.** `.input-group` is local; the pattern appears twice on step 4 alone.
6. **No documented field error state**, so the required-field validation on step 1 has nothing to render into.

---

## Accessibility

- `role="radiogroup"` with roving tabindex, arrow-key cycling, and Home/End on both radio groups
- `role="progressbar"` with `aria-valuetext` ("Step 2 of 4")
- Polite live region announces each step change
- Disclosure wired with `aria-expanded` / `aria-controls`
- Every input has a real `<label for>`; icons are `aria-hidden`; previews are `aria-hidden` decoration
- 2px focus ring at `--focus-ring` on every interactive element
- `prefers-reduced-motion` honoured
- All text passes AA: CTA 5.22, subtitle 4.83, card descriptions 4.83, links 5.22

## Responsive

**Width**

- ≤1200 — shell padding drops to `--space-10`
- ≤900 — cards to 2 columns, title to 28px, preview sidebar and phone narrow (kept, not cut: they carry the "your workspace changes with this choice" signal)
- ≤640 — single column, title 24px, footer stacks (Back above Continue), heaviest preview chrome drops out, the mock table keeps only its first two columns

**Height** — width breakpoints alone left landscape phones and short laptop
windows cramped, since the 36px title, 56px padding and fixed-height preview
mocks ate the whole screen.

- ≤720 — tighter vertical rhythm, preview mocks shrink
- ≤560 — title to 24px, and the preview and ambient glow drop out entirely so the controls stay on screen

**Touch targets** — "+ Add another…" is 20px tall and the "Or, invite your
users" disclosure is 24px. Both now carry a `::after` that expands the hit area
to 44px without changing layout, so the visual design is untouched.

Verified across **320×640, 375×667, 768×1024, 812×375, 1024×768, 1440×900 and
1920×1080** on all four steps with the invite disclosure expanded: no horizontal
scrolling, every control reachable, and no interactive element under 40px of
effective hit area.

## Files

```
index.html                  4 steps + shared shell
styles.css                  tokens → components → responsive
org-wizard.js               step config, radio groups, preview state, invites
design-annotations.js       vendored review tool (unmodified)
design-annotations.data.js  12 design tasks, one page per wizard step
dev-mode.js                 vendored Zone-token inspector (unmodified)
assets/                     logo-mark.svg, arrow-right.svg
```
