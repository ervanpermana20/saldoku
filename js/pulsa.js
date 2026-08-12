/* ===================================================================
   SaldoKu — pulsa.js
   -------------------------------------------------------------------
   Logika form Pulsa. Lebih SEDERHANA dari dana.js karena:
   1. Admin FLAT Rp3.000 untuk semua nominal (tidak perlu if-else
      bertingkat seperti hitungAdminDana())
   2. Tidak ada pilihan Beli/Tarik — pulsa cuma satu arah (beli saja)
   3. Nominal pakai dropdown tetap, bukan input bebas + tombol cepat
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const metodeRadios = document.querySelectorAll('input[name="metode"]');
  const codAlert = document.getElementById('codAlert');
  const fieldWa = document.getElementById('fieldWa');
  const fieldAlamat = document.getElementById('fieldAlamat');
  const nominalSelect = document.getElementById('nominal');
  const summaryBox = document.getElementById('summaryBox');
  const sumNominal = document.getElementById('sumNominal');
  const sumAdmin = document.getElementById('sumAdmin');
  const sumTotal = document.getElementById('sumTotal');
  const submitBtn = document.getElementById('submitBtn');
  const pulsaForm = document.getElementById('pulsaForm');

  // Admin pulsa itu KONSTAN (tidak berubah-ubah seperti DANA), jadi
  // cukup 1 angka tetap, tidak perlu fungsi hitung bertingkat.
  const ADMIN_PULSA = 3000;

  let metodeSaatIni = 'online';

  function formatRupiah(angka) {
    return 'Rp' + angka.toLocaleString('id-ID');
  }

  function updateSummary() {
    const nominal = parseInt(nominalSelect.value) || 0;
    const total = nominal + ADMIN_PULSA;

    sumNominal.textContent = formatRupiah(nominal);
    sumAdmin.textContent = formatRupiah(nominal > 0 ? ADMIN_PULSA : 0);
    sumTotal.textContent = formatRupiah(nominal > 0 ? total : 0);
  }

  function toggleMetodeFields() {
    const isCod = metodeSaatIni === 'cod';
    fieldWa.classList.toggle('hidden', isCod);
    fieldAlamat.classList.toggle('hidden', !isCod);
    codAlert.classList.toggle('hidden', !isCod);
    summaryBox.classList.toggle('hidden', isCod);

    document.getElementById('noWa').required = !isCod;
    document.getElementById('alamat').required = isCod;

    submitBtn.textContent = isCod ? 'Lanjut ke WhatsApp Admin' : 'Lanjutkan';
  }

  metodeRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      metodeSaatIni = radio.value;
      toggleMetodeFields();
    });
  });

  nominalSelect.addEventListener('change', updateSummary);

  async function simpanPesanan(data) {
    const docRef = await db.collection('pesanan').add(data);
    return docRef.id;
  }

  pulsaForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (metodeSaatIni === 'cod') {
      alert('Tahap berikutnya: form ini akan mengarahkan ke WhatsApp admin.');
      return;
    }

    const nominal = parseInt(nominalSelect.value) || 0;
    const total = nominal + ADMIN_PULSA;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan...';

    try {
      const kodeUnik = await ambilKodeUnikBerikutnya();

      const data = {
        kodeUnik: kodeUnik,
        produk: 'pulsa',
        jenis: 'beli',   // pulsa selalu 'beli', tidak ada 'tarik'
        metode: 'online',
        nama: document.getElementById('nama').value,
        noWa: document.getElementById('noWa').value,
        noHp: document.getElementById('noHp').value,
        nominal: nominal,
        admin: ADMIN_PULSA,
        total: total,
        status: 'menunggu_pembayaran',
        dibuatPada: firebase.firestore.FieldValue.serverTimestamp(),
      };

      await simpanPesanan(data);
      tampilkanModal({
        judul: 'Pesanan Berhasil Disimpan',
        pesan: 'Simpan kode unik ini untuk cek status pesanan kamu nanti.',
        tipe: 'sukses',
        kode: kodeUnik,
      });
      pulsaForm.reset();
      updateSummary();
    } catch (error) {
      tampilkanModal({
        judul: 'Gagal Menyimpan Pesanan',
        pesan: 'Coba lagi ya.\n\nDetail error (untuk belajar): ' + error.message,
        tipe: 'error',
      });
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Lanjutkan';
    }
  });

  toggleMetodeFields();
  updateSummary();

});
