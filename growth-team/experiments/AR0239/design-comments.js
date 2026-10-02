/* =============================================================================
   Design Comments — click-to-place comment threads on a prototype
   -----------------------------------------------------------------------------
   The authoring layer `design-annotations.js` never had. That engine RENDERS a
   fixed `annotations` array and offers no way to add to it — you edited
   `design-annotations.data.js` by hand and reloaded. This makes commenting a
   live act: turn Comments on, click any element, type, done.

   It is a SEPARATE engine, not a patch. `design-annotations.js` is vendored and
   we don't edit it. Instead this file:

     • owns its own pins, composer and threads (its own DOM, its own `dc-` prefix)
     • pushes everything back through the engine's ONE public write API,
       `DesignAnnotations.setAnnotations(list, pages)`, which re-normalises, updates
       the drawer, rebuilds the cross-page index and refreshes the badge.

   So a comment you type shows up in "Comments" and in the "Design annotations"
   index immediately,
   with zero changes to the engine that renders them.

   ---------------------------------------------------------------------------
   A COMMITTED COMMENT IS STILL A COMMENT

   Baseline entries in `design-annotations.data.js` used to be inert: they
   listed in the drawer and that was the end of it — no pin on the element they
   were left on, no reply box — because pins and threads only ever came from the
   live list. So making a comment permanent stripped it of the two things that
   make it a comment. Entries that ARE comments (an exported `comment` payload,
   or `kind: 'suggestion'`) are now adopted into the live list at init: pinned,
   repliable, and re-exportable. Design NOTES, which are not comments, are left
   exactly as they were.

   WHICH FIELDS REACH THE SCREEN

   design-annotations.js draws `title` and the `sub` lines. It normalises
   `description` and then never renders it, and it does not read `body` at all.
   That is why a comment used to list with no author and no sign that anyone had
   replied — the byline was going into a field nobody drew. Bylines and replies
   now go in `sub`. Worth knowing before adding a field to an annotation.

   ---------------------------------------------------------------------------
   TWO MODES, DECIDED BY THE HOST

   SHARED — on the share host (prototype.designops.hbstf.co) there is a real
   store behind `/api/comments`, so a comment is visible to everyone who can
   open the prototype. Identity comes from Cloudflare Access, which the host
   already sits behind: no name prompt, and nobody can post as someone else.
   The engine probes for the endpoint once at init; if it answers, this mode is
   on and the bar says "shared with your team".

   LOCAL — anywhere the endpoint does not answer (the Vite dev server, a file://
   copy, the host before its store is bound), everything below still works out
   of localStorage exactly as it always did. That fallback is not a nicety: it
   is what lets the backend be deployed and bound in either order without a
   window where commenting is broken.

   localStorage stays the write-through cache in BOTH modes, so a dropped
   network keeps the comment you just typed, and the next successful flush
   sends it.

   ---------------------------------------------------------------------------
   WHERE COMMENTS LIVE WITHOUT THE BACKEND

   `localStorage`, keyed per prototype — instant, survives reload, and works the
   same in `npm run dev` and on a published `npm run build` share, neither of
   which has a backend.

   In LOCAL mode a comment is local to one browser, so comments move between
   people as text, and the engine owns both ends of that trip. Export/Import
   also stay useful in SHARED mode: Export is still how a comment becomes part
   of the committed prototype for good.

     Export  — copies a ready-to-paste `design-annotations.data.js`. Commit it and
               the comments load as authored baseline for everyone who opens the
               prototype. Every exported comment also carries a machine-readable
               `comment` payload (text, author, timestamps, replies, status), so
               the file is a lossless interchange format and not just prose.
     Import  — paste what someone sent you (an exported file, or a raw JSON array
               of threads) and their comments merge into yours, deduped by id, as
               live comments you can reply to and re-export.

   So a teammate reviewing a shared link hits Export and sends you the text; you
   hit Import. Nothing reaches you on its own, and the UI says so out loud — the
   first comment anyone leaves raises a notice saying it is theirs alone until
   they export it. Silence there was the actual bug: people assumed comments on a
   shared link travelled back to the author.

   ---------------------------------------------------------------------------
   PINS ARE OFF UNTIL COMMENTS IS ON

   Markers must sit on the UI to point at an element, which is exactly the
   overlap the review band was moved out of the page to avoid. So they are not
   ambient: nothing is drawn until the Comments drawer is open. Then pins appear
   and the page becomes clickable for placing. Close it and the prototype is
   clean again — including in screenshots.

   We detect that by watching `.da-panel.is-open` rather than hijacking the
   engine's button: the click handler on `#da-fab` belongs to the engine, and
   wrapping it would break the moment the engine changed. Observing the state it
   already publishes is the seam that can't rot.
   ============================================================================= */
(function (global) {
  'use strict';

  var STORE = 'dc:comments:';
  var WHO = 'dc:author';
  var TOLD = 'dc:told-local:';   // per-prototype: the "only you can see this" notice

  var CSS = [
    /* Pin layer — transparent to the mouse except on the pins themselves. */
    '#dc-layer{position:fixed;inset:0;z-index:1140;pointer-events:none;}',
    '.dc-pin{position:absolute;pointer-events:auto;min-width:22px;height:22px;padding:0 6px;',
    'border-radius:11px 11px 11px 2px;background:#0168dd;color:#fff;border:2px solid #fff;',
    'box-shadow:0 2px 6px rgba(16,40,80,.28);cursor:pointer;',
    'font:600 11px/18px Roboto,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
    'display:inline-flex;align-items:center;justify-content:center;transform:translate(-4px,-11px);}',
    '.dc-pin:hover{background:#0a4b96;}',
    '.dc-pin.dc-resolved{background:#9ca3af;}',
    '.dc-pin.dc-active{background:#111827;}',

    /* Target outline while a pin is hovered / a thread is open. */
    '.dc-halo{position:absolute;pointer-events:none;border:2px solid #0168dd;border-radius:4px;',
    'background:rgba(1,104,221,.06);}',

    /* Placing mode */
    'body.dc-placing, body.dc-placing * {cursor:crosshair !important;}',
    '#dc-scrim{position:fixed;inset:0;z-index:1139;pointer-events:none;',
    'box-shadow:inset 0 0 0 2px #0168dd;}',

    /* The action bar, docked bottom-centre while Comments is open. */
    '#dc-bar{position:fixed;z-index:1160;left:50%;bottom:20px;transform:translateX(-50%);',
    'display:flex;align-items:center;gap:2px;height:36px;padding:0 4px;background:#fff;',
    'border-radius:999px;box-shadow:inset 0 0 0 1px #e5e7eb,0 6px 18px rgba(17,24,39,.14);',
    'font-family:Roboto,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}',
    '#dc-bar button{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;',
    'border:0;border-radius:999px;background:transparent;color:#374151;font-family:inherit;',
    'font-size:12px;font-weight:500;cursor:pointer;}',
    '#dc-bar button:hover{background:#f9fafb;color:#111827;}',
    '#dc-bar button.dc-primary{background:#0168dd;color:#fff;}',
    '#dc-bar button.dc-primary:hover{background:#0a4b96;}',
    '#dc-bar button.dc-primary.dc-on{background:#111827;}',
    '#dc-bar .dc-count{font-size:11px;color:#9ca3af;padding:0 8px;white-space:nowrap;}',
    '#dc-bar .dc-sep{width:1px;height:18px;background:#e5e7eb;margin:0 2px;}',
    '#dc-bar .material-symbols-rounded{font-size:16px !important;}',

    /* Popovers — composer + thread share one shell. */
    '.dc-pop{position:fixed;z-index:1170;width:300px;background:#fff;border:1px solid #e5e7eb;',
    'border-radius:12px;box-shadow:0 10px 28px rgba(16,40,80,.18);',
    'font-family:Roboto,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow:hidden;}',
    '.dc-pop-head{display:flex;align-items:center;gap:8px;padding:10px 12px;',
    'border-bottom:1px solid #f3f4f6;font-size:12px;font-weight:600;color:#111827;}',
    '.dc-pop-head .dc-x{margin-left:auto;border:0;background:none;cursor:pointer;color:#9ca3af;',
    'display:inline-flex;padding:2px;}',
    '.dc-pop-head .dc-x:hover{color:#111827;}',
    '.dc-pop-head .dc-copy{border:0;background:none;cursor:pointer;color:#9ca3af;',
    'display:inline-flex;padding:2px;margin-left:2px;}',
    '.dc-pop-head .dc-copy:hover{color:#0168dd;}',
    '.dc-pop-head .dc-copy .material-symbols-rounded{font-size:15px !important;}',
    '.dc-pop-body{max-height:300px;overflow-y:auto;padding:4px 0;}',
    '.dc-msg{padding:10px 12px;border-bottom:1px solid #f9fafb;}',
    '.dc-msg:last-child{border-bottom:0;}',
    '.dc-meta{display:flex;align-items:baseline;gap:6px;font-size:11px;color:#9ca3af;margin-bottom:3px;}',
    '.dc-meta b{font-size:12px;font-weight:600;color:#374151;}',
    '.dc-text{font-size:13px;line-height:1.5;color:#374151;white-space:pre-wrap;word-break:break-word;}',
    '.dc-pop textarea{display:block;width:100%;box-sizing:border-box;min-height:66px;resize:vertical;',
    'border:0;padding:10px 12px;font:400 13px/1.5 Roboto,-apple-system,sans-serif;color:#111827;}',
    '.dc-pop textarea:focus{outline:none;}',
    '.dc-pop-foot{display:flex;align-items:center;gap:6px;padding:8px 10px;border-top:1px solid #f3f4f6;}',
    '.dc-pop-foot .dc-spacer{flex:1 1 auto;}',
    '.dc-btn{height:28px;padding:0 12px;border-radius:6px;border:1px solid #e5e7eb;background:#fff;',
    'font:500 12px/1 Roboto,-apple-system,sans-serif;color:#374151;cursor:pointer;}',
    '.dc-btn:hover{background:#f9fafb;color:#111827;}',
    '.dc-btn-primary{background:#0168dd;border-color:#0168dd;color:#fff;}',
    '.dc-btn-primary:hover{background:#0a4b96;border-color:#0a4b96;color:#fff;}',
    '.dc-btn-danger:hover{background:#fdf2f2;border-color:#f8b4b4;color:#c81e1e;}',
    '.dc-hint{padding:8px 12px;font-size:11px;line-height:1.5;color:#9ca3af;border-top:1px solid #f3f4f6;}',
    '.dc-target{font-size:11px;color:#9ca3af;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;',
    'word-break:break-all;}',

    /* Import panel — the .dc-pop shell, centred over the bar and wider, because
       what gets pasted into it is a file. */
    '.dc-io{left:50%;bottom:66px;transform:translateX(-50%);width:min(560px,92vw);}',
    '.dc-io textarea{min-height:150px;font:400 11px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;',
    'color:#374151;}',
    '.dc-io-msg{font-size:11px;color:#6b7280;}',
    '.dc-io-msg.is-bad{color:#c81e1e;}',

    /* The notice. Deliberately a dark toast and not a .dc-hint in a corner: it
       is the one thing a first-time commenter must not miss. */
    '.dc-note{position:fixed;left:50%;bottom:66px;transform:translateX(-50%);z-index:1180;',
    'max-width:min(440px,92vw);display:flex;align-items:flex-start;gap:10px;',
    'background:#111827;color:#fff;border-radius:10px;padding:11px 13px;',
    'box-shadow:0 10px 28px rgba(16,40,80,.28);',
    'font:400 12px/1.45 Roboto,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}',
    '.dc-note b{font-weight:600;}',
    '.dc-note .material-symbols-rounded{font-size:18px !important;color:#faca15;flex-shrink:0;}',
    '.dc-note button{margin-left:auto;border:0;background:none;color:#9ca3af;cursor:pointer;',
    'display:inline-flex;padding:0;}',
    '.dc-note button:hover{color:#fff;}'
  ].join('');

  var S = {
    cfg: null, page: null, authored: [], comments: [], seq: 0,
    on: false, placing: false, activeId: null,
    layer: null, bar: null, pop: null, io: null, halo: null, scrim: null, raf: 0, obs: null,
    /* SHARED mode. `remote` is only true once /api/comments has actually
       answered; `shadow` is the last signature we know the server holds, per
       thread, which is what turns "save everything" into "post what changed";
       `unconfirmed` holds ids posted but not yet acknowledged, so a poll that
       lands mid-flight cannot make a just-typed comment disappear. */
    remote: false, you: null, shadow: {}, unconfirmed: {}, poll: 0, offline: false,
    vseen: null,           // last version the drawer's bylines were written for
    anchors: {},           // committed pin targets, by id — the data file owns these
    reveals: {}            // committed reveal keys, by id — same owner, same reason
  };

  /* ── utilities ────────────────────────────────────────────────────────── */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function icon(name) { return el('span', 'material-symbols-rounded', name); }
  function now() { return new Date().toISOString(); }
  function when(iso) {
    var d = new Date(iso), s = (Date.now() - d.getTime()) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return d.toLocaleDateString();
  }

  /* A selector that survives a reload. Prefer anything the author gave the
     element on purpose; fall back to a positional path, which is stable as long
     as the markup is. Capped at the page frame so the path never includes the
     review chrome. */
  function selectorFor(node) {
    if (node.id) return '#' + CSS_esc(node.id);
    var testid = node.getAttribute('data-testid') || node.getAttribute('data-test');
    if (testid) return '[data-testid="' + testid + '"]';
    var parts = [], cur = node, guard = 0;
    while (cur && cur.nodeType === 1 && guard++ < 12) {
      if (cur.id) { parts.unshift('#' + CSS_esc(cur.id)); break; }
      if (cur === document.body || cur.id === 'rt-page') break;
      var parent = cur.parentElement;
      if (!parent) break;
      var same = Array.prototype.filter.call(parent.children, function (c) {
        return c.tagName === cur.tagName;
      });
      var sel = cur.tagName.toLowerCase();
      if (same.length > 1) sel += ':nth-of-type(' + (same.indexOf(cur) + 1) + ')';
      parts.unshift(sel);
      cur = parent;
    }
    return parts.join(' > ');
  }
  function CSS_esc(s) {
    return (global.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/([^\w-])/g, '\\$1');
  }
  function resolve(sel) {
    try { return sel ? document.querySelector(sel) : null; } catch (e) { return null; }
  }

  /* ── storage ──────────────────────────────────────────────────────────── */
  function key() { return STORE + location.pathname; }
  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(key()));
      return Array.isArray(raw) ? raw : [];
    } catch (e) { return []; }
  }
  /* localStorage is the write-through cache in both modes; in SHARED mode the
     same call pushes whatever changed. Every mutation already goes through
     here, which is the point: sync cannot be forgotten by a new code path. */
  function save() {
    try { localStorage.setItem(key(), JSON.stringify(S.comments)); } catch (e) {}
    flush();
  }
  function author(ask) {
    // SHARED mode knows who you are — Access verified it. Asking again would be
    // theatre, and a typed name could disagree with the one the server records.
    if (S.remote && S.you && S.you.name) return S.you.name;
    var who = null;
    try { who = localStorage.getItem(WHO); } catch (e) {}
    if (!who && ask) {
      /* prompt() is not merely ignored in an embedded preview — it THROWS
         ("prompt() is not supported"). Unguarded, that took the caller down
         with it, and the caller is the line right before `replies.push(...)`:
         every reply and every new comment typed in such a frame vanished with
         no error anyone would see. A name is worth asking for; it is not worth
         losing someone's comment over. */
      try {
        who = (global.prompt('Your name — shown on every comment you leave:') || '').trim();
      } catch (e) { who = ''; }
      if (who) { try { localStorage.setItem(WHO, who); } catch (e) {} }
    }
    return who || 'Anonymous';
  }

  /* ── the shared store ─────────────────────────────────────────────────── */

  var API_BASE = '/api/comments';

  function protoPath() { return location.pathname; }

  /* Field-order-stable, and deliberately blind to `updatedAt`/`email`: those
     are assigned by the server, so including them would make every round trip
     look like a local change and re-post forever. */
  function sig(c) {
    return [
      c.id, c.page || '', c.target || '', c.author || '', c.text, c.status || 'open',
      (c.replies || []).map(function (r) {
        return (r.author || '') + '|' + (r.text || '') + '|' + (r.createdAt || '');
      }).join('~')
    ].join('\u0001');
  }

  function markOffline(off) {
    if (S.offline === off) return;
    S.offline = off;
    paintBar();
  }

  function postJSON(body) {
    return fetch(API_BASE, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  /* Post every thread whose signature has moved, and delete every thread the
     server still has that we no longer do. Driven from save(), which is the one
     function every mutation path already calls — so no write can forget to
     sync, including ones added later. */
  function flush() {
    if (!S.remote) return;
    var here = {};

    S.comments.forEach(function (c) {
      here[c.id] = 1;
      var s0 = sig(c);
      if (S.shadow[c.id] === s0) return;
      S.shadow[c.id] = s0;
      S.unconfirmed[c.id] = 1;
      postJSON({ p: protoPath(), comment: c }).then(function (res) {
        delete S.unconfirmed[c.id];
        if (!res || !res.comment) return;
        // Take the server's copy: it owns author/email (from Access) and
        // updatedAt, and re-shadowing against it stops a re-post loop.
        var i = index(c.id);
        if (i !== -1) {
          S.comments[i] = res.comment;
          S.shadow[c.id] = sig(res.comment);
          try { localStorage.setItem(key(), JSON.stringify(S.comments)); } catch (e) {}
          push(); paintBar();
        }
        markOffline(false);
      }, function () {
        delete S.unconfirmed[c.id];
        delete S.shadow[c.id];     // so the next save retries it
        markOffline(true);
      });
    });

    Object.keys(S.shadow).forEach(function (id) {
      if (here[id]) return;
      delete S.shadow[id];
      postJSON({ p: protoPath(), op: 'delete', id: id })
        .then(function () { markOffline(false); }, function () { markOffline(true); });
    });
  }

  function index(id) {
    for (var i = 0; i < S.comments.length; i++) if (S.comments[i].id === id) return i;
    return -1;
  }

  /* The server is the truth, with one exception: a thread we have posted and
     not yet had acknowledged stays, or typing a comment and having the poll
     land 200ms later would erase it in front of the person who wrote it. */
  function adopt(list) {
    list.forEach(applyAnchor);               // the data file re-pins, not the store
    var keep = S.comments.filter(function (c) { return S.unconfirmed[c.id]; });
    var byId = {};
    list.forEach(function (c) { byId[c.id] = 1; });
    S.comments = list.concat(keep.filter(function (c) { return !byId[c.id]; }));
    S.shadow = {};
    list.forEach(function (c) { S.shadow[c.id] = sig(c); });
    S.seq = S.comments.length;
    try { localStorage.setItem(key(), JSON.stringify(S.comments)); } catch (e) {}
    push(); renderPins(); paintBar();
  }

  function pull() {
    if (!S.remote) return Promise.resolve();
    return fetch(API_BASE + '?p=' + encodeURIComponent(protoPath()), { headers: { accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (res) {
        if (!res || !res.ok || !Array.isArray(res.comments)) return;
        if (res.you) S.you = res.you;
        adopt(res.comments);
        markOffline(false);
      }, function () { markOffline(true); });
  }

  /* One probe, at init. A 503 ("no store bound") counts as absent, which is why
     the backend can be deployed before its database exists. */
  function probe() {
    if (!global.fetch) return Promise.resolve(false);
    return fetch(API_BASE + '?p=' + encodeURIComponent(protoPath()), { headers: { accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (res) {
        if (!res || !res.ok || !Array.isArray(res.comments)) return false;
        S.remote = true;
        if (res.you) S.you = res.you;

        /* Anything already in this browser and not on the server is a comment
           written before the backend existed (or while it was down). Hand it up
           rather than dropping it — this is the migration path for every
           localStorage comment already out there. */
        var byId = {};
        res.comments.forEach(function (c) { byId[c.id] = 1; });
        var mine = S.comments.filter(function (c) { return !byId[c.id]; });
        adopt(res.comments);
        if (mine.length) {
          S.comments = S.comments.concat(mine);
          flush();
        }
        return true;
      }, function () { return false; });
  }

  /* Re-render pins until the thread's element has a box, or we give up. */
  function awaitTarget(id, done) {
    var c = byId(id);
    var tries = 0;
    (function tick() {
      renderPins();
      var ok = c && onScreen(c);
      if (ok || tries++ > 12) { done(); return; }   // ~2.4s ceiling
      setTimeout(tick, 200);
    })();
  }

  function startPoll() {
    if (!S.remote || S.poll) return;
    // Only while the drawer is open — see the note on ambient pins.
    S.poll = setInterval(function () { if (!S.pop) pull(); }, 20000);
    pull();
  }
  function stopPoll() {
    if (S.poll) { clearInterval(S.poll); S.poll = 0; }
  }

  /* ── feed the annotations engine ──────────────────────────────────────── */

  /* WHICH VERSION A COMMENT LIVES IN.
     With three directions in one file, "where is this comment" is not just a
     place on the page — it is which DESIGN. A comment anchored inside #v-a
     cannot show a pin while A2 is on screen, because its element sits in a
     hidden container, and the drawer used to say only "pin is on another
     screen", which reads like a scroll problem rather than a version one.
     Resolved through the switcher's own list, so the label is the version's
     real code and not a guess parsed out of a selector. */
  function versions() {
    var vs = global.VersionSwitcher;
    return (vs && vs._flat) || [];
  }
  function currentVersionId() {
    var vs = global.VersionSwitcher;
    return (vs && vs._current && vs._current.id) || null;
  }
  function versionOf(c) {
    var t = resolve(c.target);
    var box = t && t.closest && t.closest('[data-version]');
    if (!box) return null;
    var flat = versions();
    for (var i = 0; i < flat.length; i++) {
      if (flat[i].el && document.querySelector(flat[i].el) === box) return flat[i];
    }
    return { id: box.id, code: box.id.replace(/^v-/, '').toUpperCase(), name: null };
  }
  function versionTag(v) {
    if (!v) return '';
    return 'Version ' + (v.code || String(v.id).toUpperCase());
  }

  /* Bring the right design on screen before pointing at something inside it.
     Returns true when it had to switch, so callers can wait for the swap. */
  function ensureVersion(c) {
    var v = versionOf(c);
    if (!v || !v.id || v.id === currentVersionId()) return false;
    var vs = global.VersionSwitcher;
    if (!vs || typeof vs.show !== 'function') return false;
    vs.show(v.id);
    return true;
  }

  /* True when a thread's element is currently rendered. A prototype has states,
     unlike a Figma canvas: a comment left on the dashboard has no element to
     pin to while you are looking at the checklist. That is not a broken
     comment, so the drawer says where it is rather than dropping it. */
  function onScreen(c) {
    var t = resolve(c.target);
    if (!t) return false;
    var r = t.getBoundingClientRect();
    return r.width > 0 || r.height > 0;
  }

  /* Map a comment thread onto the shape design-annotations.js normalises.
     The drawer renders exactly two things — `title` and the `sub` lines — so
     the byline goes in `sub`, not in `description`: description is normalised
     by that engine and then never drawn, which is why comments used to list
     with no author and no sign that anyone had replied. `description` is kept
     as well, since it is the semantically right field and costs nothing. */
  function toAnnotation(c) {
    var extra = c.replies.length
      ? ' · ' + c.replies.length + (c.replies.length === 1 ? ' reply' : ' replies')
      : '';
    /* Spell out the role, not just the name. The drawer has two sections and
       the same person can appear in both — as the author of a design note and
       as the author of a reply — so "Henrique" alone left it ambiguous which
       was which. "Comment from …" / "Reply from …" reads unambiguously. */
    var v = versionOf(c);
    var where = '';
    if (v && v.id && v.id !== currentVersionId()) {
      where = ' · ' + versionTag(v) + ' — click to switch';
    } else if (!onScreen(c)) {
      where = (v ? ' · ' + versionTag(v) : '') +
        (S.reveals[c.id] ? ' · click to open that screen' : ' · pin is on another screen');
    } else if (v) {
      where = ' · ' + versionTag(v);
    }
    var by = 'Comment from ' + c.author + ' · ' + when(c.createdAt) + extra + where;
    return {
      id: c.id,
      page: c.page,
      title: c.text.split('\n')[0].slice(0, 120),
      description: by,
      sub: [by].concat(c.replies.map(function (r) {
        return 'Reply from ' + r.author + ': ' + r.text;
      })),
      target: c.target,
      reveal: S.reveals[c.id] || null,
      kind: 'suggestion',
      status: c.status
    };
  }

  function push() {
    if (!global.DesignAnnotations || !global.DesignAnnotations.setAnnotations) return;
    var merged = S.authored.concat(S.comments.map(toAnnotation));
    global.DesignAnnotations.setAnnotations(merged, S.cfg.pages || null);
  }

  /* ── pins ─────────────────────────────────────────────────────────────── */
  function openComments() {
    return !!document.querySelector('.da-panel.is-open');
  }

  function renderPins() {
    if (!S.layer) return;
    S.layer.textContent = '';
    if (!S.on) return;
    S.comments.forEach(function (c, i) {
      var target = resolve(c.target);
      if (!target) return;                       // markup moved — skip, don't guess
      var r = target.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      var pin = el('button', 'dc-pin', String(i + 1));
      pin.type = 'button';
      pin.title = c.author + ': ' + c.text.slice(0, 80);
      if (c.status === 'resolved') pin.classList.add('dc-resolved');
      if (c.id === S.activeId) pin.classList.add('dc-active');
      pin.style.left = r.left + 'px';
      pin.style.top = r.top + 'px';
      pin.addEventListener('click', function (e) {
        e.stopPropagation();
        openThread(c.id);
      });
      pin.addEventListener('mouseenter', function () { halo(target); });
      pin.addEventListener('mouseleave', function () { halo(null); });
      S.layer.appendChild(pin);
    });
  }

  function halo(target) {
    if (!S.halo) return;
    if (!target) { S.halo.style.display = 'none'; return; }
    var r = target.getBoundingClientRect();
    S.halo.style.display = 'block';
    S.halo.style.left = r.left + 'px';
    S.halo.style.top = r.top + 'px';
    S.halo.style.width = r.width + 'px';
    S.halo.style.height = r.height + 'px';
  }

  function schedule() {
    if (S.raf) return;
    S.raf = requestAnimationFrame(function () {
      S.raf = 0;
      renderPins();
      if (S.activeId) {
        var c = byId(S.activeId);
        halo(c ? resolve(c.target) : null);
      }
    });
  }

  function byId(id) {
    for (var i = 0; i < S.comments.length; i++) if (S.comments[i].id === id) return S.comments[i];
    return null;
  }

  /* ── placing ──────────────────────────────────────────────────────────── */
  function startPlacing() {
    if (S.placing) return stopPlacing();
    S.placing = true;
    document.body.classList.add('dc-placing');
    if (!S.scrim) { S.scrim = el('div'); S.scrim.id = 'dc-scrim'; document.body.appendChild(S.scrim); }
    S.scrim.style.display = 'block';
    paintBar();
    // Capture phase, so the prototype never reacts to the picking click.
    document.addEventListener('click', pick, true);
    document.addEventListener('keydown', escPlacing, true);
  }
  function stopPlacing() {
    S.placing = false;
    document.body.classList.remove('dc-placing');
    if (S.scrim) S.scrim.style.display = 'none';
    paintBar();
    document.removeEventListener('click', pick, true);
    document.removeEventListener('keydown', escPlacing, true);
  }
  function escPlacing(e) { if (e.key === 'Escape') { e.preventDefault(); stopPlacing(); } }

  function isOurs(node) {
    return !!(node && node.closest && node.closest(
      '#dc-layer,#dc-bar,.dc-pop,#dc-scrim,#review-toolbar,.da-panel,.da-tc-modal,' +
      '.da-tc-backdrop,#pc-panel,.dm-panel'));
  }

  function pick(e) {
    if (isOurs(e.target)) return;               // let our own UI work normally
    e.preventDefault();
    e.stopPropagation();
    var node = e.target;
    if (!node || node.nodeType !== 1) return;
    stopPlacing();
    compose(node, e.clientX, e.clientY);
  }

  /* ── popovers ─────────────────────────────────────────────────────────── */
  function closePop() {
    if (S.pop) { S.pop.remove(); S.pop = null; }
    S.activeId = null;
    halo(null);
    renderPins();
  }

  function placePop(pop, x, y) {
    document.body.appendChild(pop);
    var w = pop.offsetWidth, h = pop.offsetHeight;
    var left = Math.min(Math.max(12, x + 12), window.innerWidth - w - 12);
    var top = Math.min(Math.max(12, y + 12), window.innerHeight - h - 12);
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
  }

  function popShell(titleText) {
    var pop = el('div', 'dc-pop');
    var head = el('div', 'dc-pop-head');
    head.appendChild(icon('comment'));
    head.appendChild(el('span', null, titleText));
    var x = el('button', 'dc-x');
    x.type = 'button';
    x.appendChild(icon('close'));
    x.addEventListener('click', closePop);
    head.appendChild(x);
    pop.appendChild(head);
    pop.addEventListener('click', function (e) { e.stopPropagation(); });
    return pop;
  }

  function compose(node, x, y) {
    closePop();
    var sel = selectorFor(node);
    halo(node);
    var pop = popShell('New comment');
    var ta = el('textarea');
    ta.placeholder = 'What needs to change here?';
    pop.appendChild(ta);
    var tgt = el('div', 'dc-hint');
    tgt.appendChild(el('div', 'dc-target', sel));
    pop.appendChild(tgt);
    var foot = el('div', 'dc-pop-foot');
    foot.appendChild(el('span', 'dc-spacer'));
    var cancel = el('button', 'dc-btn', 'Cancel');
    cancel.type = 'button';
    cancel.addEventListener('click', closePop);
    var add = el('button', 'dc-btn dc-btn-primary', 'Comment');
    add.type = 'button';
    add.addEventListener('click', function () {
      var text = ta.value.trim();
      if (!text) { ta.focus(); return; }
      S.comments.push({
        id: 'dc-' + (++S.seq) + '-' + Date.now().toString(36),
        page: S.page, target: sel, author: author(true), text: text,
        createdAt: now(), status: 'open', replies: []
      });
      save(); push(); closePop(); renderPins(); paintBar();
      maybeNotice();
    });
    foot.appendChild(cancel);
    foot.appendChild(add);
    pop.appendChild(foot);
    placePop(pop, x, y);
    S.pop = pop;
    ta.focus();
    // ⌘/Ctrl+Enter to post, like every other comment box.
    ta.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') add.click();
      if (e.key === 'Escape') closePop();
    });
  }

  function openThread(id) {
    var c = byId(id);
    if (!c) return;
    closePop();
    S.activeId = id;
    var target = resolve(c.target);
    halo(target);
    renderPins();
    var r = target ? target.getBoundingClientRect() : { left: 40, top: 80, width: 0, height: 0 };

    var pop = popShell(c.status === 'resolved' ? 'Resolved' : 'Comment');

    /* The Figma habit: you found the thing, now you send someone straight to
       it. It belongs beside the title rather than among the actions in the
       footer — copying a link is about this thread's identity, not something
       you do TO it, and it should not sit next to Delete. */
    var link = el('button', 'dc-copy');
    link.type = 'button';
    link.title = 'Copy a link to this comment';
    link.setAttribute('aria-label', 'Copy a link to this comment');
    link.appendChild(icon('content_copy'));
    link.addEventListener('click', function (e) {
      e.stopPropagation();
      writeClipboard(linkTo(id), function (ok) {
        var g = link.firstChild;
        g.textContent = ok ? 'check' : 'content_paste';
        setTimeout(function () { g.textContent = 'content_copy'; }, 1600);
      });
    });
    var head = pop.querySelector('.dc-pop-head');
    head.insertBefore(link, head.querySelector('.dc-x'));
    var body = el('div', 'dc-pop-body');
    [{ author: c.author, text: c.text, createdAt: c.createdAt }]
      .concat(c.replies)
      .forEach(function (m) {
        var msg = el('div', 'dc-msg');
        var meta = el('div', 'dc-meta');
        meta.appendChild(el('b', null, m.author));
        meta.appendChild(el('span', null, when(m.createdAt)));
        msg.appendChild(meta);
        msg.appendChild(el('div', 'dc-text', m.text));
        body.appendChild(msg);
      });
    pop.appendChild(body);

    var ta = el('textarea');
    ta.placeholder = 'Reply…';
    ta.style.minHeight = '48px';
    pop.appendChild(ta);

    var foot = el('div', 'dc-pop-foot');
    var del = el('button', 'dc-btn dc-btn-danger', 'Delete');
    del.type = 'button';
    /* Same story as prompt(): confirm() throws in an embedded preview, and a
       thrown guard used to mean the delete silently did nothing. So the
       confirmation is the button itself — click, it asks, click again inside
       four seconds and it goes. No modal, works everywhere, and deleting
       someone else's comment still takes two deliberate clicks. */
    var armed = false, armTimer = 0;
    del.addEventListener('click', function () {
      if (!armed) {
        armed = true;
        del.textContent = 'Delete — sure?';
        armTimer = setTimeout(function () {
          armed = false;
          del.textContent = 'Delete';
        }, 4000);
        return;
      }
      clearTimeout(armTimer);
      S.comments = S.comments.filter(function (x) { return x.id !== id; });
      save(); push(); closePop(); paintBar();
    });
    var res = el('button', 'dc-btn', c.status === 'resolved' ? 'Reopen' : 'Resolve');
    res.type = 'button';
    res.addEventListener('click', function () {
      c.status = c.status === 'resolved' ? 'open' : 'resolved';
      save(); push(); closePop(); paintBar();
    });
    var send = el('button', 'dc-btn dc-btn-primary', 'Reply');
    send.type = 'button';
    send.addEventListener('click', function () {
      var text = ta.value.trim();
      if (!text) { ta.focus(); return; }
      c.replies.push({ author: author(true), text: text, createdAt: now() });
      save(); push(); openThread(id); paintBar();
    });
    foot.appendChild(del);
    foot.appendChild(res);
    foot.appendChild(el('span', 'dc-spacer'));
    foot.appendChild(send);
    pop.appendChild(foot);

    placePop(pop, r.left + r.width, r.top);
    S.pop = pop;
    ta.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') send.click();
      if (e.key === 'Escape') closePop();
    });
  }

  /* ── export ───────────────────────────────────────────────────────────── */
  function dataFile() {
    var all = S.authored.concat(S.comments.map(function (c) {
      // Export the THREAD, not the flattened annotation — replies would be lost
      // otherwise, and a committed comment should read the same as a live one.
      var out = {
        id: c.id, page: c.page, selector: c.target, kind: 'suggestion',
        title: c.text.split('\n')[0].slice(0, 120),
        description: c.author + ' · ' + new Date(c.createdAt).toLocaleDateString(),
        status: c.status
      };
      if (c.replies.length) {
        out.sub = c.replies.map(function (m) { return m.author + ': ' + m.text; });
      }
      /* `title`/`description`/`sub` are for a human reading the committed file.
         This is the machine copy, and it is what makes the file a round trip:
         Import restores the thread exactly rather than reconstructing it from
         prose. Unknown keys are dropped by the annotations engine's normaliser,
         so carrying it costs the rendered output nothing. */
      out.comment = {
        text: c.text, author: c.author, createdAt: c.createdAt,
        status: c.status, replies: c.replies.slice()
      };
      return out;
    }));
    return '/* Design comments for this prototype. Generated by design-comments.js —\n' +
      '   exported ' + new Date().toLocaleString() + '. Commit this file and the\n' +
      '   comments become part of the prototype for everyone who opens it. */\n' +
      'window.DESIGN_ANNOTATIONS_DATA = {\n' +
      '  pages: ' + JSON.stringify(S.cfg.pages || [], null, 2).replace(/\n/g, '\n  ') + ',\n' +
      '  annotations: ' + JSON.stringify(all, null, 2).replace(/\n/g, '\n  ') + '\n};\n';
  }

  /* ── import ───────────────────────────────────────────────────────────── */

  /* Accepts, in order of how people actually paste things:
       · a whole exported design-annotations.data.js (JS, not JSON)
       · the bare JSON object  { pages, annotations }
       · a bare JSON array of annotations, or of raw comment threads
     Returns an array of plain objects, or null if there is nothing usable. */
  function parseIn(text) {
    var t = String(text || '').trim();
    if (!t) return null;

    var direct = null;
    try { direct = JSON.parse(t); } catch (e) {}
    if (!direct) {
      // The exported file is JavaScript. Slice out the annotations array — it is
      // the last thing in the object, so the final `]` closes it.
      var i = t.indexOf('annotations:');
      var open = i === -1 ? -1 : t.indexOf('[', i);
      var close = t.lastIndexOf(']');
      if (open !== -1 && close > open) {
        try { direct = JSON.parse(t.slice(open, close + 1)); } catch (e) {}
      }
    }
    if (!direct) return null;
    if (Array.isArray(direct)) return direct;
    if (Array.isArray(direct.annotations)) return direct.annotations;
    if (Array.isArray(direct.comments)) return direct.comments;
    return null;
  }

  /* One incoming entry → a live comment thread, or null if it is not a comment.
     Three shapes reach here: an export carrying the `comment` payload, an older
     export without it (kind 'suggestion' + "Author · date" in description), and
     a raw thread straight out of DesignComments.all(). */
  function toThread(a) {
    if (!a || typeof a !== 'object') return null;
    var target = a.target || a.selector || null;
    if (target && typeof target !== 'string') return null;   // object targets aren't ours

    if (a.comment && typeof a.comment === 'object' && a.comment.text) {
      return {
        id: a.id, page: a.page || a.pageId || S.page, target: target,
        author: a.comment.author || 'Anonymous', text: a.comment.text,
        createdAt: a.comment.createdAt || now(),
        status: a.comment.status || a.status || 'open',
        replies: Array.isArray(a.comment.replies) ? a.comment.replies : []
      };
    }
    if (a.text && !a.kind) {                                  // a raw thread
      return {
        id: a.id, page: a.page || S.page, target: target,
        author: a.author || 'Anonymous', text: a.text,
        createdAt: a.createdAt || now(), status: a.status || 'open',
        replies: Array.isArray(a.replies) ? a.replies : []
      };
    }
    if (a.kind === 'suggestion' && a.title) {                 // a legacy export
      var who = String(a.description || '').split(' · ')[0];
      return {
        id: a.id, page: a.page || a.pageId || S.page, target: target,
        author: who || 'Anonymous', text: a.title,
        createdAt: now(), status: a.status || 'open',
        replies: (Array.isArray(a.sub) ? a.sub : []).map(function (line) {
          var bits = String(line).split(': ');
          var name = bits.length > 1 ? bits.shift() : 'Anonymous';
          return { author: name, text: bits.join(': '), createdAt: now() };
        })
      };
    }
    return null;
  }

  /* Merge, never replace. Deduped by id against both the live comments and the
     committed baseline, so importing the same file twice is a no-op and the four
     authored items in it never turn into comments. */
  function importText(text) {
    var list = parseIn(text);
    if (!list) return { ok: false, added: 0, skipped: 0 };

    var seen = {};
    S.comments.forEach(function (c) { seen[c.id] = 1; });
    S.authored.forEach(function (a) { if (a && a.id) seen[a.id] = 1; });

    var added = 0, skipped = 0;
    list.forEach(function (a) {
      var t = toThread(a);
      if (!t) return;
      if (!t.id || seen[t.id]) { skipped++; return; }
      seen[t.id] = 1;
      S.comments.push(t);
      added++;
    });

    if (added) {
      S.seq = S.comments.length;
      save(); push(); renderPins(); paintBar();
    }
    return { ok: true, added: added, skipped: skipped };
  }

  /* A COMMITTED COMMENT IS STILL A COMMENT.
     ---------------------------------------------------------------------------
     Baseline entries in design-annotations.data.js used to be inert: they
     listed in the drawer and that was all — no pin on the element they were
     left on, and no way to reply, because pins and threads only ever came from
     the live list. So a comment that had been made permanent lost the two
     things that make it a comment. This pulls the ones that ARE comments (an
     exported `comment` payload, or `kind: 'suggestion'`) into the live list.

     MOVED, not copied: an adopted entry leaves S.authored, or Export would
     emit it twice, once from each list. Deduped by id, so the second load —
     where the same thread is in localStorage AND in the data file — keeps one.
     Baseline entries that are NOT comments (the design-review notes) have no
     text of this shape, stay in S.authored, and render as they always did. */
  function adoptAuthored() {
    var have = {};
    S.comments.forEach(function (c) { have[c.id] = 1; });
    var keep = [];
    S.authored.forEach(function (a) {
      var t = toThread(a);
      if (!t || !t.id) { keep.push(a); return; }
      /* WHO OWNS THE PIN. The store owns a thread's text, replies and status —
         people edit those. The DATA FILE owns where it is pinned: re-anchoring
         a committed comment is a source-code change, and without this the
         stored copy kept the old selector forever and the edit looked like it
         did nothing. Remembered here because the authored entry is about to be
         moved out of the list. */
      if (t.target) S.anchors[t.id] = t.target;
      /* A prototype has states, so half its comments are pinned to elements
         that are not rendered right now. The engine already knows how to fix
         that — an annotation may carry `reveal`, and goToAnnotation() runs it
         before highlighting — but a comment had no way to declare one, so
         "pin is on another screen" was a dead end. Now it can. */
      if (a.reveal) S.reveals[t.id] = a.reveal;
      if (!have[t.id]) { S.comments.push(t); have[t.id] = 1; }
      else { applyAnchor(byId(t.id)); }
    });
    S.authored = keep;
    S.seq = S.comments.length;
  }

  function applyAnchor(c) {
    if (!c) return;
    var a = S.anchors[c.id];
    if (a && c.target !== a) c.target = a;   // flush() will push the correction
  }

  /* Clicking a line in the drawer opens its thread, which is how you find the
     reply box — the drawer is where people read comments, so it has to be the
     way in. Bound on the panel rather than the item: the engine rebuilds those
     nodes whenever the list changes. Its own targetable behaviour (scroll to
     the element, halo it) still runs; this rides on top. */
  function bindDrawerClicks() {
    document.addEventListener('click', function (e) {
      var item = e.target.closest && e.target.closest('.da-item[data-anno]');
      if (!item) return;
      var id = item.getAttribute('data-anno');
      if (index(id) === -1) return;              // a design note, not a comment
      // Switch first if the comment lives in another direction, then let the
      // engine's own handler scroll, then open the thread on a settled layout.
      var switched = ensureVersion(byId(id));
      /* Always via goToAnnotation, not only after a version switch: it is what
         runs the annotation's `reveal`, which is how a comment on a screen you
         are not looking at brings that screen up. It also scrolls and haloes,
         which is harmless when the element is already there. */
      setTimeout(function () {
        if (global.DesignAnnotations && global.DesignAnnotations.goToAnnotation) {
          try { global.DesignAnnotations.goToAnnotation(id); } catch (e) {}
        }
        awaitTarget(id, function () { openThread(id); });
      }, switched ? 420 : 120);
    }, true);
  }

  function openImport() {
    closePop();
    if (S.io) { S.io.remove(); S.io = null; }

    var pop = el('div', 'dc-pop dc-io');
    var head = el('div', 'dc-pop-head');
    head.appendChild(icon('content_paste'));
    head.appendChild(document.createTextNode('Import comments'));
    var x = el('button', 'dc-x'); x.type = 'button';
    x.appendChild(icon('close'));
    x.addEventListener('click', closeImport);
    head.appendChild(x);
    pop.appendChild(head);

    var ta = el('textarea');
    ta.placeholder = 'Paste what your teammate sent — the whole ' +
      'design-annotations.data.js, or just the JSON from it.';
    pop.appendChild(ta);

    var hint = el('div', 'dc-hint',
      'Their comments merge into yours as live comments. Already-imported ones ' +
      'are skipped, so pasting the same thing twice is safe.');
    pop.appendChild(hint);

    var foot = el('div', 'dc-pop-foot');
    var msg = el('span', 'dc-io-msg');
    var cancel = el('button', 'dc-btn', 'Cancel');
    cancel.type = 'button';
    cancel.addEventListener('click', closeImport);
    var go = el('button', 'dc-btn dc-btn-primary', 'Import');
    go.type = 'button';
    go.addEventListener('click', function () {
      var r = importText(ta.value);
      if (!r.ok) {
        msg.className = 'dc-io-msg is-bad';
        msg.textContent = "Couldn't read that — paste the whole file.";
        return;
      }
      if (!r.added) {
        msg.className = 'dc-io-msg';
        msg.textContent = r.skipped ? 'Already imported — nothing new.' : 'No comments in that.';
        return;
      }
      msg.className = 'dc-io-msg';
      msg.textContent = 'Imported ' + r.added + (r.skipped ? ' · ' + r.skipped + ' already here' : '');
      setTimeout(closeImport, 1200);
    });
    foot.appendChild(msg);
    foot.appendChild(el('span', 'dc-spacer'));
    foot.appendChild(cancel);
    foot.appendChild(go);
    pop.appendChild(foot);

    document.body.appendChild(pop);
    S.io = pop;
    ta.focus();
  }
  function closeImport() {
    if (S.io) { S.io.remove(); S.io = null; }
  }

  /* ── the "only you can see this" notice ───────────────────────────────── */
  function noticeKey() { return TOLD + location.pathname; }
  function maybeNotice() {
    if (S.remote) return;          // in SHARED mode the premise is false
    var told = null;
    try { told = localStorage.getItem(noticeKey()); } catch (e) {}
    if (told) return;
    try { localStorage.setItem(noticeKey(), '1'); } catch (e) {}

    var n = el('div', 'dc-note');
    n.appendChild(icon('info'));
    var body = el('div');
    var b = el('b', null, 'Only you can see this.');
    body.appendChild(b);
    body.appendChild(document.createTextNode(
      ' Comments are saved in this browser — there is no server behind a ' +
      'prototype. Hit Export when you are done and send the text to whoever ' +
      'owns the prototype; they Import it.'));
    n.appendChild(body);
    var x = el('button'); x.type = 'button';
    x.appendChild(icon('close'));
    x.addEventListener('click', function () { n.remove(); });
    n.appendChild(x);
    document.body.appendChild(n);
    setTimeout(function () { if (n.parentNode) n.remove(); }, 12000);
  }

  function writeClipboard(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(function () { done(true); }, function () { fallback(text, done); });
    } else fallback(text, done);
  }

  /* Swap a button's label for a moment to confirm, then put it back. */
  function flashLabel(btn, word) {
    if (!btn || !btn.lastChild) return;
    var was = btn.lastChild.nodeValue;
    btn.lastChild.nodeValue = word;
    setTimeout(function () { btn.lastChild.nodeValue = was; }, 1600);
  }

  function copyOut() {
    var b = S.bar && S.bar.querySelector('.dc-export');
    writeClipboard(dataFile(), function (ok) { flashLabel(b, ok ? 'Copied' : 'Press ⌘C'); });
  }

  /* ── deep links ───────────────────────────────────────────────────────── */

  /* A link to a comment has to carry the VERSION as well as the id: a pin's
     element only exists inside its own `data-version` block, so a link that
     lands on the wrong direction lands on nothing. */
  function linkTo(id) {
    var v = (global.VersionSwitcher && global.VersionSwitcher._current &&
             global.VersionSwitcher._current.id) || null;
    var hash = v ? '#v=' + encodeURIComponent(v) : location.hash;
    return location.origin + location.pathname + '?comment=' + encodeURIComponent(id) + hash;
  }

  /* ?comment=<id> — open the drawer, scroll to the pin, open the thread.
     Runs once, and is retried after the shared store answers: in SHARED mode
     the threads arrive a moment after init, so the first attempt can be too
     early to find the id. */
  var linked = false;
  function deepLink() {
    if (linked) return;
    var m = /[?&]comment=([^&#]+)/.exec(location.search);
    if (!m) { linked = true; return; }
    var id = decodeURIComponent(m[1]);
    if (index(id) === -1) return;                    // not here (yet)
    linked = true;
    var c = byId(id);
    /* The URL carries #v=, and the switcher reads it at init — but a link
       pasted without one, or one whose stored version wins, would land on the
       wrong direction and find nothing. Belt and braces. */
    ensureVersion(c);
    if (global.DesignAnnotations && global.DesignAnnotations.open) {
      global.DesignAnnotations.open(c && c.page);
    }
    // After the drawer's own open animation, so the scroll and the popover
    // land on a settled layout.
    setTimeout(function () {
      if (global.DesignAnnotations && global.DesignAnnotations.goToAnnotation) {
        try { global.DesignAnnotations.goToAnnotation(id); } catch (e) {}
      }
      /* WAIT FOR THE STATE, DON'T GUESS AT IT. A reveal sets prototype state,
         and the framework then animates: on a cold load that transition is
         still in flight when a fixed timeout fires, so the pin was drawn
         against an element that had not been laid out yet and never appeared.
         Poll for the element instead — cheap, bounded, and correct whatever
         the prototype's own timings are. The thread opens either way; a
         comment whose screen never materialises still has to be readable. */
      awaitTarget(id, function () { openThread(id); });
    }, 260);
  }

  /* Clipboard access is blocked in some embedded preview panels, and a download
     is blocked in others — so the last resort is a selected textarea the user
     can copy by hand. Never leave them with nothing. */
  function fallback(text, done) {
    var ta = el('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:12px;bottom:70px;z-index:1180;width:420px;height:220px;';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    if (ok) { ta.remove(); done(true); return; }
    done(false);
    ta.addEventListener('blur', function () { ta.remove(); });
  }

  /* ── the bar ──────────────────────────────────────────────────────────── */
  function paintBar() {
    if (!S.bar) return;
    var open = S.comments.filter(function (c) { return c.status !== 'resolved'; }).length;
    var count = S.bar.querySelector('.dc-count');
    /* The counter is where the mode is stated, because "who can see this" is
       the one thing a reviewer needs to know before typing. */
    var where = S.remote
      ? (S.offline ? 'not synced — retrying' : 'shared with your team')
      : 'this browser only';
    count.textContent = S.comments.length
      ? open + ' open · ' + S.comments.length + ' total · ' + where
      : (S.remote ? 'No comments yet · ' + where : 'No comments yet');
    count.title = S.remote
      ? 'Comments are saved on the share host, so everyone who can open this ' +
        'prototype sees them' +
        (S.you && S.you.email ? '. Signed in as ' + S.you.email : '') +
        (S.offline ? '. The last write did not reach the server — it retries on the next change.' : '')
      : 'Comments live in this browser. Export sends them on; Import brings ' +
        "someone else's in.";
    var addBtn = S.bar.querySelector('.dc-add');
    addBtn.classList.toggle('dc-on', S.placing);
    addBtn.lastChild.nodeValue = S.placing ? 'Click an element…' : 'Add comment';
  }

  function buildBar() {
    var bar = el('div');
    bar.id = 'dc-bar';

    var add = el('button', 'dc-primary dc-add');
    add.type = 'button';
    add.appendChild(icon('add_comment'));
    add.appendChild(document.createTextNode('Add comment'));
    add.addEventListener('click', function (e) { e.stopPropagation(); startPlacing(); });
    bar.appendChild(add);

    bar.appendChild(el('span', 'dc-count'));
    bar.appendChild(el('span', 'dc-sep'));

    var exp = el('button', 'dc-export');
    exp.type = 'button';
    exp.title = 'Copy these comments as design-annotations.data.js — commit it and ' +
      'they become part of the prototype for everyone.';
    exp.appendChild(icon('content_copy'));
    exp.appendChild(document.createTextNode('Export'));
    exp.addEventListener('click', function (e) { e.stopPropagation(); copyOut(); });
    bar.appendChild(exp);

    var imp = el('button', 'dc-import');
    imp.type = 'button';
    imp.title = "Paste comments a teammate exported — they merge into yours.";
    imp.appendChild(icon('content_paste'));
    imp.appendChild(document.createTextNode('Import'));
    imp.addEventListener('click', function (e) { e.stopPropagation(); openImport(); });
    bar.appendChild(imp);

    document.body.appendChild(bar);
    S.bar = bar;
    paintBar();
  }

  /* ── on/off, driven by the drawer's own state ─────────────────────────── */
  function sync() {
    var on = openComments();
    if (on === S.on) return;
    S.on = on;
    if (S.bar) S.bar.style.display = on ? 'flex' : 'none';
    if (!on) { stopPlacing(); closePop(); closeImport(); stopPoll(); }
    else startPoll();
    renderPins();
    paintBar();
  }

  var API = {
    /**
     * @param {object}  cfg
     * @param {Array}  [cfg.authored]  Baseline annotations from the data file. Kept
     *                                 separate from live comments so Export can emit
     *                                 both and neither overwrites the other.
     * @param {Array}  [cfg.pages]     Passed through to the annotations engine.
     * @param {string} [cfg.page]      Page id for new comments. Defaults to the id
     *                                 the annotations engine resolved.
     */
    init: function (cfg) {
      S.cfg = cfg = cfg || {};
      S.authored = (cfg.authored || []).slice();
      S.comments = load();
      S.seq = S.comments.length;
      S.page = cfg.page ||
        (global.DesignAnnotations && global.DesignAnnotations.getState &&
          global.DesignAnnotations.getState().currentPageId) ||
        ((cfg.pages && cfg.pages[0] && cfg.pages[0].id) || 'index');

      adoptAuthored();

      if (!document.getElementById('dc-style')) {
        var st = el('style'); st.id = 'dc-style'; st.textContent = CSS;
        document.head.appendChild(st);
      }

      S.layer = el('div'); S.layer.id = 'dc-layer';
      S.halo = el('div', 'dc-halo'); S.halo.style.display = 'none';
      S.layer.appendChild(S.halo);
      document.body.appendChild(S.layer);

      buildBar();
      bindDrawerClicks();
      S.bar.style.display = 'none';
      S.vseen = currentVersionId();
      if (S.comments.length) push();

      /* Probe for the shared store. Deliberately not awaited: the prototype and
         its cached comments must render at once, and the probe only ever adds
         to what is on screen. If it lands in SHARED mode the bar relabels and
         the server's comments arrive a moment later. */
      probe().then(function (shared) {
        if (shared) {
          paintBar();
          if (openComments()) startPoll();
        }
        deepLink();
      });

      // Also without waiting for the probe: a committed comment is already
      // adopted by now, so a link to one opens immediately.
      deepLink();

      // Pins are anchored to live rects, so anything that moves the page moves
      // them. #rt-page scrolls itself, and scroll doesn't bubble — capture does.
      window.addEventListener('scroll', schedule, true);
      window.addEventListener('resize', schedule);
      document.addEventListener('click', function (e) {
        if (S.pop && !isOurs(e.target)) closePop();
      });

      // The seam: watch the state the annotations engine already publishes,
      // rather than wrapping its button.
      /* Two jobs on one observer. `sync` reads the drawer's open/closed state,
         as before. `schedule` re-places the pins — a prototype changes state
         without scrolling (Alpine swaps the welcome card for the checklist, the
         checklist for the dashboard), and pins were only re-rendered on scroll
         and resize, so a comment's bubble did not appear until you happened to
         scroll. rAF-throttled, and a no-op while the drawer is closed. */
      S.obs = new MutationObserver(function () {
        sync();
        if (S.on) schedule();
        /* Switching direction changes every byline — "Version A" becomes
           "Version A — click to switch" the moment A stops being what you are
           looking at. The switcher toggles `hidden` on the version blocks, so
           this observer already sees it; re-feed the annotations only when the
           version actually changed, since push() rebuilds the index. */
        var v = currentVersionId();
        if (v !== S.vseen) {
          S.vseen = v;
          if (S.comments.length) push();
        }
      });
      S.obs.observe(document.body, {
        subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden']
      });
      sync();
      return API;
    },

    add: function (node, text) {
      S.comments.push({
        id: 'dc-' + (++S.seq) + '-' + Date.now().toString(36),
        page: S.page, target: selectorFor(node), author: author(false),
        text: text, createdAt: now(), status: 'open', replies: []
      });
      save(); push(); renderPins(); paintBar();
      maybeNotice();
      return API;
    },
    all: function () { return S.comments.slice(); },
    /* Which store is behind this session: 'shared' (the host's API) or 'local'
       (this browser). Exposed for tests and for anything that wants to say so
       in its own UI. */
    mode: function () { return S.remote ? 'shared' : 'local'; },
    who: function () { return S.you; },
    refresh: pull,
    exportData: dataFile,
    /* Merge someone else's exported comments in. Returns
       { ok, added, skipped } — see importText. */
    importData: importText,
    clear: function () { S.comments = []; save(); push(); renderPins(); paintBar(); return API; }
  };

  global.DesignComments = API;
})(window);
