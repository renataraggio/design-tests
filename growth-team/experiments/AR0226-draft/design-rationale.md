# AR0226 — Member Switcher Pattern for GAP Team Managers

## Segment context: GAP Teams

**GAP** = Growth's internal segment name for the "Gap Team" pillar — orgs with **7–50 seats**, with **Gap Team GRR as the North Star metric**. Within that pillar, the validated primary persona is **"The Remote Team Overseer"**: an owner/ops manager (often the *only* person managing the team in Hubstaff) overseeing distributed VAs, freelancers, or offshore contractors. Their core job-to-be-done is trust and verification, not productivity optimization — *"give me proof that the people I can't see are actually doing the work I'm paying for."*

Full persona detail: [`../gap-teams/GAP-team-persona.md`](../gap-teams/GAP-team-persona.md).

Why this matters for this pattern specifically:
- These managers often oversee people **outside their tight day-to-day loop** (VAs, contractors, partial-fit staff) — so "find someone I don't check often" (UC1) is a real, frequent need, not an edge case.
- Monitoring gaps and lack of live oversight are named as a top-3 churn driver (26% of at-risk revenue in the win/loss study) — a faster, friendlier way to move between people's activity directly reduces churn risk, not just a UX nicety.
- Team sizes here are small (1–30 tracked users) but often include people the manager doesn't trust yet, or is actively concerned about — so the pattern needs to support both "my steady team" and "someone I'm specifically watching" without conflating the two.

## Use cases

| Priority | Use case | Need |
|---|---|---|
| P1 | **UC1** — "I'm looking for Carl, not on my immediate team, don't work with him regularly. What's he up to?" | Fast search/lookup for someone unfamiliar, with a way to make next time faster |
| P1 | **UC2** — "I always have the same 4 people. I want to see what each is up to in under 3 minutes." | Persistent, low-friction quick-switch across a fixed small team |
| P2 | **UC3** — "I'm concerned about Carl's performance specifically. I want to keep an eye on him." | Elevate one specific, possibly-unfamiliar person into recurring, easy-to-reach visibility — distinct from "my regular team" |

## Pattern: Member Switcher (pills + pin + recent)

One unified component, three states of use. Extends the existing pill row + search pattern already on the Dashboard (see screenshot reference — Adrian Goia / Aaron Carter / David Edwards pills, search with recent searches + all members list).

**Structure:**
1. **Pinned pills row** — horizontal, avatar + name, selected pill gets the existing blue highlight. Two pin *kinds*, distinguished by a small badge on the avatar:
   - ⭐ **Team pin** — the manager's steady roster (UC2).
   - 👁 **Watching pin** — an ad-hoc pin for someone under closer attention, regardless of team membership (UC3). Keeping this visually distinct from Team pins matters — it tells the manager *why* this person is pinned, and avoids quietly turning a "let me keep an eye on this one" flag into a permanent team-roster entry.
2. **Search pill (“+”)** at the end of the row — opens the existing search panel: input → **Recent searches** (persists even if not pinned) → **All members** (full list, each row has a pin toggle). This is how UC1 resolves: Carl isn't pinned or recent, so he surfaces from All Members; the manager can view him immediately and optionally pin him (Team or Watching) so next time is faster.
3. **Compare/Scan toggle** — switches from single-person view to a compact multi-person grid (avatar, status, activity %, work time per card) across the currently pinned **Team** members. This is what makes UC2's "4 people in under 3 minutes" realistic — one glance instead of four sequential pill clicks.
4. **Empty state** — no pins yet: a friendly “Pin your team →” prompt pill that opens the search panel.

## Deliverable

Native Figma frames built directly on the target page (reusing existing pill/avatar/search components already in the file), showing:
- **Frame — UC1**: search panel open, "Carl" typed, found under All Members (not Recent/Pinned), with the pin affordance surfaced.
- **Frame — UC2**: 4 Team-pinned pills + Compare view showing all 4 at a glance.
- **Frame — UC3**: Carl pinned with the distinct "Watching" badge, individual view open with unusual-activity flags visible.

**Built in Figma:** wrapper frame "Member Switcher — Use Case Explorations" at [node 20170:1371](https://www.figma.com/design/mIutnQO9HnC08z3f4vvuzE/Growth-Central---Design-WIP--Q3-2026-?node-id=20170-1371), on page "AR0226: Dashboard for Gap Team Managers".

| Use case | Frame | Node |
|---|---|---|
| UC1 — Find Carl | search panel open, Carl found only under All Members, pin affordance emphasized | `20172:15` |
| UC2 — Team of 4 in 3 min | 4 Team-pinned pills (star badge) + Compare-view mini-grid | `20177:80` |
| UC3 — Watching Carl | Carl pinned with distinct eye "Watching" badge + his flagged unusual-activity view | `20184:5` |

**Reused from the existing design system:** `WithName` (avatar+name pill), `Search with autocomplete` (incl. nested Avatar/Checkbox/icon sub-components), `Pill - Read only`, `withStatus`, `Toggle buton`, icons (`push_pin/18`, `star/18`, `visibility/18`, `grid_view/18`), text styles (`H4 - Body text/Regular`, `H2 - Subtitle`), and color variables (`blue/700`, `blue/100`, `grey/300`, `white`, `yellow/600`, `purple/500`) — all from the file's "[Zone] Tokens & Components" library.

**Newly created (no existing equivalent):**
- `Pin Badge / Team (Star)` and `Pin Badge / Watching (Eye)` — small local components combining existing icons + tokens, since no pin-reason badge existed yet.
- `Team Status Mini Card` — avatar + name + activity % + work time, for the UC2 compare grid.
- UC3's alert card is a manual rebuild of the dashboard's existing "unusual activity" visual pattern (that pattern wasn't itself a reusable component), but reuses the real `Pill - Read only` component for the "Highly unusual" tag.

**Not built:** the pattern's 4th element — the "Pin your team →" empty state — wasn't one of the 3 requested use-case frames, so it exists only as a written spec above, not a Figma frame yet.

## Dashboard tab placement

The member-overview page (with the pill switcher above) lands inside Hubstaff's existing Dashboard, which already has **Me** (personal, customizable widgets — Weekly Activity, Timesheet, To-dos, etc., via "Manage widgets") and **All** (aggregate team roll-up) tabs. Confirmed against staging (`/dashboard/716/me` and `/dashboard/716/team`) that neither tab's widget set overlaps with the new monitoring-style content (per-day Time & Activity, Unusual Activity Details, Manual Time) — so this is a third, distinct tab rather than a merge into Me.

- **Tab name:** "Members" — avoids colliding with "All" (which already maps to the `/team` route/concept).
- **Order:** Members → Me → All. Groups the two single-person tabs adjacent to each other, with the aggregate tab as the visually distinct third.
- **Default tab:** **Members**, since it's the new primary entry point for this workflow. (Open question worth checking with the team: if regular non-manager users don't have permission to view other members, they'd need to keep defaulting to Me — Members-as-default likely only applies to roles with that visibility.)

Built in Figma: detached the file's existing (previously hidden, 5-slot) "Horizontal tabs" component into a plain frame so a 3rd tab could be added — node [`20306:4883`](https://www.figma.com/design/mIutnQO9HnC08z3f4vvuzE/Growth-Central---Design-WIP--Q3-2026-?node-id=20306-4883), sitting directly above the pill switcher on the "Dashboard Zone - (01)" frame ([`20291:11017`](https://www.figma.com/design/mIutnQO9HnC08z3f4vvuzE/Growth-Central---Design-WIP--Q3-2026-?node-id=20291-11017)).
