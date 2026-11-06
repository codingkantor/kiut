// Sesi login & data KIUT yang disimpan di HP (localStorage).
//   kiut.sesi = { token, kedaluwarsa, akun }
//   kiut.data = { versiData, diperbarui, data }
(function (root) {
  'use strict';

  const KUNCI_SESI = 'kiut.sesi';
  const KUNCI_DATA = 'kiut.data';

  function buatSesi(storage, sekarang = Date.now) {
    function baca(k) {
      try {
        const t = storage.getItem(k);
        if (!t) return null;
        const v = JSON.parse(t);
        return v && typeof v === 'object' ? v : null;
      } catch (e) {
        return null;
      }
    }
    function tulis(k, v) {
      try { storage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage penuh/diblokir */ }
    }
    function buang(k) {
      try { storage.removeItem(k); } catch (e) { /* abaikan */ }
    }

    function simpanData(r) {
      if (r && r.data && typeof r.data === 'object') {
        tulis(KUNCI_DATA, { versiData: r.versiData, diperbarui: r.diperbarui || '', data: r.data });
      }
    }

    return {
      simpanLogin(r) {
        tulis(KUNCI_SESI, { token: r.token, kedaluwarsa: r.kedaluwarsa, akun: r.akun || {} });
        simpanData(r);
      },
      perbarui(r) {
        const s = baca(KUNCI_SESI);
        if (!s) return;
        if (r.kedaluwarsa) s.kedaluwarsa = r.kedaluwarsa;
        if (r.akun) s.akun = r.akun;
        tulis(KUNCI_SESI, s);
        simpanData(r);
      },
      aktif() {
        const s = baca(KUNCI_SESI);
        return !!(s && s.token && Number(s.kedaluwarsa) > sekarang());
      },
      token() { const s = baca(KUNCI_SESI); return s ? s.token || null : null; },
      akun() { const s = baca(KUNCI_SESI); return s ? s.akun || null : null; },
      data() { const d = baca(KUNCI_DATA); return d ? d.data || null : null; },
      versiData() { const d = baca(KUNCI_DATA); return d ? d.versiData : null; },
      diperbarui() { const d = baca(KUNCI_DATA); return d ? d.diperbarui || '' : ''; },
      hapus() {
        buang(KUNCI_SESI);
        buang(KUNCI_DATA);
      },
    };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { buatSesi };
  else {
    let storage;
    try { storage = root.localStorage; } catch (e) { storage = null; }
    if (!storage) {
      const mem = {};
      storage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } };
    }
    root.KIUT_SESI = buatSesi(storage);
  }
})(typeof self !== 'undefined' ? self : this);
