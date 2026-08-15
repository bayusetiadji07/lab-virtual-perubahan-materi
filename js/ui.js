/* Lab Virtual — Perubahan Materi
 * Komponen antarmuka yang dipakai bersama semua modul: panel, slider, tombol,
 * pemilih segmen, pembacaan data, dan panel instruksi.
 */
(function (Lab) {
  'use strict';

  var el = Lab.el, num = Lab.num;
  var ui = Lab.ui = {};

  var idKe = 0;
  function idBaru(awalan) { return awalan + '-' + (++idKe); }

  /* ---------- Wadah ---------- */

  ui.panel = function (judul, isi, opsi) {
    opsi = opsi || {};
    var kepala = judul
      ? el('.panel__kepala', [
          el('h2.panel__judul', judul),
          opsi.aksi || null
        ])
      : null;
    return el('section.panel' + (opsi.kelas ? '.' + opsi.kelas : ''), { 'data-warna': opsi.warna || null },
      [kepala, el('.panel__isi', isi)]);
  };

  ui.grup = function (judul, isi) {
    return el('.grup', [judul ? el('h3.grup__judul', judul) : null, el('.grup__isi', isi)]);
  };

  /* ---------- Slider ---------- */

  /** opsi: { label, min, max, step, nilai, satuan, format(v), keterangan, onInput(v), tanda:[{nilai,label}] } */
  ui.slider = function (opsi) {
    var id = idBaru('slider');
    var format = opsi.format || function (v) { return num(v, opsi.desimal || 0); };

    var nilaiTeks = el('output.slider__nilai', { for: id }, format(opsi.nilai));
    var input = el('input.slider__input', {
      type: 'range', id: id,
      min: opsi.min, max: opsi.max,
      step: opsi.step == null ? 1 : opsi.step,
      value: opsi.nilai,
      'aria-describedby': opsi.keterangan ? id + '-ket' : null
    });

    var tanda = null;
    if (opsi.tanda && opsi.tanda.length) {
      tanda = el('.slider__tanda', opsi.tanda.map(function (t) {
        var p = Lab.norm(t.nilai, opsi.min, opsi.max) * 100;
        return el('span.slider__tanda-item', { style: { left: p + '%' } }, t.label);
      }));
    }

    function terapkan(v, kirim) {
      nilaiTeks.textContent = format(v);
      input.style.setProperty('--isi', (Lab.norm(v, +opsi.min, +opsi.max) * 100) + '%');
      if (kirim && opsi.onInput) opsi.onInput(v);
    }

    input.addEventListener('input', function () { terapkan(+input.value, true); });

    var node = el('.kontrol.slider', [
      el('.kontrol__baris', [
        el('label.kontrol__label', { for: id }, opsi.label),
        el('.slider__keluaran', [nilaiTeks, opsi.satuan ? el('span.slider__satuan', opsi.satuan) : null])
      ]),
      input,
      tanda,
      opsi.keterangan ? el('p.kontrol__ket', { id: id + '-ket' }, opsi.keterangan) : null
    ]);

    terapkan(opsi.nilai, false);

    return {
      el: node,
      input: input,
      get: function () { return +input.value; },
      set: function (v, kirim) { input.value = v; terapkan(+input.value, !!kirim); },
      nonaktif: function (mati) {
        input.disabled = !!mati;
        node.classList.toggle('is-mati', !!mati);
      }
    };
  };

  /* ---------- Tombol ---------- */

  /** opsi: { label, jenis: 'utama'|'kedua'|'halus'|'bahaya', ikon, onClick, judul } */
  ui.tombol = function (opsi) {
    var node = el('button.tombol', {
      type: 'button',
      'data-jenis': opsi.jenis || 'kedua',
      title: opsi.judul || null,
      onclick: opsi.onClick || null
    }, [
      opsi.ikon ? el('span.tombol__ikon', { 'aria-hidden': 'true' }, opsi.ikon) : null,
      el('span.tombol__teks', opsi.label)
    ]);
    return {
      el: node,
      setLabel: function (t) { node.querySelector('.tombol__teks').textContent = t; },
      setIkon: function (t) {
        var i = node.querySelector('.tombol__ikon');
        if (i) i.textContent = t;
      },
      nonaktif: function (mati) { node.disabled = !!mati; }
    };
  };

  ui.barisTombol = function (daftar) {
    return el('.tombol-baris', daftar.map(function (t) { return t.el || t; }));
  };

  /* ---------- Pemilih segmen ---------- */

  /** opsi: { label, opsi:[{nilai,label,ikon}], nilai, onChange(v) } */
  ui.segmen = function (opsi) {
    var nilai = opsi.nilai;
    var tombol = {};

    var daftar = el('.segmen__daftar', { role: 'radiogroup', 'aria-label': opsi.label || 'Pilihan' },
      opsi.opsi.map(function (o) {
        var b = el('button.segmen__item', {
          type: 'button', role: 'radio',
          'aria-checked': o.nilai === nilai ? 'true' : 'false',
          onclick: function () { pilih(o.nilai, true); }
        }, [
          o.ikon ? el('span.segmen__ikon', { 'aria-hidden': 'true' }, o.ikon) : null,
          el('span', o.label)
        ]);
        b.classList.toggle('is-aktif', o.nilai === nilai);
        tombol[o.nilai] = b;
        return b;
      }));

    function pilih(v, kirim) {
      nilai = v;
      Object.keys(tombol).forEach(function (k) {
        var aktif = k === String(v);
        tombol[k].classList.toggle('is-aktif', aktif);
        tombol[k].setAttribute('aria-checked', aktif ? 'true' : 'false');
      });
      if (kirim && opsi.onChange) opsi.onChange(v);
    }

    var node = el('.kontrol.segmen', [
      opsi.label ? el('span.kontrol__label', opsi.label) : null,
      daftar,
      opsi.keterangan ? el('p.kontrol__ket', opsi.keterangan) : null
    ]);

    return {
      el: node,
      get: function () { return nilai; },
      set: function (v, kirim) { pilih(v, !!kirim); },
      nonaktif: function (mati) {
        Object.keys(tombol).forEach(function (k) { tombol[k].disabled = !!mati; });
        node.classList.toggle('is-mati', !!mati);
      }
    };
  };

  /* ---------- Saklar ---------- */

  ui.saklar = function (opsi) {
    var id = idBaru('saklar');
    var input = el('input.saklar__input', {
      type: 'checkbox', id: id, checked: opsi.aktif || null,
      onchange: function () { if (opsi.onChange) opsi.onChange(input.checked); }
    });
    var node = el('.kontrol.saklar', [
      el('label.saklar__label', { for: id }, [
        input,
        el('span.saklar__jalur', { 'aria-hidden': 'true' }, el('span.saklar__bulat')),
        el('span.saklar__teks', opsi.label)
      ]),
      opsi.keterangan ? el('p.kontrol__ket', opsi.keterangan) : null
    ]);
    return {
      el: node,
      get: function () { return input.checked; },
      set: function (v, kirim) {
        input.checked = !!v;
        if (kirim && opsi.onChange) opsi.onChange(input.checked);
      },
      nonaktif: function (mati) { input.disabled = !!mati; }
    };
  };

  /* ---------- Pembacaan data ---------- */

  /** daftar: [{ kunci, label, nilai, satuan, warna }] */
  ui.pembacaan = function (daftar) {
    var sel = {};
    var node = el('.pembacaan', daftar.map(function (d) {
      var nilai = el('span.pembacaan__nilai', d.nilai == null ? '–' : d.nilai);
      sel[d.kunci] = nilai;
      return el('.pembacaan__item', { 'data-warna': d.warna || null }, [
        el('span.pembacaan__label', d.label),
        el('.pembacaan__baris', [nilai, d.satuan ? el('span.pembacaan__satuan', d.satuan) : null])
      ]);
    }));
    return {
      el: node,
      set: function (kunci, nilai) {
        if (sel[kunci]) sel[kunci].textContent = nilai == null ? '–' : nilai;
      },
      warna: function (kunci, warna) {
        if (sel[kunci]) sel[kunci].closest('.pembacaan__item').dataset.warna = warna || '';
      }
    };
  };

  /* ---------- Lencana status ---------- */

  ui.lencana = function (teks, jenis) {
    return el('span.lencana', { 'data-jenis': jenis || 'netral' }, teks);
  };

  /* ---------- Panel instruksi ---------- */

  /** opsi: { id, judul, tujuan, langkah:[…] } — status buka/tutup diingat per pengguna. */
  ui.instruksi = function (opsi) {
    var kunci = 'instruksi.' + opsi.id;
    var tertutup = Lab.store.get(kunci, false);

    var isi = el('.instruksi__isi', [
      opsi.tujuan ? el('p.instruksi__tujuan', [el('strong', 'Tujuan: '), opsi.tujuan]) : null,
      el('ol.instruksi__langkah', (opsi.langkah || []).map(function (t) {
        return el('li', { html: t });
      }))
    ]);

    var tombolTutup = el('button.instruksi__tutup', {
      type: 'button',
      'aria-expanded': tertutup ? 'false' : 'true',
      onclick: function () {
        tertutup = !tertutup;
        node.classList.toggle('is-tertutup', tertutup);
        tombolTutup.setAttribute('aria-expanded', tertutup ? 'false' : 'true');
        tombolTutup.textContent = tertutup ? 'Tampilkan' : 'Sembunyikan';
        Lab.store.set(kunci, tertutup);
      }
    }, tertutup ? 'Tampilkan' : 'Sembunyikan');

    var node = el('section.instruksi', [
      el('.instruksi__kepala', [
        el('h2.instruksi__judul', [el('span.instruksi__ikon', { 'aria-hidden': 'true' }, '📋'), opsi.judul || 'Petunjuk kegiatan']),
        tombolTutup
      ]),
      isi
    ]);
    node.classList.toggle('is-tertutup', tertutup);
    return node;
  };

  /* ---------- Tata letak baku modul ---------- */

  /** Susunan tetap tiap modul: kontrol di kiri, panggung simulasi di kanan,
   *  data/grafik di bawah. Mengembalikan simpul-simpul untuk diisi modul. */
  ui.tataLetak = function (opsi) {
    var kontrol = el('.lab__kontrol');
    var panggung = el('.lab__panggung');
    var data = el('.lab__data');

    var node = el('.lab', { 'data-warna': opsi && opsi.warna || 'fisika' }, [
      el('.lab__utama', [
        el('aside.lab__sisi', { 'aria-label': 'Panel kontrol' }, kontrol),
        el('.lab__pentas', { 'aria-label': 'Area simulasi' }, panggung)
      ]),
      data
    ]);

    return { el: node, kontrol: kontrol, panggung: panggung, data: data };
  };

  /** Judul halaman modul dengan tombol kembali. */
  ui.kepalaModul = function (opsi) {
    return el('header.modul-kepala', [
      el('a.modul-kepala__kembali', { href: '#/beranda' }, '← Semua modul'),
      el('.modul-kepala__teks', [
        el('p.modul-kepala__kategori', { 'data-warna': opsi.warna }, opsi.kategori),
        el('h1.modul-kepala__judul', opsi.judul),
        opsi.ringkas ? el('p.modul-kepala__ringkas', opsi.ringkas) : null
      ])
    ]);
  };

})(window.Lab);
