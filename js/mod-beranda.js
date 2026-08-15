/* Lab Virtual — Perubahan Materi
 * Beranda: pengantar singkat dan daftar modul.
 */
(function (Lab) {
  'use strict';

  var el = Lab.el, ui = Lab.ui;

  var DAFTAR = [
    {
      id: 'wujud', nomor: 1, ikon: '🧊', warna: 'fisika', kategori: 'Perubahan fisika',
      judul: 'Perubahan Wujud Zat',
      ringkas: 'Panaskan es sampai mendidih. Amati susunan partikel berubah dari padat, cair, sampai gas, dan temukan mengapa suhu berhenti naik saat zat sedang melebur.',
      tag: ['Slider pemanas', 'Kalor laten', 'Grafik suhu–waktu']
    },
    {
      id: 'larutan', nomor: 2, ikon: '🥄', warna: 'fisika', kategori: 'Perubahan fisika',
      judul: 'Melarutkan Zat',
      ringkas: 'Larutkan garam atau gula ke dalam air. Ubah suhu dan pengadukan, lalu cari batas kelarutan sampai muncul endapan di dasar gelas.',
      tag: ['Kelarutan', 'Pengadukan', 'Larutan jenuh']
    },
    {
      id: 'reaksi', nomor: 3, ikon: '🧪', warna: 'kimia', kategori: 'Perubahan kimia',
      judul: 'Reaksi Kimia Sederhana',
      ringkas: 'Tiga percobaan klasik: cuka bertemu baking soda, paku besi berkarat dipercepat, serta pembakaran kertas dan lilin.',
      tag: ['Gas CO₂', 'Perkaratan', 'Pembakaran']
    },
    {
      id: 'klasifikasi', nomor: 4, ikon: '🗂️', warna: 'campur', kategori: 'Latihan',
      judul: 'Klasifikasi Peristiwa',
      ringkas: 'Seret setiap peristiwa sehari-hari ke kotak yang tepat: perubahan fisika atau perubahan kimia. Umpan balik dan alasannya muncul seketika.',
      tag: ['Seret & lepas', 'Umpan balik instan', 'Skor']
    },
    {
      id: 'jurnal', nomor: 5, ikon: '📓', warna: 'jurnal', kategori: 'Laporan',
      judul: 'Jurnal Observasi Virtual',
      ringkas: 'Semua ciri perubahan yang kamu temukan tercatat otomatis di sini. Lengkapi LKPD, kerjakan kuis reflektif, lalu unduh atau cetak hasilnya.',
      tag: ['Pencatatan otomatis', 'LKPD', 'Unduh CSV']
    }
  ];

  function kartu(m) {
    var ringkas = Lab.jurnal.ringkas();
    var jumlah = ringkas.modul[m.id] || 0;
    return el('a.kartu', { href: '#/' + m.id, 'data-warna': m.warna }, [
      el('.kartu__atas', [
        el('span.kartu__ikon', { 'aria-hidden': 'true' }, m.ikon),
        el('span.kartu__nomor', 'Modul ' + m.nomor)
      ]),
      el('p.kartu__kategori', m.kategori),
      el('h3.kartu__judul', m.judul),
      el('p.kartu__ringkas', m.ringkas),
      el('.kartu__tag', [
        m.tag.map(function (t) { return el('span', t); }),
        jumlah ? ui.lencana(jumlah + ' observasi', 'benar') : null
      ])
    ]);
  }

  Lab.registerModule({
    id: 'beranda',
    judul: 'Beranda',
    mount: function (view) {
      var ringkas = Lab.jurnal.ringkas();

      view.appendChild(el('section.hero', [
        el('span.hero__label', 'Media pembelajaran IPA'),
        el('h1', 'Laboratorium Virtual Perubahan Materi'),
        el('p.hero__teks',
          'Lakukan percobaan sungguhan tanpa alat dan bahan: atur suhu, aduk larutan, campurkan zat, ' +
          'lalu amati apa yang terjadi pada partikelnya. Setiap ciri perubahan yang muncul dicatat ' +
          'otomatis ke jurnal observasi sebagai bahan LKPD.'),
        el('ul.hero__poin', [
          el('li', '⚛️ Model partikel bergerak sesuai suhu'),
          el('li', '📈 Grafik data langsung dari percobaan'),
          el('li', '📝 LKPD & kuis terintegrasi'),
          el('li', '📶 Berjalan luring, tanpa internet')
        ]),
        ringkas.total ? el('div', { style: { marginTop: '1.2rem' } }, [
          ui.lencana('Sudah ' + ringkas.total + ' observasi tercatat', 'benar'),
          ' ',
          el('a.tombol', { href: '#/jurnal', 'data-jenis': 'halus' }, 'Lihat jurnal →')
        ]) : null
      ]));

      view.appendChild(el('.bagian-judul', [
        el('h2', 'Pilih modul percobaan'),
        el('p', 'Urutan 1 → 5 mengikuti alur pembelajaran, tetapi bebas dibuka dari mana saja.')
      ]));

      view.appendChild(el('.kartu-grid', DAFTAR.map(kartu)));

      view.appendChild(el('.bagian-judul', [
        el('h2', 'Sekilas: fisika atau kimia?')
      ]));

      view.appendChild(el('.klas__papan', [
        el('.kotak', { 'data-jenis': 'fisika' }, [
          el('.kotak__kepala', [el('h3.kotak__judul', '🔵 Perubahan fisika')]),
          el('p.kotak__petunjuk',
            'Tidak menghasilkan zat baru. Yang berubah hanya wujud, bentuk, ukuran, atau kelarutannya. ' +
            'Umumnya dapat dikembalikan ke keadaan semula — es mencair lalu bisa dibekukan lagi.')
        ]),
        el('.kotak', { 'data-jenis': 'kimia' }, [
          el('.kotak__kepala', [el('h3.kotak__judul', '🟠 Perubahan kimia')]),
          el('p.kotak__petunjuk',
            'Menghasilkan zat baru dengan sifat berbeda. Ditandai timbulnya gas, perubahan warna, ' +
            'perubahan suhu, endapan, atau bau. Umumnya sulit dikembalikan — abu tidak bisa jadi kertas lagi.')
        ])
      ]));
    }
  });

})(window.Lab);
