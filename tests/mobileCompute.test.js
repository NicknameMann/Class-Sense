import {
  calculateEPA_AQI,
  calculateHeatIndex,
  rankRoomsSAW,
  calculateHaversineDistance,
  levenshteinDistance,
  fuzzySearchRooms,
  downsampleLTTB,
  smoothOccupancyEMA,
  evaluateEnergyAnomalies,
  computeRoomStateDiff,
  evaluateAirQualityAlert,
} from "../src/utils/mobileCompute.js";

import {
  fetchCampusOutdoorClimate,
  fetchRoomsFromApi,
  syncActuatorToApi,
  DEFAULT_OUTDOOR_CLIMATE,
} from "../src/services/iotSimulatorApi.js";

async function runTestSuite() {
  console.log("================================================================================");
  console.log("🧪 CLASSSENSE TEST SUITE: 10 MOBILE ALGORITHMS & REST API INTEGRATION");
  console.log("================================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assertTest(condition, name, details = "") {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ [PASS] ${name} ${details ? `(${details})` : ""}`);
    } else {
      console.error(`❌ [FAIL] ${name} ${details ? `(${details})` : ""}`);
      throw new Error(`Test failed: ${name}`);
    }
  }

  // --------------------------------------------------------------------------
  // 1. ALGORITMA 1: US EPA AQI Linear Interpolation
  // --------------------------------------------------------------------------
  const aqiClean = calculateEPA_AQI(8.2, 435);
  assertTest(
    aqiClean.aqi > 0 && aqiClean.category === "Baik",
    "Algoritma 1: US EPA AQI (Kondisi Bersih A-101)",
    `AQI: ${aqiClean.aqi}, Kategori: ${aqiClean.category}`
  );

  const aqiHazard = calculateEPA_AQI(32.4, 1150);
  assertTest(
    aqiHazard.aqi > 100 && (aqiHazard.category === "Perhatian" || aqiHazard.category === "Buruk"),
    "Algoritma 1: US EPA AQI (Kondisi Kritis R-204)",
    `AQI: ${aqiHazard.aqi}, Kategori: ${aqiHazard.category}`
  );

  // --------------------------------------------------------------------------
  // 2. ALGORITMA 2: Rothfusz Regression Heat Index (Humidex)
  // --------------------------------------------------------------------------
  const hiResult = calculateHeatIndex(23.2, 51);
  assertTest(
    hiResult.heatIndexC >= 20.0 && hiResult.heatIndexC <= 25.0 && hiResult.comfortLabel === "Sangat Nyaman",
    "Algoritma 2: Rothfusz Heat Index / Humidex",
    `Suhu Efektif: ${hiResult.heatIndexC}°C (${hiResult.comfortLabel})`
  );

  // --------------------------------------------------------------------------
  // 3. ALGORITMA 3: Simple Additive Weighting (SAW) Room Recommendation
  // --------------------------------------------------------------------------
  const mockRooms = [
    { id: "B-201", code: "B-201", name: "Ruang Seminar B-201", temp: 23.4, aqi: 18, distanceMeters: 45, isOccupied: false, occupancyCount: 0 },
    { id: "MM-3", code: "MM-3", name: "Lab Multimedia 3", temp: 22.8, aqi: 24, distanceMeters: 120, isOccupied: false, occupancyCount: 0 },
    { id: "A-102", code: "A-102", name: "Ruang Kuliah Besar A-102", temp: 25.8, aqi: 58, distanceMeters: 60, isOccupied: true, occupancyCount: 38 },
  ];
  const ranked = rankRoomsSAW(mockRooms);
  assertTest(
    ranked.length === 2 && ranked[0].id === "B-201",
    "Algoritma 3: Simple Additive Weighting (SAW) Best Match",
    `Top 1: ${ranked[0].id} (Skor SAW: ${ranked[0].sawScore})`
  );

  // --------------------------------------------------------------------------
  // 4. ALGORITMA 4: Haversine Formula (GPS Location to Classroom)
  // --------------------------------------------------------------------------
  const meters = calculateHaversineDistance(-7.9612, 112.6175, -7.9615, 112.6178);
  assertTest(
    meters >= 30 && meters <= 80,
    "Algoritma 4: Haversine Formula Geospasial FT UM",
    `Jarak Dihitung: ${meters} Meter`
  );

  // --------------------------------------------------------------------------
  // 5. ALGORITMA 5: Levenshtein Distance & Fuzzy Search (Typo Tolerance <= 2)
  // --------------------------------------------------------------------------
  const editDist = levenshteinDistance("semnar", "seminar");
  assertTest(editDist === 1, "Algoritma 5: Levenshtein Distance", `'semnar' vs 'seminar' = ${editDist} edit`);

  const searchResults = fuzzySearchRooms(
    [{ code: "B-201", name: "Ruang Seminar B-201", building: "Teknik", category: "Seminar" }],
    "semnar"
  );
  assertTest(
    searchResults.length === 1 && searchResults[0].code === "B-201",
    "Algoritma 5: Typo-Tolerant Fuzzy Search (<= 2 edit)",
    `Keyword 'semnar' cocok dengan '${searchResults[0].name}'`
  );

  // --------------------------------------------------------------------------
  // 6. ALGORITMA 6: Largest-Triangle-Three-Buckets (LTTB) Downsampling
  // --------------------------------------------------------------------------
  const rawTimeSeries = Array.from({ length: 48 }, (_, i) => ({
    time: `${i}:00`,
    temp: 22 + Math.sin(i / 6) * 3,
    aqi: 20 + i,
  }));
  const sampled = downsampleLTTB(rawTimeSeries, 10);
  assertTest(
    sampled.length === 10 && sampled[0].time === rawTimeSeries[0].time && sampled[9].time === rawTimeSeries[47].time,
    "Algoritma 6: LTTB Downsampling Time-Series",
    `Reduksi 48 titik -> ${sampled.length} titik representatif`
  );

  // --------------------------------------------------------------------------
  // 7. ALGORITMA 7: Exponential Moving Average (EMA) PIR Smoothing
  // --------------------------------------------------------------------------
  const ema1 = smoothOccupancyEMA(1, 0, 0.35);
  const ema2 = smoothOccupancyEMA(1, ema1.smoothedValue, 0.35);
  assertTest(
    ema1.smoothedValue === 0.35 && !ema1.isOccupiedStable && ema2.isOccupiedStable,
    "Algoritma 7: Exponential Moving Average (EMA) PIR Anti-Flicker",
    `EMA Step 1: ${ema1.smoothedValue} (False), Step 2: ${ema2.smoothedValue} (True)`
  );

  // --------------------------------------------------------------------------
  // 8. ALGORITMA 8: Rule-Based Inference Engine (Forward Chaining)
  // --------------------------------------------------------------------------
  const auditCandidates = [
    { id: "B-302", isOccupied: false, acActive: true, temp: 19.5, emptyDurationMins: 165, lux: 240, lightsActive: false },
    { id: "K-WEST", isOccupied: false, acActive: false, temp: 26.1, emptyDurationMins: 180, lux: 620, lightsActive: true },
    { id: "A-101", isOccupied: false, acActive: false, temp: 23.2, emptyDurationMins: 45, lux: 320, lightsActive: false },
  ];
  const anomalies = evaluateEnergyAnomalies(auditCandidates);
  assertTest(
    anomalies.length === 2 && anomalies.some((a) => a.id === "B-302" && a.anomalyType === "AC_WASTE"),
    "Algoritma 8: Forward-Chaining Facility Energy Audit",
    `Terdeteksi 2 anomali: AC Waste (B-302) & Light Waste (K-WEST)`
  );

  // --------------------------------------------------------------------------
  // 9. ALGORITMA 9: State Diffing (Myers Diff / Selective Re-rendering)
  // --------------------------------------------------------------------------
  const oldState = [{ id: "A-101", temp: 23.2, isOccupied: false }];
  const newState = [{ id: "A-101", temp: 23.5, isOccupied: false }];
  const diff = computeRoomStateDiff(oldState, newState);
  assertTest(
    diff.changedIds.includes("A-101") && diff.merged.length === 1,
    "Algoritma 9: State Diffing Memory Cache Optimization",
    `Node diubah: [${diff.changedIds.join(", ")}]`
  );

  // --------------------------------------------------------------------------
  // 10. ALGORITMA 10: Debounce & Throttle Rate-Limiting Alert Engine
  // --------------------------------------------------------------------------
  const now = Date.now();
  const alertTrigger = evaluateAirQualityAlert([{ co2: 1150, pm25: 10 }], 0, 15 * 60 * 1000);
  const alertCooldown = evaluateAirQualityAlert([{ co2: 1150, pm25: 10 }], now, 15 * 60 * 1000);
  assertTest(
    alertTrigger.shouldTrigger === true && alertCooldown.shouldTrigger === false,
    "Algoritma 10: Debounce & Throttle Rate-Limiting Alert Engine",
    `Pemicu 1: ${alertTrigger.shouldTrigger}, Pemicu 2 (Dalam Jeda 15 Menit): ${alertCooldown.shouldTrigger}`
  );

  // --------------------------------------------------------------------------
  // 11. REST API: Open-Meteo Weather & Air Quality HTTP GET Integration
  // --------------------------------------------------------------------------
  console.log("\n📡 Menguji HTTP GET Request ke Open-Meteo Weather & Air Quality API...");
  const climateResult = await fetchCampusOutdoorClimate(4000);
  assertTest(
    typeof climateResult.temp === "number" &&
    typeof climateResult.humidity === "number" &&
    typeof climateResult.usAqi === "number" &&
    typeof climateResult.pm25 === "number" &&
    climateResult.source.includes("Open-Meteo"),
    "REST API 1: Open-Meteo Live API / Graceful Fallback",
    `Suhu Luar: ${climateResult.temp}°C, Lembap: ${climateResult.humidity}%, AQI: ${climateResult.usAqi}, Sumber: ${climateResult.source}`
  );

  // --------------------------------------------------------------------------
  // 12. REST API: Cloud REST Telemetry Endpoint & Fallback
  // --------------------------------------------------------------------------
  console.log("📡 Menguji Cloud REST Telemetry Endpoint Fetching & Fallback...");
  const roomsApiResult = await fetchRoomsFromApi(3000);
  assertTest(
    roomsApiResult.success === true &&
    Array.isArray(roomsApiResult.data) &&
    roomsApiResult.data.length > 0,
    "REST API 2: fetchRoomsFromApi (Cloud REST / Local Fallback)",
    `Jumlah Ruangan: ${roomsApiResult.data.length}, Sumber: ${roomsApiResult.source}`
  );

  // --------------------------------------------------------------------------
  // 13. REST API: Actuator Dispatch (Remote AC & Lamp Control Sync)
  // --------------------------------------------------------------------------
  console.log("📡 Menguji syncActuatorToApi untuk Pengendalian Jarak Jauh...");
  const actuatorSyncResult = await syncActuatorToApi("B-302", { acActive: false, temp: 24.5 });
  assertTest(
    actuatorSyncResult.success === true &&
    actuatorSyncResult.roomId === "B-302" &&
    actuatorSyncResult.payload.acActive === false,
    "REST API 3: syncActuatorToApi (Remote Actuator Command)",
    `Mode: ${actuatorSyncResult.mode}, Target: ${actuatorSyncResult.roomId}`
  );

  console.log("\n================================================================================");
  console.log(`🎉 HASIL PENGUJIAN: ${passedTests}/${totalTests} TESTS BERHASIL DENGAN SEMPURNA!`);
  console.log("================================================================================\n");
}

runTestSuite().catch((err) => {
  console.error("FATAL ERROR IN TEST SUITE:", err);
  process.exit(1);
});
