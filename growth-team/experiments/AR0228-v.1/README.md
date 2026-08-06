# AR0228 — Unusual Activity / Smart Notifications → Slack activation

A clickable HTML prototype for a growth experiment: get more orgs to connect Slack
via the two surfaces that already show them real, specific value — **Insights →
Unusual Activity** and **Smart Notifications**. Built fresh for this experiment
(not reusing the earlier `experiments/slack-smart-notifications/` mockups or its
strategy doc) — grounded instead in a fresh read of the live `hubstaff-server` repo,
the real production screenshots taken directly from `app.hubstaff.com`, the four
Figma component specs linked in the brief, and
[support.hubstaff.com/slack-integration-setup](https://support.hubstaff.com/slack-integration-setup/).

## Pages

- **`index.html`** — Insights → Unusual Activity (`/organizations/13/insights?tab=unusual-activity`).
  Real layout: member/date filters, confidence pills (Highly/​Unusual/​Slightly unusual,
  counts confirmed from `app_constants.js`), 3 stat tiles, and the members table
  (Member / Total time / Previous 60 days / Highest classification / Review).
  Member names and avatars are fictional — no real org roster or photos are reproduced.
- **`smart-notifications.html`** — Smart Notifications settings
  (`/organizations/13/smart_notification_rules`). Real layout: recommended-notification
  cards, notifications table (toggle / Name / Created by / Target / Frequency / Notify via).

Colors, radii, and font stack (Roboto + Material Symbols Rounded) match the exact
values confirmed in `hubstaff-server`'s `config/zone/tailwind-tokens.json` and
`app/assets/stylesheets/hubstaff-variables.scss` — e.g. `--z-primary-500:#2aa7ff`,
`--z-red-700:#c81e1e`, `--z-orange-800:#c04601`, `--z-green-800:#03543f`,
`border-radius-base:6px`. The confidence-badge colors in the table are the real
`(low/medium/high)` → `(green/orange/red)` mapping from `app_constants.js`.

The "Send to Slack" checkbox in the create-notification modal reproduces the real
gating logic in `SmartNotificationsDialog.vue`: disabled + unchecked until Slack is
connected, enabled once it is. That's not an invented mechanic — it's how the real
dialog already works.

## The four Figma concepts, and where each landed

| Figma idea | Placement | Why |
|---|---|---|
| **Alert** (small, node 20634:8254) | Smart Notifications page, persistent | This is a *settings* page — the user is already in a configuring mindset. A quiet cross-sell back to real Unusual Activity data fits better than a full pitch. |
| **Banner** (node 20635:8314) | Unusual Activity page, persistent while disconnected | This is where the real evidence (the flagged-members table) already lives — the ask sits directly next to the proof, mirroring the "show real detected value, then ask" pattern that's already worked for this feature via email (HUB-14281: +293% Insights trial starts, +368% first charges, sending a one-time email with *real* detected unusual activity to non-subscribers). |
| **Modal** (node 20635:8548, "New unusual activity detected") | Unusual Activity page, auto-opens once per browser | The higher-intensity "moment of detection" surface — fires once, respects "Don't show again" (permanent, `localStorage`), never stacks with the banner (closing it just reveals the banner underneath, it doesn't add a second nag). |
| **Pop-up** (node 20635:8700, "Get alerts pushed to Slack") | Shared fork, both pages | The decision point once someone starts a *create* action pre-connect: "Create notification" (skip Slack, plain rule) vs. "Connect Slack" (the growth path). Once Slack is already connected, this fork is skipped entirely — every CTA goes straight to the prefilled, Slack-checked form. |

## Flow logic

Slack status is modeled as **two independent booleans, not one** — `orgConnected`
(Settings > Integrations > Slack is authorized at all — the org may already use
this for its existing timer/task notifications) and `usedHere` (this feature has
an active Slack-delivered alert). `usedHere` implies `orgConnected`, never the
reverse. That gives three real states, not two:

| State | `orgConnected` | `usedHere` | CTA copy | What happens on click |
|---|---|---|---|---|
| Never connected Slack | ✗ | ✗ | "Connect Slack" | Full 2-step flow: Allow → choose channel → prefilled form |
| Connected, but not for this feature | ✓ | ✗ | "Turn on Slack notifications" / "Use Slack" | No modal at all — flips on immediately (toast), then opens the prefilled form |
| Fully set up | ✓ | ✓ | *(no CTA — banner/alert replaced by a connected confirmation strip)* | N/A |

This matters because re-running an OAuth "Allow" screen — or asking again which
channel to use — for an org that already authorized Slack (e.g. for its existing
"starts/stops timer" notifications) would read as broken, not helpful. Verified
directly against the live app (see below): the real Slack integration has **one
channel for the entire integration**, set once on the Settings > Integrations >
Slack page ("Where do you want these notifications to appear in Slack?"). Checking
"Send to Slack" on a rule in an already-connected org doesn't prompt for a channel
at all — it just checks. So the connect-flow modal here is now *only* reachable
pre-connect; an already-connected org skips it entirely.

```
"Connect Slack" CTA (banner / alert / modal footer, pre-connect only)
  → embedded connect flow: step 1 "Allow Hubstaff to access Slack" → step 2 choose channel
  → on finish: orgConnected + usedHere both true, auto-advances into the prefilled
    "Add a smart notification" form with Send to Slack checked

"Turn on Slack notifications" / "Use Slack" CTA (org already connected, not used here)
  → no modal — usedHere flips true immediately, toast confirms, then the prefilled
    form opens the same way

"Create notification" / "New notification" header buttons, or any ambiguous entry point
  → if usedHere: prefilled form opens directly, Slack pre-checked
  → otherwise: the pop-up fork opens first
       "Create notification" → plain form; Slack checkbox enabled if orgConnected,
                                disabled otherwise, but never pre-checked
       "Connect Slack"/"Use Slack" → routes through the same branch as above
```

The embedded connect flow (pre-connect only) defaults the channel to
**`#hubstaff-alerts`** with an explicit "we recommend a private, admin-only
channel" note — unusual-activity data is sensitive, and it's worth being upfront
that anyone in the chosen Slack channel will see it, rather than defaulting to
`#general`.

The "Prototype controls" panel exposes all three states directly (not just a
connected/disconnected toggle) so a reviewer can check the copy and flow for the
middle state without replaying the full connect flow.

## Verified against the live app

Beyond the repo/screenshot research, this was cross-checked directly against
`app.hubstaff.com` (org 13) via an authenticated session:

- The real Unusual Activity page layout matches this mockup almost exactly,
  down to the disclaimer copy being word-for-word identical ("Hubstaff doesn't
  recommend making employment decisions based solely on unusual activity data.").
- The real "Add a smart notification" dialog has the same Name/Frequency → When
  (Metric + threshold) → Monitored audience → Then (Send to/Delivery channel)
  structure this prototype uses. "Unusual activity" is a real metric option.
  Selecting it swaps the threshold row for an info box — this prototype now uses
  the **exact real copy**: "This notification will inform you of the total
  duration of unusual activity for each monitored member, based on the chosen
  frequency."
- "Send to Slack" is a real checkbox, enabled (not disabled) on this test org
  because it already has Slack connected — confirming the disabled-until-connected
  gating this prototype models is correct for a never-connected org.
- **One correction this made to the design**: the real Slack integration has a
  single shared channel, not a per-notification choice (see above) — the
  original build had an already-connected org still pick a channel, which
  doesn't match reality and has been removed.
- **One thing this confirms is worth fixing**: today, the real "Create
  notification" button on the Unusual Activity page just navigates away to the
  Smart Notifications page — a full page load that drops the date range,
  member filter, and classification-pill selection. That's exactly the
  context-loss problem this prototype's in-page modal approach is designed to
  avoid, not a hypothetical one.

## Known simplifications (be upfront about these in review)

- Today's real Slack integration (per the support article) only sends two
  notification types: timer start/stop and completed to-do/task. The **real**
  `SmartNotificationsDialog.vue` already has a "Send to Slack" checkbox gated on
  `helpers.slack_integration_enabled` — so wiring Unusual Activity / Smart
  Notifications to Slack is a real, already-scaffolded checkbox, not a fully
  built pipeline. This prototype demonstrates the *activation UX*, not a claim
  that today's backend already delivers these specific alert types to Slack.
- Icons use Material Symbols Rounded throughout (real, self-hostable, used by
  the newer Zone components) rather than Hubstaff's proprietary `hi` icon font,
  whose source lives in an external gem not available in this repo.
- No production JS framework is used — plain HTML/CSS/vanilla JS, so this opens
  as a static file or via any simple HTTP server, no build step.

## Prototype-only chrome

The dark top banner and the floating "Prototype controls" panel (bottom-left) are
**not** part of the design — they're clearly-labeled scaffolding so a reviewer can
jump between pages and toggle the Slack-connected state without replaying the whole
OAuth simulation each time. "Reset demo" clears `localStorage` (connection + "don't
show again" state) and reloads.

## Run it

```bash
python3 -m http.server 4004 --directory experiments/AR0228-v.1   # from growth-team/
```

Also wired into this team's `.claude/launch.json` as `AR0228-v.1` (port 4004).
Works as a plain `file://` open too — there's no build step or bundled asset
dependency.
