/* Lab Virtual — Perubahan Materi
 * Modul 5 — Jurnal Observasi Virtual.
 *
 * Halaman ini tidak mensimulasikan apa pun; ia mengumpulkan seluruh observasi yang
 * dicatat modul 1–4, rekap jawaban LKPD, dan capaian kuis, lalu menyiapkannya
 * untuk diunduh atau dicetak sebagai laporan praktikum.
 */
(function (Lab) {
  'use strict';

  var el = Lab.el, ui = Lab.ui, num = Lab.num;

  var JUDUL_MODUL = {
    wujud: 'Perubahan Wujud Zat',
    larutan: 'Melarutkan Zat',
    reaksi: 'Reaksi Kimia Sederhana',
    klasifikasi: 'Klasifikasi Peristiwa'
  };

  var LKPD_MODUL = ['wujud', 'larutan', 'reaksi'];
  /* Jumlah soal LKPD tiap modul — dipakai untuk menghitung kemajuan pengisian. */
  var LKPD_JUMLAH = { wujud: 4, larutan: 5, reaksi: 5 };

  function tanggalIndonesia(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) + ' ' +
      d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  Lab.registerModule({
    id: 'jurnal',
    judul: 'Jurnal Observasi',

    mount: function (view) {
      var saring = 'semua';
      var lepasPantau = [];

      view.appendChild(ui.kepalaModul({
        kategori: 'Modul 5 · Laporan',
        judul: 'Jurnal Observasi Virtual',
        warna: 'jurnal',
        ringkas: 'Rekaman otomatis dari seluruh percobaan yang sudah kamu jalankan, siap dijadikan laporan praktikum.'
      }));

      var isiRingkas = el('div');
      var isiTabel = el('div');
      var isiLkpd = el('div');
      var isiCapaian = el('div');

      /* ---------- ringkasan ---------- */

      function gambarRingkas() {
        Lab.clear(isiRingkas);
        var r = Lab.jurnal.ringkas();
        var terisi = LKPD_MODUL.reduce(function (a, m) { return a + Lab.lkpd.terisi(m); }, 0);
        var totalSoal = LKPD_MODUL.reduce(function (a, m) { return a + LKPD_JUMLAH[m]; }, 0);

        var baca = ui.pembacaan([
          { kunci: 'total', label: 'Total observasi', nilai: num(r.total), warna: 'aksen' },
          { kunci: 'fisika', label: 'Perubahan fisika', nilai: num(r.fisika) },
          { kunci: 'kimia', label: 'Perubahan kimia', nilai: num(r.kimia) },
          { kunci: 'lkpd', label: 'Soal LKPD terisi', nilai: num(terisi) + ' / ' + num(totalSoal) }
        ]);
        isiRingkas.appendChild(baca.el);

        if (!Lab.store.tersimpan) {
          isiRingkas.appendChild(el('.umpan', { 'data-jenis': 'salah', style: { marginTop: '.8rem' } }, [
            el('strong', 'Penyimpanan browser tidak aktif'),
            'Catatan hanya bertahan selama tab ini terbuka. Unduh atau cetak hasilnya sebelum menutup halaman.'
          ]));
        }
      }

      /* ---------- tabel observasi ---------- */

      function lencanaCiri(entri) {
        var ada = Lab.jurnal.CIRI.filter(function (c) { return entri.ciri && entri.ciri[c.kunci]; });
        if (!ada.length) return el('span.kontrol__ket', 'Tidak ada ciri khusus');
        return el('span', ada.map(function (c) {
          var nilai = entri.ciri[c.kunci];
          return el('span', [
            ui.lencana(c.ikon + ' ' + c.label, entri.jenis),
            typeof nilai === 'string'
              ? el('span.kontrol__ket', { style: { display: 'block', marginBottom: '.25rem' } }, nilai)
              : null
          ]);
        }));
      }

      function gambarTabel() {
        Lab.clear(isiTabel);
        var semua = Lab.jurnal.semua().slice().reverse();
        var data = semua.filter(function (e) {
          if (saring === 'semua') return true;
          if (saring === 'fisika' || saring === 'kimia') return e.jenis === saring;
          return e.modul === saring;
        });

        if (!semua.length) {
          isiTabel.appendChild(el('.kosong', [
            el('span.kosong__ikon', { 'aria-hidden': 'true' }, '📭'),
            el('p', [el('strong', 'Jurnal masih kosong')]),
            el('p', 'Jalankan percobaan pada Modul 1 sampai 3. Setiap kali satu tahap percobaan selesai, ciri perubahannya dicatat di sini secara otomatis.'),
            el('a.tombol', { href: '#/wujud', 'data-jenis': 'utama' }, 'Mulai dari Modul 1')
          ]));
          return;
        }

        if (!data.length) {
          isiTabel.appendChild(el('.kosong', [
            el('span.kosong__ikon', { 'aria-hidden': 'true' }, '🔍'),
            el('p', 'Tidak ada catatan yang cocok dengan tapisan ini.')
          ]));
          return;
        }

        var tbody = el('tbody', data.map(function (e) {
          return el('tr', [
            el('td.waktu', tanggalIndonesia(e.waktu)),
            el('td', [
              el('strong', e.percobaan || '–'),
              el('span.kontrol__ket', { style: { display: 'block' } }, e.modulJudul || JUDUL_MODUL[e.modul] || e.modul)
            ]),
            el('td.ciri', lencanaCiri(e)),
            el('td', [
              ui.lencana(e.jenis === 'kimia' ? 'Kimia' : 'Fisika', e.jenis),
              el('span.kontrol__ket', { style: { display: 'block', marginTop: '.3rem' } },
                (e.zatBaru ? 'Ada zat baru' : 'Tanpa zat baru') + ' · ' +
                (e.bisaBalik ? 'dapat dibalik' : 'sulit dibalik'))
            ]),
            el('td', [
              el('span.kontrol__ket', Object.keys(e.data || {}).map(function (k) {
                return el('span', { style: { display: 'block' } }, k + ': ' + e.data[k]);
              }))
            ]),
            el('td.cetak-sembunyi', ui.tombol({
              label: 'Hapus', jenis: 'halus', judul: 'Hapus catatan ini',
              onClick: function () { Lab.jurnal.hapus(e.id); }
            }).el)
          ]);
        }));

        isiTabel.appendChild(el('.tabel-bungkus', el('table.jurnal', [
          el('thead', el('tr', [
            el('th', 'Waktu'),
            el('th', 'Percobaan'),
            el('th', 'Ciri perubahan yang teramati'),
            el('th', 'Jenis perubahan'),
            el('th', 'Data pengukuran'),
            el('th.cetak-sembunyi', '')
          ])),
          tbody
        ])));

        isiTabel.appendChild(el('p.kontrol__ket', { style: { marginTop: '.7rem' } },
          'Menampilkan ' + data.length + ' dari ' + semua.length + ' catatan.'));
      }

      /* ---------- rekap LKPD ---------- */

      function gambarLkpd() {
        Lab.clear(isiLkpd);
        var adaIsi = false;

        LKPD_MODUL.forEach(function (m) {
          var isi = Lab.lkpd.ambil(m);
          var nomor = Object.keys(isi).filter(function (k) { return String(isi[k] || '').trim(); });
          if (!nomor.length) return;
          adaIsi = true;
          isiLkpd.appendChild(el('.lkpd__soal', { style: { marginBottom: '.8rem' } }, [
            el('h3', { style: { fontSize: '.95rem', marginBottom: '.6rem' } }, JUDUL_MODUL[m]),
            el('ol', { style: { paddingLeft: '1.2rem', margin: 0, fontSize: '.9rem' } },
              nomor.sort(function (a, b) { return a - b; }).map(function (k) {
                return el('li', { style: { marginBottom: '.5rem' } }, [
                  el('span.kontrol__ket', { style: { display: 'block' } }, 'Soal ' + k),
                  el('span', isi[k])
                ]);
              }))
          ]));
        });

        if (!adaIsi) {
          isiLkpd.appendChild(el('.kosong', [
            el('span.kosong__ikon', { 'aria-hidden': 'true' }, '📝'),
            el('p', 'Belum ada jawaban LKPD. Isi lembar kerja di bagian bawah setiap modul percobaan.')
          ]));
        }
      }

      /* ---------- capaian kuis ---------- */

      function gambarCapaian() {
        Lab.clear(isiCapaian);
        var hasil = Lab.hasilKuis.semua();
        var kunci = Object.keys(hasil);

        if (!kunci.length) {
          isiCapaian.appendChild(el('.kosong', [
            el('span.kosong__ikon', { 'aria-hidden': 'true' }, '🎯'),
            el('p', 'Belum ada kuis yang dikerjakan. Kuis reflektif tersedia di akhir setiap modul.')
          ]));
          return;
        }

        isiCapaian.appendChild(el('.pembacaan', kunci.map(function (m) {
          var h = hasil[m];
          var persen = Math.round(h.benar / h.total * 100);
          return el('.pembacaan__item', {
            'data-warna': persen >= 80 ? 'benar' : persen >= 60 ? 'ingat' : 'salah'
          }, [
            el('span.pembacaan__label', JUDUL_MODUL[m] || m),
            el('.pembacaan__baris', [
              el('span.pembacaan__nilai', String(persen)),
              el('span.pembacaan__satuan', '/ 100 · ' + h.benar + ' dari ' + h.total)
            ])
          ]);
        })));
      }

      function gambarSemua() {
        gambarRingkas(); gambarTabel(); gambarLkpd(); gambarCapaian();
      }

      /* ---------- susunan halaman ---------- */

      var sSaring = ui.segmen({
        label: 'Tapis catatan',
        opsi: [
          { nilai: 'semua', label: 'Semua' },
          { nilai: 'fisika', label: 'Fisika' },
          { nilai: 'kimia', label: 'Kimia' }
        ],
        nilai: 'semua',
        onChange: function (v) { saring = v; gambarTabel(); }
      });

      var bUnduh = ui.tombol({
        label: 'Unduh CSV', ikon: '⬇️', jenis: 'utama',
        onClick: function () {
          if (!Lab.jurnal.semua().length) { Lab.toast('Jurnal masih kosong.', 'ingat'); return; }
          Lab.unduh('jurnal-observasi-perubahan-materi.csv', Lab.jurnal.csv());
        }
      });
      var bCetak = ui.tombol({
        label: 'Cetak laporan', ikon: '🖨️', jenis: 'kedua',
        onClick: function () { window.print(); }
      });

      /* Hapus semua memakai konfirmasi dua langkah, bukan dialog pemblokir. */
      var menungguKonfirmasi = false, jedaKonfirmasi = null;
      var bHapus = ui.tombol({
        label: 'Hapus semua', ikon: '🗑️', jenis: 'bahaya',
        onClick: function () {
          if (!menungguKonfirmasi) {
            menungguKonfirmasi = true;
            bHapus.setLabel('Klik lagi untuk menghapus');
            jedaKonfirmasi = setTimeout(function () {
              menungguKonfirmasi = false;
              bHapus.setLabel('Hapus semua');
            }, 4000);
            return;
          }
          clearTimeout(jedaKonfirmasi);
          menungguKonfirmasi = false;
          bHapus.setLabel('Hapus semua');
          Lab.jurnal.hapusSemua();
          Lab.lkpd.hapusSemua(LKPD_MODUL);
          Lab.hasilKuis.hapusSemua();
          gambarSemua();
          Lab.toast('Semua catatan, jawaban LKPD, dan nilai kuis dihapus.', 'ingat');
        }
      });

      view.appendChild(ui.panel('Ringkasan kegiatan', [
        isiRingkas,
        el('.tombol-baris.cetak-sembunyi', { style: { marginTop: '1rem' } },
          [bUnduh.el, bCetak.el, bHapus.el]),
        el('p.kontrol__ket.cetak-sembunyi', { style: { marginTop: '.6rem' } },
          'Berkas CSV memakai titik koma sebagai pemisah agar langsung rapi ketika dibuka di Microsoft Excel versi Indonesia.')
      ], { warna: 'jurnal' }));

      view.appendChild(ui.panel('Tabel observasi', [
        el('div.cetak-sembunyi', { style: { marginBottom: '.9rem' } }, sSaring.el),
        isiTabel
      ], { warna: 'jurnal' }));

      view.appendChild(ui.panel('Rekap jawaban LKPD', isiLkpd, { warna: 'jurnal' }));
      view.appendChild(ui.panel('Capaian kuis reflektif', isiCapaian, { warna: 'jurnal' }));

      /* ---------- rangkuman konsep ---------- */

      view.appendChild(ui.panel('Rangkuman: membedakan kedua perubahan', el('.tabel-bungkus',
        el('table.jurnal', [
          el('thead', el('tr', [
            el('th', 'Pembanding'),
            el('th', 'Perubahan fisika'),
            el('th', 'Perubahan kimia')
          ])),
          el('tbody', [
            ['Zat baru', 'Tidak terbentuk', 'Terbentuk zat baru dengan sifat berbeda'],
            ['Yang berubah', 'Wujud, bentuk, ukuran, atau kelarutan', 'Susunan partikel penyusun zat'],
            ['Dapat dibalik', 'Umumnya ya, dengan cara sederhana', 'Umumnya tidak dapat dibalik'],
            ['Ciri yang teramati', 'Perubahan wujud dan penampilan', 'Gas, endapan, perubahan warna, perubahan suhu, bau'],
            ['Contoh dari lab ini', 'Es melebur, air mendidih, garam larut', 'Cuka + baking soda, besi berkarat, kertas terbakar']
          ].map(function (b) {
            return el('tr', [el('td', el('strong', b[0])), el('td', b[1]), el('td', b[2])]);
          }))
        ])
      ), { warna: 'jurnal' }));

      gambarSemua();

      lepasPantau.push(Lab.on('jurnal:berubah', function () { gambarRingkas(); gambarTabel(); }));
      lepasPantau.push(Lab.on('lkpd:berubah', function () { gambarRingkas(); gambarLkpd(); }));
      lepasPantau.push(Lab.on('kuis:berubah', function () { gambarCapaian(); }));

      this._lepas = lepasPantau;
    },

    unmount: function () {
      (this._lepas || []).forEach(function (fn) { fn(); });
      this._lepas = null;
    }
  });

})(window.Lab);
