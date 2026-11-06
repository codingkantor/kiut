// Klien API KIUT: semua permintaan ke server (Apps Script) lewat sini.
(function (root) {
  'use strict';

  const BATAS_MS = 20000;

  function buatApi(ambilUrl) {
    return {
      async panggil(aksi, isi = {}) {
        const kendali = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const waktu = kendali ? setTimeout(() => kendali.abort(), BATAS_MS) : null;
        let teks;
        try {
          const res = await globalThis.fetch(ambilUrl(), {
            method: 'POST',
            // text/plain agar tidak memicu CORS preflight (Apps Script tidak melayani OPTIONS).
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ aksi, ...isi }),
            signal: kendali ? kendali.signal : undefined,
            redirect: 'follow',
          });
          teks = await res.text();
        } catch (e) {
          return { ok: false, galat: 'jaringan', pesan: 'Tidak ada sinyal' };
        } finally {
          if (waktu) clearTimeout(waktu);
        }
        try {
          const r = JSON.parse(teks);
          if (r && typeof r === 'object' && typeof r.ok === 'boolean') return r;
        } catch (e) { /* jatuh ke bawah */ }
        return { ok: false, galat: 'server', pesan: 'Respons server tidak dikenali' };
      },
    };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { buatApi };
  else root.KIUT_API = buatApi(() => root.KIUT_CONFIG.apiUrl);
})(typeof self !== 'undefined' ? self : this);
