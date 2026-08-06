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
| **Pop-up** (node 20635:8700, "Get alerts pushed to Slack") | Shared fork, both pages | The decision point once someone starts a *create* action pre-connect: "Create alert" (skip Slack, plain rule) vs. "Connect Slack" (the growth path). Once Slack is already connected, this fork is skipped entirely — every CTA goes straight to the prefilled, Slack-checked form. |

## Flow logic

Slack status is modeled as **two independent booleans, not one** — `orgConnected`
(Settings > Integrations > Slack is authorized at all — the org may already use
this for its existing timer/task notifications) and `usedHere` (this feature has
an active Slack-delivered alert). `usedHere` implies `orgConnected`, never the
reverse. That gives three real states, not two:

| State | `orgConnected` | `usedHere` | CTA copy | Connect-flow behavior |
|---|---|---|---|---|
| Never connected Slack | ✗ | ✗ | "Connect Slack" | Full 2-step flow: Allow → choose channel |
| Connected, but not for this feature | ✓ | ✗ | "Turn on Slack alerts" / "Use Slack" | Skips "Allow" entirely — jumps straight to choose-channel, with copy acknowledging Slack's already connected |
| Fully set up | ✓ | ✓ | *(no CTA — banner/alert replaced by a connected confirmation strip)* | N/A |

This matters because re-running an OAuth "Allow" screen for an org that already
authorized Slack (e.g. for its existing "starts/stops timer" notifications) would
read as broken, not helpful — the real gate on the "Send to Slack" checkbox in
`SmartNotificationsDialog.vue` is org-level integration status, so the UI here
should ask the same question the backend actually cares about, nothing more.

```
Any "Connect Slack" / "Turn on Slack" CTA (banner / alert / modal footer)
  → embedded connect flow (kept in-page)
      if not orgConnected: step 1 "Allow Hubstaff to access Slack" → step 2
      if orgConnected already: opens directly on step 2, copy says so
  → step 2: choose channel → on finish, orgConnected + usedHere both true,
    auto-advances into the prefilled "Add a smart notification" form with
    Send to Slack checked

"Create notification" / "New notification" header buttons, or any ambiguous
entry point
  → if usedHere: prefilled form opens directly, Slack pre-checked
  → otherwise: the pop-up fork opens first
       "Create alert"        → plain form; Slack checkbox enabled if orgConnected,
                                 disabled otherwise, but never pre-checked
       "Connect Slack"/"Use Slack" → same embedded connect flow as above
```

The embedded connect flow defaults the channel to **`#hubstaff-alerts`** with an
explicit "we recommend a private, admin-only channel" note — unusual-activity data
is sensitive, and it's worth being upfront that anyone in the chosen Slack channel
will see it, rather than defaulting to `#general`. This also lets an
already-connected org pick a *different* channel for unusual-activity alerts than
whatever channel their existing timer/task notifications already post to.

The "Prototype controls" panel exposes all three states directly (not just a
connected/disconnected toggle) so a reviewer can check the copy and flow for the
middle state without replaying the full connect flow.

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
