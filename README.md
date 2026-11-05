# KIUT – Konversi Satuan dan Imputasi Biaya

Aplikasi web BPS Kabupaten Buru Selatan untuk:

- **Konversi**: satuan lokal (cupa, tumpuk, ikat, …) ke satuan standar (Kg, Ons, Gram, …), 156 komoditi.
- **Imputasi**: 10 kalkulator biaya, yaitu BOS, PIP, BPJS (dengan pembagian Blok V.E / VII / VA),
  Imunisasi, Biaya Rawat, Melahirkan, KB, Listrik (biaya → kWh), PKH, dan Kepemilikan Rekening.

Rumus dan datanya sama dengan aplikasi AppSheet **KIUT_V3**. Setelah dibuka sekali saat ada sinyal,
aplikasi ini **bisa dipakai tanpa internet**.

---

## 1. Cara pakai di HP

1. Buka link aplikasi (mis. `https://namaakun.github.io/kiut/`) di **Chrome** saat ada sinyal.
2. Ketuk menu **⋮** → **Tambahkan ke layar utama** (atau **Instal aplikasi**).
3. Ikon **KIUT** muncul di layar utama. Mulai sekarang KIUT bisa dibuka walau tanpa sinyal.

Di setiap kalkulator, hasil langsung berubah saat angka diketik. Tombol **Salin** menyalin angkanya
(tanpa "Rp" dan titik ribuan) supaya mudah ditempel ke kuesioner.

## 2. Cara menaruh di GitHub Pages (sekali saja)

1. Masuk ke <https://github.com> (buat akun gratis bila belum punya).
2. Klik **New repository**, beri nama `kiut`, pilih **Public**, lalu **Create repository**.
3. Klik **uploading an existing file**, lalu seret **semua isi folder `kiut/`** (`index.html`, `app.js`,
   `calc.js`, `data.js`, `style.css`, `sw.js`, `manifest.json`, `README.md`, dan folder `icons`) ke halaman itu.
   Klik **Commit changes**.
4. Buka **Settings** → **Pages**. Di *Build and deployment*, pilih **Deploy from a branch**,
   branch **main**, folder **/ (root)**, lalu **Save**.
5. Tunggu 1–2 menit. Linknya muncul di halaman yang sama: `https://namaakun.github.io/kiut/`.
   Bagikan link ini ke petugas.

## 3. Cara mengubah tarif atau komoditi

Semua angka ada di satu file: **`data.js`**.

1. Di GitHub, buka `data.js` → klik ikon pensil (**Edit**).
2. Ubah angkanya. Tulis tanpa titik ribuan (`1500000`) dan gunakan titik untuk desimal (`0.29`).
   Tulis `null` bila tarif belum ada.
3. Naikkan `versi` di bagian atas `data.js`, mis. `"2026.12.01"`.
4. Buka `sw.js` → **Edit**, lalu ubah `CACHE` dengan versi yang **sama persis**: `'kiut-2026.12.01'`.
5. **Commit changes** pada kedua file.

HP petugas akan mengambil data baru otomatis saat KIUT dibuka berikutnya dengan sinyal.
Versi data yang sedang dipakai terlihat di bagian bawah beranda ("Data versi …").

> Bila langkah 4 lupa dikerjakan, HP tetap memakai data lama. Uji otomatis (bagian 5) akan mengingatkan.

## 4. Data yang perlu dicek pemilik data

Data diambil apa adanya dari sheet KIUT_V3 (6 November 2026). Hal-hal berikut tampak janggal dan
sebaiknya dikoreksi di `data.js`:

- **Sagu kasbi · plastik** muncul dua kali, dengan konversi 2,70 dan 0,19. Keduanya ditampilkan.
- **Tarif kosong** (tampil "tarif belum tersedia"):
  - Imunisasi: Polio (Tetes), DPT, HIB, DPT - Polio, DPT - HIB, DPT - HIB - Polio (Suntik),
    DPT - HB - HIB - Polio (PPI Suntik), PPI Non Suntik, Campak
  - Biaya rawat: Ambulans jarak >5 km, Mobil Jenazah jarak >5 km
  - Rekening: Bank Maluku
- **Label yang perlu dicek**:
  - PKH "Lansia (≤60 tahun)": mungkin maksudnya ≥60
  - PKH "Anak Balita (0-59 tahun)": mungkin maksudnya 0–59 bulan
  - Listrik "≤ 13000 VA": mungkin maksudnya ≥ 1300 VA
  - Ambulans "<5 km jasa medik spesialis" Rp100.000 lebih murah daripada jasa medik umum Rp150.000

## 5. Untuk pengembang

```
kiut/        file aplikasi (yang diunggah ke GitHub Pages)
  data.js    data rujukan
  calc.js    rumus (fungsi murni)
  app.js     tampilan & navigasi
  sw.js      service worker (offline)
tests/       uji otomatis
tools/make_icons.py   membuat ulang ikon PNG (Python standar)
```

Menjalankan uji (perlu Node.js 18+), dari folder proyek:

```
node --test "tests/*.test.js"
```

Mencoba di komputer:

```
python -m http.server 8765 -d kiut
```

Lalu buka <http://localhost:8765>.
