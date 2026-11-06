// Tombol sinkron (⟳): memaksa HP mengambil data terbaru dari server dan memeriksa versi aplikasi baru.
// Tidak pernah melempar galat: setiap kegagalan (tanpa sinyal, lambat, server galat) menjadi pesan singkat,
// dan data yang sudah ada di HP tetap dipakai.
(function (root) {
  'use strict';

  const BATAS_MS = 15000;
  const GAGAL_JARINGAN = 'Gagal sinkron: tidak ada sinyal atau koneksi lambat. Data di HP tetap bisa dipakai.';
  const GAGAL_SERVER = 'Gagal sinkron: server tidak menjawab dengan benar. Data di HP tetap bisa dipakai.';
  const LAMBAT = { ok: false, galat: 'lambat' };

  // Menunggu janji paling lama `ms`; bila lewat atau gagal, hasilnya `cadangan`.
  function denganBatas(buatJanji, ms, cadangan) {
    return new Promise(selesai => {
      const waktu = setTimeout(() => selesai(cadangan), ms);
      Promise.resolve()
        .then(buatJanji)
        .then(v => selesai(v), () => selesai(cadangan))
        .finally(() => clearTimeout(waktu));
    });
  }

  // d: { online(), token, versiData, panggil(aksi, isi), periksaVersi() → 'baru'|'sama', batasMs? }
  // Hasil: { status: 'ok'|'gagal'|'sesi-habis', pesan, respons?, versiBaru? }
  async function sinkron(d) {
    const batas = d.batasMs || BATAS_MS;
    if (!d.online()) return { status: 'gagal', pesan: 'Tidak ada sinyal. Data di HP tetap bisa dipakai.' };

    // versiData -1 tidak pernah sama dengan versi server, jadi server selalu mengirim paket data penuh.
    const r = await denganBatas(() => d.panggil('sesi', { token: d.token, versiData: -1 }), batas, LAMBAT);
    if (!r || typeof r !== 'object' || !r.ok) {
      const galat = r && r.galat;
      if (galat === 'sesi-habis' || galat === 'dilarang') return { status: 'sesi-habis', pesan: 'Sesi berakhir, silakan login lagi' };
      return { status: 'gagal', pesan: galat === 'server' ? GAGAL_SERVER : GAGAL_JARINGAN };
    }

    const versi = await denganBatas(() => d.periksaVersi(), batas, 'gagal');
    if (versi === 'baru') return { status: 'ok', pesan: 'Versi aplikasi baru dipasang, memuat ulang…', respons: r, versiBaru: true };
    const berubah = Number(r.versiData) !== Number(d.versiData);
    return { status: 'ok', pesan: berubah ? 'Data diperbarui' : 'Data sudah terbaru', respons: r, versiBaru: false };
  }

  const api = { sinkron, denganBatas };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KIUT_SINKRON = api;
})(typeof self !== 'undefined' ? self : this);
