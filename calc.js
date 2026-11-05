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

  // Pembagian total BPJS ke blok kuesioner (sesuai KIUT_V3).
  const BLOK_BPJS = {
    'PBI': t => ({ ve: t, vii: null, va: null }),
    'Non-PBI (Mandiri) Kelas 1': t => ({ ve: null, vii: t, va: null }),
    'Non-PBI (Mandiri) Kelas 2': t => ({ ve: null, vii: t, va: null }),
    'Non-PBI (Mandiri) Kelas 3': t => ({ ve: t / 6, vii: t * 5 / 6, va: null }),
    'Non-PBI (PNS) Gol.1 & 2': t => ({ ve: null, vii: null, va: t }),
    'Non-PBI (PNS) Gol.3 & 4': t => ({ ve: null, vii: null, va: t }),
  };

  function bpjs(data, { jenis, art, bulan }) {
    const baris = cari(data.bpjs, 'jenis', jenis);
    if (!baris) return gagal('kosong');
    const a = bacaAngka([art, bulan]);
    if (a.error) return a.error;
    const [nArt, nBulan] = a.nilai;
    if (!Number.isInteger(nBulan) || nBulan < 1 || nBulan > 12) return gagal('bulan');
    if (baris.biaya === null) return gagal('tarif');
    const total = baris.biaya * nBulan * nArt;
    const blok = (BLOK_BPJS[jenis] || (() => ({ ve: null, vii: null, va: null })))(total);
    return { ok: true, nilai: total, blok };
  }

  // Jumlah tarif dari beberapa pilihan yang dicentang.
  function jumlahCentang(tabel, kolomNama, dipilih) {
    if (!dipilih || dipilih.length === 0) return gagal('kosong');
    let nilai = 0;
    const tanpaTarif = [];
    for (const nama of dipilih) {
      const baris = cari(tabel, kolomNama, nama);
      if (!baris) continue;
      if (baris.biaya === null) tanpaTarif.push(nama);
      else nilai += baris.biaya;
    }
    if (tanpaTarif.length === dipilih.length) return gagal('tarif');
    return { ok: true, nilai, tanpaTarif };
  }

  const imunisasi = (data, { jenis }) => jumlahCentang(data.imunisasi, 'jenis', jenis);
  const pkh = (data, { kriteria }) => jumlahCentang(data.pkh, 'kriteria', kriteria);

  function rawat(data, { keperluan, jenis }) {
    const baris = data.rawat.find(r => r.keperluan === keperluan && r.jenis === jenis);
    return kali(baris, 'biaya', []);
  }

  const LANGKAH_MELAHIRKAN = ['perawatan', 'pemeriksaan', 'fasilitas', 'rawat'];
  const KUNJUNGAN_PERAWATAN = ['Pemeriksaan Kehamilan', 'Pasca Melahirkan'];

  // Baris cocok bila tiap kolom yang sudah dipilih sama; kolom data null cocok dengan pilihan kosong.
  function cocok(baris, pilihan, kolomDiperiksa) {
    return kolomDiperiksa.every(k => {
      const p = pilihan[k] || null;
      return p === null ? true : baris[k] === p;
    });
  }

  function opsiMelahirkan(data, pilihan, kolom) {
    const sebelum = LANGKAH_MELAHIRKAN.slice(0, LANGKAH_MELAHIRKAN.indexOf(kolom));
    const hasil = [];
    for (const baris of data.melahirkan) {
      if (!cocok(baris, pilihan, sebelum)) continue;
      const v = baris[kolom];
      if (v !== null && !hasil.includes(v)) hasil.push(v);
    }
    return hasil;
  }

  function melahirkan(data, pilihan) {
    if (!pilihan.perawatan) return gagal('kosong');
    const baris = data.melahirkan.find(r =>
      LANGKAH_MELAHIRKAN.every(k => (r[k] === null ? !pilihan[k] : r[k] === pilihan[k])));
    if (!baris) return gagal('tidak-cocok');
    const pengali = KUNJUNGAN_PERAWATAN.includes(baris.perawatan) ? [pilihan.kunjungan] : [];
    return kali(baris, 'biaya', pengali);
  }

  const api = {
    parseAngka, formatRupiah, formatDesimal,
    konversi, bos, pip, bpjs, imunisasi, rawat, melahirkan, opsiMelahirkan, KUNJUNGAN_PERAWATAN,
    kb, listrik, pkh, rekening,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KIUT_CALC = api;
})(typeof self !== 'undefined' ? self : this);
