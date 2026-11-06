# KIUT – Konversi Satuan dan Imputasi Biaya

Aplikasi web BPS Kabupaten Buru Selatan untuk:

- **Konversi**: satuan lokal (cupa, tumpuk, ikat, …) ke satuan standar (Kg, Ons, Gram, …), 156 komoditi.
- **Imputasi**: 10 kalkulator biaya, yaitu BOS, PIP, BPJS (dengan pembagian Blok V.E / VII / VA),
  Imunisasi, Biaya Rawat, Melahirkan, KB, Listrik (biaya → kWh), PKH, dan Kepemilikan Rekening.

Rumus dan datanya sama dengan aplikasi AppSheet **KIUT_V3**.

Setiap pengguna harus **login** dengan akun yang dibuat admin. Ada dua peran:

- **Petugas**: memakai kalkulator Konversi dan Imputasi.
- **Admin**: semua fitur petugas, ditambah menu **Admin** untuk mengelola akun dan data tarif/komoditi.

Akun, sesi, dan data tersimpan di Google Sheet **KIUT Data** (lewat Google Apps Script). Login pertama
butuh sinyal. Sesudah itu kalkulator **tetap bisa dipakai tanpa internet** selama 30 hari, dan masa itu
diperpanjang otomatis setiap kali aplikasi dibuka saat ada sinyal.

---

## 1. Cara pakai di HP

1. Buka link aplikasi (mis. `https://namaakun.github.io/kiut/`) di **Chrome** saat ada sinyal.
2. Login dengan username dan password dari admin. Pada login pertama, Anda diminta mengganti password.
3. Ketuk menu **⋮** → **Tambahkan ke layar utama** (atau **Instal aplikasi**).
4. Ikon **KIUT** muncul di layar utama. Mulai sekarang KIUT bisa dibuka walau tanpa sinyal.

Di setiap kalkulator, hasil langsung berubah saat angka diketik. Tombol **Salin** menyalin angkanya
(tanpa "Rp" dan titik ribuan) supaya mudah ditempel ke kuesioner.

Menu nama pengguna (kanan atas) berisi **Ganti password** dan **Keluar**.

## 2. Cara menaruh di GitHub Pages (sekali saja)

Sebelumnya server harus sudah disiapkan: lihat [docs/PANDUAN-SERVER.md](../docs/PANDUAN-SERVER.md).

1. Masuk ke <https://github.com> (buat akun gratis bila belum punya).
2. Klik **New repository**, beri nama `kiut`, pilih **Public**, lalu **Create repository**.
3. Klik **uploading an existing file**, lalu seret **semua isi folder `kiut/`** (`index.html`, `app.js`,
   `admin.js`, `api.js`, `sesi.js`, `config.js`, `calc.js`, `style.css`, `sw.js`, `manifest.json`,
   `README.md`, dan folder `icons`) ke halaman itu. Klik **Commit changes**.
4. Buka **Settings** → **Pages**. Di *Build and deployment*, pilih **Deploy from a branch**,
   branch **main**, folder **/ (root)**, lalu **Save**.
5. Tunggu 1–2 menit. Linknya muncul di halaman yang sama: `https://namaakun.github.io/kiut/`.
   Bagikan link ini ke petugas.

Setiap kali mengunggah versi baru file aplikasi, naikkan angka `CACHE` di `sw.js`
(mis. `'kiut-app-3'` → `'kiut-app-4'`) supaya HP mengambil versi baru.

## 3. Cara mengelola akun dan data

Login sebagai admin, lalu buka menu **Admin**.

- **Akun**: tambah petugas atau admin, ubah nama/peran, reset password, nonaktifkan atau aktifkan akun.
  Password awal ditampilkan **sekali saja**. Berikan ke orangnya; ia wajib menggantinya saat login pertama.
- **Data**: pilih tabel (Konversi, BOS, PIP, BPJS, …), lalu tambah, ubah, atau hapus baris.
  Setiap isian diperiksa sebelum disimpan. Centang **Tarif belum tersedia** bila tarifnya memang kosong.

HP petugas mengambil data baru otomatis saat KIUT dibuka berikutnya dengan sinyal. Admin butuh sinyal
untuk menyimpan perubahan.

Data juga bisa diedit langsung di Google Sheet **KIUT Data**. Caranya ada di bagian akhir
[docs/PANDUAN-SERVER.md](../docs/PANDUAN-SERVER.md).

## 4. Data yang perlu dicek pemilik data

Data awal diambil apa adanya dari sheet KIUT_V3 (6 November 2026). Hal-hal berikut tampak janggal dan
sebaiknya dikoreksi lewat **Admin → Data**:

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
kiut/            file aplikasi (yang diunggah ke GitHub Pages)
  config.js      alamat server (Web app URL Apps Script)
  calc.js        rumus (fungsi murni)
  sesi.js        penyimpanan sesi & data di HP
  api.js         klien server
  app.js         tampilan, login, navigasi
  admin.js       halaman admin
  sw.js          service worker (offline)
server/          kode Apps Script (Inti.js = logika, Kode.gs = adaptor Sheet, DataAwal.gs = data awal)
data/data-awal.js  data awal dari KIUT_V3 (sumber DataAwal.gs)
tests/           uji otomatis
tools/           server-lokal.js (server uji), gabung_server.js, buat_data_awal.js, make_icons.py
```

Menjalankan uji (perlu Node.js 18+), dari folder proyek:

```
node --test "tests/*.test.js"
```

Mencoba di komputer tanpa menyentuh data sungguhan: ganti sementara `apiUrl` di `config.js` menjadi
`'http://localhost:8787/'`, lalu jalankan

```
node tools/server-lokal.js
python -m http.server 8765 -d kiut
```

dan buka <http://localhost:8765>. Akun uji: `admin` / `admin12345` dan `petugas` / `petugas123`.
