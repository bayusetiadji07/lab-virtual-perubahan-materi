/* Lab Virtual — Perubahan Materi
 * Grafik garis waktu-nyata di atas kanvas. Ditulis sendiri (bukan pustaka luar)
 * supaya aplikasi tetap ringan dan bisa dipakai tanpa internet.
 */
(function (Lab) {
  'use strict';

  var clamp = Lab.clamp, num = Lab.num;

  /** opsi:
   *  { sumbuX:{label,min,max,jendela}, sumbuY:{label,min,max,auto},
   *    seri:[{kunci,label,warna,tebal}], garisBantu:[{y,label,warna}], maksTitik } */
  Lab.Grafik = function (canvas, opsi) {
    opsi = opsi || {};
    var sumbuX = Object.assign({ label: 'Waktu (detik)', min: 0, max: 60, jendela: 0 }, opsi.sumbuX);
    var sumbuY = Object.assign({ label: '', min: 0, max: 100, auto: false }, opsi.sumbuY);
    var seri = opsi.seri || [];
    var garisBantu = opsi.garisBantu || [];
    var maksTitik = opsi.maksTitik || 1800;

    var titik = [];           // [{x, <kunci>: nilai, …}]
    var yMin = sumbuY.min, yMaks = sumbuY.max;

    var GAYA = {
      teks: '#4a5b68',
      teksKuat: '#16222c',
      kisi: '#e6e2da',
      sumbu: '#c9c3b8',
      latar: '#ffffff'
    };

    function tambah(rekam) {
      titik.push(rekam);
      if (titik.length > maksTitik) {
        // Buang tiap titik kedua dari paruh awal: bentuk grafik tetap terbaca.
        var baru = [];
        for (var i = 0; i < titik.length; i++) {
          if (i < titik.length / 2 && i % 2 === 1) continue;
          baru.push(titik[i]);
        }
        titik = baru;
      }
      if (sumbuY.auto) {
        seri.forEach(function (s) {
          var v = rekam[s.kunci];
          if (v == null || !isFinite(v)) return;
          if (v < yMin) yMin = v;
          if (v > yMaks) yMaks = v;
        });
      }
    }

    function reset() {
      titik = [];
      yMin = sumbuY.min;
      yMaks = sumbuY.max;
    }

    /** Langkah kisi "bulat" terdekat untuk rentang tertentu. */
    function langkahBagus(rentang, targetGaris) {
      var kasar = rentang / Math.max(1, targetGaris);
      var pangkat = Math.pow(10, Math.floor(Math.log10(kasar)));
      var sisa = kasar / pangkat;
      var pengali = sisa >= 5 ? 5 : sisa >= 2 ? 2 : 1;
      return pengali * pangkat;
    }

    function gambar() {
      var k = Lab.siapkanKanvas(canvas);
      var ctx = k.ctx, W = k.w, H = k.h;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = GAYA.latar;
      ctx.fillRect(0, 0, W, H);

      var padKiri = 52, padKanan = 14, padAtas = 14, padBawah = 34;
      var pw = Math.max(10, W - padKiri - padKanan);
      var ph = Math.max(10, H - padAtas - padBawah);

      // Jendela sumbu X bergulir mengikuti data terbaru.
      var xAkhir = titik.length ? titik[titik.length - 1].x : 0;
      var xMaks = sumbuX.max, xMin = sumbuX.min;
      if (sumbuX.jendela) {
        xMaks = Math.max(sumbuX.jendela, xAkhir + sumbuX.jendela * 0.06);
        xMin = xMaks - sumbuX.jendela;
      } else if (xAkhir > xMaks) {
        xMaks = xAkhir * 1.05;
      }

      var lo = yMin, hi = yMaks;
      if (hi - lo < 1e-6) hi = lo + 1;
      var bantalan = (hi - lo) * (sumbuY.auto ? 0.08 : 0);
      lo -= bantalan; hi += bantalan;

      function sx(v) { return padKiri + (v - xMin) / (xMaks - xMin) * pw; }
      function sy(v) { return padAtas + (1 - (v - lo) / (hi - lo)) * ph; }

      // Kisi horizontal + label sumbu Y.
      var stepY = langkahBagus(hi - lo, 5);
      ctx.font = '11px system-ui, "Segoe UI", sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'right';
      var mulaiY = Math.ceil(lo / stepY) * stepY;
      for (var v = mulaiY; v <= hi + 1e-9; v += stepY) {
        var y = sy(v);
        ctx.beginPath();
        ctx.moveTo(padKiri, y);
        ctx.lineTo(padKiri + pw, y);
        ctx.strokeStyle = GAYA.kisi;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = GAYA.teks;
        ctx.fillText(num(v, stepY < 1 ? 1 : 0), padKiri - 8, y);
      }

      // Kisi vertikal + label sumbu X.
      var stepX = langkahBagus(xMaks - xMin, 6);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      var mulaiX = Math.ceil(xMin / stepX) * stepX;
      for (var vx = mulaiX; vx <= xMaks + 1e-9; vx += stepX) {
        var x = sx(vx);
        ctx.beginPath();
        ctx.moveTo(x, padAtas);
        ctx.lineTo(x, padAtas + ph);
        ctx.strokeStyle = GAYA.kisi;
        ctx.stroke();
        ctx.fillStyle = GAYA.teks;
        ctx.fillText(num(vx, stepX < 1 ? 1 : 0), x, padAtas + ph + 8);
      }

      // Garis bantu mendatar (mis. titik lebur / titik didih).
      ctx.setLineDash([5, 4]);
      garisBantu.forEach(function (g) {
        if (g.y < lo || g.y > hi) return;
        var y = sy(g.y);
        ctx.beginPath();
        ctx.moveTo(padKiri, y);
        ctx.lineTo(padKiri + pw, y);
        ctx.strokeStyle = g.warna || '#b6aa93';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        if (g.label) {
          ctx.setLineDash([]);
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
          ctx.font = '10px system-ui, "Segoe UI", sans-serif';
          ctx.fillStyle = g.warna || '#8e846f';
          ctx.fillText(g.label, padKiri + 6, y - 3);
          ctx.setLineDash([5, 4]);
        }
      });
      ctx.setLineDash([]);

      // Bingkai.
      ctx.strokeStyle = GAYA.sumbu;
      ctx.lineWidth = 1;
      ctx.strokeRect(padKiri + 0.5, padAtas + 0.5, pw, ph);

      // Garis tiap seri.
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      seri.forEach(function (s) {
        ctx.beginPath();
        var mulai = false, akhirX = null, akhirY = null;
        for (var i = 0; i < titik.length; i++) {
          var t = titik[i];
          var nilai = t[s.kunci];
          if (nilai == null || !isFinite(nilai)) { mulai = false; continue; }
          if (t.x < xMin) continue;
          var px = sx(t.x), py = sy(nilai);
          if (!mulai) { ctx.moveTo(px, py); mulai = true; }
          else ctx.lineTo(px, py);
          akhirX = px; akhirY = py;
        }
        ctx.strokeStyle = s.warna;
        ctx.lineWidth = s.tebal || 2.2;
        ctx.stroke();

        // Penanda nilai terkini.
        if (akhirX != null) {
          ctx.beginPath();
          ctx.arc(akhirX, akhirY, 4, 0, Math.PI * 2);
          ctx.fillStyle = s.warna;
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      // Judul sumbu.
      ctx.font = '11px system-ui, "Segoe UI", sans-serif';
      ctx.fillStyle = GAYA.teksKuat;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(sumbuX.label, padKiri + pw / 2, H - 2);
      if (sumbuY.label) {
        ctx.save();
        ctx.translate(11, padAtas + ph / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textBaseline = 'top';
        ctx.fillText(sumbuY.label, 0, 0);
        ctx.restore();
      }

      if (!titik.length) {
        ctx.fillStyle = '#9aa5ae';
        ctx.font = '12px system-ui, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Jalankan percobaan untuk mulai merekam data.', padKiri + pw / 2, padAtas + ph / 2);
      }
    }

    /** Legenda sebagai elemen HTML, ditempatkan modul di dekat kanvas. */
    function legenda() {
      return Lab.el('.grafik__legenda', seri.map(function (s) {
        return Lab.el('.grafik__legenda-item', [
          Lab.el('span.grafik__legenda-warna', { style: { background: s.warna } }),
          Lab.el('span', s.label)
        ]);
      }));
    }

    function dataCSV(kolom) {
      var kepala = ['x'].concat(seri.map(function (s) { return s.kunci; }));
      var baris = [(kolom || kepala).join(',')];
      titik.forEach(function (t) {
        baris.push(kepala.map(function (k) {
          var v = t[k];
          return v == null ? '' : (Math.round(v * 1000) / 1000);
        }).join(','));
      });
      return baris.join('\n');
    }

    return {
      tambah: tambah,
      reset: reset,
      gambar: gambar,
      legenda: legenda,
      dataCSV: dataCSV,
      get titik() { return titik; },
      aturSumbuY: function (min, maks) { sumbuY.min = yMin = min; sumbuY.max = yMaks = maks; }
    };
  };

})(window.Lab);
