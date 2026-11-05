// Tampilan KIUT: router hash + render layar. Rumus ada di calc.js, data di data.js.
(function () {
  'use strict';

  const DATA = KIUT_DATA;
  const C = KIUT_CALC;
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
        { id: 'kunjungan', label: 'Banyak kunjungan', tipe: 'angka', awal: '1', tampil: v => C.KUNJUNGAN_PERAWATAN.includes(v.perawatan) },
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
  function layarBeranda() {
    judul('KIUT', false);
    app.innerHTML = `
      <section class="sambutan">
        ${ikon('imputasi', 'ikon logo')}
        <h2>KIUT</h2>
        <p>Konversi Satuan dan Imputasi Biaya<br>BPS Kabupaten Buru Selatan</p>
      </section>
      <nav class="menu-besar">
        <a href="#/konversi">${ikon('konversi')}<div><strong>Konversi</strong><span>Satuan lokal → satuan standar</span></div></a>
        <a href="#/imputasi">${ikon('imputasi')}<div><strong>Imputasi</strong><span>BOS, PIP, BPJS, KB, listrik, dan lainnya</span></div></a>
      </nav>
      <p class="versi">Data versi ${esc(DATA.versi)} · bisa dipakai offline</p>`;
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
    const v = keadaan.konversi || (keadaan.konversi = { idx: '', banyak: '', cari: '' });

    app.innerHTML = `<section class="kartu" id="pilih"></section><section class="kartu"><div class="isian">
        <label for="f-banyak">Banyaknya</label>
        <input type="text" inputmode="decimal" autocomplete="off" id="f-banyak" value="${esc(v.banyak)}">
      </div></section><div id="hasil"></div>`;
    const pilihEl = app.querySelector('#pilih');
    const hasilEl = app.querySelector('#hasil');
    const banyakEl = app.querySelector('#f-banyak');

    function gambarPilih() {
      if (v.idx !== '') {
        const r = DATA.konversi[v.idx];
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
        ? cocok.map(({ r, i }) => `<li><button type="button" data-idx="${i}">${esc(r.komoditi)}<span class="sub">${esc(r.lokal)} → ${esc(r.standar)}</span></button></li>`).join('')
        : '<li class="nihil">Komoditi tidak ditemukan</li>';
    }

    function gambarHasil() {
      const h = C.konversi(DATA, v);
      hasilEl.innerHTML = htmlHasil(h, h.ok ? [{ label: 'Hasil', teks: `${C.formatDesimal(h.nilai)} ${h.satuan}`, nilai: h.nilai }] : [],
        h.ok ? `<p class="rincian">${esc(h.rincian)}</p>` : '');
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
        v.idx = '';
        gambarPilih();
        gambarHasil();
        pilihEl.querySelector('#f-cari').focus();
        return;
      }
      if (b.dataset.idx !== undefined) {
        v.idx = Number(b.dataset.idx);
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
    const b = e.target.closest('.salin');
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

  // ---------- router & tombol kembali ----------
  function judul(teks, adaKembali) {
    judulEl.textContent = teks;
    kembaliEl.hidden = !adaKembali;
    document.title = teks === 'KIUT' ? 'KIUT – Konversi & Imputasi' : `${teks} · KIUT`;
  }

  const rute = () => (location.hash.replace(/^#/, '') || '/');
  const induk = r => (r.startsWith('/imputasi/') ? '/imputasi' : '/');
  const tumpukan = [];
  let gantiPuncak = false; // true saat kembali memakai location.replace (riwayat tidak bertambah)

  function tampilkan() {
    const r = rute();
    if (gantiPuncak) {
      gantiPuncak = false;
      tumpukan[Math.max(tumpukan.length - 1, 0)] = r;
    } else if (tumpukan.length > 1 && tumpukan[tumpukan.length - 2] === r) tumpukan.pop();
    else if (tumpukan[tumpukan.length - 1] !== r) tumpukan.push(r);

    if (r === '/') layarBeranda();
    else if (r === '/konversi') layarKonversi();
    else if (r === '/imputasi') layarImputasi();
    else if (r.startsWith('/imputasi/')) layarKalkulator(r.slice('/imputasi/'.length));
    else layarTidakAda();
    window.scrollTo(0, 0);
  }

  kembaliEl.addEventListener('click', () => {
    if (tumpukan.length > 1) history.back();
    else {
      gantiPuncak = true;
      location.replace('#' + induk(rute()));
    }
  });

  window.addEventListener('hashchange', tampilkan);
  tampilkan();

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
