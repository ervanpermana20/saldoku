/* ===================================================================
   SaldoKu — modal.js
   -------------------------------------------------------------------
   Fungsi reusable untuk menampilkan modal custom (pengganti alert()
   bawaan browser yang tampilannya putih polos & tidak bisa diatur).

   Dipakai di semua halaman form (dana.js, pulsa.js, dll) dengan cara
   memanggil: tampilkanModal({ judul, pesan, tipe, kode })

   CATATAN: file ini butuh elemen HTML modal sudah ada di halaman
   (lihat komentar "MODAL (pengganti alert)" di tiap file .html).
   =================================================================== */

/**
 * Menampilkan modal custom.
 * @param {Object} opsi
 * @param {string} opsi.judul - Judul modal, misal "Pesanan Berhasil"
 * @param {string} opsi.pesan - Isi pesan (boleh multi-baris pakai \n)
 * @param {'sukses'|'error'} opsi.tipe - Menentukan warna ikon
 * @param {string} [opsi.kode] - Opsional, kode unik yang ditampilkan menonjol
 */
function tampilkanModal({ judul, pesan, tipe = 'sukses', kode = null }) {
  const overlay = document.getElementById('modalOverlay');
  const iconBox = document.getElementById('modalIcon');
  const judulEl = document.getElementById('modalJudul');
  const pesanEl = document.getElementById('modalPesan');
  const kodeEl = document.getElementById('modalKode');
  const tutupBtn = document.getElementById('modalTutupBtn');

  // Kalau elemen modal tidak ditemukan di halaman ini (lupa
  // ditambahkan ke HTML), gunakan alert() biasa sebagai fallback —
  // supaya halaman tidak "diam" tanpa pesan sama sekali.
  if (!overlay) {
    alert(judul + '\n\n' + pesan);
    return;
  }

  // Set ikon sesuai tipe (sukses = centang hijau, error = silang merah)
  iconBox.className = 'modal-icon modal-icon--' + tipe;
  iconBox.innerHTML = tipe === 'sukses'
    ? '<svg data-lucide="check" width="24" height="24"></svg>'
    : '<svg data-lucide="x" width="24" height="24"></svg>';

  judulEl.textContent = judul;
  pesanEl.textContent = pesan;

  // Kode unik cuma ditampilkan kalau memang diberikan (opsional)
  if (kode) {
    kodeEl.textContent = kode;
    kodeEl.classList.remove('hidden');
  } else {
    kodeEl.classList.add('hidden');
  }

  // Render ulang ikon Lucide, karena ikon di dalam modal ini baru
  // dimasukkan lewat innerHTML tadi — Lucide perlu dipanggil ulang
  // supaya SVG-nya benar-benar tergambar.
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  overlay.classList.add('is-open');

  // Tombol "Oke" dan klik di luar modal (di overlay gelap) sama-sama
  // menutup modal.
  const tutupModal = () => overlay.classList.remove('is-open');
  tutupBtn.onclick = tutupModal;
  overlay.onclick = (event) => {
    if (event.target === overlay) tutupModal();
  };
}
