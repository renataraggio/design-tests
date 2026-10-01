/* =============================================================================
   Version Switcher — standalone, drop-in version/variant picker
   -----------------------------------------------------------------------------
   The pill-and-dropdown pattern used on prototype.designops.hbstf.co, but able
   to switch versions INSIDE a single HTML file as well as link out to sibling
   prototypes.

     1. A PILL sits in the top bar showing the current version.
     2. Clicking it opens a PANEL of versions, grouped, with a status dot each.
     3. An item with `el` swaps the visible version IN PAGE — no navigation,
        no reload, no second file.
     4. An item with `href` navigates instead, exactly like the hosted shell.
     5. The choice is written to the URL hash (#v=b) so a shared link opens on
        that version, and remembered in localStorage for the next visit.

   Zero-dependency vanilla JS. No build step. Works from file:// as well as
   from a server. Uses its own `vs-` prefix so it can sit alongside the shell's
   own `sh-` switcher without colliding.

   ---------------------------------------------------------------------------
   USAGE

     <div id="v-a" data-version>…direction A markup…</div>
     <div id="v-b" data-version hidden>…direction B markup…</div>

     <script src="version-switcher.js"></script>
     <script>
       VersionSwitcher.init({
         project: 'Getting started redesign',
         note: 'Concept prototypes · nothing here is real',
         groups: [
           { label: 'Directions', versions: [
             { id:'a', code:'A', name:'Focus panel',  el:'#v-a' },
             { id:'b', code:'B', name:'Vivid cards',  el:'#v-b' },
             { id:'c', code:'C', name:'Slide-over',   el:'#v-c', status:'soon' }
           ]},
           { label: 'Related', versions: [
             { code:'AR0229', name:'Smart notifications', href:'../AR0229/' }
           ]}
         ]
       });
     </script>

   OPTIONS
     project   string  – panel heading. Required.
     note      string  – small footer line in the panel. Optional.
     notice    string  – grey pill shown before the switcher, e.g. 'Prototype — not a live product'.
     mount     string|Element – where the pill goes. Default: fixed, top centre.
     remember  boolean – persist the last choice. Default true.
     onChange  fn(version) – called after every switch.

   VERSION FIELDS
     id      string  – hash value + storage key. Required for in-page versions.
     code    string  – short label shown before the name ("A.1.1", "B").
     name    string  – human name. Required.
     el      string|Element – the container to show. Makes it an in-page version.
     href    string  – navigate instead of switching in page.
     status  'ready' | 'soon' | 'wip'  – dot colour. Default 'ready'.
     tag     string  – small badge text on the right.
   ============================================================================= */
(function (global) {
  'use strict';

  var CSS = [
    '.vs-pill{display:inline-flex;align-items:center;gap:4px;cursor:pointer;background:transparent;',
    'border:none;border-radius:999px;padding:5px 10px;',
    'font:500 12px/1 Roboto,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
    'color:#374151;white-space:nowrap;}',
    '.vs-pill:hover{background:rgba(17,24,39,.06);}',
    '.vs-pill:focus-visible{outline:2px solid #0168dd;outline-offset:2px;}',
    '.vs-pill .vs-caret{font-size:10px;line-height:1;transition:transform .15s;}',
    '.vs-pill[aria-expanded="true"] .vs-caret{transform:rotate(180deg);}',
    '.vs-float{position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:2099;',
    'display:inline-flex;align-items:center;gap:2px;height:34px;',
    'background:#f3f4f6;border-radius:999px;padding:0 2px;}',
    // Below ~940px the centred group would collide with the review toolbar
    // pinned top-right, so move it to the left instead of overlapping.
    '@media (max-width:940px){.vs-float{left:20px;transform:none;}',
    '.vs-panel{left:20px;transform:translate(0,-6px);}',
    '.vs-panel.vs-open{transform:translate(0,0);}}',
    '.vs-notice{display:inline-flex;align-items:center;border-radius:999px;padding:5px 10px;',
    'font:500 12px/1 Roboto,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
    'color:#6b7280;white-space:nowrap;}',
    '.vs-notice + .vs-pill{box-shadow:inset 1px 0 0 #e5e7eb;}',
    '.vs-panel{position:fixed;top:60px;left:50%;z-index:2100;width:330px;max-height:70vh;overflow-y:auto;',
    'background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 8px 20px rgba(16,40,80,.12);',
    'font-family:Roboto,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;opacity:0;transform:translate(-50%,-6px);pointer-events:none;',
    'transition:opacity .15s,transform .15s;}',
    '.vs-panel.vs-open{opacity:1;transform:translate(-50%,0);pointer-events:auto;}',
    '.vs-head{display:flex;align-items:center;gap:8px;padding:12px 16px 8px;font-size:13px;font-weight:600;color:#111827;}',
    '.vs-head .vs-hdot{width:8px;height:8px;border-radius:999px;background:#0168dd;flex:0 0 auto;}',
    '.vs-group{padding:10px 16px 2px;font-size:11px;font-weight:600;letter-spacing:.05em;',
    'text-transform:uppercase;color:#9ca3af;}',
    '.vs-item{display:flex;align-items:flex-start;gap:8px;padding:8px 16px;font-size:13px;line-height:1.4;',
    'color:#374151;text-decoration:none;border:none;background:none;width:100%;text-align:left;',
    'font-family:inherit;cursor:pointer;}',
    '.vs-item:hover:not(.vs-current):not(.vs-soon){background:#f9fafb;color:#111827;}',
    '.vs-item:focus-visible{outline:2px solid #0168dd;outline-offset:-2px;}',
    '.vs-item .vs-name{flex:1 1 auto;min-width:0;}',
    '.vs-item .vs-dot{width:6px;height:6px;border-radius:999px;background:#d1d5db;flex:0 0 auto;margin-top:6px;}',
    '.vs-item.vs-ready .vs-dot{background:#0e9f6e;}',
    '.vs-item.vs-wip .vs-dot{background:#c27803;}',
    '.vs-item.vs-current{font-weight:600;color:#111827;background:#f0f7ff;cursor:default;}',
    '.vs-item.vs-current .vs-dot{background:#2f80ed;}',
    '.vs-item.vs-soon{color:#9ca3af;cursor:default;}',
    '.vs-tag{flex:0 0 auto;white-space:nowrap;font-size:10px;font-weight:600;letter-spacing:.04em;',
    'line-height:1.6;text-transform:uppercase;color:#9ca3af;background:#f3f4f6;border-radius:999px;padding:1px 8px;}',
    '.vs-item.vs-current .vs-tag{background:#dbeafe;color:#1a56db;}',
    '.vs-note{padding:8px 16px 12px;border-top:1px solid #f3f4f6;margin-top:4px;',
    'font-size:11px;color:#9ca3af;}',
    '@media (prefers-reduced-motion:reduce){.vs-panel,.vs-caret{transition:none;}}'
  ].join('');

  var STORE = 'vs:version:';

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function resolve(v) {
    if (!v) return null;
    return typeof v === 'string' ? document.querySelector(v) : v;
  }
  function hashVersion() {
    var m = /[#&]v=([^&]+)/.exec(location.hash);
    return m ? decodeURIComponent(m[1]) : null;
  }

  var VersionSwitcher = {
    _cfg: null, _flat: [], _current: null, _panel: null, _pill: null,

    init: function (cfg) {
      if (!cfg || !cfg.groups) throw new Error('VersionSwitcher.init: `groups` is required');
      this._cfg = cfg;
      this._flat = cfg.groups.reduce(function (a, g) { return a.concat(g.versions || []); }, []);

      if (!document.getElementById('vs-style')) {
        var s = el('style'); s.id = 'vs-style'; s.textContent = CSS;
        document.head.appendChild(s);
      }

      this._render();

      var inPage = this._flat.filter(function (v) { return v.el; });
      if (inPage.length) {
        var key = STORE + (cfg.project || location.pathname);
        var wanted = hashVersion() ||
          (cfg.remember !== false ? this._read(key) : null);
        var start = this._flat.filter(function (v) { return v.id === wanted && v.el; })[0] || inPage[0];
        this.show(start.id, { silent: true });
      } else {
        this._current = this._flat.filter(function (v) { return v.current; })[0] || this._flat[0];
        this._paint();
      }

      var self = this;
      window.addEventListener('hashchange', function () {
        var h = hashVersion();
        if (h && h !== (self._current && self._current.id)) self.show(h);
      });
      return this;
    },

    _read: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    _write: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },

    _render: function () {
      var self = this, cfg = this._cfg;

      var pill = el('button', 'vs-pill');
      pill.type = 'button';
      pill.setAttribute('aria-haspopup', 'true');
      pill.setAttribute('aria-expanded', 'false');
      pill.appendChild(el('span', 'vs-pill-label', '—'));
      pill.appendChild(el('span', 'vs-caret', '▾'));
      this._pill = pill;

      var mount = resolve(cfg.mount);
      var host = mount;
      if (!host) { host = el('div', 'vs-float'); document.body.appendChild(host); }
      if (cfg.notice) host.appendChild(el('span', 'vs-notice', cfg.notice));
      host.appendChild(pill);

      var panel = el('div', 'vs-panel');
      panel.setAttribute('role', 'menu');
      var head = el('div', 'vs-head');
      head.appendChild(el('span', 'vs-hdot'));
      head.appendChild(el('span', null, cfg.project || 'Versions'));
      panel.appendChild(head);

      cfg.groups.forEach(function (g) {
        if (g.label) panel.appendChild(el('div', 'vs-group', g.label));
        (g.versions || []).forEach(function (v) {
          var isLink = !!v.href && !v.el;
          var node = el(isLink ? 'a' : 'button', 'vs-item');
          if (isLink) { node.href = v.href; }
          else { node.type = 'button'; }
          node.setAttribute('role', 'menuitem');
          node.dataset.vsId = v.id || v.name;
          node.appendChild(el('span', 'vs-dot'));
          // A version with no `name` shows its bare `code` (or `name` alone
          // if there's no code either) — no dangling " · " separator with
          // nothing after it.
          node.appendChild(el('span', 'vs-name',
            v.name ? (v.code ? v.code + ' · ' : '') + v.name : (v.code || v.name)));
          if (v.tag) node.appendChild(el('span', 'vs-tag', v.tag));
          if (!isLink) {
            node.addEventListener('click', function () {
              if (v.status === 'soon') return;
              self.show(v.id); self.close(); self._pill.focus();
            });
          }
          v._node = node;
          panel.appendChild(node);
        });
      });

      if (cfg.note) panel.appendChild(el('div', 'vs-note', cfg.note));
      document.body.appendChild(panel);
      this._panel = panel;

      pill.addEventListener('click', function (e) {
        e.stopPropagation();
        panel.classList.contains('vs-open') ? self.close() : self.open();
      });
      document.addEventListener('click', function (e) {
        if (!panel.contains(e.target) && e.target !== pill) self.close();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && panel.classList.contains('vs-open')) {
          self.close(); self._pill.focus();
        }
      });
    },

    open: function () {
      this._panel.classList.add('vs-open');
      this._pill.setAttribute('aria-expanded', 'true');
      var first = this._panel.querySelector('.vs-item:not(.vs-soon):not(.vs-current)');
      if (first) first.focus();
    },
    close: function () {
      this._panel.classList.remove('vs-open');
      this._pill.setAttribute('aria-expanded', 'false');
    },

    show: function (id, opts) {
      opts = opts || {};
      var target = this._flat.filter(function (v) { return v.id === id; })[0];
      if (!target) return this;

      this._flat.forEach(function (v) {
        var node = resolve(v.el);
        if (node) node.hidden = (v !== target);
      });
      this._current = target;
      this._paint();

      if (this._cfg.remember !== false && target.id) {
        this._write(STORE + (this._cfg.project || location.pathname), target.id);
      }
      if (!opts.silent && target.id) {
        try {
          history.replaceState(null, '', '#v=' + encodeURIComponent(target.id));
        } catch (e) {}
      }
      if (typeof this._cfg.onChange === 'function') this._cfg.onChange(target);
      return this;
    },

    _paint: function () {
      var cur = this._current;
      this._flat.forEach(function (v) {
        if (!v._node) return;
        v._node.className = 'vs-item ' +
          (v === cur ? 'vs-current' : 'vs-' + (v.status || 'ready'));
        var tag = v._node.querySelector('.vs-tag');
        if (v === cur) {
          if (!tag) { tag = el('span', 'vs-tag'); v._node.appendChild(tag); }
          tag.textContent = 'You’re here';
        } else if (tag && !v.tag) {
          tag.remove();
        } else if (tag && v.tag) {
          tag.textContent = v.tag;
        }
      });
      if (cur) {
        this._pill.querySelector('.vs-pill-label').textContent = cur.name
          ? (cur.code ? cur.code + ' · ' : '') + cur.name
          : (cur.code || cur.name);
      }
    }
  };

  global.VersionSwitcher = VersionSwitcher;
})(window);
