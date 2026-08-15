/* Lab Virtual — Perubahan Materi
 * Dua komponen pembelajaran yang dipakai ulang tiap modul:
 * LKPD (isian terbuka, tersimpan otomatis) dan kuis reflektif pilihan ganda.
 */
(function (Lab) {
  'use strict';

  var el = Lab.el, ui = Lab.ui;
  var HURUF = ['A', 'B', 'C', 'D', 'E'];

  /* ---------- LKPD ---------- */

  /** opsi: { modul, judul, soal:[teks | {tanya, bantuan}] } */
  Lab.buatLKPD = function (opsi) {
    var tersimpan = Lab.lkpd.ambil(opsi.modul);

    var daftar = el('.lkpd', opsi.soal.map(function (s, i) {
      var tanya = typeof s === 'string' ? s : s.tanya;
      var bantuan = typeof s === 'string' ? null : s.bantuan;
      var nomor = i + 1;
      var status = el('p.lkpd__status', tersimpan[nomor] ? 'Tersimpan' : 'Belum diisi');

      var isian = el('textarea.lkpd__isian', {
        rows: 3,
        placeholder: bantuan || 'Tulis jawabanmu berdasarkan data percobaan…',
        'aria-label': 'Jawaban nomor ' + nomor
      });
      isian.value = tersimpan[nomor] || '';

      var jeda = null;
      isian.addEventListener('input', function () {
        status.textContent = 'Menyimpan…';
        clearTimeout(jeda);
        jeda = setTimeout(function () {
          Lab.lkpd.simpan(opsi.modul, nomor, isian.value);
          status.textContent = isian.value.trim() ? 'Tersimpan' : 'Belum diisi';
        }, 450);
      });

      return el('.lkpd__soal', [
        el('span.lkpd__nomor', 'Soal ' + nomor),
        el('p.lkpd__tanya', tanya),
        isian,
        status
      ]);
    }));

    var cetak = ui.tombol({
      label: 'Cetak / simpan PDF', ikon: '🖨️', jenis: 'kedua',
      onClick: function () { window.print(); }
    });

    return ui.panel(opsi.judul || 'LKPD — Lembar Kerja Peserta Didik', [
      el('p.kontrol__ket.cetak-sembunyi', {
        style: { marginBottom: '.9rem' }
      }, 'Jawaban tersimpan otomatis di perangkat ini. Gunakan tombol cetak untuk menyerahkan hasilnya.'),
      daftar,
      el('div.cetak-sembunyi', { style: { marginTop: '1rem' } }, cetak.el)
    ], { warna: 'jurnal' });
  };

  /* ---------- Kuis reflektif ---------- */

  /** opsi: { modul, judul, soal:[{ tanya, opsi:[…], benar:index, bahas }] } */
  Lab.buatKuis = function (opsi) {
    var soal = opsi.soal;
    var indeks = 0;
    var jawaban = new Array(soal.length).fill(null);
    var terkunci = false;

    var isi = el('.kuis__isi');
    var titik = el('.kuis__titik', soal.map(function () { return el('i'); }));
    var maju = el('.kuis__maju', [
      el('span.kuis__hitung', 'Soal 1 dari ' + soal.length),
      titik
    ]);

    function segarkanTitik() {
      Lab.$$('i', titik).forEach(function (t, i) {
        t.classList.toggle('is-benar', jawaban[i] === true);
        t.classList.toggle('is-salah', jawaban[i] === false);
        t.classList.toggle('is-kini', i === indeks);
      });
      var hitung = Lab.$('.kuis__hitung', maju);
      if (hitung) hitung.textContent = 'Soal ' + Math.min(indeks + 1, soal.length) + ' dari ' + soal.length;
    }

    function tampilkanSoal() {
      terkunci = false;
      Lab.clear(isi);
      var s = soal[indeks];

      var tombolOpsi = s.opsi.map(function (teks, i) {
        var b = el('button.kuis__pilihan', {
          type: 'button',
          onclick: function () { pilih(i, tombolOpsi, s, b); }
        }, [
          el('span.kuis__huruf', HURUF[i]),
          el('span', teks)
        ]);
        return b;
      });

      isi.appendChild(el('div', [
        el('p.kuis__soal', s.tanya),
        el('.kuis__opsi', tombolOpsi)
      ]));
      segarkanTitik();
    }

    function pilih(i, tombolOpsi, s, tombol) {
      if (terkunci) return;
      terkunci = true;
      var benar = i === s.benar;
      jawaban[indeks] = benar;

      tombolOpsi.forEach(function (b, k) {
        b.disabled = true;
        if (k === s.benar) b.classList.add('is-benar');
      });
      if (!benar) tombol.classList.add('is-salah');

      var lanjut = ui.tombol({
        label: indeks + 1 < soal.length ? 'Soal berikutnya →' : 'Lihat hasil',
        jenis: 'utama',
        onClick: function () {
          indeks++;
          if (indeks < soal.length) tampilkanSoal();
          else tampilkanHasil();
        }
      });

      isi.appendChild(el('.umpan', { 'data-jenis': benar ? 'benar' : 'salah' }, [
        el('strong', benar ? '✓ Tepat' : '✗ Belum tepat'),
        s.bahas
      ]));
      isi.appendChild(el('div', { style: { marginTop: '.8rem' } }, lanjut.el));
      segarkanTitik();
    }

    function tampilkanHasil() {
      var benar = jawaban.filter(Boolean).length;
      var nilai = Math.round(benar / soal.length * 100);
      var rekor = Lab.hasilKuis.simpan(opsi.modul, benar, soal.length);

      var pesan = nilai >= 80 ? 'Hebat! Kamu sudah bisa membedakan perubahan fisika dan kimia.'
        : nilai >= 60 ? 'Sudah cukup baik. Ulangi percobaan pada bagian yang masih ragu.'
        : 'Belum tuntas. Coba jalankan lagi percobaannya, perhatikan ciri-ciri perubahannya.';

      Lab.clear(isi);
      isi.appendChild(el('.kuis__hasil', [
        el('span.kuis__nilai', String(nilai)),
        el('p', [el('strong', benar + ' dari ' + soal.length + ' benar')]),
        el('p', { style: { color: 'var(--tinta-2)' } }, pesan),
        rekor && rekor.benar > benar
          ? el('p.kontrol__ket', 'Nilai terbaikmu sebelumnya: ' + rekor.benar + '/' + rekor.total)
          : null,
        el('div', { style: { marginTop: '1rem', display: 'flex', gap: '.5rem', justifyContent: 'center', flexWrap: 'wrap' } }, [
          ui.tombol({
            label: 'Ulangi kuis', ikon: '↻', jenis: 'kedua',
            onClick: function () {
              indeks = 0;
              jawaban = new Array(soal.length).fill(null);
              tampilkanSoal();
            }
          }).el,
          ui.tombol({
            label: 'Buka Jurnal Observasi', ikon: '📓', jenis: 'utama',
            onClick: function () { Lab.pergiKe('jurnal'); }
          }).el
        ])
      ]));
      segarkanTitik();
    }

    tampilkanSoal();

    return ui.panel(opsi.judul || 'Kuis reflektif', el('.kuis', [maju, isi]), { warna: 'jurnal' });
  };

})(window.Lab);
