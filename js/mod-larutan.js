/* Lab Virtual — Perubahan Materi
 * Modul 2 — Melarutkan Zat.
 *
 * Kelarutan garam hampir tidak berubah oleh suhu, sedangkan kelarutan gula naik
 * tajam. Perbedaan itulah yang dieksplorasi siswa lewat slider suhu dan pengadukan.
 */
(function (Lab) {
  'use strict';

  var el = Lab.el, ui = Lab.ui, num = Lab.num, clamp = Lab.clamp, rnd = Lab.rnd;

  var VOLUME = 50;   // mL air

  var ZAT = {
    garam: {
      nama: 'Garam dapur', rumus: 'NaCl', gambar: 'garam',
      maks: 40, langkah: 1,
      // Sekali sendok: cukup besar untuk melewati batas jenuh (± 17,9 g pada 25 °C).
      sendokMaks: 25, sendokLangkah: 1,
      // Kelarutan dalam g per 100 mL air.
      kelarutan: function (T) { return 35.7 + 0.028 * (T - 20); },
      warnaButir: '#dceaf2', warnaLarut: '#9fd0e8',
      catatan: 'Kelarutan garam nyaris tidak dipengaruhi suhu.'
    },
    gula: {
      nama: 'Gula pasir', rumus: 'C₁₂H₂₂O₁₁', gambar: 'gula',
      maks: 200, langkah: 5,
      sendokMaks: 120, sendokLangkah: 5,
      kelarutan: function (T) { return 203 + 2.6 * (T - 20); },
      warnaButir: '#f6efe0', warnaLarut: '#e8c98a',
      catatan: 'Kelarutan gula naik tajam saat air dipanaskan.'
    }
  };

  /* Tata letak panggung, pecahan dari lebar/tinggi kanvas. Gelas digeser ke kiri
   * dan sedikit diperkecil agar tersisa ruang untuk sendok yang menunggu. */
  var TL = { mejaY: 0.92, gelasCx: 0.42, gelasAtas: 0.17, gelasBawah: 0.90 };
  var DALAM = { x: 0.20, y: 0.13, w: 0.60, h: 0.75 };

  /* Sumbu sendok pada gambar aslinya miring −31,7°; dipakai untuk memutar. */
  var SUDUT_SENDOK = -31.7 * Math.PI / 180;
  var PANJANG_SENDOK = 0.836;   // panjang sumbu sebagai pecahan lebar gambar

  Lab.registerModule({
    id: 'larutan',
    judul: 'Melarutkan Zat',

    mount: function (view) {
      /* ----- keadaan ----- */
      var zatKini = 'garam';
      var massaSendok = 0;       // gram, zat yang sedang ditakar di sendok
      var massaDitambah = 0;     // gram, yang sudah masuk ke dalam air
      var massaLarut = 0;        // gram
      var suhu = 25;             // °C
      var mengaduk = false;
      var waktu = 0;
      var tanda = {};

      /* Zat ditakar dulu di sendok, baru dituang. Selama menuang, massaDitambah
       * naik bertahap mengikuti butiran yang benar-benar jatuh ke air. */
      var LAMA_TUANG = 2.0;
      var animTuang = null;      // { t, massa } atau null
      var butirJatuh = [];       // butiran yang sedang melayang turun

      var butiran = [];   // zat terlarut sebagai titik-titik dalam air
      var endapanButir = [];
      var imgGelas = Lab.gambar('beaker');
      var imgSendok = Lab.gambar('sendok');

      function zat() { return ZAT[zatKini]; }
      function kelarutanMaks() { return zat().kelarutan(suhu) * VOLUME / 100; }
      function konsentrasi() { return massaLarut / VOLUME * 100; }
      function endapan() { return Math.max(0, massaDitambah - massaLarut); }

      /* ----- kerangka ----- */
      view.appendChild(ui.kepalaModul({
        kategori: 'Modul 2 · Perubahan fisika',
        judul: 'Melarutkan Zat',
        warna: 'fisika',
        ringkas: 'Larutkan garam atau gula ke dalam 50 mL air. Ubah suhu dan pengadukan, lalu temukan batas kelarutan masing-masing zat.'
      }));

      view.appendChild(ui.instruksi({
        id: 'larutan',
        judul: 'Petunjuk kegiatan',
        tujuan: 'Menyelidiki pengaruh jenis zat, suhu, dan pengadukan terhadap kelarutan.',
        langkah: [
          'Pilih zat terlarut, lalu geser <strong>Massa zat di sendok</strong> — takarannya terlihat menumpuk di sendok.',
          'Tekan <strong>Tuangkan ke air</strong>. Butiran jatuh ke dasar gelas dan menumpuk sebagai <strong>endapan</strong>.',
          'Nyalakan <strong>Pengadukan</strong> dan amati endapan berkurang sampai habis larut.',
          'Ulangi penuangan sampai endapan tidak mau larut lagi walau diaduk — itu tanda larutan sudah jenuh.',
          'Saat sudah ada endapan, naikkan suhu air. Bandingkan hasilnya pada garam dan pada gula.',
          'Perhatikan: apakah garam berubah menjadi zat lain, atau hanya menyebar di antara partikel air?'
        ]
      }));

      var tata = ui.tataLetak({ warna: 'fisika' });
      view.appendChild(tata.el);

      var kanvas = el('canvas', { 'aria-label': 'Simulasi pelarutan zat dalam gelas beaker' });
      var hud = el('.panggung__hud');
      tata.panggung.appendChild(el('.panggung', [kanvas, hud]));

      var lencanaStatus = ui.lencana('Belum jenuh', 'fisika');
      var lencanaAduk = ui.lencana('Tidak diaduk', 'netral');
      hud.appendChild(lencanaStatus);
      hud.appendChild(lencanaAduk);

      /* ----- kontrol ----- */
      var sZat = ui.segmen({
        label: 'Zat terlarut',
        opsi: [
          { nilai: 'garam', label: 'Garam', ikon: '🧂' },
          { nilai: 'gula', label: 'Gula', ikon: '🍬' }
        ],
        nilai: 'garam',
        onChange: function (v) {
          zatKini = v;
          gantiZat();
        }
      });

      var sMassa = ui.slider({
        label: 'Massa zat di sendok', min: 0, max: ZAT.garam.sendokMaks, step: ZAT.garam.sendokLangkah,
        nilai: 0, satuan: 'gram',
        keterangan: 'Takaran ini terlihat menumpuk di sendok, belum masuk ke air.',
        onInput: function (v) { massaSendok = v; segarkanTuang(); }
      });

      var bTuang = ui.tombol({
        label: 'Tuangkan ke air', ikon: '🥄', jenis: 'utama',
        onClick: function () {
          if (animTuang || massaSendok <= 0) return;
          animTuang = { t: 0, massa: massaSendok, sudahMasuk: 0 };
          segarkanTuang();
        }
      });

      /* Dipanggil setiap kali takaran berubah supaya tombol langsung ikut
       * aktif/mati, tidak menunggu putaran loop berikutnya. */
      function segarkanTuang() {
        bTuang.nonaktif(!!animTuang || massaSendok <= 0);
      }

      var sSuhu = ui.slider({
        label: 'Suhu air', min: 5, max: 90, step: 1, nilai: 25, satuan: '°C',
        keterangan: 'Air panas membuat partikel bergerak lebih cepat.',
        tanda: [{ nilai: 5, label: 'dingin' }, { nilai: 90, label: 'panas' }],
        onInput: function (v) { suhu = v; }
      });

      var sAduk = ui.saklar({
        label: 'Pengadukan',
        keterangan: 'Mengaduk mempercepat pelarutan, tetapi tidak menambah batas kelarutan.',
        onChange: function (v) { mengaduk = v; }
      });

      var bUlang = ui.tombol({
        label: 'Ulang percobaan', ikon: '↺', jenis: 'kedua',
        onClick: function () { ulang(); }
      });
      var bCatat = ui.tombol({
        label: 'Catat observasi', ikon: '📓', jenis: 'kedua',
        onClick: function () { catat('Pengamatan manual'); }
      });

      tata.kontrol.appendChild(ui.panel('Panel kontrol', [
        ui.grup('Langkah 1 — Takar zat', [sZat.el, sMassa.el, ui.barisTombol([bTuang])]),
        ui.grup('Langkah 2 — Perlakuan', [sSuhu.el, sAduk.el]),
        ui.grup('Kendali percobaan', [ui.barisTombol([bUlang, bCatat])])
      ]));

      var dataPengamatan = [
        { kunci: 'larut', label: 'Zat terlarut', nilai: '0', satuan: 'g', warna: 'aksen' },
        { kunci: 'endapan', label: 'Endapan', nilai: '0', satuan: 'g' },
        { kunci: 'kons', label: 'Konsentrasi', nilai: '0', satuan: 'g/100 mL' },
        { kunci: 'batas', label: 'Batas kelarutan', nilai: '0', satuan: 'g' }
      ];
      /* Salinan ringkas menempel di atas panggung supaya angkanya terbaca
       * bersamaan dengan kristal yang sedang melarut. */
      var bacaPanel = ui.pembacaan(dataPengamatan);
      var bacaHud = ui.pembacaan(dataPengamatan, { gaya: 'panggung' });
      var baca = ui.gabungPembacaan([bacaPanel, bacaHud]);
      tata.panggung.appendChild(bacaHud.el);
      tata.kontrol.appendChild(ui.panel('Data pengamatan', [
        bacaPanel.el,
        el('p.kontrol__ket', { style: { marginTop: '.7rem' } }, ZAT.garam.catatan)
      ]));
      var catatanZat = tata.kontrol.querySelector('.panel:last-child .kontrol__ket');

      /* ----- grafik ----- */
      var garisBatas = { y: 0, label: 'Batas kelarutan pada suhu ini', warna: '#c1541f' };
      var kanvasGrafik = el('canvas.grafik__kanvas', {
        'aria-label': 'Grafik konsentrasi larutan terhadap waktu'
      });
      var grafik = Lab.Grafik(kanvasGrafik, {
        sumbuX: { label: 'Waktu percobaan (detik)', min: 0, max: 60, jendela: 60 },
        sumbuY: { label: 'Konsentrasi (g/100 mL)', min: 0, max: 60, auto: true },
        seri: [{ kunci: 'kons', label: 'Konsentrasi larutan', warna: '#1f6fb2', tebal: 2.4 }],
        garisBantu: [garisBatas]
      });

      tata.data.appendChild(ui.panel('Grafik konsentrasi terhadap waktu', el('.grafik', [
        kanvasGrafik,
        grafik.legenda(),
        el('p.kontrol__ket',
          'Garis putus-putus adalah batas kelarutan. Konsentrasi larutan tidak dapat melewati garis itu — ' +
          'kelebihan zat akan mengendap di dasar gelas.')
      ])));

      /* ----- LKPD & kuis ----- */
      tata.data.appendChild(Lab.buatLKPD({
        modul: 'larutan',
        soal: [
          'Berapa gram garam yang masih dapat larut dalam 50 mL air pada suhu 25 °C? Bagaimana kamu tahu bahwa larutan sudah jenuh?',
          'Ulangi dengan gula. Zat manakah yang lebih mudah larut? Sertakan angka dari data pengamatanmu.',
          'Naikkan suhu air ketika sudah ada endapan. Bandingkan apa yang terjadi pada garam dan pada gula, lalu jelaskan sebabnya.',
          'Apakah pengadukan mengubah jumlah zat yang dapat larut, atau hanya mengubah kecepatannya? Buktikan dengan data.',
          'Air garam dapat dipanaskan sampai airnya menguap sehingga garam muncul kembali. Mengapa pelarutan termasuk perubahan fisika?'
        ]
      }));

      tata.data.appendChild(Lab.buatKuis({
        modul: 'larutan',
        soal: [
          {
            tanya: 'Larutan disebut jenuh apabila…',
            opsi: [
              'Airnya berubah warna menjadi keruh',
              'Zat terlarut tidak dapat larut lagi sehingga sisanya mengendap',
              'Suhu larutan mencapai 100 °C',
              'Pengadukan dihentikan'
            ],
            benar: 1,
            bahas: 'Larutan jenuh berarti pelarut sudah menampung zat terlarut sebanyak-banyaknya pada suhu tersebut. Tambahan zat berikutnya akan mengendap.'
          },
          {
            tanya: 'Mengaduk larutan menyebabkan…',
            opsi: [
              'Batas kelarutan bertambah besar',
              'Zat terlarut berubah menjadi zat baru',
              'Pelarutan berlangsung lebih cepat, tetapi batas kelarutannya tetap',
              'Suhu larutan naik drastis'
            ],
            benar: 2,
            bahas: 'Pengadukan hanya mempercepat pertemuan partikel zat terlarut dengan air. Batas kelarutan ditentukan oleh jenis zat dan suhu.'
          },
          {
            tanya: 'Dari percobaan, pengaruh suhu terhadap kelarutan gula dibandingkan garam adalah…',
            opsi: [
              'Sama besar pada keduanya',
              'Jauh lebih besar pada gula',
              'Jauh lebih besar pada garam',
              'Tidak berpengaruh pada keduanya'
            ],
            benar: 1,
            bahas: 'Kelarutan gula naik tajam bersama suhu, sedangkan kelarutan garam hampir tidak berubah. Itu sebabnya gula mudah larut di air panas.'
          },
          {
            tanya: 'Melarutkan garam ke dalam air termasuk perubahan fisika karena…',
            opsi: [
              'Garam berubah menjadi senyawa baru di dalam air',
              'Terbentuk gas saat garam dimasukkan',
              'Garam hanya menyebar di antara partikel air dan bisa diperoleh kembali dengan penguapan',
              'Warna air berubah secara permanen'
            ],
            benar: 2,
            bahas: 'Tidak ada zat baru yang terbentuk. Bila air diuapkan, kristal garam akan muncul kembali — jadi prosesnya dapat dibalik.'
          }
        ]
      }));

      /* ---------- logika ---------- */

      function gantiZat() {
        var z = zat();
        massaDitambah = 0; massaLarut = 0; massaSendok = 0;
        animTuang = null; butirJatuh.length = 0;
        butiran.length = 0; endapanButir.length = 0;
        tanda = {};
        sMassa.input.max = z.sendokMaks;
        sMassa.input.step = z.sendokLangkah;
        sMassa.set(0);
        if (catatanZat) catatanZat.textContent = z.catatan;
        segarkanTuang();
        grafik.reset();
        waktu = 0;
      }

      function ulang() {
        massaDitambah = 0; massaLarut = 0; massaSendok = 0; waktu = 0; tanda = {};
        animTuang = null; butirJatuh.length = 0;
        butiran.length = 0; endapanButir.length = 0;
        sMassa.set(0); sSuhu.set(25); suhu = 25;
        sAduk.set(false); mengaduk = false;
        segarkanTuang();
        grafik.reset();
      }

      /* Adanya endapan belum tentu berarti jenuh: bisa jadi zatnya memang belum
       * sempat larut. Jenuh baru terjadi bila yang dituang melampaui batas
       * kelarutan, sehingga endapannya tidak akan habis walau diaduk. */
      function melampauiBatas() { return massaDitambah > kelarutanMaks() + 0.05; }

      function statusLarutan() {
        if (massaDitambah <= 0.001) return { teks: 'Air murni', jenis: 'netral' };
        if (endapan() > 0.25) {
          return melampauiBatas()
            ? { teks: 'Jenuh — endapan tidak larut lagi', jenis: 'ingat' }
            : { teks: 'Sedang melarut', jenis: 'fisika' };
        }
        if (massaLarut > kelarutanMaks() - 0.5) return { teks: 'Tepat jenuh', jenis: 'ingat' };
        return { teks: 'Belum jenuh', jenis: 'fisika' };
      }

      function catat(judul) {
        var z = zat();
        var end = endapan();
        Lab.jurnal.catat({
          modul: 'larutan',
          modulJudul: 'Melarutkan Zat',
          percobaan: judul + ' — ' + z.nama + ' pada ' + num(suhu, 0) + ' °C',
          jenis: 'fisika',
          ciri: {
            warna: 'Larutan tetap bening (tidak ada warna baru)',
            suhu: num(suhu, 0) + ' °C',
            endapan: end > 0.25 ? num(end, 1) + ' g tidak larut' : false,
            wujud: 'Padat → terlarut dalam cairan',
            gas: false, bau: false
          },
          zatBaru: false,
          bisaBalik: true,
          data: {
            'Zat terlarut': z.nama + ' (' + z.rumus + ')',
            'Massa ditambahkan': num(massaDitambah, 0) + ' g',
            'Massa terlarut': num(massaLarut, 1) + ' g',
            'Endapan': num(end, 1) + ' g',
            'Konsentrasi': num(konsentrasi(), 1) + ' g/100 mL',
            'Batas kelarutan': num(kelarutanMaks(), 1) + ' g per 50 mL',
            'Pengadukan': mengaduk ? 'Ya' : 'Tidak'
          },
          kesimpulan: 'Zat terlarut hanya menyebar di antara partikel air; tidak terbentuk zat baru dan dapat diperoleh kembali dengan penguapan. Termasuk perubahan fisika.'
        });
      }

      function periksaTonggak() {
        var kunciJenuh = zatKini + '-jenuh';
        var kunciLarutLagi = zatKini + '-larut-lagi';

        if (melampauiBatas() && endapan() > 0.5 && !tanda[kunciJenuh]) {
          tanda[kunciJenuh] = true;
          tanda[kunciLarutLagi] = false;
          catat('Larutan mencapai titik jenuh');
        }
        if (tanda[kunciJenuh] && endapan() < 0.05 && massaDitambah > 0.5 && !tanda[kunciLarutLagi]) {
          tanda[kunciLarutLagi] = true;
          catat('Endapan larut kembali setelah dipanaskan');
        }
      }

      /* ---------- butiran terlarut ---------- */

      function selaraskanButiran(dalam, air) {
        var z = zat();
        var target = Math.round(clamp(massaLarut / z.maks, 0, 1) * 190);
        while (butiran.length < target) {
          butiran.push({
            x: dalam.x + rnd(0.08, 0.92) * dalam.w,
            y: air.y + rnd(0.05, 0.95) * air.h,
            vx: rnd(-14, 14), vy: rnd(-14, 14),
            r: rnd(1.7, 3.1)
          });
        }
        while (butiran.length > target) butiran.pop();
      }

      function selaraskanEndapan(dalam) {
        var z = zat();
        var target = Math.round(clamp(endapan() / z.maks, 0, 1) * 130);
        while (endapanButir.length < target) {
          endapanButir.push({
            t: rnd(0, 1), u: rnd(0, 1),
            r: rnd(2.4, 4.6), putar: rnd(0, Math.PI)
          });
        }
        while (endapanButir.length > target) endapanButir.pop();
      }

      /* ---------- gambar ---------- */

      var posSendok = null;   // titik cekungan sendok penakar pada frame terakhir

      function lepasButirJatuh() {
        if (!posSendok) return;
        for (var i = 0, n = Math.random() < 0.7 ? 2 : 1; i < n; i++) {
          butirJatuh.push({
            x: posSendok.x + rnd(-6, 6), y: posSendok.y + rnd(0, 7),
            vx: rnd(-20, 6), vy: rnd(10, 50),
            r: rnd(1.6, 3.4), putar: rnd(0, Math.PI)
          });
        }
      }

      /** Butiran jatuh sampai menyentuh permukaan air, lalu dianggap masuk. */
      function langkahButirJatuh(dt, air) {
        for (var i = butirJatuh.length - 1; i >= 0; i--) {
          var b = butirJatuh[i];
          b.vy += 900 * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          if (b.y >= air.y) butirJatuh.splice(i, 1);
        }
      }

      function gambarPengaduk(ctx, bx, by, panjang, sudut) {
        if (!imgSendok.siap) return;
        var dw = panjang / PANJANG_SENDOK;
        var dh = dw * (imgSendok.naturalHeight / imgSendok.naturalWidth);
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(sudut - SUDUT_SENDOK);
        ctx.drawImage(imgSendok, -0.16 * dw, -0.79 * dh, dw, dh);
        ctx.restore();
      }

      /** Sendok penakar: menunggu di kanan meja dengan gundukan zat di
       *  cekungannya, lalu bergerak ke mulut gelas dan dimiringkan menuang. */
      function gambarSendokTakar(ctx, W, H, dalam) {
        var z = zat();
        var diam = { x: W * 0.87, y: H * 0.80 };
        var diTuang = { x: dalam.x + dalam.w * 0.58, y: dalam.y - H * 0.015 };
        var bx = diam.x, by = diam.y;
        var sudutDiam = -Math.PI / 2 + 0.25;
        var sudut = sudutDiam;
        var massaTampil = massaSendok;

        if (animTuang) {
          var u = clamp(animTuang.t / LAMA_TUANG, 0, 1);
          var datang = Lab.smooth(clamp(u / 0.30, 0, 1));
          var pulang = Lab.smooth(clamp((u - 0.78) / 0.22, 0, 1));
          var geser = datang * (1 - pulang);
          bx = Lab.lerp(diam.x, diTuang.x, geser);
          by = Lab.lerp(diam.y, diTuang.y, geser);
          // Memiringkan sendok ke arah gelas, lalu menegakkannya kembali.
          var miring = Lab.smooth(clamp((u - 0.30) / 0.14, 0, 1)) *
                       (1 - Lab.smooth(clamp((u - 0.72) / 0.12, 0, 1)));
          sudut = sudutDiam + miring * 0.95;
          massaTampil = animTuang.massa * (1 - Lab.norm(u, 0.32, 0.76));
        }

        posSendok = { x: bx, y: by };
        // Sengaja lebih pendek daripada pengaduk agar gagangnya tidak
        // menyenggol kartu data pengamatan di kanan atas.
        gambarPengaduk(ctx, bx, by, dalam.h * 0.82, sudut);

        if (massaTampil > 0.01) {
          var lebar = dalam.w * 0.115 * (0.55 + 0.45 * clamp(massaTampil / z.sendokMaks, 0, 1));
          ctx.save();
          ctx.translate(bx, by);
          ctx.rotate(sudut + Math.PI / 2);
          ctx.beginPath();
          ctx.ellipse(0, -lebar * 0.40, lebar, lebar * 0.58, 0, 0, Math.PI * 2);
          ctx.fillStyle = z.warnaButir;
          ctx.fill();
          ctx.strokeStyle = 'rgba(120,150,170,.5)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.restore();
        }
      }

      function gambar(ctx, W, H, t) {
        ctx.clearRect(0, 0, W, H);

        /* Meja. */
        var my = H * TL.mejaY;
        var gm = ctx.createLinearGradient(0, my, 0, H);
        gm.addColorStop(0, '#cbd7e2'); gm.addColorStop(1, '#aebecd');
        ctx.fillStyle = gm;
        ctx.fillRect(0, my, W, H - my);

        /* Gelas. */
        var gh = H * (TL.gelasBawah - TL.gelasAtas);
        var rasio = imgGelas.naturalWidth && imgGelas.naturalHeight
          ? imgGelas.naturalWidth / imgGelas.naturalHeight : 1.04;
        var gw = gh * rasio;
        var gx = W * TL.gelasCx - gw / 2;
        var gy = H * TL.gelasAtas;

        var dalam = { x: gx + gw * DALAM.x, y: gy + gh * DALAM.y, w: gw * DALAM.w, h: gh * DALAM.h };
        var air = { x: dalam.x, y: dalam.y + dalam.h * 0.22, w: dalam.w, h: dalam.h * 0.78 };

        if (imgGelas.siap) ctx.drawImage(imgGelas, gx, gy, gw, gh);

        ctx.save();
        ctx.beginPath();
        ctx.rect(dalam.x, dalam.y, dalam.w, dalam.h);
        ctx.clip();

        /* Air — makin pekat larutannya, makin dalam warnanya. */
        var pekat = clamp(konsentrasi() / (zat().kelarutan(90) * 1.05), 0, 1);
        var warnaAir = Lab.mix('#d8eef9', zatKini === 'gula' ? '#ecdcb8' : '#b9dcee', pekat);
        var goyang = mengaduk ? 4 : 1.6;
        ctx.globalAlpha = 0.72;
        ctx.fillStyle = warnaAir;
        Lab.permukaanBergelombang(ctx, air.x, air.y, air.w, air.h, t * (mengaduk ? 2.2 : 1), goyang);
        ctx.fill();
        ctx.globalAlpha = 1;

        /* Endapan di dasar gelas. */
        var z = zat();
        if (endapanButir.length) {
          var dasar = dalam.y + dalam.h;
          var lebarTumpuk = dalam.w * 0.82;
          var tinggiTumpuk = clamp(endapan() / z.maks, 0, 1) * dalam.h * 0.30 + 6;
          endapanButir.forEach(function (b) {
            var px = dalam.x + dalam.w * 0.09 + b.t * lebarTumpuk;
            // Tumpukan berbentuk gundukan: makin ke tepi makin rendah.
            var tinggiLokal = tinggiTumpuk * (1 - Math.pow(Math.abs(b.t - 0.5) * 2, 1.7));
            var py = dasar - 2 - b.u * Math.max(2, tinggiLokal);
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(b.putar);
            ctx.fillStyle = z.warnaButir;
            ctx.strokeStyle = 'rgba(120,150,170,.45)';
            ctx.lineWidth = 0.7;
            if (zatKini === 'garam') {
              Lab.persegiBulat(ctx, -b.r, -b.r, b.r * 2, b.r * 2, b.r * 0.28);
            } else {
              ctx.beginPath();
              ctx.arc(0, 0, b.r * 0.92, 0, Math.PI * 2);
            }
            ctx.fill(); ctx.stroke();
            ctx.restore();
          });
        }

        /* Partikel zat terlarut. */
        butiran.forEach(function (b) {
          Lab.bola(ctx, b.x, b.y, b.r, z.warnaLarut, 0.92);
        });

        ctx.restore();

        /* Kilau kaca. */
        var kilau = ctx.createLinearGradient(gx, 0, gx + gw, 0);
        kilau.addColorStop(0, 'rgba(255,255,255,0)');
        kilau.addColorStop(0.14, 'rgba(255,255,255,.4)');
        kilau.addColorStop(0.22, 'rgba(255,255,255,0)');
        kilau.addColorStop(0.84, 'rgba(255,255,255,0)');
        kilau.addColorStop(0.92, 'rgba(255,255,255,.26)');
        kilau.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = kilau;
        ctx.fillRect(dalam.x, dalam.y, dalam.w, dalam.h);

        if (imgGelas.siap) {
          var potong = imgGelas.naturalHeight * 0.13;
          ctx.drawImage(imgGelas, 0, 0, imgGelas.naturalWidth, potong, gx, gy, gw, gh * 0.13);
        }

        /* Pengaduk. */
        if (mengaduk) {
          var ayun = Math.sin(t * 5.5);
          gambarPengaduk(ctx,
            dalam.x + dalam.w * (0.5 + ayun * 0.17),
            dalam.y + dalam.h * 0.80,
            dalam.h * 1.15,
            -Math.PI / 2 + ayun * 0.28);
        }

        /* Butiran yang sedang jatuh dari sendok ke permukaan air. */
        if (butirJatuh.length) {
          ctx.fillStyle = z.warnaButir;
          ctx.strokeStyle = 'rgba(120,150,170,.5)';
          ctx.lineWidth = 0.7;
          butirJatuh.forEach(function (b) {
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(b.putar);
            if (zatKini === 'garam') Lab.persegiBulat(ctx, -b.r, -b.r, b.r * 2, b.r * 2, b.r * 0.28);
            else { ctx.beginPath(); ctx.arc(0, 0, b.r * 0.92, 0, Math.PI * 2); }
            ctx.fill(); ctx.stroke();
            ctx.restore();
          });
        }

        /* Sendok penakar beserta takarannya. */
        gambarSendokTakar(ctx, W, H, dalam);

        return { dalam: dalam, air: air };
      }

      /* ---------- loop ---------- */

      var frame = 0;
      var loop = Lab.loop(function (dt, t) {
        var k = Lab.siapkanKanvas(kanvas);
        waktu += dt;

        /* Penuangan dari sendok: zat berpindah ke air bertahap. */
        if (animTuang) {
          animTuang.t += dt;
          var ut = clamp(animTuang.t / LAMA_TUANG, 0, 1);
          var porsi = Lab.smooth(clamp((ut - 0.32) / 0.44, 0, 1));
          var masukBaru = animTuang.massa * porsi - animTuang.sudahMasuk;
          if (masukBaru > 0) {
            animTuang.sudahMasuk += masukBaru;
            massaDitambah = Math.min(zat().maks, massaDitambah + masukBaru);
          }
          if (ut > 0.32 && ut < 0.78) lepasButirJatuh();
          if (ut >= 1) {
            animTuang = null;
            massaSendok = 0;
            sMassa.set(0);
            segarkanTuang();
          }
        }

        var batas = kelarutanMaks();
        var target = Math.min(massaDitambah, batas);

        /* Laju pelarutan: tanpa diaduk berlangsung lambat sehingga endapan
         * sempat terlihat menumpuk; pengadukan dan suhu tinggi mempercepatnya. */
        var laju = 0.22 * (mengaduk ? 6.5 : 1) * (0.45 + 0.55 * suhu / 90);
        if (massaLarut < target) {
          massaLarut = Math.min(target, massaLarut + (target - massaLarut) * laju * dt + 0.02 * dt);
        } else if (massaLarut > target) {
          // Suhu turun → sebagian zat mengkristal kembali (lebih lambat).
          massaLarut = Math.max(target, massaLarut - (massaLarut - target) * laju * 0.5 * dt - 0.02 * dt);
        }

        var hasil = gambar(k.ctx, k.w, k.h, t);
        selaraskanButiran(hasil.dalam, hasil.air);
        selaraskanEndapan(hasil.dalam);
        langkahButirJatuh(dt, hasil.air);

        /* Gerak partikel terlarut: acak termal + pusaran bila diaduk. */
        var air = hasil.air;
        var cx = air.x + air.w / 2, cy = air.y + air.h / 2;
        var termal = 12 + suhu * 1.5;
        butiran.forEach(function (b) {
          b.vx += rnd(-termal, termal) * dt * 6;
          b.vy += rnd(-termal, termal) * dt * 6;
          if (mengaduk) {
            var dx = b.x - cx, dy = b.y - cy;
            var jarak = Math.hypot(dx, dy) || 1;
            b.vx += (-dy / jarak) * 220 * dt;
            b.vy += (dx / jarak) * 220 * dt;
            b.vx += (-dx / jarak) * 22 * dt;
            b.vy += (-dy / jarak) * 22 * dt;
          }
          b.vx *= 0.92; b.vy *= 0.92;
          b.x += b.vx * dt; b.y += b.vy * dt;
          b.x = clamp(b.x, air.x + b.r, air.x + air.w - b.r);
          b.y = clamp(b.y, air.y + b.r, air.y + air.h - b.r);
        });

        periksaTonggak();

        if (frame % 6 === 0) {
          garisBatas.y = batas / VOLUME * 100;
          grafik.tambah({ x: waktu, kons: konsentrasi() });
        }
        if (frame % 5 === 0) grafik.gambar();

        if (frame % 4 === 0) {
          var st = statusLarutan();
          baca.set('larut', num(massaLarut, 1));
          baca.set('endapan', num(endapan(), 1));
          baca.set('kons', num(konsentrasi(), 1));
          baca.set('batas', num(batas, 1));
          baca.warna('endapan', endapan() > 0.25 ? 'ingat' : null);
          lencanaStatus.textContent = st.teks;
          lencanaStatus.dataset.jenis = st.jenis;
          lencanaAduk.textContent = mengaduk ? 'Diaduk' : 'Tidak diaduk';
          lencanaAduk.dataset.jenis = mengaduk ? 'fisika' : 'netral';
        }
        frame++;
      });

      loop.start();
      this._loop = loop;
    },

    unmount: function () {
      if (this._loop) this._loop.stop();
      this._loop = null;
    }
  });

})(window.Lab);
