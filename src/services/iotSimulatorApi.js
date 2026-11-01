import {
  calculateEPA_AQI,
  calculateHeatIndex,
  calculateHaversineDistance,
  evaluateEnergyAnomaly,
} from "../utils/mobileCompute.js";

// ============================================================================
// KOORDINAT GEOSPASIAL GPS MAHASISWA & KAMPUS UTAMA UNIVERSITAS NEGERI MALANG (UM)
// Lokasi: Jl. Semarang No. 5, Sumbersari, Kec. Lowokwaru, Kota Malang, Jawa Timur 65145
// ============================================================================
export const CURRENT_USER_LOCATION = {
  lat: -7.96120,
  lon: 112.61750,
  name: "Gedung FT & Sains UM (Posisi Anda)",
};

// ============================================================================
// DAFTAR MASTER GEDUNG KAMPUS UNIVERSITAS NEGERI MALANG (UM)
// Digunakan untuk dropdown "+ Tambah Ruangan" dan navigasi geospasial
// ============================================================================
export const UM_CAMPUS_BUILDINGS = [
  {
    name: "Gedung B12 FT (DTEI)",
    code: "B12",
    fullName: "Gedung B12 FT UM (Departemen Teknik Elektro & Informatika)",
    lat: -7.96135,
    lon: 112.61770,
    floors: [1, 2, 3, 4],
    description: "Pusat perkuliahan & laboratorium S1 Teknik Informatika, PTI, dan Teknik Elektro UM.",
  },
  {
    name: "Gedung B11 FT (Dekanat)",
    code: "B11",
    fullName: "Gedung B11 FT UM (Dekanat & Aula Utama)",
    lat: -7.96150,
    lon: 112.61790,
    floors: [1, 2, 3],
    description: "Kantor Dekanat Fakultas Teknik UM, ruang seminar, dan auditorium utama.",
  },
  {
    name: "GKB A19 UM",
    code: "A19",
    fullName: "Gedung Kuliah Bersama (GKB) A19 Universitas Negeri Malang",
    lat: -7.96220,
    lon: 112.61850,
    floors: [1, 2, 3, 4, 5, 6, 7],
    description: "Gedung Kuliah Bersama modern 7 lantai dengan smart classroom dan fasilitas interaktif.",
  },
  {
    name: "GKB A20 UM",
    code: "A20",
    fullName: "Gedung Kuliah Bersama (GKB) A20 Universitas Negeri Malang",
    lat: -7.96250,
    lon: 112.61880,
    floors: [1, 2, 3, 4, 5, 6, 7],
    description: "Pusat kuliah bersama berkapasitas besar dan ruang seminar internasional UM.",
  },
  {
    name: "Gedung B3 FT (Workshop)",
    code: "B3",
    fullName: "Gedung B3 FT UM (Workshop & Lab Mesin-Sipil)",
    lat: -7.96090,
    lon: 112.61710,
    floors: [1, 2, 3],
    description: "Workshop robotika, sistem otomasi industri, dan laboratorium terapan FT UM.",
  },
  {
    name: "Perpustakaan Pusat UM",
    code: "PERPUS",
    fullName: "Gedung Perpustakaan Pusat Universitas Negeri Malang",
    lat: -7.96310,
    lon: 112.61690,
    floors: [1, 2, 3],
    description: "Pusat literatur, ruang diskusi kolaboratif, dan sarana belajar mandiri mahasiswa UM.",
  },
  {
    name: "Gedung A1 Rektorat UM",
    code: "A1",
    fullName: "Gedung A1 Graha Rektorat Universitas Negeri Malang",
    lat: -7.96380,
    lon: 112.61720,
    floors: [1, 2, 3, 4],
    description: "Pusat pimpinan universitas, ruang rapat senat, dan administrasi utama UM.",
  },
];

// ============================================================================
// DATASET MASTER RUANGAN GEDUNG ASLI UNIVERSITAS NEGERI MALANG (UM)
// ============================================================================
export const RAW_CAMPUS_ROOMS = [
  // 1. Gedung B12 FT UM (DTEI)
  {
    id: "B12-101",
    code: "B12-101",
    name: "Ruang Teori DTEI B12-101",
    building: "Gedung B12 FT (DTEI) • Lt. 1",
    buildingCode: "B12",
    floor: 1,
    zone: "Zona Timur",
    category: "Ruang Teori",
    nodeId: "IoT-Node-B12-101",
    protocol: "LoRaWAN Class A",
    isOccupied: false,
    occupancyCount: 0,
    capacity: 40,
    scheduleInfo: "Terjadwal kosong hingga 14.30 WIB (Siap Pakai)",
    temp: 23.2,
    humidity: 51,
    pm25: 8.2,
    co2: 435,
    tvoc: 0.08,
    lux: 320,
    acActive: false,
    lightsActive: false,
    emptyDurationMins: 45,
    lat: -7.96135,
    lon: 112.61770,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "Proyektor Smart, 40 Kursi Kuliah, AC Split 2 PK, Wi-Fi 6 Eduroam FT UM",
    image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "B12-204",
    code: "B12-204",
    name: "Lab Jaringan & Mobile Computing B12",
    building: "Gedung B12 FT (DTEI) • Lt. 2",
    buildingCode: "B12",
    floor: 2,
    zone: "Zona Tengah",
    category: "Lab Komputer",
    nodeId: "IoT-Node-B12-204",
    protocol: "Wi-Fi MQTT",
    isOccupied: true,
    occupancyCount: 48,
    capacity: 50,
    course: "Mobile & Wireless Computing (Offering A)",
    lecturer: "Tim Dosen DTEI FT UM",
    scheduleInfo: "Peringatan Kualitas Udara CO2 Tinggi (>1.100 ppm) - Ventilasi Aktif",
    subSchedule: "Praktikum Sistem Nirkabel & Mikrokontroler ESP32",
    temp: 26.8,
    humidity: 71,
    pm25: 32.4,
    co2: 1150,
    tvoc: 0.45,
    lux: 410,
    acActive: true,
    lightsActive: true,
    emptyDurationMins: 0,
    lat: -7.96140,
    lon: 112.61775,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "45 Workstation Core i7, Access Point Cisco WiFi 6, Kit Sensor IoT ESP32, AC Central",
    image: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "B12-302",
    code: "B12-302",
    name: "Lab Pemrograman & RPL B12-302",
    building: "Gedung B12 FT (DTEI) • Lt. 3",
    buildingCode: "B12",
    floor: 3,
    zone: "Zona Barat",
    category: "Lab Komputer",
    nodeId: "IoT-Node-B12-302",
    protocol: "LoRaWAN Class A",
    isOccupied: false,
    occupancyCount: 0,
    capacity: 40,
    scheduleInfo: "AC 2 PK Aktif selama 2 jam 45 mnt tanpa orang! Estimasi pemborosan: 4.2 kWh (~Rp 6.100).",
    temp: 19.5,
    humidity: 46,
    pm25: 6.0,
    co2: 405,
    tvoc: 0.05,
    lux: 250,
    acActive: true,
    lightsActive: false,
    emptyDurationMins: 165,
    estimatedWasteKwh: 4.2,
    estimatedCostRp: 6100,
    lat: -7.96145,
    lon: 112.61780,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "AC 2 PK, Kamera Termal & PIR Terkalibrasi, 40 PC Core i7, Smart TV 65 inci",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80",
  },

  // 2. Gedung B11 FT UM (Dekanat & Aula)
  {
    id: "B11-201",
    code: "B11-201",
    name: "Ruang Seminar Utama FT B11-201",
    building: "Gedung B11 FT (Dekanat) • Lt. 2",
    buildingCode: "B11",
    floor: 2,
    zone: "Zona Tengah",
    category: "Ruang Seminar",
    nodeId: "IoT-Node-B11-201",
    protocol: "LoRaWAN Class A",
    isOccupied: false,
    occupancyCount: 0,
    capacity: 60,
    scheduleInfo: "KOSONG / Siap Pakai untuk Ujian Skripsi & Seminar",
    temp: 23.4,
    humidity: 52,
    pm25: 4.3,
    co2: 420,
    tvoc: 0.05,
    lux: 310,
    acActive: false,
    lightsActive: false,
    emptyDurationMins: 60,
    lat: -7.96150,
    lon: 112.61790,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "Sound System Stereo, 2x Wireless Mic, Proyektor Laser HD, AC Inverter 3 PK",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "B11-301",
    code: "B11-301",
    name: "Auditorium Dekanat FT B11-301",
    building: "Gedung B11 FT (Dekanat) • Lt. 3",
    buildingCode: "B11",
    floor: 3,
    zone: "Zona Utama",
    category: "Ruang Seminar",
    nodeId: "IoT-Node-B11-301",
    protocol: "LoRaWAN Class A",
    isOccupied: true,
    occupancyCount: 95,
    capacity: 120,
    course: "Kuliah Tamu & Kolokium Nasional Teknik",
    scheduleInfo: "Kapasitas Maksimal: 120 Kursi Bertingkat • AC Eco Mode",
    subSchedule: "Agenda Seminar Teknologi Hijau & Energi Baru Terbarukan",
    temp: 24.5,
    humidity: 64,
    pm25: 18.2,
    co2: 780,
    tvoc: 0.16,
    lux: 420,
    acActive: true,
    lightsActive: true,
    emptyDurationMins: 0,
    lat: -7.96155,
    lon: 112.61795,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "120 Kursi Bertingkat, Panggung, Line Array Speaker, AC Chiller Sentral",
    image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80",
  },

  // 3. Gedung Kuliah Bersama (GKB) A19 & A20 UM
  {
    id: "A19-302",
    code: "A19-302",
    name: "Smart Classroom GKB A19-302",
    building: "GKB A19 UM • Lt. 3",
    buildingCode: "A19",
    floor: 3,
    zone: "Zona Timur",
    category: "Ruang Teori",
    nodeId: "IoT-Node-A19-302",
    protocol: "Wi-Fi MQTT",
    isOccupied: true,
    occupancyCount: 38,
    capacity: 50,
    course: "Pemrograman Web Lanjut & Cloud Computing",
    scheduleInfo: "Hingga pukul 11.40 WIB",
    temp: 25.4,
    humidity: 66,
    pm25: 15.1,
    co2: 670,
    tvoc: 0.13,
    lux: 390,
    acActive: true,
    lightsActive: true,
    emptyDurationMins: 0,
    lat: -7.96220,
    lon: 112.61850,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "Interactive Smart Board 86 Inci, AC Cassette 4-Way, Audio Mic Wireless",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "A20-204",
    code: "A20-204",
    name: "Ruang Kuliah Besar GKB A20-204",
    building: "GKB A20 UM • Lt. 2",
    buildingCode: "A20",
    floor: 2,
    zone: "Zona Tengah",
    category: "Ruang Teori",
    nodeId: "IoT-Node-A20-204",
    protocol: "LoRaWAN Class A",
    isOccupied: false,
    occupancyCount: 0,
    capacity: 60,
    scheduleInfo: "KOSONG / Siap Pakai Kuliah Tatap Muka",
    temp: 23.0,
    humidity: 50,
    pm25: 5.4,
    co2: 425,
    tvoc: 0.06,
    lux: 320,
    acActive: false,
    lightsActive: false,
    emptyDurationMins: 50,
    lat: -7.96250,
    lon: 112.61880,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "60 Meja Kuliah Single, Smart Podium, Double Screen Projector, AC Inverter",
    image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "A20-401",
    code: "A20-401",
    name: "Ruang Seminar Nasional GKB A20-401",
    building: "GKB A20 UM • Lt. 4",
    buildingCode: "A20",
    floor: 4,
    zone: "Zona Senat",
    category: "Ruang Seminar",
    nodeId: "IoT-Node-A20-401",
    protocol: "BACnet / IoT Gateway",
    isOccupied: false,
    occupancyCount: 0,
    capacity: 75,
    scheduleInfo: "AC Sentral zona 4 aktif tanpa jadwal pemakaian terdaftar di SI-Kampus UM. Pemborosan: 3.4 kWh.",
    temp: 21.0,
    humidity: 48,
    pm25: 5.0,
    co2: 410,
    tvoc: 0.05,
    lux: 260,
    acActive: true,
    lightsActive: false,
    emptyDurationMins: 90,
    estimatedWasteKwh: 3.4,
    estimatedCostRp: 4900,
    lat: -7.96260,
    lon: 112.61885,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "AC Sentral VRV, Delegate System Mic, Soundproof Wall, Motorized Screen",
    image: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=600&q=80",
  },

  // 4. Gedung B3 FT UM (Workshop & Laboratorium)
  {
    id: "B3-101",
    code: "B3-101",
    name: "Workshop Robotika & Otomasi Industri B3",
    building: "Gedung B3 FT (Workshop) • Lt. 1",
    buildingCode: "B3",
    floor: 1,
    zone: "Zona Barat",
    category: "Lab Komputer",
    nodeId: "IoT-Node-B3-101",
    protocol: "Wi-Fi MQTT",
    isOccupied: true,
    occupancyCount: 20,
    capacity: 35,
    course: "Praktikum PLC & Sistem Otomasi Pabrik",
    scheduleInfo: "Sirkulasi udara aktif otomatis (Exhaust Fan ON)",
    temp: 26.2,
    humidity: 60,
    pm25: 22.0,
    co2: 760,
    tvoc: 0.20,
    lux: 440,
    acActive: true,
    lightsActive: true,
    emptyDurationMins: 0,
    lat: -7.96090,
    lon: 112.61710,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "Kit PLC Schneider & Siemens, Lengan Robot 6-DOF, Exhaust Fan Industrial, AC Split",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "B3-203",
    code: "B3-203",
    name: "Lab Bahasa Teknik & Multimedia B3",
    building: "Gedung B3 FT (Workshop) • Lt. 2",
    buildingCode: "B3",
    floor: 2,
    zone: "Zona Multimedia",
    category: "Lab Komputer",
    nodeId: "IoT-Node-B3-203",
    protocol: "Wi-Fi MQTT",
    isOccupied: false,
    occupancyCount: 0,
    capacity: 32,
    scheduleInfo: "Kapasitas 32 PC Multimedia & Headset Studio (Tersedia Bebas)",
    temp: 22.8,
    humidity: 49,
    pm25: 4.2,
    co2: 415,
    tvoc: 0.06,
    lux: 310,
    acActive: false,
    lightsActive: false,
    emptyDurationMins: 40,
    lat: -7.96095,
    lon: 112.61715,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "32 Workstation PC, Studio Audio Isolation, AC Split 2.5 PK",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80",
  },

  // 5. Perpustakaan Pusat UM & Rektorat A1
  {
    id: "PERPUS-104",
    code: "PERPUS-104",
    name: "Ruang Diskusi Kolaboratif Perpustakaan UM",
    building: "Perpustakaan Pusat UM • Lt. 1",
    buildingCode: "PERPUS",
    floor: 1,
    zone: "Zona Diskusi",
    category: "Ruang Diskusi",
    nodeId: "IoT-Node-PERPUS-104",
    protocol: "LoRaWAN Class A",
    isOccupied: false,
    occupancyCount: 0,
    capacity: 10,
    scheduleInfo: "KOSONG / Tersedia untuk Diskusi Tugas Akhir & Kelompok",
    temp: 23.8,
    humidity: 54,
    pm25: 4.8,
    co2: 430,
    tvoc: 0.07,
    lux: 310,
    acActive: false,
    lightsActive: false,
    emptyDurationMins: 55,
    lat: -7.96310,
    lon: 112.61690,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "Meja Diskusi Ergonomis, Whiteboard Magnetik, Smart TV 55 inci, Stopkontak Portabel",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "A1-401",
    code: "A1-401",
    name: "Ruang Rapat Senat Rektorat A1",
    building: "Gedung A1 Rektorat UM • Lt. 4",
    buildingCode: "A1",
    floor: 4,
    zone: "Zona Senat",
    category: "Ruang Seminar",
    nodeId: "IoT-Node-A1-401",
    protocol: "BACnet / IoT Gateway",
    isOccupied: false,
    occupancyCount: 0,
    capacity: 45,
    scheduleInfo: "AC Split Rektorat aktif 20°C tanpa agenda rapat terjadwal. Pemborosan: 2.3 kWh.",
    temp: 20.0,
    humidity: 49,
    pm25: 5.8,
    co2: 420,
    tvoc: 0.06,
    lux: 280,
    acActive: true,
    lightsActive: false,
    emptyDurationMins: 45,
    estimatedWasteKwh: 2.3,
    estimatedCostRp: 3300,
    lat: -7.96380,
    lon: 112.61720,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "Meja Oval Rapat Eksekutif, Sound Conference Bosch, Video Conference Zoom Rooms",
    image: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=600&q=80",
  },

  // 6. Koridor Fasilitas Kampus (Anomali Lampu Siang Hari)
  {
    id: "K-WEST",
    code: "KOR-B12",
    name: "Koridor Sayap Barat Gedung B12 FT",
    building: "Gedung B12 FT (DTEI) • Lt. 1",
    buildingCode: "B12",
    floor: 1,
    zone: "Koridor Barat",
    category: "Koridor",
    nodeId: "IoT-Node-KOR-B12",
    protocol: "Zigbee / BLE Mesh",
    isOccupied: false,
    occupancyCount: 0,
    capacity: 0,
    scheduleInfo: "Lampu Nyala Siang Hari: Pencahayaan alami koridor memadai (>500 Lux), pemborosan 1.1 kWh teridentifikasi.",
    temp: 26.1,
    humidity: 58,
    pm25: 9.5,
    co2: 440,
    tvoc: 0.08,
    lux: 620,
    lampCount: 8,
    acActive: false,
    lightsActive: true,
    emptyDurationMins: 180,
    estimatedWasteKwh: 1.1,
    estimatedCostRp: 1600,
    lat: -7.96130,
    lon: 112.61765,
    targetTempRange: "24° – 28°C",
    targetHumidityRange: "40% – 70%",
    facilities: "Sensor LDR Lux Digital, 8 Lampu Tabung LED 36W, Gateway Zigbee DTEI FT UM",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80",
  },

  // 7. Entri Kompatibilitas untuk Bookmark / Pengujian Legacy
  {
    id: "A-101",
    code: "A-101",
    name: "Ruang Teori A-101 (GKB A19)",
    building: "GKB A19 UM • Lt. 1",
    buildingCode: "A19",
    floor: 1,
    zone: "Zona Timur",
    category: "Ruang Teori",
    nodeId: "IoT-Node-A101",
    protocol: "LoRaWAN Class A",
    isOccupied: false,
    occupancyCount: 0,
    capacity: 40,
    scheduleInfo: "Terjadwal kosong hingga 14.30 WIB",
    temp: 23.2,
    humidity: 51,
    pm25: 8.2,
    co2: 435,
    tvoc: 0.08,
    lux: 320,
    acActive: false,
    lightsActive: false,
    emptyDurationMins: 45,
    lat: -7.96135,
    lon: 112.61770,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "Proyektor Smart, 40 Kursi Kuliah, AC Split 2 PK, Wi-Fi 6 Eduroam",
  },
  {
    id: "B-201",
    code: "B-201",
    name: "Ruang Seminar B-201 (B11 FT)",
    building: "Gedung B11 FT (Dekanat) • Lt. 2",
    buildingCode: "B11",
    floor: 2,
    zone: "Zona Tengah",
    category: "Ruang Seminar",
    nodeId: "IoT-Node-B201",
    protocol: "LoRaWAN Class A",
    isOccupied: false,
    occupancyCount: 0,
    capacity: 60,
    scheduleInfo: "KOSONG / Siap Pakai",
    temp: 23.4,
    humidity: 52,
    pm25: 4.3,
    co2: 420,
    tvoc: 0.05,
    lux: 310,
    acActive: false,
    lightsActive: false,
    emptyDurationMins: 60,
    lat: -7.96150,
    lon: 112.61790,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "Sound System Stereo, 2x Wireless Mic, Proyektor Laser HD, AC Inverter",
  },
  {
    id: "B-302",
    code: "B-302",
    name: "Ruang Seminar B-302 (B12 FT)",
    building: "Gedung B12 FT (DTEI) • Lt. 3",
    buildingCode: "B12",
    floor: 3,
    zone: "Zona Barat",
    category: "Ruang Seminar",
    nodeId: "IoT-Node-B302",
    protocol: "LoRaWAN Class A",
    isOccupied: false,
    occupancyCount: 0,
    capacity: 80,
    scheduleInfo: "AC 2 PK Aktif selama 2 jam 45 mnt tanpa orang! Estimasi rugi: 4.2 kWh (~Rp 6.100).",
    temp: 19.5,
    humidity: 46,
    pm25: 6.0,
    co2: 405,
    tvoc: 0.05,
    lux: 250,
    acActive: true,
    lightsActive: false,
    emptyDurationMins: 165,
    estimatedWasteKwh: 4.2,
    estimatedCostRp: 6100,
    lat: -7.96145,
    lon: 112.61780,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "AC 2 PK, Kamera Termal & PIR Terkalibrasi",
  },
  {
    id: "R-204",
    code: "R-204",
    name: "Ruang Kuliah R-204 (B12 FT)",
    building: "Gedung B12 FT (DTEI) • Lt. 2",
    buildingCode: "B12",
    floor: 2,
    zone: "Zona Tengah",
    category: "Ruang Teori",
    nodeId: "IoT-Node-R204",
    protocol: "Wi-Fi MQTT",
    isOccupied: true,
    occupancyCount: 52,
    capacity: 55,
    scheduleInfo: "Peringatan Kualitas Udara CO2 Tinggi (>1.100 ppm)",
    temp: 26.8,
    humidity: 71,
    pm25: 32.4,
    co2: 1150,
    tvoc: 0.45,
    lux: 410,
    acActive: true,
    lightsActive: true,
    emptyDurationMins: 0,
    lat: -7.96140,
    lon: 112.61775,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "Exhaust Fan Otomatis, AC Central, Sensor MQ-135",
  },
];

// Historis Time-Series 48 Titik untuk Analitik LTTB
export const INITIAL_ANALYTICS_SERIES = [
  { time: "08:00", temp: 22.1, aqi: 15, co2: 390, pm25: 4.1 },
  { time: "08:15", temp: 22.3, aqi: 16, co2: 398, pm25: 4.5 },
  { time: "08:30", temp: 22.6, aqi: 18, co2: 410, pm25: 5.2 },
  { time: "08:45", temp: 22.9, aqi: 19, co2: 420, pm25: 5.8 },
  { time: "09:00", temp: 23.1, aqi: 20, co2: 428, pm25: 6.5 },
  { time: "09:15", temp: 23.2, aqi: 21, co2: 432, pm25: 7.1 },
  { time: "09:30", temp: 23.3, aqi: 22, co2: 435, pm25: 7.8 },
  { time: "09:45", temp: 23.4, aqi: 22, co2: 438, pm25: 8.0 },
  { time: "10:00", temp: 23.5, aqi: 23, co2: 440, pm25: 8.2 },
  { time: "10:15", temp: 23.6, aqi: 24, co2: 445, pm25: 8.6 },
  { time: "10:30", temp: 23.8, aqi: 26, co2: 455, pm25: 9.3 },
  { time: "10:45", temp: 23.9, aqi: 28, co2: 470, pm25: 10.1 },
  { time: "11:00", temp: 24.1, aqi: 31, co2: 490, pm25: 11.2 },
  { time: "11:15", temp: 24.2, aqi: 33, co2: 510, pm25: 12.0 },
  { time: "11:30", temp: 24.3, aqi: 34, co2: 525, pm25: 12.8 },
  { time: "11:45", temp: 24.4, aqi: 35, co2: 540, pm25: 13.2 },
  { time: "12:00", temp: 24.5, aqi: 37, co2: 560, pm25: 14.1 },
  { time: "12:15", temp: 24.5, aqi: 36, co2: 550, pm25: 13.9 },
  { time: "12:30", temp: 24.5, aqi: 35, co2: 535, pm25: 13.4 },
  { time: "12:45", temp: 24.4, aqi: 32, co2: 510, pm25: 12.5 },
  { time: "13:00", temp: 24.2, aqi: 29, co2: 485, pm25: 11.4 },
  { time: "13:15", temp: 24.0, aqi: 27, co2: 470, pm25: 10.5 },
  { time: "13:30", temp: 23.8, aqi: 25, co2: 460, pm25: 9.8 },
  { time: "13:45", temp: 23.6, aqi: 24, co2: 450, pm25: 9.2 },
  { time: "14:00", temp: 23.5, aqi: 23, co2: 442, pm25: 8.8 },
  { time: "14:15", temp: 23.4, aqi: 22, co2: 438, pm25: 8.5 },
  { time: "14:30", temp: 23.3, aqi: 22, co2: 435, pm25: 8.2 },
  { time: "14:45", temp: 23.3, aqi: 22, co2: 434, pm25: 8.1 },
  { time: "15:00", temp: 23.2, aqi: 21, co2: 430, pm25: 7.9 },
  { time: "15:15", temp: 23.1, aqi: 20, co2: 425, pm25: 7.4 },
  { time: "15:30", temp: 23.0, aqi: 20, co2: 420, pm25: 7.1 },
  { time: "15:45", temp: 22.9, aqi: 19, co2: 415, pm25: 6.8 },
  { time: "16:00", temp: 22.8, aqi: 18, co2: 410, pm25: 6.5 },
];

/**
 * Memperkaya objek ruangan mentah dengan kalkulasi Mobile Compute
 */
export function enrichRoomsWithMobileCompute(rawRooms, userLocation = CURRENT_USER_LOCATION) {
  return rawRooms.map((room) => {
    const aqiResult = calculateEPA_AQI(room.pm25, room.co2);
    const heatIndexResult = calculateHeatIndex(room.temp, room.humidity);
    const distanceMeters = calculateHaversineDistance(
      userLocation.lat,
      userLocation.lon,
      room.lat,
      room.lon
    );
    const auditResult = evaluateEnergyAnomaly(room);

    return {
      ...room,
      aqi: aqiResult.aqi,
      aqiCategory: aqiResult.category,
      aqiColor: aqiResult.color,
      heatIndex: heatIndexResult.heatIndexC,
      heatIndexC: heatIndexResult.heatIndexC,
      comfortLabel: heatIndexResult.comfortLabel,
      distanceMeters,
      isAnomaly: auditResult.isAnomaly,
      anomalyType: auditResult.anomalyType,
      wastedKwh: auditResult.wastedKwh || room.estimatedWasteKwh || 0,
      wastedIdr: auditResult.wastedIdr || room.estimatedCostRp || 0,
    };
  });
}

// ============================================================================
// INTEGRASI REAL REST API: OPEN-METEO WEATHER & AIR QUALITY API (FT UM MALANG)
// Koordinat Kampus FT UM: latitude=-7.9612, longitude=112.6175
// ============================================================================
const UM_LAT = -7.9612;
const UM_LON = 112.6175;

export const OPEN_METEO_WEATHER_URL = `https://api.open-meteo.com/v1/forecast?latitude=${UM_LAT}&longitude=${UM_LON}&current=temperature_2m,relative_humidity_2m`;
export const OPEN_METEO_AIR_QUALITY_URL = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${UM_LAT}&longitude=${UM_LON}&current=pm2_5,us_aqi,carbon_monoxide`;

export const DEFAULT_OUTDOOR_CLIMATE = {
  temp: 28.4,
  humidity: 65,
  pm25: 12.0,
  usAqi: 52,
  carbonMonoxide: 380,
  source: "Open-Meteo Cache (Baseline FT UM)",
  lastSync: "Terkalibrasi",
  isLive: false,
};

/**
 * 1. Real HTTP GET Request ke Open-Meteo Weather & Air Quality API
 * Mengambil kondisi iklim dan kualitas udara aktual di koordinat Kampus FT UM Malang
 */
export async function fetchCampusOutdoorClimate(timeoutMs = 6000) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const [weatherRes, airRes] = await Promise.all([
      fetch(OPEN_METEO_WEATHER_URL, { signal: controller?.signal }),
      fetch(OPEN_METEO_AIR_QUALITY_URL, { signal: controller?.signal }),
    ]);

    if (timeoutId) clearTimeout(timeoutId);

    if (!weatherRes.ok || !airRes.ok) {
      throw new Error(`HTTP Response Failed (Weather: ${weatherRes.status}, Air: ${airRes.status})`);
    }

    const weatherData = await weatherRes.json();
    const airData = await airRes.json();

    const outdoorTemp =
      typeof weatherData?.current?.temperature_2m === "number"
        ? weatherData.current.temperature_2m
        : DEFAULT_OUTDOOR_CLIMATE.temp;

    const outdoorHumidity =
      typeof weatherData?.current?.relative_humidity_2m === "number"
        ? weatherData.current.relative_humidity_2m
        : DEFAULT_OUTDOOR_CLIMATE.humidity;

    const outdoorPm25 =
      typeof airData?.current?.pm2_5 === "number"
        ? airData.current.pm2_5
        : DEFAULT_OUTDOOR_CLIMATE.pm25;

    const outdoorAqi =
      typeof airData?.current?.us_aqi === "number"
        ? airData.current.us_aqi
        : DEFAULT_OUTDOOR_CLIMATE.usAqi;

    const outdoorCo =
      typeof airData?.current?.carbon_monoxide === "number"
        ? Math.round(airData.current.carbon_monoxide)
        : DEFAULT_OUTDOOR_CLIMATE.carbonMonoxide;

    const now = new Date();
    const lastSyncTime = now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    return {
      temp: outdoorTemp,
      humidity: outdoorHumidity,
      pm25: outdoorPm25,
      usAqi: outdoorAqi,
      carbonMonoxide: outdoorCo,
      source: "Open-Meteo REST API (Live Kampus FT UM)",
      lastSync: `${lastSyncTime} WIB`,
      isLive: true,
      error: null,
    };
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    return {
      ...DEFAULT_OUTDOOR_CLIMATE,
      source: "Open-Meteo Cache (Offline Fallback)",
      error: err.message,
      isLive: false,
    };
  }
}

// ============================================================================
// NORMALISASI PINTAR URL FIREBASE REALTIME DATABASE REST API
// ============================================================================

/**
 * Mengubah URL mentah (termasuk link browser console Firebase) menjadi endpoint REST JSON yang valid
 */
export function normalizeFirebaseUrl(rawUrl) {
  if (!rawUrl) return null;
  let url = String(rawUrl).trim();
  let extractedDbName = null;

  // 1. Ekstrak nama database jika berupa link console Firebase
  // Contoh: https://console.firebase.google.com/u/2/project/classsense-6ef75/database/classsense-6ef75-default-rtdb/data/~2F
  if (url.includes("console.firebase.google.com")) {
    const dbMatch = url.match(/database\/([^/]+)/);
    if (dbMatch && dbMatch[1]) {
      extractedDbName = dbMatch[1];
      if (extractedDbName.includes("asia-southeast1") || extractedDbName === "classsense-6ef75-default-rtdb") {
        url = `https://${extractedDbName}.asia-southeast1.firebasedatabase.app`;
      } else {
        url = `https://${extractedDbName}.firebaseio.com`;
      }
    }
  } else {
    // Coba ekstrak dbName dari subdomain misal https://<db-name>.firebaseio.com
    const hostMatch = url.match(/https?:\/\/([^.]+)\./);
    if (hostMatch && hostMatch[1]) {
      extractedDbName = hostMatch[1];
    }
  }

  // 2. Bersihkan trailing slash dan ekstensi .json jika ada
  url = url.replace(/\/+$/, "").replace(/\/rooms\.json$/, "").replace(/\.json$/, "");

  // 3. Pastikan format protokol valid
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }

  const roomsEndpoint = `${url}/rooms.json`;
  const getRoomEndpoint = (roomId) => `${url}/rooms/${roomId}.json`;

  return {
    dbName: extractedDbName || "classsense-default-rtdb",
    baseUrl: url,
    roomsEndpoint,
    collectionUrl: roomsEndpoint,
    getRoomEndpoint,
    itemUrlFn: getRoomEndpoint,
  };
}

/**
 * Mengambil konfigurasi Firebase aktif dari environment variables atau default
 */
export function getNormalizedFirebase() {
  const rawUrl =
    typeof import.meta !== "undefined" && import.meta.env?.VITE_IOT_API_URL
      ? import.meta.env.VITE_IOT_API_URL
      : typeof process !== "undefined" && process.env?.VITE_IOT_API_URL
      ? process.env.VITE_IOT_API_URL
      : "https://classsense-6ef75-default-rtdb.asia-southeast1.firebasedatabase.app";

  return normalizeFirebaseUrl(rawUrl);
}

// ============================================================================
// CLOUD REST TELEMETRY API & FIREBASE REALTIME DATABASE SYNC
// ============================================================================

/**
 * Sinkronisasi Seluruh Ruangan Sekaligus ke Firebase RTDB (Auto-Seeding)
 */
export async function syncAllRoomsToApi(rooms, timeoutMs = 6000) {
  const normalized = getNormalizedFirebase();
  if (!normalized) {
    return { success: true, mode: "local-only", count: rooms.length };
  }

  const roomsMap = {};
  rooms.forEach((r) => {
    roomsMap[r.id] = r;
  });

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const res = await fetch(normalized.roomsEndpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(roomsMap),
      signal: controller?.signal,
    });
    if (timeoutId) clearTimeout(timeoutId);

    return {
      success: res.ok,
      mode: "firebase-synced",
      count: rooms.length,
      status: res.status,
    };
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    return {
      success: false,
      mode: "local-fallback",
      error: err.message,
    };
  }
}

/**
 * 2. Mengambil Seluruh Ruangan dari Firebase Realtime Database
 * Otomatis melakukan auto-seeding jika database baru dibuat dan masih kosong (null).
 */
export async function fetchRoomsFromApi(timeoutMs = 5000) {
  const normalized = getNormalizedFirebase();
  if (!normalized) {
    return {
      success: true,
      source: "Local IoT Telemetry Engine (VITE_IOT_API_URL Default Standby)",
      isLiveApi: false,
      data: RAW_CAMPUS_ROOMS,
      timestamp: Date.now(),
    };
  }

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const res = await fetch(normalized.roomsEndpoint, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller?.signal,
    });
    if (timeoutId) clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

    const json = await res.json();
    let roomsArray = [];

    // Jika database Firebase masih kosong (null / object kosong), lakukan auto-seeding otomatis!
    if (json === null || (typeof json === "object" && Object.keys(json).length === 0)) {
      console.log("Firebase RTDB kosong, menginisialisasi auto-seeding data Kampus UM...");
      await syncAllRoomsToApi(RAW_CAMPUS_ROOMS);
      roomsArray = RAW_CAMPUS_ROOMS;
    } else if (Array.isArray(json)) {
      roomsArray = json.filter(Boolean);
    } else if (json && typeof json === "object") {
      roomsArray = Object.keys(json).map((key) => ({
        ...json[key],
        id: json[key].id || key,
      }));
    }

    if (roomsArray.length === 0) {
      roomsArray = RAW_CAMPUS_ROOMS;
    }

    return {
      success: true,
      source: `Firebase RTDB (${new URL(normalized.baseUrl).hostname})`,
      isLiveApi: true,
      data: roomsArray,
      timestamp: Date.now(),
    };
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    return {
      success: true,
      source: "Local IoT Telemetry Engine (Firebase Offline Fallback)",
      isLiveApi: false,
      error: err.message,
      data: RAW_CAMPUS_ROOMS,
      timestamp: Date.now(),
    };
  }
}

/**
 * 3. Menambahkan Ruangan Baru ke Firebase Realtime Database (+ Tambah Ruangan)
 */
export async function addRoomToApi(newRoom, timeoutMs = 5000) {
  const cleanCode = (newRoom.code || "UM-NEW").trim().toUpperCase();
  const roomToSave = {
    ...newRoom,
    id: cleanCode,
    code: cleanCode,
    name: newRoom.name || `Ruang ${cleanCode}`,
    building: newRoom.building || "Gedung B12 FT (DTEI)",
    buildingCode: newRoom.buildingCode || (cleanCode.split("-")[0] || "B12"),
    floor: Number(newRoom.floor) || 1,
    zone: newRoom.zone || "Zona Kampus UM",
    category: newRoom.category || "Ruang Teori",
    nodeId: newRoom.nodeId || `IoT-Node-${cleanCode.replace(/[^a-zA-Z0-9]/g, "")}`,
    protocol: newRoom.protocol || "LoRaWAN Class A",
    isOccupied: Boolean(newRoom.isOccupied),
    occupancyCount: newRoom.isOccupied ? (Number(newRoom.occupancyCount) || 1) : 0,
    capacity: Number(newRoom.capacity) || 40,
    scheduleInfo:
      newRoom.scheduleInfo ||
      (newRoom.isOccupied ? "Terjadwal Kuliah / Praktikum" : "KOSONG / Siap Digunakan Belajar Mandiri"),
    temp: Number(newRoom.temp) || 23.2,
    humidity: Number(newRoom.humidity) || 50,
    pm25: Number(newRoom.pm25) || 6.5,
    co2: Number(newRoom.co2) || 420,
    tvoc: Number(newRoom.tvoc) || 0.08,
    lux: Number(newRoom.lux) || (newRoom.isOccupied ? 400 : 280),
    acActive: Boolean(newRoom.acActive),
    lightsActive: Boolean(newRoom.lightsActive),
    emptyDurationMins: newRoom.isOccupied ? 0 : (Number(newRoom.emptyDurationMins) || 30),
    lat: Number(newRoom.lat) || -7.96135,
    lon: Number(newRoom.lon) || 112.61770,
    targetTempRange: newRoom.targetTempRange || "22° – 25°C",
    targetHumidityRange: newRoom.targetHumidityRange || "40% – 60%",
    facilities: newRoom.facilities || "AC Split 2 PK, Kursi Kuliah, Proyektor Smart, Wi-Fi 6 Eduroam",
    createdAt: newRoom.createdAt || new Date().toISOString(),
  };

  // Hitung metrik on-device mobile compute seketika (EPA AQI, Heat Index, Haversine Distance, dll.)
  const enrichedList = enrichRoomsWithMobileCompute([roomToSave]);
  const finalRoom = enrichedList[0] || roomToSave;

  const normalized = getNormalizedFirebase();
  if (!normalized) {
    return {
      success: true,
      mode: "local-only",
      data: finalRoom,
    };
  }

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const res = await fetch(normalized.getRoomEndpoint(roomToSave.id), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(roomToSave),
      signal: controller?.signal,
    });
    if (timeoutId) clearTimeout(timeoutId);

    return {
      success: res.ok,
      mode: "firebase-synced",
      status: res.status,
      data: finalRoom,
    };
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    return {
      success: true,
      mode: "local-state-fallback",
      error: err.message,
      data: finalRoom,
    };
  }
}

/**
 * 4. Menghapus Ruangan dari Firebase Realtime Database
 */
export async function deleteRoomFromApi(roomId, timeoutMs = 5000) {
  const normalized = getNormalizedFirebase();
  if (!normalized) {
    return { success: true, mode: "local-only", roomId };
  }

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const res = await fetch(normalized.getRoomEndpoint(roomId), {
      method: "DELETE",
      signal: controller?.signal,
    });
    if (timeoutId) clearTimeout(timeoutId);

    return {
      success: res.ok,
      mode: "firebase-deleted",
      roomId,
      status: res.status,
    };
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    return {
      success: true,
      mode: "local-state-fallback",
      error: err.message,
      roomId,
    };
  }
}

/**
 * 5. Sinkronisasi Perintah Aktuator Jarak Jauh (AC/Lampu) ke Firebase Realtime Database
 */
export async function syncActuatorToApi(roomId, payload, timeoutMs = 5000) {
  const normalized = getNormalizedFirebase();
  if (!normalized) {
    return {
      success: true,
      mode: "local-state-synced",
      roomId,
      payload,
      timestamp: Date.now(),
    };
  }

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const res = await fetch(normalized.getRoomEndpoint(roomId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller?.signal,
    });
    if (timeoutId) clearTimeout(timeoutId);

    return {
      success: res.ok,
      mode: "firebase-synced",
      status: res.status,
      roomId,
      payload,
      timestamp: Date.now(),
    };
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    return {
      success: true,
      mode: "local-state-fallback",
      error: err.message,
      roomId,
      payload,
      timestamp: Date.now(),
    };
  }
}
