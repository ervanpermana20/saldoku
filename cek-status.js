/* ===================================================================
   SaldoKu — cek-status.js
   -------------------------------------------------------------------
   Logika halaman "Cek Status": pembeli masukkan kode unik, sistem
   mencari dokumen yang cocok di Firestore (collection 'pesanan'),
   lalu menampilkan detailnya.

   KONSEP BARU di file ini: QUERY (pencarian data)
   Sebelumnya (dana.js) kita cuma pernah MENULIS data (.add()).
   Di sini kita belajar MEMBACA/MENCARI data dengan syarat tertentu —
   ini yang disebut "query" di dunia database.
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const kodeInput = document.getElementById('kodeInput');
  const cariBtn = document.getElementById('cariBtn');
  const hasilBox = document.getElementById('hasilBox');
  const notFoundBox = document.getElementById('notFoundBox');

  const hasilKode = document.getElementById('hasilKode');
  const hasilBadge = document.getElementById('hasilBadge');
  const hasilProduk = document.getElementById('hasilProduk');
  const hasilJenis = document.getElementById('hasilJenis');
  const hasilNominal = document.getElementById('hasilNominal');
  const hasilAdmin = document.getElementById('hasilAdmin');
  const hasilTotal = document.getElementById('hasilTotal');

  function formatRupiah(angka) {
    return 'Rp' + angka.toLocaleString('id-ID');
  }

  // Peta status (nilai di database) ke tampilan yang ramah dibaca +
  // warna badge yang sesuai. Ini contoh "lookup table" — daripada
  // menulis if-else panjang, kita simpan pemetaannya di satu objek.
  const statusMap = {
    menunggu_pembayaran: { teks: 'Menunggu Pembayaran', kelas: 'badge-warning' },
    menunggu_verifikasi: { teks: 'Menunggu Verifikasi', kelas: 'badge-warning' },
    diproses: { teks: 'Diproses', kelas: 'badge-warning' },
    selesai: { teks: 'Selesai', kelas: 'badge-success' },
    gagal: { teks: 'Gagal / Dibatalkan', kelas: 'badge-danger' },
  };

  // Peta nama produk & jenis (nilai teknis di database) ke teks yang
  // lebih enak dibaca pembeli.
  const produkMap = { dana: 'DANA', pulsa: 'Pulsa', token: 'Token Listrik', bank: 'Transfer Bank' };
  const jenisMap = { beli: 'Beli', tarik: 'Tarik' };

  async function cariPesanan() {
    const kode = kodeInput.value.trim().padStart(4, '0');

    if (!kode || kode === '0000') {
      tampilkanModal({
        judul: 'Kode Belum Diisi',
        pesan: 'Masukkan kode unik terlebih dahulu.',
        tipe: 'error',
      });
      return;
    }

    // Tampilan "loading" sederhana sambil menunggu data dari server
    cariBtn.disabled = true;
    cariBtn.textContent = 'Mencari...';
    hasilBox.classList.add('hidden');
    notFoundBox.classList.add('hidden');

    try {
      // .where('kodeUnik', '==', kode) artinya: "cari dokumen di
      // collection 'pesanan' yang field kodeUnik-nya PERSIS SAMA
      // dengan nilai kode yang dicari". Ini yang disebut QUERY.
      //
      // .limit(1) — kita cuma butuh 1 hasil (kode unik seharusnya
      // tidak ada yang kembar dalam periode aktif 1-1000).
      //
      // .get() — jalankan pencarian ini ke server Firestore.
      const snapshot = await db.collection('pesanan')
        .where('kodeUnik', '==', kode)
        .limit(1)
        .get();

      // snapshot.empty bernilai true kalau TIDAK ADA dokumen yang
      // cocok dengan pencarian tadi.
      if (snapshot.empty) {
        notFoundBox.classList.remove('hidden');
        return;
      }

      // snapshot.docs adalah daftar dokumen hasil pencarian (array).
      // Karena kita cuma minta 1 (.limit(1)), kita ambil yang
      // pertama saja: snapshot.docs[0].
      const dokumen = snapshot.docs[0].data();

      // Isi tampilan hasil dengan data dari dokumen yang ditemukan
      hasilKode.textContent = dokumen.kodeUnik;
      hasilProduk.textContent = produkMap[dokumen.produk] || dokumen.produk;
      hasilJenis.textContent = jenisMap[dokumen.jenis] || dokumen.jenis;
      hasilNominal.textContent = formatRupiah(dokumen.nominal);
      hasilAdmin.textContent = formatRupiah(dokumen.admin);
      hasilTotal.textContent = formatRupiah(dokumen.total);

      // Tentukan tampilan badge status berdasarkan lookup table di
      // atas. Kalau status di database tidak dikenal (typo, dll),
      // pakai fallback aman supaya tidak error.
      const statusInfo = statusMap[dokumen.status] || { teks: dokumen.status, kelas: 'badge-warning' };
      hasilBadge.textContent = statusInfo.teks;
      // Hapus dulu semua kelas badge warna sebelumnya, baru tambah
      // yang baru — supaya tidak menumpuk kelas lama tiap pencarian.
      hasilBadge.className = 'badge ' + statusInfo.kelas;

      hasilBox.classList.remove('hidden');
    } catch (error) {
      console.error('Gagal mencari pesanan:', error);
      tampilkanModal({
        judul: 'Terjadi Kesalahan',
        pesan: 'Gagal mencari pesanan.\n\nDetail (untuk belajar): ' + error.message,
        tipe: 'error',
      });
    } finally {
      cariBtn.disabled = false;
      cariBtn.textContent = 'Cari';
    }
  }

  cariBtn.addEventListener('click', cariPesanan);

  // Supaya pembeli juga bisa tekan "Enter" di keyboard HP, bukan
  // cuma tap tombol "Cari".
  kodeInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      cariPesanan();
    }
  });

});
