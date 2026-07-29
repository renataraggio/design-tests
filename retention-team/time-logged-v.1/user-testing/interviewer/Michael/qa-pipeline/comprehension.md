# Stage 1 — Comprehension and orientation

## What this document is

A Fireflies transcript of a moderated usability test ("Internal feedback: Time logged," 2026-07-09) of an unreleased Hubstaff prototype redesign of the Timesheets page. The redesign adds (a) a manager-facing multi-member table view (replacing the single-member-only "View and edit" experience) and (b) batch/multi-day "Add Time" functionality. The session runs two tracks back to back: a **Manager journey** (6 timed tasks + SEQ-style 1-5 ease ratings) and a shorter **User journey** (task + rating), followed by open wrap-up questions about page naming ("Timesheet" vs. "Time Logged" vs. "Approvals") and missing functionality.

## Participant map

- **Renata Raggio** — moderator. Runs the task script, asks SEQ (1-5 ease) questions, explains prototype quirks/bugs. INTERVIEWER — excluded from nugget mining.
- **Kate Kamianets** — PM / notetaker. Gives project context up front, asks supplementary/wrap-up questions (work breaks, naming, differentiate user vs. manager experience). INTERVIEWER — excluded from nugget mining.
- **Michael Shipley** — participant, a Hubstaff CSM (Customer Success Manager). Acts as the test user driving the prototype through both the Manager and User task tracks, AND as a CSM proxy voicing what he hears from real Hubstaff customers (adoption of work breaks, payroll onboarding patterns, naming confusion reported to support, etc.). Both voicings are valid signal per task instructions. PARTICIPANT — sole source of nuggets.

## Domain vocabulary / recurring referents (glossary)

Resolve the following generic/aliased referents to concrete objects before distilling nuggets:

- "the tool" / "it" / "this page" / "the system" (when Michael is discussing the product under test) → **Hubstaff** (specifically the Timesheets / "Time Logged" page prototype, unless another product is explicitly named).
- "Hub staff" / "Hubstaff" / any phonetic transcription variant → **Hubstaff** (per skill glossary; no notable mangled spellings appeared in this transcript beyond standard "Hubstaff").
- "the demo" / "the prototype" / "Claude['s] doing this" → the interactive Figma/Claude-built prototype being tested, NOT the live production product. Bugs Michael notices that are explicitly flagged (by Renata or by Michael) as prototype-only artifacts (e.g., date picker defaulting to 2025, a time-span math bug showing 0 hours) are treated as demo noise, not product signal, since they don't reflect real Hubstaff behavior.
- "the pill" / "this blue pill" → a new hover affordance/link style on the multi-member table that lets a user drill into a single member's detail view (replaces/complements the "Actions" menu).
- "multi member view" / "the new page" → the redesigned Timesheets landing page showing all team members' logged time in one table.
- "the modal" / "add time dialog" → the Add Time flow, which in the new design can add time for multiple members and/or multiple days at once (vs. today's one-member-at-a-time flow).
- "timeline" / "the timelines" → the visual hour-by-hour bar/track shown in the single-member detail view representing a time entry's start/stop span.
- "grid view" / "the table" (weekly) vs. "calendar view" (weekly) → two display modes for the Weekly tab; today's production Hubstaff shows a numbers/table view for Weekly, the new prototype defaults Weekly to a visual "calendar-style" grid.
- "timesheet" vs. "timesheet approvals" → in current Hubstaff, "timesheet" is used ambiguously by customers/support/dev team to mean either (a) the full record of a member's tracked hours over a pay period, or (b) the approvals-layer object ("timesheet approvals") that sits on top of tracked time and is deleted independently of the underlying time entries.
- "Time Logged" / "Time Tracked" → candidate new names being tested for what is currently called "Timesheet."
- "Lattice," "Deal," "DevOps"-style outside references (Lattice review-cycle tabs, Deal's manager-defaults-to-self behavior) → other SaaS products Michael references for comparison; NOT Hubstaff, left as named third-party products, not resolved to Hubstaff.
- "Jared," "Helene/Helen," "Amanda," "Chris," "James," "Olivia" → names of Michael's colleagues/team members or prototype placeholder personas used during tasks; kept as-is where load-bearing to a nugget (e.g., Helene as the pre-selected member in the Add Time modal), otherwise generalized.

## Scope note

The opening ~40 lines (Fireflies/Lattice AI-notetaker small talk) and all task-logistics banter ("share your screen," "click Start," "sounds good," etc.) are noise — no product signal about Hubstaff. Signal concentrates in: (1) Michael's narrated task reactions and 1-5 ease scores across both journeys, (2) his open-ended feedback on the Add Time modal, multi-day entry, and timeline trade-off, (3) his "me vs. team" default-view feedback drawing on Lattice/Deal comparisons, (4) the Daily/Weekly/Calendar naming and default-view discussion, and (5) the extended Timesheet/Time Logged/Approvals naming discussion where he speaks explicitly as a CSM about customer and support-team confusion patterns.
