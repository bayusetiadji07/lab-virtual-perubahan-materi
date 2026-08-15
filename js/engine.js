/* Lab Virtual — Perubahan Materi
 * Mesin simulasi ringan: sistem partikel tiga wujud, emitor (gelembung/uap/asap),
 * dan penggambar bola berkilau dengan sprite yang di-cache.
 *
 * Prinsip fisikanya sengaja disederhanakan tetapi tetap kualitatif benar:
 * makin tinggi suhu, makin besar energi gerak partikel.
 */
(function (Lab) {
  'use strict';

  var clamp = Lab.clamp, lerp = Lab.lerp, rnd = Lab.rnd;

  /* ---------- Sprite bola ---------- */

  var spritCache = {};

  /** Bola mengkilap ala model partikel: gradien radial + sorot cahaya.
   *  Digambar sekali ke kanvas luar layar lalu dipakai ulang tiap frame. */
  function sprit(warna, radius) {
    var r = Math.max(2, Math.round(radius));
    var kunci = warna + '|' + r;
    if (spritCache[kunci]) return spritCache[kunci];

    var pad = 2;
    var d = (r + pad) * 2;
    var c = document.createElement('canvas');
    c.width = d; c.height = d;
    var g = c.getContext('2d');
    var cx = d / 2, cy = d / 2;

    var terang = Lab.mix(warna, '#ffffff', 0.45);
    var gelap = Lab.mix(warna, '#0b1420', 0.42);

    var grad = g.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
    grad.addColorStop(0, terang);
    grad.addColorStop(0.45, warna);
    grad.addColorStop(1, gelap);

    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fillStyle = grad;
    g.fill();

    // Sorot cahaya kecil di kiri-atas.
    g.beginPath();
    g.ellipse(cx - r * 0.32, cy - r * 0.38, r * 0.28, r * 0.19, -0.6, 0, Math.PI * 2);
    g.fillStyle = 'rgba(255,255,255,0.75)';
    g.fill();

    spritCache[kunci] = c;
    return c;
  }

  Lab.bola = function (ctx, x, y, radius, warna, alpha) {
    var s = sprit(warna, radius);
    var setengah = s.width / 2;
    if (alpha != null && alpha < 1) {
      var lama = ctx.globalAlpha;
      ctx.globalAlpha = lama * alpha;
      ctx.drawImage(s, x - setengah, y - setengah);
      ctx.globalAlpha = lama;
    } else {
      ctx.drawImage(s, x - setengah, y - setengah);
    }
  };

  /* ---------- Sistem partikel tiga wujud ---------- */

  var FASE = { PADAT: 0, CAIR: 1, GAS: 2 };
  Lab.FASE = FASE;

  /** opsi: { jumlah, radius, warna } */
  Lab.SistemPartikel = function (opsi) {
    opsi = opsi || {};
    var jumlah = opsi.jumlah || 120;
    var radius = opsi.radius || 6;

    var wadah = { x: 0, y: 0, w: 100, h: 100 };
    var partikel = [];
    var kolomKisi = 1;

    for (var i = 0; i < jumlah; i++) {
      partikel.push({
        x: 0, y: 0, vx: 0, vy: 0,
        sx: 0, sy: 0,              // situs kisi saat berwujud padat
        fase: FASE.PADAT,
        r: radius * rnd(0.92, 1.08),
        warna: opsi.warna || '#3f8fd8',
        fasaAcak: rnd(0, Math.PI * 2)
      });
    }

    /** Menyusun ulang situs kisi supaya zat padat menumpuk rapi di dasar wadah. */
    function susunKisi() {
      var jarak = radius * 2.08;
      var kolom = Math.max(1, Math.floor((wadah.w - radius) / jarak));
      var baris = Math.ceil(jumlah / kolom);
      kolomKisi = kolom;
      var lebar = kolom * jarak;
      var kiri = wadah.x + (wadah.w - lebar) / 2 + jarak / 2;
      var dasar = wadah.y + wadah.h - radius - 2;

      for (var i = 0; i < jumlah; i++) {
        var b = Math.floor(i / kolom);
        var k = i % kolom;
        // Baris ganjil digeser setengah langkah: kisi rapat khas zat padat.
        var geser = (b % 2) * jarak * 0.5;
        partikel[i].sx = kiri + k * jarak + geser;
        partikel[i].sy = dasar - b * jarak * 0.9;
      }
    }

    function aturWadah(w) {
      wadah = w;
      susunKisi();
    }

    /** Menempatkan semua partikel tepat di situs kisinya (kondisi awal padat). */
    function reset(fase) {
      for (var i = 0; i < jumlah; i++) {
        var p = partikel[i];
        p.fase = fase == null ? FASE.PADAT : fase;
        p.x = p.sx; p.y = p.sy;
        p.vx = 0; p.vy = 0;
      }
    }

    /** Mengatur berapa partikel yang sudah berubah wujud.
     *  fraksiCair & fraksiGas dihitung dari model kalor di modul. */
    function aturFraksi(fraksiCair, fraksiGas) {
      var nGas = Math.round(clamp(fraksiGas, 0, 1) * jumlah);
      var nCair = Math.round(clamp(fraksiCair, 0, 1) * jumlah);
      for (var i = 0; i < jumlah; i++) {
        var p = partikel[i];
        // Partikel teratas (indeks besar) mencair & menguap lebih dulu.
        var urut = jumlah - 1 - i;
        var baru = urut < nGas ? FASE.GAS : urut < nCair ? FASE.CAIR : FASE.PADAT;
        if (baru !== p.fase) {
          if (baru > p.fase) {
            // Menyerap kalor: partikel terlepas dengan dorongan ke atas.
            p.vx += rnd(-40, 40);
            p.vy -= rnd(20, 90);
          }
          p.fase = baru;
        }
      }
    }

    /** Satu langkah waktu. suhu01 = 0…1 tingkat keagitan termal. */
    function langkah(dt, suhu01) {
      dt = Math.min(dt, 1 / 30);
      var agitasi = clamp(suhu01, 0, 1);
      var kiri = wadah.x + radius, kanan = wadah.x + wadah.w - radius;
      var atas = wadah.y + radius, bawah = wadah.y + wadah.h - radius;
      var i, p;

      for (i = 0; i < jumlah; i++) {
        p = partikel[i];

        if (p.fase === FASE.PADAT) {
          // Terikat pada situs kisi: hanya bergetar di tempat.
          var getar = 1 + agitasi * 22;
          p.vx += (p.sx - p.x) * 320 * dt + rnd(-getar, getar);
          p.vy += (p.sy - p.y) * 320 * dt + rnd(-getar, getar);
          p.vx *= 0.86; p.vy *= 0.86;

        } else if (p.fase === FASE.CAIR) {
          // Mengalir: gravitasi + gerak termal, tetap saling bersentuhan.
          p.vy += 720 * dt;
          var acak = 26 + agitasi * 150;
          p.vx += rnd(-acak, acak) * dt * 8;
          p.vy += rnd(-acak, acak) * dt * 8;
          p.vx *= 0.94; p.vy *= 0.96;

        } else {
          // Gas: terbang bebas, laju rata-rata naik bersama suhu.
          var target = 70 + agitasi * 320;
          var laju = Math.hypot(p.vx, p.vy);
          if (laju < 1) {
            var sudut = rnd(0, Math.PI * 2);
            p.vx = Math.cos(sudut) * target;
            p.vy = Math.sin(sudut) * target;
          } else {
            var k = lerp(1, target / laju, 0.04);
            p.vx *= k; p.vy *= k;
          }
          p.vx += rnd(-30, 30) * dt * 10;
          p.vy += rnd(-30, 30) * dt * 10;
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }

      // Tolakan antar partikel supaya zat cair punya volume tetap
      // dan tidak saling menembus.
      for (i = 0; i < jumlah; i++) {
        p = partikel[i];
        if (p.fase !== FASE.CAIR) continue;
        for (var j = i + 1; j < jumlah; j++) {
          var q = partikel[j];
          if (q.fase !== FASE.CAIR) continue;
          var dx = q.x - p.x, dy = q.y - p.y;
          var d2 = dx * dx + dy * dy;
          var min = p.r + q.r;
          if (d2 >= min * min || d2 < 0.0001) continue;
          var d = Math.sqrt(d2);
          var dorong = (min - d) * 0.5;
          var nx = dx / d, ny = dy / d;
          p.x -= nx * dorong; p.y -= ny * dorong;
          q.x += nx * dorong; q.y += ny * dorong;
          var tukar = (q.vx - p.vx) * nx + (q.vy - p.vy) * ny;
          if (tukar < 0) {
            p.vx += nx * tukar * 0.4; p.vy += ny * tukar * 0.4;
            q.vx -= nx * tukar * 0.4; q.vy -= ny * tukar * 0.4;
          }
        }
      }

      // Dinding wadah.
      for (i = 0; i < jumlah; i++) {
        p = partikel[i];
        var pantul = p.fase === FASE.GAS ? 1 : 0.25;
        if (p.x < kiri) { p.x = kiri; p.vx = Math.abs(p.vx) * pantul; }
        if (p.x > kanan) { p.x = kanan; p.vx = -Math.abs(p.vx) * pantul; }
        if (p.y < atas) { p.y = atas; p.vy = Math.abs(p.vy) * pantul; }
        if (p.y > bawah) { p.y = bawah; p.vy = -Math.abs(p.vy) * pantul; }
      }
    }

    /** Menggambar semua partikel; yang berwujud gas sedikit transparan. */
    function gambar(ctx, warnaPerFase) {
      for (var i = 0; i < jumlah; i++) {
        var p = partikel[i];
        var w = warnaPerFase ? warnaPerFase[p.fase] || p.warna : p.warna;
        Lab.bola(ctx, p.x, p.y, p.r, w, p.fase === FASE.GAS ? 0.82 : 1);
      }
    }

    /** Ketinggian permukaan zat cair (untuk menggambar air di gelas). */
    function permukaanCair() {
      var min = Infinity, ada = false;
      for (var i = 0; i < jumlah; i++) {
        if (partikel[i].fase !== FASE.CAIR) continue;
        ada = true;
        if (partikel[i].y < min) min = partikel[i].y;
      }
      return ada ? min : null;
    }

    return {
      partikel: partikel,
      jumlah: jumlah,
      get wadah() { return wadah; },
      aturWadah: aturWadah,
      susunKisi: susunKisi,
      reset: reset,
      aturFraksi: aturFraksi,
      langkah: langkah,
      gambar: gambar,
      permukaanCair: permukaanCair
    };
  };

  /* ---------- Emitor: gelembung, uap, asap, percikan ---------- */

  /** Kumpulan partikel berumur pendek. opsi: { maks } */
  Lab.Emitor = function (opsi) {
    opsi = opsi || {};
    var maks = opsi.maks || 220;
    var isi = [];

    /** contoh: { x, y, vx, vy, r, warna, umur, naik, goyang, tumbuh, alpha } */
    function lepas(c) {
      if (isi.length >= maks) isi.shift();
      isi.push({
        x: c.x, y: c.y,
        vx: c.vx || 0, vy: c.vy || 0,
        r: c.r || 3,
        warna: c.warna || '#ffffff',
        umur: 0,
        maksUmur: c.maksUmur || 1.5,
        goyang: c.goyang || 0,
        tumbuh: c.tumbuh || 0,
        gravitasi: c.gravitasi || 0,
        alpha: c.alpha == null ? 0.8 : c.alpha,
        fasa: rnd(0, Math.PI * 2),
        jenis: c.jenis || 'gelembung'
      });
    }

    function langkah(dt) {
      for (var i = isi.length - 1; i >= 0; i--) {
        var p = isi[i];
        p.umur += dt;
        if (p.umur >= p.maksUmur) { isi.splice(i, 1); continue; }
        p.vy += p.gravitasi * dt;
        p.x += (p.vx + Math.sin(p.fasa + p.umur * 4) * p.goyang) * dt;
        p.y += p.vy * dt;
        p.r += p.tumbuh * dt;
      }
    }

    function gambar(ctx) {
      for (var i = 0; i < isi.length; i++) {
        var p = isi[i];
        var sisa = 1 - p.umur / p.maksUmur;
        var a = p.alpha * (p.jenis === 'gelembung' ? Math.min(1, sisa * 3) : sisa);
        if (a <= 0.01) continue;

        ctx.globalAlpha = a;
        if (p.jenis === 'gelembung') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = Lab.rgba(p.warna, 0.35);
          ctx.fill();
          ctx.lineWidth = Math.max(0.8, p.r * 0.18);
          ctx.strokeStyle = Lab.rgba('#ffffff', 0.85);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(p.x - p.r * 0.3, p.y - p.r * 0.3, Math.max(0.6, p.r * 0.22), 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.fill();
        } else {
          // Uap/asap: kepulan lembut.
          var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          g.addColorStop(0, Lab.rgba(p.warna, 0.55));
          g.addColorStop(1, Lab.rgba(p.warna, 0));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }

    return {
      get isi() { return isi; },
      lepas: lepas,
      langkah: langkah,
      gambar: gambar,
      bersihkan: function () { isi.length = 0; },
      get jumlah() { return isi.length; }
    };
  };

  /* ---------- Bentuk bantu ---------- */

  Lab.persegiBulat = function (ctx, x, y, w, h, r) {
    var rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  };

  /** Permukaan cairan bergelombang halus, digambar dari kiri ke kanan. */
  Lab.permukaanBergelombang = function (ctx, x, y, w, h, waktu, amplitudo) {
    var a = amplitudo == null ? 2.5 : amplitudo;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y);
    var langkah = Math.max(6, w / 28);
    for (var px = x; px <= x + w; px += langkah) {
      var t = (px - x) / w;
      var dy = Math.sin(t * Math.PI * 3 + waktu * 2) * a + Math.sin(t * Math.PI * 7 - waktu * 3) * a * 0.4;
      ctx.lineTo(px, y + dy);
    }
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
  };

  /** Nyala api sederhana yang berkedip; tinggi = 0 berarti padam. */
  Lab.gambarApi = function (ctx, x, dasar, lebar, tinggi, waktu, opsi) {
    if (tinggi <= 1) return;
    opsi = opsi || {};
    var kedip = 1 + Math.sin(waktu * 11) * 0.05 + Math.sin(waktu * 23.7) * 0.03;
    var t = tinggi * kedip;
    var w = lebar * (1 + Math.sin(waktu * 17) * 0.04);

    function lidah(skalaW, skalaT, warnaDalam, warnaLuar, alpha) {
      var ww = w * skalaW, tt = t * skalaT;
      var g = ctx.createLinearGradient(x, dasar, x, dasar - tt);
      g.addColorStop(0, warnaLuar);
      g.addColorStop(0.55, warnaDalam);
      g.addColorStop(1, Lab.rgba(warnaDalam, 0));
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(x - ww / 2, dasar);
      ctx.quadraticCurveTo(x - ww * 0.62, dasar - tt * 0.55, x, dasar - tt);
      ctx.quadraticCurveTo(x + ww * 0.62, dasar - tt * 0.55, x + ww / 2, dasar);
      ctx.closePath();
      ctx.fillStyle = g;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (opsi.biru) {
      lidah(1, 1, '#7cc4ff', '#2a6fd6', 0.85);
      lidah(0.55, 0.6, '#dff1ff', '#4f9be8', 0.9);
    } else {
      lidah(1, 1, '#ffb02e', '#e0521a', 0.85);
      lidah(0.62, 0.68, '#ffe27a', '#ff9a1f', 0.95);
      lidah(0.3, 0.4, '#fffbe8', '#ffd15c', 0.95);
    }
  };

})(window.Lab);
