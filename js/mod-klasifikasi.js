/* Lab Virtual — Perubahan Materi
 * Modul 4 — Klasifikasi peristiwa: seret kartu ke kotak Fisika atau Kimia.
 *
 * Menggunakan Pointer Events supaya cara kerjanya sama pada tetikus maupun layar
 * sentuh. Tersedia juga jalur papan ketik: pilih kartu, lalu pilih kotak tujuan.
 */
(function (Lab) {
  'use strict';

  var el = Lab.el, ui = Lab.ui, num = Lab.num;

  var PERISTIWA = [
    // ---- Perubahan fisika ----
    { ikon: '🧊', teks: 'Es batu mencair', jenis: 'fisika',
      alasan: 'Air hanya berubah wujud dari padat menjadi cair. Zatnya tetap H₂O dan dapat dibekukan lagi.' },
    { ikon: '💨', teks: 'Air mendidih menjadi uap', jenis: 'fisika',
      alasan: 'Uap air masih berupa air. Bila didinginkan, uap itu mengembun kembali menjadi air.' },
    { ikon: '🍬', teks: 'Gula larut dalam air', jenis: 'fisika',
      alasan: 'Gula hanya menyebar di antara partikel air. Bila airnya diuapkan, gula muncul kembali.' },
    { ikon: '🕯️', teks: 'Lilin meleleh karena panas', jenis: 'fisika',
      alasan: 'Lilin padat berubah menjadi lilin cair. Setelah dingin, lilin membeku lagi — tidak ada zat baru.' },
    { ikon: '✂️', teks: 'Kertas digunting menjadi potongan kecil', jenis: 'fisika',
      alasan: 'Yang berubah hanya ukuran dan bentuknya. Bahannya masih kertas.' },
    { ikon: '❄️', teks: 'Kapur barus menyublim', jenis: 'fisika',
      alasan: 'Kapur barus berubah langsung dari padat menjadi gas. Zatnya tetap sama, hanya wujudnya berubah.' },
    { ikon: '🌾', teks: 'Beras ditumbuk menjadi tepung', jenis: 'fisika',
      alasan: 'Butiran beras hanya dihaluskan. Kandungan zatnya tidak berubah.' },
    { ikon: '🔧', teks: 'Kawat tembaga dibengkokkan', jenis: 'fisika',
      alasan: 'Bentuk kawat berubah, tetapi tembaganya tetap tembaga.' },

    // ---- Perubahan kimia ----
    { ikon: '🔥', teks: 'Kertas dibakar menjadi abu', jenis: 'kimia',
      alasan: 'Terbentuk zat baru berupa abu, gas karbon dioksida, dan uap air. Abu tidak bisa menjadi kertas lagi.' },
    { ikon: '🕯️', teks: 'Sumbu lilin menyala dan lilin habis terbakar', jenis: 'kimia',
      alasan: 'Pembakaran menghasilkan gas CO₂ dan uap air. Berbeda dengan lilin yang sekadar meleleh.' },
    { ikon: '🔩', teks: 'Paku besi berkarat', jenis: 'kimia',
      alasan: 'Besi bereaksi dengan air dan oksigen membentuk karat — zat baru yang rapuh dan berwarna cokelat.' },
    { ikon: '🥛', teks: 'Susu dibiarkan hingga basi', jenis: 'kimia',
      alasan: 'Bakteri mengubah zat dalam susu menjadi asam. Rasa, bau, dan sifatnya berubah permanen.' },
    { ikon: '🍚', teks: 'Singkong difermentasi menjadi tapai', jenis: 'kimia',
      alasan: 'Ragi mengubah pati menjadi gula dan alkohol. Tapai tidak dapat dikembalikan menjadi singkong.' },
    { ikon: '🫧', teks: 'Cuka dicampur baking soda hingga berbuih', jenis: 'kimia',
      alasan: 'Muncul gas karbon dioksida yang sebelumnya tidak ada — tanda terbentuknya zat baru.' },
    { ikon: '🍎', teks: 'Apel yang dikupas berubah cokelat', jenis: 'kimia',
      alasan: 'Zat dalam apel bereaksi dengan oksigen udara membentuk zat baru berwarna cokelat.' },
    { ikon: '🚗', teks: 'Bensin terbakar di mesin kendaraan', jenis: 'kimia',
      alasan: 'Bensin bereaksi dengan oksigen menghasilkan gas buang dan energi. Prosesnya tidak dapat dibalik.' }
  ];

  function acak(daftar) {
    var a = daftar.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  Lab.registerModule({
    id: 'klasifikasi',
    judul: 'Klasifikasi Peristiwa',

    mount: function (view) {
      var soal = acak(PERISTIWA);
      var benarPertama = 0;
      var totalPercobaan = 0;
      var selesai = 0;
      var dipilih = null;      // kartu yang sedang "diangkat" lewat papan ketik
      var pembersih = [];

      view.appendChild(ui.kepalaModul({
        kategori: 'Modul 4 · Latihan',
        judul: 'Klasifikasi Peristiwa',
        warna: 'campur',
        ringkas: 'Kelompokkan ' + PERISTIWA.length + ' peristiwa sehari-hari ke dalam perubahan fisika atau perubahan kimia. Alasannya muncul begitu kartu dilepaskan.'
      }));

      view.appendChild(ui.instruksi({
        id: 'klasifikasi',
        judul: 'Cara mengerjakan',
        tujuan: 'Menerapkan ciri-ciri perubahan fisika dan kimia pada peristiwa sehari-hari.',
        langkah: [
          'Seret kartu peristiwa ke kotak yang menurutmu benar.',
          'Jika benar, kartu menempel di kotak. Jika salah, kartu kembali ke tumpukan dan penjelasannya muncul.',
          'Pengguna papan ketik: tekan <strong>Tab</strong> ke kartu, tekan <strong>Enter</strong> untuk mengangkat, lalu pilih kotak tujuan dan tekan <strong>Enter</strong> lagi.',
          'Kunci penilaian: adakah <strong>zat baru</strong> yang terbentuk, dan apakah prosesnya <strong>dapat dibalik</strong>?'
        ]
      }));

      /* ----- papan skor ----- */
      var bar = el('span');
      var teksSkor = el('strong', '0 dari ' + soal.length + ' tepat');
      var teksAkurasi = el('span.kontrol__ket', 'Ketepatan percobaan pertama: –');

      var papanSkor = ui.panel('Kemajuan', el('.klas__skor', [
        teksSkor,
        el('.klas__bar', bar),
        teksAkurasi
      ]), { warna: 'campur' });
      view.appendChild(papanSkor);

      /* ----- papan permainan ----- */
      var tumpukan = el('.tumpukan');
      var isiFisika = el('.kotak__isi');
      var isiKimia = el('.kotak__isi');
      var hitungFisika = el('span.kotak__hitung', '0');
      var hitungKimia = el('span.kotak__hitung', '0');

      var kotakFisika = el('.kotak', { 'data-jenis': 'fisika', tabindex: '-1' }, [
        el('.kotak__kepala', [
          el('h3.kotak__judul', '🔵 Perubahan Fisika'),
          hitungFisika
        ]),
        el('p.kotak__petunjuk', 'Tidak ada zat baru · umumnya dapat dibalik'),
        isiFisika
      ]);
      var kotakKimia = el('.kotak', { 'data-jenis': 'kimia', tabindex: '-1' }, [
        el('.kotak__kepala', [
          el('h3.kotak__judul', '🟠 Perubahan Kimia'),
          hitungKimia
        ]),
        el('p.kotak__petunjuk', 'Terbentuk zat baru · sulit dibalik'),
        isiKimia
      ]);

      var umpan = el('div');

      view.appendChild(ui.panel('Papan klasifikasi', el('.klas', [
        el('p.kontrol__ket', 'Kartu yang belum dikelompokkan:'),
        tumpukan,
        el('.klas__papan', [kotakFisika, kotakKimia]),
        umpan
      ]), { warna: 'campur' }));

      /* ----- kartu ----- */

      function buatKartu(p) {
        var kartu = el('.peristiwa', {
          role: 'button', tabindex: '0',
          'aria-label': p.teks + '. Tekan Enter untuk mengangkat kartu.'
        }, [
          el('span.peristiwa__ikon', { 'aria-hidden': 'true' }, p.ikon),
          el('span', p.teks)
        ]);
        kartu._data = p;
        pasangSeret(kartu);
        kartu.addEventListener('keydown', function (e) {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          angkat(kartu);
        });
        return kartu;
      }

      function angkat(kartu) {
        if (kartu.classList.contains('is-selesai')) return;
        if (dipilih === kartu) { lepasPilihan(); return; }
        lepasPilihan();
        dipilih = kartu;
        kartu.style.outline = '2.5px solid var(--campur)';
        kartu.style.outlineOffset = '2px';
        [kotakFisika, kotakKimia].forEach(function (k) {
          k.setAttribute('tabindex', '0');
          k.classList.add('is-sasaran');
        });
        Lab.toast('Kartu diangkat. Pilih kotak tujuan lalu tekan Enter.', 'info');
        kotakFisika.focus();
      }

      function lepasPilihan() {
        if (dipilih) {
          dipilih.style.outline = '';
          dipilih.style.outlineOffset = '';
        }
        dipilih = null;
        [kotakFisika, kotakKimia].forEach(function (k) {
          k.setAttribute('tabindex', '-1');
          k.classList.remove('is-sasaran');
        });
      }

      [[kotakFisika, 'fisika'], [kotakKimia, 'kimia']].forEach(function (pasangan) {
        var kotak = pasangan[0], jenis = pasangan[1];
        function pilihKotak(e) {
          if (!dipilih) return;
          if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          var kartu = dipilih;
          lepasPilihan();
          nilaiJawaban(kartu, jenis);
        }
        kotak.addEventListener('click', pilihKotak);
        kotak.addEventListener('keydown', pilihKotak);
      });

      /* ----- seret dengan Pointer Events ----- */

      function pasangSeret(kartu) {
        var bayang = null, aktif = false, mulaiX = 0, mulaiY = 0, geserX = 0, geserY = 0;

        function turun(e) {
          if (kartu.classList.contains('is-selesai') || e.button > 0) return;
          var kotakUkur = kartu.getBoundingClientRect();
          mulaiX = e.clientX; mulaiY = e.clientY;
          geserX = e.clientX - kotakUkur.left;
          geserY = e.clientY - kotakUkur.top;
          aktif = false;
          kartu.setPointerCapture(e.pointerId);
          kartu.addEventListener('pointermove', gerak);
          kartu.addEventListener('pointerup', naik);
          kartu.addEventListener('pointercancel', batal);
        }

        function gerak(e) {
          if (!aktif) {
            // Baru dianggap seretan setelah bergerak sedikit, agar klik tetap berfungsi.
            if (Math.abs(e.clientX - mulaiX) < 5 && Math.abs(e.clientY - mulaiY) < 5) return;
            aktif = true;
            var kotakUkur = kartu.getBoundingClientRect();
            bayang = kartu.cloneNode(true);
            bayang.classList.add('is-seret');
            bayang.style.width = kotakUkur.width + 'px';
            document.body.appendChild(bayang);
            kartu.style.opacity = '.3';
          }
          bayang.style.left = (e.clientX - geserX) + 'px';
          bayang.style.top = (e.clientY - geserY) + 'px';
          sorotSasaran(e.clientX, e.clientY);
        }

        function bersihkanSeret() {
          kartu.removeEventListener('pointermove', gerak);
          kartu.removeEventListener('pointerup', naik);
          kartu.removeEventListener('pointercancel', batal);
          if (bayang && bayang.parentNode) bayang.parentNode.removeChild(bayang);
          bayang = null;
          kartu.style.opacity = '';
          kotakFisika.classList.remove('is-sasaran');
          kotakKimia.classList.remove('is-sasaran');
        }

        function naik(e) {
          var seret = aktif;
          var x = e.clientX, y = e.clientY;
          bersihkanSeret();
          if (!seret) { angkat(kartu); return; }
          var jenis = sasaranDi(x, y);
          if (jenis) nilaiJawaban(kartu, jenis);
        }

        function batal() { bersihkanSeret(); }

        kartu.addEventListener('pointerdown', turun);
      }

      function sasaranDi(x, y) {
        var kf = kotakFisika.getBoundingClientRect();
        var kk = kotakKimia.getBoundingClientRect();
        if (x >= kf.left && x <= kf.right && y >= kf.top && y <= kf.bottom) return 'fisika';
        if (x >= kk.left && x <= kk.right && y >= kk.top && y <= kk.bottom) return 'kimia';
        return null;
      }

      function sorotSasaran(x, y) {
        var jenis = sasaranDi(x, y);
        kotakFisika.classList.toggle('is-sasaran', jenis === 'fisika');
        kotakKimia.classList.toggle('is-sasaran', jenis === 'kimia');
      }

      /* ----- penilaian ----- */

      function nilaiJawaban(kartu, jenis) {
        var p = kartu._data;
        var tepat = p.jenis === jenis;
        totalPercobaan++;

        Lab.clear(umpan);
        umpan.appendChild(el('.umpan', { 'data-jenis': tepat ? 'benar' : 'salah' }, [
          el('strong', (tepat ? '✓ Tepat — ' : '✗ Belum tepat — ') + p.teks),
          p.alasan + (tepat ? '' : ' Peristiwa ini termasuk perubahan ' + p.jenis + '.')
        ]));

        if (tepat) {
          if (!kartu._pernahSalah) benarPertama++;
          selesai++;
          kartu.classList.remove('is-salah');
          kartu.classList.add('is-benar', 'is-selesai');
          kartu.setAttribute('tabindex', '-1');
          kartu.setAttribute('aria-label', p.teks + '. Sudah dikelompokkan dengan tepat.');
          (jenis === 'fisika' ? isiFisika : isiKimia).appendChild(kartu);
          Lab.toast('Tepat!', 'benar');
        } else {
          kartu._pernahSalah = true;
          kartu.classList.add('is-salah');
          tumpukan.appendChild(kartu);
          setTimeout(function () { kartu.classList.remove('is-salah'); }, 400);
          Lab.toast('Belum tepat — baca alasannya di bawah papan.', 'salah');
        }

        segarkanSkor();
        if (selesai === soal.length) tuntas();
      }

      function segarkanSkor() {
        var persen = Math.round(selesai / soal.length * 100);
        bar.style.width = persen + '%';
        teksSkor.textContent = selesai + ' dari ' + soal.length + ' tepat';
        hitungFisika.textContent = isiFisika.children.length;
        hitungKimia.textContent = isiKimia.children.length;
        teksAkurasi.textContent = totalPercobaan
          ? 'Ketepatan percobaan pertama: ' + num(benarPertama / soal.length * 100, 0) + '% · ' +
            totalPercobaan + ' kali mencoba'
          : 'Ketepatan percobaan pertama: –';
      }

      function tuntas() {
        Lab.hasilKuis.simpan('klasifikasi', benarPertama, soal.length);
        var persen = Math.round(benarPertama / soal.length * 100);
        var pesan = persen >= 85 ? 'Luar biasa — kamu sudah menguasai ciri kedua jenis perubahan.'
          : persen >= 65 ? 'Bagus. Cermati lagi kartu yang sempat keliru, terutama pasangan lilin meleleh dan lilin terbakar.'
          : 'Belum tuntas. Buka kembali Modul 1–3, perhatikan apakah terbentuk zat baru pada tiap percobaan.';

        Lab.clear(umpan);
        umpan.appendChild(el('.kuis__hasil', [
          el('span.kuis__nilai', String(persen)),
          el('p', [el('strong', benarPertama + ' dari ' + soal.length + ' benar pada percobaan pertama')]),
          el('p', { style: { color: 'var(--tinta-2)' } }, pesan),
          el('div', { style: { marginTop: '1rem', display: 'flex', gap: '.5rem', justifyContent: 'center', flexWrap: 'wrap' } }, [
            ui.tombol({
              label: 'Acak & ulangi', ikon: '↻', jenis: 'kedua',
              onClick: function () { Lab.pergiKe('klasifikasi'); }
            }).el,
            ui.tombol({
              label: 'Buka Jurnal Observasi', ikon: '📓', jenis: 'utama',
              onClick: function () { Lab.pergiKe('jurnal'); }
            }).el
          ])
        ]));
        Lab.toast('Semua kartu selesai dikelompokkan!', 'benar');
      }

      soal.forEach(function (p) { tumpukan.appendChild(buatKartu(p)); });
      segarkanSkor();

      /* Membatalkan pilihan papan ketik ketika pengguna menekan Escape. */
      function padaEsc(e) { if (e.key === 'Escape') lepasPilihan(); }
      document.addEventListener('keydown', padaEsc);
      pembersih.push(function () { document.removeEventListener('keydown', padaEsc); });

      /* ----- pengayaan ----- */
      view.appendChild(ui.panel('Cara cepat membedakan', el('.klas__papan', [
        el('div', [
          el('h3', { style: { fontSize: '.92rem', color: 'var(--fisika)' } }, 'Tanyakan tiga hal ini'),
          el('ol', { style: { paddingLeft: '1.1rem', fontSize: '.88rem', color: 'var(--tinta-2)', margin: 0 } }, [
            el('li', 'Apakah muncul zat yang sifatnya benar-benar baru?'),
            el('li', 'Adakah gas, endapan, perubahan warna, atau perubahan suhu yang tidak wajar?'),
            el('li', 'Bisakah zat dikembalikan ke keadaan semula dengan cara sederhana?')
          ])
        ]),
        el('div', [
          el('h3', { style: { fontSize: '.92rem', color: 'var(--kimia)' } }, 'Pasangan yang sering tertukar'),
          el('ul', { style: { paddingLeft: '1.1rem', fontSize: '.88rem', color: 'var(--tinta-2)', margin: 0 } }, [
            el('li', ['Lilin ', el('em', 'meleleh'), ' (fisika) vs lilin ', el('em', 'terbakar'), ' (kimia)']),
            el('li', ['Gula ', el('em', 'larut'), ' (fisika) vs gula ', el('em', 'menjadi karamel'), ' (kimia)']),
            el('li', ['Air ', el('em', 'menguap'), ' (fisika) vs air ', el('em', 'diuraikan menjadi H₂ dan O₂'), ' (kimia)'])
          ])
        ])
      ]), { warna: 'campur' }));

      this._pembersih = pembersih;
    },

    unmount: function () {
      (this._pembersih || []).forEach(function (fn) { fn(); });
      this._pembersih = null;
    }
  });

})(window.Lab);
