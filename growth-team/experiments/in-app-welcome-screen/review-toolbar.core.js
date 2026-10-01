/* =============================================================================
   Review Toolbar (core) — the review BAND, and the page frame it sits above
   -----------------------------------------------------------------------------
   Plain IIFE, NO imports — so it works both ways:

     • Kit prototypes (Vite)     import '@kit/chrome/review-toolbar.js'
                                 (the ESM entry, which pulls the engines + CSS
                                 and then this file)
     • Standalone prototypes     <script src="review-toolbar.core.js"></script>
       (no build step)           after the engine <script> tags

   Keep it dependency-free. If you need an import, put it in review-toolbar.js —
   adding one here breaks every standalone prototype silently.

   ---------------------------------------------------------------------------
   WHY A BAND, AND NOT A FLOATING PILL

   The toolbar used to be `position: fixed` over the top-right of the page. That
   put review chrome on top of real product UI — on the demo it landed squarely
   over the page's own "Export / Add member" buttons, which is both ugly and a
   fidelity lie: you cannot judge a layout that something is covering.

   So the review chrome now OWNS a band across the top of the window, and the
   prototype gets everything below it. Nothing overlaps, because the two never
   share space.

   The mechanism is `#rt-page`, one wrapper around the whole prototype:

       <body>
         <div id="review-toolbar">   ← the band. Review chrome only.
         <div id="rt-page">          ← the prototype. Everything else.
             #hs-topbar, #hs-sidebar, #shell-content, …
         </div>
         …engine panels, mounted later, land here (outside the page) …
       </body>

   `#rt-page` is `position: fixed` below the band, `overflow: hidden`, plus a
   `transform`; `#shell-content` inside it is the scroller. Both parts matter:

     • the transform makes `#rt-page` the containing block for every
       `position: fixed` descendant — so the shell's topbar and sidebar pin to
       the FRAME instead of the window, and shift down with it for free. No
       per-element overrides against hubstaff-shell.js, which we don't edit.
     • the frame itself must NOT scroll: a fixed descendant of a transformed
       scroller scrolls away with its content. So the frame stays still and
       #shell-content scrolls (review-toolbar.css), and the topbar stays put.

   That one wrapper also gives the Conditions engine its screen axis for free —
   clamping `#rt-page` to 375px clamps the shell chrome with it. `prototype-
   conditions.js` sets the width; the frame itself belongs to this file.
   ============================================================================= */

(function (global) {
  'use strict';

  var BAR_ID = 'review-toolbar';
  var PAGE_ID = 'rt-page';
  var BAND_H = 44;           // px. Mirrored by --rt-band for the CSS.

  /* Left-to-right order of the tools group, and how they cluster. The sweep
     below places whichever of these exist, in this order, regardless of where
     their engine originally put them or which engines are enabled.

     Three clusters, separated by a rule, because four peer buttons gave no clue
     how they relate:

       view     Conditions      — changes WHAT you are looking at
       review   Comments · Design annotations — what people said, and what the
                                 build needs decided
       inspect  Dev Mode        — reads specs off the rendered result

     RELABELLING, TWICE. These shipped as "Annotations" and "Design tasks", which
     read as two unrelated features, so they became "Comments" and "All
     comments" — and that went too far the other way. "All comments" implied a
     superset of "Comments" when the two hold different KINDS of thing: a
     comment is what a reviewer said, and it gets replies; a design annotation
     is a decision or a note the build needs answered. Same reason the drawer's
     own two sections are now "Comments" and "Decisions needed". So the
     cross-page index is "Design annotations", and "Comments" keeps its name.

     The residue, stated because it is not fixed here: the index still lists
     BOTH kinds, since design-annotations.js builds it from one flat list and
     filtering it means editing that dependency. The name is now the honest one
     for what it mostly is; a hard split is a separate change.

     Renaming from here, not in the engines: `design-annotations.js` is a vendored
     dependency we don't edit, and it builds each label exactly once at init and
     never rewrites it — so a one-time DOM edit after init is stable, and there is
     no repaint to fight. The badge is a separate node and is left alone. */
  var SEGMENTS = [
    { id: 'pc-toggle',  group: 'view' },
    { id: 'da-fab',     group: 'review', label: 'Comments',
      title: 'Comments on this page — open to see pins and add new ones' },
    { id: 'da-tc-btn',  group: 'review', label: 'Design annotations',
      title: 'Design notes and decisions across every page, searchable' },
    { id: 'dm-toggle',  group: 'inspect' }
  ];

  /* Replace a button's label without touching its icon or badge — both are
     element children, and the label is the lone text node between them. */
  function relabel(node, text) {
    for (var i = 0; i < node.childNodes.length; i++) {
      var n = node.childNodes[i];
      if (n.nodeType === 3 && n.nodeValue.trim()) { n.nodeValue = text; return; }
    }
  }

  /* --------------------------------------------------------------------------
     THE PANELS THE BAND OPENS, RELABELLED TO MATCH IT

     Renaming the two band buttons left the panels
     behind: the drawer's header still read "Design Annotations" and the
     cross-page index "Design Tasks", so every click contradicted the button that
     caused it. These are the same edits as SEGMENTS above, one layer deeper.

     WHY AN OBSERVER AND NOT A ONE-TIME EDIT. The band buttons exist at init and
     are written once, so groupSegments() can just edit them. The panels can't be
     treated that way:

       • the drawer is built LAZILY, on first open — at init there is no
         `.da-panel` to edit at all.
       • the cross-page index is DESTROYED AND REBUILT by `applyData()` on every
         `setAnnotations()` call — which design-comments.js makes on every comment,
         reply, resolve and delete. A one-time edit would survive about one click.

     So watch for them being appended instead. `childList` on <body> and nothing
     else: both panels are direct children of <body>, and a subtree observer here
     would fire on every DOM change the prototype makes. Same seam design-
     comments.js uses for the drawer's open state — read what the engine already
     publishes, never wrap its internals. */
  var PANEL_TEXT = [
    { sel: '.da-panel',                 aria: 'Comments' },
    { sel: '.da-panel .da-hd-title',    text: 'Comments' },
    { sel: '.da-panel .da-close',       aria: 'Close comments' },
    { sel: '.da-tc-modal',              aria: 'Design annotations' },
    { sel: '.da-tc-modal .da-tc-title', text: 'Design annotations' },
    { sel: '.da-tc-search-input',       placeholder: 'Search annotations\u2026' }
  ];

  /* The index's no-results line is re-rendered on every search keystroke, inside
     the modal — the body observer never sees it. One narrow observer on the
     content node covers it; re-pointed whenever the modal is rebuilt. */
  var tcObs = null, tcNode = null;

  function fixEmpty(root) {
    var e = root.querySelector('.da-tc-empty');
    if (!e) return;
    for (var i = 0; i < e.childNodes.length; i++) {
      var n = e.childNodes[i];
      if (n.nodeType === 3 && n.nodeValue.indexOf('task') !== -1) {
        n.nodeValue = n.nodeValue.replace(/tasks/g, 'comments');
      }
    }
  }

  function watchTcContent() {
    var node = document.querySelector('.da-tc-modal .da-tc-content');
    if (!node) return;
    if (node !== tcNode) {
      if (tcObs) tcObs.disconnect();
      tcNode = node;
      tcObs = new MutationObserver(function () { fixEmpty(node); });
      tcObs.observe(node, { childList: true });
    }
    fixEmpty(node);
  }

  function relabelPanels() {
    PANEL_TEXT.forEach(function (r) {
      var n = document.querySelector(r.sel);
      if (!n) return;
      if (r.text && n.textContent !== r.text) n.textContent = r.text;
      if (r.aria) n.setAttribute('aria-label', r.aria);
      if (r.placeholder) n.placeholder = r.placeholder;
    });
    // "N pending" counts annotations, not open ones — with comments in the set
    // it is simply wrong. "N total" is what the comments bar already says.
    var count = document.querySelector('.da-tc-modal .da-tc-count');
    if (count) count.textContent = count.textContent.replace(/\bpending\b/, 'total');
    watchTcContent();
  }

  function watchPanels() {
    relabelPanels();
    new MutationObserver(relabelPanels).observe(document.body, { childList: true });
  }

  /* Everything the review chrome owns — never moved into the page frame. Engine
     panels are created after ensurePage() runs, so they land outside anyway;
     this list is what protects the nodes that already exist at init time. */
  var CHROME_SEL = '#' + BAR_ID + ',#' + PAGE_ID + ',#pc-panel,#pc-stage,' +
    '.vs-float,.vs-panel,.da-panel,.da-tc-modal,.da-tc-backdrop,#da-fab,' +
    '#da-tc-btn,.dm-panel,#dm-toggle,.dm-ov,.dm-pop,.dm-tip,.dm-dlg,' +
    '.dm-dlg-backdrop,script,style,link,template';

  function el(tag, cls, id) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (id) n.id = id;
    return n;
  }

  /* The band: a version-switcher slot on the left, the tools group on the right. */
  function ensureBar(drawerWidth) {
    var bar = document.getElementById(BAR_ID);
    if (!bar) {
      bar = el('div', 'review-toolbar', BAR_ID);
      bar.appendChild(el('div', 'rt-left'));
      bar.appendChild(el('div', 'rt-tools'));
      document.body.insertBefore(bar, document.body.firstChild);
    }
    // How far the tools group slides left when the annotations drawer opens, so
    // it clears the drawer instead of sitting behind its header (+12px gutter).
    bar.style.setProperty('--rt-shift', ((drawerWidth || 320) + 12) + 'px');
    return bar;
  }

  /* The page frame. Moves the prototype — and only the prototype — inside. */
  function ensurePage() {
    var page = document.getElementById(PAGE_ID);
    if (page) return page;
    page = el('div', null, PAGE_ID);
    document.body.appendChild(page);
    Array.prototype.slice.call(document.body.children).forEach(function (n) {
      if (n === page || n.matches(CHROME_SEL)) return;
      page.appendChild(n);
    });
    document.documentElement.style.setProperty('--rt-band', BAND_H + 'px');
    document.body.classList.add('rt-banded');
    return page;
  }

  /* Collect the engines' buttons into the tools group in SEGMENTS order.
     Runs after every engine has initialised — that's the whole point; doing it
     per-engine races the ones that haven't mounted yet. */
  function groupSegments(bar) {
    var tools = bar.querySelector('.rt-tools') || bar;
    var lastGroup = null;
    SEGMENTS.forEach(function (seg) {
      var node = document.getElementById(seg.id);
      if (!node) return;
      // DevMode adds this when it can't find an anchor and falls back to
      // floating on <body>. Inside the band it must not float.
      node.classList.remove('dm-tc-btn--float');
      if (seg.label) relabel(node, seg.label);
      if (seg.title) node.title = seg.title;
      // Only the FIRST segment of each cluster gets the divider, so the rule
      // falls between groups and never inside one.
      node.classList.toggle('rt-seg-start', seg.group !== lastGroup);
      lastGroup = seg.group;
      tools.appendChild(node);
    });
  }

  var ReviewToolbar = {
    /**
     * @param {object}  cfg
     * @param {number} [cfg.topOffset=52]   Height of the PROTOTYPE's own topbar, in
     *                                      px (the Hubstaff shell's is 48). Use 0 for
     *                                      a shell-less prototype. The review band is
     *                                      added on top of it automatically — callers
     *                                      describe their page, not the chrome.
     * @param {object} [cfg.annotations]    Passed to DesignAnnotations.init. `false` disables.
     * @param {object} [cfg.devMode]        Passed to DevMode.init. `false` disables.
     * @param {object} [cfg.comments]       Passed to DesignComments.init. `false` disables
     *                                      click-to-place commenting (the drawer stays read-only).
     * @param {object} [cfg.conditions]     Passed to PrototypeConditions.init. `false` disables.
     * @param {object} [cfg.versions]       Passed to VersionSwitcher.init. Ships on every
     *                                      prototype — it carries the "not a live product"
     *                                      notice. Omit only for a deliberate exception.
     */
    init: function (cfg) {
      cfg = cfg || {};

      // Inside the Conditions "reload at this size" iframe there is no review
      // chrome at all — the outer window owns it. Apply the conditions the outer
      // page asked for and stop, or we'd mount a second band in there.
      if (global.PrototypeConditions && global.PrototypeConditions.isEmbed()) {
        global.PrototypeConditions.init(cfg.conditions || {});
        return null;
      }

      var topOffset = cfg.topOffset == null ? 52 : cfg.topOffset;
      // Engine panels are siblings of #rt-page, so they measure from the WINDOW.
      // They must clear the band as well as the prototype's own topbar.
      var panelTop = BAND_H + topOffset;

      var bar = ensureBar((cfg.annotations || {}).drawerWidth);
      ensurePage();

      // 1. Version switcher — mounted INTO the band's left slot, so it stops
      //    being a floating pill over the page. (`mount` is a documented option
      //    of the engine; no edit needed.)
      if (cfg.versions && global.VersionSwitcher) {
        var v = Object.assign({}, cfg.versions);
        if (v.mount === undefined) v.mount = '#' + BAR_ID + ' .rt-left';
        global.VersionSwitcher.init(v);
        // The pill's visible label is prefixed with "Version " by CSS (see
        // review-toolbar.css) because the engine rewrites its textContent on
        // every switch. Generated content is not a dependable accessible name,
        // so state it here too.
        var pill = bar.querySelector('.rt-left .vs-pill');
        if (pill && !pill.getAttribute('aria-label')) {
          pill.setAttribute('aria-label', 'Version switcher');
        }
      }

      // 2. Annotations — MUST come before Dev Mode. DevMode anchors its toggle to
      //    `#da-tc-btn`; if that doesn't exist yet it floats on <body> instead.
      //    (The sweep in step 5 recovers from that, but ordering avoids the
      //    flash of a mis-placed button.)
      if (cfg.annotations !== false && global.DesignAnnotations) {
        var a = Object.assign({
          topOffset: panelTop,
          /* Button + hotkey, NOT right-click. The engine offers 'contextmenu'
             and advertises it in the drawer footer, but it is a bad default
             here: it is swallowed inside an embedded preview panel, it takes
             away the browser's own context menu on a prototype people are
             inspecting, and the band already has a visible button. Dropping it
             also drops the "Right-click to toggle" line, which was advice for
             something that mostly did not work. */
          trigger: ['button'],
        }, cfg.annotations || {});
        /* THE TWO REVIEW CONTROLS HOLD DIFFERENT KINDS, NOT DIFFERENT SCOPES.
           They used to be two views of one array — this page vs every page —
           so they showed the same things, and on a single-page prototype they
           were literally identical. That is not a naming problem: a COMMENT is
           what a reviewer said and it gets replies; a DESIGN NOTE is a decision
           the build needs answered. They belong in different places.

           So: `Comments` is comments, `Design annotations` is notes. The kind
           filtering is a documented deviation inside design-annotations.js
           (see its header) — the only edit the kit makes to that file, because
           the index's rows carry no kind marker and CSS could only have hidden
           rows while leaving every count wrong.

           Override either per prototype if one really wants both in one place. */
        if (a.drawerKinds === undefined) a.drawerKinds = ['suggestion'];
        if (a.indexKinds === undefined) a.indexKinds = ['required'];
        if (a.taskCenter === undefined) a.taskCenter = { mount: '#' + BAR_ID + ' .rt-tools' };
        global.DesignAnnotations.init(a);
      }

      // 3. Comments — the authoring layer over Annotations, so it must come
      //    after it: it reads the resolved page id and pushes back through
      //    `setAnnotations`. Its pins stay hidden until the drawer is open.
      if (cfg.comments !== false && global.DesignComments) {
        var ann = cfg.annotations || {};
        global.DesignComments.init(Object.assign({
          authored: ann.annotations || [],
          pages: ann.pages || null,
        }, cfg.comments || {}));
      }

      // 4. Dev Mode — after Annotations, per the note above.
      if (cfg.devMode !== false && global.DevMode) {
        global.DevMode.init(Object.assign({ topOffset: panelTop }, cfg.devMode || {}));
      }

      // 5. Conditions — screen / role / page state. Last, so its segment sweeps
      //    to the front of a tools group that is already fully populated.
      if (cfg.conditions !== false && global.PrototypeConditions) {
        global.PrototypeConditions.init(Object.assign(
          { mount: '#' + BAR_ID + ' .rt-tools' }, cfg.conditions || {}));
      }

      // 6. Sweep every mounted button into the tools group, in a stable order.
      groupSegments(bar);

      // 7. Keep the panels those buttons open named the same as the buttons.
      //    Both are built after this point, so this arms a watcher, not an edit.
      watchPanels();

      return bar;
    },

    /** The page frame, for engines that need to size or measure it. */
    page: function () { return document.getElementById(PAGE_ID); },
    bandHeight: function () { return BAND_H; },
  };

  global.ReviewToolbar = ReviewToolbar;
})(window);
