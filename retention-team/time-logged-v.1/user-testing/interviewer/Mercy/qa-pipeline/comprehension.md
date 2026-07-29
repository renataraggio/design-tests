# Stage 1 — Comprehension and orientation

## What this document is

A moderated usability-test transcript for an unreleased Hubstaff prototype called **"Time Logged"** — a redesign of the Timesheets page. The redesign adds a manager-facing **multi-member view** (see everyone's logged hours/activity/screenshots side by side) and **batch add-time** (add time entries for multiple members/multiple days at once), alongside the existing **single-member view** (per-person daily/weekly/calendar detail). The session runs the participant through two tracks in one call: first a **Manager** track (multi-member table, batch add-time, drill-down), then a shorter **User** (individual contributor) track (single-member add-time, daily/weekly views).

Source: Fireflies recording "Internal feedback: Time logged," dated 2026-07-09.

## Participant map

- **Renata Raggio** — moderator/interviewer. Runs the prototype walkthrough, assigns tasks, asks SEQ-style 1–5 ease ratings. **Excluded from nugget extraction.**
- **Kate Kamianets** — PM/notetaker, co-interviewer. Asks open-ended follow-up questions about specific product decisions (timezones, naming, work breaks, exports). **Excluded from nugget extraction.**
- **Mercy Mwende** — the participant, a Hubstaff CSM (Customer Success Manager). She plays two roles in this transcript:
  1. **Test user** — performs tasks in the prototype (manager track, then user track) and rates ease of use.
  2. **CSM proxy voice** — repeatedly answers Kate's open questions by reporting what she hears from actual Hubstaff customers she supports (e.g., timezone confusion, export needs, calendar-view usage, work-break usage, split-time usage). **Both roles count as valid signal per task instructions.**

## Domain vocabulary / referent glossary

Resolve all of the following generic or mangled referents to concrete objects before nugget distillation:

- "Hubstaff" transcription variants — "Hubsta," "hub staff," etc. → normalize to **Hubstaff** (per skill glossary reference).
- "This page" / "it" / "the tool" (when Mercy is testing) → the **Time Logged prototype** (multi-member table or single-member detail view, depending on context).
- "View and Edit" → the **current/old Hubstaff page name** for what "Time Logged" is replacing.
- "Timesheets" → in the new naming scheme, the renamed concept covering **approvals / manual time requests / pay-period-adjacent data** — distinct from "Time Logged," which is just the raw log of time.
- "Time tracked" → in the new naming scheme, an umbrella term for everything time-related (time tracked, locked, approved, paid).
- "Multi member table view" / "multi member page" → the new **manager view** showing all team members' time side by side.
- "Single member view" / "detail view" / "individual panel" → the **per-person drill-down** (day-by-day time log, project splits, activity, screenshots).
- "Batch actions" / "Add time" (blue button, manager context) → the **bulk add-time dialog** letting a manager add time for multiple members and multiple days at once.
- "Work bricks" (transcription garble) → **work breaks**.
- "Reports" / "Time and Activity reports" → Hubstaff's existing **Reports** feature, separate from the Time Logged page.
- "Work sessions report" → a specific existing Hubstaff report.
- "Outliner" / "Outlier" (Kate's phrasing) → an internal load-testing reference; ambiguous, not attributed to Mercy, not used in nuggets.
- "ClickUp," "Time Doctor" → named competitor tools a customer used to cross-check exported timesheets.
- "Favel" → an anonymized/garbled customer name Mercy recalls; carried as minimal context, not resolved further.
- "ScaLe" / org names like "8,000 members" → hypothetical/example org sizes Mercy uses to probe scalability, not real customers.

## Notes on transcript quality

- Heavy turn-boundary noise at the start (personal chit-chat about mutual acquaintances in Kenya, internet connectivity) — excluded as noise, not test-relevant.
- Several SEQ-style "one to five" ease ratings are given with no elaboration — treated as noise for nugget purposes (no distillable claim) unless Mercy attaches reasoning (several do, e.g. the "good three" rating with expectation-of-default reasoning).
- Some turn attribution looks compressed (Renata and Kate's lines run together in places) but Mercy's own turns are clearly and consistently attributed throughout — no reassignment needed for her speech.
