# AR0239 — Get Started checklist · V5 (standalone)

Vanilla-JS, no-build port of **V5** of the Kit prototype
(`product-team/product/squads/growth/experiments/AR0239/prototype/`, `#v=v5`). Open `index.html`
from any static server. Sibling folder `../AR0239-v3` is the older V3-only port, left untouched.

**What V5 is** (details and rationale in the Kit's README § "V5 + V4 follow-ups (2026-10-02)"):
- Welcome = Figma `step-1-welcome-screen` (AR0219 node 10113:293), animated, no auto-advance;
  **Get started** enters the checklist. Fixed 872×611 stage scaled down to fit (`fitWelcome()`),
  stacked below 768px. Assets in `assets/v5-welcome/`.
- Steps: *Create your org* (V2 illustration), *Create your first teams*, *Customize your first
  project* (V4 form), *Set member limits*, *Set member payment details*, *Connect to payroll*
  (payroll condition), *Create smart notification*, *Start tracking time* (dashboard sneak-peek,
  frame capped at 520px, `fitCo()`), *Invite your team*. Rail label = card title everywhere
  except step 1.
- Widget capped at 1280px (`.qs-wrap`). "Organization set-up" recap removed (as in the Kit).

**Differences from the Kit:** hand-written Zone-token CSS instead of Tailwind; `<select>` for
Client instead of the Zone listbox; Create-org V2 SVG colours via `.fill-*`/`.stroke-*` helper
classes; motion CSS is `v5-*` (see Kit's `animations-handoff.md`). Not verified: stacked
sub-768px welcome, viewports under 700px tall, side-by-side overlay diff against Figma.
