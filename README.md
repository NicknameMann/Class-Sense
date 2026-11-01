# ClassSense: Mobile & Wireless Computing

**Aplikasi Mobile Monitoring Ketersediaan dan Kualitas Lingkungan Ruang Kuliah Berbasis Wireless IoT**  
*Mata Kuliah: Mobile and Wireless Computing — Jurusan Teknik Informatika, Fakultas Teknik, Universitas Negeri Malang*

---

## 👥 Tim Pengembang
| No. | Nama Mahasiswa | NIM |
|---|---|---|
| 1 | Raden Ahmad | 240535609477 |
| 2 | Rajiv Muhammad Atmadja Syahrobert | 240535613416 |
| 3 | Yudhistira Baraendra Rafi Agrapana | 240535615714 |

---

## 📱 Ringkasan Antarmuka 4 Tab (Sesuai `MobileWireless.pdf`)

| Tab Aplikasi | Pemetaan Halaman PDF | Fitur UI Utama & Komponen Interaktif | Algoritma On-Device |
|---|---|---|---|
| **Tab 1: Beranda** | **Halaman 2** | • Header Smart Campus FT & Sains<br>• Search bar toleran typo<br>• Banner peringatan kualitas udara kritis<br>• 4 kartu metrik dari data simulator<br>• Rekomendasi ruang terbaik berdasarkan SAW dan jarak<br>• Modal atur bobot SAW, booking demo, dan navigasi | **Algoritma 3 (SAW)**<br>**Algoritma 4 (Haversine)**<br>**Algoritma 5 (Levenshtein)**<br>**Algoritma 10 (Alert Engine Rate-Limiting)** |
| **Tab 2: Ruangan** | **Halaman 1** | • Dropdown Filter Gedung (A, B, C, D)<br>• Toggle Mode: **Daftar** vs **Denah** (2D Interactive Floorplan)<br>• Filter status: Semua (60), Kosong (42), Terisi (18)<br>• Kartu Ruang Teori A-101, A-102, Lab B-204, Workshop C-101, Auditorium D-301<br>• Status okupansi stabil anti-flicker | **Algoritma 7 (EMA Smoothing)**<br>**Algoritma 9 (Myers State Diffing)** |
| **Tab 3: Analitik** | **Halaman 3** | • Navigasi & Selector Ruangan (default: A-101)<br>• LoRaWAN Node Status & Signal Badge<br>• Kartu Suhu Udara (23.2°C) & Kelembapan RH (51%)<br>• Persepsi Termal Humidex (Suhu Efektif 23.0°C)<br>• Gauge Meter AQI US (22 Baik) + Bar ISPU Spektrum (PM2.5, CO2, TVOC)<br>• Grafik Multi-Line Time-Series Tren Fluktuasi (08.00–16.00)<br>• Tombol Jadikan Favorit & Laporkan Kendala | **Algoritma 1 (US EPA AQI Interpolation)**<br>**Algoritma 2 (Rothfusz Heat Index)**<br>**Algoritma 6 (LTTB Downsampling)** |
| **Tab 4: Audit Energi** | **Halaman 4** | • Skor Kampus 84% (B+) & Potensi Hemat (~14.8 kWh / Rp 21.500/jam)<br>• Tombol Master: "Matikan AC Ruangan Kosong Sekaligus"<br>• Filter Kategori Anomali & Audit Sinkron<br>• Rule Audit Forward-Chaining banner<br>• Kartu Anomali: B-302 (Prioritas Tinggi), A-203, C-401, D-105, Koridor Sayap Barat (Lux Tinggi)<br>• Tombol Aksi Jarak Jauh per ruangan | **Algoritma 8 (Forward-Chaining Rule Inference)** |

---

## ⚡ Implementasi 10 Algoritma Sisi Mobile (On-Device Compute)

Seluruh komputasi berjalan secara lokal di perangkat klien tanpa ketergantungan backend tambahan:

1. **US EPA AQI Segmented Linear Interpolation**  
   $$I_p = \frac{I_{Hi} - I_{Lo}}{BP_{Hi} - BP_{Lo}} (C_p - BP_{Lo}) + I_{Lo}, \quad AQI = \max(I_{p, PM2.5}, I_{p, CO2})$$
2. **Rothfusz Regression Equation (Heat Index / Humidex)**  
   $$HI = c_1 + c_2 T + c_3 RH + c_4 T \cdot RH + c_5 T^2 + c_6 RH^2 + c_7 T^2 RH + c_8 T \cdot RH^2 + c_9 T^2 RH^2$$
3. **Simple Additive Weighting (SAW) Multi-Criteria Recommendation**  
   $$r_{ij} = \frac{x_{ij}}{\max x_{ij}} \text{ (benefit)}, \quad r_{ij} = \frac{\min x_{ij}}{x_{ij}} \text{ (cost)}, \quad V_i = \sum_{j=1}^m w_j r_{ij}$$
4. **Haversine Formula (Jarak Geospasial GPS ke Ruangan)**  
   $$a = \sin^2\left(\frac{\Delta lat}{2}\right) + \cos(lat_1)\cos(lat_2)\sin^2\left(\frac{\Delta lon}{2}\right), \quad d = 2R \cdot \text{atan2}(\sqrt{a}, \sqrt{1-a})$$
5. **Levenshtein Distance Algorithm (Fuzzy Search & Autocomplete)**  
   Pemrograman dinamis matriks $(m+1) \times (n+1)$ dengan toleransi edit distance $\le 2$.
6. **Largest-Triangle-Three-Buckets (LTTB) Downsampling**  
   Downsampling time-series time data dari 48 titik menjadi 10 representasi puncak visual tanpa membebani GPU/RAM smartphone.
7. **Exponential Moving Average (EMA) PIR Signal Smoothing**  
   $$S_t = \alpha Y_t + (1 - \alpha) S_{t-1}$$
   Menstabilkan fluktuasi sinyal PIR sesaat agar antarmuka tidak berkedip (*no flickering*).
8. **Rule-Based Inference Engine (Forward Chaining) Facility Audit**  
   $$\text{Anomali} = 1 \iff (O = 0) \land (T < 23^\circ\text{C}) \land (\Delta t \ge \tau)$$
9. **Myers Difference / State Diffing Cache Lokal**  
   Selective re-rendering check untuk menghemat clock CPU dan konsumsi daya baterai.
10. **Debounce & Throttle Rate-Limiting Alert Engine**  
    Pemicuan peringatan dini kualitas udara kritis dengan cooldown rate limit 15 menit.

---

## 🎛️ Panduan Demo di Depan Dosen (IoT Demo Controller)

Aplikasi dilengkapi tombol melayang **"⚙️ IoT Demo Control"** di pojok kanan bawah. Buka panel ini saat demonstrasi:

1. **🚨 Uji Kritis CO2 > 1100**:
   - Menghasilkan lonjakan CO2 di R-204 hingga 1.150 ppm.
   - **Hasil:** Seketika Algoritma 10 terpicu, memunculkan alert banner merah di Beranda dan indikator lonceng berkedip.
2. **❄️ Anomali AC Kosong**:
   - Menurunkan suhu B-302 ke 19.5°C dengan AC aktif tanpa penghuni.
   - **Hasil:** Algoritma 8 mendeteksi anomali pada Tab Audit Energi dengan label "PRIORITAS TINGGI".
3. **⚡ Injeksi Noise PIR**:
   - Mensimulasikan noise gerakan acak sesaat.
   - **Hasil:** Algoritma 7 (EMA) mempertahankan kestabilan status warna hijau/merah.
4. **🚶 Simulasi GPS Bergerak**:
   - Menggeser koordinat GPS mahasiswa.
   - **Hasil:** Algoritma 4 (Haversine) dan Algoritma 3 (SAW) memperbarui jarak meter dan urutan peringkat rekomendasi secara instan.
5. **🎚️ Manual Override Sliders**:
   - Anda dapat memilih ruangan manapun dan menggeser slider Suhu (DHT22), CO2 (MQ-135), Okupansi PIR, atau AC ON/OFF secara bebas.

---

## 🚀 Menjalankan Project

### 1. Development Mode (Browser)
```bash
npm run dev -- --host 0.0.0.0
```
Akses aplikasi di komputer melalui `http://localhost:3000`. Untuk membuka dari perangkat lain di Wi-Fi yang sama, gunakan alamat IP komputer, misalnya `http://192.168.1.20:3000`.

### 2. Automated Tests
```bash
npm test
```
Tes Node.js memeriksa sepuluh algoritma on-device dan pengayaan data sensor simulator. Tes akan berstatus gagal jika hasil tidak sesuai.

### 3. Build & Sync ke Android Studio (Capacitor)
```bash
# Build web bundle
npm run build

# Sinkronisasi ke proyek native Android
npm run cap:sync

# Buka Android Studio untuk Build APK
npm run cap:open
```

File APK siap di-generate melalui menu **Build > Build Bundle(s) / APK(s) > Build APK(s)** di Android Studio.

## 🧪 Uji Fitur Manual Tanpa Ponsel

Jalankan server development, lalu buka `http://localhost:3000` di Chrome, Firefox, atau Edge. Tampilan dirancang seperti ponsel; di Chrome tekan **F12 > Toggle device toolbar** untuk memilih ukuran layar ponsel.

1. **Beranda:** coba pencarian ruangan dan tombol notifikasi. Klik kartu ruangan untuk membuka analitiknya.
2. **Ruangan:** ganti filter gedung/status dan beralih antara **Daftar** dan **Denah**.
3. **Analitik:** pilih ruangan, ubah rentang waktu, tandai favorit, dan buka formulir laporan.
4. **Audit Energi:** coba filter anomali serta tombol untuk mematikan AC/lampu. Perubahan berlaku pada simulasi lokal.
5. **Simulator IoT:** klik **IoT Demo Control** di kanan bawah. Uji **Uji Kritis CO2 > 1100**, **Anomali AC Kosong**, **Injeksi Noise PIR**, dan **Simulasi GPS Bergerak**. Gunakan tombol reset untuk mengembalikan nilai awal.

Ruangan dan favorit disimpan di `localStorage`. Untuk mengulang dari data awal, buka **Developer Tools > Application/Storage > Local Storage**, hapus data situs `localhost:3000`, lalu muat ulang halaman.

## 🔌 Integrasi Data (REST API Nyata & Cloud Telemetry)

Aplikasi telah mengintegrasikan komunikasi HTTP/REST API nyata yang berjalan secara hybrid:

1. **Live Open-Meteo Weather & Air Quality REST API (HTTP GET):**
   - **Endpoint Cuaca:** `https://api.open-meteo.com/v1/forecast?latitude=-7.9612&longitude=112.6175&current=temperature_2m,relative_humidity_2m`
   - **Endpoint Kualitas Udara:** `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=-7.9612&longitude=112.6175&current=pm2_5,us_aqi,carbon_monoxide`
   - Berfungsi sebagai **Kalibrasi Iklim Luar Kampus FT UM** aktual (Suhu luar, kelembapan, $\text{PM}_{2.5}$, US AQI, CO) yang ditampilkan pada kartu Beranda dan Analitik, serta digunakan sebagai acuan baseline kondisi ambien telemetri mikro ruangan.

2. **Cloud REST Telemetry Endpoint & Graceful Fallback (`fetchRoomsFromApi`):**
   - Mendukung variabel lingkungan `VITE_IOT_API_URL` (misal: Firebase Realtime Database REST API `https://<project-id>.firebaseio.com/rooms.json` atau REST server kampus).
   - Dilengkapi mekanisme *graceful fallback* otomatis ke data simulator lokal ber-state jika endpoint eksternal belum disetel atau perangkat sedang offline.

3. **Sinkronisasi Perintah Aktuator Jarak Jauh (`syncActuatorToApi`):**
   - Mengirim perintah HTTP `PATCH` / `PUT` secara real-time saat pengguna menekan tombol *"Matikan AC Jarak Jauh"*, *"Padamkan Lampu Koridor"*, maupun saat melakukan reservasi ruangan.

4. **Monitoring & Trigger Sinkronisasi di UI:**
   - Tersedia status bar di bagian atas aplikasi: `API Connected • Open-Meteo & IoT Telemetry Sync` beserta jam sinkronisasi terakhir dan tombol interaktif **"Sync API Sekarang"**.
   - Pada panel **IoT Demo Control**, tersedia tombol *"🌐 Kalibrasi Sensor dari Live Open-Meteo API"* untuk menyinkronkan seluruh parameter ruangan dengan cuaca Kota Malang secara instan.


