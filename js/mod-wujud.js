/* Lab Virtual — Perubahan Materi
 * Modul 1 — Perubahan Wujud Zat.
 *
 * Model kalor memakai tetapan air yang sebenarnya, jadi grafik suhu-vs-waktu
 * memperlihatkan dua dataran (plateau): saat melebur dan saat mendidih suhu
 * berhenti naik walaupun api terus menyala. Itulah inti pelajarannya.
 */
(function (Lab) {
  'use strict';

  var el = Lab.el, ui = Lab.ui, num = Lab.num, clamp = Lab.clamp;

  /* ---------- Tetapan zat (air, 100 gram) ---------- */
  var M = 100;              // gram
  var C_ES = 2.10, C_AIR = 4.18, C_UAP = 2.00;   // J/g°C
  var L_LEBUR = 334, L_UAP = 2260;               // J/g
  var T_AWAL = -25, T_AKHIR = 140;               // °C
  var T_RUANG = 25;

  var E1 = M * C_ES * (0 - T_AWAL);          // es −25 °C → 0 °C
  var E2 = E1 + M * L_LEBUR;                 // seluruh es melebur
  var E3 = E2 + M * C_AIR * 100;             // air 0 °C → 100 °C
  var E4 = E3 + M * L_UAP;                   // seluruh air menguap
  var E_MAKS = E4 + M * C_UAP * (T_AKHIR - 100);

  var DAYA_PANAS = 5500;    // watt pada pemanas 100 %
  var DAYA_DINGIN = 3000;   // watt pada pendingin 100 %
  var RUGI = 12;            // watt per °C selisih dengan suhu ruang

  var WARNA_FASE = ['#6ea9dd', '#3f8fd8', '#8dbfe6'];

  /* ---------- Tata letak panggung (pecahan dari lebar/tinggi kanvas) ---------- */
  var TL = {
    mejaY: 0.93,
    lampuCx: 0.44, lampuT: 0.20,
    kasaY: 0.50,
    gelasCx: 0.44, gelasAtas: 0.10,
    // Termometer diturunkan agar ujung atasnya tidak tertutup kartu data pengamatan.
    termoCx: 0.86, termoAtas: 0.26, termoT: 0.60
  };

  /* Kotak dalam gelas beaker, sebagai pecahan dari kotak gambar gelas. */
  var DALAM = { x: 0.20, y: 0.13, w: 0.60, h: 0.75 };

  function suhuDari(E) {
    if (E < E1) return T_AWAL + E / (M * C_ES);
    if (E < E2) return 0;
    if (E < E3) return (E - E2) / (M * C_AIR);
    if (E < E4) return 100;
    return 100 + (E - E4) / (M * C_UAP);
  }

  function fraksiCair(E) { return clamp((E - E1) / (E2 - E1), 0, 1); }
  function fraksiGas(E) { return clamp((E - E3) / (E4 - E3), 0, 1); }

  function namaWujud(E, naik) {
    if (E < E1) return { teks: 'Padat (es)', kode: 'padat' };
    if (E < E2) return naik
      ? { teks: 'Melebur — padat → cair', kode: 'lebur' }
      : { teks: 'Membeku — cair → padat', kode: 'beku' };
    if (E < E3) return { teks: 'Cair (air)', kode: 'cair' };
    if (E < E4) return naik
      ? { teks: 'Mendidih — cair → gas', kode: 'didih' }
      : { teks: 'Mengembun — gas → cair', kode: 'embun' };
    return { teks: 'Gas (uap air)', kode: 'gas' };
  }

  Lab.registerModule({
    id: 'wujud',
    judul: 'Perubahan Wujud Zat',

    mount: function (view) {
      /* ----- keadaan simulasi ----- */
      var E = 0;
      var waktu = 0;
      var berjalan = false;
      var daya = 0;          // −1 … 1
      var lajuWaktu = 1;
      var dEsebelum = 0;
      var tandaTercatat = {};

      var sistem = Lab.SistemPartikel({ jumlah: 110, radius: 6.4 });
      var uap = Lab.Emitor({ maks: 90 });
      var gelembung = Lab.Emitor({ maks: 120 });

      var imgGelas = Lab.gambar('beaker');
      var imgLampu = Lab.gambar('bunsen');
      var imgTermo = Lab.gambar('termometer');

      /* ----- kerangka halaman ----- */
      view.appendChild(ui.kepalaModul({
        kategori: 'Modul 1 · Perubahan fisika',
        judul: 'Perubahan Wujud Zat',
        warna: 'fisika',
        ringkas: 'Panaskan 100 gram es dari −25 °C sampai menjadi uap. Perhatikan susunan partikel dan cari tahu mengapa suhu sempat berhenti naik.'
      }));

      view.appendChild(ui.instruksi({
        id: 'wujud',
        judul: 'Petunjuk kegiatan',
        tujuan: 'Menjelaskan hubungan kalor, suhu, gerak partikel, dan perubahan wujud zat.',
        langkah: [
          'Geser <strong>Daya pemanas</strong> ke kanan, lalu tekan <strong>Jalankan</strong>.',
          'Amati gerak partikel: makin panas, makin cepat bergetar dan makin renggang susunannya.',
          'Perhatikan grafik. Catat pada suhu berapa garisnya <strong>mendatar</strong> — itu saat zat sedang berubah wujud.',
          'Setelah semua air menguap, geser slider ke kiri (pendingin) untuk membalik prosesnya.',
          'Isi LKPD di bawah, lalu kerjakan kuis reflektifnya.'
        ]
      }));

      var tata = ui.tataLetak({ warna: 'fisika' });
      view.appendChild(tata.el);

      /* ----- panggung ----- */
      var kanvas = el('canvas', { 'aria-label': 'Simulasi pemanasan es di dalam gelas beaker' });
      var hud = el('.panggung__hud');
      tata.panggung.appendChild(el('.panggung', [kanvas, hud]));

      var lencanaWujud = ui.lencana('Padat (es)', 'fisika');
      var lencanaProses = ui.lencana('Diam', 'netral');
      hud.appendChild(lencanaWujud);
      hud.appendChild(lencanaProses);

      /* ----- kontrol ----- */
      var sDaya = ui.slider({
        label: 'Daya pemanas', min: -100, max: 100, step: 1, nilai: 0, satuan: '%',
        keterangan: 'Nilai negatif berarti zat didinginkan (kalor dilepas).',
        tanda: [{ nilai: -100, label: 'dingin' }, { nilai: 0, label: '0' }, { nilai: 100, label: 'panas' }],
        onInput: function (v) { daya = v / 100; }
      });

      var sLaju = ui.segmen({
        label: 'Kecepatan waktu',
        opsi: [{ nilai: '1', label: '1×' }, { nilai: '2', label: '2×' }, { nilai: '4', label: '4×' }],
        nilai: '1',
        keterangan: 'Mendidih memerlukan kalor jauh lebih besar daripada melebur, jadi tahap itu memang lama.',
        onChange: function (v) { lajuWaktu = +v; }
      });

      var bJalan = ui.tombol({
        label: 'Jalankan', ikon: '▶', jenis: 'utama',
        onClick: function () {
          berjalan = !berjalan;
          bJalan.setLabel(berjalan ? 'Jeda' : 'Jalankan');
          bJalan.setIkon(berjalan ? '⏸' : '▶');
        }
      });

      var bUlang = ui.tombol({
        label: 'Ulang', ikon: '↺', jenis: 'kedua',
        onClick: function () { ulang(); }
      });

      var bCatat = ui.tombol({
        label: 'Catat observasi', ikon: '📓', jenis: 'kedua',
        onClick: function () { catat(true); }
      });

      tata.kontrol.appendChild(ui.panel('Panel kontrol', [
        ui.grup('Sumber kalor', [sDaya.el, sLaju.el]),
        ui.grup('Kendali percobaan', [
          ui.barisTombol([bJalan, bUlang]),
          ui.barisTombol([bCatat])
        ])
      ]));

      var dataPengamatan = [
        { kunci: 'suhu', label: 'Suhu zat', nilai: '−25', satuan: '°C', warna: 'aksen' },
        { kunci: 'wujud', label: 'Wujud', nilai: 'Padat' },
        { kunci: 'kalor', label: 'Kalor diserap', nilai: '0', satuan: 'kJ' },
        { kunci: 'waktu', label: 'Waktu', nilai: '0', satuan: 's' }
      ];
      /* Data tampil dua kali: ringkas di atas panggung supaya bisa diamati
       * sambil melihat partikelnya, dan lengkap di panel samping. */
      var bacaPanel = ui.pembacaan(dataPengamatan);
      var bacaHud = ui.pembacaan(dataPengamatan, { gaya: 'panggung' });
      var baca = ui.gabungPembacaan([bacaPanel, bacaHud]);
      tata.panggung.appendChild(bacaHud.el);
      tata.kontrol.appendChild(ui.panel('Data pengamatan', bacaPanel.el));

      /* ----- grafik ----- */
      var kanvasGrafik = el('canvas.grafik__kanvas', {
        'aria-label': 'Grafik suhu zat terhadap waktu'
      });
      var grafik = Lab.Grafik(kanvasGrafik, {
        sumbuX: { label: 'Waktu percobaan (detik)', min: 0, max: 60 },
        sumbuY: { label: 'Suhu (°C)', min: T_AWAL - 5, max: T_AKHIR + 5 },
        seri: [{ kunci: 'suhu', label: 'Suhu zat', warna: '#c1541f', tebal: 2.4 }],
        garisBantu: [
          { y: 0, label: 'Titik lebur 0 °C', warna: '#1f6fb2' },
          { y: 100, label: 'Titik didih 100 °C', warna: '#c1541f' }
        ]
      });

      tata.data.appendChild(ui.panel('Grafik suhu terhadap waktu', el('.grafik', [
        kanvasGrafik,
        grafik.legenda(),
        el('p.kontrol__ket',
          'Bagian grafik yang mendatar menunjukkan kalor sedang dipakai untuk memutus susunan partikel, ' +
          'bukan untuk menaikkan suhu. Kalor itu disebut kalor laten.')
      ])));

      /* ----- LKPD & kuis ----- */
      tata.data.appendChild(Lab.buatLKPD({
        modul: 'wujud',
        soal: [
          'Pada suhu berapa grafik mendatar untuk pertama kali? Perubahan wujud apa yang sedang terjadi saat itu?',
          'Bandingkan susunan dan gerak partikel ketika zat berwujud padat, cair, dan gas. Tuliskan tiga perbedaannya.',
          'Dataran (bagian mendatar) saat mendidih jauh lebih panjang daripada saat melebur. Menurutmu mengapa demikian?',
          'Setelah semua air menguap, kamu mendinginkannya kembali. Apakah zat yang dihasilkan masih air? Jelaskan mengapa peristiwa ini termasuk perubahan fisika.'
        ]
      }));

      tata.data.appendChild(Lab.buatKuis({
        modul: 'wujud',
        soal: [
          {
            tanya: 'Saat es sedang melebur, pemanas terus menyala tetapi suhu tetap 0 °C. Ke mana perginya kalor itu?',
            opsi: [
              'Kalor hilang ke udara sekitar tanpa guna',
              'Kalor dipakai untuk memutus susunan partikel padat menjadi cair',
              'Kalor berubah menjadi zat baru',
              'Kalor tersimpan sebagai cahaya di dalam gelas'
            ],
            benar: 1,
            bahas: 'Kalor itu disebut kalor laten lebur. Energinya dipakai untuk melepaskan partikel dari kisi zat padat, sehingga suhu belum naik selama peleburan berlangsung.'
          },
          {
            tanya: 'Perbedaan utama partikel zat cair dibanding zat padat adalah…',
            opsi: [
              'Jumlah partikelnya bertambah',
              'Partikelnya berubah menjadi partikel jenis lain',
              'Jaraknya sedikit lebih renggang dan partikel bebas berpindah tempat',
              'Partikelnya berhenti bergerak'
            ],
            benar: 2,
            bahas: 'Jenis dan jumlah partikelnya tetap sama. Yang berubah hanya jarak dan kebebasan geraknya — karena itu perubahan wujud tergolong perubahan fisika.'
          },
          {
            tanya: 'Uap air didinginkan sampai kembali menjadi es. Peristiwa ini menunjukkan bahwa…',
            opsi: [
              'Perubahan wujud menghasilkan zat baru',
              'Perubahan wujud bersifat bolak-balik, sehingga termasuk perubahan fisika',
              'Air telah berubah menjadi senyawa lain',
              'Massa zat berkurang setiap kali berubah wujud'
            ],
            benar: 1,
            bahas: 'Air tetap air (H₂O) pada semua wujudnya. Karena tidak ada zat baru dan prosesnya dapat dibalik, perubahan wujud termasuk perubahan fisika.'
          },
          {
            tanya: 'Makin tinggi suhu suatu zat, gerak partikelnya…',
            opsi: [
              'Makin lambat karena partikel kelelahan',
              'Tidak berubah, hanya warnanya yang berubah',
              'Makin cepat karena energi kinetiknya bertambah',
              'Berhenti pada titik didih'
            ],
            benar: 2,
            bahas: 'Suhu adalah ukuran rata-rata energi kinetik partikel. Pada simulasi terlihat getaran partikel makin kuat seiring naiknya suhu.'
          }
        ]
      }));

      /* ---------- pencatatan otomatis ---------- */

      function catat(manual) {
        var T = suhuDari(E);
        var w = namaWujud(E, dEsebelum >= 0);
        Lab.jurnal.catat({
          modul: 'wujud',
          modulJudul: 'Perubahan Wujud Zat',
          percobaan: manual ? 'Pengamatan manual — ' + w.teks : w.teks,
          jenis: 'fisika',
          ciri: {
            wujud: w.teks,
            suhu: num(T, 1) + ' °C',
            warna: false, gas: false, endapan: false, bau: false
          },
          zatBaru: false,
          bisaBalik: true,
          data: {
            'Suhu': num(T, 1) + ' °C',
            'Kalor diserap': num(E / 1000, 1) + ' kJ',
            'Waktu': num(waktu, 1) + ' s'
          },
          kesimpulan: 'Tidak terbentuk zat baru — air tetap air, hanya susunan partikelnya yang berubah. Termasuk perubahan fisika karena dapat dibalik.'
        });
      }

      /** Mencatat sendiri tiap kali satu tahap perubahan wujud tuntas. */
      function periksaTonggak() {
        var fc = fraksiCair(E), fg = fraksiGas(E);
        var naik = dEsebelum >= 0;
        var tonggak = null;

        if (naik && fc >= 0.999 && fg <= 0.001) tonggak = 'lebur-selesai';
        else if (naik && fg >= 0.999) tonggak = 'didih-selesai';
        else if (!naik && fg <= 0.001 && E < E4 - 1 && E > E3) tonggak = 'embun-mulai';
        else if (!naik && fc <= 0.001 && E < E2) tonggak = 'beku-selesai';

        if (!tonggak || tandaTercatat[tonggak]) return;
        tandaTercatat[tonggak] = true;

        var judul = {
          'lebur-selesai': 'Melebur — seluruh es menjadi air',
          'didih-selesai': 'Menguap — seluruh air menjadi uap',
          'embun-mulai': 'Mengembun — uap kembali menjadi air',
          'beku-selesai': 'Membeku — seluruh air menjadi es'
        }[tonggak];

        Lab.jurnal.catat({
          modul: 'wujud',
          modulJudul: 'Perubahan Wujud Zat',
          percobaan: judul,
          jenis: 'fisika',
          ciri: {
            wujud: judul.split(' — ')[1],
            suhu: num(suhuDari(E), 0) + ' °C (tetap selama perubahan wujud)',
            warna: false, gas: false, endapan: false, bau: false
          },
          zatBaru: false,
          bisaBalik: true,
          data: {
            'Suhu perubahan wujud': num(suhuDari(E), 0) + ' °C',
            'Kalor total': num(E / 1000, 1) + ' kJ',
            'Waktu': num(waktu, 1) + ' s'
          },
          kesimpulan: 'Suhu tetap selama perubahan wujud karena kalor dipakai sebagai kalor laten. Zatnya tetap air → perubahan fisika.'
        });
      }

      function ulang() {
        E = 0; waktu = 0; dEsebelum = 0;
        tandaTercatat = {};
        berjalan = false;
        bJalan.setLabel('Jalankan'); bJalan.setIkon('▶');
        sDaya.set(0); daya = 0;
        grafik.reset();
        uap.bersihkan(); gelembung.bersihkan();
        sistem.reset(Lab.FASE.PADAT);
      }

      /* ---------- gambar ---------- */

      function gambarMeja(ctx, W, H) {
        var y = H * TL.mejaY;
        var g = ctx.createLinearGradient(0, y, 0, H);
        g.addColorStop(0, '#cbd7e2');
        g.addColorStop(1, '#aebecd');
        ctx.fillStyle = g;
        ctx.fillRect(0, y, W, H - y);
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.fillRect(0, y, W, 2);
      }

      function gambarKasa(ctx, W, H, gx, gw) {
        var y = H * TL.kasaY;
        var lebar = gw * 1.24;
        var x = gx + gw / 2 - lebar / 2;
        // Kawat kasa.
        ctx.fillStyle = '#8a9099';
        Lab.persegiBulat(ctx, x, y, lebar, 6, 3);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.4)';
        ctx.fillRect(x + 2, y + 1, lebar - 4, 1.5);
        // Kaki tiga.
        ctx.strokeStyle = '#79808a';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        var dasar = H * TL.mejaY;
        [[x + lebar * 0.1, x + lebar * 0.02], [x + lebar * 0.9, x + lebar * 0.98]].forEach(function (k) {
          ctx.beginPath();
          ctx.moveTo(k[0], y + 5);
          ctx.lineTo(k[1], dasar);
          ctx.stroke();
        });
      }

      function gambarTermometer(ctx, W, H, T) {
        if (!imgTermo.siap) return;
        var th = H * TL.termoT;
        var tw = th * (imgTermo.naturalWidth / imgTermo.naturalHeight);
        var tx = W * TL.termoCx - tw / 2;
        var ty = H * TL.termoAtas;

        ctx.drawImage(imgTermo, tx, ty, tw, th);

        // Tutup kolom bawaan gambar, lalu gambar kolom sesuai suhu simulasi.
        ctx.fillStyle = '#fdfdfd';
        ctx.fillRect(tx + tw * 0.50, ty + th * 0.09, tw * 0.145, th * 0.75);

        var Tt = clamp(T, -10, 100);
        function yUntuk(v) { return ty + th * (0.84 - (v + 10) / 110 * 0.715); }
        var atas = yUntuk(Tt);
        var bawah = ty + th * 0.865;
        var g = ctx.createLinearGradient(tx, 0, tx + tw, 0);
        g.addColorStop(0, '#c0261b');
        g.addColorStop(0.4, '#f0362a');
        g.addColorStop(1, '#b81f16');
        ctx.fillStyle = g;
        Lab.persegiBulat(ctx, tx + tw * 0.527, atas, tw * 0.09, bawah - atas, tw * 0.045);
        ctx.fill();

        if (T > 100 || T < -10) {
          ctx.font = '600 11px system-ui, sans-serif';
          ctx.fillStyle = '#c1541f';
          ctx.textAlign = 'center';
          ctx.fillText(T > 100 ? 'di luar skala' : 'di bawah skala', tx + tw / 2, ty - 4);
        }
      }

      function gambar(ctx, W, H, t) {
        ctx.clearRect(0, 0, W, H);
        gambarMeja(ctx, W, H);

        /* Letak gelas beaker. */
        var gh = H * (TL.kasaY - TL.gelasAtas);
        var rasio = imgGelas.naturalWidth && imgGelas.naturalHeight
          ? imgGelas.naturalWidth / imgGelas.naturalHeight : 1.04;
        var gw = gh * rasio;
        var gx = W * TL.gelasCx - gw / 2;
        var gy = H * TL.gelasAtas;

        /* Rongga dalam gelas — tempat partikel bergerak. */
        var dalam = {
          x: gx + gw * DALAM.x,
          y: gy + gh * DALAM.y,
          w: gw * DALAM.w,
          h: gh * DALAM.h
        };
        sistem.aturWadah(dalam);

        gambarKasa(ctx, W, H, gx, gw);

        /* Pembakar spiritus + nyala api. */
        if (imgLampu.siap) {
          var lh = H * TL.lampuT;
          var lw = lh * (imgLampu.naturalWidth / imgLampu.naturalHeight);
          var lx = W * TL.lampuCx - lw / 2;
          var ly = H * TL.mejaY - lh;
          ctx.drawImage(imgLampu, lx, ly, lw, lh);

          if (daya > 0.02) {
            var dasarApi = ly + lh * 0.055;
            var tinggi = (dasarApi - H * TL.kasaY) * clamp(daya, 0, 1) * 0.98;
            Lab.gambarApi(ctx, lx + lw * 0.497, dasarApi, lw * 0.30, tinggi, t);
          } else if (daya < -0.02) {
            // Pendingin: kabut dingin yang merambat naik dari bawah gelas.
            var kabut = ctx.createRadialGradient(
              gx + gw / 2, H * TL.kasaY, 4,
              gx + gw / 2, H * TL.kasaY, gw * 0.8);
            kabut.addColorStop(0, 'rgba(140,205,245,' + (0.34 * -daya) + ')');
            kabut.addColorStop(1, 'rgba(140,205,245,0)');
            ctx.fillStyle = kabut;
            ctx.fillRect(gx - gw * 0.4, H * TL.kasaY - gw * 0.5, gw * 1.8, gw * 1.3);
          }
        }

        /* Gelas beaker (badan). */
        if (imgGelas.siap) ctx.drawImage(imgGelas, gx, gy, gw, gh);

        /* Isi gelas: air, partikel, gelembung — dipotong sesuai rongga. */
        ctx.save();
        ctx.beginPath();
        ctx.rect(dalam.x, dalam.y, dalam.w, dalam.h);
        ctx.clip();

        var permukaan = sistem.permukaanCair();
        if (permukaan != null) {
          var suhu = suhuDari(E);
          var warnaAir = Lab.mix('#bfe0f4', '#7fc0e8', clamp(suhu / 100, 0, 1));
          ctx.globalAlpha = 0.55;
          ctx.fillStyle = warnaAir;
          Lab.permukaanBergelombang(ctx, dalam.x, permukaan - 4,
            dalam.w, dalam.y + dalam.h - permukaan + 4, t, E >= E3 ? 4 : 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        gelembung.gambar(ctx);
        sistem.gambar(ctx, WARNA_FASE);
        ctx.restore();

        /* Kilau kaca di depan isi gelas. */
        var kilau = ctx.createLinearGradient(gx, 0, gx + gw, 0);
        kilau.addColorStop(0, 'rgba(255,255,255,0)');
        kilau.addColorStop(0.13, 'rgba(255,255,255,.42)');
        kilau.addColorStop(0.2, 'rgba(255,255,255,0)');
        kilau.addColorStop(0.82, 'rgba(255,255,255,0)');
        kilau.addColorStop(0.9, 'rgba(255,255,255,.28)');
        kilau.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = kilau;
        ctx.fillRect(gx + gw * DALAM.x, dalam.y, dalam.w, dalam.h);

        /* Bibir gelas digambar ulang supaya tampak berada di depan isi. */
        if (imgGelas.siap) {
          var potong = imgGelas.naturalHeight * 0.13;
          ctx.drawImage(imgGelas, 0, 0, imgGelas.naturalWidth, potong,
            gx, gy, gw, gh * 0.13);
        }

        uap.gambar(ctx);
        gambarTermometer(ctx, W, H, suhuDari(E));
      }

      /* ---------- loop ---------- */

      var frame = 0;
      var loop = Lab.loop(function (dt, t) {
        var k = Lab.siapkanKanvas(kanvas);

        if (berjalan) {
          var langkah = dt * lajuWaktu;
          var T = suhuDari(E);
          var masuk = daya >= 0 ? daya * DAYA_PANAS : daya * DAYA_DINGIN;
          var keluar = RUGI * (T - T_RUANG);
          var dE = (masuk - keluar) * langkah;
          dEsebelum = dE;
          E = clamp(E + dE, 0, E_MAKS);
          waktu += langkah;

          sistem.aturFraksi(fraksiCair(E), fraksiGas(E));

          if (frame % 6 === 0) grafik.tambah({ x: waktu, suhu: suhuDari(E) });
          periksaTonggak();
        }

        var suhu = suhuDari(E);
        var fg = fraksiGas(E);
        var wadah = sistem.wadah;

        /* Uap keluar dari mulut gelas ketika sudah ada zat berwujud gas. */
        if (fg > 0.01 && Math.random() < fg * 0.9 + 0.06) {
          uap.lepas({
            x: wadah.x + Lab.rnd(0.15, 0.85) * wadah.w,
            y: wadah.y + 6,
            vy: Lab.rnd(-52, -26), vx: Lab.rnd(-10, 10),
            r: Lab.rnd(7, 15), tumbuh: 16, goyang: 14,
            maksUmur: Lab.rnd(1.1, 2.0), warna: '#eaf4fb',
            alpha: 0.7, jenis: 'uap'
          });
        }

        /* Gelembung di dalam air ketika mendidih. */
        if (E > E3 && E < E4 && berjalan) {
          for (var i = 0; i < 2; i++) {
            if (Math.random() > 0.55) continue;
            gelembung.lepas({
              x: wadah.x + Lab.rnd(0.12, 0.88) * wadah.w,
              y: wadah.y + wadah.h - Lab.rnd(2, 14),
              vy: Lab.rnd(-95, -45), r: Lab.rnd(2.5, 6),
              tumbuh: 5, goyang: 12, maksUmur: Lab.rnd(0.5, 1.1),
              warna: '#cfe9f8', alpha: 0.95
            });
          }
        }

        sistem.langkah(dt, Lab.norm(suhu, T_AWAL, T_AKHIR));
        uap.langkah(dt);
        gelembung.langkah(dt);

        gambar(k.ctx, k.w, k.h, t);

        /* Pembacaan angka & lencana. */
        if (frame % 4 === 0) {
          var w = namaWujud(E, dEsebelum >= 0);
          baca.set('suhu', num(suhu, 1).replace('-', '−'));
          baca.set('wujud', w.teks.split(' (')[0].split(' —')[0]);
          baca.set('kalor', num(E / 1000, 1));
          baca.set('waktu', num(waktu, 0));
          lencanaWujud.textContent = w.teks;
          lencanaProses.textContent = !berjalan ? 'Dijeda'
            : daya > 0.02 ? 'Menyerap kalor'
            : daya < -0.02 ? 'Melepas kalor' : 'Tanpa pemanas';
          lencanaProses.dataset.jenis = daya > 0.02 ? 'ingat' : daya < -0.02 ? 'fisika' : 'netral';
        }
        if (frame % 5 === 0) grafik.gambar();
        frame++;
      });

      sistem.reset(Lab.FASE.PADAT);
      loop.start();
      this._loop = loop;
    },

    unmount: function () {
      if (this._loop) this._loop.stop();
      this._loop = null;
    }
  });

})(window.Lab);
