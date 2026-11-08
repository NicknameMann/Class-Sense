# 📱 ClassSense UM — Aplikasi Mobile Monitoring Ketersediaan & Kualitas Lingkungan Ruang Kuliah Berbasis Wireless IoT

> **Berkas Tugas 6: Source Code GitHub & Dokumentasi Fitur Integrasi**  
> **Mata Kuliah:** Mobile and Wireless Computing  
> **Program Studi:** S1 Teknik Informatika — Departemen Teknik Elektro dan Informatika (DTEI)  
> **Fakultas Teknik, Universitas Negeri Malang (UM)**

---

## 👥 Anggota Kelompok

| No. | Nama Lengkap | NIM | Peran & Kontribusi Utama |
| :-: | :--- | :---: | :--- |
| 1 | **Raden Ahmad** | `240535609477` | UI/UX Beranda & Direktori Ruangan, Algoritma SAW, Haversine, Levenshtein, EMA |
| 2 | **Rajiv Muhammad Atmadja Syahrobert** | `240535613416` | UI/UX Analitik & Audit Energi, Algoritma EPA AQI, Rothfusz Humidex, LTTB, Forward Chaining |
| 3 | **Yudhistira Baraendra Rafi Agrapana** | `240535615714` | Arsitektur Integrasi API (Firebase RTDB, Auth, Open-Meteo), Keamanan RBAC, Build Android APK |

---

## 📦 Output Proyek

1. **Aplikasi Mobile (Android APK):**
   - File Instalasi Lokal Siap Pakai: [`ClassSense-UM-Local.apk`](./ClassSense-UM-Local.apk) / [`android/app/build/outputs/apk/debug/app-debug.apk`](./android/app/build/outputs/apk/debug/app-debug.apk) (`package: id.ac.um.ft.classsense`).
2. **Source Code Terstruktur:**
   - Komponen Utama & Navigasi 4 Tab: [`src/App.jsx`](./src/App.jsx)
   - Halaman Login & Registrasi Akun Baru: [`src/components/LoginPage.jsx`](./src/components/LoginPage.jsx)
   - Modal Tambah Ruangan Kampus UM: [`src/components/AddRoomModal.jsx`](./src/components/AddRoomModal.jsx)
   - Engine 10 Algoritma Komputasi Mobile: [`src/utils/mobileCompute.js`](./src/utils/mobileCompute.js)
   - Layanan Integrasi Cloud API & IoT Simulator: [`src/services/iotSimulatorApi.js`](./src/services/iotSimulatorApi.js)
   - Layanan Autentikasi, Registrasi & RBAC: [`src/services/authService.js`](./src/services/authService.js)
3. **Fitur Utama:**
   - Autentikasi Wajib (*Mandatory Login Gate*), **Fitur Registrasi Akun Baru (*Sign Up*)**, dan Otorisasi Berbasis Peran (*Role-Based Access Control: Mahasiswa vs Staf Sarpras Admin*).
   - **Tab 1 — Beranda:** Status kampus *real-time*, peringatan dini $\text{CO}_2$ tinggi, pencarian ruangan tahan *typo*, dan rekomendasi ruang kosong terbaik (*Best Match #1*).
   - **Tab 2 — Ruangan:** Direktori 17 ruang kuliah/lab asli Kampus UM (Gedung B12, B11, GKB A19, GKB A20, B3, Perpustakaan, Rektorat A1), mode Daftar & Denah interaktif, serta fitur **`+ Tambah Ruangan`** dan **`Hapus Ruangan`**.
   - **Tab 3 — Analitik:** Telemetri *real-time* ($\text{Suhu}$, $\text{RH}$, $\text{PM}_{2.5}$, $\text{CO}_2$, $\text{TVOC}$), indeks kenyamanan termal *Humidex*, bar ISPU/US EPA AQI, dan grafik tren fluktuasi dengan *downsampling* LTTB.
   - **Tab 4 — Audit Energi:** Deteksi otomatis pemborosan AC pada ruangan kosong ($< 23^\circ\text{C}$) dan lampu koridor siang hari ($> 500\text{ Lux}$), lengkap dengan sakelar **Matikan AC Jarak Jauh**.
4. **Integrasi Data (API):**
   - Terintegrasi penuh secara *two-way* (baca & tulis) dengan **Firebase Realtime Database REST API**, **Open-Meteo Weather & Air Quality REST API**, dan **Firebase Authentication REST API**.

---

## 🔗 Dokumentasi Fitur Integrasi (Fokus Berkas Tugas 6)

Sistem **ClassSense** menerapkan arsitektur **Hybrid Cloud-to-Edge Mobile Computing**, di mana aplikasi *mobile* berkomunikasi dengan tiga layanan REST API eksternal melalui protokol HTTPS (JSON) dan mengeksekusi 10 algoritma komputasi secara lokal di perangkat (*on-device compute*).

```text
+-------------------------------------------------------------------------+
|                   APLIKASI MOBILE CLASSSENSE (ANDROID)                  |
|         React 19 + Vite + Tailwind CSS + Capacitor Native Bridge        |
+-------------------+---------------------------------+-------------------+
                    |                                 |
      [10 On-Device Compute Algorithms]       [Session & RBAC Security]
      (AQI, Humidex, SAW, Haversine,          (SHA-256 Digest + JWT Auth
       Levenshtein, LTTB, EMA, Rules)          + Anti-Tampering Check)
                    |                                 |
+-------------------+-----------------+---------------+-------------------+
|                                     |                                   |
v (HTTPS GET/PUT/PATCH/DELETE)        v (HTTPS GET)                       v (HTTPS POST)
+----------------------------+  +---------------------------+  +--------------------------+
| 1. Firebase Realtime DB    |  | 2. Open-Meteo REST API    |  | 3. Firebase Auth API     |
| (Telemetri 17 Ruang Kampus |  | (Cuaca & Kualitas Udara   |  | (Registrasi Akun Baru &  |
|  UM & Kendali Aktuator AC) |  |  Aktual Kampus UM Malang) |  |  Login Multi-Role RBAC)  |
+----------------------------+  +---------------------------+  +--------------------------+
```

### 1. Integrasi Cloud IoT Telemetry & Actuator API (Firebase Realtime Database)
Digunakan untuk menyinkronkan data sensor 17 ruang kelas Universitas Negeri Malang, menyimpan ruangan baru, serta mengirim instruksi kendali aktuator AC dan lampu secara *real-time* antar-perangkat.
- **File Implementasi:** [`src/services/iotSimulatorApi.js`](./src/services/iotSimulatorApi.js)
- **Base Endpoint:** `https://classsense-6ef75-default-rtdb.asia-southeast1.firebasedatabase.app`
- **Daftar Operasi HTTP REST:**

| Fitur Integrasi | Metode HTTP | Endpoint REST | Deskripsi Proses |
| :--- | :---: | :--- | :--- |
| **Fetch & Auto-Seed Ruangan** | `GET` / `PUT` | `/rooms.json` | Mengambil seluruh data telemetri ruang kuliah UM. Jika database kosong (`null`), otomatis melakukan *auto-seeding* dataset gedung UM. |
| **Tambah Ruangan Baru** | `PUT` | `/rooms/{roomId}.json?auth={token}` | Menyimpan ruang kelas/lab baru beserta hasil komputasi awal AQI, Humidex, dan koordinat GPS gedung UM. |
| **Kendali Aktuator Jarak Jauh** | `PATCH` | `/rooms/{roomId}.json?auth={token}` | Mengubah status `acActive`, `lightsActive`, suhu, atau status *booking* ruangan secara *real-time*. |
| **Hapus Ruangan** | `DELETE` | `/rooms/{roomId}.json?auth={token}` | Menghapus entri ruangan dari database cloud Firebase oleh Staf Sarpras (Admin). |

**Contoh Payload JSON Telemetri Ruangan (`/rooms/B12-204.json`):**
```json
{
  "id": "B12-204",
  "code": "B12-204",
  "name": "Lab Jaringan & Mobile Computing B12",
  "building": "Gedung B12 FT (DTEI), Lt. 2",
  "temp": 23.4,
  "humidity": 52,
  "pm25": 6.2,
  "co2": 430,
  "lux": 320,
  "occupied": 0,
  "acActive": false,
  "lightsActive": false,
  "lat": -7.9614,
  "lng": 112.6177
}
```

---

### 2. Integrasi Kalibrasi Iklim & Kualitas Udara Eksternal (Open-Meteo Live REST API)
Digunakan sebagai acuan *baseline* kondisi udara luar gedung di titik koordinat Fakultas Teknik Universitas Negeri Malang (`latitude: -7.9612`, `longitude: 112.6175`).
- **File Implementasi:** `fetchCampusOutdoorClimate()` di [`src/services/iotSimulatorApi.js`](./src/services/iotSimulatorApi.js)
- **Endpoint Cuaca Aktual:**
  `GET https://api.open-meteo.com/v1/forecast?latitude=-7.9612&longitude=112.6175&current=temperature_2m,relative_humidity_2m`
- **Endpoint Kualitas Udara Aktual:**
  `GET https://air-quality-api.open-meteo.com/v1/air-quality?latitude=-7.9612&longitude=112.6175&current=pm2_5,us_aqi,carbon_monoxide`
- **Mekanisme Fault-Tolerance:** Dilengkapi *graceful fallback* ke data *cache* terkalibrasi apabila perangkat sedang berada di jaringan tanpa internet.

---

### 3. Integrasi Autentikasi, Registrasi Akun & Keamanan RBAC (Firebase Auth + SHA-256)
Melindungi aplikasi dengan **Mandatory Login Gate** (pengguna wajib login terlebih dahulu sebelum dapat melihat data kampus), menyediakan **Fitur Registrasi Akun Baru (*Sign Up*)**, dan memisahkan wewenang berdasarkan peran (*Role-Based Access Control*).
- **File Implementasi:** [`src/services/authService.js`](./src/services/authService.js) & [`src/components/LoginPage.jsx`](./src/components/LoginPage.jsx)
- **Endpoint Registrasi Akun (Sign Up):**
  `POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={VITE_FIREBASE_API_KEY}`
- **Endpoint Login Akun (Sign In):**
  `POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={VITE_FIREBASE_API_KEY}`
- **Keamanan Kriptografi & Sesi:**
  - Tidak ada *password plaintext* di dalam kode sumber (menggunakan *salted SHA-256 digest*).
  - Sesi pengguna dilindungi *checksum* integritas (`verifySessionIntegrity()`) di `sessionStorage` untuk mencegah manipulasi *role* melalui *Developer Tools*.
  - Penyimpanan akun kustom dienkripsi dan disinkronkan ke `/users/{uid}.json` serta `localStorage` agar akun baru langsung aktif baik secara *online* maupun *offline*.
  - Aturan keamanan database terdokumentasi di [`database.rules.json`](./database.rules.json).

---

## 🧠 Integrasi 10 Algoritma Komputasi Sisi Mobile (On-Device Compute)

Sesuai spesifikasi rancangan sistem pada dokumen tugas, seluruh algoritma berikut dieksekusi langsung di perangkat pengguna pada berkas [`src/utils/mobileCompute.js`](./src/utils/mobileCompute.js):

| No. | Proses Komputasi Mobile | Algoritma / Metode Matematis | Fungsi di `mobileCompute.js` | Implementasi pada UI Aplikasi |
| :-: | :--- | :--- | :--- | :--- |
| 1 | Kalkulasi Indeks Kualitas Udara Real-Time | *Segmented Linear Interpolation* (Standar US EPA AQI) | `calculateEPA_AQI()` | Kartu AQI & Bar ISPU pada Tab Beranda, Ruangan, dan Analitik |
| 2 | Perhitungan Kenyamanan Termal (Humidex) | *Rothfusz Regression Equation* (Model Polinomial Steadman) | `calculateHeatIndex()` | Kartu Persepsi Termal (Suhu Efektif) pada Tab Analitik |
| 3 | Perankingan & Rekomendasi Ruang Kosong | *Simple Additive Weighting* (SAW Multi-Criteria) | `rankRoomsSAW()` | Kartu *Best Match (#1)* & Urutan Rekomendasi di Tab Beranda |
| 4 | Kalkulasi Jarak Geospasial Pengguna ke Gedung | *Haversine Formula* (Great-Circle Distance GPS) | `calculateHaversineMeters()` | Indikator jarak meter & estimasi jalan kaki ke gedung kuliah |
| 5 | Pencarian Cepat & Autocomplete Tahan Typo | *Levenshtein Distance Algorithm* ($\le 2$ Edit Distance) | `levenshteinDistance()`, `fuzzySearchRooms()` | Kotak pencarian ruangan/fasilitas di Tab Beranda & Ruangan |
| 6 | Downsampling Grafik Tren Historis Sensor | *Largest-Triangle-Three-Buckets* (LTTB) | `downsampleLTTB()` | Grafik korelasi tren Suhu & AQI (08.00–16.00) di Tab Analitik |
| 7 | Smoothing & Filter Noise Sinyal Okupansi PIR | *Exponential Moving Average* (EMA, $\alpha = 0.35$) | `smoothOccupancyEMA()` | Stabilisasi badge status *Kosong/Terisi* agar bebas *flickering* |
| 8 | Evaluasi Logika Anomali Pemborosan Energi | *Rule-Based Inference Engine* (*Forward Chaining*) | `evaluateEnergyAnomalies()` | Deteksi otomatis AC ruang kosong ($<23^\circ\text{C}$) & lampu koridor di Tab Audit Energi |
| 9 | Komputasi Perbedaan Status Cache Lokal | *Myers Difference / State Diffing* | `diffRoomListState()` | Optimasi *selective re-rendering* saat menerima *stream* telemetri baru |
| 10 | Evaluasi Ambang Batas & Rate-Limiting Alert | *Debounce & Throttle Rate-Limiting* (Cooldown 15 Menit) | `shouldTriggerAirAlert()` | Banner & notifikasi peringatan dini saat $\text{CO}_2 > 1000\text{ ppm}$ |

---

## 🚀 Cara Instalasi, Menjalankan Proyek & Pengujian

### 1. Persiapan & Menjalankan di Lokal (Web / Mobile View)
```bash
# 1. Install seluruh dependensi
npm install

# 2. Salin konfigurasi environment (.env)
cp .env.example .env

# 3. Jalankan server pengembangan Vite
npm run dev -- --host
```

### 2. Menjalankan Pengujian Otomatis (37 Unit & Integration Tests)
```bash
npm test
```
*Memeriksa 10 Algoritma On-Device, Open-Meteo REST API, Firebase RTDB Fetch/Seed/Put/Delete, Autentikasi RBAC, dan Fitur Registrasi Akun Baru.*

### 3. Merakit (Compile) Aplikasi menjadi File Android `.apk`
```bash
# 1. Build aset web produksi
npm run build

# 2. Sinkronkan ke proyek native Android Capacitor
npx cap sync android

# 3. Compile APK Debug menggunakan Gradle di folder android
cd android && ./gradlew assembleDebug --no-daemon
```

---

## 🔐 Akun Uji Demo (Login & Registrasi)

Selain mendaftarkan akun baru secara mandiri melalui tab **"Daftar Akun Baru"** di halaman awal aplikasi, penguji juga dapat menggunakan akun demo bawaan berikut:

| Peran Pengguna | Email Kampus | Kata Sandi | Hak Akses Fitur |
| :--- | :--- | :--- | :--- |
| **Staf Sarpras (Admin)** | `sarpras@um.ac.id` | `admin123` | **Akses Penuh:** Monitoring, Booking, `+ Tambah/Hapus Ruangan`, Matikan AC/Lampu Jarak Jauh, & Panel Simulator IoT |
| **Mahasiswa FT UM** | `mahasiswa@um.ac.id` | `mhs123` | **Akses Reguler:** Monitoring Suhu/AQI, Rekomendasi SAW, & Booking Ruang (Kendali Aktuator & Manajemen Ruang Terkunci) |
