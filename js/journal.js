/* Lab Virtual — Perubahan Materi
 * Lapisan data untuk Jurnal Observasi, LKPD, dan hasil kuis.
 * Modul 1–4 memanggil Lab.jurnal.catat(...) setiap satu percobaan tuntas;
 * Modul 5 hanya menampilkan dan mengekspor apa yang sudah terkumpul di sini.
 */
(function (Lab) {
  'use strict';

  var KUNCI_JURNAL = 'jurnal';
  var KUNCI_LKPD = 'lkpd';
  var KUNCI_KUIS = 'kuis';
  var BATAS = 300;

  /* Label ciri perubahan — dipakai tabel jurnal dan ekspor. */
  var CIRI = [
    { kunci: 'warna',   label: 'Perubahan warna',    ikon: '🎨' },
    { kunci: 'suhu',    label: 'Perubahan suhu',     ikon: '🌡️' },
    { kunci: 'gas',     label: 'Timbul gas',         ikon: '🫧' },
    { kunci: 'endapan', label: 'Terbentuk endapan',  ikon: '🧂' },
    { kunci: 'wujud',   label: 'Perubahan wujud',    ikon: '💧' },
    { kunci: 'bau',     label: 'Perubahan bau',      ikon: '👃' }
  ];

  function sekarang() { return new Date().toISOString(); }

  function baca() {
    var data = Lab.store.get(KUNCI_JURNAL, []);
    return Array.isArray(data) ? data : [];
  }
  function tulis(data) {
    Lab.store.set(KUNCI_JURNAL, data.slice(-BATAS));
    Lab.emit('jurnal:berubah', data.length);
  }

  var terakhirDicatat = {};

  var jurnal = Lab.jurnal = {
    CIRI: CIRI,

    /** rekam: { modul, modulJudul, percobaan, jenis:'fisika'|'kimia',
     *           ciri:{kunci:teks|false}, zatBaru:bool, bisaBalik:bool,
     *           data:{label:nilai}, kesimpulan } */
    catat: function (rekam) {
      // Cegah catatan kembar saat pengguna mengulang aksi yang sama beruntun.
      var sidik = rekam.modul + '|' + rekam.percobaan + '|' + JSON.stringify(rekam.ciri || {});
      var kini = Date.now();
      if (terakhirDicatat[sidik] && kini - terakhirDicatat[sidik] < 4000) return null;
      terakhirDicatat[sidik] = kini;

      var data = baca();
      var entri = Object.assign({
        id: 'j' + kini.toString(36) + Math.random().toString(36).slice(2, 6),
        waktu: sekarang()
      }, rekam);
      data.push(entri);
      tulis(data);
      Lab.toast('Observasi tercatat di Jurnal', 'benar');
      return entri;
    },

    semua: function () { return baca(); },

    perModul: function (modul) {
      return baca().filter(function (e) { return e.modul === modul; });
    },

    hapus: function (id) {
      tulis(baca().filter(function (e) { return e.id !== id; }));
    },

    hapusSemua: function () {
      terakhirDicatat = {};
      tulis([]);
    },

    ringkas: function () {
      var data = baca();
      return {
        total: data.length,
        fisika: data.filter(function (e) { return e.jenis === 'fisika'; }).length,
        kimia: data.filter(function (e) { return e.jenis === 'kimia'; }).length,
        modul: data.reduce(function (acc, e) { acc[e.modul] = (acc[e.modul] || 0) + 1; return acc; }, {})
      };
    },

    /** Baris CSV siap dibuka di Excel / Google Sheets. */
    csv: function () {
      var kepala = ['Waktu', 'Modul', 'Percobaan', 'Jenis perubahan']
        .concat(CIRI.map(function (c) { return c.label; }))
        .concat(['Zat baru', 'Dapat dibalik', 'Data pengukuran', 'Kesimpulan']);

      function bungkus(v) {
        var s = v == null ? '' : String(v);
        return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }

      var baris = [kepala.map(bungkus).join(';')];
      baca().forEach(function (e) {
        var t = new Date(e.waktu);
        var sel = [
          t.toLocaleString('id-ID'),
          e.modulJudul || e.modul,
          e.percobaan || '',
          e.jenis === 'kimia' ? 'Kimia' : 'Fisika'
        ];
        CIRI.forEach(function (c) {
          var v = e.ciri && e.ciri[c.kunci];
          sel.push(v ? (typeof v === 'string' ? v : 'Ya') : 'Tidak');
        });
        sel.push(e.zatBaru ? 'Ya' : 'Tidak');
        sel.push(e.bisaBalik ? 'Ya' : 'Tidak');
        sel.push(Object.keys(e.data || {}).map(function (k) {
          return k + ': ' + e.data[k];
        }).join(' | '));
        sel.push(e.kesimpulan || '');
        baris.push(sel.map(bungkus).join(';'));
      });
      return baris.join('\r\n');
    }
  };

  /* ---------- LKPD ---------- */

  Lab.lkpd = {
    ambil: function (modul) { return Lab.store.get(KUNCI_LKPD + '.' + modul, {}); },
    simpan: function (modul, nomor, jawaban) {
      var isi = Lab.lkpd.ambil(modul);
      isi[nomor] = jawaban;
      Lab.store.set(KUNCI_LKPD + '.' + modul, isi);
      Lab.emit('lkpd:berubah', modul);
    },
    hapusSemua: function (daftarModul) {
      daftarModul.forEach(function (m) { Lab.store.remove(KUNCI_LKPD + '.' + m); });
      Lab.emit('lkpd:berubah', null);
    },
    /** Jumlah soal yang sudah diisi pada satu modul. */
    terisi: function (modul) {
      var isi = Lab.lkpd.ambil(modul);
      return Object.keys(isi).filter(function (k) {
        return String(isi[k] || '').trim().length > 0;
      }).length;
    }
  };

  /* ---------- Hasil kuis ---------- */

  Lab.hasilKuis = {
    semua: function () { return Lab.store.get(KUNCI_KUIS, {}); },
    simpan: function (modul, benar, total) {
      var isi = Lab.hasilKuis.semua();
      var lama = isi[modul];
      // Simpan capaian terbaik supaya siswa terdorong mengulang.
      if (!lama || benar > lama.benar) {
        isi[modul] = { benar: benar, total: total, waktu: sekarang() };
        Lab.store.set(KUNCI_KUIS, isi);
      }
      Lab.emit('kuis:berubah', modul);
      return isi[modul];
    },
    hapusSemua: function () {
      Lab.store.remove(KUNCI_KUIS);
      Lab.emit('kuis:berubah', null);
    }
  };

  /* ---------- Unduh berkas ---------- */

  /** Mengunduh teks sebagai berkas. BOM UTF-8 ditambahkan agar Excel
   *  membaca huruf beraksen dan simbol derajat dengan benar. */
  Lab.unduh = function (namaBerkas, teks, tipe) {
    try {
      var blob = new Blob(['﻿' + teks], { type: (tipe || 'text/csv') + ';charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = Lab.el('a', { href: url, download: namaBerkas });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      return true;
    } catch (e) {
      console.error('[Lab] gagal mengunduh:', e);
      Lab.toast('Browser menolak unduhan. Gunakan tombol Cetak sebagai gantinya.', 'salah');
      return false;
    }
  };

})(window.Lab);
