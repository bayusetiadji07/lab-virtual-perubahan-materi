# Lab Virtual — Perubahan Materi

Laboratorium virtual interaktif untuk pembelajaran IPA tentang **perubahan fisika dan
perubahan kimia**. Dibangun sebagai situs statis tanpa proses build: cukup buka
`index.html`, aplikasi langsung berjalan — termasuk saat tidak ada internet.

---

## Isi modul

| # | Modul | Yang dieksplorasi siswa |
|---|-------|-------------------------|
| 1 | **Perubahan Wujud Zat** | Slider daya pemanas/pendingin, model kalor laten dengan tetapan air yang sebenarnya, partikel padat–cair–gas, grafik suhu-vs-waktu dengan dua dataran (melebur & mendidih) |
| 2 | **Melarutkan Zat** | Garam vs gula, suhu air, pengadukan, batas kelarutan, larutan jenuh dan endapan, grafik konsentrasi |
| 3 | **Reaksi Kimia Sederhana** | Cuka + baking soda (gas CO₂, suhu turun, pereaksi pembatas, uji lakmus), perkaratan besi dalam rekaman waktu cepat, pembakaran kertas dan lilin |
| 4 | **Klasifikasi Peristiwa** | 16 kartu peristiwa sehari-hari diseret ke kotak Fisika atau Kimia, umpan balik dan alasan muncul seketika |
| 5 | **Jurnal Observasi Virtual** | Semua ciri perubahan dari modul 1–3 tercatat otomatis, rekap LKPD, capaian kuis, ekspor CSV, dan cetak laporan |

Setiap modul percobaan diakhiri **LKPD** (isian tersimpan otomatis) dan **kuis reflektif**
pilihan ganda dengan pembahasan.

---

## Menjalankan

### Cara paling sederhana (luring)

Buka `index.html` lewat klik dua kali. Seluruh aplikasi berjalan tanpa server dan tanpa
internet — tidak ada modul ES, tidak ada `fetch`, dan tidak ada pustaka dari CDN.

### Pratinjau dengan server lokal

Berguna saat mengembangkan, agar penyimpanan browser berperilaku persis seperti di produksi:

```bash
node tools/server.js
```

Lalu buka `http://localhost:5173`.

---

## Deploy ke GitHub Pages

```bash
git init
git add .
git commit -m "Lab Virtual Perubahan Materi"
git branch -M main
git remote add origin https://github.com/<pengguna>/<repo>.git
git push -u origin main
```

Kemudian di GitHub: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `(root)`**.

Tidak ada langkah build. Semua tautan memakai jalur relatif, jadi aplikasi tetap berjalan
di sub-direktori seperti `https://<pengguna>.github.io/<repo>/`.

Folder `sumber-gambar/` dan `tools/` boleh ikut ter-deploy (tidak dipakai saat runtime)
atau dihapus dari branch publikasi jika ingin menghemat ruang.

---

## Struktur berkas

```
index.html              kerangka halaman + urutan pemuatan skrip
css/app.css             seluruh gaya, termasuk gaya cetak untuk LKPD
js/core.js              helper DOM, penyimpanan, bus peristiwa, router hash, loop rAF
js/ui.js                komponen antarmuka: panel, slider, tombol, segmen, pembacaan
js/engine.js            sistem partikel tiga wujud, emitor gelembung/uap/asap, nyala api
js/chart.js             grafik garis waktu-nyata di atas kanvas (ditulis sendiri)
js/journal.js           lapisan data jurnal, LKPD, hasil kuis, ekspor CSV
js/quiz.js              komponen LKPD dan kuis reflektif
js/mod-*.js             satu berkas per modul
assets/*.png            gambar alat & bahan, sudah diperkecil dan dibuat transparan
sumber-gambar/*.png     berkas gambar asli (tidak dipakai aplikasi)
tools/server.js         server statis untuk pratinjau lokal
```

### Alur data

Modul 1–3 memanggil `Lab.jurnal.catat(...)` setiap satu tahap percobaan tuntas —
misalnya ketika seluruh es sudah melebur, ketika larutan mencapai titik jenuh, atau
ketika reaksi selesai. Modul 5 hanya membaca dan menyajikannya. Jawaban LKPD dan nilai
kuis disimpan lewat `Lab.lkpd` dan `Lab.hasilKuis`.

Seluruh data tersimpan di `localStorage` peramban dengan awalan `plm.` — tidak ada yang
dikirim ke server mana pun. Bila penyimpanan diblokir (mode penyamaran, atau sebagian
peramban saat dibuka dari `file://`), aplikasi otomatis beralih ke penyimpanan sementara
di memori dan menampilkan peringatan di halaman Jurnal.

---

## Catatan ilmiah

Model simulasi sengaja disederhanakan tetapi angka-angkanya diambil dari nilai nyata,
agar data yang muncul di LKPD tidak menyesatkan:

- **Kalor jenis & kalor laten air**: 2,10 / 4,18 / 2,00 J g⁻¹ °C⁻¹ dan 334 / 2260 J g⁻¹.
  Karena kalor uap jauh lebih besar daripada kalor lebur, dataran saat mendidih memang
  jauh lebih panjang — itu bagian dari pelajarannya, dan tersedia pengatur kecepatan waktu.
- **Kelarutan**: garam ±35,7 g/100 mL dan gula ±203 g/100 mL pada 20 °C, dengan
  ketergantungan suhu yang berbeda tajam.
- **Cuka + baking soda**: cuka dapur dianggap 5 % asam asetat; volume gas dihitung dari
  mol pereaksi pembatas dikalikan 24.000 mL/mol. Reaksi ini **endoterm**, sehingga suhu turun.
- **Perkaratan** dan **pembakaran** memakai laju yang dipercepat agar dapat diamati di kelas;
  angka waktunya bersifat ilustratif, sedangkan arah dan sebab-akibatnya benar.

---

## Aksesibilitas

- Seluruh kontrol dapat dijangkau dengan papan ketik; modul Klasifikasi punya jalur
  papan ketik tersendiri (Enter untuk mengangkat kartu, Enter lagi di kotak tujuan).
- Seret & lepas memakai Pointer Events sehingga berperilaku sama di layar sentuh.
- Animasi dihentikan otomatis bila pengguna mengaktifkan *prefers-reduced-motion*.
- Tata letak menjadi satu kolom pada layar sempit.
