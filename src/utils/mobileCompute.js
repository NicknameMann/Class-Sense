// ============================================================================
// CLASSSENSE ON-DEVICE MOBILE COMPUTE ENGINE
// 10 Algoritma Komputasi Sisi Klien Sesuai Tugas_Mobile_Wireless_ClassSense.docx
// ============================================================================

/**
 * 1. Kalkulasi Indeks Kualitas Udara (Air Quality Index / AQI) Real-Time
 * Algoritma: Segmented Linear Interpolation (Standar US EPA AQI)
 * Ip = ((IHi - ILo) / (BPHi - BPLo)) * (Cp - BPLo) + ILo
 * AQI = max(Ip,1, Ip,2, ..., Ip,n)
 */
export function calculateEPA_AQI(pm25, co2) {
  const pm25Table = [
    { bpLo: 0.0, bpHi: 12.0, iLo: 0, iHi: 50 },
    { bpLo: 12.1, bpHi: 35.4, iLo: 51, iHi: 100 },
    { bpLo: 35.5, bpHi: 55.4, iLo: 101, iHi: 150 },
    { bpLo: 55.5, bpHi: 150.4, iLo: 151, iHi: 200 },
    { bpLo: 150.5, bpHi: 250.4, iLo: 201, iHi: 300 },
    { bpLo: 250.5, bpHi: 500.4, iLo: 301, iHi: 500 },
  ];

  // Breakpoints CO2 dalam ruangan (Indoor CO2 proxy scale EPA)
  const co2Table = [
    { bpLo: 350, bpHi: 600, iLo: 0, iHi: 50 },      // Sangat Segar / Outdoor level
    { bpLo: 601, bpHi: 1000, iLo: 51, iHi: 100 },   // Batas Kenyamanan Ruang Kuliah
    { bpLo: 1001, bpHi: 1500, iLo: 101, iHi: 150 }, // Perhatian / Ventilasi Diperlukan
    { bpLo: 1501, bpHi: 2500, iLo: 151, iHi: 200 }, // Kritis / Konsentrasi Turun
    { bpLo: 2501, bpHi: 5000, iLo: 201, iHi: 500 }, // Berbahaya
  ];

  const interpolate = (val, table) => {
    const clamped = Math.max(table[0].bpLo, Math.min(val, table[table.length - 1].bpHi));
    const row = table.find((r) => clamped >= r.bpLo && clamped <= r.bpHi) || table[0];
    return Math.round(
      ((row.iHi - row.iLo) / (row.bpHi - row.bpLo)) * (clamped - row.bpLo) + row.iLo
    );
  };

  const ipPm25 = interpolate(pm25, pm25Table);
  const ipCo2 = interpolate(co2, co2Table);
  const aqi = Math.max(ipPm25, ipCo2);

  let category = "Baik";
  let statusBadge = "BAIK (Good Quality)";
  let badgeColor = "text-emerald-700 bg-emerald-50 border-emerald-200";

  if (aqi <= 25) {
    category = "Sangat Baik";
    statusBadge = "SANGAT BAIK";
    badgeColor = "text-teal-700 bg-teal-50 border-teal-200";
  } else if (aqi <= 50) {
    category = "Baik";
    statusBadge = "BAIK (Good Quality)";
    badgeColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
  } else if (aqi <= 100) {
    category = "Sedang";
    statusBadge = "SEDANG (Moderate)";
    badgeColor = "text-amber-700 bg-amber-50 border-amber-200";
  } else if (aqi <= 150) {
    category = "Perhatian";
    statusBadge = "PERHATIAN (Sensitive)";
    badgeColor = "text-orange-700 bg-orange-50 border-orange-200";
  } else {
    category = "Buruk";
    statusBadge = "BURUK / KRITIS";
    badgeColor = "text-red-700 bg-red-50 border-red-200";
  }

  return { aqi, ipPm25, ipCo2, category, statusBadge, badgeColor };
}

// Alias for compatibility
export const calculateAQI = calculateEPA_AQI;

/**
 * 2. Perhitungan Indeks Kenyamanan Termal (Heat Index / Humidex)
 * Algoritma: Rothfusz Regression Equation (Steadman Multivariate Regression)
 * HI = c1 + c2*T + c3*RH + c4*T*RH + c5*T^2 + c6*RH^2 + c7*T^2*RH + c8*T*RH^2 + c9*T^2*RH^2
 */
export function calculateHeatIndex(tempC, rh) {
  const T = (9 / 5) * tempC + 32; // Konversi ke Fahrenheit
  const R = rh;

  // Rumus sederhana Steadman jika sensasi suhu sejuk (TF < 80°F)
  let hiF = 0.5 * (T + 61.0 + (T - 68.0) * 1.2 + R * 0.094);

  // Jika panas, gunakan regresi polinomial 9-koefisien Rothfusz (NOAA 1990)
  if (hiF >= 80) {
    const c1 = -42.379;
    const c2 = 2.04901523;
    const c3 = 10.14333127;
    const c4 = -0.22475541;
    const c5 = -0.00683783;
    const c6 = -0.05481717;
    const c7 = 0.00122874;
    const c8 = 0.00085282;
    const c9 = -0.00000199;

    hiF =
      c1 +
      c2 * T +
      c3 * R +
      c4 * T * R +
      c5 * T * T +
      c6 * R * R +
      c7 * T * T * R +
      c8 * T * R * R +
      c9 * T * T * R * R;
  }

  const hiC = Number(((5 / 9) * (hiF - 32)).toFixed(1));

  let comfortLabel = "Sangat Nyaman";
  let badgeColor = "text-emerald-700 bg-emerald-50 border-emerald-200";

  if (hiC < 20.0) {
    comfortLabel = "Sangat Dingin";
    badgeColor = "text-sky-700 bg-sky-50 border-sky-200";
  } else if (hiC <= 24.5) {
    comfortLabel = "Sangat Nyaman";
    badgeColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
  } else if (hiC <= 26.5) {
    comfortLabel = "Cukup Nyaman";
    badgeColor = "text-teal-700 bg-teal-50 border-teal-200";
  } else {
    comfortLabel = "Hangat / Kurang Nyaman";
    badgeColor = "text-amber-700 bg-amber-50 border-amber-200";
  }

  return { heatIndexC: hiC, comfortLabel, badgeColor };
}

/**
 * 3. Perankingan dan Rekomendasi Ruang Kelas Kosong (Multi-Criteria Recommendation)
 * Algoritma: Simple Additive Weighting (SAW)
 * rij = xij / max(xij) (benefit: status kosong)
 * rij = min(xij) / xij (cost: suhu jauh dari ideal, aqi tinggi, jarak jauh)
 * Vi = sum(wj * rij)
 */
export function rankRoomsSAW(
  rooms,
  weights = { occupancy: 0.35, temp: 0.25, aqi: 0.20, distance: 0.20 }
) {
  const emptyRooms = rooms.filter((r) => r.isOccupied === false || r.occupancyCount === 0);
  if (emptyRooms.length === 0) return [];

  // Hitung deviasi dari target suhu ideal kampus (23.5°C)
  const tempDevs = emptyRooms.map((r) => Math.max(0.1, Math.abs(r.temp - 23.5)));
  const minTempDev = Math.min(...tempDevs);
  const minAqi = Math.min(...emptyRooms.map((r) => Math.max(1, r.aqi || 20)));
  const minDist = Math.min(...emptyRooms.map((r) => Math.max(1, r.distanceMeters || 45)));

  return emptyRooms
    .map((room) => {
      const rOccupancy = 1.0; // Benefit: Status Kosong = 1.0
      const rTemp = minTempDev / Math.max(0.1, Math.abs(room.temp - 23.5)); // Cost
      const rAqi = minAqi / Math.max(1, room.aqi || 20); // Cost
      const rDist = minDist / Math.max(1, room.distanceMeters || 45); // Cost

      const sawScore =
        weights.occupancy * rOccupancy +
        weights.temp * rTemp +
        weights.aqi * rAqi +
        weights.distance * rDist;

      return {
        ...room,
        sawScore: Number(sawScore.toFixed(3)),
        sawPercent: Math.round(sawScore * 100),
        breakdown: {
          rOccupancy: Number(rOccupancy.toFixed(2)),
          rTemp: Number(rTemp.toFixed(2)),
          rAqi: Number(rAqi.toFixed(2)),
          rDist: Number(rDist.toFixed(2)),
        },
      };
    })
    .sort((a, b) => b.sawScore - a.sawScore);
}

/**
 * 4. Kalkulasi Jarak Geospasial Pengguna ke Ruang Kuliah
 * Algoritma: Haversine Formula
 * a = sin^2(dlat/2) + cos(lat1)*cos(lat2)*sin^2(dlon/2)
 * c = 2*atan2(sqrt(a), sqrt(1-a))
 * d = R * c (R = 6371 km)
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Jari-jari bumi rata-rata (km)
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const meters = Math.round(R * c * 1000);
  return meters;
}

export const calculateHaversineMeters = calculateHaversineDistance;

/**
 * 5. Pencarian Cepat dan Autocomplete Nama/Fasilitas Ruangan (Fuzzy Search)
 * Algoritma: Levenshtein Distance Algorithm (Minimum Edit Distance)
 * D(i, j) = min(D(i-1,j)+1, D(i,j-1)+1, D(i-1,j-1) + [si != tj])
 * Toleransi: edit distance <= 2
 */
export function levenshteinDistance(s, t) {
  const m = s.length;
  const n = t.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s[i - 1].toLowerCase() === t[j - 1].toLowerCase() ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // Penghapusan
        dp[i][j - 1] + 1,      // Penyisipan
        dp[i - 1][j - 1] + cost // Substitusi
      );
    }
  }
  return dp[m][n];
}

export function fuzzySearchRooms(rooms, query, maxEditDistance = 2) {
  if (!query || !query.trim()) return rooms;
  const q = query.trim().toLowerCase();

  return rooms.filter((room) => {
    const targetString = `${room.code} ${room.name} ${room.building} ${room.facility || room.facilities || ""} ${room.category}`.toLowerCase();
    
    // 1. Direct substring match
    if (targetString.includes(q)) return true;

    // 2. Token-level fuzzy match dengan Levenshtein (toleransi typo <= 2 edit)
    const tokens = targetString.split(/\s+/);
    return tokens.some((token) => {
      const prefix = token.slice(0, Math.max(q.length, 3));
      return levenshteinDistance(q, prefix) <= maxEditDistance;
    });
  });
}

/**
 * 6. Downsampling Titik Data Grafik Tren Historis Lingkungan
 * Algoritma: Largest-Triangle-Three-Buckets (LTTB)
 * Area = 0.5 * |(xA - xC)*(yB - yA) - (xA - xB)*(yC - yA)|
 * B* = arg max B in bucket (Area(A, B, C))
 */
export function downsampleLTTB(data, threshold) {
  if (!data || threshold >= data.length || threshold <= 2) return data;
  const sampled = [data[0]];
  const bucketSize = (data.length - 2) / (threshold - 2);
  let a = 0; // Index titik terpilih dari keranjang sebelumnya

  for (let i = 0; i < threshold - 2; i++) {
    // Hitung rata-rata keranjang berikutnya (Point C)
    const avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
    const avgRangeEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, data.length);
    let avgX = 0;
    let avgYTemp = 0;
    let avgYAqi = 0;
    const avgRangeLen = Math.max(1, avgRangeEnd - avgRangeStart);

    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      avgX += j;
      avgYTemp += (data[j].temp ?? 0);
      avgYAqi += (data[j].aqi ?? 0);
    }
    avgX /= avgRangeLen;
    avgYTemp /= avgRangeLen;
    avgYAqi /= avgRangeLen;

    // Range keranjang saat ini (Candidate Points B)
    const rangeOffs = Math.floor(i * bucketSize) + 1;
    const rangeTo = Math.floor((i + 1) * bucketSize) + 1;
    const pointAX = a;
    const pointAY = data[a].temp ?? 0;

    let maxArea = -1;
    let nextA = rangeOffs;

    for (let j = rangeOffs; j < rangeTo; j++) {
      const candidateY = data[j].temp ?? 0;
      // Rumus determinan luas segitiga: 0.5 * |(xA - xC)*(yB - yA) - (xA - xB)*(yC - yA)|
      const area =
        Math.abs(
          (pointAX - avgX) * (candidateY - pointAY) -
          (pointAX - j) * (avgYTemp - pointAY)
        ) * 0.5;

      if (area > maxArea) {
        maxArea = area;
        nextA = j;
      }
    }

    sampled.push(data[nextA]);
    a = nextA;
  }

  // Masukkan titik akhir
  sampled.push(data[data.length - 1]);
  return sampled;
}

/**
 * 7. Smoothing dan Filter Noise Data Sinyal Okupansi Real-Time
 * Algoritma: Exponential Moving Average (EMA)
 * St = alpha * Yt + (1 - alpha) * St-1
 */
export function smoothOccupancyEMA(currentSignal, prevSmoothed = 0, alpha = 0.35) {
  const st = alpha * currentSignal + (1 - alpha) * prevSmoothed;
  return {
    smoothedValue: Number(st.toFixed(2)),
    isOccupiedStable: st >= 0.5,
  };
}

/**
 * 8. Evaluasi Ambang Batas Logika Anomali Pemborosan Energi (Facility Audit)
 * Algoritma: Rule-Based Inference Engine (Forward Chaining)
 * Anomali = 1 <=> (O = 0) AND (T < 23°C) AND (delta_t >= tau)
 */
export function evaluateEnergyAnomalies(rooms, tauMinutes = 30) {
  return rooms
    .map((room) => {
      const isOccupied = room.isOccupied === true || (room.occupancyCount || room.occupied || 0) > 0;
      
      // Rule 1: AC Pemborosan (Kosong & AC Nyala & Suhu < 23°C & Durasi >= tau)
      const acWasteRule =
        !isOccupied &&
        room.acActive === true &&
        room.temp < 23.0 &&
        (room.emptyDurationMins || 0) >= tauMinutes;

      // Rule 2: Lampu Nyala Siang Hari (Kosong & Lampu Nyala & Lux > 500)
      const lightWasteRule =
        !isOccupied &&
        room.lightsActive === true &&
        (room.lux || 0) > 500;

      if (!acWasteRule && !lightWasteRule) return null;

      const priority = room.temp < 20.0 ? "PRIORITAS TINGGI" : "PERINGATAN";

      return {
        ...room,
        anomalyType: acWasteRule ? "AC_WASTE" : "LIGHT_WASTE",
        priority,
        wastedKwh: room.estimatedWasteKwh || (acWasteRule ? Number((1.5 * ((room.emptyDurationMins || 60) / 60)).toFixed(1)) : 1.1),
        wastedIdr: room.estimatedCostRp || (acWasteRule ? Math.round(1450 * 1.5 * ((room.emptyDurationMins || 60) / 60)) : 1600),
      };
    })
    .filter(Boolean);
}

export function evaluateEnergyAnomaly(room, tauMinutes = 30) {
  const isOccupied = room.isOccupied === true || (room.occupancyCount || room.occupied || 0) > 0;
  const isACAnomaly = !isOccupied && room.acActive === true && room.temp < 23.0 && (room.emptyDurationMins || 0) >= tauMinutes;
  const isLightAnomaly = !isOccupied && room.lightsActive === true && (room.lux || 0) > 500;

  return {
    hasAnomaly: isACAnomaly || isLightAnomaly,
    type: isACAnomaly ? "AC_WASTE" : isLightAnomaly ? "LIGHT_WASTE" : "NORMAL",
    priority: room.temp < 20.0 ? "PRIORITAS TINGGI" : "PERINGATAN",
  };
}

/**
 * 9. Komputasi Perbedaan Status Data (State Diffing) untuk Sinkronisasi Cache Lokal
 * Algoritma: Myers Difference / DiffUtil Key Comparison
 * D(A, B) = min_P (I(P) + E(P)) - O(ND)
 */
export function computeRoomStateDiff(oldRooms, newRooms) {
  const oldMap = new Map(oldRooms.map((r) => [r.id, r]));
  const changedIds = [];

  const merged = newRooms.map((newRoom) => {
    const old = oldMap.get(newRoom.id);
    if (!old) {
      changedIds.push(newRoom.id);
      return newRoom;
    }

    const hasChanged =
      old.temp !== newRoom.temp ||
      old.humidity !== newRoom.humidity ||
      old.co2 !== newRoom.co2 ||
      old.pm25 !== newRoom.pm25 ||
      old.isOccupied !== newRoom.isOccupied ||
      old.occupancyCount !== newRoom.occupancyCount ||
      old.acActive !== newRoom.acActive ||
      old.lightsActive !== newRoom.lightsActive;

    if (hasChanged) {
      changedIds.push(newRoom.id);
      return newRoom;
    }
    // Return identical reference to prevent React component re-rendering
    return old;
  });

  return { merged, changedIds };
}

/**
 * 10. Evaluasi Ambang Batas dan Rate-Limiting Notifikasi Kualitas Udara (Alert Engine)
 * Algoritma: Debounce and Throttle Rate-Limiting Algorithm
 * Kritis = (CO2 > 1000 ppm) OR (PM > B_PM)
 * delta_t = t_now - t_last
 * Notif = 1 <=> Kritis AND delta_t >= 15 menit
 */
export function evaluateAirQualityAlert(
  rooms,
  lastAlertTimestamp,
  cooldownMs = 15 * 60 * 1000 // 15 menit default
) {
  const now = Date.now();
  // Temukan ruangan dengan kondisi kritis
  const criticalRoom = rooms.find(
    (r) => (r.co2 && r.co2 > 1000) || (r.pm25 && r.pm25 > 55.4)
  );

  if (!criticalRoom) {
    return { shouldTrigger: false, criticalRoom: null, nextTimestamp: lastAlertTimestamp };
  }

  const deltaT = now - (lastAlertTimestamp || 0);
  const shouldTrigger = deltaT >= cooldownMs;

  return {
    shouldTrigger,
    criticalRoom,
    nextTimestamp: shouldTrigger ? now : lastAlertTimestamp,
    deltaMinutes: Math.floor(deltaT / (60 * 1000)),
  };
}
