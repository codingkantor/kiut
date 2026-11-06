// Tampilan KIUT: router hash + render layar.
// Rumus di calc.js; data & sesi login di sesi.js (diambil dari server lewat api.js).
(function () {
  'use strict';

  const C = KIUT_CALC;
  const SESI = KIUT_SESI;
  const API = KIUT_API;
  const TABEL = ['konversi', 'bos', 'pip', 'bpjs', 'imunisasi', 'rawat', 'melahirkan', 'kb', 'listrik', 'pkh', 'rekening'];
  let DATA = null;          // data tarif aktif (dari SESI.data())
  let galatData = false;    // true bila data terakhir dari server tidak bisa dipakai
  let pesanLogin = '';      // pesan yang ditampilkan di layar login berikutnya
  const app = document.getElementById('app');
  const judulEl = document.getElementById('judul');
  const kembaliEl = document.getElementById('kembali');

  // ---------- utilitas ----------
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rp = n => C.formatRupiah(n);

  // Ikon garis sederhana (24×24), digambar sendiri agar tersedia offline.
  const IKON = {
    konversi: '<path d="M12 3v18M5 21h14M6 7h12M6 7l-3 7a3 3 0 006 0zM18 7l-3 7a3 3 0 006 0z"/>',
    imputasi: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><rect x="8" y="5.5" width="8" height="4" rx="1"/><path d="M8.5 13h.01M12 13h.01M15.5 13h.01M8.5 16.5h.01M12 16.5h.01M15.5 16.5h.01"/>',
    bos: '<path d="M3 10l9-6 9 6M5 10v10h14V10M10 20v-5h4v5"/>',
    pip: '<path d="M2 9l10-5 10 5-10 5zM6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5M22 9v6"/>',
    bpjs: '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="M12 8.5v7M8.5 12h7"/>',
    imunisasi: '<path d="M18 2l4 4M20 4l-9.5 9.5M14 4l6 6M15 9l-8.5 8.5H4.5v-2L13 7M4.5 19.5L2 22M9 11l2 2"/>',
    rawat: '<path d="M3 6v14M3 16h18v4M21 16v-3a3 3 0 00-3-3h-7v6"/><circle cx="7" cy="12" r="2"/><path d="M15 3v4M13 5h4"/>',
    melahirkan: '<circle cx="12" cy="7" r="4"/><path d="M10.5 7h.01M13.5 7h.01M10.8 8.6c.7.5 1.7.5 2.4 0"/><path d="M6 21c0-3.5 2.7-7 6-7s6 3.5 6 7"/>',
    kb: '<rect x="2.8" y="8.5" width="18.4" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="M9.5 9.5l5 5"/>',
    listrik: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    pkh: '<circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6M13 20c0-2.6 1.8-5 4-5s4 2.4 4 5"/>',
    rekening: '<path d="M3 9l9-5 9 5M4 9h16M5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 21h18"/>',
    admin: '<circle cx="9" cy="7" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5 1.3 0 2.5.4 3.5 1"/><circle cx="17.5" cy="16.5" r="2.5"/><path d="M17.5 12v1.5M17.5 19.5V21M13 16.5h1.5M20.5 16.5H22"/>',
  };
  const ikon = (nama, kelas = 'ikon') => `<svg class="${kelas}" viewBox="0 0 24 24" aria-hidden="true">${IKON[nama]}</svg>`;

  const PESAN = {
    kosong: '—',
    'tidak-cocok': '—',
    negatif: 'Angka harus ≥ 0',
    bulan: 'Bulan harus 1–12',
    tarif: 'Tarif belum tersedia',
  };

  // ---------- definisi kalkulator imputasi ----------
  // isian: { id, label, tipe: 'pilih'|'angka'|'centang', opsi(v), awal, tampil(v), hapus: [id…] }
  // opsi untuk 'pilih' → [nilai] ; untuk 'centang' → [{ nilai, biaya }]
  const daftar = (tabel, kolom) => () => DATA[tabel].map(r => r[kolom]);
  const unik = arr => arr.filter((x, i) => arr.indexOf(x) === i);

  const KALKULATOR = {
    bos: {
      judul: 'BOS', ket: 'Bantuan Operasional Sekolah: biaya per tahun × jumlah ART.',
      isian: [
        { id: 'jenjang', label: 'Jenjang', tipe: 'pilih', opsi: daftar('bos', 'jenjang') },
        { id: 'art', label: 'Jumlah ART', tipe: 'angka', awal: '1' },
      ],
      hitung: v => C.bos(DATA, v),
      labelHasil: 'Total biaya',
    },
    pip: {
      judul: 'PIP', ket: 'Program Indonesia Pintar: biaya per semester × jumlah ART × semester.',
      isian: [
        { id: 'jenjang', label: 'Jenjang', tipe: 'pilih', opsi: daftar('pip', 'jenjang') },
        { id: 'art', label: 'Jumlah ART', tipe: 'angka', awal: '1' },
        { id: 'semester', label: 'Banyak semester', tipe: 'angka', awal: '1' },
      ],
      hitung: v => C.pip(DATA, v),
      labelHasil: 'Total biaya',
    },
    bpjs: {
      judul: 'BPJS', ket: 'Iuran per bulan × bulan × jumlah ART penerima, lalu dibagi ke blok kuesioner.',
      isian: [
        { id: 'jenis', label: 'Jenis BPJS', tipe: 'pilih', opsi: daftar('bpjs', 'jenis') },
        { id: 'art', label: 'Jumlah ART penerima', tipe: 'angka', awal: '1' },
        { id: 'bulan', label: 'Banyak bulan (1–12)', tipe: 'angka', awal: '12' },
      ],
      hitung: v => C.bpjs(DATA, v),
      labelHasil: 'Total Biaya per Tahun (R.311 Kol.5)',
    },
    imunisasi: {
      judul: 'Imunisasi', ket: 'Centang jenis imunisasi yang diterima; biayanya dijumlahkan.',
      isian: [
        { id: 'jenis', label: 'Jenis imunisasi', tipe: 'centang', opsi: () => DATA.imunisasi.map(r => ({ nilai: r.jenis, biaya: r.biaya })) },
      ],
      hitung: v => C.imunisasi(DATA, v),
      labelHasil: 'Total biaya',
    },
    rawat: {
      judul: 'Biaya Rawat', ket: 'Tarif menurut keperluan dan jenis layanan.',
      isian: [
        { id: 'keperluan', label: 'Keperluan', tipe: 'pilih', opsi: () => unik(DATA.rawat.map(r => r.keperluan)), hapus: ['jenis'] },
        { id: 'jenis', label: 'Jenis', tipe: 'pilih', opsi: v => DATA.rawat.filter(r => r.keperluan === v.keperluan).map(r => r.jenis), tampil: v => !!v.keperluan },
      ],
      hitung: v => C.rawat(DATA, v),
      labelHasil: 'Biaya',
    },
    melahirkan: {
      judul: 'Melahirkan', ket: 'Pilih langkah demi langkah; pilihan berikutnya menyesuaikan.',
      isian: [
        { id: 'perawatan', label: 'Jenis perawatan', tipe: 'pilih', opsi: v => C.opsiMelahirkan(DATA, v, 'perawatan'), hapus: ['pemeriksaan', 'fasilitas', 'rawat'] },
        { id: 'pemeriksaan', label: 'Jenis pemeriksaan', tipe: 'pilih', opsi: v => C.opsiMelahirkan(DATA, v, 'pemeriksaan'), hapus: ['fasilitas', 'rawat'],
          tampil: v => !!v.perawatan },
        { id: 'fasilitas', label: 'Fasilitas kesehatan', tipe: 'pilih', opsi: v => C.opsiMelahirkan(DATA, v, 'fasilitas'), hapus: ['rawat'],
          tampil: v => !!v.perawatan && (!!v.pemeriksaan || C.opsiMelahirkan(DATA, v, 'pemeriksaan').length === 0) },
        { id: 'rawat', label: 'Jenis rawat', tipe: 'pilih', opsi: v => C.opsiMelahirkan(DATA, v, 'rawat'), tampil: v => !!v.fasilitas },
        { id: 'kunjungan', label: 'Banyak kunjungan', tipe: 'angka', awal: '1', tampil: v => C.perluKunjungan(DATA, v) },
      ],
      hitung: v => C.melahirkan(DATA, v),
      labelHasil: 'Total biaya',
    },
    kb: {
      judul: 'KB', ket: 'Biaya alat/layanan KB; Kondom, Pil, dan Suntik dikali banyak penggunaan per tahun.',
      isian: [
        { id: 'jenis', label: 'Jenis KB', tipe: 'pilih', opsi: daftar('kb', 'jenis') },
        { id: 'kali', label: 'Banyak penggunaan dalam 1 tahun', tipe: 'angka', awal: '1', tampil: v => !!(DATA.kb.find(r => r.jenis === v.jenis) || {}).berulang },
      ],
      hitung: v => C.kb(DATA, v),
      labelHasil: 'Total biaya',
    },
    listrik: {
      judul: 'Listrik', ket: 'Mengubah biaya listrik per bulan menjadi pemakaian kWh.',
      isian: [
        { id: 'daya', label: 'Daya', tipe: 'pilih', opsi: daftar('listrik', 'daya') },
        { id: 'biaya', label: 'Biaya per bulan (Rp)', tipe: 'angka' },
      ],
      hitung: v => C.listrik(DATA, v),
      labelHasil: 'Total kWh per bulan',
    },
    pkh: {
      judul: 'PKH', ket: 'Centang kriteria ART penerima PKH; bantuannya dijumlahkan.',
      isian: [
        { id: 'kriteria', label: 'Kriteria ART', tipe: 'centang', opsi: () => DATA.pkh.map(r => ({ nilai: r.kriteria, biaya: r.biaya })) },
      ],
      hitung: v => C.pkh(DATA, v),
      labelHasil: 'Total bantuan',
    },
    rekening: {
      judul: 'Kepemilikan Rekening', ket: 'Biaya administrasi + kartu debit per bulan.',
      isian: [
        { id: 'rekening', label: 'Jenis rekening', tipe: 'pilih', opsi: daftar('rekening', 'rekening') },
      ],
      hitung: v => C.rekening(DATA, v),
      labelHasil: 'Total biaya per bulan',
    },
  };
  const URUTAN = ['bos', 'pip', 'bpjs', 'imunisasi', 'rawat', 'melahirkan', 'kb', 'listrik', 'pkh', 'rekening'];

  // Nilai isian disimpan selama aplikasi terbuka, agar tidak hilang saat kembali.
  const keadaan = {};
  function nilaiAwal(def) {
    const v = {};
    for (const f of def.isian) v[f.id] = f.tipe === 'centang' ? [] : (f.awal || '');
    return v;
  }

  // ---------- kartu hasil ----------
  // baris: [{ label, teks, nilai, kecil? }]
  function htmlHasil(h, baris, ekstra = '') {
    if (!h.ok) return `<section class="hasil" aria-live="polite"><p class="pesan">${esc(PESAN[h.alasan] || '—')}</p></section>`;
    const isi = baris.map(b => `
      <div class="baris${b.kecil ? ' kecil' : ''}">
        <div class="isi"><span class="label">${esc(b.label)}</span><span class="angka">${esc(b.teks)}</span></div>
        <button type="button" class="salin" data-salin="${Math.round(b.nilai * 100) / 100}">Salin</button>
      </div>`).join('');
    return `<section class="hasil" aria-live="polite">${isi}${ekstra}</section>`;
  }

  function barisImputasi(id, def, h) {
    if (id === 'listrik') return [{ label: def.labelHasil, teks: `${C.formatDesimal(h.nilai)} kWh`, nilai: h.nilai }];
    const baris = [{ label: def.labelHasil, teks: rp(h.nilai), nilai: h.nilai }];
    if (id === 'bpjs') {
      const LABEL = { ve: 'Blok V.E Rinc.1 Kol.3', vii: 'Blok VII Rinc.1 Kol.2', va: 'Blok VA Kol.6' };
      for (const k of ['ve', 'vii', 'va']) {
        if (h.blok[k] !== null) baris.push({ label: LABEL[k], teks: rp(h.blok[k]), nilai: h.blok[k], kecil: true });
      }
    }
    return baris;
  }

  // ---------- layar ----------
  const formatTanggal = iso => {
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  };

  function layarBeranda() {
    judul('KIUT', false);
    const akun = SESI.akun() || {};
    const tgl = formatTanggal(SESI.diperbarui());
    app.innerHTML = `
      <section class="sambutan">
        <img class="logo" src="./icons/icon-192.png" alt="Logo KIUT" width="96" height="96">
        <h2>KIUT</h2>
        <p>Konversi Satuan dan Imputasi Biaya<br>BPS Kabupaten Buru Selatan</p>
      </section>
      <nav class="menu-besar">
        <a href="#/konversi">${ikon('konversi')}<div><strong>Konversi</strong><span>Satuan lokal → satuan standar</span></div></a>
        <a href="#/imputasi">${ikon('imputasi')}<div><strong>Imputasi</strong><span>BOS, PIP, BPJS, KB, listrik, dan lainnya</span></div></a>
        ${akun.peran === 'admin' ? `<a href="#/admin" class="admin">${ikon('admin')}<div><strong>Admin</strong><span>Kelola akun dan data tarif</span></div></a>` : ''}
      </nav>
      <p class="versi">${tgl ? `Data diperbarui: ${esc(tgl)} · ` : ''}bisa dipakai offline</p>
      ${galatData ? '<p class="versi galat">Gagal memperbarui data</p>' : ''}`;
  }

  // Tombol "Lihat" di samping setiap kolom password: menampilkan/menyembunyikan isi.
  function pasangLihatPassword(akar) {
    akar.querySelectorAll('input[type="password"]').forEach(inp => {
      const bungkus = document.createElement('div');
      bungkus.className = 'isian-password';
      inp.parentNode.insertBefore(bungkus, inp);
      bungkus.appendChild(inp);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lihat-password';
      b.textContent = 'Lihat';
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', 'Tampilkan password');
      b.addEventListener('click', () => {
        const tampil = inp.type === 'password';
        inp.type = tampil ? 'text' : 'password';
        b.textContent = tampil ? 'Sembunyikan' : 'Lihat';
        b.setAttribute('aria-pressed', String(tampil));
        b.setAttribute('aria-label', tampil ? 'Sembunyikan password' : 'Tampilkan password');
        inp.focus();
      });
      bungkus.appendChild(b);
    });
  }

  // Layar penuh bergambar latar KIUT (seperti layar sync AppSheet), dipakai selama login.
  function layarSinkron(tampil) {
    let el = document.getElementById('layar-sinkron');
    if (!tampil) { if (el) el.remove(); return; }
    if (el) return;
    el = document.createElement('div');
    el.id = 'layar-sinkron';
    el.className = 'layar-pembuka layar-sinkron';
    el.setAttribute('role', 'status');
    el.innerHTML = '<p class="pita-status"><span class="putar" aria-hidden="true"></span>Menyinkronkan data…</p>';
    document.body.appendChild(el);
  }

  function layarLogin() {
    judul('Masuk', false);
    const pesan = pesanLogin;
    pesanLogin = '';
    app.innerHTML = `
      <section class="sambutan">
        <img class="logo" src="./icons/icon-192.png" alt="Logo KIUT" width="96" height="96">
        <h2>KIUT</h2>
        <p>Konversi Satuan dan Imputasi Biaya<br>BPS Kabupaten Buru Selatan</p>
      </section>
      <form class="kartu" id="form-login" autocomplete="on" novalidate>
        <div class="isian"><label for="f-username">Username</label>
          <input type="text" id="f-username" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required></div>
        <div class="isian"><label for="f-password">Password</label>
          <input type="password" id="f-password" name="password" autocomplete="current-password" required></div>
        <p class="salah" id="pesan-login" role="alert">${esc(pesan)}</p>
        <button type="submit" class="tombol-utama" id="tombol-masuk">Masuk</button>
      </form>`;
    const form = app.querySelector('#form-login');
    pasangLihatPassword(form);
    const pesanEl = app.querySelector('#pesan-login');
    const tombol = app.querySelector('#tombol-masuk');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const username = form.username.value.trim();
      const password = form.password.value;
      if (!username || !password) { pesanEl.textContent = 'Isi username dan password'; return; }
      tombol.disabled = true;
      tombol.textContent = 'Memproses…';
      pesanEl.textContent = '';
      layarSinkron(true);
      const r = await API.panggil('login', { username, password });
      layarSinkron(false);
      tombol.disabled = false;
      tombol.textContent = 'Masuk';
      if (!r.ok) {
        pesanEl.textContent = r.galat === 'jaringan' ? 'Tidak ada sinyal. Login pertama butuh internet' : (r.pesan || 'Terjadi kesalahan');
        return;
      }
      for (const k of Object.keys(keadaan)) delete keadaan[k];
      SESI.simpanLogin({ ...r, data: undefined });
      terimaData(r);
      alihkan(r.akun && r.akun.wajibGanti ? '#/ganti-password' : '#/');
    });
    app.querySelector('#f-username').focus();
  }

  function layarGantiPassword() {
    const akun = SESI.akun() || {};
    const wajib = !!akun.wajibGanti;
    judul('Ganti password', !wajib);
    app.innerHTML = `
      <form class="kartu" id="form-ganti" novalidate>
        ${wajib ? '<p class="keterangan">Anda wajib mengganti password sebelum memakai aplikasi.</p>' : ''}
        <div class="isian"><label for="f-lama">Password lama</label>
          <input type="password" id="f-lama" name="lama" autocomplete="current-password"></div>
        <div class="isian"><label for="f-baru">Password baru (minimal 8 karakter)</label>
          <input type="password" id="f-baru" name="baru" autocomplete="new-password"></div>
        <div class="isian"><label for="f-ulang">Ulangi password baru</label>
          <input type="password" id="f-ulang" name="ulang" autocomplete="new-password"></div>
        <p class="salah" id="pesan-ganti" role="alert"></p>
        <button type="submit" class="tombol-utama" id="tombol-ganti">Simpan password</button>
      </form>`;
    const form = app.querySelector('#form-ganti');
    pasangLihatPassword(form);
    const pesanEl = app.querySelector('#pesan-ganti');
    const tombol = app.querySelector('#tombol-ganti');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const lama = form.lama.value, baru = form.baru.value;
      if (baru !== form.ulang.value) { pesanEl.textContent = 'Password baru tidak sama'; return; }
      if (baru.length < 8) { pesanEl.textContent = 'Password baru minimal 8 karakter'; return; }
      if (baru !== baru.trim()) { pesanEl.textContent = 'Password baru tidak boleh diawali atau diakhiri spasi'; return; }
      tombol.disabled = true;
      tombol.textContent = 'Memproses…';
      pesanEl.textContent = '';
      const r = await API.panggil('gantiPassword', { token: SESI.token(), lama, baru });
      tombol.disabled = false;
      tombol.textContent = 'Simpan password';
      if (!r.ok) {
        if (r.galat === 'sesi-habis') return sesiBerakhir();
        pesanEl.textContent = r.galat === 'jaringan' ? 'Tidak ada sinyal. Ganti password butuh internet'
          : (r.kolom && r.kolom.baru) || r.pesan || 'Terjadi kesalahan';
        return;
      }
      terimaData(r);
      alihkan('#/');
    });
    app.querySelector('#f-lama').focus();
  }

  function layarImputasi() {
    judul('Imputasi', true);
    app.innerHTML = `<nav class="grid">${URUTAN.map(id =>
      `<a href="#/imputasi/${id}">${ikon(id)}<span>${esc(KALKULATOR[id].judul)}</span></a>`).join('')}</nav>`;
  }

  function layarKalkulator(id) {
    const def = KALKULATOR[id];
    if (!def) return layarTidakAda();
    judul(def.judul, true);
    const v = keadaan[id] || (keadaan[id] = nilaiAwal(def));

    app.innerHTML = `<section class="kartu"><p class="keterangan">${esc(def.ket)}</p><div id="isian"></div></section><div id="hasil"></div>`;
    const isianEl = app.querySelector('#isian');
    const hasilEl = app.querySelector('#hasil');

    function gambarIsian() {
      isianEl.innerHTML = def.isian.map(f => {
        if (f.tampil && !f.tampil(v)) return '';
        if (f.tipe === 'pilih') {
          const opsi = f.opsi(v);
          if (opsi.length === 0) return '';
          if (v[f.id] && !opsi.includes(v[f.id])) v[f.id] = '';
          return `<div class="isian"><label for="f-${f.id}">${esc(f.label)}</label>
            <select id="f-${f.id}" data-id="${f.id}"><option value="">— pilih —</option>${opsi.map(o =>
              `<option${o === v[f.id] ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select></div>`;
        }
        if (f.tipe === 'angka') {
          return `<div class="isian"><label for="f-${f.id}">${esc(f.label)}</label>
            <input type="text" inputmode="decimal" autocomplete="off" id="f-${f.id}" data-id="${f.id}" value="${esc(v[f.id])}"></div>`;
        }
        // centang
        return `<div class="isian"><span class="label">${esc(f.label)}</span><div class="centang">${f.opsi(v).map(o => `
          <label><input type="checkbox" data-id="${f.id}" value="${esc(o.nilai)}"${v[f.id].includes(o.nilai) ? ' checked' : ''}>
            <span class="nama">${esc(o.nilai)}</span>
            ${o.biaya === null ? '<span class="kosong">(tarif belum tersedia)</span>' : `<span class="tarif">${rp(o.biaya)}</span>`}
          </label>`).join('')}</div></div>`;
      }).join('');
    }

    function gambarHasil() {
      const h = def.hitung(v);
      let ekstra = '';
      if (h.ok && h.tanpaTarif && h.tanpaTarif.length) ekstra += `<p class="peringatan">Tidak dijumlahkan (tarif belum tersedia): ${esc(h.tanpaTarif.join(', '))}</p>`;
      if (h.ok && h.rincian) ekstra += `<p class="rincian">${esc(h.rincian)}</p>`;
      hasilEl.innerHTML = htmlHasil(h, h.ok ? barisImputasi(id, def, h) : [], ekstra);
    }

    isianEl.addEventListener('input', e => {
      const t = e.target;
      if (t.type !== 'text') return;
      v[t.dataset.id] = t.value;
      gambarHasil();
    });
    isianEl.addEventListener('change', e => {
      const t = e.target;
      const f = def.isian.find(x => x.id === t.dataset.id);
      if (!f || t.type === 'text') return;
      if (f.tipe === 'centang') {
        v[f.id] = [...isianEl.querySelectorAll(`input[data-id="${f.id}"]:checked`)].map(x => x.value);
      } else {
        v[f.id] = t.value;
        for (const h of f.hapus || []) v[h] = '';
      }
      gambarIsian();
      gambarHasil();
    });

    gambarIsian();
    gambarHasil();
  }

  function layarKonversi() {
    judul('Konversi', true);
    const v = keadaan.konversi || (keadaan.konversi = { id: '', banyak: '', cari: '' });
    // Pilihan disimpan berdasarkan id baris, bukan urutan, karena data bisa berubah dari server.
    const idxTerpilih = () => (v.id ? DATA.konversi.findIndex(r => r.id === v.id) : -1);
    if (v.id && idxTerpilih() < 0) v.id = ''; // baris sudah dihapus admin

    app.innerHTML = `<section class="kartu" id="pilih"></section><section class="kartu"><div class="isian">
        <label for="f-banyak">Banyaknya</label>
        <input type="text" inputmode="decimal" autocomplete="off" id="f-banyak" value="${esc(v.banyak)}">
      </div></section><div id="hasil"></div>`;
    const pilihEl = app.querySelector('#pilih');
    const hasilEl = app.querySelector('#hasil');
    const banyakEl = app.querySelector('#f-banyak');

    function gambarPilih() {
      if (v.id) {
        const r = DATA.konversi[idxTerpilih()];
        pilihEl.innerHTML = `<span class="label" style="display:block;margin-bottom:6px;font-weight:600">Komoditi</span>
          <div class="terpilih"><div><strong>${esc(r.komoditi)}</strong><span>${esc(r.lokal)} → ${esc(r.standar)} (× ${C.formatDesimal(r.faktor)})</span></div>
          <button type="button" class="tombol-kecil" id="ganti">Ganti</button></div>`;
        return;
      }
      pilihEl.innerHTML = `<div class="isian"><label for="f-cari">Cari komoditi</label>
        <input type="search" id="f-cari" autocomplete="off" placeholder="mis. beras, tongkol, cabai" value="${esc(v.cari)}"></div>
        <ul class="daftar" id="daftar"></ul>`;
      gambarDaftar();
    }

    function gambarDaftar() {
      const q = v.cari.trim().toLowerCase();
      const cocok = DATA.konversi.map((r, i) => ({ r, i })).filter(({ r }) => !q || r.komoditi.toLowerCase().includes(q));
      pilihEl.querySelector('#daftar').innerHTML = cocok.length
        ? cocok.map(({ r }) => `<li><button type="button" data-id="${esc(r.id)}">${esc(r.komoditi)}<span class="sub">${esc(r.lokal)} → ${esc(r.standar)}</span></button></li>`).join('')
        : '<li class="nihil">Komoditi tidak ditemukan</li>';
    }

    function gambarHasil() {
      const i = idxTerpilih();
      const h = C.konversi(DATA, { idx: i < 0 ? '' : i, banyak: v.banyak });
      if (!h.ok) { hasilEl.innerHTML = htmlHasil(h, []); return; }
      const baris = [{ label: 'Hasil', teks: `${C.formatDesimal(h.nilai)} ${h.satuan}`, nilai: h.nilai }];
      let ekstra = `<p class="rincian">${esc(h.rincian)}</p>`;
      if (h.nilaiHarga) {
        const { min, maks } = h.nilaiHarga;
        if (min === maks) baris.push({ label: 'Nilai (harga acuan)', teks: rp(min), nilai: min });
        else {
          baris.push({ label: 'Nilai terendah', teks: rp(min), nilai: min });
          baris.push({ label: 'Nilai tertinggi', teks: rp(maks), nilai: maks });
        }
        const hg = h.harga.min === h.harga.maks ? rp(h.harga.min) : `${rp(h.harga.min)} – ${rp(h.harga.maks)}`;
        ekstra += `<p class="rincian">Harga acuan: ${esc(hg)} per ${esc(h.satuan)}<br>${esc(h.rincianHarga)}</p>`;
      } else {
        ekstra += '<p class="rincian">Harga acuan belum tersedia</p>';
      }
      hasilEl.innerHTML = htmlHasil(h, baris, ekstra);
    }

    pilihEl.addEventListener('input', e => {
      if (e.target.id !== 'f-cari') return;
      v.cari = e.target.value;
      gambarDaftar();
    });
    pilihEl.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.id === 'ganti') {
        v.id = '';
        gambarPilih();
        gambarHasil();
        pilihEl.querySelector('#f-cari').focus();
        return;
      }
      if (b.dataset.id !== undefined) {
        v.id = b.dataset.id;
        gambarPilih();
        gambarHasil();
        banyakEl.focus();
      }
    });
    banyakEl.addEventListener('input', () => {
      v.banyak = banyakEl.value;
      gambarHasil();
    });

    gambarPilih();
    gambarHasil();
  }

  function layarTidakAda() {
    judul('KIUT', true);
    app.innerHTML = '<section class="kartu"><p>Halaman tidak ditemukan.</p><p><a href="#/">Kembali ke beranda</a></p></section>';
  }

  // ---------- tombol salin ----------
  app.addEventListener('click', async e => {
    // Hanya tombol salin hasil kalkulator (yang membawa data-salin). Tombol Salin di dialog
    // password admin punya penangannya sendiri; tanpa batasan ini clipboard tertimpa "undefined".
    const b = e.target.closest('.salin[data-salin]');
    if (!b) return;
    const teks = b.dataset.salin;
    try {
      await navigator.clipboard.writeText(teks);
      b.textContent = 'Disalin';
    } catch (err) {
      const angka = b.parentElement.querySelector('.angka');
      const r = document.createRange();
      r.selectNodeContents(angka);
      const s = getSelection();
      s.removeAllRanges();
      s.addRange(r);
      b.textContent = 'Pilih';
    }
    setTimeout(() => { b.textContent = 'Salin'; }, 1500);
  });

  // ---------- menu pengguna ----------
  const penggunaEl = document.getElementById('pengguna');
  const menuEl = document.getElementById('menu-pengguna');
  const tombolMenu = document.getElementById('tombol-menu');

  function perbaruiHeader(r) {
    const akun = SESI.akun();
    const tampil = !!akun && SESI.aktif() && r !== '/login';
    penggunaEl.hidden = !tampil;
    if (tampil) document.getElementById('nama-pengguna').textContent = `${akun.nama || akun.username} (${akun.peran})`;
    menuEl.hidden = true;
    tombolMenu.setAttribute('aria-expanded', 'false');
  }

  tombolMenu.addEventListener('click', () => {
    menuEl.hidden = !menuEl.hidden;
    tombolMenu.setAttribute('aria-expanded', String(!menuEl.hidden));
  });
  document.addEventListener('click', e => {
    if (!menuEl.hidden && !penggunaEl.contains(e.target)) {
      menuEl.hidden = true;
      tombolMenu.setAttribute('aria-expanded', 'false');
    }
  });
  menuEl.addEventListener('click', e => {
    const b = e.target.closest('[data-menu]');
    if (!b) return;
    menuEl.hidden = true;
    if (b.dataset.menu === 'ganti') location.hash = '#/ganti-password';
    if (b.dataset.menu === 'keluar') {
      const token = SESI.token();
      SESI.hapus();
      for (const k of Object.keys(keadaan)) delete keadaan[k];
      alihkan('#/login');
      if (token) API.panggil('logout', { token }); // tidak ditunggu; data lokal sudah dihapus
    }
  });

  // ---------- sesi & data dari server ----------
  const dataSah = d => !!d && typeof d === 'object' && TABEL.every(t => Array.isArray(d[t]));

  // Menyimpan respons login/sesi/gantiPassword; data yang tidak sah diabaikan (data lama tetap dipakai).
  function terimaData(r) {
    const salin = { ...r };
    if (r.data !== undefined && !dataSah(r.data)) {
      delete salin.data;
      galatData = true;
    } else if (r.data !== undefined) galatData = false;
    SESI.perbarui(salin);
  }

  function sesiBerakhir() {
    SESI.hapus();
    for (const k of Object.keys(keadaan)) delete keadaan[k];
    pesanLogin = 'Sesi berakhir, silakan login lagi';
    alihkan('#/login');
  }

  let memeriksa = false;
  async function periksaSesi() {
    if (memeriksa || !SESI.aktif()) return;
    memeriksa = true;
    try {
      const versiLama = SESI.versiData();
      const wajibLama = !!(SESI.akun() || {}).wajibGanti;
      const r = await API.panggil('sesi', { token: SESI.token(), versiData: versiLama });
      if (!r.ok) {
        if (r.galat === 'sesi-habis' || r.galat === 'dilarang') sesiBerakhir();
        return; // jaringan/server: tetap offline dengan data lokal
      }
      const galatLama = galatData;
      terimaData(r);
      const wajibBaru = !!(SESI.akun() || {}).wajibGanti;
      if (wajibBaru && !wajibLama) return alihkan('#/ganti-password');
      if (SESI.versiData() !== versiLama || galatData !== galatLama) render();
    } finally {
      memeriksa = false;
    }
  }

  // ---------- router & tombol kembali ----------
  function judul(teks, adaKembali) {
    judulEl.textContent = teks;
    kembaliEl.hidden = !adaKembali;
    document.title = teks === 'KIUT' ? 'KIUT – Konversi & Imputasi' : `${teks} · KIUT`;
  }

  const rute = () => (location.hash.replace(/^#/, '') || '/');
  const induk = r => (r.startsWith('/imputasi/') ? '/imputasi' : r.startsWith('/admin/') ? '/admin' : '/');
  const tumpukan = [];
  let gantiPuncak = false; // true saat pindah memakai location.replace (riwayat tidak bertambah)

  // Pindah rute tanpa menambah riwayat (pengalihan, atau tombol kembali tanpa riwayat).
  function alihkan(hash) {
    if (location.hash === hash || (hash === '#/' && rute() === '/')) return render();
    gantiPuncak = true;
    location.replace(hash);
  }

  function render() {
    const r = rute();
    perbaruiHeader(r);
    const akun = SESI.akun() || {};
    const aktif = SESI.aktif();

    if (r === '/login') {
      if (aktif) return alihkan(akun.wajibGanti ? '#/ganti-password' : '#/');
      return layarLogin();
    }
    if (!aktif) {
      if (SESI.token()) SESI.hapus(); // sesi di HP sudah kedaluwarsa
      return alihkan('#/login');
    }
    if (akun.wajibGanti && r !== '/ganti-password') return alihkan('#/ganti-password');
    if (r === '/ganti-password') return layarGantiPassword();

    DATA = SESI.data();
    if (!dataSah(DATA)) {
      judul('KIUT', false);
      app.innerHTML = '<section class="kartu"><p>Data belum tersedia di HP ini. Hubungkan ke internet lalu buka ulang aplikasi.</p></section>';
      return;
    }

    if (r === '/admin' || r.startsWith('/admin/')) {
      if (akun.peran !== 'admin') return alihkan('#/');
      const sub = r === '/admin' ? '' : r.slice('/admin/'.length);
      if (window.KIUT_ADMIN) return window.KIUT_ADMIN.tampilkan(app, konteks, sub);
      judul('Admin', true);
      app.innerHTML = '<section class="kartu"><p>Halaman admin segera hadir.</p></section>';
      return;
    }
    if (r === '/') layarBeranda();
    else if (r === '/konversi') layarKonversi();
    else if (r === '/imputasi') layarImputasi();
    else if (r.startsWith('/imputasi/')) layarKalkulator(r.slice('/imputasi/'.length));
    else layarTidakAda();
  }

  // Dipakai admin.js.
  const konteks = { sesi: SESI, api: API, judul, ulang: render, periksaSesi, sesiBerakhir, esc, rp, C };

  function tampilkan() {
    const r = rute();
    if (gantiPuncak) {
      gantiPuncak = false;
      tumpukan[Math.max(tumpukan.length - 1, 0)] = r;
    } else if (tumpukan.length > 1 && tumpukan[tumpukan.length - 2] === r) tumpukan.pop();
    else if (tumpukan[tumpukan.length - 1] !== r) tumpukan.push(r);
    render();
    window.scrollTo(0, 0);
  }

  kembaliEl.addEventListener('click', () => {
    if (tumpukan.length > 1) history.back();
    else alihkan('#' + induk(rute()));
  });

  window.addEventListener('hashchange', tampilkan);
  tampilkan();
  periksaSesi();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') periksaSesi();
  });

  // ---------- offline ----------
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    // Bila halaman ini sudah dikendalikan versi lama, muat ulang sekali saat versi baru aktif
    // agar tarif baru langsung dipakai. Kunjungan pertama (belum ada pengendali) tidak dimuat ulang.
    const adaVersiLama = !!navigator.serviceWorker.controller;
    let sudahMuatUlang = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!adaVersiLama || sudahMuatUlang) return;
      sudahMuatUlang = true;
      location.reload();
    });

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then(reg => {
        // Aplikasi yang dibuka lagi dari latar belakang ikut memeriksa versi baru.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') reg.update().catch(() => {});
        });
      }).catch(() => { /* tetap jalan online */ });
    });
  }
})();
