# Handoff: Dashboard — Members (Hubstaff Zone)

## Overview

A redesign of the Hubstaff **Dashboard** page that introduces a **pinned-members** model. Instead of a member dropdown, admins pin up to **10** members as pills directly under the page tabs; clicking a pill switches the whole dashboard to that member's data. A second view (**Compare**) shows every pinned member side by side as stat cards.

The page lives inside the standard Hubstaff Zone app shell (240px collapsible sidebar + 56px global header with the persistent timer).

## About the Design Files

The files in this bundle are **design references created in HTML** — prototypes that demonstrate the intended look, spacing, and behavior. They are **not production code to copy directly**.

The task is to **recreate these designs in the target codebase's existing environment** (React, Vue, Rails views, etc.) using its established component library, styling approach, and state patterns. If no environment exists yet, choose the most appropriate framework and implement there.

`Dashboard v3.dc.html` uses a proprietary template runtime (`<x-dc>`, `{{ }}` holes, `<sc-for>`, `<sc-if>`) — read it for **values and structure**, not as a code pattern to port. `Hubstaff Dashboard v3.html` is a self-contained standalone build you can open in a browser to click through the real behavior.

## Fidelity

**High-fidelity (hifi).** Colors, type, spacing, radii, and interaction states are final and were taken verbatim from the source Figma (`Testing Claude Prototype.fig`, frame `AR0226 Zonified version V.3`). Recreate pixel-perfectly using the codebase's existing Zone components where they exist.

Where the prototype uses a raw `rgb()` value, that is the Figma value; map it to the equivalent Zone token in code (mapping table under **Design Tokens**).

---

## Screens / Views

### 1. Dashboard — Individual view (default)

**Purpose:** review one member's week — totals, day-by-day time & activity, unusual-activity flags, manual time entries, project and app/URL breakdowns.

**Layout** (top to bottom, inside the content column right of the sidebar):

| Region | Spec |
| --- | --- |
| Global header | 56px tall, white, 1px bottom border `#E5E7EB`, horizontal padding 20px. Timer pill left, icon cluster + avatar right. |
| Page header (sticky) | `position: sticky; top: 0; z-index: 15`. Background **transparent** (inherits page `#F9FAFB`) — **no white fill, no bottom border, no shadow**. Padding `16px 24px 0`. |
| — Page title | "Dashboard", 24px / 32px, weight 300, `#111827`. |
| — Date range | 14px / 20px, `#374151`, 2px below the title. Example: `Mon, Mar 2, 2026 – Sun, Mar 8, 2026`. |
| — Tab row | Padding `20px 24px 0`, flex row, `align-items: flex-end`, **gap 24px**. |
| Pins row | Padding `20px 24px 0`. Flex row, `flex-wrap: wrap`, **gap 8px**, `align-items: center`. Wraps to multiple lines as pins are added. |
| Content stack | Padding `20px 24px`, flex column, **gap 20px**. Scrolls under the sticky header. |

**Tabs** — borderless text tabs, each `height: 36px; padding: 0 2px 8px; border-bottom: 2px solid`:

- `MEMBERS` — active. Label 14px / 20px, weight 600, uppercase, `#0168DD`. Underline `2px solid #0168DD`. Followed (8px gap) by a **NEW badge**: height 16px, `border-radius: 9999px`, background `#E8D2FF`, padding `0 8px 0 6px`, 2px gap; contains a 12px `bolt` icon and the text `NEW` at 12px / 16px weight 700, both `#5427A7`.
- `ALL` and `ME` — inactive. 14px / 20px, weight 500, uppercase, `#6B7280`, `border-bottom: 2px solid transparent`.

**Member pin pill** (one per pinned member):

- `height: 32px`, `padding: 4px 10px 4px 6px`, `gap: 4px`, `border-radius: 9999px`, `max-width: 160px`, `white-space: nowrap`, 1px border.
- Selected: border `#0168DD`, background `#EAF6FF`, label + close icon `#0168DD`.
- Unselected: border `#E5E7EB`, background `#FFFFFF`, label + close icon `#6B7280`.
- Avatar: 24px circle, left.
- Label: 14px / 20px, centered, `overflow: hidden; text-overflow: ellipsis`.
- Close (`close`, 18px in a 20×20 hit box): only on removable pins — the current user's own pill has no close affordance.
- Whole pill is clickable → selects that member. Close click must `stopPropagation`.

**Add button** — `32 × 32`, `border: 1px solid #D1D5DB`, `border-radius: 100px` (pill), white background, centered 18px `add` glyph in `#6B7280`. Hover: background `#F9FAFB`. At the 10-pin limit: `opacity: 0.5`, `cursor: not-allowed`.

**Pin hint** — shown only while ≤1 member is pinned and no menu is open: 12px, `#9CA3AF`, "Pin your favorite members for quick access from your dashboard".

**Member summary card** — white, 1px `#E5E7EB`, radius 8px, padding 20px:

- Avatar 48px circle · name 20px / 28px weight 600 `#111827` · status pill below (4px gap): height 16px, radius 9999px, background `#DEF7EC`, padding `0 8px 0 6px`, 8px dot `#03543F`, text 12px / 16px `#03543F` reading `Working on <b>{project}</b>`.
- Right-aligned outline button `View latest screenshot` — 36px tall, padding `0 14px`, radius 4px, 14px weight 500, leading 18px `image` icon.
- **Metric cards row** below: `display: flex; gap: 27px; margin-top: 16px; flex-wrap: wrap`. Four cards: **Total work time**, **Avg. activity**, **Idle time**, **Manual time** (icons `timer`, `monitoring`, `bedtime`, `history`).
  - Each: `flex: 1 1 300px; min-width: 300px; height: 96px; padding: 24px; gap: 10px; border: 1px solid #E5E7EB; border-radius: 6px; align-items: flex-start; box-sizing: border-box`.
  - Icon tile: 48px wide, stretches to card content height, radius 8px, background `#E1EFFE`, glyph 24px `#0168DD`.
  - Label: 14px / 20px weight 500, **uppercase**, `#4B5563`. Value: 20px / 28px weight 600, `#111827`.
  - Hover: border + 2px outline `#2AA7FF` (offset −1px), background `#EAF6FF`, `translateY(-2px)`. Active: `translateY(0)`.

**Time & activity card** — section label 14px weight 500, uppercase, letter-spacing `0.04em`, `#4B5563`. Seven day columns, 8px gap, 16px below the label. Each column: day name (13px `#374151`, preceded by a 16px red `error` glyph when unusual) · 6px progress track `#E5E7EB` with a filled bar (green `#007D00` / amber / red by activity tier) · hours 14px weight 500 · activity pill 12px weight 500 in a tinted rounded pill · 96 × 60 screenshot thumbnail, radius 4px, with a 35% black scrim and centered white "N screenshots" label (empty state: 22px gray `image` glyph on `#F3F4F6`). Below 720px the row scrolls horizontally with 88px min column width.

**Unusual activity details** — two tinted count tiles (`#FDE8E8` / warning `#FDF6B2`) with a 20px bold count and a 12px label, a 1px divider, then a row per finding: a "Highly unusual" pill (12px weight 500, `#C81E1E` on `#FDE8E8`) plus 14px `#374151` description, then an "Investigate in Insights" link (14px weight 500, `#1E429F`, underline on hover).

**Manual time** — 4-column grid (`1fr 1fr auto auto`, gap `8px 16px`): Date · Project · Action · Time. Header cells 14px weight 500 `#374151`; body 14px `#111827`, time right-aligned with `font-variant-numeric: tabular-nums`; Action rendered as a pill (Add = success tint, Delete = danger tint). Footer link toggles between showing 3 rows and all rows.

**Projects** and **Apps & URLs** cards follow the same pattern — labelled rows with a horizontal proportional bar (100% = top item) and a footer link that expands the full list.

### 2. Dashboard — Compare view

**Purpose:** scan all pinned members at once.

Flex-wrap grid, 20px gap. Card: `flex: 1 1 240px; min-width: 240px; max-width: 320px; min-height: 220px`, white, 1px `#E5E7EB`, radius 8px, padding 20px, column layout with 16px gap. Contents: 56px initials avatar (member color, white 18px bold initials) · name 18px weight 700 + role 14px `#6B7280` · pushed to the bottom: "**{activity}** activity" / "**{hh:mm:ss}** this week" at 14px / 22px · optional "Unusual activity" pill (12px weight 500, `#C81E1E` on `#FDE8E8`).

### 3. Member picker (dropdown)

Anchored to the add button, opening **downward and rightward**: `position: absolute; top: 44px; left: 0; width: 320px; max-width: 82vw`, white, 1px `#E5E7EB`, radius 8px, `shadow-2`, `z-index: 50`.

- Search field: 36px tall, padding `0 12px`, 8px gap, 1px `#1C64F2` border, radius 4px; 18px `search` glyph + 14px input, autofocused. Placeholder "Search members".
- Scroll body: `max-height: 420px`, 1px top border. Row: `padding: 9px 16px`, 12px gap, 1px bottom border; 32px avatar · name 14px weight 500 / email 13px `#6B7280` (both 18px line-height) · trailing 20px state glyph. Hover: background `#EAF6FF`. Already-pinned rows read as selected.
- Empty state: "No members found", 14px `#9CA3AF`, padding `14px 16px`.

### 4. Limit-reached tooltip

Shown when the member is at the 10-pin limit and hovers **or** clicks the add button.

`position: absolute; bottom: calc(100% + 12px); left: 50%; transform: translateX(-50%)` — i.e. **above** the add button, horizontally centered. `width: 218px`, `padding: 9px 16px`, `border-radius: 8px`, background `#1F2937` (`--surface-dark`), text 14px / 20px `#D1D5DB`, centered, `shadow-2`, `z-index: 40`. Copy: **"You've reached your limit. Remove one member to add another."**

Caret: a 14 × 14 square of the same background, `rotate(45deg)`, `bottom: -7px; left: 50%; margin-left: -7px`, `border-bottom-right-radius: 3px`.

The same message also appears inside the picker as an inline dark strip (`margin: 0 16px 8px`, padding `8px 10px`, radius 4px, 12px / 16px) when a pin is attempted at the limit.

---

## Interactions & Behavior

- **Pin a member** — click add → picker opens → click a row → member is appended to `pinned` and the picker closes. Blocked at 10 pins (tooltip instead).
- **Unpin** — click the × on a pill. Removing the currently selected member leaves the selection on the removed id in the prototype; in production, fall back to the first remaining pin.
- **Select** — click a pill; the entire Individual view re-renders from that member's dataset.
- **Add-button tooltip** — `mouseenter` at the limit shows the tooltip; `mouseleave` hides it unless the picker is open. Clicking at the limit also shows it and does **not** open the picker.
- **Search (pins row)** — filters the roster and shows a 280px result dropdown (26px avatars) below the field; picking a result pins that member.
- **Week navigation** — prev/next stepper through a fixed list of week ranges; changing the week swaps the day series.
- **Expand/collapse** — Manual time, Projects, and Apps & URLs each show 3 rows with a footer link toggling to the full list.
- **Menu exclusivity** — opening the picker, search, notifications, or the profile menu closes the others.
- **Sidebar collapse** — width animates between expanded and collapsed; labels and the wordmark hide when collapsed.
- **Timer** — increments every second while running; toggling the pill pauses/resumes. Displayed `HH:MM:SS`, tabular numerals.
- **Sticky header** — the page header (title, date, tabs) stays pinned while content scrolls; the pins row scrolls with the content.
- **Animation** — 150ms (`--dur-fast`) / 200ms (`--dur`) ease-out on hover, background, border, and transform. No springs.
- **Responsive** — pins wrap; metric cards wrap at 300px; the day row becomes horizontally scrollable below 720px.

## State Management

| State | Type | Notes |
| --- | --- | --- |
| `pinned` | `string[]` | Member ids, ordered. Max 10 (`LIMIT`). Persist per user. |
| `selected` | `string` | Currently viewed member id. |
| `view` | `"individual" \| "compare"` | Which body renders. |
| `weekIndex` | `number` | Index into the week-range list. |
| `pickerOpen` | `boolean` | Member picker visibility. |
| `pickerSearch` | `string` | Picker query. |
| `limitTip` | `boolean` | Limit tooltip on the add button. |
| `pickerTip` | `boolean` | Inline limit strip inside the picker. |
| `searchOpen`, `searchQuery` | `boolean`, `string` | Pins-row search. |
| `notifOpen`, `profileOpen` | `boolean` | Header menus. |
| `activeNav` | `string` | Sidebar selection. |
| `collapsed` | `boolean` | Sidebar width. |
| `running`, `secs` | `boolean`, `number` | Timer. |
| `manualExpanded`, `projExpanded`, `appsExpanded` | `boolean` | Row expansion. |

**Data fetching (production):** the roster (id, name, email, avatar, role), and per member + week range: totals (work, activity, idle, manual), a 7-day series (hours, activity %, screenshot count, unusual flag, thumbnail), unusual-activity findings, manual-time entries, project breakdown, and app/URL breakdown. The prototype hardcodes all of this in `ROSTER` / `DATA` / `WEEKS`.

## Design Tokens

All Zone tokens are defined in `colors_and_type.css` (included in this bundle). Values used here:

**Color**

| Value | Token | Used for |
| --- | --- | --- |
| `#FFFFFF` | `--surface-card` | Cards, tables, pill fills |
| `#F9FAFB` | `--surface-app` / `--gray-50` | Page background, hover fills |
| `#F3F4F6` | `--gray-100` | Thumbnail placeholder, icon-button hover |
| `#E5E7EB` | `--border-subtle` | Card and row borders, progress track |
| `#D1D5DB` | `--border` / `--gray-300` | Add-button border, tooltip text |
| `#9CA3AF` | `--gray-400` | Hint text, placeholders |
| `#6B7280` | `--gray-500` | Inactive tabs, pill labels, secondary text |
| `#4B5563` | `--gray-600` | Metric labels, section labels |
| `#374151` | `--gray-700` | Date range, body text |
| `#111827` | `--gray-900` / `--fg-1` | Titles, values |
| `#1F2937` | `--surface-dark` | Tooltip / toast background |
| `#0168DD` | `--blue-*` (Zone `#0D69D4`/`#1C64F2` family) | Active tab, selected pill, metric icon |
| `#EAF6FF` | `--blue-50` | Selected pill fill, picker row hover |
| `#E1EFFE` | `--blue-100` | Metric icon tile |
| `#2AA7FF` | `--btn-primary` / `--blue-500` | Primary fill, hover outline |
| `#E8D2FF` / `#5427A7` | (Figma literals) | NEW badge fill / text |
| `#DEF7EC` / `#03543F` | `--success-100` / `--success-900` | "Working on" pill |
| `#007D00` | `--success-500` | Activity bars |
| `#FDE8E8` / `#C81E1E` | `--danger-100` / `--danger-600` | Unusual pills and tiles |
| `#FDF6B2` / warning-700 | `--warning-100` / `--warning-700` | Unusual (lesser) tile |

`#0168DD`, `#E1EFFE`, `#E8D2FF`, `#5427A7`, `#DEF7EC`, `#03543F`, `#DEF7EC` are the file's literal values — prefer the nearest Zone token in production and flag any that has no token.

**Spacing** — 2 · 4 · 6 · 8 · 10 · 12 · 16 · 20 · 24 · **27** (metric card gap, from Figma) · 48.

**Typography** — Roboto (`--font-sans`). Page title 24/32 · 300. Card / member name 20/28 · 600. Compare name 18/24 · 700. Body & inputs 14/20 · 400. Tabs, metric labels, buttons, links 14/20 · 500–600 (tabs and metric labels uppercase; section labels add `letter-spacing: 0.04em`). Small body 13px. Captions, pills, badges 12/16 · 500–700. Time values use `font-variant-numeric: tabular-nums`.

**Radius** — 4px (inputs, thumbnails, small pills) · **6px** (metric cards, buttons) · 8px (cards, tooltips, icon tiles) · 9999px / 100px (avatars, pills, dots, add button).

**Shadow** — `--shadow-1` `0 1px 2px rgba(0,0,0,0.05)`; `--shadow-2` `0 8px 24px rgba(0,0,0,0.10)` (tooltip, picker, menus). The page header has **no** shadow.

## Assets

Everything is under `assets/` in this bundle.

- `avatars.png` — a **vertical sprite sheet**, 96px per row, one row per roster member in `ROSTER` order. Rendered via `background-image` with `background-size: <size>px auto` and `background-position: 0 -<index × size>px`, so one request serves the 24 / 26 / 32 / 48px avatars. Rows 1–3 are real photos extracted verbatim from the Figma file; the rest are generated initials tiles in Zone palette colors. **In production, replace this sprite with real member avatar URLs.**
- `avatar-photo.jpg`, `av-photo-2.jpg`, `av-photo-3.jpg` — the three source photos from the Figma file.
- `shot-mon.png`, `shot-tue.png`, `shot-wed.png`, `shot-fri.png` — screenshot thumbnails for the day columns.
- `logo-hubstaff-wordmark.svg`, `logo-mark.svg` — Hubstaff logos, copied from the Zone design system verbatim (never redraw).
- `illustration-empty-state.svg` — Zone illustration.
- **Icons**: **Material Symbols Rounded** as a font glyph (`<span class="material-symbols-rounded">add</span>`), sized with `font-size`. Glyphs used: `add`, `close`, `search`, `bolt`, `star`, `image`, `timer`, `monitoring`, `bedtime`, `history`, `error`, `speed`, `schedule`, `trending_up`, `lightbulb`, `map`, `task_alt`, `calendar_today`, `group`, `description`, `paid`, `settings`, `chevron_left`, `expand_more`, `grid_view`, `notifications`, `open_in_new`, `work`, `card_travel`. Loaded from the Google CDN link in `colors_and_type.css`.

## Files

| File | What it is |
| --- | --- |
| `Dashboard v3.dc.html` | Source design component — read for exact values, structure, data shapes, and handler logic. Uses a proprietary template runtime; do not port the syntax. |
| `Hubstaff Dashboard v3.html` | Self-contained standalone build. Open in a browser to click through the real interactions. |
| `colors_and_type.css` | The Zone design-system token stylesheet (all `--*` custom properties). |
| `assets/` | Avatar sprite + source photos, screenshot thumbnails, logos, illustration. |

Source of truth for visual detail: the Figma file `Testing Claude Prototype.fig`, page `Page 1`, frame **`AR0226 Zonified version V.3`**.
