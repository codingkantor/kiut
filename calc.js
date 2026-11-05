// Rumus KIUT. Fungsi murni: tidak menyentuh tampilan.
// Setiap kalkulator menerima (data, isian) dan mengembalikan:
//   { ok: true,  nilai, satuan?, rincian?, blok?, tanpaTarif? }
//   { ok: false, alasan: 'kosong' | 'negatif' | 'bulan' | 'tarif' | 'tidak-cocok' }
(function (root) {
  'use strict';

  const fmtRp = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
  const fmtDes = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });

  function parseAngka(teks) {
    if (typeof teks === 'number') return teks;
    if (typeof teks !== 'string') return NaN;
    const t = teks.trim().replace(',', '.');
    if (t === '' || !/^-?\d*\.?\d+$|^-?\d+\.$/.test(t)) return NaN;
    return Number(t);
  }

  const formatRupiah = n => 'Rp ' + fmtRp.format(Math.round(n));
  const formatDesimal = n => fmtDes.format(n);

  const gagal = alasan => ({ ok: false, alasan });

  // Membaca isian angka; mengembalikan angka atau objek gagal.
  function angka(v) {
    const n = parseAngka(v);
    if (Number.isNaN(n)) return gagal('kosong');
    if (n < 0) return gagal('negatif');
    return n;
  }

  // Membaca beberapa isian angka sekaligus: { nilai: [...] } atau { error: <hasil gagal> }.
  function bacaAngka(nilai) {
    const hasil = [];
    for (const v of nilai) {
      const n = angka(v);
      if (typeof n !== 'number') return { error: n };
      hasil.push(n);
    }
    return { nilai: hasil };
  }

  const cari = (tabel, kolom, nilai) => (nilai ? tabel.find(r => r[kolom] === nilai) : undefined);

  // tarif × pengali-pengali
  function kali(baris, kolomTarif, pengali) {
    if (!baris) return gagal('kosong');
    const a = bacaAngka(pengali);
    if (a.error) return a.error;
    if (baris[kolomTarif] === null) return gagal('tarif');
    return { ok: true, nilai: a.nilai.reduce((x, y) => x * y, baris[kolomTarif]) };
  }

  function konversi(data, { idx, banyak }) {
    const baris = idx === undefined || idx === null || idx === '' ? undefined : data.konversi[Number(idx)];
    const h = kali(baris, 'faktor', [banyak]);
    if (!h.ok) return h;
    const b = parseAngka(banyak);
    return { ...h, satuan: baris.standar, rincian: `${formatDesimal(b)} ${baris.lokal} × ${formatDesimal(baris.faktor)}` };
  }

  const bos = (data, { jenjang, art }) => kali(cari(data.bos, 'jenjang', jenjang), 'biaya', [art]);

  const pip = (data, { jenjang, art, semester }) =>
    kali(cari(data.pip, 'jenjang', jenjang), 'biaya', [art, semester]);

  function kb(data, { jenis, kali: banyak }) {
    const baris = cari(data.kb, 'jenis', jenis);
    return kali(baris, 'biaya', baris && baris.berulang ? [banyak] : []);
  }

  function listrik(data, { daya, biaya }) {
    const baris = cari(data.listrik, 'daya', daya);
    if (!baris) return gagal('kosong');
    const b = angka(biaya);
    if (typeof b !== 'number') return b;
    if (!baris.tarif) return gagal('tarif');
    return { ok: true, nilai: b / baris.tarif, satuan: 'kWh', rincian: `${formatRupiah(b)} ÷ ${formatRupiah(baris.tarif)}/kWh` };
  }

  function rekening(data, { rekening: nama }) {
    const baris = cari(data.rekening, 'rekening', nama);
    if (!baris) return gagal('kosong');
    if (baris.admin === null && baris.debit === null) return gagal('tarif');
    const admin = baris.admin || 0;
    const debit = baris.debit || 0;
    return { ok: true, nilai: admin + debit, rincian: `Administrasi ${formatRupiah(admin)} + Kartu debit ${formatRupiah(debit)}` };
  }

  const api = { parseAngka, formatRupiah, formatDesimal, konversi, bos, pip, kb, listrik, rekening };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KIUT_CALC = api;
})(typeof self !== 'undefined' ? self : this);
