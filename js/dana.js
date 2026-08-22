/* ===================================================================
   SaldoKu — dana.js
   Logika KHUSUS halaman form DANA.

   Tahap 2: sudah tersambung ke Firestore — data pesanan (metode
   Online) benar-benar tersimpan ke database saat form disubmit.

   CATATAN PENTING soal DOMContentLoaded:
   Script ini dimuat TANPA atribut "defer" di dana.html (supaya
   urutan Firebase SDK -> firebase-config.js -> dana.js pasti
   berurutan). Konsekuensinya, baris kode di file ini bisa saja
   dibaca browser SEBELUM seluruh HTML selesai dimuat — akibatnya
   getElementById() bisa mengembalikan null kalau tidak ditunggu.

   Makanya SELURUH isi file ini dibungkus di dalam
   document.addEventListener("DOMContentLoaded", ...) di bawah —
   artinya "tunggu HTML selesai dimuat semua, baru jalankan kode
   ini". Ini juga alasan file ini butuh 1 tambahan penutup "});"
   di baris paling akhir.
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {

// -----------------------------------------------------------------
// 1. AMBIL ELEMEN HTML YANG DIBUTUHKAN
// -----------------------------------------------------------------
// Di JavaScript, sebelum kita bisa "mengatur" sebuah elemen HTML
// (misal mengubah teksnya, atau menyembunyikannya), kita harus
// "ambil" dulu elemen itu pakai document.getElementById() atau
// document.querySelector(). Kita simpan semua elemen yang dibutuhkan
// di bagian atas file, supaya gampang dicari & tidak berulang-ulang
// menulis getElementById di banyak tempat.

const jenisTabs = document.querySelectorAll('#jenisTabs .tab');
const metodeRadios = document.querySelectorAll('input[name="metode"]');
const codAlert = document.getElementById('codAlert');
const fieldWa = document.getElementById('fieldWa');
const fieldAlamat = document.getElementById('fieldAlamat');
const labelNoDana = document.getElementById('labelNoDana');
const nominalInput = document.getElementById('nominal');
const nominalError = document.getElementById('nominalError');
const nominalField = document.getElementById('fieldNominal');
const nominalChips = document.querySelectorAll('.nominal-chip');
const summaryBox = document.getElementById('summaryBox');
const sumNominal = document.getElementById('sumNominal');
const sumAdmin = document.getElementById('sumAdmin');
const sumTotal = document.getElementById('sumTotal');
const sumLabel = document.getElementById('sumLabel');
const submitBtn = document.getElementById('submitBtn');
const danaForm = document.getElementById('danaForm');

// -----------------------------------------------------------------
// 2. STATE — menyimpan pilihan user saat ini
// -----------------------------------------------------------------
// "State" artinya kondisi/data yang sedang aktif di halaman ini.
// Kita simpan di sebuah objek supaya gampang dicek dari mana saja
// di file ini, tanpa harus baca ulang dari HTML setiap kali.
const state = {
  jenis: 'beli',   // 'beli' atau 'tarik'
  metode: 'online', // 'online' atau 'cod'
};

// -----------------------------------------------------------------
// 3. FUNGSI: Hitung biaya admin berdasarkan nominal
// -----------------------------------------------------------------
// Skema (batas digeser turun 1rb dari versi awal, supaya nominal
// TEPAT di angka "bulat" seperti 50rb/100rb/200rb/500rb masuk ke
// kategori admin yang LEBIH TINGGI, bukan yang lebih rendah):
// <=49rb=2rb, 49rb-99rb=3rb, 99rb-199rb=5rb,
// 199rb-499rb=10rb, 499rb-1jt=20rb
//
// Kita pakai struktur "if-else berurutan" — mengecek dari yang
// PALING KECIL dulu, begitu cocok langsung berhenti (return).
function hitungAdminDana(nominal) {
  if (nominal <= 0) return 0;
  if (nominal <= 49000) return 2000;
  if (nominal <= 99000) return 3000;
  if (nominal <= 199000) return 5000;
  if (nominal <= 499000) return 10000;
  return 20000; // sisanya: 499rb - 1jt
}

// -----------------------------------------------------------------
// 4. FUNGSI: Format angka jadi "Rp10.000" (format Rupiah)
// -----------------------------------------------------------------
// toLocaleString('id-ID') adalah fitur bawaan JavaScript untuk
// memformat angka sesuai kebiasaan suatu negara/bahasa — untuk
// Indonesia ('id-ID'), otomatis menambahkan titik sebagai
// pemisah ribuan, contoh: 100000 menjadi "100.000".
function formatRupiah(angka) {
  return 'Rp' + angka.toLocaleString('id-ID');
}

// -----------------------------------------------------------------
// 5. FUNGSI: Update ringkasan biaya (dipanggil tiap nominal berubah)
// -----------------------------------------------------------------
function updateSummary() {
  const nominal = parseInt(nominalInput.value) || 0;
  const admin = hitungAdminDana(nominal);

  // Untuk "Tarik", admin DITAMBAHKAN ke nominal — sama seperti Beli,
  // supaya pelanggan menerima uang yang sudah dibulatkan tanpa
  // dipotong. Labelnya "Total Dibayar" (bukan "Total Diterima").
  let total;
  if (state.jenis === 'tarik') {
    total = nominal + admin;
    sumLabel.textContent = 'Total Dibayar';
  } else {
    total = nominal + admin;
    sumLabel.textContent = 'Total Bayar';
  }

  sumNominal.textContent = formatRupiah(nominal);
  sumAdmin.textContent = formatRupiah(admin);
  sumTotal.textContent = formatRupiah(total >= 0 ? total : 0);

  // Validasi: nominal harus antara 10rb - 1jt sesuai batas transaksi
  const nominalField_el = nominalField;
  if (nominal > 0 && (nominal < 10000 || nominal > 1000000)) {
    nominalField_el.classList.add('has-error');
  } else {
    nominalField_el.classList.remove('has-error');
  }
}

// -----------------------------------------------------------------
// 6. FUNGSI: Tampilkan/sembunyikan field sesuai metode (Online/COD)
// -----------------------------------------------------------------
// Ini contoh "conditional rendering" pakai vanilla JS — mengatur
// class "hidden" (sudah didefinisikan di form.css: display:none)
// pada elemen yang perlu disembunyikan.
function toggleMetodeFields() {
  const isCod = state.metode === 'cod';

  // COD: sembunyikan field WA & ringkasan biaya, tampilkan alamat & alert
  fieldWa.classList.toggle('hidden', isCod);
  fieldAlamat.classList.toggle('hidden', !isCod);
  codAlert.classList.toggle('hidden', !isCod);
  summaryBox.classList.toggle('hidden', isCod);

  // Field WA & alamat butuh atribut "required" yang berubah sesuai
  // kondisi — kalau field disembunyikan tapi tetap "required",
  // form tidak akan bisa disubmit meski usernya tidak mengisi field
  // yang memang tidak relevan untuk metode yang dipilih.
  document.getElementById('noWa').required = !isCod;
  document.getElementById('alamat').required = isCod;

  // Ubah teks tombol submit sesuai metode
  submitBtn.textContent = isCod ? 'Lanjut ke WhatsApp Admin' : 'Lanjutkan';
}

// -----------------------------------------------------------------
// 7. FUNGSI: Ubah label & placeholder sesuai jenis (Beli/Tarik)
// -----------------------------------------------------------------
function toggleJenisLabel() {
  if (state.jenis === 'tarik') {
    labelNoDana.textContent = 'Nomor DANA Sumber (yang ditarik)';
  } else {
    labelNoDana.textContent = 'Nomor DANA Tujuan';
  }
  updateSummary(); // label total juga berubah, jadi hitung ulang
}

// -----------------------------------------------------------------
// 8. EVENT LISTENERS — menghubungkan aksi user ke fungsi di atas
// -----------------------------------------------------------------
// "Event listener" adalah cara JavaScript "mendengarkan" aksi user
// (klik, ketik, dll) lalu menjalankan fungsi tertentu sebagai respons.

// Klik tab "Beli" / "Tarik"
jenisTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    // Set semua tab jadi tidak aktif dulu...
    jenisTabs.forEach((t) => t.setAttribute('aria-selected', 'false'));
    // ...lalu aktifkan tab yang baru diklik
    tab.setAttribute('aria-selected', 'true');
    state.jenis = tab.dataset.jenis; // ambil dari atribut data-jenis="beli"/"tarik"
    toggleJenisLabel();
  });
});

// Pilih radio button "Online" / "COD"
metodeRadios.forEach((radio) => {
  radio.addEventListener('change', () => {
    state.metode = radio.value;
    toggleMetodeFields();
  });
});

// Ketik di kolom nominal → hitung ulang ringkasan secara real-time
nominalInput.addEventListener('input', updateSummary);

// Klik salah satu tombol nominal cepat (chip 20rb/50rb/dst)
nominalChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    nominalInput.value = chip.dataset.nominal;
    updateSummary();

    // Kasih tanda visual chip mana yang sedang dipilih
    nominalChips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
    chip.setAttribute('aria-pressed', 'true');
  });
});

// -----------------------------------------------------------------
// 10. FUNGSI: Simpan pesanan ke Firestore (Tahap 2)
// -----------------------------------------------------------------
// "async function" artinya fungsi ini akan melakukan sesuatu yang
// butuh WAKTU (mengirim data ke server Firebase lewat internet) —
// tidak instan seperti operasi biasa. Kata "async" + "await" adalah
// cara JavaScript menunggu proses itu selesai sebelum lanjut ke
// baris berikutnya, tanpa membuat halaman "membeku" selama menunggu.
async function simpanPesanan(data) {
  try {
    // db.collection('pesanan') → "buka folder" bernama pesanan.
    // Kalau folder ini belum pernah ada, Firestore akan membuatnya
    // OTOMATIS saat pertama kali ada data ditambahkan — kita tidak
    // perlu membuat collection secara manual duluan di dashboard.
    //
    // .add(data) → tambahkan 1 dokumen baru (1 transaksi) ke
    // collection itu, dengan ID otomatis dibuatkan oleh Firestore.
    const docRef = await db.collection('pesanan').add(data);

    // docRef.id adalah ID unik yang Firestore buatkan otomatis untuk
    // dokumen ini — berbeda dari "kode unik 0001-1000" yang kita
    // rancang khusus untuk ditampilkan ke pembeli. ID Firestore ini
    // lebih panjang & acak, dipakai di belakang layar oleh sistem.
    console.log('Pesanan tersimpan dengan ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    // Kalau terjadi masalah (misal tidak ada koneksi internet, atau
    // Security Rules menolak), kita tangkap error di sini supaya
    // tidak membuat halaman error/rusak, dan bisa kasih tahu user.
    console.error('Gagal menyimpan pesanan:', error);
    throw error;
  }
}

// Submit form
danaForm.addEventListener('submit', async (event) => {
  // preventDefault() mencegah perilaku default browser (reload
  // halaman) saat form disubmit — supaya kita bisa atur sendiri
  // apa yang terjadi selanjutnya lewat JavaScript.
  event.preventDefault();

  if (state.metode === 'cod') {
    const nominal = parseInt(nominalInput.value) || 0;
    bukaWhatsAppCod({
      produk: 'DANA',
      jenis: state.jenis === 'tarik' ? 'Tarik' : 'Beli',
      nama: document.getElementById('nama').value,
      alamat: document.getElementById('alamat').value,
      tujuan: document.getElementById('noDana').value,
      nominal: nominal,
    });
    return;
  }

  // --- Metode Online: kumpulkan data dari form ---
  const nominal = parseInt(nominalInput.value) || 0;
  const admin = hitungAdminDana(nominal);
  const total = state.jenis === 'tarik' ? nominal - admin : nominal + admin;

  // Nonaktifkan tombol submit sementara, supaya pembeli tidak klik
  // berkali-kali saat data sedang dikirim (mencegah data terkirim
  // ganda / duplikat).
  submitBtn.disabled = true;
  submitBtn.textContent = 'Menyimpan...';

  try {
    // Ambil kode unik SEBELUM menyimpan pesanan, supaya kode unik
    // itu bisa langsung dimasukkan ke data yang tersimpan.
    // Fungsi ambilKodeUnikBerikutnya() ada di file kode-unik.js.
    const kodeUnik = await ambilKodeUnikBerikutnya();

    // Objek "data" ini adalah bentuk 1 dokumen yang akan tersimpan di
    // Firestore. Susunan field-nya sengaja dibuat jelas dan lengkap
    // supaya nanti gampang dibaca lagi (misal untuk ditampilkan di
    // halaman "Cek Status").
    const data = {
      kodeUnik: kodeUnik,           // dipakai pembeli untuk cek status
      produk: 'dana',
      jenis: state.jenis,           // 'beli' atau 'tarik'
      metode: 'online',
      nama: document.getElementById('nama').value,
      noWa: document.getElementById('noWa').value,
      noDana: document.getElementById('noDana').value,
      nominal: nominal,
      admin: admin,
      total: total,
      status: 'menunggu_pembayaran', // status awal, diubah manual oleh admin nanti
      dibuatPada: firebase.firestore.FieldValue.serverTimestamp(),
      // serverTimestamp() mengambil waktu dari SERVER Firebase, bukan
      // dari jam HP pembeli — supaya waktunya akurat & tidak bisa
      // dimanipulasi dari sisi pembeli.
    };

    await simpanPesanan(data);
    tampilkanModal({
      judul: 'Pesanan Berhasil Disimpan',
      pesan: 'Kirim struk ini ke admin lewat WhatsApp supaya pesanan kamu segera diproses.',
      tipe: 'sukses',
      kode: kodeUnik,
      teksTombol: 'Kirim ke Admin via WhatsApp',
      aksiTombol: () => bukaWhatsAppStruk({
        kodeUnik: kodeUnik,
        produk: 'DANA',
        jenis: state.jenis === 'tarik' ? 'Tarik' : 'Beli',
        nama: data.nama,
        tujuan: data.noDana,
        nominal: data.nominal,
        admin: data.admin,
        total: data.total,
      }),
    });
    danaForm.reset();
    updateSummary();
  } catch (error) {
    tampilkanModal({
      judul: 'Gagal Menyimpan Pesanan',
      pesan: 'Coba lagi ya.\n\nDetail error (untuk belajar): ' + error.message,
      tipe: 'error',
    });
  } finally {
    // "finally" selalu dijalankan baik berhasil maupun gagal —
    // supaya tombol submit selalu kembali normal, tidak "macet"
    // dalam keadaan disabled kalau terjadi error.
    submitBtn.disabled = false;
    submitBtn.textContent = 'Lanjutkan';
  }
});

// -----------------------------------------------------------------
// 9. INISIALISASI — jalankan sekali saat halaman pertama dibuka
// -----------------------------------------------------------------
toggleMetodeFields();
updateSummary();

}); // <-- penutup DOMContentLoaded, JANGAN DIHAPUS
