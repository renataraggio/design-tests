/* =============================================================================
   Dev Mode — standalone, drop-in element inspector
   -----------------------------------------------------------------------------
   A lightweight Figma-Dev-Mode / browser-DevTools-style inspector for prototypes.
   Sits alongside Design Annotations. When enabled:

     1. A TOGGLE lives in the top bar next to the "Design tasks" control.
     2. HOVER any element → a box-model overlay (margin / border / padding /
        gap / content bands) plus a size label, like DevTools' highlighter.
     3. CLICK any element → a right-side PANEL lists its resolved specs
        (typography + box/layout) and maps each value back to its Zone design
        token (Gray 900, Blue 700, text-sm, rounded-md, space-4, …). The panel
        RESERVES space (pushes content aside) — it never covers the page.
     4. CLICK a color row → a Zone color picker; choose a token to recolor the
        element live (an in-session visual override; the token is copied to the
        clipboard so a dev can apply it in code).
     5. While enabled, pointer events are captured for inspection (the prototype
        does not react — no focus, no menus, no clicks). Toggle off and
        everything behaves normally again.

   Zero-dependency vanilla JS. We do NOT compute anything — every value comes
   straight from getComputedStyle / getBoundingClientRect; the only logic is the
   reverse lookup from a resolved value to its token name.
   ============================================================================= */
(function () {
  'use strict';

  /* ── Zone token reverse-maps (resolved value → token name) ────────────── */
  var COLOR = {"#000000":"Black","#ffffff":"White","#f9fafb":"Gray 50","#f3f4f6":"Gray 100","#e5e7eb":"Gray 200","#d1d5db":"Gray 300","#9ca3af":"Gray 400","#6b7280":"Gray 500","#4b5563":"Gray 600","#374151":"Gray 700","#1f2937":"Gray 800","#111827":"Gray 900","#fdf2f2":"Red 50","#fde8e8":"Red 100","#fbd5d5":"Red 200","#f8b4b4":"Red 300","#f98080":"Red 400","#f05252":"Red 500","#e02424":"Red 600","#c81e1e":"Red 700","#9b1c1c":"Red 800","#771d1d":"Red 900","#fff6ed":"Orange 50","#ffead3":"Orange 100","#ffd5a8":"Orange 200","#ffc17c":"Orange 300","#ffac51":"Orange 400","#ff9725":"Orange 500","#e7721a":"Orange 600","#db5f19":"Orange 700","#c04601":"Orange 800","#9d3901":"Orange 900","#fdfdea":"Yellow 50","#fdf6b2":"Yellow 100","#fce96a":"Yellow 200","#faca15":"Yellow 300","#e3a008":"Yellow 400","#c27803":"Yellow 500","#9f580a":"Yellow 600","#8e4b10":"Yellow 700","#723b13":"Yellow 800","#633112":"Yellow 900","#f3faf7":"Green 50","#def7ec":"Green 100","#bcf0da":"Green 200","#84e1bc":"Green 300","#31c48d":"Green 400","#0e9f6e":"Green 500","#057a55":"Green 600","#046c4e":"Green 700","#03543f":"Green 800","#014737":"Green 900","#edfafa":"Teal 50","#d5f5f6":"Teal 100","#afecef":"Teal 200","#7edce2":"Teal 300","#16bdca":"Teal 400","#0694a2":"Teal 500","#047481":"Teal 600","#036672":"Teal 700","#05505c":"Teal 800","#014451":"Teal 900","#eaf6ff":"Blue 50","#d4edff":"Blue 100","#a7d9fc":"Blue 200","#7fcaff":"Blue 300","#55b9ff":"Blue 400","#2aa7ff":"Blue 500","#2f8af4":"Blue 600","#0168dd":"Blue 700","#0a4b96":"Blue 800","#1f2e54":"Blue 900","#f0f5ff":"Indigo 50","#e5edff":"Indigo 100","#cddbfe":"Indigo 200","#b4c6fc":"Indigo 300","#8da2fb":"Indigo 400","#6875f5":"Indigo 500","#5850ec":"Indigo 600","#5145cd":"Indigo 700","#42389d":"Indigo 800","#362f78":"Indigo 900","#f6edff":"Purple 50","#e8d2ff":"Purple 100","#d1a5ff":"Purple 200","#b977ff":"Purple 300","#a24aff":"Purple 400","#8b1dff":"Purple 500","#7f3cf2":"Purple 600","#7335da":"Purple 700","#5427a7":"Purple 800","#390c84":"Purple 900","#fdf2f8":"Pink 50","#fce8f3":"Pink 100","#fad1e8":"Pink 200","#f8b4d9":"Pink 300","#f17eb8":"Pink 400","#e74694":"Pink 500","#d61f69":"Pink 600","#bf125d":"Pink 700","#99154b":"Pink 800","#751a3d":"Pink 900"};
  var SPACING   = {0:'0',4:'1',8:'2',12:'3',16:'4',20:'5',24:'6',28:'7',32:'8',36:'9',40:'10',44:'11',48:'12',56:'14',64:'16',80:'20',96:'24',112:'28',128:'32',144:'36',160:'40',176:'44',192:'48'};
  var FONTSIZE  = {12:'xs',14:'sm',16:'md',18:'lg',20:'xl',24:'2xl',30:'3xl',36:'4xl',48:'5xl',60:'6xl',72:'7xl'};
  var LINEH     = {16:'leading-xs',20:'leading-sm',24:'leading-md',26:'leading-lg',28:'leading-xl',32:'leading-2xl',40:'leading-3xl'};
  var RADIUS    = {0:null,2:'rounded-sm',4:'rounded',6:'rounded-md',8:'rounded-lg',12:'rounded-xl',16:'rounded-2xl',24:'rounded-3xl'};
  var WEIGHT    = {100:'Thin',200:'Extralight',300:'Light',400:'Regular',500:'Medium',600:'Semibold',700:'Bold',800:'Extrabold',900:'Black'};

  /* Zone component catalogue — name → docs slug (full set, so any detected/tagged
     component links correctly). Base + slug = the docs URL. */
  var ZONE_DOCS = 'https://app.hubstaff.com/zone/docs/components/';
  var ZONE_COMPONENTS = {"Alert":"alert","Autocomplete":"autocomplete","Avatar":"avatar","AvatarStack":"avatar_stack","BarChart":"bar_chart","Breadcrumbs":"breadcrumbs","Button":"button","Card":"card","Checkbox":"checkbox","ConfirmationModal":"confirmation_modal","DataTable":"data_table","DatePicker":"date_picker","DateRangePicker":"date_range_picker","DayPicker":"day_picker","Dialog":"dialog","Drawer":"drawer","Dropdown":"dropdown","GlobalAlert":"global_alert","HiddenField":"hidden_field","Icon":"icon","IconButton":"icon_button","Indicator":"indicator","Label":"label","Modal":"modal","Notice":"notice","NumberField":"number_field","Pagination":"pagination","PhoneField":"phone_field","Pill":"pill","PillGroup":"pill_group","Popover":"popover","RadioButton":"radio_button","Range":"range","SegmentedControls":"segmented_controls","Select":"select","Stepper":"stepper","Table":"table","Tabs":"tabs","TextArea":"text_area","TextField":"text_field","TimeField":"time_field","Toast":"toast","Toggle":"toggle","Tooltip":"tooltip"};
  var ZONE_LABEL = {"AvatarStack":"Avatar stack","BarChart":"Bar chart","ConfirmationModal":"Confirmation modal","DataTable":"Data table","DatePicker":"Date picker","DateRangePicker":"Date range picker","DayPicker":"Day picker","GlobalAlert":"Global alert","HiddenField":"Hidden field","IconButton":"Icon button","NumberField":"Number field","PhoneField":"Phone field","PillGroup":"Pill group","RadioButton":"Radio button","SegmentedControls":"Segmented controls","TextArea":"Text area","TextField":"Text field","TimeField":"Time field"};

  /* CSS style-property targeted by each editable color row. */
  var PICK_PROP = { color: 'color', background: 'backgroundColor', border: 'borderColor', fill: 'fill', stroke: 'stroke' };

  /* ── state ───────────────────────────────────────────────────────────── */
  var S = { cfg: null, on: false, panel: null, ov: null, toggle: null, pop: null, tip: null, dlg: null,
            selected: null, changes: [], moveRaf: 0, openRaf: 0, listeners: [], started: false };

  /* ── utilities ───────────────────────────────────────────────────────── */
  function icon(name) { return '<span class="material-symbols-rounded">' + name + '</span>'; }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function px(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }
  function round(n) { return Math.round(n); }
  function isDmUI(el) { return !!(el && el.closest && el.closest('.dm-panel,#dm-toggle,.dm-ov,.dm-pop,.dm-tip,.dm-dlg,.dm-dlg-backdrop,.da-panel,.da-tc-modal,.da-tc-backdrop,#da-fab,#da-tc-btn')); }

  /* rgb(a) string → { hex, alpha }. Returns {hex:null} for none/transparent. */
  function parseColor(str) {
    if (!str) return null;
    str = String(str).trim();
    if (str.charAt(0) === '#') {
      var h = str.toLowerCase();
      if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
      if (h.length === 9) { var a8 = parseInt(h.slice(7, 9), 16) / 255; return a8 === 0 ? { hex: null, alpha: 0 } : { hex: h.slice(0, 7), alpha: a8 }; }
      if (h.length === 7) return { hex: h, alpha: 1 };
      return null;
    }
    var m = str.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    var parts = m[1].split(/[,\/\s]+/).map(function (p) { return parseFloat(p); }).filter(function (n) { return !isNaN(n); });
    if (parts.length < 3) return null;
    var a = parts.length > 3 ? parts[3] : 1;
    if (a === 0) return { hex: null, alpha: 0 };
    var hex = '#' + parts.slice(0, 3).map(function (n) {
      var h = Math.round(n).toString(16); return h.length === 1 ? '0' + h : h;
    }).join('');
    return { hex: hex.toLowerCase(), alpha: a };
  }
  function colorToken(hex) { return hex && COLOR[hex] ? COLOR[hex] : null; }
  function pxToken(map, v) { var k = round(px(v)); return map[k] != null ? map[k] : null; }
  /* Closest token name for an off-palette hex (RGB distance) — a *suggestion*, not gospel. */
  function nearestToken(hex) {
    if (!hex || hex.charAt(0) !== '#' || hex.length < 7) return null;
    var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    var best = null, bd = Infinity;
    Object.keys(COLOR).forEach(function (t) {
      var R = parseInt(t.slice(1, 3), 16), G = parseInt(t.slice(3, 5), 16), B = parseInt(t.slice(5, 7), 16);
      var d = (r - R) * (r - R) + (g - G) * (g - G) + (b - B) * (b - B);
      if (d < bd) { bd = d; best = COLOR[t]; }
    });
    return best;
  }
  function hasDirectText(el) {
    for (var i = 0; i < el.childNodes.length; i++) { var n = el.childNodes[i]; if (n.nodeType === 3 && n.textContent.trim()) return true; }
    return false;
  }
  /* Walk a subtree → { hex → {hex, alpha, count, hits:[{el,prop,jsProp}]} } for the
     Selection-colours list + bulk remap. Fully generic: text/bg/border/fill/stroke. */
  function computeSelectionColors(root) {
    var map = {};
    function add(el, raw, prop, jsProp) {
      var c = parseColor(raw); if (!c || !c.hex) return;
      var m = map[c.hex] || (map[c.hex] = { hex: c.hex, alpha: c.alpha, count: 0, hits: [] });
      m.count++; if (c.alpha < m.alpha) m.alpha = c.alpha;
      m.hits.push({ el: el, prop: prop, jsProp: jsProp });
    }
    var els = [root], kids = root.querySelectorAll('*');
    for (var i = 0; i < kids.length; i++) els.push(kids[i]);
    els.forEach(function (el) {
      if (isDmUI(el)) return;
      var cs = getComputedStyle(el);
      if (hasDirectText(el)) add(el, cs.color, 'color', 'color');
      add(el, cs.backgroundColor, 'background', 'backgroundColor');
      if (px(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none') add(el, cs.borderTopColor, 'border', 'borderColor');
      if (el.namespaceURI === 'http://www.w3.org/2000/svg') {
        add(el, el.getAttribute('fill') || cs.fill, 'fill', 'fill');
        add(el, el.getAttribute('stroke') || cs.stroke, 'stroke', 'stroke');
      }
    });
    return map;
  }

  /* value cell + optional token pill */
  function valCell(v, tok) {
    return '<span class="dm-v">' + esc(v) + (tok ? '<span class="dm-tok">' + esc(tok) + '</span>' : '') + '</span>';
  }
  /* editable color cell: swatch + hex (+ alpha) + token/no-token; clickable to recolor */
  function colorCell(raw, prop) {
    var c = parseColor(raw);
    var pick = prop ? ' dm-v--pick" data-dmprop="' + prop : '';
    if (!c) return '<span class="dm-v' + pick + '">' + esc(raw) + '</span>';
    if (c.hex === null) return '<span class="dm-v' + pick + '">transparent</span>';
    var tok = colorToken(c.hex);
    var alphaTxt = c.alpha < 1 ? ' · ' + Math.round(c.alpha * 100) + '%' : '';
    return '<span class="dm-v' + pick + '">' +
      '<span class="dm-swatch" style="background:' + esc(raw) + '"></span>' + esc(c.hex) + alphaTxt +
      (tok ? '<span class="dm-tok">' + esc(tok) + '</span>' : '<span class="dm-tok dm-tok--none">no token</span>') +
      (prop ? '<span class="material-symbols-rounded dm-pick-ic">edit</span>' : '') + '</span>';
  }
  function row(k, cellHtml) { return '<div class="dm-row"><span class="dm-k">' + esc(k) + '</span>' + cellHtml + '</div>'; }

  /* ── Zone component detection ─────────────────────────────────────────────
     Works across ANY faithful Zone prototype: an explicit data-zone attribute
     wins; otherwise we match the canonical Zone class fingerprints (the real
     recipe classes every Zone prototype renders). Returns {name,label,url}. */
  function zComp(name) {
    var slug = ZONE_COMPONENTS[name]; if (!slug) return null;
    return { name: name, label: ZONE_LABEL[name] || name, url: ZONE_DOCS + slug, custom: false };
  }
  function resolveZoneName(v) {
    v = String(v).trim().toLowerCase().replace(/[\s-]/g, '_');
    for (var n in ZONE_COMPONENTS) { if (n.toLowerCase() === v || ZONE_COMPONENTS[n] === v) return n; }
    return null;
  }
  /* variant/size — from explicit data-* (authoritative) or inferred from the recipe classes */
  function declVariant(el) {
    var out = []; var s = el.getAttribute('data-size'); var v = el.getAttribute('data-variant');
    if (s) out.push(s); if (v) out.push(v);
    return out.join(' · ') || null;
  }
  function autoVariant(name, el) {
    var c = (el.getAttribute('class') || ''), cs = getComputedStyle(el);
    if (name === 'Button' || name === 'IconButton') {
      var size = /\bh-8\b/.test(c) ? 'sm' : /\bh-10\b/.test(c) ? 'md' : /\bh-12\b/.test(c) ? 'lg' : null;
      var bg = parseColor(cs.backgroundColor), hasBg = bg && bg.hex !== null;
      var hasBorder = px(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none';
      var kind = hasBg ? 'solid' : (hasBorder ? 'outline' : 'ghost');
      return [size, kind].filter(Boolean).join(' · ') || null;
    }
    if (name === 'Pill') return /py-0(\b|\.)/.test(c) ? 'sm' : /py-2\b/.test(c) ? 'lg' : 'md';
    if (name === 'SegmentedControls') {
      var it = (el.matches && el.matches('[class*="first:rounded-l"]')) ? el : (el.querySelector && el.querySelector('[class*="first:rounded-l"]'));
      var ic = it ? (it.getAttribute('class') || '') : c;
      return /\bh-8\b/.test(ic) ? 'sm' : /\bh-10\b/.test(ic) ? 'md' : /\bh-12\b/.test(ic) ? 'lg' : null;
    }
    if (name === 'BarChart') {
      var wrap = (el.closest && el.closest('.recharts-wrapper')) || el;
      var rects = wrap.querySelectorAll ? wrap.querySelectorAll('path.recharts-rectangle,rect.recharts-rectangle') : [];
      var xs = {}, multi = false;
      for (var i = 0; i < rects.length; i++) { var x = Math.round(parseFloat(rects[i].getAttribute('x'))); if (!isNaN(x)) { xs[x] = (xs[x] || 0) + 1; if (xs[x] > 1) multi = true; } }
      return rects.length ? (multi ? 'stacked' : 'grouped') : null;
    }
    return null;
  }
  function withVar(comp, el) { if (comp) comp.variant = declVariant(el) || autoVariant(comp.name, el); return comp; }

  function matchAt(el) {
    if (!el || el.nodeType !== 1) return null;
    var tag = el.tagName.toLowerCase();
    var c = (el.getAttribute('class') || '');
    /* 1) explicit declarations win — "what the author says" */
    var dz = el.getAttribute('data-zone'); if (dz) { var n = resolveZoneName(dz); if (n) return withVar(zComp(n), el); }
    var dc = el.getAttribute('data-component');
    if (dc) return { name: dc, label: dc, url: el.getAttribute('data-component-href') || null, custom: true, variant: declVariant(el) };
    /* 2) reliable auto-detect for distinctive, faithfully-reproduced Zone ATOMS (never token-composed containers) */
    if (el.closest && el.closest('.recharts-wrapper,.recharts-responsive-container,.recharts-surface')) return withVar(zComp('BarChart'), el);
    if (/first:rounded-l/.test(c)) return withVar(zComp('SegmentedControls'), el);
    if (/rounded-full/.test(c) && /inline-flex/.test(c) && (/select-none/.test(c) || /text-xs/.test(c)) && tag !== 'button') return withVar(zComp('Pill'), el);
    if (/border-b-2/.test(c) && /-mb-px/.test(c)) return zComp('Tabs');
    if (tag === 'button' || (tag === 'a' && el.hasAttribute('href'))) {
      if (/inline-flex/.test(c) && /justify-center/.test(c) && /rounded-/.test(c)) {
        var r = el.getBoundingClientRect();
        var iconOnly = !(el.textContent || '').trim() && Math.abs(r.width - r.height) < 6;
        return withVar(zComp(iconOnly ? 'IconButton' : 'Button'), el);
      }
    }
    /* Cards, tables & other token-composed containers are CUSTOM — never auto-claimed.
       Declare them with data-component="…" (+ optional data-component-href). */
    return null;
  }
  function detectComponent(el) {
    var n = el, d = 0;
    while (n && n.nodeType === 1 && d < 6 && n !== document.body) {
      var m = matchAt(n); if (m) return m;
      n = n.parentElement; d++;
    }
    return null;
  }

  /* spacing token(s) for a [top,right,bottom,left] px tuple (CSS shorthand order) */
  function spacingTok(sides) {
    var toks = sides.map(function (v) { return SPACING[v] != null ? SPACING[v] : null; });
    if (toks.some(function (t) { return t === null; })) return null;   // a side isn't a token
    var t = toks[0], r = toks[1], b = toks[2], l = toks[3];
    if (t === r && r === b && b === l) return 'space-' + t;             // uniform
    if (t === b && l === r) return 'space-y-' + t + ' · space-x-' + l;  // symmetric
    return 'space ' + t + '/' + r + '/' + b + '/' + l;                 // T/R/B/L
  }

  /* ── spec panel ──────────────────────────────────────────────────────── */
  function specHTML(el) {
    var cs = getComputedStyle(el);
    var rect = el.getBoundingClientRect();
    var tag = el.tagName.toLowerCase();
    var cls = (el.getAttribute('class') || '').trim();
    var clsShort = cls ? (cls.length > 120 ? cls.slice(0, 120) + '…' : cls) : '';
    var hasText = false;
    for (var i = 0; i < el.childNodes.length; i++) {
      if (el.childNodes[i].nodeType === 3 && el.childNodes[i].textContent.trim()) { hasText = true; break; }
    }

    var comp = detectComponent(el);
    var compHtml = '';
    if (comp) {
      var isC = comp.custom;
      var nameHtml = esc(comp.label) + (comp.variant ? '<span class="dm-comp-var">' + esc(comp.variant) + '</span>' : '');
      var inner = '<span class="dm-comp-ic">' + icon(isC ? 'widgets' : 'deployed_code') + '</span>' +
        '<span class="dm-comp-meta"><span class="dm-comp-lbl">' + (isC ? 'Custom component' : 'Zone component') + '</span>' +
        '<span class="dm-comp-name">' + nameHtml + '</span></span>' +
        (comp.url ? '<span class="material-symbols-rounded dm-comp-ext">open_in_new</span>' : '');
      var klass = 'dm-comp' + (isC ? ' dm-comp--custom' : '');
      compHtml = comp.url
        ? '<a class="' + klass + '" href="' + esc(comp.url) + '" target="_blank" rel="noopener" title="Open docs">' + inner + '</a>'
        : '<div class="' + klass + '">' + inner + '</div>';
    }

    var idHtml = '<div class="dm-ident"><span class="dm-tag">&lt;' + esc(tag) + '&gt;</span>' +
      '<span class="dm-dims">' + round(rect.width) + ' × ' + round(rect.height) + '</span></div>' +
      (cls ? '<div class="dm-cls" title="' + esc(cls) + '">' + esc(clsShort) + '</div>' : '');

    /* Typography */
    var fw = round(px(cs.fontWeight)) || cs.fontWeight;
    var fam = cs.fontFamily.split(',')[0].replace(/["']/g, '');
    var ls = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
    var styleBits = [];
    if (cs.fontStyle && cs.fontStyle !== 'normal') styleBits.push(cs.fontStyle);
    if ((round(px(cs.fontWeight)) || 400) >= 600) styleBits.push('bold');
    if (cs.textDecorationLine && cs.textDecorationLine !== 'none') styleBits.push(cs.textDecorationLine);
    var lhTok = cs.lineHeight === 'normal' ? null : pxToken(LINEH, cs.lineHeight);
    var typeHtml =
      row('Font family', valCell(fam)) +
      row('Font size', valCell(cs.fontSize, pxToken(FONTSIZE, cs.fontSize) ? 'text-' + pxToken(FONTSIZE, cs.fontSize) : null)) +
      row('Weight', valCell(String(fw), WEIGHT[fw] || null)) +
      row('Line height', valCell(cs.lineHeight === 'normal' ? 'normal' : cs.lineHeight, lhTok)) +
      row('Letter spacing', valCell(ls)) +
      row('Style', valCell(styleBits.length ? styleBits.join(', ') : 'normal')) +
      row('Color', colorCell(cs.color, 'color'));

    /* Box / layout */
    var boxRows = row('Display', valCell(cs.display));
    /* SVG shapes (chart bars, icons) paint via fill/stroke, not CSS background — surface those. */
    if (el.namespaceURI === 'http://www.w3.org/2000/svg') {
      var fillRaw = el.getAttribute('fill') || cs.fill;
      var strokeRaw = el.getAttribute('stroke') || cs.stroke;
      var fc = parseColor(fillRaw);
      boxRows += row('Fill', (fc && fc.hex) ? colorCell(fillRaw, 'fill') : valCell(fillRaw || 'none'));
      var sc = parseColor(strokeRaw);
      if (sc && sc.hex) boxRows += row('Stroke', colorCell(strokeRaw, 'stroke'));
      var bgc = parseColor(cs.backgroundColor);
      if (bgc && bgc.hex) boxRows += row('Background', colorCell(cs.backgroundColor, 'background'));
    } else {
      boxRows += row('Background', colorCell(cs.backgroundColor, 'background'));
    }
    var bw = px(cs.borderTopWidth);
    if (bw > 0 && cs.borderTopStyle !== 'none') {
      boxRows += row('Border', valCell(round(bw) + 'px ' + cs.borderTopStyle));
      boxRows += row('Border color', colorCell(cs.borderTopColor, 'border'));
    } else {
      boxRows += row('Border', valCell('none'));
    }
    var r = cs.borderTopLeftRadius;
    if (px(r) > 0) boxRows += row('Radius', valCell(r, pxToken(RADIUS, r)));
    var pad = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(function (v) { return round(px(v)); });
    if (pad.some(function (v) { return v > 0; })) boxRows += row('Padding', valCell(pad.join('px ') + 'px', spacingTok(pad)));
    var mar = [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].map(function (v) { return round(px(v)); });
    if (mar.some(function (v) { return v !== 0; })) boxRows += row('Margin', valCell(mar.join('px ') + 'px', spacingTok(mar)));
    if (cs.display.indexOf('flex') !== -1 || cs.display.indexOf('grid') !== -1) {
      var rgSet = cs.rowGap !== 'normal', cgSet = cs.columnGap !== 'normal';
      var rgv = rgSet ? round(px(cs.rowGap)) : 0, cgv = cgSet ? round(px(cs.columnGap)) : 0;
      var gapVal, gapTok = null;
      if ((!rgSet && !cgSet) || (rgv === 0 && cgv === 0)) { gapVal = '0px'; }
      else if (rgv === cgv) { gapVal = rgv + 'px'; gapTok = SPACING[rgv] != null ? 'space-' + SPACING[rgv] : null; }
      else { gapVal = rgv + 'px ' + cgv + 'px'; var a = SPACING[rgv], b = SPACING[cgv]; gapTok = (a != null && b != null) ? 'space ' + a + '/' + b : null; }
      boxRows += row('Gap', valCell(gapVal, gapTok));
      boxRows += row('Direction', valCell(cs.flexDirection || cs.gridAutoFlow || '—'));
      boxRows += row('Align', valCell(cs.alignItems + ' / ' + cs.justifyContent));
    }

    /* Selection colours — every colour in this element's subtree, with token or nearest suggestion + bulk remap */
    S.selRoot = el;
    S.selColorsMap = computeSelectionColors(el);
    var scList = Object.keys(S.selColorsMap).map(function (k) { return S.selColorsMap[k]; });
    scList.sort(function (a, b) { var at = colorToken(a.hex) ? 1 : 0, bt = colorToken(b.hex) ? 1 : 0; return at !== bt ? at - bt : b.count - a.count; });
    var scRows = scList.map(function (m) {
      var tok = colorToken(m.hex);
      var alphaTxt = m.alpha < 1 ? ' · ' + Math.round(m.alpha * 100) + '%' : '';
      return '<div class="dm-row dm-selc" data-dmsel="' + m.hex + '"><span class="dm-v dm-v--pick">' +
        '<span class="dm-swatch" style="background:' + m.hex + '"></span>' + esc(m.hex) + alphaTxt +
        (tok ? '<span class="dm-tok">' + esc(tok) + '</span>'
             : '<span class="dm-tok dm-tok--none">no token</span><span class="dm-tok dm-tok--near">≈ ' + esc(nearestToken(m.hex) || '') + '</span>') +
        '<span class="dm-selc-n">×' + m.count + '</span>' +
        '<span class="material-symbols-rounded dm-pick-ic">edit</span></span></div>';
    }).join('');
    var scHtml = scList.length ? '<div class="dm-sec"><div class="dm-sec-hd">Selection colours (' + scList.length + ')</div>' + scRows + '</div>' : '';

    var order = hasText ? [['Typography', typeHtml], ['Box & layout', boxRows]]
                        : [['Box & layout', boxRows], ['Typography', typeHtml]];
    return compHtml + idHtml + order.map(function (s) {
      return '<div class="dm-sec"><div class="dm-sec-hd">' + esc(s[0]) + '</div>' + s[1] + '</div>';
    }).join('') + scHtml;
  }

  function buildPanel() {
    var el = document.createElement('div');
    el.className = 'dm-panel';
    el.style.setProperty('--dm-top', (S.cfg.topOffset || 52) + 'px');
    el.style.setProperty('--dm-w', (S.cfg.panelWidth || 320) + 'px');
    el.innerHTML =
      '<div class="dm-hd"><div class="dm-hd-icon">' + icon('frame_inspect') + '</div>' +
        '<div class="dm-hd-meta"><div class="dm-hd-title">Dev Mode</div>' +
          '<div class="dm-hd-sub" id="dm-sub">Click any element to inspect</div></div>' +
        '<button class="dm-changes-btn" id="dm-changes-btn" hidden title="Review changes">' + icon('difference') + '<span class="dm-changes-n">0</span></button>' +
        '<button class="dm-close" aria-label="Disable Dev Mode">' + icon('close') + '</button></div>' +
      '<div class="dm-body" id="dm-body"><div class="dm-empty">' + icon('ads_click') +
        '<div>Hover to highlight, click to inspect an element’s specs and design tokens. Click a colour to recolour it.</div></div></div>';
    document.body.appendChild(el);
    el.querySelector('.dm-close').addEventListener('click', function () { API.disable(); });
    // delegate color-row clicks → open picker
    el.querySelector('#dm-body').addEventListener('click', function (e) {
      var selEl = e.target.closest('[data-dmsel]');
      if (selEl) { e.stopPropagation(); openBulkPicker(selEl.getAttribute('data-dmsel'), selEl); return; }
      var pickEl = e.target.closest('[data-dmprop]');
      if (pickEl) { e.stopPropagation(); openPicker(pickEl.getAttribute('data-dmprop'), pickEl); }
    });
    el.querySelector('#dm-changes-btn').addEventListener('click', openDialog);
    S.panel = el;
    updateChangesUI();
  }
  function renderPanel(el) {
    closePicker();
    if (!S.panel) buildPanel();
    S.panel.querySelector('#dm-body').innerHTML = specHTML(el);
    var sub = S.panel.querySelector('#dm-sub');
    if (sub) sub.textContent = '<' + el.tagName.toLowerCase() + '> selected';
  }

  /* ── live Zone color picker ──────────────────────────────────────────── */
  function openPicker(prop, anchorEl, onPick) {
    closePicker();
    if (!S.selected) return;
    var groups = {}; var order = [];
    Object.keys(COLOR).forEach(function (hex) {
      var g = COLOR[hex].split(' ')[0];
      if (!groups[g]) { groups[g] = []; order.push(g); }
      groups[g].push(hex);
    });
    var swHtml = order.map(function (g) {
      return '<div class="dm-pop-grp"><div class="dm-pop-grp-lbl">' + esc(g) + '</div><div class="dm-pop-grid">' +
        groups[g].map(function (hex) {
          return '<button class="dm-sw" data-hex="' + hex + '" title="' + esc(COLOR[hex]) + ' · ' + hex + '" style="background:' + hex + '"></button>';
        }).join('') + '</div></div>';
    }).join('');
    var pop = document.createElement('div');
    pop.className = 'dm-pop';
    pop.innerHTML = '<div class="dm-pop-hd">Zone colours <button class="dm-pop-close" aria-label="Close">' + icon('close') + '</button></div>' +
      '<div class="dm-pop-body">' + swHtml + '</div>' +
      '<div class="dm-pop-ft">Applies a live override &amp; copies the token</div>';
    document.body.appendChild(pop);
    S.pop = pop;
    // position just left of the panel, aligned near the clicked row
    var pw = S.cfg.panelWidth || 320;
    var ar = anchorEl.getBoundingClientRect();
    pop.style.right = (pw + 12) + 'px';
    pop.style.top = Math.max(56, Math.min(ar.top, window.innerHeight - 360)) + 'px';
    pop.querySelector('.dm-pop-close').addEventListener('click', closePicker);
    pop.querySelectorAll('.dm-sw').forEach(function (sw) {
      sw.addEventListener('click', function () { var hx = this.getAttribute('data-hex'); if (onPick) onPick(hx); else applyColor(prop, hx); });
    });
  }
  function closePicker() { if (S.pop) { S.pop.remove(); S.pop = null; } }
  function applyColor(prop, hex) {
    if (!S.selected) return;
    var jsProp = PICK_PROP[prop] || 'color';
    var oldC = parseColor(getComputedStyle(S.selected)[jsProp]);
    var oldHex = oldC ? (oldC.hex || 'transparent') : '';
    S.selected.style[jsProp] = hex;
    recordChange(S.selected, prop, jsProp, oldHex, hex);
    try { navigator.clipboard && navigator.clipboard.writeText(colorToken(hex) || hex); } catch (e) {}
    closePicker();
    renderPanel(S.selected);   // reflect the new value + token
    drawOverlay(S.selected, true);
  }
  /* Selection-colours bulk remap: recolour EVERY element that uses `hex` in the selection. */
  function openBulkPicker(hex, anchorEl) { openPicker(null, anchorEl, function (newHex) { applyBulkColor(hex, newHex); }); }
  function applyBulkColor(hex, newHex) {
    var m = S.selColorsMap && S.selColorsMap[hex]; if (!m) return;
    m.hits.forEach(function (h) { h.el.style[h.jsProp] = newHex; recordChange(h.el, h.prop, h.jsProp, hex, newHex); });
    try { navigator.clipboard && navigator.clipboard.writeText(colorToken(newHex) || newHex); } catch (e) {}
    closePicker();
    var root = S.selRoot || S.selected;   // re-render the list from its own root (mirrors handleClick's refresh path)
    if (root) { S.selected = root; drawOverlay(root, true); renderPanel(root); }
  }

  /* ── change log (explore live → curate → apply to code) ──────────────── */
  function getSource(el) {                      // React __source (file:line), when available
    var k = Object.keys(el).find(function (kk) { return kk.indexOf('__reactFiber$') === 0; });
    var f = k ? el[k] : null;
    while (f) { if (f._debugSource) return f._debugSource; f = f.return; }
    return null;
  }
  function elHint(el) {
    var t = (el.textContent || '').trim().replace(/\s+/g, ' ');
    if (t) return '“' + t.slice(0, 26) + (t.length > 26 ? '…' : '') + '”';
    var c = (el.getAttribute('class') || '').split(' ')[0];
    return c ? '.' + c : '';
  }
  function recordChange(el, prop, jsProp, oldHex, newHex) {
    var ex = S.changes.filter(function (c) { return c.el === el && c.prop === prop; })[0];
    if (ex) { ex.newHex = newHex; ex.token = colorToken(newHex) || newHex; }
    else {
      var src = getSource(el);
      S.changes.push({
        el: el, prop: prop, jsProp: jsProp, oldHex: oldHex, newHex: newHex,
        token: colorToken(newHex) || newHex, tag: el.tagName.toLowerCase(), hint: elHint(el),
        src: src ? (String(src.fileName).split('/').pop() + ':' + src.lineNumber) : null, on: true,
      });
    }
    updateChangesUI();
  }
  function revertChange(i) {
    var c = S.changes[i]; if (!c) return;
    c.el.style[c.jsProp] = '';                  // drop the inline override → back to the class colour
    S.changes.splice(i, 1);
    updateChangesUI();
    if (S.dlg) renderDialog();
    if (S.selected) { renderPanel(S.selected); drawOverlay(S.selected, true); }
  }
  function updateChangesUI() {
    if (!S.panel) return;
    var btn = S.panel.querySelector('#dm-changes-btn');
    if (!btn) return;
    btn.hidden = S.changes.length === 0;
    var b = btn.querySelector('.dm-changes-n'); if (b) b.textContent = S.changes.length;
  }
  function changeText(list) {
    return 'Dev Mode changes (' + list.length + '):\n' + list.map(function (c, i) {
      return (i + 1) + '. ' + c.prop + ': ' + c.oldHex + ' → ' + c.newHex + ' (' + c.token + ') — <' +
        c.tag + '> ' + c.hint + (c.src ? ' — ' + c.src : '');
    }).join('\n');
  }
  function buildDialog() {
    var bd = document.createElement('div'); bd.className = 'dm-dlg-backdrop';
    bd.addEventListener('click', closeDialog);
    document.body.appendChild(bd);
    var dlg = document.createElement('div'); dlg.className = 'dm-dlg';
    document.body.appendChild(dlg);
    S.dlg = dlg; S.dlgBd = bd;
    renderDialog();
  }
  function renderDialog() {
    if (!S.dlg) return;
    var rows = S.changes.length ? S.changes.map(function (c, i) {
      return '<div class="dm-chg"><input type="checkbox" class="dm-chg-chk" data-i="' + i + '"' + (c.on ? ' checked' : '') + '>' +
        '<div class="dm-chg-meta"><div class="dm-chg-el"><span class="dm-chg-tag">&lt;' + esc(c.tag) + '&gt;</span> ' + esc(c.hint) + '</div>' +
          (c.src ? '<div class="dm-chg-src">' + esc(c.src) + '</div>' : '') +
          '<div class="dm-chg-diff">' + esc(c.prop) + ' <span class="dm-chg-old">' + esc(c.oldHex) + '</span> → ' +
            '<span class="dm-swatch" style="background:' + esc(c.newHex) + '"></span>' + esc(c.newHex) +
            '<span class="dm-tok">' + esc(c.token) + '</span></div></div>' +
        '<button class="dm-chg-del" data-i="' + i + '" title="Revert">' + icon('delete') + '</button></div>';
    }).join('') : '<div class="dm-dlg-empty">No changes yet. Click a colour in the panel to recolour an element.</div>';
    S.dlg.innerHTML =
      '<div class="dm-dlg-hd">' + icon('difference') + 'Changes <span class="dm-dlg-count">' + S.changes.length + '</span>' +
        '<button class="dm-dlg-close" aria-label="Close">' + icon('close') + '</button></div>' +
      '<div class="dm-dlg-body">' + rows + '</div>' +
      '<div class="dm-dlg-ft"><span class="dm-dlg-hint" id="dm-dlg-hint">Tick the ones to keep, then Apply</span>' +
        '<button class="dm-dlg-btn" id="dm-copy">' + icon('content_copy') + 'Copy</button>' +
        '<button class="dm-dlg-btn dm-dlg-btn--primary" id="dm-apply">' + icon('check') + 'Apply</button></div>';
    S.dlg.querySelector('.dm-dlg-close').addEventListener('click', closeDialog);
    S.dlg.querySelectorAll('.dm-chg-chk').forEach(function (chk) {
      chk.addEventListener('change', function () { S.changes[+this.getAttribute('data-i')].on = this.checked; });
    });
    S.dlg.querySelectorAll('.dm-chg-del').forEach(function (b) {
      b.addEventListener('click', function () { revertChange(+this.getAttribute('data-i')); });
    });
    var copy = S.dlg.querySelector('#dm-copy'), apply = S.dlg.querySelector('#dm-apply');
    if (copy) copy.addEventListener('click', function () { doExport(false); });
    if (apply) apply.addEventListener('click', function () { doExport(true); });
  }
  function doExport(apply) {
    var list = S.changes.filter(function (c) { return c.on; });
    if (!list.length) return;
    var txt = changeText(list);
    try { navigator.clipboard && navigator.clipboard.writeText(txt); } catch (e) {}
    var hint = S.dlg && S.dlg.querySelector('#dm-dlg-hint');
    if (!apply) {
      if (hint) hint.textContent = 'Copied ' + list.length + ' change' + (list.length > 1 ? 's' : '') + ' ✓';
      return;
    }
    // stash a structured batch the coding agent can read + apply to source
    var batch = list.map(function (c) {
      return { prop: c.prop, from: c.oldHex, to: c.newHex, token: c.token, tag: c.tag, hint: c.hint, source: c.src };
    });
    window.__DEVMODE_CHANGES__ = batch;
    // Bridge to Claude Code: POST to the dev-server endpoint (see vite.config.ts).
    // It writes .devmode/apply.json, which a background watcher hands to the agent.
    // Falls back to clipboard + manual "apply" if the endpoint isn't present.
    var sent = false;
    try {
      fetch('/__devmode/apply', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(batch)
      }).then(function (r) {
        sent = r && r.ok;
        if (hint) hint.textContent = sent
          ? 'Sent to Claude ✓ — applying ' + batch.length + ' change' + (batch.length > 1 ? 's' : '') + ' to code…'
          : 'Copied ✓ — tell Claude “apply my Dev Mode changes”';
      }).catch(function () {
        if (hint) hint.textContent = 'Copied ✓ — tell Claude “apply my Dev Mode changes”';
      });
    } catch (e) {
      if (hint) hint.textContent = 'Copied ✓ — tell Claude “apply my Dev Mode changes”';
    }
  }
  function openDialog() { if (!S.dlg) buildDialog(); else renderDialog(); requestAnimationFrame(function () { if (S.dlgBd) S.dlgBd.classList.add('is-open'); if (S.dlg) S.dlg.classList.add('is-open'); }); }
  function closeDialog() { if (S.dlgBd) S.dlgBd.classList.remove('is-open'); if (S.dlg) S.dlg.classList.remove('is-open'); }

  /* ── box-model overlay ───────────────────────────────────────────────── */
  function ensureOverlay() {
    if (S.ov) return;
    var ov = document.createElement('div');
    ov.className = 'dm-ov';
    document.body.appendChild(ov);
    S.ov = ov;
  }
  /* clamp a rect to the viewport; return null if fully off-screen */
  function clip(x, y, w, h) {
    var x2 = Math.min(x + w, window.innerWidth), y2 = Math.min(y + h, window.innerHeight);
    x = Math.max(x, 0); y = Math.max(y, 0);
    var nw = x2 - x, nh = y2 - y;
    if (nw <= 0 || nh <= 0) return null;
    return [x, y, nw, nh];
  }
  function band(x, y, w, h, cls) {
    if (w <= 0 || h <= 0) return '';
    var c = clip(x, y, w, h); if (!c) return '';
    return '<div class="' + cls + '" style="left:' + c[0] + 'px;top:' + c[1] + 'px;width:' + c[2] + 'px;height:' + c[3] + 'px"></div>';
  }
  /* a margin side: outset when positive, inset (into the box) when negative */
  function marginSide(pos, val, x, y, w, h) {
    if (val === 0) return '';
    var cls = val < 0 ? 'dm-margin dm-margin--neg' : 'dm-margin';
    var a = Math.abs(val);
    if (pos === 'top')    return band(x, val < 0 ? y : y - a, w, a, cls);
    if (pos === 'bottom') return band(x, val < 0 ? y + h - a : y + h, w, a, cls);
    if (pos === 'left')   return band(val < 0 ? x : x - a, y, a, h, cls);
    return band(val < 0 ? x + w - a : x + w, y, a, h, cls);   // right
  }
  function drawOverlay(el, full) {
    ensureOverlay();
    var rect = el.getBoundingClientRect();
    var cs = getComputedStyle(el);
    var mt = px(cs.marginTop), mr = px(cs.marginRight), mb = px(cs.marginBottom), ml = px(cs.marginLeft);
    var bt = px(cs.borderTopWidth), br = px(cs.borderRightWidth), bb = px(cs.borderBottomWidth), bl = px(cs.borderLeftWidth);
    var pt = px(cs.paddingTop), pr = px(cs.paddingRight), pb = px(cs.paddingBottom), pl = px(cs.paddingLeft);
    var L = rect.left, T = rect.top, W = rect.width, H = rect.height;      // border box
    var html = '';
    if (full) {
      // margin (outset / inset for negatives)
      html += marginSide('top', mt, L, T, W, H) + marginSide('bottom', mb, L, T, W, H) +
              marginSide('left', ml, L, T, W, H) + marginSide('right', mr, L, T, W, H);
      // border ring
      html += band(L, T, W, bt, 'dm-border') + band(L, T + H - bb, W, bb, 'dm-border') +
              band(L, T + bt, bl, H - bt - bb, 'dm-border') + band(L + W - br, T + bt, br, H - bt - bb, 'dm-border');
      // padding (inside the border box)
      var pX = L + bl, pY = T + bt, pW = W - bl - br, pH = H - bt - bb;
      html += band(pX, pY, pW, pt, 'dm-padding') + band(pX, pY + pH - pb, pW, pb, 'dm-padding') +
              band(pX, pY + pt, pl, pH - pt - pb, 'dm-padding') + band(pX + pW - pr, pY + pt, pr, pH - pt - pb, 'dm-padding');
      // content
      var cX = pX + pl, cY = pY + pt, cW = pW - pl - pr, cH = pH - pt - pb;
      html += band(cX, cY, cW, cH, 'dm-content');
      // gap bands between flex/grid children
      if (cs.display.indexOf('flex') !== -1 || cs.display.indexOf('grid') !== -1) {
        var kids = [];
        for (var i = 0; i < el.children.length; i++) {
          var kr = el.children[i].getBoundingClientRect();
          if (kr.width > 0 && kr.height > 0) kids.push(kr);
        }
        for (var j = 0; j < kids.length - 1; j++) {
          var A = kids[j], B = kids[j + 1];
          if (B.left - A.right > 1) html += band(A.right, cY, B.left - A.right, cH, 'dm-gap');       // horizontal gap
          else if (B.top - A.bottom > 1) html += band(cX, A.bottom, cW, B.top - A.bottom, 'dm-gap'); // vertical gap
        }
      }
    }
    // outline + size label (clamped)
    var ob = clip(L, T, W, H);
    if (ob) html += '<div class="dm-outline" style="left:' + ob[0] + 'px;top:' + ob[1] + 'px;width:' + ob[2] + 'px;height:' + ob[3] + 'px"></div>';
    var lx = Math.max(0, L), ly = T - 22 < (S.cfg.topOffset || 52) ? T + 4 : T - 22;
    html += '<div class="dm-size" style="left:' + lx + 'px;top:' + ly + 'px">' + round(W) + ' × ' + round(H) + '</div>';
    S.ov.innerHTML = html;
  }
  function clearOverlay() { if (S.ov) S.ov.innerHTML = ''; }

  /* in-place measurement popover (shown on hover, next to the element) */
  function fmtSides(s) {
    var u = s.filter(function (v, i, a) { return a.indexOf(v) === i; });
    if (u.length === 1) return s[0] + 'px';
    if (s[0] === s[2] && s[3] === s[1]) return s[0] + ' / ' + s[1] + 'px';
    return s.join(' ') + 'px';
  }
  function tipRow(dotCls, label, val) {
    return '<span class="dm-tip-row"><span class="dm-tip-dot ' + dotCls + '"></span>' + label + ' <b>' + esc(val) + '</b></span>';
  }
  function showTip(el) {
    if (!S.tip) { S.tip = document.createElement('div'); S.tip.className = 'dm-tip'; document.body.appendChild(S.tip); }
    var cs = getComputedStyle(el), rect = el.getBoundingClientRect();
    var pad = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(function (v) { return round(px(v)); });
    var mar = [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].map(function (v) { return round(px(v)); });
    var isFlex = cs.display.indexOf('flex') !== -1 || cs.display.indexOf('grid') !== -1;
    var rg = cs.rowGap === 'normal' ? 0 : round(px(cs.rowGap)), cg = cs.columnGap === 'normal' ? 0 : round(px(cs.columnGap));
    var body = '';
    if (pad.some(function (v) { return v > 0; })) body += tipRow('dm-dot-pad', 'padding', fmtSides(pad));
    if (mar.some(function (v) { return v !== 0; })) body += tipRow('dm-dot-mar', 'margin', fmtSides(mar));
    if (isFlex && (rg > 0 || cg > 0)) body += tipRow('dm-dot-gap', 'gap', (rg === cg ? rg : rg + ' / ' + cg) + 'px');
    S.tip.innerHTML = '<div class="dm-tip-hd">&lt;' + esc(el.tagName.toLowerCase()) + '&gt; <b>' + round(rect.width) + ' × ' + round(rect.height) + '</b></div>' +
      (body ? '<div class="dm-tip-body">' + body + '</div>' : '');
    S.tip.style.display = 'block';
    var tw = S.tip.offsetWidth, th = S.tip.offsetHeight, top = S.cfg.topOffset || 52;
    var y = rect.top - th - 8; if (y < top + 4) y = rect.bottom + 8;
    var x = Math.min(Math.max(4, rect.left), window.innerWidth - tw - 4);
    S.tip.style.left = x + 'px'; S.tip.style.top = y + 'px';
  }
  function hideTip() { if (S.tip) S.tip.style.display = 'none'; }

  /* content push-aside (mirrors Design Annotations) */
  function pushContent(on) {
    var sel = S.cfg.mount || '#shell-content';
    var el = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (!el) return;
    el.style.transition = 'margin-right 220ms cubic-bezier(.4,0,.2,1)';
    el.style.marginRight = on ? (S.cfg.panelWidth || 320) + 'px' : '';
  }

  /* ── event handlers ──────────────────────────────────────────────────── */
  function handleMove(e) {
    if (S.moveRaf) return;
    var cx = e.clientX, cy = e.clientY;
    S.moveRaf = requestAnimationFrame(function () {
      S.moveRaf = 0;
      if (!S.on) return;                       // guard: no stale draw after teardown
      var el = document.elementFromPoint(cx, cy);
      if (!el || isDmUI(el)) {                 // over the panel/nothing → keep the selected view, drop the hover tip
        hideTip();
        if (S.selected) drawOverlay(S.selected, true); else clearOverlay();
        return;
      }
      drawOverlay(el, true);                    // full box-model bands on hover
      showTip(el);
    });
  }
  function suppress(e) {                        // block pre-click reactions (focus, menus, drags)
    if (isDmUI(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
  }
  function handleClick(e) {
    if (isDmUI(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    S.selected = e.target;
    drawOverlay(e.target, true);
    renderPanel(e.target);
  }
  function handleKey(e) {
    if (e.key === 'Escape' && S.on) { e.preventDefault(); e.stopPropagation(); API.disable(); }
  }
  function handleScroll() { if (S.on && S.selected) drawOverlay(S.selected, true); }

  function addL(target, type, fn, opts) { target.addEventListener(type, fn, opts); S.listeners.push([target, type, fn, opts]); }
  function removeAllL() { S.listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); }); S.listeners = []; }

  /* ── toggle button ───────────────────────────────────────────────────── */
  function buildToggle() {
    if (S.toggle) return;
    var btn = document.createElement('button');
    btn.className = 'dm-tc-btn';
    btn.id = 'dm-toggle';
    btn.setAttribute('title', 'Toggle Dev Mode (inspect element specs)');
    btn.innerHTML = icon('code') + 'Dev Mode';
    btn.addEventListener('click', function () { API.toggle(); });
    S.toggle = btn;
    var after = document.getElementById('da-tc-btn');
    var anchor = S.cfg.toggleAnchor ? document.querySelector(S.cfg.toggleAnchor) : null;
    if (after && after.parentElement) after.parentElement.insertBefore(btn, after.nextSibling);
    else if (anchor && anchor.parentElement) anchor.parentElement.insertBefore(btn, anchor.nextSibling);
    else { btn.classList.add('dm-tc-btn--float'); document.body.appendChild(btn); }
  }

  /* ── CSS ─────────────────────────────────────────────────────────────── */
  function injectCSS() {
    if (document.getElementById('dm-css')) return;
    var s = document.createElement('style');
    s.id = 'dm-css';
    s.textContent = [
      '.dm-tc-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 10px 5px 8px;border:none;cursor:pointer;background:#f3f4f6;border-radius:6px;margin-left:8px;font-family:Roboto,system-ui,sans-serif;font-size:12px;font-weight:500;color:#6b7280;transition:background 120ms,color 120ms;white-space:nowrap;vertical-align:middle;line-height:1;}',
      '.dm-tc-btn:hover{background:#e5e7eb;color:#374151;}',
      '.dm-tc-btn.is-active{background:#0168dd;color:#fff;}',
      '.dm-tc-btn .material-symbols-rounded{font-size:15px !important;}',
      '.dm-tc-btn--float{position:fixed;bottom:20px;right:150px;z-index:1150;box-shadow:0 4px 14px rgba(0,0,0,.18);padding:9px 14px;}',
      /* overlay — z below the fixed top bar (100) / sidebar (200) so it never bleeds over the chrome */
      '.dm-ov{position:fixed;inset:0;z-index:99;pointer-events:none;}',
      '.dm-ov > div{position:fixed;pointer-events:none;}',
      '.dm-margin{background:rgba(246,178,107,.45);}',
      '.dm-margin--neg{background:rgba(246,178,107,.28);outline:1px dashed rgba(214,120,20,.6);outline-offset:-1px;}',
      '.dm-border{background:rgba(255,213,143,.55);}',
      '.dm-padding{background:rgba(147,196,125,.45);}',
      '.dm-gap{background:rgba(139,92,246,.30);}',
      '.dm-content{outline:1px solid rgba(1,104,221,.5);background:rgba(1,104,221,.08);}',
      '.dm-outline{outline:1px solid #0168dd;}',
      '.dm-size{background:#0168dd;color:#fff;font:600 10px/1.6 Roboto,system-ui,sans-serif;padding:1px 6px;border-radius:4px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.25);}',
      /* panel */
      '.dm-panel{position:fixed;top:var(--dm-top,52px);right:0;bottom:0;width:var(--dm-w,320px);background:#fff;border-left:1px solid #e5e7eb;box-shadow:-6px 0 24px rgba(0,0,0,.09);z-index:1160;display:flex;flex-direction:column;font-family:Roboto,system-ui,sans-serif;overflow:hidden;transform:translateX(105%);transition:transform 220ms cubic-bezier(.4,0,.2,1);}',
      '.dm-panel.is-open{transform:translateX(0);}',
      '.dm-hd{display:flex;align-items:center;gap:10px;padding:14px 14px 12px;border-bottom:1px solid #f3f4f6;flex-shrink:0;}',
      '.dm-hd-icon{width:30px;height:30px;border-radius:8px;background:#eff6ff;display:flex;align-items:center;justify-content:center;flex-shrink:0;}',
      '.dm-hd-icon .material-symbols-rounded{font-size:17px;color:#0168DD;}',
      '.dm-hd-meta{flex:1;min-width:0;}',
      '.dm-hd-title{font-size:13px;font-weight:600;color:#111827;line-height:1.3;}',
      '.dm-hd-sub{font-size:11px;color:#6b7280;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.dm-close{border:none;background:transparent;cursor:pointer;padding:4px;color:#9ca3af;border-radius:5px;display:flex;align-items:center;}',
      '.dm-close:hover{background:#f3f4f6;color:#374151;}',
      '.dm-close .material-symbols-rounded{font-size:18px;}',
      '.dm-body{padding:14px;overflow-y:auto;flex:1;}',
      '.dm-empty{color:#9ca3af;font-size:12px;line-height:1.5;text-align:center;padding:40px 16px;display:flex;flex-direction:column;align-items:center;gap:10px;}',
      '.dm-empty .material-symbols-rounded{font-size:26px;color:#d1d5db;}',
      '.dm-comp{display:flex;align-items:center;gap:9px;text-decoration:none;background:#eff6ff;border:1px solid #d4e6fd;border-radius:8px;padding:8px 10px;margin-bottom:12px;transition:background 120ms,border-color 120ms;}',
      '.dm-comp:hover{background:#dbeafe;border-color:#0168dd;}',
      '.dm-comp-ic{width:26px;height:26px;border-radius:6px;background:#0168dd;display:flex;align-items:center;justify-content:center;flex-shrink:0;}',
      '.dm-comp-ic .material-symbols-rounded{font-size:16px !important;color:#fff;}',
      '.dm-comp-meta{display:flex;flex-direction:column;line-height:1.25;min-width:0;}',
      '.dm-comp-lbl{font-size:9px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#0168dd;opacity:.75;}',
      '.dm-comp-name{font-size:13px;font-weight:600;color:#0b4fa8;display:flex;align-items:center;gap:6px;flex-wrap:wrap;}',
      '.dm-comp-var{font-size:10px;font-weight:600;color:#0168dd;background:#fff;border:1px solid #cfe3fb;border-radius:99px;padding:0 7px;line-height:16px;text-transform:capitalize;}',
      '.dm-comp-ext{font-size:16px !important;color:#0168dd;margin-left:auto;flex-shrink:0;}',
      /* custom-component variant of the banner (amber, no docs unless a link is provided) */
      '.dm-comp--custom{background:#fffbeb;border-color:#fde68a;}',
      '.dm-comp--custom .dm-comp-ic{background:#d97706;}',
      '.dm-comp--custom .dm-comp-lbl{color:#b45309;}',
      '.dm-comp--custom .dm-comp-name{color:#92400e;}',
      '.dm-comp--custom .dm-comp-var{color:#b45309;border-color:#fcd77f;background:#fffdf6;}',
      '.dm-comp--custom .dm-comp-ext{color:#d97706;}',
      '.dm-ident{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;}',
      '.dm-tag{font:600 12px/1 "Roboto Mono",ui-monospace,monospace;color:#0168dd;background:#eff6ff;padding:3px 7px;border-radius:5px;}',
      '.dm-dims{font-size:11px;font-weight:600;color:#6b7280;}',
      '.dm-cls{font:11px/1.5 ui-monospace,monospace;color:#9ca3af;word-break:break-all;margin-bottom:14px;}',
      '.dm-sec{margin-bottom:16px;}',
      '.dm-sec-hd{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;margin-bottom:8px;}',
      '.dm-row{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:4px 0;border-bottom:1px solid #f6f7f9;font-size:12px;}',
      '.dm-k{color:#6b7280;flex-shrink:0;}',
      '.dm-v{color:#111827;text-align:right;display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end;font-variant-numeric:tabular-nums;}',
      '.dm-v--pick{cursor:pointer;border-radius:4px;padding:1px 3px;margin:-1px -3px;}',
      '.dm-v--pick:hover{background:#eff6ff;}',
      '.dm-pick-ic{font-size:13px !important;color:#9ca3af;}',
      '.dm-v--pick:hover .dm-pick-ic{color:#0168dd;}',
      '.dm-swatch{width:12px;height:12px;border-radius:3px;border:1px solid rgba(0,0,0,.12);flex-shrink:0;}',
      '.dm-tok{font-size:10px;font-weight:600;color:#0168dd;background:#eff6ff;padding:1px 6px;border-radius:99px;white-space:nowrap;}',
      '.dm-tok--none{color:#9ca3af;background:#f3f4f6;}',
      '.dm-tok--near{color:#6b7280;background:#f3f4f6;font-weight:500;}',
      '.dm-selc{cursor:pointer;}',
      '.dm-selc .dm-v{width:100%;cursor:pointer;flex-wrap:wrap;}',
      '.dm-selc-n{margin-left:auto;color:#9ca3af;font-size:11px;font-variant-numeric:tabular-nums;}',
      /* color picker popover */
      '.dm-pop{position:fixed;z-index:1170;width:236px;max-height:340px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.18);display:flex;flex-direction:column;font-family:Roboto,system-ui,sans-serif;overflow:hidden;}',
      '.dm-pop-hd{display:flex;align-items:center;justify-content:space-between;padding:9px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;font-weight:600;color:#111827;flex-shrink:0;}',
      '.dm-pop-close{border:none;background:transparent;cursor:pointer;color:#9ca3af;padding:2px;display:flex;border-radius:4px;}',
      '.dm-pop-close:hover{background:#f3f4f6;color:#374151;}',
      '.dm-pop-close .material-symbols-rounded{font-size:16px !important;}',
      '.dm-pop-body{overflow-y:auto;padding:8px 12px;flex:1;}',
      '.dm-pop-grp{margin-bottom:8px;}',
      '.dm-pop-grp-lbl{font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9ca3af;margin-bottom:3px;}',
      '.dm-pop-grid{display:grid;grid-template-columns:repeat(10,1fr);gap:3px;}',
      '.dm-sw{width:100%;aspect-ratio:1;border:1px solid rgba(0,0,0,.1);border-radius:4px;cursor:pointer;padding:0;transition:transform 90ms;}',
      '.dm-sw:hover{transform:scale(1.25);box-shadow:0 2px 6px rgba(0,0,0,.25);position:relative;z-index:1;}',
      '.dm-pop-ft{padding:7px 12px;border-top:1px solid #f3f4f6;font-size:10px;color:#9ca3af;flex-shrink:0;}',
      /* in-place hover measurement popover */
      '.dm-tip{position:fixed;z-index:1170;display:none;background:#111827;color:#fff;font:11px/1.5 Roboto,system-ui,sans-serif;padding:6px 9px;border-radius:6px;box-shadow:0 4px 14px rgba(0,0,0,.28);pointer-events:none;}',
      '.dm-tip-hd{font-weight:600;white-space:nowrap;}',
      '.dm-tip-hd b{color:#9fd0ff;font-weight:700;}',
      '.dm-tip-body{display:flex;flex-direction:column;gap:2px;margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,.15);}',
      '.dm-tip-row{display:flex;align-items:center;gap:6px;color:#d1d5db;white-space:nowrap;}',
      '.dm-tip-row b{color:#fff;font-weight:600;margin-left:auto;padding-left:14px;}',
      '.dm-tip-dot{width:8px;height:8px;border-radius:2px;flex-shrink:0;}',
      '.dm-dot-pad{background:#93c47d;}',
      '.dm-dot-mar{background:#f6b26b;}',
      '.dm-dot-gap{background:#8b5cf6;}',
      /* changes button (panel header) */
      '.dm-changes-btn{display:inline-flex;align-items:center;gap:4px;border:none;background:#eff6ff;color:#0168dd;cursor:pointer;border-radius:99px;padding:3px 9px 3px 7px;font-family:Roboto,system-ui,sans-serif;font-size:11px;font-weight:600;flex-shrink:0;}',
      '.dm-changes-btn:hover{background:#dbeafe;}',
      '.dm-changes-btn .material-symbols-rounded{font-size:14px !important;}',
      '.dm-changes-n{background:#0168dd;color:#fff;border-radius:99px;min-width:15px;height:15px;display:inline-flex;align-items:center;justify-content:center;padding:0 4px;font-size:10px;}',
      /* changes dialog */
      '.dm-dlg-backdrop{position:fixed;inset:0;background:rgba(17,24,39,.4);z-index:1200;opacity:0;pointer-events:none;transition:opacity 180ms ease;}',
      '.dm-dlg-backdrop.is-open{opacity:1;pointer-events:auto;}',
      '.dm-dlg{position:fixed;top:50%;left:50%;transform:translate(-50%,-48%) scale(.98);width:520px;max-width:calc(100vw - 48px);max-height:80vh;background:#fff;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.22);z-index:1201;display:flex;flex-direction:column;font-family:Roboto,system-ui,sans-serif;overflow:hidden;opacity:0;pointer-events:none;transition:opacity 180ms ease,transform 180ms ease;}',
      '.dm-dlg.is-open{opacity:1;transform:translate(-50%,-50%) scale(1);pointer-events:auto;}',
      '.dm-dlg-hd{display:flex;align-items:center;gap:8px;padding:14px 18px;border-bottom:1px solid #f3f4f6;font-size:14px;font-weight:600;color:#111827;flex-shrink:0;}',
      '.dm-dlg-hd .material-symbols-rounded{font-size:18px;color:#0168dd;}',
      '.dm-dlg-count{background:#eff6ff;color:#0168dd;border-radius:99px;padding:1px 8px;font-size:11px;font-weight:700;}',
      '.dm-dlg-close{margin-left:auto;border:none;background:transparent;cursor:pointer;color:#9ca3af;padding:4px;border-radius:5px;display:flex;}',
      '.dm-dlg-close:hover{background:#f3f4f6;color:#374151;}',
      '.dm-dlg-close .material-symbols-rounded{font-size:18px !important;}',
      '.dm-dlg-body{overflow-y:auto;padding:8px 18px;flex:1;}',
      '.dm-dlg-empty{color:#9ca3af;font-size:13px;text-align:center;padding:32px 16px;}',
      '.dm-chg{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid #f3f4f6;}',
      '.dm-chg-chk{margin-top:2px;flex-shrink:0;accent-color:#0168dd;width:15px;height:15px;cursor:pointer;}',
      '.dm-chg-meta{flex:1;min-width:0;}',
      '.dm-chg-el{font-size:13px;color:#111827;}',
      '.dm-chg-tag{font:600 12px/1 ui-monospace,monospace;color:#0168dd;}',
      '.dm-chg-src{font:11px/1.4 ui-monospace,monospace;color:#9ca3af;margin:1px 0 3px;}',
      '.dm-chg-diff{font-size:12px;color:#374151;display:flex;align-items:center;gap:6px;flex-wrap:wrap;}',
      '.dm-chg-old{color:#9ca3af;text-decoration:line-through;}',
      '.dm-chg-del{border:none;background:transparent;cursor:pointer;color:#c8cad4;padding:3px;border-radius:5px;flex-shrink:0;display:flex;}',
      '.dm-chg-del:hover{background:#fef2f2;color:#e02424;}',
      '.dm-chg-del .material-symbols-rounded{font-size:16px !important;}',
      '.dm-dlg-ft{display:flex;align-items:center;gap:8px;padding:12px 18px;border-top:1px solid #f3f4f6;flex-shrink:0;}',
      '.dm-dlg-hint{font-size:11px;color:#9ca3af;flex:1;}',
      '.dm-dlg-btn{display:inline-flex;align-items:center;gap:5px;border:1px solid #e5e7eb;background:#fff;color:#374151;cursor:pointer;border-radius:6px;padding:6px 12px;font-family:inherit;font-size:12px;font-weight:500;}',
      '.dm-dlg-btn:hover{background:#f9fafb;}',
      '.dm-dlg-btn .material-symbols-rounded{font-size:15px !important;}',
      '.dm-dlg-btn--primary{background:#0168dd;color:#fff;border-color:#0168dd;}',
      '.dm-dlg-btn--primary:hover{background:#0057bb;}',
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ── public API ──────────────────────────────────────────────────────── */
  var API = {
    init: function (config) {
      S.cfg = config || {};
      injectCSS();
      buildToggle();
      S.started = true;
      return API;
    },
    enable: function () {
      if (S.on) return;
      S.on = true;
      if (S.toggle) S.toggle.classList.add('is-active');
      if (!S.panel) buildPanel();
      S.openRaf = requestAnimationFrame(function () { S.openRaf = 0; if (S.on && S.panel) S.panel.classList.add('is-open'); });
      pushContent(true);
      addL(document, 'click', handleClick, true);
      ['pointerdown', 'mousedown', 'mouseup', 'dblclick'].forEach(function (t) { addL(document, t, suppress, true); });
      addL(document, 'mousemove', handleMove, true);
      addL(document, 'keydown', handleKey, true);
      addL(window, 'scroll', handleScroll, true);
      addL(window, 'resize', handleScroll, false);
    },
    disable: function () {
      if (!S.on) return;
      S.on = false;
      if (S.moveRaf) { cancelAnimationFrame(S.moveRaf); S.moveRaf = 0; }
      if (S.openRaf) { cancelAnimationFrame(S.openRaf); S.openRaf = 0; }
      if (S.toggle) S.toggle.classList.remove('is-active');
      if (S.panel) S.panel.classList.remove('is-open');
      S.selected = null;
      closePicker();
      clearOverlay();
      hideTip();
      pushContent(false);
      removeAllL();
    },
    toggle: function () { if (S.on) API.disable(); else API.enable(); },
    isOn: function () { return S.on; },
    destroy: function () {
      API.disable();
      closeDialog();
      [S.panel, S.ov, S.toggle, S.pop, S.tip, S.dlg, S.dlgBd].forEach(function (el) { if (el && el.remove) el.remove(); });
      var css = document.getElementById('dm-css'); if (css) css.remove();
      S.panel = S.ov = S.toggle = S.pop = S.tip = S.dlg = S.dlgBd = S.selected = null;
      S.changes = [];
      try { delete window.__DEVMODE_CHANGES__; } catch (e) {}
      S.started = false;
    },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  window.DevMode = API;
}());
