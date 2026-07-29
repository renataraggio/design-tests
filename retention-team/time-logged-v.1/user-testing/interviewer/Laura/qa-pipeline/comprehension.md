# Stage 1 — Comprehension and orientation

## What this document is

A moderated usability-test transcript for an unreleased Hubstaff prototype called "Time Logged" — a redesign of the Timesheets page. The redesign adds (a) a manager multi-member view (previously managers only had a single-member "view and edit" page) and (b) batch add-time / add-timestamp functionality for adding time to multiple team members and multiple time entries at once. The session is split into two task-based journeys: a Manager track (multi-member view, batch add time, drill-down to single member) and a regular User track (daily/weekly time view, adding own time). The moderator also asks wrap-up questions about naming, missing functionality, customer education, and export needs.

Source: Fireflies transcript, single call, dated 2026-07-06.

## Participant map

- **Renata Raggio** — Moderator/interviewer. Runs the task-based walkthrough, asks scaled difficulty questions (1–5), narrates prototype context. INTERVIEWER — excluded from nugget extraction.
- **Kate Kamianets** — PM / notetaker / co-interviewer. Provides context up front, asks follow-up probing questions (work breaks, export, naming, video education). INTERVIEWER — excluded from nugget extraction.
- **Laura Larrea** ("Lara") — PARTICIPANT. A Hubstaff CSM (Customer Success Manager). She performs the usability tasks herself (as a test user in both the Manager and User roles) AND repeatedly speaks as a proxy for what she hears from her own Hubstaff customers/clients in her CSM role. Both first-person-as-tester statements and first-person-as-CSM-reporting-customer-behavior statements are valid signal per the task instructions. Only her speech is mined.

## Domain vocabulary / concepts referenced

- **Time Logged** — the new prototype/page name being tested (redesign of Timesheets).
- **Multi member view** — new manager-only view showing all team members' daily time in one screen (replaces having to view members one at a time).
- **Single member view / "View and edit" page** — the prior/legacy page, now reached by drilling into one member from multi-member view.
- **Batch add time / Add time (multiple members)** — new ability to add a time entry to multiple team members at once.
- **Add timestamp** — new UI element letting a user enter a specific number of hours rather than picking a start/end time span.
- **Timeline** — the visual time-block display (used in single-member add-time view) showing existing tracked time so a manager can see gaps/overlaps before adding time.
- **Work breaks / break policy** — a feature where, if a break policy exists, users/managers can log/edit work breaks; gated behind having a policy configured.
- **Daily / Weekly / Calendar(Monthly) tabs** — view toggles on the Timesheets/Time Logged page. "Calendar" is being renamed "Monthly" in a future release; only Daily and Weekly ship in this first release. Weekly view is a table (grid), not a visual calendar.
- **Timesheets approvals** — a separate, older page/feature for approving submitted timesheets; historically the only place a "manual time request" could be actioned if a client didn't have timesheets approvals enabled.
- **P1 Edit / View and Edit / Timesheets approvals** — the three legacy page names Laura contrasts with the new "Time Log"/"Time Logged" naming.
- **Export CSV** — an existing export capability on the (old) view-and-edit style page; being reconsidered/deprioritized ("coming soon") in the new design.
- **Scale** — referenced as a specific existing Hubstaff customer/account already using the live batch-add-time feature.
- **Click stream / testing tool** — the moderator's own instrumentation pill used to time-track the session (not a Hubstaff product feature, out of scope for nuggets).

## Glossary — referent resolution (per reference/glossary.md)

- "the page" / "this page" / "the tool" / "the app" (when referring to the product under test) → **Hubstaff** ("Time Logged" page specifically when context indicates the new page; "Timesheets" when referring to the legacy page — both are Hubstaff surfaces). No transcription aliases of "Hubstaff" (e.g., "hub staff") appear in this transcript, so no alias normalization was needed.
- "it" referring to the multi-member view, the timeline, the calendar view, the work-break button, etc. → resolved individually to the concrete named feature per surrounding context in each nugget.
- "they" / "clients" / "customers" in Laura's CSM-voice statements → Hubstaff customers (external, not the interviewers).
- "Scale" → a named Hubstaff customer account (proper noun, kept as-is).

## Notes on transcription noise / turn misattribution

- Several of Laura's turns are fragmented across many short lines (e.g., lines 164–165, 236–239, 356–380) — reconstructed by meaning into coherent spans for extraction.
- Line 690–693: Kate's question trails into what looks like a shared clause ("because they were shocked about multimedia,") immediately followed by Laura's answer beginning "The video coming from product..." — treated as Kate's question ending and Laura's answer starting at "The video coming from product."
- Several one-word or filler turns from Laura ("Okay," "Right," "Yeah, that makes sense," acknowledgments of the moderator's explanations) carry no independent signal — marked as noise in Stage 2.
- Numeric difficulty ratings (1–5 scale answers, e.g., "five," "four," "4:2 ... I will say four") are kept as signal since they are direct usability-test verdicts tied to specific tasks with recoverable context.
