/* ===================================================================
   SaldoKu — bank.js
   -------------------------------------------------------------------
   Mirip gabungan dana.js (ada arah Kirim/Tarik) dan pulsa.js
   (admin flat). Bedanya: minimal transaksi Rp10.000 (bukan berlaku
   skema bertingkat seperti DANA).
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const jenisTabs = document.querySelectorAll('#jenisTabs .tab');
  const metodeRadios = document.querySelectorAll('input[name="metode"]');
  const codAlert = document.getElementById('codAlert');
  const fieldWa = document.getElementById('fieldWa');
  const fieldAlamat = document.getElementById('fieldAlamat');
  const labelRekening = document.getElementById('labelRekening');
  const nominalInput = document.getElementById('nominal');
  const nominalField = document.getElementById('fieldNominal');
  const summaryBox = document.getElementById('summaryBox');
  const sumNominal = document.getElementById('sumNominal');
  const sumAdmin = document.getElementById('sumAdmin');
  const sumTotal = document.getElementById('sumTotal');
  const sumLabel = document.getElementById('sumLabel');
  const submitBtn = document.getElementById('submitBtn');
  const bankForm = document.getElementById('bankForm');

  const ADMIN_BANK = 3000;
  const MIN_TRANSAKSI = 10000;

  const state = {
    jenis: 'beli',
    metode: 'online',
  };

  function formatRupiah(angka) {
    return 'Rp' + angka.toLocaleString('id-ID');
  }

  function updateSummary() {
    const nominal = parseInt(nominalInput.value) || 0;

    let total;
    if (state.jenis === 'tarik') {
      total = nominal - ADMIN_BANK;
      sumLabel.textContent = 'Total Diterima';
    } else {
      total = nominal + ADMIN_BANK;
      sumLabel.textContent = 'Total Bayar';
    }

    sumNominal.textContent = formatRupiah(nominal);
    sumAdmin.textContent = formatRupiah(nominal > 0 ? ADMIN_BANK : 0);
    sumTotal.textContent = formatRupiah(total >= 0 ? total : 0);

    // Validasi minimal transaksi Rp10.000 (beda dari DANA yang
    // minimal 10rb DAN maksimal 1jt — bank di sini pakai batas yang
    // sama, min 10rb, maks 1jt, sesuai kesepakatan limit umum).
    if (nominal > 0 && (nominal < MIN_TRANSAKSI || nominal > 1000000)) {
      nominalField.classList.add('has-error');
    } else {
      nominalField.classList.remove('has-error');
    }
  }

  function toggleMetodeFields() {
    const isCod = state.metode === 'cod';
    fieldWa.classList.toggle('hidden', isCod);
    fieldAlamat.classList.toggle('hidden', !isCod);
    codAlert.classList.toggle('hidden', !isCod);
    summaryBox.classList.toggle('hidden', isCod);

    document.getElementById('noWa').required = !isCod;
    document.getElementById('alamat').required = isCod;

    submitBtn.textContent = isCod ? 'Lanjut ke WhatsApp Admin' : 'Lanjutkan';
  }

  function toggleJenisLabel() {
    labelRekening.textContent = state.jenis === 'tarik'
      ? 'Nomor Rekening Sumber (yang ditarik)'
      : 'Nomor Rekening Tujuan';
    updateSummary();
  }

  jenisTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      jenisTabs.forEach((t) => t.setAttribute('aria-selected', 'false'));
      tab.setAttribute('aria-selected', 'true');
      state.jenis = tab.dataset.jenis;
      toggleJenisLabel();
    });
  });

  metodeRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      state.metode = radio.value;
      toggleMetodeFields();
    });
  });

  nominalInput.addEventListener('input', updateSummary);

  async function simpanPesanan(data) {
    const docRef = await db.collection('pesanan').add(data);
    return docRef.id;
  }

  bankForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (state.metode === 'cod') {
      const nominal = parseInt(nominalInput.value) || 0;
      bukaWhatsAppCod({
        produk: 'Transfer Bank',
        jenis: state.jenis === 'tarik' ? 'Tarik' : 'Kirim',
        nama: document.getElementById('nama').value,
        alamat: document.getElementById('alamat').value,
        tujuan: document.getElementById('namaBank').value + ' - ' + document.getElementById('noRekening').value,
        nominal: nominal,
      });
      return;
    }

    const nominal = parseInt(nominalInput.value) || 0;
    const total = state.jenis === 'tarik' ? nominal - ADMIN_BANK : nominal + ADMIN_BANK;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan...';

    try {
      const kodeUnik = await ambilKodeUnikBerikutnya();

      const data = {
        kodeUnik: kodeUnik,
        produk: 'bank',
        jenis: state.jenis,
        metode: 'online',
        nama: document.getElementById('nama').value,
        noWa: document.getElementById('noWa').value,
        namaBank: document.getElementById('namaBank').value,
        noRekening: document.getElementById('noRekening').value,
        nominal: nominal,
        admin: ADMIN_BANK,
        total: total,
        status: 'menunggu_pembayaran',
        dibuatPada: firebase.firestore.FieldValue.serverTimestamp(),
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
          produk: 'Transfer Bank',
          jenis: state.jenis === 'tarik' ? 'Tarik' : 'Kirim',
          nama: data.nama,
          tujuan: data.namaBank + ' - ' + data.noRekening,
          nominal: data.nominal,
          admin: data.admin,
          total: data.total,
        }),
      });
      bankForm.reset();
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
