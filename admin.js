// Halaman Admin KIUT: tab Akun (kelola pengguna) dan tab Data (kelola tarif & komoditi).
// Validasi sesungguhnya ada di server (server/Inti.js); di sini hanya formulir & tampilan.
(function (root) {
  'use strict';

  const LABEL_TABEL = {
    konversi: 'Konversi', bos: 'BOS', pip: 'PIP', bpjs: 'BPJS', imunisasi: 'Imunisasi', rawat: 'Biaya Rawat',
    melahirkan: 'Melahirkan', kb: 'KB', listrik: 'Listrik', pkh: 'PKH', rekening: 'Kepemilikan Rekening',
  };
  const LABEL_BLOK = {
    PBI: 'PBI (Blok V.E)',
    MANDIRI_12: 'Mandiri Kelas 1/2 (Blok VII)',
    MANDIRI_3: 'Mandiri Kelas 3 (V.E 1/6 + VII 5/6)',
    PNS: 'PNS (Blok VA)',
  };
  const RUPIAH = ['biaya', 'tarif', 'admin', 'debit'];

  // Kolom formulir per tabel (selaras dengan Inti.SKEMA di server).
  const T = (nama, label) => ({ nama, label, tipe: 'teks', wajib: true });
  const O = (nama, label) => ({ nama, label, tipe: 'teks', wajib: false });
  const A = (nama, label, bolehNull) => ({ nama, label, tipe: 'angka', bolehNull });
  const B = (nama, label) => ({ nama, label, tipe: 'boolean' });
  const SKEMA_FORM = {
    konversi: [T('komoditi', 'Komoditi'), T('lokal', 'Satuan lokal'), T('standar', 'Satuan standar'), A('faktor', 'Faktor konversi', false)],
    bos: [T('jenjang', 'Jenjang'), A('biaya', 'Biaya per tahun (Rp)', true)],
    pip: [T('jenjang', 'Jenjang'), A('biaya', 'Biaya per semester (Rp)', true)],
    bpjs: [T('jenis', 'Jenis'), A('biaya', 'Iuran per bulan (Rp)', true), { nama: 'blok', label: 'Pembagian blok BPJS', tipe: 'blok' }],
    imunisasi: [T('jenis', 'Jenis'), A('biaya', 'Biaya (Rp)', true)],
    rawat: [T('keperluan', 'Keperluan'), T('jenis', 'Jenis'), A('biaya', 'Biaya (Rp)', true)],
    melahirkan: [T('perawatan', 'Perawatan'), O('pemeriksaan', 'Pemeriksaan (boleh kosong)'), T('fasilitas', 'Fasilitas'),
      O('rawat', 'Jenis rawat (boleh kosong)'), A('biaya', 'Biaya (Rp)', false), B('perKunjungan', 'Dikali banyak kunjungan')],
    kb: [T('jenis', 'Jenis'), A('biaya', 'Biaya (Rp)', true), B('berulang', 'Dikali banyak penggunaan per tahun')],
    listrik: [T('daya', 'Daya'), A('tarif', 'Tarif per kWh (Rp)', true)],
    pkh: [T('kriteria', 'Kriteria'), A('biaya', 'Biaya (Rp)', true)],
    rekening: [T('rekening', 'Rekening'), A('admin', 'Biaya administrasi (Rp)', true), A('debit', 'Biaya kartu debit (Rp)', true)],
  };

  // Keadaan halaman admin yang bertahan antar-render.
  const st = { cari: {}, edit: null, akunEdit: null, masalah: null, masalahVersi: null };

  function tampilkan(app, k, sub) {
    const { esc } = k;
    const bagian = sub.split('/');
    const tab = bagian[0] === 'data' ? 'data' : 'akun';
    const tabel = tab === 'data' && LABEL_TABEL[bagian[1]] ? bagian[1] : null;
    k.judul(tabel ? `Admin · ${LABEL_TABEL[tabel]}` : 'Admin', true);

    app.innerHTML = `
      <div class="admin-halaman">
        <nav class="tab-admin" role="tablist">
          <a role="tab" href="#/admin/akun" aria-selected="${tab === 'akun'}">Akun</a>
          <a role="tab" href="#/admin/data" aria-selected="${tab === 'data'}">Data</a>
        </nav>
        <p class="banner-offline" id="banner-offline" hidden>Halaman admin butuh sinyal. Perubahan belum bisa disimpan.</p>
        <div id="isi-admin"></div>
      </div>
      <div class="dialog-latar" id="dialog" hidden></div>`;
    const isi = app.querySelector('#isi-admin');
    const banner = app.querySelector('#banner-offline');
    const dialogEl = app.querySelector('#dialog');

    function setOffline(offline) {
      banner.hidden = !offline;
      app.querySelectorAll('[data-perlu-sinyal]').forEach(b => { b.disabled = offline; });
    }

    // Panggil API; tangani sesi habis & jaringan secara seragam.
    async function panggil(aksi, data) {
      const r = await k.api.panggil(aksi, { token: k.sesi.token(), ...data });
      if (!r.ok && (r.galat === 'sesi-habis')) { k.sesiBerakhir(); return null; }
      setOffline(!r.ok && r.galat === 'jaringan');
      return r;
    }

    function dialog(html) {
      dialogEl.innerHTML = `<div class="dialog" role="dialog" aria-modal="true">${html}</div>`;
      dialogEl.hidden = false;
      const tutup = () => { dialogEl.hidden = true; dialogEl.innerHTML = ''; };
      dialogEl.querySelectorAll('[data-tutup]').forEach(b => b.addEventListener('click', tutup));
      return { el: dialogEl, tutup };
    }

    function dialogPassword(judul, username, password) {
      const d = dialog(`
        <h3>${esc(judul)}</h3>
        <p>Username: <strong>${esc(username)}</strong></p>
        <div class="password-awal"><code id="pw">${esc(password)}</code>
          <button type="button" class="salin" id="salin-pw">Salin</button></div>
        <p class="peringatan-teks">Password ini hanya ditampilkan sekali. Berikan kepada pemilik akun; ia wajib menggantinya saat login.</p>
        <button type="button" class="tombol-utama" data-tutup>Selesai</button>`);
      d.el.querySelector('#salin-pw').addEventListener('click', async e => {
        try { await navigator.clipboard.writeText(password); e.target.textContent = 'Disalin'; }
        catch (err) {
          const r = document.createRange(); r.selectNodeContents(d.el.querySelector('#pw'));
          const s = getSelection(); s.removeAllRanges(); s.addRange(r);
        }
      });
    }

    function tampilkanGalat(form, r) {
      form.querySelectorAll('.salah[data-kolom]').forEach(p => { p.textContent = ''; });
      const umum = form.querySelector('.salah[data-umum]');
      if (umum) umum.textContent = '';
      if (!r || r.ok) return;
      if (r.galat === 'jaringan') { if (umum) umum.textContent = 'Gagal menyimpan, coba lagi'; return; }
      let ditempel = false;
      for (const [kol, pesan] of Object.entries(r.kolom || {})) {
        const p = form.querySelector(`.salah[data-kolom="${kol}"]`);
        if (p) { p.textContent = pesan; ditempel = true; }
      }
      if (!ditempel && umum) umum.textContent = r.pesan || 'Terjadi kesalahan';
    }

    // ===================== TAB AKUN =====================
    async function tabAkun() {
      isi.innerHTML = `
        <section class="kartu">
          <form id="form-akun-baru" novalidate>
            <h3 class="judul-bagian">Tambah akun</h3>
            <div class="isian"><label for="a-nama">Nama</label><input type="text" id="a-nama" name="nama" autocomplete="off">
              <p class="salah" data-kolom="nama"></p></div>
            <div class="isian"><label for="a-username">Username</label>
              <input type="text" id="a-username" name="username" autocomplete="off" autocapitalize="none" spellcheck="false">
              <p class="salah" data-kolom="username"></p></div>
            <div class="isian"><label for="a-peran">Peran</label>
              <select id="a-peran" name="peran"><option value="petugas">Petugas</option><option value="admin">Admin</option></select></div>
            <p class="salah" data-umum></p>
            <button type="submit" class="tombol-utama" data-perlu-sinyal>Tambah akun</button>
          </form>
        </section>
        <section class="kartu"><h3 class="judul-bagian">Daftar akun</h3><div id="daftar-akun"><p class="keterangan">Memuat…</p></div></section>`;
      setOffline(!navigator.onLine);

      const form = isi.querySelector('#form-akun-baru');
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const tombol = form.querySelector('button[type="submit"]');
        tombol.disabled = true;
        const r = await panggil('akunTambah', { nama: form.nama.value, username: form.username.value, peran: form.peran.value });
        tombol.disabled = false;
        if (!r) return;
        tampilkanGalat(form, r);
        if (!r.ok) return;
        form.reset();
        dialogPassword('Akun dibuat', r.akun.username, r.passwordAwal);
        muatDaftar();
      });

      const daftarEl = isi.querySelector('#daftar-akun');
      let akunList = [];

      function gambarDaftar() {
        const saya = (k.sesi.akun() || {}).username;
        daftarEl.innerHTML = akunList.map(a => {
          const sedangEdit = st.akunEdit === a.username;
          return `
          <article class="baris-admin${a.aktif ? '' : ' nonaktif'}" data-username="${esc(a.username)}">
            <div class="ringkas">
              <strong>${esc(a.nama)}</strong>
              <span>${esc(a.username)} · ${a.peran === 'admin' ? 'Admin' : 'Petugas'}${a.aktif ? '' : ' · <em>nonaktif</em>'}${a.wajibGanti ? ' · belum ganti password' : ''}${a.username === saya ? ' · (Anda)' : ''}</span>
            </div>
            ${sedangEdit ? `
            <form class="form-ubah-akun" novalidate>
              <div class="isian"><label>Nama</label><input type="text" name="nama" value="${esc(a.nama)}"><p class="salah" data-kolom="nama"></p></div>
              <div class="isian"><label>Peran</label><select name="peran">
                <option value="petugas"${a.peran === 'petugas' ? ' selected' : ''}>Petugas</option>
                <option value="admin"${a.peran === 'admin' ? ' selected' : ''}>Admin</option></select></div>
              <p class="salah" data-umum></p>
              <div class="aksi"><button type="submit" class="tombol-kecil utama" data-perlu-sinyal>Simpan</button>
                <button type="button" class="tombol-kecil" data-aksi="batal">Batal</button></div>
            </form>` : `
            <div class="aksi">
              <button type="button" class="tombol-kecil" data-aksi="ubah">Ubah</button>
              <button type="button" class="tombol-kecil" data-aksi="reset" data-perlu-sinyal>Reset password</button>
              <button type="button" class="tombol-kecil${a.aktif ? ' bahaya' : ''}" data-aksi="aktif" data-perlu-sinyal>${a.aktif ? 'Nonaktifkan' : 'Aktifkan'}</button>
            </div>
            <p class="salah" data-umum></p>`}
          </article>`;
        }).join('') || '<p class="keterangan">Belum ada akun.</p>';
        setOffline(!banner.hidden);
      }

      async function muatDaftar() {
        const r = await panggil('akunDaftar', {});
        if (!r) return;
        if (!r.ok) {
          daftarEl.innerHTML = `<p class="salah">${esc(r.galat === 'jaringan' ? 'Daftar akun tidak bisa dimuat tanpa sinyal.' : r.pesan)}</p>`;
          return;
        }
        akunList = r.akun;
        gambarDaftar();
      }

      daftarEl.addEventListener('click', async e => {
        const b = e.target.closest('[data-aksi]');
        if (!b) return;
        const baris = b.closest('[data-username]');
        const username = baris.dataset.username;
        const a = akunList.find(x => x.username === username);
        const pesanEl = baris.querySelector('.salah[data-umum]');
        if (b.dataset.aksi === 'ubah') { st.akunEdit = username; return gambarDaftar(); }
        if (b.dataset.aksi === 'batal') { st.akunEdit = null; return gambarDaftar(); }
        if (b.dataset.aksi === 'reset') {
          if (!confirm(`Reset password ${a.nama} (${username})? Password lama tidak berlaku lagi dan ia akan keluar dari semua HP.`)) return;
          const r = await panggil('akunReset', { username });
          if (!r) return;
          if (!r.ok) { pesanEl.textContent = r.galat === 'jaringan' ? 'Gagal menyimpan, coba lagi' : r.pesan; return; }
          dialogPassword('Password direset', username, r.passwordBaru);
          return muatDaftar();
        }
        if (b.dataset.aksi === 'aktif') {
          const aktif = !a.aktif;
          if (!confirm(aktif ? `Aktifkan kembali akun ${a.nama}?` : `Nonaktifkan akun ${a.nama}? Ia akan keluar dari aplikasi saat HP-nya online.`)) return;
          const r = await panggil('akunAktif', { username, aktif });
          if (!r) return;
          if (!r.ok) { pesanEl.textContent = r.galat === 'jaringan' ? 'Gagal menyimpan, coba lagi' : r.pesan; return; }
          return muatDaftar();
        }
      });

      daftarEl.addEventListener('submit', async e => {
        e.preventDefault();
        const f = e.target;
        const username = f.closest('[data-username]').dataset.username;
        const r = await panggil('akunUbah', { username, nama: f.nama.value, peran: f.peran.value });
        if (!r) return;
        tampilkanGalat(f, r);
        if (!r.ok) return;
        st.akunEdit = null;
        muatDaftar();
      });

      muatDaftar();
    }

    // ===================== TAB DATA =====================
    async function muatMasalah() {
      const versi = k.sesi.versiData();
      if (st.masalah && st.masalahVersi === versi) return st.masalah;
      const r = await panggil('dataMasalah', {});
      if (!r || !r.ok) return st.masalah || [];
      st.masalah = r.masalah;
      st.masalahVersi = r.versiData;
      if (r.versiData !== versi) k.periksaSesi(); // id baris manual baru diisi server
      return st.masalah;
    }

    function kotakMasalah(masalah) {
      const m = tabel ? masalah.filter(x => x.tabel === tabel) : masalah;
      if (!m.length) return '';
      return `<section class="kotak-masalah"><strong>Baris di Google Sheet yang tidak valid (tidak dikirim ke petugas):</strong>
        <ul>${m.map(x => `<li>${esc(LABEL_TABEL[x.tabel] || x.tabel)} baris ${x.baris}: ${esc(x.pesan)}</li>`).join('')}</ul></section>`;
    }

    function tampilNilai(kol, v) {
      if (v === null || v === undefined || v === '') return kol.tipe === 'angka' ? 'tarif belum tersedia' : '—';
      if (kol.tipe === 'angka') return RUPIAH.includes(kol.nama) ? k.rp(v) : k.C.formatDesimal(v);
      if (kol.tipe === 'boolean') return v ? 'ya' : 'tidak';
      if (kol.tipe === 'blok') return LABEL_BLOK[v] || v;
      return String(v);
    }

    function tabDataDaftarTabel() {
      const data = k.sesi.data() || {};
      isi.innerHTML = `<div id="masalah"></div><nav class="daftar-tabel">${Object.keys(LABEL_TABEL).map(t =>
        `<a href="#/admin/data/${t}"><strong>${esc(LABEL_TABEL[t])}</strong><span>${(data[t] || []).length} baris</span></a>`).join('')}</nav>`;
      setOffline(!navigator.onLine);
      muatMasalah().then(m => { const el = isi.querySelector('#masalah'); if (el) el.innerHTML = kotakMasalah(m); });
    }

    function tabDataTabel() {
      const kolom = SKEMA_FORM[tabel];
      const baris = ((k.sesi.data() || {})[tabel]) || [];
      const q = (st.cari[tabel] || '').toLowerCase();
      const cocok = baris.filter(r => !q || kolom.some(c => c.tipe === 'teks' && String(r[c.nama] || '').toLowerCase().includes(q)));
      const edit = st.edit && st.edit.tabel === tabel ? st.edit : null;

      isi.innerHTML = `
        <div id="masalah"></div>
        ${edit ? formBaris(kolom, edit) : `
        <div class="bilah-data">
          <input type="search" id="cari-data" placeholder="Cari…" value="${esc(st.cari[tabel] || '')}" autocomplete="off">
          <button type="button" class="tombol-kecil utama" id="tambah-baris" data-perlu-sinyal>+ Tambah</button>
        </div>
        <section class="daftar-baris">${cocok.map(r => `
          <button type="button" class="baris-data" data-id="${esc(r.id)}">
            <strong>${esc(kolom.filter(c => c.tipe === 'teks' && r[c.nama]).map(c => r[c.nama]).join(' · '))}</strong>
            <span>${kolom.filter(c => c.tipe !== 'teks').map(c => `${esc(c.label.replace(/ \(.*\)$/, ''))}: ${esc(tampilNilai(c, r[c.nama]))}`).join(' · ')}</span>
          </button>`).join('') || '<p class="keterangan">Tidak ada baris yang cocok.</p>'}
        </section>`}`;
      setOffline(!navigator.onLine);
      muatMasalah().then(m => { const el = isi.querySelector('#masalah'); if (el) el.innerHTML = kotakMasalah(m); });

      if (edit) return pasangForm(kolom, edit);

      const cariEl = isi.querySelector('#cari-data');
      cariEl.addEventListener('input', () => {
        st.cari[tabel] = cariEl.value;
        const pos = cariEl.selectionStart;
        tabDataTabel();
        const baru = isi.querySelector('#cari-data');
        baru.focus();
        baru.setSelectionRange(pos, pos);
      });
      isi.querySelector('#tambah-baris').addEventListener('click', () => {
        st.edit = { tabel, baris: {} };
        tabDataTabel();
      });
      isi.querySelectorAll('.baris-data').forEach(b => b.addEventListener('click', () => {
        const r = baris.find(x => x.id === b.dataset.id);
        st.edit = { tabel, baris: { ...r } };
        tabDataTabel();
      }));
    }

    function formBaris(kolom, edit) {
      const r = edit.baris;
      const baru = !r.id;
      return `
        <form class="kartu" id="form-baris" novalidate>
          <h3 class="judul-bagian">${baru ? 'Tambah baris' : 'Ubah baris'} · ${esc(LABEL_TABEL[tabel])}</h3>
          ${kolom.map(c => {
            const v = r[c.nama];
            const id = `k-${c.nama}`;
            if (c.tipe === 'boolean') {
              return `<div class="isian"><label class="centang-satu"><input type="checkbox" name="${c.nama}"${v ? ' checked' : ''}> ${esc(c.label)}</label></div>`;
            }
            if (c.tipe === 'blok') {
              return `<div class="isian"><label for="${id}">${esc(c.label)}</label><select id="${id}" name="${c.nama}">
                <option value="">— pilih —</option>${Object.entries(LABEL_BLOK).map(([kode, lab]) =>
                  `<option value="${kode}"${v === kode ? ' selected' : ''}>${esc(lab)}</option>`).join('')}</select>
                <p class="salah" data-kolom="${c.nama}"></p></div>`;
            }
            const kosong = c.tipe === 'angka' && c.bolehNull && !baru && (v === null || v === undefined);
            return `<div class="isian"><label for="${id}">${esc(c.label)}</label>
              <input type="text" id="${id}" name="${c.nama}" ${c.tipe === 'angka' ? 'inputmode="decimal"' : ''} autocomplete="off"
                value="${v === null || v === undefined ? '' : esc(c.tipe === 'angka' ? String(v).replace('.', ',') : v)}"${kosong ? ' disabled' : ''}>
              ${c.tipe === 'angka' && c.bolehNull ? `<label class="centang-satu kecil"><input type="checkbox" data-null="${c.nama}"${kosong ? ' checked' : ''}> Tarif belum tersedia</label>` : ''}
              <p class="salah" data-kolom="${c.nama}"></p></div>`;
          }).join('')}
          <p class="salah" data-umum></p>
          <div class="aksi">
            <button type="submit" class="tombol-kecil utama" data-perlu-sinyal>Simpan</button>
            <button type="button" class="tombol-kecil" id="batal-baris">Batal</button>
            ${baru ? '' : '<button type="button" class="tombol-kecil bahaya" id="hapus-baris" data-perlu-sinyal>Hapus</button>'}
          </div>
        </form>`;
    }

    function pasangForm(kolom, edit) {
      const form = isi.querySelector('#form-baris');
      form.querySelectorAll('[data-null]').forEach(cb => cb.addEventListener('change', () => {
        const inp = form.elements[cb.dataset.null];
        inp.disabled = cb.checked;
        if (cb.checked) inp.value = '';
      }));
      const ambil = () => {
        const b = { id: edit.baris.id };
        kolom.forEach(c => {
          const el = form.elements[c.nama];
          if (c.tipe === 'boolean') b[c.nama] = el.checked;
          else if (c.tipe === 'angka' && el.disabled) b[c.nama] = null;
          else b[c.nama] = el.value;
        });
        return b;
      };
      const selesai = async () => {
        st.edit = null;
        await k.periksaSesi(); // ambil data terbaru ke HP admin
        tabDataTabel();
      };
      isi.querySelector('#batal-baris').addEventListener('click', () => { st.edit = null; tabDataTabel(); });
      const hapus = isi.querySelector('#hapus-baris');
      if (hapus) hapus.addEventListener('click', async () => {
        if (!confirm('Hapus baris ini? Petugas tidak akan melihatnya lagi setelah HP mereka online.')) return;
        const r = await panggil('dataHapus', { tabel, id: edit.baris.id });
        if (!r) return;
        if (!r.ok) return tampilkanGalat(form, r);
        selesai();
      });
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const tombol = form.querySelector('button[type="submit"]');
        tombol.disabled = true;
        const isian = ambil();
        edit.baris = { ...edit.baris, ...isian };
        const r = await panggil('dataSimpan', { tabel, baris: isian });
        tombol.disabled = false;
        if (!r) return;
        if (!r.ok) return tampilkanGalat(form, r);
        selesai();
      });
    }

    if (tab === 'akun') tabAkun();
    else if (tabel) tabDataTabel();
    else tabDataDaftarTabel();
  }

  root.KIUT_ADMIN = { tampilkan };
})(typeof self !== 'undefined' ? self : this);
