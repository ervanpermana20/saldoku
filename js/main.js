/* ===================================================================
   SaldoKu — main.js
   Tahap 1: baru interaksi FRONTEND murni (tanpa Firebase/backend).
   File ini akan berkembang di tahap-tahap berikutnya.
   =================================================================== */

// Lucide Icons dimuat lewat CDN sebagai library global bernama
// "lucide". Fungsi createIcons() ini yang mengubah semua tag
// <svg data-lucide="..."> di HTML menjadi ikon SVG sungguhan.
//
// Kenapa perlu dipanggil manual? Karena Lucide tidak otomatis jalan
// begitu skrip dimuat — kita yang harus "menyalakan"-nya setelah
// halaman siap.
document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});
