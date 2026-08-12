/* ===================================================================
   SaldoKu — kode-unik.js
   -------------------------------------------------------------------
   File ini berisi SATU fungsi yang dipakai ULANG di semua halaman
   produk (DANA, Pulsa, Token Listrik, Bank) — supaya logika "kode
   unik transaksi" tidak ditulis berkali-kali di tiap file (prinsip:
   Don't Repeat Yourself / DRY, salah satu prinsip dasar coding yang
   baik).

   KONSEP: Firestore Transaction
   -------------------------------------------------------------------
   Bayangkan 2 pembeli submit form BERSAMAAN, persis di detik yang
   sama. Tanpa penanganan khusus, ada risiko keduanya membaca counter
   yang sama (misal counter = 7), lalu keduanya sama-sama menyimpan
   sebagai kode unik "0008" — BENTROK, padahal harusnya salah satu
   dapat 0008 dan satunya 0009.

   db.runTransaction() adalah fitur Firestore yang MENJAMIN proses
   "baca lalu tulis" ini tidak akan bentrok walau banyak orang akses
   bersamaan — Firestore otomatis mengatur supaya satu per satu,
   seperti antrean, meski dari luar terlihat berjalan "bersamaan".
   =================================================================== */

// Referensi ke SATU dokumen khusus yang menyimpan angka counter
// terakhir. Kita taruh di collection 'counter', dengan ID dokumen
// 'kodeUnik' (nama bebas, sekadar penanda).
const counterRef = db.collection('counter').doc('kodeUnik');

/**
 * Mengambil kode unik transaksi berikutnya (format 4 digit: "0001").
 * Otomatis reset ke 1 lagi setelah melewati 1000, sesuai kesepakatan.
 *
 * @returns {Promise<string>} kode unik dalam format 4 digit, misal "0007"
 */
async function ambilKodeUnikBerikutnya() {
  // runTransaction menerima sebuah fungsi yang berisi langkah
  // "baca lalu tulis" yang harus dijamin tidak bentrok.
  const kodeBaru = await db.runTransaction(async (transaction) => {
    // 1. BACA nilai counter saat ini
    const counterDoc = await transaction.get(counterRef);

    let angkaTerakhir = 0; // default kalau dokumen counter belum pernah ada
    if (counterDoc.exists) {
      angkaTerakhir = counterDoc.data().nilai;
    }

    // 2. HITUNG angka berikutnya, reset ke 1 kalau sudah lewat 1000
    let angkaBaru = angkaTerakhir + 1;
    if (angkaBaru > 1000) {
      angkaBaru = 1;
    }

    // 3. TULIS angka baru itu kembali ke Firestore, supaya transaksi
    //    berikutnya membaca angka yang sudah ter-update.
    //    { merge: true } artinya "perbarui tanpa menghapus field lain
    //    yang mungkin ada di dokumen ini" — best practice supaya tidak
    //    sengaja menghapus data lain kalau nanti dokumen ini punya
    //    field tambahan.
    transaction.set(counterRef, { nilai: angkaBaru }, { merge: true });

    return angkaBaru;
  });

  // Ubah angka (misal 7) jadi format 4 digit dengan nol di depan
  // ("0007") — padStart(4, '0') artinya "tambahkan '0' di depan
  // sampai panjang totalnya 4 karakter".
  return String(kodeBaru).padStart(4, '0');
}
