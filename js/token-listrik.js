/* ===================================================================
   SaldoKu — token-listrik.js
   -------------------------------------------------------------------
   Mirip pulsa.js, tapi admin punya 2 TINGKAT (bukan flat):
   nominal < 100rb -> admin 2rb
   nominal >= 100rb -> admin 5rb
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
  const tokenForm = document.getElementById('tokenForm');

  let metodeSaatIni = 'online';

  // Fungsi hitung admin token listrik — 2 tingkat saja, jadi cukup
  // 1 pengecekan if-else (dibandingkan hitungAdminDana() yang
  // punya 5 tingkat).
  function hitungAdminToken(nominal) {
    if (nominal <= 0) return 0;
    return nominal < 100000 ? 2000 : 5000;
  }

  function formatRupiah(angka) {
    return 'Rp' + angka.toLocaleString('id-ID');
  }

  function updateSummary() {
    const nominal = parseInt(nominalSelect.value) || 0;
    const admin = hitungAdminToken(nominal);
    const total = nominal + admin;

    sumNominal.textContent = formatRupiah(nominal);
    sumAdmin.textContent = formatRupiah(admin);
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

  tokenForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (metodeSaatIni === 'cod') {
      const nominal = parseInt(nominalSelect.value) || 0;
      bukaWhatsAppCod({
        produk: 'Token Listrik',
        jenis: '',
        nama: document.getElementById('nama').value,
        alamat: document.getElementById('alamat').value,
        tujuan: document.getElementById('noMeter').value,
        nominal: nominal,
      });
      return;
    }

    const nominal = parseInt(nominalSelect.value) || 0;
    const admin = hitungAdminToken(nominal);
    const total = nominal + admin;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan...';

    try {
      const kodeUnik = await ambilKodeUnikBerikutnya();

      const data = {
        kodeUnik: kodeUnik,
        produk: 'token',
        jenis: 'beli',
        metode: 'online',
        nama: document.getElementById('nama').value,
        noWa: document.getElementById('noWa').value,
        noMeter: document.getElementById('noMeter').value,
        nominal: nominal,
        admin: admin,
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
          produk: 'Token Listrik',
          jenis: '',
          nama: data.nama,
          tujuan: data.noMeter,
          nominal: data.nominal,
          admin: data.admin,
          total: data.total,
        }),
      });
      tokenForm.reset();
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
