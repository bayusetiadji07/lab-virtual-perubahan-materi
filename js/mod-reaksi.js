/* Lab Virtual — Perubahan Materi
 * Modul 3 — Reaksi Kimia Sederhana.
 *
 * Tiga percobaan dalam satu modul, masing-masing menonjolkan ciri perubahan kimia
 * yang berbeda: timbulnya gas, perubahan warna disertai zat baru, dan pembakaran.
 */
(function (Lab) {
  'use strict';

  var el = Lab.el, ui = Lab.ui, num = Lab.num, clamp = Lab.clamp, rnd = Lab.rnd;

  var MEJA_Y = 0.92;

  function gambarMeja(ctx, W, H) {
    var y = H * MEJA_Y;
    var g = ctx.createLinearGradient(0, y, 0, H);
    g.addColorStop(0, '#cbd7e2'); g.addColorStop(1, '#aebecd');
    ctx.fillStyle = g;
    ctx.fillRect(0, y, W, H - y);
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.fillRect(0, y, W, 2);
  }

  /* Menggambar gambar dengan tinggi tertentu, ditumpu pada titik (cx, dasar). */
  function taruh(ctx, img, cx, dasar, tinggi, alpha) {
    if (!img.siap) return null;
    var w = tinggi * (img.naturalWidth / img.naturalHeight);
    var x = cx - w / 2, y = dasar - tinggi;
    if (alpha != null) { ctx.globalAlpha = alpha; }
    ctx.drawImage(img, x, y, w, tinggi);
    ctx.globalAlpha = 1;
    return { x: x, y: y, w: w, h: tinggi };
  }

  /* Beberapa berkas aset memuat dua tampilan dalam satu gambar (misalnya cawan
   * tampak atas dan tampak samping). POTONG menyimpan bagian yang dipakai,
   * dinyatakan sebagai pecahan dari lebar/tinggi gambar aslinya. */
  var POTONG = {
    cawanSamping: { x0: 0.53, y0: 0.35, x1: 0.99, y1: 0.79 },
    genangan: { x0: 0.04, y0: 0.47, x1: 0.96, y1: 0.99 },
    kertas: { x0: 0.02, y0: 0.05, x1: 0.48, y1: 0.95 },
    abu: { x0: 0.50, y0: 0.22, x1: 0.99, y1: 0.80 }
  };

  /** Seperti taruh(), tetapi hanya menggambar sebagian dari gambar sumber.
   *  Ukuran ditentukan lewat opsi.tinggi atau opsi.lebar (salah satu saja). */
  function taruhPotong(ctx, img, potong, cx, dasar, opsi) {
    if (!img.siap) return null;
    var iw = img.naturalWidth, ih = img.naturalHeight;
    var sx = potong.x0 * iw, sy = potong.y0 * ih;
    var sw = (potong.x1 - potong.x0) * iw, sh = (potong.y1 - potong.y0) * ih;
    var h = opsi.tinggi != null ? opsi.tinggi : opsi.lebar * (sh / sw);
    var w = opsi.lebar != null ? opsi.lebar : h * (sw / sh);
    var x = cx - w / 2, y = dasar - h;
    if (opsi.alpha != null) ctx.globalAlpha = opsi.alpha;
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    ctx.globalAlpha = 1;
    return { x: x, y: y, w: w, h: h };
  }

  /* ================= Percobaan A — Cuka + Baking Soda ================= */

  function buatSoda(api) {
    var vCuka = 50, mSoda = 5;
    var tercampur = false, progres = 0, waktu = 0;
    var suhu = 25, lakmus = null;
    var gelembung = Lab.Emitor({ maks: 200 });
    var buih = [];

    var imgGelas = Lab.gambar('beaker');
    var imgBotol = Lab.gambar('botol-cuka');
    var imgSoda = Lab.gambar('baking-soda');

    /* Kimia: NaHCO₃ + CH₃COOH → CH₃COONa + H₂O + CO₂
     * Cuka dapur ± 5 % asam asetat (0,05 g/mL), Mr NaHCO₃ = 84, Mr CH₃COOH = 60. */
    function molSoda() { return mSoda / 84; }
    function molAsam() { return vCuka * 0.05 / 60; }
    function molReaksi() { return Math.min(molSoda(), molAsam()); }
    function volGasMaks() { return molReaksi() * 24000; }   // mL pada suhu ruang
    function volGas() { return volGasMaks() * progres; }
    function pembatas() {
      var a = molSoda(), b = molAsam();
      if (Math.abs(a - b) < 1e-4) return 'Tepat habis bereaksi';
      return a < b ? 'Baking soda (cuka bersisa)' : 'Cuka (baking soda bersisa)';
    }
    function sisaAsam() { return molAsam() - molReaksi(); }

    return {
      id: 'soda',
      judul: 'Cuka + Baking Soda',
      ringkas: 'Asam cuka direaksikan dengan natrium bikarbonat. Amati gas yang terbentuk dan suhu yang justru turun.',
      grafik: {
        sumbuX: { label: 'Waktu reaksi (detik)', min: 0, max: 12 },
        sumbuY: { label: 'Volume gas CO₂ (mL)', min: 0, max: 500, auto: true },
        seri: [{ kunci: 'gas', label: 'Volume gas CO₂', warna: '#c1541f', tebal: 2.4 }]
      },
      keteranganGrafik: 'Gas terbentuk cepat di awal lalu melambat ketika salah satu pereaksi mulai habis. ' +
        'Volume gas maksimum ditentukan oleh pereaksi pembatas.',

      kontrol: function () {
        var sCuka = ui.slider({
          label: 'Volume cuka', min: 10, max: 100, step: 5, nilai: vCuka, satuan: 'mL',
          keterangan: 'Cuka dapur mengandung sekitar 5 % asam asetat.',
          onInput: function (v) { vCuka = v; if (!tercampur) api.segarkan(); }
        });
        var sSoda = ui.slider({
          label: 'Massa baking soda', min: 1, max: 20, step: 1, nilai: mSoda, satuan: 'gram',
          keterangan: 'Natrium bikarbonat (NaHCO₃).',
          onInput: function (v) { mSoda = v; if (!tercampur) api.segarkan(); }
        });
        var bCampur = ui.tombol({
          label: 'Campurkan', ikon: '⚗️', jenis: 'utama',
          onClick: function () {
            if (tercampur) return;
            tercampur = true;
            waktu = 0;
            sCuka.nonaktif(true); sSoda.nonaktif(true);
            bCampur.nonaktif(true);
            Lab.toast('Reaksi dimulai — perhatikan gelembung gasnya', 'info');
          }
        });
        var bLakmus = ui.tombol({
          label: 'Uji kertas lakmus', ikon: '📄', jenis: 'kedua',
          onClick: function () {
            lakmus = !tercampur ? 'asam'
              : sisaAsam() > 1e-4 ? 'asam-sisa'
              : molSoda() > molReaksi() + 1e-4 ? 'basa' : 'netral';
            api.segarkan();
          }
        });
        var bUlang = ui.tombol({
          label: 'Ulang', ikon: '↺', jenis: 'kedua',
          onClick: function () {
            tercampur = false; progres = 0; waktu = 0; suhu = 25; lakmus = null;
            gelembung.bersihkan(); buih.length = 0;
            api.resetGrafik();
            sCuka.nonaktif(false); sSoda.nonaktif(false); bCampur.nonaktif(false);
            api.segarkan();
          }
        });

        return [
          ui.grup('Bahan', [sCuka.el, sSoda.el]),
          ui.grup('Kendali percobaan', [
            ui.barisTombol([bCampur, bUlang]),
            ui.barisTombol([bLakmus])
          ])
        ];
      },

      pembacaan: function () {
        return [
          { kunci: 'gas', label: 'Volume gas CO₂', nilai: '0', satuan: 'mL', warna: 'aksen' },
          { kunci: 'suhu', label: 'Suhu campuran', nilai: '25,0', satuan: '°C' },
          { kunci: 'batas', label: 'Pereaksi pembatas', nilai: '–' },
          { kunci: 'maju', label: 'Kemajuan reaksi', nilai: '0', satuan: '%' }
        ];
      },

      tambahan: function () {
        if (!lakmus) return null;
        var teks = {
          'asam': 'Kertas lakmus biru berubah merah — cuka bersifat asam.',
          'asam-sisa': 'Lakmus biru masih berubah merah — cuka bersisa, larutan tetap asam.',
          'basa': 'Lakmus merah berubah biru — baking soda bersisa, larutan bersifat basa.',
          'netral': 'Warna kertas lakmus tidak berubah — larutan mendekati netral, tanda pereaksi habis bereaksi.'
        }[lakmus];
        return el('.umpan', { 'data-jenis': 'benar' }, [
          el('strong', 'Hasil uji lakmus'),
          teks,
          el('img', {
            src: 'assets/lakmus.png', alt: 'Kertas lakmus sebagai indikator pH',
            style: { display: 'block', marginTop: '.5rem', maxWidth: '210px', borderRadius: '8px' }
          })
        ]);
      },

      langkah: function (dt) {
        if (!tercampur) return;
        waktu += dt;
        // Reaksi cepat di awal lalu melandai saat pereaksi menipis.
        progres = Math.min(1, progres + (1 - progres) * 0.55 * dt + 0.02 * dt);
        suhu = 25 - 4.2 * progres;   // reaksi ini menyerap kalor (endoterm)

        if (progres < 0.995) {
          var banyak = Math.round(clamp((1 - progres) * 6, 0, 6));
          for (var i = 0; i < banyak; i++) api.antre(function (w) {
            gelembung.lepas({
              x: w.x + rnd(0.1, 0.9) * w.w,
              y: w.y + w.h - rnd(2, 16),
              vy: rnd(-140, -60), r: rnd(2, 6.5),
              tumbuh: 6, goyang: 16, maksUmur: rnd(0.5, 1.2),
              warna: '#f4e2cd', alpha: 0.95
            });
          });
        }
        gelembung.langkah(dt);

        // Lapisan buih: tumbuh saat reaksi deras, lalu perlahan surut.
        var targetBuih = (1 - progres) * 0.55 + 0.12 * (progres < 1 ? 1 : 0);
        buih.tinggi = (buih.tinggi || 0) + (targetBuih - (buih.tinggi || 0)) * dt * 1.6;

        api.rekam({ x: waktu, gas: volGas() });
      },

      gambar: function (ctx, W, H, t) {
        gambarMeja(ctx, W, H);

        var dasar = H * MEJA_Y;
        taruh(ctx, imgBotol, W * 0.13, dasar, H * 0.30);
        taruh(ctx, imgSoda, W * 0.86, dasar, H * 0.17);

        var gh = H * 0.55;
        var rasio = imgGelas.naturalWidth ? imgGelas.naturalWidth / imgGelas.naturalHeight : 1.04;
        var gw = gh * rasio;
        var gx = W * 0.5 - gw / 2, gy = dasar - gh;
        var dalam = { x: gx + gw * 0.20, y: gy + gh * 0.13, w: gw * 0.60, h: gh * 0.75 };
        api.wadah = dalam;

        if (imgGelas.siap) ctx.drawImage(imgGelas, gx, gy, gw, gh);

        ctx.save();
        ctx.beginPath(); ctx.rect(dalam.x, dalam.y, dalam.w, dalam.h); ctx.clip();

        /* Cairan: tinggi mengikuti volume cuka. */
        var tinggiCairan = dalam.h * clamp(0.18 + vCuka / 100 * 0.5, 0.15, 0.72);
        var permukaan = dalam.y + dalam.h - tinggiCairan;
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = Lab.mix('#f2ead6', '#e8dcbd', progres);
        Lab.permukaanBergelombang(ctx, dalam.x, permukaan, dalam.w, tinggiCairan, t, tercampur ? 3.5 : 1.4);
        ctx.fill();
        ctx.globalAlpha = 1;

        /* Serbuk baking soda yang belum bereaksi mengendap di dasar. */
        if (!tercampur) {
          ctx.fillStyle = '#f8f6f0';
          var tebal = clamp(mSoda / 20, 0, 1) * dalam.h * 0.10 + 3;
          ctx.beginPath();
          ctx.ellipse(dalam.x + dalam.w / 2, dalam.y + dalam.h - tebal / 2,
            dalam.w * 0.42, tebal, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        gelembung.gambar(ctx);

        /* Buih di atas permukaan cairan. */
        var tb = (buih.tinggi || 0) * dalam.h * 0.5;
        if (tb > 1) {
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = '#fdf7ec';
          ctx.fillRect(dalam.x, permukaan - tb, dalam.w, tb);
          ctx.fillStyle = '#fffdf8';
          for (var b = 0; b < 26; b++) {
            var bx = dalam.x + (b / 25) * dalam.w;
            var r = 4 + Math.sin(b * 2.3 + t * 3) * 3 + tb * 0.06;
            ctx.beginPath();
            ctx.arc(bx, permukaan - tb, r, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
        ctx.restore();

        if (imgGelas.siap) {
          var potong = imgGelas.naturalHeight * 0.13;
          ctx.drawImage(imgGelas, 0, 0, imgGelas.naturalWidth, potong, gx, gy, gw, gh * 0.13);
        }
      },

      status: function () {
        if (!tercampur) return { teks: 'Belum dicampur', jenis: 'netral' };
        if (progres < 0.98) return { teks: 'Reaksi berlangsung', jenis: 'kimia' };
        return { teks: 'Reaksi selesai', jenis: 'benar' };
      },

      nilai: function () {
        return {
          gas: num(volGas(), 0),
          suhu: num(suhu, 1),
          batas: pembatas(),
          maju: num(progres * 100, 0)
        };
      },

      selesai: function () { return tercampur && progres > 0.985; },

      rekamJurnal: function () {
        return {
          percobaan: 'Cuka + baking soda (' + num(vCuka, 0) + ' mL cuka, ' + num(mSoda, 0) + ' g soda)',
          jenis: 'kimia',
          ciri: {
            gas: 'Gelembung gas CO₂ ' + num(volGas(), 0) + ' mL',
            suhu: 'Turun dari 25,0 °C menjadi ' + num(suhu, 1) + ' °C (menyerap kalor)',
            warna: 'Muncul buih putih di permukaan',
            bau: 'Bau cuka berkurang setelah bereaksi',
            endapan: false, wujud: false
          },
          zatBaru: true,
          bisaBalik: false,
          data: {
            'Volume cuka': num(vCuka, 0) + ' mL',
            'Massa baking soda': num(mSoda, 0) + ' g',
            'Volume gas CO₂': num(volGas(), 0) + ' mL',
            'Pereaksi pembatas': pembatas(),
            'Suhu akhir': num(suhu, 1) + ' °C'
          },
          kesimpulan: 'Terbentuk zat baru (natrium asetat, air, dan gas CO₂). Ditandai gas dan penurunan suhu, ' +
            'serta tidak dapat dikembalikan menjadi cuka dan baking soda semula → perubahan kimia.'
        };
      }
    };
  }

  /* ================= Percobaan B — Besi Berkarat ================= */

  function buatKarat(api) {
    var kelembapan = 70, garam = 0, lajuWaktu = 3;
    var berjalan = false, hari = 0, karat = 0;

    var imgAwal = Lab.gambar('paku-awal');
    var imgTengah = Lab.gambar('paku-karat-sebagian');
    var imgPenuh = Lab.gambar('paku-karat-penuh');
    var imgCawan = Lab.gambar('cawan-penguap');
    var imgAir = Lab.gambar('genangan-air');

    var bJalan;

    return {
      id: 'karat',
      judul: 'Besi Berkarat',
      ringkas: 'Perkaratan berlangsung berhari-hari. Simulasi ini mempercepatnya menjadi rekaman waktu singkat.',
      grafik: {
        sumbuX: { label: 'Waktu (hari)', min: 0, max: 30, auto: true },
        sumbuY: { label: 'Bagian berkarat (%)', min: 0, max: 100 },
        seri: [{ kunci: 'karat', label: 'Permukaan berkarat', warna: '#a0522d', tebal: 2.4 }]
      },
      keteranganGrafik: 'Perkaratan memerlukan air dan oksigen. Garam mempercepatnya karena membuat air ' +
        'menjadi penghantar listrik yang baik — itulah sebabnya besi di dekat laut cepat berkarat.',

      kontrol: function () {
        var sLembap = ui.slider({
          label: 'Kelembapan udara', min: 0, max: 100, step: 5, nilai: kelembapan, satuan: '%',
          keterangan: 'Tanpa air, besi hampir tidak berkarat.',
          onInput: function (v) { kelembapan = v; }
        });
        var sGaram = ui.slider({
          label: 'Kadar garam', min: 0, max: 100, step: 5, nilai: garam, satuan: '%',
          keterangan: 'Air garam mempercepat perkaratan.',
          onInput: function (v) { garam = v; }
        });
        var sLaju = ui.segmen({
          label: 'Kecepatan rekaman',
          opsi: [{ nilai: '1', label: '1 hari/s' }, { nilai: '3', label: '3 hari/s' }, { nilai: '10', label: '10 hari/s' }],
          nilai: '3',
          onChange: function (v) { lajuWaktu = +v; }
        });
        bJalan = ui.tombol({
          label: 'Jalankan', ikon: '▶', jenis: 'utama',
          onClick: function () {
            berjalan = !berjalan;
            bJalan.setLabel(berjalan ? 'Jeda' : 'Jalankan');
            bJalan.setIkon(berjalan ? '⏸' : '▶');
          }
        });
        var bUlang = ui.tombol({
          label: 'Ulang', ikon: '↺', jenis: 'kedua',
          onClick: function () {
            berjalan = false; hari = 0; karat = 0;
            bJalan.setLabel('Jalankan'); bJalan.setIkon('▶');
            api.resetGrafik();
          }
        });

        return [
          ui.grup('Kondisi lingkungan', [sLembap.el, sGaram.el]),
          ui.grup('Kendali percobaan', [sLaju.el, ui.barisTombol([bJalan, bUlang])])
        ];
      },

      pembacaan: function () {
        return [
          { kunci: 'karat', label: 'Bagian berkarat', nilai: '0', satuan: '%', warna: 'aksen' },
          { kunci: 'hari', label: 'Waktu', nilai: '0', satuan: 'hari' },
          { kunci: 'laju', label: 'Laju karat', nilai: '0', satuan: '%/hari' },
          { kunci: 'warna', label: 'Warna permukaan', nilai: 'Abu-abu logam' }
        ];
      },

      langkah: function (dt) {
        if (!berjalan || karat >= 1) return;
        var dHari = dt * lajuWaktu;
        hari += dHari;
        karat = clamp(karat + this.laju() / 100 * dHari, 0, 1);
        api.rekam({ x: hari, karat: karat * 100 });
      },

      laju: function () {
        // % permukaan berkarat per hari.
        return 1.15 * Math.pow(kelembapan / 100, 1.35) * (1 + 1.7 * garam / 100);
      },

      gambar: function (ctx, W, H) {
        gambarMeja(ctx, W, H);
        var dasar = H * MEJA_Y;
        var cx = W * 0.5;

        /* Cawan penguap — hanya tampak samping yang dipakai dari berkas aset. */
        var cawan = taruhPotong(ctx, imgCawan, POTONG.cawanSamping, cx, dasar, { lebar: W * 0.44 });

        /* Genangan air di dalam cawan; banyaknya mengikuti kelembapan. */
        if (kelembapan > 5) {
          taruhPotong(ctx, imgAir, POTONG.genangan, cx, dasar - H * 0.045,
            { lebar: W * 0.26, alpha: 0.35 + kelembapan / 100 * 0.5 });
        }

        /* Paku: tiga tahap disilangkan halus mengikuti persen karat. */
        var pakuLebar = W * 0.62;
        var pakuTinggi = pakuLebar * 0.5;              // gambar paku berbanding 2 : 1
        var pakuDasar = (cawan ? cawan.y : dasar - H * 0.3) + pakuTinggi * 0.62;
        function paku(img, alpha) {
          if (!img.siap) return;
          ctx.globalAlpha = alpha;
          ctx.drawImage(img, cx - pakuLebar / 2, pakuDasar - pakuTinggi, pakuLebar, pakuTinggi);
          ctx.globalAlpha = 1;
        }
        if (karat < 0.5) {
          paku(imgAwal, 1);
          paku(imgTengah, Lab.smooth(karat / 0.5));
        } else {
          paku(imgTengah, 1);
          paku(imgPenuh, Lab.smooth((karat - 0.5) / 0.5));
        }

        /* Butiran garam berkilau di dalam cawan bila kadar garam tinggi. */
        if (garam > 10) {
          ctx.fillStyle = 'rgba(255,255,255,.9)';
          for (var i = 0; i < Math.round(garam / 6); i++) {
            var a = i * 2.399;
            ctx.beginPath();
            ctx.arc(cx + Math.cos(a) * W * 0.10, dasar - H * 0.075 + Math.sin(a) * H * 0.014,
              1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        /* Papan nama waktu di bagian atas panggung. */
        var teks = 'Hari ke-' + num(hari, 0);
        ctx.font = '600 14px system-ui, sans-serif';
        var lebarTeks = ctx.measureText(teks).width + 26;
        ctx.fillStyle = 'rgba(255,255,255,.9)';
        Lab.persegiBulat(ctx, cx - lebarTeks / 2, H * 0.09, lebarTeks, 28, 14);
        ctx.fill();
        ctx.strokeStyle = 'rgba(160,82,45,.35)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#8a4a24';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(teks, cx, H * 0.09 + 14);
        ctx.textBaseline = 'alphabetic';
      },

      status: function () {
        if (karat < 0.02) return { teks: 'Belum berkarat', jenis: 'netral' };
        if (karat < 0.99) return { teks: 'Sedang berkarat', jenis: 'kimia' };
        return { teks: 'Berkarat seluruhnya', jenis: 'kimia' };
      },

      nilai: function () {
        return {
          karat: num(karat * 100, 0),
          hari: num(hari, 0),
          laju: num(this.laju(), 2),
          warna: karat < 0.05 ? 'Abu-abu logam'
            : karat < 0.5 ? 'Bercak cokelat'
            : karat < 0.95 ? 'Cokelat kemerahan' : 'Cokelat karat merata'
        };
      },

      selesai: function () { return karat >= 0.999; },

      rekamJurnal: function () {
        return {
          percobaan: 'Perkaratan besi (kelembapan ' + num(kelembapan, 0) + ' %, garam ' + num(garam, 0) + ' %)',
          jenis: 'kimia',
          ciri: {
            warna: 'Abu-abu logam → cokelat kemerahan',
            gas: false,
            suhu: false,
            endapan: 'Lapisan karat rapuh di permukaan',
            wujud: false,
            bau: false
          },
          zatBaru: true,
          bisaBalik: false,
          data: {
            'Kelembapan': num(kelembapan, 0) + ' %',
            'Kadar garam': num(garam, 0) + ' %',
            'Waktu': num(hari, 0) + ' hari',
            'Bagian berkarat': num(karat * 100, 0) + ' %',
            'Laju perkaratan': num(this.laju(), 2) + ' %/hari'
          },
          kesimpulan: 'Besi bereaksi dengan air dan oksigen membentuk karat (besi(III) oksida terhidrat) — ' +
            'zat baru yang sifatnya berbeda dari besi. Karat tidak dapat diubah kembali menjadi besi ' +
            'dengan cara sederhana → perubahan kimia.'
        };
      }
    };
  }

  /* ================= Percobaan C — Pembakaran ================= */

  function buatBakar(api) {
    var bahan = 'kertas';
    var menyala = false, sisa = 1, suhu = 27, waktu = 0;
    var asap = Lab.Emitor({ maks: 140 });

    var imgKertasAbu = Lab.gambar('kertas-abu');
    var imgLilin = Lab.gambar('lilin');

    var DATA = {
      kertas: { nama: 'Kertas', massaAwal: 5, durasi: 9, suhuApi: 320 },
      lilin: { nama: 'Lilin', massaAwal: 40, durasi: 34, suhuApi: 260 }
    };

    var bNyala;

    function d() { return DATA[bahan]; }
    function massa() { return d().massaAwal * sisa; }

    return {
      id: 'bakar',
      judul: 'Pembakaran',
      ringkas: 'Kertas dan lilin dibakar. Perhatikan zat sisa yang terbentuk dan apakah prosesnya dapat dibalik.',
      grafik: {
        sumbuX: { label: 'Waktu pembakaran (detik)', min: 0, max: 40, auto: true },
        sumbuY: { label: 'Massa bahan (gram)', min: 0, max: 40, auto: true },
        seri: [{ kunci: 'massa', label: 'Massa bahan tersisa', warna: '#c1541f', tebal: 2.4 }]
      },
      keteranganGrafik: 'Massa bahan berkurang karena sebagian berubah menjadi gas (karbon dioksida dan uap air) ' +
        'yang terbang ke udara. Jika gas itu ikut ditimbang, massa totalnya tetap.',

      kontrol: function () {
        var sBahan = ui.segmen({
          label: 'Bahan yang dibakar',
          opsi: [{ nilai: 'kertas', label: 'Kertas', ikon: '📄' }, { nilai: 'lilin', label: 'Lilin', ikon: '🕯️' }],
          nilai: bahan,
          onChange: function (v) {
            bahan = v; menyala = false; sisa = 1; suhu = 27; waktu = 0;
            asap.bersihkan();
            bNyala.setLabel('Nyalakan'); bNyala.setIkon('🔥');
            api.resetGrafik();
          }
        });
        bNyala = ui.tombol({
          label: 'Nyalakan', ikon: '🔥', jenis: 'utama',
          onClick: function () {
            if (sisa <= 0.001) return;
            menyala = !menyala;
            bNyala.setLabel(menyala ? 'Padamkan' : 'Nyalakan');
            bNyala.setIkon(menyala ? '💨' : '🔥');
          }
        });
        var bUlang = ui.tombol({
          label: 'Ulang', ikon: '↺', jenis: 'kedua',
          onClick: function () {
            menyala = false; sisa = 1; suhu = 27; waktu = 0;
            asap.bersihkan();
            bNyala.setLabel('Nyalakan'); bNyala.setIkon('🔥');
            api.resetGrafik();
          }
        });

        return [
          ui.grup('Bahan', [sBahan.el]),
          ui.grup('Kendali percobaan', [ui.barisTombol([bNyala, bUlang])]),
          ui.grup('Catatan keselamatan', [
            el('p.kontrol__ket',
              'Di laboratorium sungguhan, pembakaran selalu dilakukan di bawah pengawasan guru, ' +
              'jauh dari bahan mudah terbakar, dan dengan ventilasi yang baik.')
          ])
        ];
      },

      pembacaan: function () {
        return [
          { kunci: 'massa', label: 'Massa bahan', nilai: '5,0', satuan: 'g', warna: 'aksen' },
          { kunci: 'suhu', label: 'Suhu nyala', nilai: '27', satuan: '°C' },
          { kunci: 'sisa', label: 'Zat sisa', nilai: '–' },
          { kunci: 'waktu', label: 'Waktu', nilai: '0', satuan: 's' }
        ];
      },

      langkah: function (dt) {
        if (menyala && sisa > 0) {
          waktu += dt;
          sisa = Math.max(0, sisa - dt / d().durasi);
          suhu = suhu + (d().suhuApi - suhu) * dt * 1.4;
          if (sisa <= 0) { menyala = false; if (bNyala) { bNyala.setLabel('Habis'); bNyala.nonaktif(true); } }
          api.rekam({ x: waktu, massa: massa() });
        } else {
          suhu = suhu + (27 - suhu) * dt * 0.8;
        }
        asap.langkah(dt);
      },

      gambar: function (ctx, W, H, t) {
        gambarMeja(ctx, W, H);
        var dasar = H * MEJA_Y;
        var cx = W * 0.5;
        var puncakApi = dasar;

        if (bahan === 'kertas') {
          /* Berkas gambar memuat dua bagian: lembar kertas di kiri, abu di kanan. */
          // Abu menumpuk seiring kertas habis.
          if (sisa < 0.98) {
            taruhPotong(ctx, imgKertasAbu, POTONG.abu, cx, dasar, {
              lebar: W * (0.20 + 0.28 * (1 - sisa)),
              alpha: clamp((1 - sisa) * 1.5, 0, 1)
            });
          }
          if (sisa > 0.01) {
            // Kertas putih di atas latar terang perlu bayangan agar tepinya terbaca.
            ctx.save();
            ctx.shadowColor = 'rgba(30,50,70,.28)';
            ctx.shadowBlur = 14;
            ctx.shadowOffsetY = 5;
            var kertas = taruhPotong(ctx, imgKertasAbu, POTONG.kertas, cx, dasar - H * 0.01, {
              tinggi: H * 0.58 * (0.35 + 0.65 * sisa),
              alpha: clamp(sisa * 1.7, 0, 1)
            });
            ctx.restore();
            if (kertas) puncakApi = kertas.y + kertas.h * 0.3;
          }
          if (menyala) {
            ctx.globalAlpha = 0.82;
            Lab.gambarApi(ctx, cx, dasar - H * 0.01, W * 0.11, (dasar - puncakApi) + H * 0.08, t);
            ctx.globalAlpha = 1;
          }

        } else {
          /* Lilin: badan memendek, sumbu dan nyala digambar ulang di atasnya. */
          if (imgLilin.siap) {
            var lw0 = imgLilin.naturalWidth, lh0 = imgLilin.naturalHeight;
            var sy = lh0 * 0.245;                       // potong tepat di bawah nyala bawaan
            var sh = lh0 - sy;
            var tinggiPenuh = H * 0.52;
            var tinggi = tinggiPenuh * (0.30 + 0.70 * sisa);
            var lebar = tinggi * ((lw0) / sh);
            ctx.drawImage(imgLilin, 0, sy, lw0, sh, cx - lebar / 2, dasar - tinggi, lebar, tinggi);
            puncakApi = dasar - tinggi;
          }
          if (menyala) {
            Lab.gambarApi(ctx, cx, puncakApi + 3, W * 0.055, H * 0.16, t);
          }
        }

        /* Asap: hanya muncul ketika ada nyala. */
        if (menyala && Math.random() < 0.65) {
          asap.lepas({
            x: cx + rnd(-8, 8),
            y: puncakApi - H * (bahan === 'kertas' ? 0.16 : 0.17),
            vy: rnd(-70, -34), vx: rnd(-14, 14),
            r: rnd(6, 13), tumbuh: 20, goyang: 18,
            maksUmur: rnd(1.2, 2.2),
            warna: bahan === 'kertas' ? '#9aa2a8' : '#c8ccd0',
            alpha: 0.55, jenis: 'asap'
          });
        }
        asap.gambar(ctx);
      },

      status: function () {
        if (sisa <= 0.001) return { teks: 'Bahan habis terbakar', jenis: 'kimia' };
        if (menyala) return { teks: 'Sedang terbakar', jenis: 'kimia' };
        return { teks: 'Belum dinyalakan', jenis: 'netral' };
      },

      nilai: function () {
        return {
          massa: num(massa(), 1),
          suhu: num(suhu, 0),
          sisa: sisa > 0.98 ? '–' : (bahan === 'kertas' ? 'Abu + asap' : 'Uap air + CO₂'),
          waktu: num(waktu, 0)
        };
      },

      selesai: function () { return sisa <= 0.001; },

      rekamJurnal: function () {
        var kertas = bahan === 'kertas';
        return {
          percobaan: 'Pembakaran ' + d().nama.toLowerCase(),
          jenis: 'kimia',
          ciri: {
            warna: kertas ? 'Putih → hitam (abu)' : 'Lilin memendek, sumbu menghitam',
            suhu: 'Naik tajam, memancarkan kalor dan cahaya',
            gas: kertas ? 'Asap, karbon dioksida, dan uap air' : 'Karbon dioksida dan uap air',
            endapan: kertas ? 'Abu sebagai zat sisa' : false,
            wujud: false,
            bau: 'Timbul bau khas pembakaran'
          },
          zatBaru: true,
          bisaBalik: false,
          data: {
            'Bahan': d().nama,
            'Massa awal': num(d().massaAwal, 1) + ' g',
            'Massa akhir': num(massa(), 1) + ' g',
            'Suhu tertinggi': num(suhu, 0) + ' °C',
            'Lama pembakaran': num(waktu, 0) + ' s'
          },
          kesimpulan: 'Bahan bereaksi dengan oksigen menghasilkan zat baru berupa gas dan abu, disertai kalor ' +
            'dan cahaya. Abu tidak dapat diubah kembali menjadi ' + d().nama.toLowerCase() +
            ' → perubahan kimia.'
        };
      }
    };
  }

  /* ================= Modul ================= */

  Lab.registerModule({
    id: 'reaksi',
    judul: 'Reaksi Kimia Sederhana',

    mount: function (view) {
      var aktif = null;
      var grafik = null;
      var baca = null;
      var antrean = [];
      var sudahDicatat = false;

      /* Antarmuka yang dipakai tiap percobaan untuk berbicara dengan modul. */
      var api = {
        wadah: { x: 0, y: 0, w: 10, h: 10 },
        antre: function (fn) { antrean.push(fn); },
        rekam: function (t) { if (grafik) grafik.tambah(t); },
        resetGrafik: function () { if (grafik) grafik.reset(); sudahDicatat = false; },
        segarkan: function () { /* diisi setelah tata letak siap */ }
      };

      var PERCOBAAN = {
        soda: buatSoda(api),
        karat: buatKarat(api),
        bakar: buatBakar(api)
      };

      view.appendChild(ui.kepalaModul({
        kategori: 'Modul 3 · Perubahan kimia',
        judul: 'Reaksi Kimia Sederhana',
        warna: 'kimia',
        ringkas: 'Tiga percobaan yang memperlihatkan ciri-ciri perubahan kimia: timbulnya gas, perubahan warna karena zat baru, dan pembakaran.'
      }));

      view.appendChild(ui.instruksi({
        id: 'reaksi',
        judul: 'Petunjuk kegiatan',
        tujuan: 'Mengidentifikasi ciri-ciri perubahan kimia dari hasil percobaan.',
        langkah: [
          'Pilih salah satu percobaan pada tab di atas panel kontrol.',
          'Atur variabelnya, jalankan percobaan, lalu amati apa yang berubah: warna, suhu, gas, atau zat sisanya.',
          'Perhatikan panel <strong>Ciri perubahan yang terdeteksi</strong> — semua ciri itu tercatat otomatis ke jurnal.',
          'Bandingkan ketiga percobaan: adakah yang bisa dikembalikan ke keadaan semula?'
        ]
      }));

      var tata = ui.tataLetak({ warna: 'kimia' });
      view.appendChild(tata.el);

      var kanvas = el('canvas', { 'aria-label': 'Simulasi reaksi kimia' });
      var hud = el('.panggung__hud');
      tata.panggung.appendChild(el('.panggung', [kanvas, hud]));
      var lencanaStatus = ui.lencana('Belum dimulai', 'netral');
      hud.appendChild(lencanaStatus);

      var pemilih = ui.segmen({
        label: 'Pilih percobaan',
        opsi: [
          { nilai: 'soda', label: 'Cuka + Soda', ikon: '🫧' },
          { nilai: 'karat', label: 'Berkarat', ikon: '🔩' },
          { nilai: 'bakar', label: 'Pembakaran', ikon: '🔥' }
        ],
        nilai: 'soda',
        onChange: function (v) { pilih(v); }
      });

      var panelKontrol = el('.panel__isi');
      var panelData = el('.panel__isi');
      var panelCiri = el('.panel__isi');

      tata.kontrol.appendChild(el('section.panel', [
        el('.panel__kepala', el('h2.panel__judul', 'Panel kontrol')),
        el('.panel__isi', pemilih.el),
        panelKontrol
      ]));
      tata.kontrol.appendChild(el('section.panel', [
        el('.panel__kepala', el('h2.panel__judul', 'Data pengamatan')),
        panelData
      ]));

      var panelGrafik = el('.panel__isi');
      tata.data.appendChild(el('section.panel', [
        el('.panel__kepala', el('h2.panel__judul', 'Grafik hasil percobaan')),
        panelGrafik
      ]));

      tata.data.appendChild(el('section.panel', [
        el('.panel__kepala', el('h2.panel__judul', 'Ciri perubahan yang terdeteksi')),
        panelCiri
      ]));

      api.segarkan = function () { bangunPanel(); };

      function bangunPanel() {
        Lab.clear(panelKontrol);
        Lab.clear(panelData);
        antrean.length = 0;

        panelKontrol.appendChild(el('div', aktif.kontrol()));

        baca = ui.pembacaan(aktif.pembacaan());
        panelData.appendChild(baca.el);
        panelData.appendChild(el('p.kontrol__ket', { style: { marginTop: '.7rem' } }, aktif.ringkas));
        var tambah = aktif.tambahan && aktif.tambahan();
        if (tambah) panelData.appendChild(el('div', { style: { marginTop: '.8rem' } }, tambah));

        var bCatat = ui.tombol({
          label: 'Catat observasi', ikon: '📓', jenis: 'kedua',
          onClick: function () { catat(); }
        });
        panelData.appendChild(el('div', { style: { marginTop: '.8rem' } }, bCatat.el));

        segarkanCiri();
      }

      function bangunGrafik() {
        Lab.clear(panelGrafik);
        var kanvasGrafik = el('canvas.grafik__kanvas', { 'aria-label': 'Grafik hasil percobaan ' + aktif.judul });
        grafik = Lab.Grafik(kanvasGrafik, aktif.grafik);
        panelGrafik.appendChild(el('.grafik', [
          kanvasGrafik,
          grafik.legenda(),
          el('p.kontrol__ket', aktif.keteranganGrafik)
        ]));
      }

      function segarkanCiri() {
        Lab.clear(panelCiri);
        var rekam = aktif.rekamJurnal();
        var daftar = Lab.jurnal.CIRI.filter(function (c) { return rekam.ciri[c.kunci]; });

        panelCiri.appendChild(el('.klas__papan', [
          el('div', [
            el('h3', { style: { fontSize: '.9rem', marginBottom: '.6rem' } }, 'Yang teramati'),
            daftar.length
              ? el('ul', { style: { margin: 0, paddingLeft: '1.1rem', fontSize: '.88rem', color: 'var(--tinta-2)' } },
                  daftar.map(function (c) {
                    return el('li', { style: { marginBottom: '.3rem' } },
                      [el('strong', c.ikon + ' ' + c.label + ': '), String(rekam.ciri[c.kunci])]);
                  }))
              : el('p.kontrol__ket', 'Jalankan percobaan untuk memunculkan ciri perubahannya.')
          ]),
          el('div', [
            el('h3', { style: { fontSize: '.9rem', marginBottom: '.6rem' } }, 'Kesimpulan sementara'),
            el('p', { style: { fontSize: '.88rem', color: 'var(--tinta-2)', margin: '0 0 .6rem' } }, rekam.kesimpulan),
            el('div', { style: { display: 'flex', gap: '.4rem', flexWrap: 'wrap' } }, [
              ui.lencana(rekam.zatBaru ? 'Zat baru terbentuk' : 'Tidak ada zat baru', rekam.zatBaru ? 'kimia' : 'fisika'),
              ui.lencana(rekam.bisaBalik ? 'Dapat dibalik' : 'Sulit dibalik', rekam.bisaBalik ? 'fisika' : 'kimia')
            ])
          ])
        ]));
      }

      function catat() {
        var rekam = aktif.rekamJurnal();
        rekam.modul = 'reaksi';
        rekam.modulJudul = 'Reaksi Kimia Sederhana';
        Lab.jurnal.catat(rekam);
      }

      function pilih(id) {
        aktif = PERCOBAAN[id];
        sudahDicatat = false;
        bangunPanel();
        bangunGrafik();
      }

      /* ----- LKPD & kuis ----- */
      tata.data.appendChild(Lab.buatLKPD({
        modul: 'reaksi',
        soal: [
          'Pada percobaan cuka + baking soda, ciri perubahan kimia apa saja yang kamu amati? Sebutkan minimal tiga beserta datanya.',
          'Suhu campuran cuka dan baking soda justru turun. Apakah reaksi yang menyerap kalor tetap tergolong perubahan kimia? Jelaskan.',
          'Bandingkan laju perkaratan pada kelembapan 20 % dan 90 %. Tuliskan angkanya, lalu simpulkan syarat terjadinya perkaratan.',
          'Massa kertas berkurang setelah dibakar. Apakah ini berarti massa zat hilang? Jelaskan menggunakan gagasan gas hasil pembakaran.',
          'Dari ketiga percobaan, tuliskan satu alasan utama mengapa semuanya digolongkan sebagai perubahan kimia.'
        ]
      }));

      tata.data.appendChild(Lab.buatKuis({
        modul: 'reaksi',
        soal: [
          {
            tanya: 'Ciri paling jelas bahwa cuka dan baking soda mengalami perubahan kimia adalah…',
            opsi: [
              'Cairannya menjadi dingin saja',
              'Terbentuk gas karbon dioksida yang tidak ada pada bahan semula',
              'Warna cuka menjadi lebih pekat',
              'Volume cairan bertambah'
            ],
            benar: 1,
            bahas: 'Gas CO₂ adalah zat baru yang tidak terdapat pada cuka maupun baking soda. Munculnya zat baru adalah ciri utama perubahan kimia.'
          },
          {
            tanya: 'Besi berkarat memerlukan…',
            opsi: [
              'Air dan oksigen',
              'Cahaya matahari langsung',
              'Suhu di atas 100 °C',
              'Tekanan udara yang tinggi'
            ],
            benar: 0,
            bahas: 'Perkaratan adalah reaksi besi dengan oksigen dan air. Karena itu besi di tempat lembap — apalagi dekat laut — jauh lebih cepat berkarat.'
          },
          {
            tanya: 'Kertas seberat 5 gram dibakar dan menyisakan abu 0,3 gram. Pernyataan yang benar adalah…',
            opsi: [
              'Massa zat hilang sebanyak 4,7 gram',
              'Sebagian besar massa berubah menjadi gas yang terbang ke udara',
              'Abu adalah kertas yang hanya berubah warna',
              'Reaksi itu melanggar hukum kekekalan massa'
            ],
            benar: 1,
            bahas: 'Massa total tetap. Sebagian besar bahan berubah menjadi karbon dioksida dan uap air yang lepas ke udara, sehingga yang tersisa di wadah hanya abu.'
          },
          {
            tanya: 'Manakah yang membedakan perubahan kimia dari perubahan fisika?',
            opsi: [
              'Perubahan kimia selalu disertai kenaikan suhu',
              'Perubahan kimia selalu menghasilkan gas',
              'Perubahan kimia menghasilkan zat baru dan umumnya sulit dibalik',
              'Perubahan kimia hanya terjadi di laboratorium'
            ],
            benar: 2,
            bahas: 'Suhu bisa naik atau turun, dan gas tidak selalu muncul. Penanda utamanya adalah terbentuknya zat baru dengan sifat yang berbeda.'
          }
        ]
      }));

      /* ----- loop ----- */
      pilih('soda');

      var frame = 0;
      var loop = Lab.loop(function (dt, t) {
        var k = Lab.siapkanKanvas(kanvas);
        k.ctx.clearRect(0, 0, k.w, k.h);

        aktif.langkah(dt);
        aktif.gambar(k.ctx, k.w, k.h, t);

        // Emitor butuh posisi wadah, yang baru diketahui setelah menggambar.
        while (antrean.length) antrean.shift()(api.wadah);

        if (frame % 4 === 0 && baca) {
          var nilai = aktif.nilai();
          Object.keys(nilai).forEach(function (kunci) { baca.set(kunci, nilai[kunci]); });
          var st = aktif.status();
          lencanaStatus.textContent = st.teks;
          lencanaStatus.dataset.jenis = st.jenis;
        }
        if (frame % 10 === 0) segarkanCiriRingan();
        if (frame % 5 === 0 && grafik) grafik.gambar();

        if (aktif.selesai() && !sudahDicatat) {
          sudahDicatat = true;
          catat();
        }
        frame++;
      });

      var ciriTerakhir = '';
      function segarkanCiriRingan() {
        var sidik = JSON.stringify(aktif.rekamJurnal().ciri);
        if (sidik === ciriTerakhir) return;
        ciriTerakhir = sidik;
        segarkanCiri();
      }

      loop.start();
      this._loop = loop;
    },

    unmount: function () {
      if (this._loop) this._loop.stop();
      this._loop = null;
    }
  });

})(window.Lab);
