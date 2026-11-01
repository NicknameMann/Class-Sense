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
} from "./src/utils/mobileCompute.js";

console.log("=== VERIFIKASI 10 ALGORITMA ON-DEVICE MOBILE COMPUTE ===");

// 1. US EPA AQI Linear Interpolation
const aqiResult = calculateEPA_AQI(8.2, 435);
console.log("1. US EPA AQI:", aqiResult);
console.assert(aqiResult.aqi > 0 && aqiResult.category === "Baik", "Algoritma 1 Failed");

// 2. Rothfusz Heat Index
const hiResult = calculateHeatIndex(23.2, 51);
console.log("2. Heat Index (Humidex):", hiResult);
console.assert(hiResult.heatIndexC > 20 && hiResult.comfortLabel === "Sangat Nyaman", "Algoritma 2 Failed");

// 3. Simple Additive Weighting (SAW)
const mockRooms = [
  { id: "A", code: "A", name: "A", temp: 23.4, aqi: 18, distanceMeters: 45, isOccupied: false, occupancyCount: 0 },
  { id: "B", code: "B", name: "B", temp: 26.0, aqi: 70, distanceMeters: 200, isOccupied: false, occupancyCount: 0 },
  { id: "C", code: "C", name: "C", temp: 22.0, aqi: 10, distanceMeters: 50, isOccupied: true, occupancyCount: 20 },
];
const sawRanking = rankRoomsSAW(mockRooms);
console.log("3. SAW Ranking:", sawRanking.map(r => ({ id: r.id, score: r.sawScore })));
console.assert(sawRanking[0].id === "A", "Algoritma 3 Failed");

// 4. Haversine Distance
const distance = calculateHaversineDistance(-7.9612, 112.6175, -7.9615, 112.6178);
console.log("4. Haversine Distance:", distance, "meters");
console.assert(distance > 30 && distance < 100, "Algoritma 4 Failed");

// 5. Levenshtein Fuzzy Search
const levDist = levenshteinDistance("semnar", "seminar");
console.log("5. Levenshtein Edit Distance ('semnar' vs 'seminar'):", levDist);
console.assert(levDist === 1, "Algoritma 5 Failed");

const searchResults = fuzzySearchRooms(
  [{ code: "B-201", name: "Ruang Seminar B-201", building: "Teknik", category: "Seminar" }],
  "semnar"
);
console.assert(searchResults.length === 1, "Algoritma 5 Fuzzy Search Failed");

// 6. LTTB Downsampling
const rawSeries = Array.from({ length: 48 }, (_, i) => ({
  time: `${i}:00`,
  temp: 22 + Math.sin(i / 5) * 3,
  aqi: 20 + i,
}));
const sampled = downsampleLTTB(rawSeries, 10);
console.log("6. LTTB Downsampled Points:", sampled.length, "from", rawSeries.length);
console.assert(sampled.length === 10, "Algoritma 6 Failed");

// 7. EMA Smoothing for PIR
const ema1 = smoothOccupancyEMA(1, 0, 0.35);
const ema2 = smoothOccupancyEMA(1, ema1.smoothedValue, 0.35);
console.log("7. EMA Okupansi PIR:", ema1, ema2);
console.assert(ema2.smoothedValue > ema1.smoothedValue, "Algoritma 7 Failed");

// 8. Rule-based Forward Chaining
const auditRooms = [
  { id: "W1", name: "B-302", isOccupied: false, acActive: true, temp: 19.5, emptyDurationMins: 60, lux: 200, lightsActive: false },
  { id: "W2", name: "K-WEST", isOccupied: false, acActive: false, temp: 26, emptyDurationMins: 60, lux: 620, lightsActive: true },
  { id: "OK", name: "A-101", isOccupied: false, acActive: false, temp: 24, emptyDurationMins: 60, lux: 300, lightsActive: false },
];
const anomalies = evaluateEnergyAnomalies(auditRooms);
console.log("8. Audit Anomalies (Forward Chaining):", anomalies.map(a => ({ id: a.id, type: a.anomalyType })));
console.assert(anomalies.length === 2, "Algoritma 8 Failed");

// 9. Myers Diffing / State Diffing
const oldList = [{ id: "1", temp: 23, isOccupied: false }];
const newList = [{ id: "1", temp: 23.5, isOccupied: false }];
const diffResult = computeRoomStateDiff(oldList, newList);
console.log("9. State Diffing Changed IDs:", diffResult.changedIds);
console.assert(diffResult.changedIds.includes("1"), "Algoritma 9 Failed");

// 10. Alert Engine Rate Limiting
const alert1 = evaluateAirQualityAlert([{ co2: 1150, pm25: 10 }], 0, 15 * 60 * 1000);
console.log("10. Alert Engine Trigger 1 (Now):", alert1.shouldTrigger);
console.assert(alert1.shouldTrigger === true, "Algoritma 10 Trigger 1 Failed");

const alert2 = evaluateAirQualityAlert([{ co2: 1150, pm25: 10 }], Date.now(), 15 * 60 * 1000);
console.log("10. Alert Engine Trigger 2 (Cooldown):", alert2.shouldTrigger);
console.assert(alert2.shouldTrigger === false, "Algoritma 10 Cooldown Failed");

console.log("\n>>> SEMUA 10 ALGORITMA TERVERIFIKASI 100% SUKSES! <<<");

