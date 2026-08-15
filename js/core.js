/* Lab Virtual — Perubahan Materi
 * Inti aplikasi: helper DOM, penyimpanan, bus peristiwa, router, dan registrasi modul.
 * Semua berkas memakai skrip klasik (bukan ES module) supaya aplikasi tetap jalan
 * ketika index.html dibuka langsung dari berkas (offline, tanpa server).
 */
(function (global) {
  'use strict';

  var Lab = global.Lab = {};

  /* ---------- DOM ---------- */

  var SVG_NS = 'http://www.w3.org/2000/svg';

  /** el('div.kelas#id', {attr:…}, [anak…]) — anak boleh string, Node, atau array bersarang. */
  function el(spec, attrs, children) {
    var m = /^([a-zA-Z0-9-]+)?((?:[.#][\w-]+)*)$/.exec(spec);
    if (!m) throw new Error('spec elemen tidak valid: ' + spec);
    var node = document.createElement(m[1] || 'div');
    (m[2].match(/[.#][\w-]+/g) || []).forEach(function (t) {
      if (t[0] === '.') node.classList.add(t.slice(1));
      else node.id = t.slice(1);
    });
    if (attrs && (typeof attrs !== 'object' || attrs.nodeType || Array.isArray(attrs))) {
      children = attrs; attrs = null;
    }
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
        else if (k === 'dataset') Object.assign(node.dataset, v);
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v === true ? '' : v);
      });
    }
    append(node, children);
    return node;
  }

  function append(node, children) {
    if (children == null || children === false) return node;
    if (Array.isArray(children)) { children.forEach(function (c) { append(node, c); }); return node; }
    node.appendChild(children.nodeType ? children : document.createTextNode(String(children)));
    return node;
  }

  function svg(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }

  Lab.el = el; Lab.svg = svg; Lab.$ = $; Lab.$$ = $$; Lab.clear = clear;

  /* ---------- Matematika & format ---------- */

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  /** Posisi v di antara a…b, dipotong ke 0…1. */
  function norm(v, a, b) { return b === a ? 0 : clamp((v - a) / (b - a), 0, 1); }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function rndInt(a, b) { return Math.floor(rnd(a, b + 1)); }

  /** Angka gaya Indonesia: koma desimal, titik ribuan. */
  function num(v, dec) {
    if (v == null || !isFinite(v)) return '–';
    return Number(v).toLocaleString('id-ID', {
      minimumFractionDigits: dec || 0,
      maximumFractionDigits: dec == null ? 0 : dec
    });
  }

  function hexToRgb(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(c) {
    return '#' + c.map(function (v) {
      return clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
    }).join('');
  }
  /** Interpolasi dua warna hex; t = 0 → a, t = 1 → b. */
  function mix(a, b, t) {
    var ca = hexToRgb(a), cb = hexToRgb(b);
    t = clamp(t, 0, 1);
    return rgbToHex([lerp(ca[0], cb[0], t), lerp(ca[1], cb[1], t), lerp(ca[2], cb[2], t)]);
  }
  function rgba(hex, alpha) {
    var c = hexToRgb(hex);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + alpha + ')';
  }

  Lab.clamp = clamp; Lab.lerp = lerp; Lab.norm = norm; Lab.smooth = smooth;
  Lab.rnd = rnd; Lab.rndInt = rndInt; Lab.num = num;
  Lab.mix = mix; Lab.rgba = rgba; Lab.hexToRgb = hexToRgb; Lab.rgbToHex = rgbToHex;

  /* ---------- Penyimpanan ---------- */

  /* localStorage bisa ditolak (mode privat, atau file:// pada sebagian browser),
   * jadi selalu ada cadangan di memori supaya aplikasi tidak ikut mati. */
  var PREFIX = 'plm.';
  var memory = {};
  var hasLS = (function () {
    try {
      var k = PREFIX + '__uji';
      global.localStorage.setItem(k, '1');
      global.localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  })();

  Lab.store = {
    tersimpan: hasLS,
    get: function (key, fallback) {
      try {
        var raw = hasLS ? global.localStorage.getItem(PREFIX + key) : memory[key];
        return raw == null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      var raw = JSON.stringify(value);
      try {
        if (hasLS) global.localStorage.setItem(PREFIX + key, raw);
        else memory[key] = raw;
      } catch (e) { memory[key] = raw; }
      return value;
    },
    remove: function (key) {
      try {
        if (hasLS) global.localStorage.removeItem(PREFIX + key);
      } catch (e) { /* diabaikan */ }
      delete memory[key];
    }
  };

  /* ---------- Bus peristiwa ---------- */

  var handlers = {};
  Lab.on = function (name, fn) {
    (handlers[name] || (handlers[name] = [])).push(fn);
    return function () { Lab.off(name, fn); };
  };
  Lab.off = function (name, fn) {
    var list = handlers[name];
    if (!list) return;
    var i = list.indexOf(fn);
    if (i >= 0) list.splice(i, 1);
  };
  Lab.emit = function (name, payload) {
    (handlers[name] || []).slice().forEach(function (fn) {
      try { fn(payload); } catch (e) { console.error('[Lab] handler "' + name + '" gagal:', e); }
    });
  };

  /* ---------- Modul & router ---------- */

  var modules = [];
  var byId = {};

  /** module: { id, judul, ringkas, kategori, ikon, warna, mount(el), unmount() } */
  Lab.registerModule = function (mod) {
    modules.push(mod);
    byId[mod.id] = mod;
    return mod;
  };
  Lab.modules = function () { return modules.slice(); };
  Lab.modul = function (id) { return byId[id]; };

  var current = null;

  function rutePaths() {
    var hash = location.hash.replace(/^#\/?/, '');
    return hash.split('/').filter(Boolean);
  }

  function render() {
    var view = $('#view');
    if (!view) return;

    var parts = rutePaths();
    var id = parts[0] || 'beranda';
    var mod = byId[id];

    if (current && current.unmount) {
      try { current.unmount(); } catch (e) { console.error('[Lab] unmount gagal:', e); }
    }
    current = null;
    clear(view);

    if (!mod) {
      view.appendChild(el('section.panel.panel--kosong', [
        el('h2', 'Halaman tidak ditemukan'),
        el('p', 'Modul "' + id + '" tidak ada. Kembali ke daftar modul untuk memilih laboratorium.'),
        el('a.tombol.tombol--utama', { href: '#/beranda' }, 'Ke daftar modul')
      ]));
      document.title = 'Tidak ditemukan — Lab Virtual Perubahan Materi';
      syncNav(null);
      return;
    }

    document.title = mod.judul + ' — Lab Virtual Perubahan Materi';
    document.body.dataset.modul = mod.id;
    syncNav(mod.id);
    current = mod;
    mod.mount(view, parts.slice(1));
    view.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
    Lab.emit('rute', mod.id);
  }

  function syncNav(id) {
    $$('[data-nav]').forEach(function (a) {
      var aktif = a.dataset.nav === id;
      a.classList.toggle('is-aktif', aktif);
      if (aktif) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  Lab.pergiKe = function (id) {
    if (location.hash === '#/' + id) render();
    else location.hash = '#/' + id;
  };

  Lab.mulai = function () {
    window.addEventListener('hashchange', render);
    if (!location.hash) location.replace('#/beranda');
    render();
  };

  /* ---------- Notifikasi ringkas ---------- */

  var toastHost = null;
  Lab.toast = function (pesan, jenis) {
    if (!toastHost) {
      toastHost = el('.toast-host', { role: 'status', 'aria-live': 'polite' });
      document.body.appendChild(toastHost);
    }
    var t = el('.toast', { 'data-jenis': jenis || 'info' }, pesan);
    toastHost.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('is-tampil'); });
    setTimeout(function () {
      t.classList.remove('is-tampil');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
    }, 2800);
  };

  /* ---------- Loop animasi ---------- */

  /** Loop rAF dengan dt terpotong; otomatis berhenti saat tab disembunyikan. */
  Lab.loop = function (langkah) {
    var id = null, last = 0, jalan = false;

    function frame(t) {
      if (!jalan) return;
      var dt = last ? Math.min((t - last) / 1000, 1 / 20) : 1 / 60;
      last = t;
      try { langkah(dt, t / 1000); }
      catch (e) { console.error('[Lab] loop gagal:', e); api.stop(); return; }
      id = requestAnimationFrame(frame);
    }

    function onVisibility() {
      if (document.hidden) last = 0;
    }

    var api = {
      start: function () {
        if (jalan) return api;
        jalan = true; last = 0;
        document.addEventListener('visibilitychange', onVisibility);
        id = requestAnimationFrame(frame);
        return api;
      },
      stop: function () {
        jalan = false;
        if (id) cancelAnimationFrame(id);
        id = null;
        document.removeEventListener('visibilitychange', onVisibility);
        return api;
      },
      get jalan() { return jalan; }
    };
    return api;
  };

  /* ---------- Kanvas peka DPR ---------- */

  /** Menyiapkan kanvas mengikuti ukuran CSS-nya dan devicePixelRatio.
   *  Mengembalikan { ctx, w, h } dalam satuan piksel CSS. */
  Lab.siapkanKanvas = function (canvas) {
    var rect = canvas.getBoundingClientRect();
    var w = Math.max(1, Math.round(rect.width));
    var h = Math.max(1, Math.round(rect.height));
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  };

  /** Memanggil fn setiap kali elemen berubah ukuran (dengan cadangan window.resize). */
  Lab.padaUkuranBerubah = function (node, fn) {
    if (global.ResizeObserver) {
      var ro = new ResizeObserver(fn);
      ro.observe(node);
      return function () { ro.disconnect(); };
    }
    window.addEventListener('resize', fn);
    return function () { window.removeEventListener('resize', fn); };
  };

  /* ---------- Aset ---------- */

  var gambarCache = {};
  /** Memuat assets/<nama>.png sekali saja; aman dipanggil berkali-kali. */
  Lab.gambar = function (nama) {
    if (gambarCache[nama]) return gambarCache[nama];
    var img = new Image();
    img.siap = false;
    img.addEventListener('load', function () { img.siap = true; });
    img.addEventListener('error', function () {
      console.warn('[Lab] gambar tidak dapat dimuat: assets/' + nama + '.png');
    });
    img.src = 'assets/' + nama + '.png';
    gambarCache[nama] = img;
    return img;
  };

  /** Memuat beberapa gambar sekaligus, lalu memanggil selesai(). */
  Lab.muatGambar = function (daftar, selesai) {
    var sisa = daftar.length;
    var hasil = {};
    if (!sisa) { selesai(hasil); return hasil; }
    daftar.forEach(function (nama) {
      var img = Lab.gambar(nama);
      hasil[nama] = img;
      function tandai() { if (--sisa === 0) selesai(hasil); }
      if (img.complete) tandai();
      else {
        img.addEventListener('load', tandai, { once: true });
        img.addEventListener('error', tandai, { once: true });
      }
    });
    return hasil;
  };

})(window);
