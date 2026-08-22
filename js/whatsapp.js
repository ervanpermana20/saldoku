/* ===================================================================
   SaldoKu — whatsapp.js
   -------------------------------------------------------------------
   Fungsi reusable untuk membuka WhatsApp dengan pesan yang sudah
   terisi otomatis (pre-filled) — dipakai di semua halaman produk
   untuk alur COD.

   KONSEP: wa.me link
   WhatsApp menyediakan format URL khusus:
     https://wa.me/<nomor>?text=<pesan>
   Kalau link ini dibuka (lewat browser HP), otomatis membuka
   aplikasi WhatsApp, langsung ke chat dengan nomor itu, dengan kolom
   pesan SUDAH TERISI teks yang kita siapkan — pembeli tinggal
   tekan kirim, tidak perlu ngetik ulang detail pesanan.
   =================================================================== */

// Nomor WhatsApp admin SaldoKu. Formatnya WAJIB internasional TANPA
// tanda "+" atau "0" di depan — nomor Indonesia yang diawali "08"
// diubah jadi diawali "62" (kode negara Indonesia).
// Contoh: 085129456938 -> 6285129456938
const NOMOR_WA_ADMIN = '6285129456938';

/**
 * Membuka WhatsApp dengan pesan COD yang sudah terisi detail pesanan.
 * @param {Object} data - Detail pesanan untuk dimasukkan ke pesan
 * @param {string} data.produk - Nama produk, misal "DANA"
 * @param {string} data.jenis - "Beli" atau "Tarik" (kosongkan '' kalau tidak relevan)
 * @param {string} data.nama - Nama pembeli
 * @param {string} data.alamat - Alamat pembeli (untuk COD)
 * @param {string} data.tujuan - Nomor tujuan (DANA/HP/meter/rekening)
 * @param {number} data.nominal - Nominal transaksi
 */
function bukaWhatsAppCod(data) {
  // Susun teks pesan. Baris kosong (\n\n) dipakai supaya pesan lebih
  // enak dibaca, tidak menumpuk jadi satu paragraf panjang.
  const baris = [
    `Halo SaldoKu, saya mau pesan (COD):`,
    ``,
    `Produk: ${data.produk}${data.jenis ? ' - ' + data.jenis : ''}`,
    `Nama: ${data.nama}`,
    `Alamat: ${data.alamat}`,
    `Tujuan: ${data.tujuan}`,
    `Nominal: Rp${data.nominal.toLocaleString('id-ID')}`,
  ];
  const pesan = baris.join('\n');

  // encodeURIComponent() WAJIB dipakai untuk mengubah karakter
  // spesial (spasi, baris baru, titik dua, dll) jadi format yang
  // aman dimasukkan ke URL — tanpa ini, link wa.me bisa rusak/salah
  // baca kalau pesannya mengandung karakter tertentu.
  const pesanEncoded = encodeURIComponent(pesan);

  const url = `https://wa.me/${NOMOR_WA_ADMIN}?text=${pesanEncoded}`;

  // window.open() membuka URL itu di tab/aplikasi baru — di HP,
  // browser otomatis mendeteksi link wa.me dan menawarkan buka
  // lewat aplikasi WhatsApp yang terinstall.
  window.open(url, '_blank');
}

/**
 * Membuka WhatsApp dengan struk pesanan ONLINE yang sudah terisi —
 * dipanggil dari tombol di modal sukses setelah pesanan tersimpan
 * ke Firestore. Tujuannya supaya admin (SaldoKu) langsung tahu ada
 * pesanan baru masuk, tanpa perlu cek manual Firebase Console dulu.
 *
 * @param {Object} data - Detail pesanan
 * @param {string} data.kodeUnik - Kode unik pesanan (misal "0007")
 * @param {string} data.produk - Nama produk, misal "DANA"
 * @param {string} data.jenis - "Beli"/"Tarik" (kosongkan '' kalau tidak relevan)
 * @param {string} data.nama - Nama pembeli
 * @param {string} data.tujuan - Nomor tujuan (DANA/HP/meter/rekening)
 * @param {number} data.nominal - Nominal transaksi
 * @param {number} data.admin - Biaya admin
 * @param {number} data.total - Total yang harus dibayar/diterima
 */
function bukaWhatsAppStruk(data) {
  const baris = [
    `Halo SaldoKu, pesanan baru sudah saya bayar.`,
    ``,
    `Kode Unik: ${data.kodeUnik}`,
    `Produk: ${data.produk}${data.jenis ? ' - ' + data.jenis : ''}`,
    `Nama: ${data.nama}`,
    `Tujuan: ${data.tujuan}`,
    `Nominal: Rp${data.nominal.toLocaleString('id-ID')}`,
    `Admin: Rp${data.admin.toLocaleString('id-ID')}`,
    `Total: Rp${data.total.toLocaleString('id-ID')}`,
    ``,
    `Mohon diproses ya, terima kasih.`,
  ];
  const pesan = baris.join('\n');
  const pesanEncoded = encodeURIComponent(pesan);
  const url = `https://wa.me/${NOMOR_WA_ADMIN}?text=${pesanEncoded}`;

  window.open(url, '_blank');
}
