/* Goobs-Games shared runtime: storage, global settings (theme, ads), recent/favorites,
   service worker + "Update available" bar. Load this in <head> so the theme applies before paint. */
var Goobs = (function () {
  'use strict';

  var ROOT = (function () {
    try { return new URL('../', document.currentScript.src).href; } catch (e) { return './'; }
  })();

  // ---------- storage, namespaced per game, never throws ----------
  function store(ns) {
    var pre = ns + '.';
    return {
      get: function (k, d) {
        try { var v = localStorage.getItem(pre + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
      },
      set: function (k, v) { try { localStorage.setItem(pre + k, JSON.stringify(v)); } catch (e) { /* full or blocked */ } },
      del: function (k) { try { localStorage.removeItem(pre + k); } catch (e) { /* ignore */ } }
    };
  }
  var gs = store('goobs');

  // ---------- global settings ----------
  var THEMES = [
    { id: 'auto', label: 'Auto', sw: ['#f4f5f9', '#0f1116'] },
    { id: 'light', label: 'Light', sw: ['#ffffff', '#5a54f0'] },
    { id: 'dark', label: 'Dark', sw: ['#0f1116', '#7c77ff'] },
    { id: 'blue', label: 'Blue', sw: ['#0b1628', '#4f9dff'] }
  ];
  var STATUSBAR = { light: '#5a54f0', dark: '#0f1116', blue: '#0b1628' };
  var settings = { v: 1, theme: 'light', ads: true };
  (function () {
    var s = gs.get('settings', {}) || {};
    for (var k in settings) if (typeof s[k] === typeof settings[k]) settings[k] = s[k];
    if (!THEMES.some(function (t) { return t.id === settings.theme; })) settings.theme = 'light';
  })();
  function saveSettings() { gs.set('settings', settings); }

  // ---------- theme (one for the whole arcade) ----------
  var darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var themeNow = 'light', themeListeners = [];
  function applyTheme() {
    themeNow = settings.theme === 'auto' ? (darkQuery && darkQuery.matches ? 'dark' : 'light') : settings.theme;
    document.documentElement.setAttribute('data-theme', themeNow);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', STATUSBAR[themeNow]);
    themeListeners.forEach(function (cb) { try { cb(themeNow); } catch (e) { /* ignore */ } });
  }
  if (darkQuery) {
    var onScheme = function () { if (settings.theme === 'auto') applyTheme(); };
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', onScheme); else if (darkQuery.addListener) darkQuery.addListener(onScheme);
  }
  function setTheme(id) { settings.theme = id; saveSettings(); applyTheme(); }
  // Render the 4-button theme picker into el and keep it in sync
  function themePicker(el) {
    function draw() {
      el.innerHTML = THEMES.map(function (t) {
        return '<button data-theme="' + t.id + '" class="' + (settings.theme === t.id ? 'on' : '') + '"><span class="sw"><i style="background:' +
          t.sw[0] + '"></i><i style="background:' + t.sw[1] + '"></i></span>' + t.label + '</button>';
      }).join('');
    }
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b) setTheme(b.dataset.theme);
    });
    themeListeners.push(draw);
    draw();
  }
  applyTheme();

  // ---------- recently played / favorites ----------
  function markPlayed(id) {
    var r = gs.get('recent', []) || [];
    r = [id].concat(r.filter(function (x) { return x !== id; })).slice(0, 6);
    gs.set('recent', r);
  }
  function favs() { return gs.get('favs', []) || []; }
  function toggleFav(id) {
    var f = favs(), i = f.indexOf(id);
    if (i >= 0) f.splice(i, 1); else f.push(id);
    gs.set('favs', f);
    return i < 0;
  }

  // ---------- service worker: offline + "Update available" ----------
  function initUpdates(opts) {
    opts = opts || {};
    if (!('serviceWorker' in navigator) || !/^https?:/.test(location.protocol)) return;
    var bar = document.createElement('div');
    bar.className = 'updatebar';
    bar.setAttribute('role', 'button');
    bar.textContent = 'Update available \u2014 tap to reload';
    document.body.appendChild(bar);
    var wantReload = false, waitingWorker = null;
    function offer(w) { waitingWorker = w; bar.classList.add('show'); }
    bar.addEventListener('click', function () {
      if (!waitingWorker) return;
      if (opts.beforeReload) { try { opts.beforeReload(); } catch (e) { /* ignore */ } }
      wantReload = true;
      waitingWorker.postMessage('SKIP_WAITING');
      bar.textContent = 'Updating\u2026';
    });
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (wantReload) { wantReload = false; location.reload(); }
    });
    navigator.serviceWorker.addEventListener('message', function (e) {
      if (e.data && e.data.versions && opts.onVersions) opts.onVersions(e.data.versions);
    });
    navigator.serviceWorker.register(ROOT + 'sw.js', { scope: ROOT }).then(function (reg) {
      if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
      reg.addEventListener('updatefound', function () {
        var w = reg.installing;
        if (!w) return;
        w.addEventListener('statechange', function () {
          if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w);
        });
      });
      document.addEventListener('visibilitychange', function () { if (!document.hidden) { try { reg.update(); } catch (e) { /* offline */ } } });
      var sw = navigator.serviceWorker.controller;
      if (sw) sw.postMessage('VERSION');
      else navigator.serviceWorker.ready.then(function (r) { if (r.active) r.active.postMessage('VERSION'); });
    }).catch(function () { /* not fatal: games still work online */ });
  }

  function home() { location.href = ROOT; }

  // ---------- keep taps lined up with what's on screen (iPhone Home Screen apps) ----------
  // On iPhone, a Home Screen web app can be left shifted after the keyboard closes, or after the page scrolls a
  // little: what you see and where a tap lands drift apart (you have to tap below a button). Game pages never
  // scroll, and every page snaps back to the top whenever the keyboard closes or the visible area changes.
  var isGame = /\/games\//.test(location.pathname);
  if (isGame) document.documentElement.classList.add('gg-game');
  function snap() {
    var vv = window.visualViewport;
    if (window.scrollX || window.scrollY || (vv && (vv.offsetTop > 0.5 || vv.offsetLeft > 0.5))) window.scrollTo(0, 0);
    if (isGame) {
      if (document.documentElement.scrollTop) document.documentElement.scrollTop = 0;
      if (document.body && document.body.scrollTop) document.body.scrollTop = 0;
    }
  }
  function snapSoon() { snap(); setTimeout(snap, 120); setTimeout(snap, 450); }
  document.addEventListener('focusout', function (e) { var t = e.target; if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) snapSoon(); }, true);
  document.addEventListener('change', function (e) { if (e.target && e.target.tagName === 'INPUT') snapSoon(); }, true); // e.g. back from the photo picker
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', snapSoon);
    if (isGame) window.visualViewport.addEventListener('scroll', snap);
  }
  if (isGame) window.addEventListener('scroll', snap, { passive: true });
  window.addEventListener('pageshow', snapSoon);
  window.addEventListener('orientationchange', snapSoon);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) snapSoon(); });

  // ---------- full screen (shell 2.44.0) ----------
  // Goobs.fullscreen({ menu: ['btnHelp', 'btnStats', ...], overlay: false, title: 'Name', info: function () { return 'html'; },
  //                    onOpen: fn, onClose: fn })
  // Puts the page in full-screen mode (html.gg-fs, see goobs.css), adds a round Menu button at the end of the top row and a
  // Menu sheet. The buttons named in `menu` are MOVED into the sheet (they keep their own click handlers; the sheet closes
  // first). The sheet also has "All games" and a big Play button. A toolbar left with no buttons is hidden.
  var MENU_ICON = '<svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></g></svg>';
  var ALL_ICON = '<svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 11 12 4l8.5 7"/><path d="M6 9.5V20h4.5v-5.5h3V20H18V9.5"/></g></svg>'; // a house: back to the arcade
  function fullscreen(opts) {
    opts = opts || {};
    var html = document.documentElement;
    html.classList.add('gg-fs'); if (opts.overlay) html.classList.add('gg-fs-over');
    var top = document.querySelector('.top'), h1 = top && top.querySelector('h1'), bsvg = top && top.querySelector('.brand svg');
    var ov = document.createElement('div'); ov.className = 'overlay ggmenu'; ov.id = 'ggMenu';
    ov.innerHTML = '<div class="sheet" role="dialog" aria-label="Menu"><div class="ggmenu-top">' + (opts.icon || (bsvg ? bsvg.outerHTML : '')) +
      '<h2></h2></div><div class="ggmenu-info"></div><div class="ggmenu-list"></div><button class="btn red ggmenu-play">Play</button></div>';
    ov.querySelector('.ggmenu-top svg') && ov.querySelector('.ggmenu-top svg').removeAttribute('style');
    ov.querySelector('h2').textContent = opts.title || (h1 ? h1.textContent : document.title);
    var list = ov.querySelector('.ggmenu-list'), toolbars = [];
    (opts.menu || []).forEach(function (id) {
      var b = typeof id === 'string' ? document.getElementById(id) : id;
      if (!b) return;
      var tb = b.closest('.toolbar'); if (tb && toolbars.indexOf(tb) < 0) toolbars.push(tb);
      if (!b.querySelector('span') && b.getAttribute('aria-label')) { var sp = document.createElement('span'); sp.textContent = b.getAttribute('aria-label'); b.appendChild(sp); }
      list.appendChild(b);
    });
    if (opts.allGames !== false) {
      var all = document.createElement('button'); all.id = 'ggAllGames'; all.innerHTML = ALL_ICON + '<span>All games</span>';
      all.addEventListener('click', function () { home(); }); list.appendChild(all);
    }
    toolbars.forEach(function (tb) { if (!tb.querySelector('button')) tb.style.display = 'none'; });
    document.body.appendChild(ov);
    var btn = document.createElement('button'); btn.className = 'iconbtn ggmenu-btn'; btn.id = 'ggMenuBtn'; btn.setAttribute('aria-label', 'Menu'); btn.innerHTML = MENU_ICON;
    var tbtns = top && top.querySelector('.topbtns');
    if (opts.button) opts.button.appendChild(btn); else if (tbtns) tbtns.appendChild(btn); else if (top) top.appendChild(btn); else document.body.appendChild(btn);
    function info() { var el = ov.querySelector('.ggmenu-info'); try { el.innerHTML = opts.info ? (opts.info() || '') : ''; } catch (e) { el.innerHTML = ''; } }
    function open() { info(); ov.classList.add('show'); if (opts.onOpen) { try { opts.onOpen(); } catch (e) { /* ignore */ } } }
    function close() { if (!ov.classList.contains('show')) return; ov.classList.remove('show'); if (opts.onClose) { try { opts.onClose(); } catch (e) { /* ignore */ } } }
    btn.addEventListener('click', open);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov.querySelector('.ggmenu-play').addEventListener('click', close);
    list.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b && !b.disabled) close(); }, true); // close first; the button's own handler runs after
    return { open: open, close: close, isOpen: function () { return ov.classList.contains('show'); }, el: ov, button: btn, list: list, refresh: info };
  }

  return {
    ROOT: ROOT, store: store, settings: settings, THEMES: THEMES,
    theme: function () { return themeNow; }, setTheme: setTheme, onTheme: function (cb) { themeListeners.push(cb); }, themePicker: themePicker,
    adsOn: function () { return settings.ads; }, setAds: function (on) { settings.ads = !!on; saveSettings(); },
    markPlayed: markPlayed, recent: function () { return gs.get('recent', []) || []; }, favs: favs, toggleFav: toggleFav,
    initUpdates: initUpdates, home: home, snap: snapSoon, fullscreen: fullscreen
  };
})();
