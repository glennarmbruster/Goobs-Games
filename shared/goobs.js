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

  return {
    ROOT: ROOT, store: store, settings: settings, THEMES: THEMES,
    theme: function () { return themeNow; }, setTheme: setTheme, onTheme: function (cb) { themeListeners.push(cb); }, themePicker: themePicker,
    adsOn: function () { return settings.ads; }, setAds: function (on) { settings.ads = !!on; saveSettings(); },
    markPlayed: markPlayed, recent: function () { return gs.get('recent', []) || []; }, favs: favs, toggleFav: toggleFav,
    initUpdates: initUpdates, home: home
  };
})();
