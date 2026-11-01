import {
  calculateEPA_AQI,
  calculateHeatIndex,
  calculateHaversineDistance,
  evaluateEnergyAnomaly,
} from "../utils/mobileCompute.js";

// Koordinat Geospasial GPS Mahasiswa saat ini (Di halaman depan Fakultas Teknik Univ. Negeri Malang)
export const CURRENT_USER_LOCATION = {
  lat: -7.96120,
  lon: 112.61750,
  name: "Gedung FT & Sains UM (Posisi Anda)",
};

// Database Master Ruangan Kampus Smart FT & Sains
export const RAW_CAMPUS_ROOMS = [
  // Gedung A
  {
    id: "A-101",
    code: "A-101",
    name: "Ruang Teori A-101",
    building: "Gedung Kuliah Utama • Lt. 1",
    buildingCode: "A",
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
    id: "A-102",
    code: "A-102",
    name: "Ruang Kuliah Besar A-102",
    building: "Gedung Kuliah Utama • Lt. 1",
    buildingCode: "A",
    floor: 1,
    zone: "Zona Timur",
    category: "Ruang Teori",
    nodeId: "IoT-Node-A102",
    protocol: "LoRaWAN Class A",
    isOccupied: true,
    occupancyCount: 38,
    capacity: 50,
    course: "IoT & Embedded Systems",
    lecturer: "Dr. Ir. Hendra",
    scheduleInfo: "Hingga 11.40 WIB",
    temp: 25.8,
    humidity: 68,
    pm25: 16.5,
    co2: 680,
    tvoc: 0.14,
    lux: 400,
    acActive: true,
    lightsActive: true,
    emptyDurationMins: 0,
    lat: -7.96145,
    lon: 112.61780,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "Smart Podium, Audio Conference, AC Central, Double Projector",
  },
  {
    id: "A-203",
    code: "A-203",
    name: "Lab Bahasa Inggris A-203",
    building: "Gedung Bahasa Lt. 2",
    buildingCode: "A",
    floor: 2,
    zone: "Zona Barat",
    category: "Lab Komputer",
    nodeId: "IoT-Node-A203",
    protocol: "Wi-Fi MQTT",
    isOccupied: false,
    occupancyCount: 0,
    capacity: 30,
    scheduleInfo: "AC menyala sejak pukul 11.00 WIB (Kelas selesai 1 jam lalu). Pemborosan terakumulasi: 2.8 kWh.",
    temp: 20.1,
    humidity: 49,
    pm25: 7.1,
    co2: 415,
    tvoc: 0.07,
    lux: 280,
    acActive: true,
    lightsActive: false,
    emptyDurationMins: 60,
    estimatedWasteKwh: 2.8,
    estimatedCostRp: 4100,
    lat: -7.96160,
    lon: 112.61790,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "30 Audio Headset & PC Booth, AC Split 1.5 PK",
  },

  // Gedung B
  {
    id: "B-201",
    code: "B-201",
    name: "Ruang Seminar B-201",
    building: "Gedung Teknik • Lantai 2",
    buildingCode: "B",
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
    lat: -7.96130,
    lon: 112.61775,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "Sound System Stereo, 2x Wireless Mic, Proyektor Laser HD, AC Inverter",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "B-204",
    code: "B-204",
    name: "Lab Pemrograman B-204",
    building: "Gedung Sains & Komputer • Lt. 2",
    buildingCode: "B",
    floor: 2,
    zone: "Zona Utara",
    category: "Lab Komputer",
    nodeId: "IoT-Node-B204",
    protocol: "Wi-Fi MQTT",
    isOccupied: false,
    occupancyCount: 0,
    capacity: 35,
    scheduleInfo: "Fasilitas: 35 Unit PC Core i7 • Siap Pakai",
    subSchedule: "Tersedia Bebas - Reservasi ruang untuk belajar kelompok",
    temp: 22.5,
    humidity: 48,
    pm25: 3.8,
    co2: 410,
    tvoc: 0.06,
    lux: 290,
    acActive: false,
    lightsActive: false,
    emptyDurationMins: 35,
    lat: -7.96195,
    lon: 112.61820,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "35 Unit PC Core i7 16GB RAM, Gigabit LAN, AC Inverter 3 PK",
  },
  {
    id: "B-302",
    code: "B-302",
    name: "Ruang Seminar B-302",
    building: "Gedung Bisnis Lt. 3",
    buildingCode: "B",
    floor: 3,
    zone: "Zona Selatan",
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
    lat: -7.96225,
    lon: 112.61860,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "AC 2 PK, Kamera Termal & PIR Terkalibrasi, Akustik Ruang",
  },

  // Gedung C
  {
    id: "C-101",
    code: "C-101",
    name: "Ruang Workshop Robotika C-101",
    building: "Gedung Workshop & Lab • Lt. 1",
    buildingCode: "C",
    floor: 1,
    zone: "Zona Barat",
    category: "Lab Komputer",
    nodeId: "IoT-Node-C101",
    protocol: "Wi-Fi MQTT",
    isOccupied: true,
    occupancyCount: 22,
    capacity: 30,
    course: "Praktikum Mekatronika Lanjut",
    scheduleInfo: "Sirkulasi udara aktif otomatis (Exhaust Fan ON)",
    subSchedule: "Kadar partikel mikro & ventilasi darurat",
    temp: 26.4,
    humidity: 62,
    pm25: 23.1,
    co2: 790,
    tvoc: 0.22,
    lux: 450,
    acActive: true,
    lightsActive: true,
    emptyDurationMins: 0,
    lat: -7.96210,
    lon: 112.61840,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "Exhaust Fan Otomatis, Sensor Partikulat Shinyei, Kit PLC",
  },
  {
    id: "C-104",
    code: "C-104",
    name: "Ruang Diskusi C-104",
    building: "Perpustakaan Pusat • Lantai 1",
    buildingCode: "C",
    floor: 1,
    zone: "Zona Barat",
    category: "Ruang Diskusi",
    nodeId: "IoT-Node-C104",
    protocol: "LoRaWAN Class A",
    isOccupied: false,
    occupancyCount: 0,
    capacity: 8,
    scheduleInfo: "KOSONG / Tersedia untuk Diskusi",
    temp: 24.1,
    humidity: 55,
    pm25: 5.2,
    co2: 440,
    tvoc: 0.08,
    lux: 300,
    acActive: false,
    lightsActive: false,
    emptyDurationMins: 50,
    lat: -7.96245,
    lon: 112.61870,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "Meja Bundar 8 Kursi, Whiteboard, Smart TV 55 inci",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "C-401",
    code: "C-401",
    name: "Ruang Rapat Senat C-401",
    building: "Gedung Rektorat Lt. 4",
    buildingCode: "C",
    floor: 4,
    zone: "Zona Senat",
    category: "Ruang Seminar",
    nodeId: "IoT-Node-C401",
    protocol: "BACnet / IoT Gateway",
    isOccupied: false,
    occupancyCount: 0,
    capacity: 50,
    scheduleInfo: "AC Sentral zona 4 aktif tanpa jadwal pemakaian terdaftar di SI-Kampus.",
    temp: 21.4,
    humidity: 50,
    pm25: 4.8,
    co2: 410,
    tvoc: 0.05,
    lux: 240,
    acActive: true,
    lightsActive: false,
    emptyDurationMins: 90,
    estimatedWasteKwh: 3.6,
    estimatedCostRp: 5200,
    lat: -7.96260,
    lon: 112.61885,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "AC Sentral VRV, Microphone Delegate, Proyektor Motorized",
  },

  // Gedung D & Umum
  {
    id: "D-301",
    code: "D-301",
    name: "Auditorium D-301",
    building: "Gedung Dekanat • Lt. 3",
    buildingCode: "D",
    floor: 3,
    zone: "Zona Utama",
    category: "Ruang Seminar",
    nodeId: "IoT-Node-D301",
    protocol: "LoRaWAN Class A",
    isOccupied: false,
    occupancyCount: 0,
    capacity: 120,
    scheduleInfo: "Kapasitas Maksimal: 120 Kursi Bertingkat • AC Eco Mode",
    subSchedule: "Lihat agenda seminar & sound system",
    temp: 24.0,
    humidity: 53,
    pm25: 5.5,
    co2: 430,
    tvoc: 0.07,
    lux: 310,
    acActive: false,
    lightsActive: false,
    emptyDurationMins: 120,
    lat: -7.96275,
    lon: 112.61900,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "120 Kursi Bertingkat, Panggung, Line Array Speaker, AC Chiller",
  },
  {
    id: "D-105",
    code: "D-105",
    name: "Ruang Kuliah Teori D-105",
    building: "Gedung MIPA Lt. 1",
    buildingCode: "D",
    floor: 1,
    zone: "Zona Selatan",
    category: "Ruang Teori",
    nodeId: "IoT-Node-D105",
    protocol: "Wi-Fi MQTT",
    isOccupied: false,
    occupancyCount: 0,
    capacity: 45,
    scheduleInfo: "AC Split 1.5 PK menyala suhu target 20°C tanpa keberadaan mahasiswa.",
    temp: 22.2,
    humidity: 52,
    pm25: 6.2,
    co2: 425,
    tvoc: 0.06,
    lux: 270,
    acActive: true,
    lightsActive: false,
    emptyDurationMins: 45,
    estimatedWasteKwh: 2.1,
    estimatedCostRp: 3100,
    lat: -7.96290,
    lon: 112.61920,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "PIR Pasif Terkalibrasi, AC Split 1.5 PK, 45 Meja Kuliah",
  },
  {
    id: "LAB-MM3",
    code: "MM-3",
    name: "Lab Multimedia 3",
    building: "Gedung Rektorat • Lantai 3",
    buildingCode: "B",
    floor: 3,
    zone: "Zona Multimedia",
    category: "Lab Komputer",
    nodeId: "IoT-Node-MM3",
    protocol: "Wi-Fi MQTT",
    isOccupied: false,
    occupancyCount: 0,
    capacity: 32,
    scheduleInfo: "Kapasitas: 32 PC Desktop",
    temp: 22.8,
    humidity: 48,
    pm25: 4.0,
    co2: 415,
    tvoc: 0.05,
    lux: 320,
    acActive: false,
    lightsActive: false,
    emptyDurationMins: 75,
    lat: -7.96205,
    lon: 112.61815,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "32 iMac Pro Workstations, AC Inverter 3 PK, Drawing Tablet",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "R-204",
    code: "R-204",
    name: "Gedung Kuliah Bersama R-204",
    building: "Gedung Kuliah Bersama Lt. 2",
    buildingCode: "C",
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
    lat: -7.96235,
    lon: 112.61890,
    targetTempRange: "22° – 25°C",
    targetHumidityRange: "40% – 60%",
    facilities: "Exhaust Fan Otomatis, AC Central, Sensor MQ-135",
  },

  // Koridor Area
  {
    id: "K-WEST",
    code: "KOR-01",
    name: "Koridor Sayap Barat",
    building: "Gedung FT & Sains Lt. 2",
    buildingCode: "A",
    floor: 2,
    zone: "Koridor Barat",
    category: "Koridor",
    nodeId: "IoT-Node-KOR01",
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
    lat: -7.96150,
    lon: 112.61760,
    targetTempRange: "24° – 28°C",
    targetHumidityRange: "40% – 70%",
    facilities: "Sensor LDR Lux Digital, 8 Lampu Tabung LED 36W",
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
  { time: "12:30", temp: 24.5, aqi: 35, co2: 535, pm25: 13.4 }, // Peak Noon
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
      aqiBadge: aqiResult.statusBadge,
      aqiBadgeColor: aqiResult.badgeColor,
      heatIndexC: heatIndexResult.heatIndexC,
      comfortLabel: heatIndexResult.comfortLabel,
      distanceMeters,
      audit: auditResult,
    };
  });
}

// ============================================================================
// REAL REST API INTEGRATION: OPEN-METEO CLIMATE & CLOUD IOT ENDPOINTS
// ============================================================================

export const OPEN_METEO_WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=-7.9612&longitude=112.6175&current=temperature_2m,relative_humidity_2m";

export const OPEN_METEO_AIR_QUALITY_URL =
  "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=-7.9612&longitude=112.6175&current=pm2_5,us_aqi,carbon_monoxide";

export const DEFAULT_OUTDOOR_CLIMATE = {
  temp: 28.4,
  humidity: 65,
  pm25: 14.2,
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

/**
 * 2. Cloud REST Telemetry Endpoint & Fallback
 * Mengambil data telemetri ruangan dari VITE_IOT_API_URL (jika disetel),
 * dengan graceful fallback otomatis ke data simulator lokal jika offline.
 */
export async function fetchRoomsFromApi(timeoutMs = 4000) {
  const apiUrl =
    typeof import.meta !== "undefined" && import.meta.env?.VITE_IOT_API_URL
      ? import.meta.env.VITE_IOT_API_URL
      : (typeof process !== "undefined" && process.env?.VITE_IOT_API_URL ? process.env.VITE_IOT_API_URL : null);

  if (!apiUrl) {
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
    const res = await fetch(apiUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller?.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

    const json = await res.json();
    let roomsArray = [];

    if (Array.isArray(json)) {
      roomsArray = json;
    } else if (json && typeof json === "object") {
      // Format Firebase Realtime Database object ke array
      roomsArray = Object.keys(json).map((key) => ({
        id: key,
        ...json[key],
      }));
    }

    if (roomsArray.length === 0) {
      roomsArray = RAW_CAMPUS_ROOMS;
    }

    return {
      success: true,
      source: `Cloud REST API (${new URL(apiUrl).hostname})`,
      isLiveApi: true,
      data: roomsArray,
      timestamp: Date.now(),
    };
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    return {
      success: true,
      source: "Local IoT Telemetry Engine (Cloud API Fallback)",
      isLiveApi: false,
      error: err.message,
      data: RAW_CAMPUS_ROOMS,
      timestamp: Date.now(),
    };
  }
}

/**
 * 3. Sinkronisasi Perintah Aktuator Jarak Jauh (AC/Lampu) ke Cloud REST API
 */
export async function syncActuatorToApi(roomId, payload, timeoutMs = 4000) {
  const apiUrl =
    typeof import.meta !== "undefined" && import.meta.env?.VITE_IOT_API_URL
      ? import.meta.env.VITE_IOT_API_URL
      : (typeof process !== "undefined" && process.env?.VITE_IOT_API_URL ? process.env.VITE_IOT_API_URL : null);

  if (!apiUrl) {
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
    const endpoint = apiUrl.endsWith(".json")
      ? `${apiUrl.replace(/\.json$/, "")}/${roomId}.json`
      : `${apiUrl}/${roomId}`;

    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller?.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    return {
      success: res.ok,
      mode: "cloud-rest-synced",
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

