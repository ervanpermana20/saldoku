/* ===================================================================
   SaldoKu — firebase-config.js
   -------------------------------------------------------------------
   File ini KHUSUS untuk konfigurasi Firebase — dipisah sendiri dari
   file logic lain (seperti dana.js) supaya:
   1. Kalau nanti ganti project Firebase, cukup ubah 1 file ini saja
   2. Lebih rapi — config dan logic tidak bercampur
   3. File ini dimuat DULUAN di HTML, sebelum file lain yang
      membutuhkan koneksi ke Firebase

   CATATAN KEAMANAN (penting dipahami, bukan cuma dihafal):
   Kode di bawah ini AMAN untuk terlihat publik di browser siapa pun.
   apiKey Firebase BUKAN password rahasia — ini beda dengan API Token
   bot Telegram yang WAJIB dirahasiakan.

   Keamanan Firestore yang SEBENARNYA diatur lewat "Security Rules"
   (aturan siapa boleh baca/tulis data) yang kita atur terpisah di
   dashboard Firebase — bukan dengan menyembunyikan config ini.
   =================================================================== */

// firebaseConfig — "alamat + identitas" project Firebase kamu.
// Nilai-nilai ini didapat dari Firebase Console > Project Settings.
const firebaseConfig = {
  apiKey: "AIzaSyAvlP3YKk9YkpSIc-UbVqqDRL9YueFe_b0",
  authDomain: "saldoku-1173e.firebaseapp.com",
  projectId: "saldoku-1173e",
  storageBucket: "saldoku-1173e.firebasestorage.app",
  messagingSenderId: "995573098391",
  appId: "1:995573098391:web:02680ec9e13eefc89046d2"
};

// initializeApp() adalah fungsi bawaan Firebase SDK untuk "menyalakan"
// koneksi ke project Firebase kamu, memakai config di atas.
// Variabel "app" ini nanti dipakai lagi untuk mengakses Firestore.
const app = firebase.initializeApp(firebaseConfig);

// getFirestore() (di sini pakai firebase.firestore()) membuka akses
// ke database Firestore yang sudah kamu buat. Kita simpan di variabel
// "db" (singkatan "database") supaya file lain (dana.js) bisa pakai
// variabel ini untuk menyimpan/membaca data pesanan.
const db = firebase.firestore();
