/* =============================================================================
   Prototype Conditions — role · page state, as one toolbar segment
   -----------------------------------------------------------------------------
   The fourth review engine. Annotations, Design tasks and Dev Mode all ask
   "what do you think of THIS?" — Conditions changes what "this" is, so a
   reviewer can see the same prototype as a Viewer on a tablet with the table in
   its error state, without a second file.

   Two axes, and the vocabulary is NOT invented here: role and page state come
   from the acceptance-criteria skill's tag taxonomy
   (`.claude/skills/acceptance-criteria/SKILL.md` § "Tag vocabulary"), so a
   condition you demo maps 1:1 onto the AC written for the same feature.
   `@viewer` + `@error-state` in the ACs is `Viewer` + `Error` here.

   ---------------------------------------------------------------------------
   AUTHORING CONTRACT — three data attributes, nothing else

     ROLE      data-role="org-owner manager"   visible only to those roles
               data-role="!viewer"             visible to everyone EXCEPT viewer
               data-project-role="…"           same, on the project-role axis
                                               (opt-in: pass `projectRoles: true`)

     STATE     data-state="error"              a state VARIANT of its parent

   Untagged elements are never touched — the default page IS the happy path.

   State variants are resolved PER PARENT, so a state can be scoped to one
   region and leave the rest of the page alone:

     <div class="card">
       <div data-state="default">…the table…</div>
       <div data-state="loading">…skeleton rows…</div>
       <div data-state="empty">…empty illustration…</div>
       <div data-state="error">…retry banner…</div>
     </div>

   Within one parent exactly one variant shows. If no variant matches the active
   state, the `default` one shows — so a card that only defines `error` renders
   normally under `loading`, instead of blanking out.

   ---------------------------------------------------------------------------
   NO SCREEN AXIS

   This engine used to carry one, with an in-place clamp and an iframe reload.
   It was removed as redundant with the browser's own device toolbar — and the
   clamp was worse than redundant: it pinned the page to a fixed width while
   media queries kept reading the real window, and the choice persisted, so a
   reviewer could measure an emulated frame believing it was a responsive check.
   Resize the browser, or use its device mode. Role and page state stay here
   because a browser cannot produce those.

   ---------------------------------------------------------------------------
   PERSISTENCE

   localStorage only, keyed per prototype — deliberately NOT the URL hash.
   `version-switcher.js` owns the hash (it does a full `replaceState('#v=…')`
   on every switch) and it is a dependency we don't edit, so sharing the hash
   would mean one engine silently clobbering the other. The iframe mode passes
   conditions as QUERY params instead, which the hash rewrite doesn't touch.

   Zero-dependency vanilla JS, own `pc-` prefix. Loaded and initialised by
   `review-toolbar.js` / `review-toolbar.core.js` — prototypes never call this
   directly, they pass `conditions: {…}` to `ReviewToolbar.init`.
   ============================================================================= */
(function (global) {
  'use strict';

  /* ── Defaults ─────────────────────────────────────────────────────────── */

  // Every preset states its resolution — "Desktop" with no number tells a
  // reviewer nothing, and a size axis whose default is unlabelled is the one
  // place you most need the number. Only "Fit window" is deliberately fluid,
  // and it says so.
  //
  // The widths are Hubstaff's own, not invented device sizes: 1440 is what the
  // Figma product frames are drawn at, 1280 the narrowest desktop we design for,
  // 768 the tablet boundary, 375 the iPhone-class width in the mobile frames.
  // 1920 is there because "does this stretch badly on a big monitor?" is a real
  // review question and the fluid default can't answer it on a laptop.
  // The SCREEN AXIS WAS REMOVED. It offered 1920/1440/1280/768/375 presets in
  // two modes — an in-place clamp and an iframe reload — and it was removed on
  // request as redundant: the browser's own device toolbar does the same job
  // and does it honestly. The clamp in particular was a trap. It pinned the
  // page to a fixed width while media queries kept reading the real window, and
  // the choice persisted in localStorage, so a "responsive check" could silently
  // measure an emulated frame long after the reviewer forgot they had set one.
  // Role and page state remain — those are conditions a browser cannot produce.

  // Org-level roles — acceptance-criteria SKILL.md § "Org-level role".
  var ROLES = [
    { id: 'org-owner', label: 'Org Owner' },
    { id: 'manager',   label: 'Manager' },
    { id: 'member',    label: 'Member' },
    { id: 'viewer',    label: 'Viewer' }
  ];

  // Project-level roles — same source, § "Project-level role". Opt-in: most
  // pages don't vary by it, and an axis that never does anything is noise.
  var PROJECT_ROLES = [
    { id: 'project-manager', label: 'Project Manager' },
    { id: 'project-user',    label: 'Project User' }
  ];

  // Plan / feature-access — opt-in, no default set: plan tiers and add-ons are
  // per-product, so a prototype that gates a CTA on plan access (e.g. AR0238's
  // "Upgrade plan" vs "Send reminder") passes its own `cfg.plans` array rather
  // than picking from a generic list the way roles and page states do.

  // Page states — same source, § "Coverage" (@loading-state, @empty-state,
  // @error-state). 'default' is the happy path, i.e. the page as authored.
  var STATES = [
    { id: 'default', label: 'Default',  note: 'as authored' },
    { id: 'loading', label: 'Loading' },
    { id: 'empty',   label: 'Empty' },
    { id: 'error',   label: 'Error' }
  ];

  var CSS = [
    /* Segment button — shape comes from review-toolbar.css like the other three. */
    '#pc-toggle{display:inline-flex;align-items:center;gap:6px;cursor:pointer;}',
    '#pc-toggle .pc-count{display:inline-flex;align-items:center;justify-content:center;',
    'min-width:16px;height:16px;padding:0 4px;border-radius:999px;background:#0168dd;',
    'color:#fff;font-size:10px;font-weight:600;line-height:1;}',

    /* Panel */
    '#pc-panel{position:fixed;z-index:2100;width:268px;max-height:76vh;overflow-y:auto;',
    'background:#fff;border:1px solid #e5e7eb;border-radius:12px;',
    'box-shadow:0 8px 20px rgba(16,40,80,.12);',
    'font-family:Roboto,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
    'opacity:0;transform:translateY(-6px);pointer-events:none;transition:opacity .15s,transform .15s;}',
    '#pc-panel.pc-open{opacity:1;transform:translateY(0);pointer-events:auto;}',
    '.pc-group{padding:12px 16px 4px;font-size:11px;font-weight:600;letter-spacing:.05em;',
    'text-transform:uppercase;color:#9ca3af;}',
    '.pc-group:first-child{padding-top:12px;}',
    '.pc-item{display:flex;align-items:center;gap:8px;width:100%;padding:7px 16px;border:0;',
    'background:none;font-family:inherit;font-size:13px;line-height:1.4;color:#374151;',
    'text-align:left;cursor:pointer;}',
    '.pc-item:hover{background:#f9fafb;color:#111827;}',
    '.pc-item:focus-visible{outline:2px solid #0168dd;outline-offset:-2px;}',
    '.pc-item .pc-dot{width:6px;height:6px;border-radius:999px;background:#d1d5db;flex:0 0 auto;}',
    '.pc-item.pc-on{font-weight:600;color:#111827;background:#f0f7ff;}',
    '.pc-item.pc-on .pc-dot{background:#2f80ed;}',
    '.pc-item .pc-label{flex:1 1 auto;min-width:0;}',
    '.pc-item .pc-meta{flex:0 0 auto;font-size:11px;font-weight:400;color:#9ca3af;}',
    '.pc-sep{height:1px;background:#f3f4f6;margin:8px 0 0;}',

    /* The honesty line + escape hatch under the screen axis. */
    '.pc-hint{padding:6px 16px 2px;font-size:11px;line-height:1.5;color:#9ca3af;}',
    '.pc-foot{padding:8px 16px 12px;margin-top:4px;border-top:1px solid #f3f4f6;',
    'font-size:11px;color:#9ca3af;}',

    /* Hidden-by-condition. `!important` because the elements being hidden are
       real page content carrying layout classes (`display:flex` etc.) that
       would otherwise win over a plain `display:none`. */
    '.pc-off{display:none !important;}',

    /* Iframe stage — starts below the review band so it stays reachable. The
       in-page screen frame is NOT here: that's #rt-page, owned by
       review-toolbar.core.js. This engine only sets its width. */
    'background:#fff;box-shadow:0 0 0 1px #d1d5db,0 8px 28px rgba(16,40,80,.14);}'
  ].join('');

  /* ── State ────────────────────────────────────────────────────────────── */
  var S = {
    cfg: null, roles: ROLES, projectRoles: null, plans: null, states: STATES,
    screen: 'fit', role: null, projectRole: null, plan: null, state: 'default',
    // `custom` — a SECOND free-form axis, same shape as `plans` (no generic
    // preset list; the prototype supplies its own items). `plans` already
    // proved the pattern: one extra axis a prototype defines for itself
    // without this file knowing what it means. `custom` generalizes that to
    // a second one, for whatever a prototype needs that isn't role, plan or
    // page state — e.g. AR0239's "Pay your team" goal toggle, which gates
    // which checklist steps exist rather than which plan tier is active.
    custom: null, customValue: null,
    reloaded: false,          // true while the iframe stage is up
    scale: 1,                 // <1 when the preset is wider than the window
    panel: null, toggle: null, stage: null, embed: false
  };

  var STORE = 'pc:conditions:';

  /* ── Utilities ────────────────────────────────────────────────────────── */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function icon(name) {
    var s = el('span', 'material-symbols-rounded');
    s.textContent = name;
    return s;
  }
  function byId(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function toks(attr) {
    return String(attr || '').split(/[\s,]+/).filter(Boolean);
  }
  /* Own BOTH the class and the `hidden` attribute.
     - The class carries `!important`, because the elements being toggled are real
       page content whose layout classes (`display:flex` …) beat a bare
       `[hidden]{display:none}`.
     - The attribute matters because that is how a variant is naturally authored:
       version-switcher.js marks an inactive container with `hidden`, and the
       standalone starter marks direction B the same way. An attribute set in the
       markup outranks any class rule, so clearing the class alone would select a
       variant and leave it invisible — which is exactly the bug this replaces. */
  function show(node, on) {
    node.classList.toggle('pc-off', !on);
    node.hidden = !on;
  }

  /* ── The matching rules ───────────────────────────────────────────────── */

  /* "org-owner manager" → only those. "!viewer" → everyone but viewer.
     Mixing both is allowed; negation wins, so `data-role="manager !viewer"`
     is a manager-only element that stays hidden from a viewer either way. */
  function matches(attr, active) {
    var list = toks(attr), neg = [], pos = [];
    list.forEach(function (t) {
      if (t.charAt(0) === '!') neg.push(t.slice(1)); else pos.push(t);
    });
    if (neg.length && neg.indexOf(active) !== -1) return false;
    if (pos.length) return pos.indexOf(active) !== -1;
    return true;
  }

  function applyRoles() {
    qsa('[data-role]').forEach(function (n) {
      show(n, S.role == null || matches(n.getAttribute('data-role'), S.role));
    });
    qsa('[data-project-role]').forEach(function (n) {
      show(n, S.projectRole == null ||
        matches(n.getAttribute('data-project-role'), S.projectRole));
    });
  }

  /* Resolved per parent so a state can be scoped to one region. See the header. */
  function applyStates() {
    if (!S.states) return;
    var parents = [], buckets = [];
    /* `data-state` is not ours alone. Zone's own switch renders
       data-state="checked|unchecked" and its data-[state=checked]: variants
       depend on that attribute, so a page with a Zone toggle used to have the
       toggle blanked the moment this ran: the group had no `default` member,
       so every node in it lost. Only an element that names a state THIS tool
       owns is a variant; everything else is page content, left alone. */
    var known = (S.states || STATES).map(function (st) { return st.id; });
    qsa('[data-state]').forEach(function (n) {
      var own = toks(n.getAttribute('data-state')).some(function (t) {
        return known.indexOf(t) !== -1;
      });
      if (!own) return;
      var i = parents.indexOf(n.parentNode);
      if (i === -1) { parents.push(n.parentNode); buckets.push([n]); }
      else buckets[i].push(n);
    });
    buckets.forEach(function (group) {
      var win = group.filter(function (n) {
        return toks(n.getAttribute('data-state')).indexOf(S.state) !== -1;
      });
      // Nothing authored for this state in this group → fall back to `default`,
      // so an undefined state leaves the region as-is instead of blanking it.
      if (!win.length) {
        win = group.filter(function (n) {
          return toks(n.getAttribute('data-state')).indexOf('default') !== -1;
        });
      }
      group.forEach(function (n) { show(n, win.indexOf(n) !== -1); });
    });
  }

  /* Clears any clamp left in localStorage-driven state by an older build that
     still had the screen axis. Without this a reviewer who last used a preset
     would stay clamped forever, with no UI left to release it. */
  function clearLegacyClamp() {
    var p = document.getElementById('rt-page');
    if (p) { p.style.removeProperty('--pc-w'); p.style.removeProperty('--pc-scale'); }
    document.body.classList.remove('pc-clamped');
    var stage = document.getElementById('pc-stage');
    if (stage) stage.remove();
  }

  /* ── Apply + persist ──────────────────────────────────────────────────── */
  function apply() {
    applyRoles();
    applyStates();
    paint();
    save();
    if (typeof (S.cfg && S.cfg.onChange) === 'function') {
      S.cfg.onChange({
        role: S.role, projectRole: S.projectRole, plan: S.plan, state: S.state,
        custom: S.customValue
      });
    }
  }

  function activeCount() {
    var n = 0;
    if (S.role && S.role !== S.roles[0].id) n++;
    if (S.projectRoles && S.projectRole && S.projectRole !== S.projectRoles[0].id) n++;
    if (S.plans && S.plan && S.plan !== S.plans[0].id) n++;
    if (S.custom && S.customValue && S.customValue !== S.custom[0].id) n++;
    if (S.state !== 'default') n++;
    return n;
  }

  function save() {
    if (S.cfg && S.cfg.remember === false) return;
    try {
      localStorage.setItem(STORE + location.pathname, JSON.stringify({
        role: S.role, projectRole: S.projectRole, plan: S.plan, state: S.state,
        customValue: S.customValue
      }));
    } catch (e) {}
  }
  function load() {
    if (S.cfg && S.cfg.remember === false) return null;
    try { return JSON.parse(localStorage.getItem(STORE + location.pathname)); }
    catch (e) { return null; }
  }

  /* ── Rendering ────────────────────────────────────────────────────────── */

  function paint() {
    if (S.toggle) {
      var badge = S.toggle.querySelector('.pc-count');
      var n = activeCount();
      if (n) { badge.textContent = n; badge.hidden = false; }
      else { badge.hidden = true; }
      S.toggle.classList.toggle('is-active', !!n);
    }
    if (!S.panel) return;
    qsa('.pc-item', S.panel).forEach(function (b) {
      var axis = b.dataset.pcAxis, id = b.dataset.pcId;
      var on = axis === 'role' ? S.role === id
        : axis === 'project-role' ? S.projectRole === id
        : axis === 'plan' ? S.plan === id
        : axis === 'custom' ? S.customValue === id
        : S.state === id;
      b.classList.toggle('pc-on', on);
    });
  }

  function axis(panel, label, items, axisName, onPick) {
    panel.appendChild(el('div', 'pc-group', label));
    items.forEach(function (it) {
      var b = el('button', 'pc-item');
      b.type = 'button';
      b.dataset.pcAxis = axisName;
      b.dataset.pcId = it.id;
      b.appendChild(el('span', 'pc-dot'));
      b.appendChild(el('span', 'pc-label', it.label));
      var meta = it.note || (it.width ? it.width + 'px' : '');
      if (meta) b.appendChild(el('span', 'pc-meta', meta));
      b.addEventListener('click', function () { onPick(it.id); });
      panel.appendChild(b);
    });
  }

  function build() {
    if (!document.getElementById('pc-style')) {
      var s = el('style'); s.id = 'pc-style'; s.textContent = CSS;
      document.head.appendChild(s);
    }

    var btn = el('button', 'pc-tc-btn');
    btn.id = 'pc-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.appendChild(icon('tune'));
    btn.appendChild(el('span', null, 'Conditions'));
    var badge = el('span', 'pc-count'); badge.hidden = true;
    btn.appendChild(badge);
    S.toggle = btn;

    var mount = (S.cfg && S.cfg.mount && document.querySelector(S.cfg.mount)) ||
      document.getElementById('review-toolbar') || document.body;
    mount.appendChild(btn);

    var panel = el('div');
    panel.id = 'pc-panel';
    panel.setAttribute('role', 'menu');
    S.panel = panel;

    if (S.roles) {
      axis(panel, S.rolesLabel, S.roles, 'role', function (id) { S.role = id; apply(); });
    }
    if (S.projectRoles) {
      panel.appendChild(el('div', 'pc-sep'));
      axis(panel, S.projectRolesLabel, S.projectRoles, 'project-role',
        function (id) { S.projectRole = id; apply(); });
    }
    if (S.plans) {
      panel.appendChild(el('div', 'pc-sep'));
      axis(panel, S.plansLabel, S.plans, 'plan', function (id) { S.plan = id; apply(); });
    }
    if (S.custom) {
      panel.appendChild(el('div', 'pc-sep'));
      axis(panel, S.customLabel, S.custom, 'custom', function (id) { S.customValue = id; apply(); });
    }
    if (S.states) {
      panel.appendChild(el('div', 'pc-sep'));
      axis(panel, S.statesLabel, S.states, 'state', function (id) { S.state = id; apply(); });
    }

    panel.appendChild(el('div', 'pc-foot',
      'Conditions are a view, not data — nothing here changes what the ' +
      'prototype would really return.'));

    document.body.appendChild(panel);

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      panel.classList.contains('pc-open') ? close() : open();
    });
    document.addEventListener('click', function (e) {
      if (!panel.contains(e.target) && !btn.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('pc-open')) { close(); btn.focus(); }
    });
    window.addEventListener('resize', position);
  }

  function position() {
    if (!S.panel || !S.toggle) return;
    var r = S.toggle.getBoundingClientRect();
    S.panel.style.top = (r.bottom + 8) + 'px';
    // Right-align to the button, but never off the left edge on a narrow window.
    var left = Math.max(12, r.right - S.panel.offsetWidth);
    S.panel.style.left = Math.min(left, window.innerWidth - S.panel.offsetWidth - 12) + 'px';
  }
  function open() {
    position();
    S.panel.classList.add('pc-open');
    S.toggle.setAttribute('aria-expanded', 'true');
  }
  function close() {
    S.panel.classList.remove('pc-open');
    S.toggle.setAttribute('aria-expanded', 'false');
  }

  /* ── Public API ───────────────────────────────────────────────────────── */
  var API = {
    /**
     * @param {object}  cfg
     * @param {Array|false} [cfg.roles]    Override / disable the org-role axis.
     * @param {string} [cfg.rolesLabel]    Group heading for the role axis. Default 'Role'.
     * @param {Array|true|false} [cfg.projectRoles]  Project-role axis. Off by default.
     * @param {string} [cfg.projectRolesLabel] Group heading for that axis. Default 'Project role'.
     * @param {Array}  [cfg.plans]         Plan/feature-access axis, e.g.
     *   `[{id:'has-access',label:'Plan w/ access'}, {id:'no-access',label:'Plan without access'}]`.
     *   Off by default — no generic preset, since plan tiers are per-product.
     * @param {string} [cfg.plansLabel]    Group heading for the plan axis. Default 'Plan'.
     * @param {Array}  [cfg.custom]        A second free-form axis, same shape/rules as
     *   `plans` — for whatever a prototype needs that isn't role, plan or page state
     *   (AR0239's "Pay your team" goal toggle, gating which checklist steps exist).
     *   Off by default.
     * @param {string} [cfg.customLabel]   Group heading for the custom axis. Default 'Custom'.
     * @param {Array|false} [cfg.states]    Override the page-state presets, or disable the
     *   axis entirely — e.g. when the page has no state a browser can't already show
     *   (the default Loading/Empty/Error presets would just be noise).
     * @param {string} [cfg.statesLabel]   Group heading for the state axis. Default 'Page state'.
     * @param {string} [cfg.mount]         Where the segment goes. Default #review-toolbar.
     * @param {boolean}[cfg.remember=true] Persist the choice per prototype.
     * @param {fn}     [cfg.onChange]      Called with the full condition set.
     */
    init: function (cfg) {
      S.cfg = cfg = cfg || {};
      S.states = cfg.states === false ? null : (cfg.states || STATES);
      S.roles = cfg.roles === false ? null : (cfg.roles || ROLES);
      S.rolesLabel = cfg.rolesLabel || 'Role';
      S.projectRoles = cfg.projectRoles === true ? PROJECT_ROLES
        : (Array.isArray(cfg.projectRoles) ? cfg.projectRoles : null);
      S.projectRolesLabel = cfg.projectRolesLabel || 'Project role';
      S.plans = Array.isArray(cfg.plans) ? cfg.plans : null;
      S.plansLabel = cfg.plansLabel || 'Plan';
      S.custom = Array.isArray(cfg.custom) ? cfg.custom : null;
      S.customLabel = cfg.customLabel || 'Custom';
      S.statesLabel = cfg.statesLabel || 'Page state';
      S.role = S.roles ? S.roles[0].id : null;
      S.projectRole = S.projectRoles ? S.projectRoles[0].id : null;
      S.plan = S.plans ? S.plans[0].id : null;
      S.customValue = S.custom ? S.custom[0].id : null;
      S.state = S.states ? S.states[0].id : 'default';

      var saved = load();
      if (saved) {
        if (S.roles && byId(S.roles, saved.role)) S.role = saved.role;
        if (S.projectRoles && byId(S.projectRoles, saved.projectRole)) S.projectRole = saved.projectRole;
        if (S.plans && byId(S.plans, saved.plan)) S.plan = saved.plan;
        if (S.custom && byId(S.custom, saved.customValue)) S.customValue = saved.customValue;
        if (S.states && byId(S.states, saved.state)) S.state = saved.state;
      }

      clearLegacyClamp();
      build();
      apply();
      return API;
    },

    /* True inside the "reload at this size" iframe. review-toolbar.core.js reads
       the same flag to skip mounting a second toolbar in there. */
    // Kept because review-toolbar.core.js calls it. Nothing produces a
    // ?pc=embed URL any more — the iframe stage went with the screen axis — so
    // this is now always false.
    isEmbed: function () { return false; },

    set: function (patch) { Object.assign(S, patch || {}); apply(); return API; },
    get: function () {
      return {
        role: S.role, projectRole: S.projectRole, plan: S.plan, state: S.state,
        custom: S.customValue
      };
    }
  };

  global.PrototypeConditions = API;
})(window);
