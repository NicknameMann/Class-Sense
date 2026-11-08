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
  addRoomToApi,
  deleteRoomFromApi,
  normalizeFirebaseUrl,
  buildFirebaseEndpoint,
  RAW_CAMPUS_ROOMS,
  DEFAULT_OUTDOOR_CLIMATE,
} from "../src/services/iotSimulatorApi.js";

import {
  authenticateUser,
  registerUser,
  checkPermission,
  createSignedSession,
  verifySessionIntegrity,
  sha256Sync,
  REGISTERED_USERS,
  GUEST_USER,
} from "../src/services/authService.js";

const MOCK_FIREBASE_URL = "https://classsense-test.invalid";

async function withMockApi(mockFetch, callback) {
  const originalFetch = globalThis.fetch;
  const originalApiUrl = process.env.VITE_IOT_API_URL;
  globalThis.fetch = mockFetch;
  process.env.VITE_IOT_API_URL = MOCK_FIREBASE_URL;

  try {
    return await callback();
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiUrl === undefined) {
      delete process.env.VITE_IOT_API_URL;
    } else {
      process.env.VITE_IOT_API_URL = originalApiUrl;
    }
  }
}

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

async function runTestSuite() {
  console.log("================================================================================");
  console.log("🧪 CLASSSENSE TEST SUITE: ALGORITHMS, API, FIREBASE & RBAC");
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
  const climateRequests = [];
  const climateResult = await withMockApi(
    async (url) => {
      climateRequests.push(url);
      if (url.includes("air-quality")) {
        return jsonResponse({ current: { pm2_5: 12.3, us_aqi: 42, carbon_monoxide: 378 } });
      }
      return jsonResponse({ current: { temperature_2m: 24.1, relative_humidity_2m: 58 } });
    },
    () => fetchCampusOutdoorClimate(4000)
  );
  assertTest(
    typeof climateResult.temp === "number" &&
    typeof climateResult.humidity === "number" &&
    typeof climateResult.usAqi === "number" &&
    typeof climateResult.pm25 === "number" &&
    climateResult.source.includes("Open-Meteo REST API") &&
    climateResult.isLive === true &&
    climateRequests.length === 2,
    "REST API 1: Open-Meteo Live API / Graceful Fallback",
    `Suhu Luar: ${climateResult.temp}°C, Lembap: ${climateResult.humidity}%, AQI: ${climateResult.usAqi}, Sumber: ${climateResult.source}`
  );

  // --------------------------------------------------------------------------
  // 12. REST API: Cloud REST Telemetry Endpoint & Fallback
  // --------------------------------------------------------------------------
  console.log("📡 Menguji Cloud REST Telemetry Endpoint Fetching & Fallback...");
  let roomsRequest;
  const roomsApiResult = await withMockApi(
    async (url, options) => {
      roomsRequest = { url, options };
      return jsonResponse({ "ROOM-TEST": { name: "Ruang Uji", temp: 23.5 } });
    },
    () => fetchRoomsFromApi(3000)
  );
  assertTest(
    roomsApiResult.success === true &&
    roomsApiResult.isLiveApi === true &&
    Array.isArray(roomsApiResult.data) &&
    roomsApiResult.data.length === 1 &&
    roomsApiResult.data[0].id === "ROOM-TEST" &&
    roomsRequest.options.method === "GET" &&
    roomsRequest.url === `${MOCK_FIREBASE_URL}/rooms.json`,
    "REST API 2: fetchRoomsFromApi (Cloud REST / Local Fallback)",
    `Jumlah Ruangan: ${roomsApiResult.data.length}, Sumber: ${roomsApiResult.source}`
  );

  const fallbackRooms = await withMockApi(
    async () => { throw new Error("mock offline"); },
    () => fetchRoomsFromApi(3000)
  );
  assertTest(
    fallbackRooms.success === true &&
    fallbackRooms.isLiveApi === false &&
    fallbackRooms.data.length === RAW_CAMPUS_ROOMS.length &&
    fallbackRooms.source.includes("Offline Fallback"),
    "REST API 2b: Local Fallback saat Cloud API Offline",
    `Fallback lokal: ${fallbackRooms.data.length} ruangan`
  );

  let seedRequests = [];
  const seededRooms = await withMockApi(
    async (url, options) => {
      seedRequests.push({ url, options });
      return options.method === "GET" ? jsonResponse(null) : jsonResponse({});
    },
    () => fetchRoomsFromApi(3000)
  );
  assertTest(
    seededRooms.success === true &&
    seedRequests.length === 2 &&
    seedRequests[1].options.method === "PUT" &&
    Object.keys(JSON.parse(seedRequests[1].options.body)).length === RAW_CAMPUS_ROOMS.length,
    "REST API 2c: Auto-seeding database kosong",
    `Seed lokal teruji: ${RAW_CAMPUS_ROOMS.length} ruangan ke endpoint mock`
  );

  // --------------------------------------------------------------------------
  // 13. REST API: Actuator Dispatch (Remote AC & Lamp Control Sync)
  // --------------------------------------------------------------------------
  console.log("📡 Menguji syncActuatorToApi untuk Pengendalian Jarak Jauh...");
  const actuatorPayload = { acActive: false, temp: 24.5 };
  let actuatorRequest;
  const actuatorSyncResult = await withMockApi(
    async (url, options) => {
      actuatorRequest = { url, options };
      return jsonResponse({});
    },
    () => syncActuatorToApi("B-302", actuatorPayload)
  );
  assertTest(
    actuatorSyncResult.success === true &&
    actuatorSyncResult.mode === "firebase-synced" &&
    actuatorSyncResult.roomId === "B-302" &&
    actuatorSyncResult.payload.acActive === false &&
    actuatorRequest.options.method === "PATCH" &&
    JSON.parse(actuatorRequest.options.body).acActive === false,
    "REST API 3: syncActuatorToApi (Remote Actuator Command)",
    `Mode: ${actuatorSyncResult.mode}, Target: ${actuatorSyncResult.roomId}`
  );

  const rejectedActuator = await withMockApi(
    async () => jsonResponse({ error: "permission_denied" }, 403),
    () => syncActuatorToApi("B-302", actuatorPayload)
  );
  assertTest(
    rejectedActuator.success === false && rejectedActuator.status === 403,
    "REST API 3b: Menandai perintah aktuator yang ditolak server",
    `HTTP ${rejectedActuator.status}`
  );

  // --------------------------------------------------------------------------
  // 14. AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)
  // --------------------------------------------------------------------------
  console.log("\n🔐 Menguji Autentikasi Pengguna & Role-Based Access Control (RBAC)...");
  
  // Login Staf Sarpras (Admin) dengan Email
  const authSarprasEmail = await authenticateUser("sarpras@um.ac.id", "admin123");
  assertTest(
    authSarprasEmail.success && authSarprasEmail.user.role === "admin",
    "Auth & RBAC 1: Login Staf Sarpras via Email (SHA-256 / Firebase)",
    `Role: ${authSarprasEmail.user?.role}`
  );

  // Login Mahasiswa dengan Email
  const authMhs = await authenticateUser("mahasiswa@um.ac.id", "mhs123");
  assertTest(
    authMhs.success && authMhs.user.role === "mahasiswa",
    "Auth & RBAC 2: Login Mahasiswa via Email (SHA-256 / Firebase)",
    `Role: ${authMhs.user?.role}`
  );

  // Uji Kredensial Salah
  const authFailed = await authenticateUser("sarpras@um.ac.id", "wrong_pass");
  assertTest(
    authFailed.success === false && authFailed.user === null,
    "Auth & RBAC 3: Penolakan Password Salah",
    `Pesan Error: ${authFailed.error}`
  );

  // Verifikasi Hak Akses: Staf Sarpras punya hak kendali aktuator & simulator
  const sarprasUser = REGISTERED_USERS[0];
  const mhsUser = REGISTERED_USERS[1];
  assertTest(
    checkPermission(sarprasUser, "canControlActuators") === true &&
    checkPermission(sarprasUser, "canAccessSimulator") === true &&
    checkPermission(sarprasUser, "canAccessAuditManagement") === true,
    "Auth & RBAC 4: Hak Akses Penuh Staf Sarpras (Admin)",
    "canControlActuators: true, canAccessSimulator: true"
  );

  // Verifikasi Pembatasan Hak Akses: Mahasiswa TIDAK berhak mematikan AC & mengutak-atik simulator
  assertTest(
    checkPermission(mhsUser, "canControlActuators") === false &&
    checkPermission(mhsUser, "canAccessSimulator") === false &&
    checkPermission(mhsUser, "canBookRooms") === true,
    "Auth & RBAC 5: Hak Akses Terbatas Mahasiswa",
    "canControlActuators: false (Aman), canBookRooms: true"
  );

  // Verifikasi Penguncian Total Sebelum Login (Mandatory Login Gate): Unauthenticated (null)
  const unauthenticatedUser = null;
  assertTest(
    unauthenticatedUser === null &&
    verifySessionIntegrity(unauthenticatedUser) === false &&
    verifySessionIntegrity(GUEST_USER) === false &&
    checkPermission(unauthenticatedUser, "canBookRooms") === false &&
    checkPermission(unauthenticatedUser, "canControlActuators") === false &&
    checkPermission(unauthenticatedUser, "canManageRooms") === false &&
    checkPermission(unauthenticatedUser, "canAccessSimulator") === false,
    "Auth & RBAC 6: State Awal Belum Login adalah Unauthenticated (null) & Terkunci Total",
    "currentUser: null, verifySessionIntegrity: false, All Permissions: false"
  );

  // Verifikasi Hak Tambah / Hapus Ruangan (canManageRooms)
  assertTest(
    checkPermission(sarprasUser, "canManageRooms") === true &&
    checkPermission(mhsUser, "canManageRooms") === false &&
    checkPermission(unauthenticatedUser, "canManageRooms") === false,
    "Auth & RBAC 7: Hak Pengelolaan Ruangan (canManageRooms)",
    "Sarpras: true, Mahasiswa: false, Unauthenticated: false"
  );

  // --------------------------------------------------------------------------
  // 14a. REGISTRASI AKUN BARU (SIGN UP)
  // --------------------------------------------------------------------------
  console.log("\n📝 Menguji Registrasi Akun Baru (Sign Up)...");

  // 1. Pendaftaran Akun Mahasiswa Baru
  const regResult = await registerUser({
    name: "Yudhistira Baraendra Rafi",
    identifier: "240535615714",
    email: "rafi.test2026@students.um.ac.id",
    role: "mahasiswa",
    password: "mhsPassword123",
  });

  assertTest(
    regResult.success === true &&
    regResult.user.role === "mahasiswa" &&
    regResult.user.name === "Yudhistira Baraendra Rafi" &&
    verifySessionIntegrity(regResult.user) === true &&
    typeof regResult.user.password === "undefined" &&
    typeof regResult.user.passwordHash === "undefined",
    "Auth & Registrasi 1: Pendaftaran Akun Baru Berhasil & Menghasilkan Sesi Bertanda Tangan",
    `User: ${regResult.user?.name} (${regResult.user?.role})`
  );

  // 2. Akun Baru Dapat Logout lalu Login Kembali via Email & NIM
  const reAuthEmail = await authenticateUser("rafi.test2026@students.um.ac.id", "mhsPassword123");
  const reAuthNim = await authenticateUser("240535615714", "mhsPassword123");
  assertTest(
    reAuthEmail.success === true &&
    reAuthNim.success === true &&
    reAuthEmail.user.role === "mahasiswa" &&
    reAuthNim.user.name === "Yudhistira Baraendra Rafi",
    "Auth & Registrasi 2: Akun Baru Dapat Login Kembali via Email atau NIM",
    `Email Login: ${reAuthEmail.success}, NIM Login: ${reAuthNim.success}`
  );

  // 3. Penolakan Registrasi Duplikat & Password < 6 Karakter
  const dupReg = await registerUser({
    name: "Mahasiswa Kloning",
    identifier: "240535615714",
    email: "rafi.test2026@students.um.ac.id",
    role: "mahasiswa",
    password: "validPassword123",
  });
  const shortPassReg = await registerUser({
    name: "User Password Pendek",
    identifier: "9900112233",
    email: "shortpass@um.ac.id",
    role: "mahasiswa",
    password: "123",
  });
  assertTest(
    dupReg.success === false &&
    shortPassReg.success === false,
    "Auth & Registrasi 3: Penolakan Email/NIM Duplikat & Password < 6 Karakter",
    `Dup Error: ${dupReg.error} | Short Error: ${shortPassReg.error}`
  );

  // --------------------------------------------------------------------------
  // 14b. SECURITY AUDIT: Kredensial Bersih, Sesi Bertanda Tangan, & Anti-Tampering
  // --------------------------------------------------------------------------
  console.log("\n🛡️ Menguji Audit Keamanan & Integritas Sesi...");

  // 1. Verifikasi Tidak Ada Plaintext Password di REGISTERED_USERS
  const hasPlaintextPassword = REGISTERED_USERS.some((u) => typeof u.password !== "undefined");
  assertTest(
    hasPlaintextPassword === false &&
    typeof sarprasUser.passwordHash === "string" &&
    typeof sarprasUser.salt === "string",
    "Security Audit 1: Bebas Password Plaintext di Kode Sumber",
    "Hanya Hash SHA-256 + Salt yang Tersimpan"
  );

  // 2. Verifikasi Integritas Sesi Bertanda Tangan Kriptografis
  const validAdminSession = createSignedSession(sarprasUser, 2);
  assertTest(
    verifySessionIntegrity(validAdminSession) === true &&
    typeof validAdminSession.signatureHash === "string" &&
    validAdminSession.expiresAt > Date.now(),
    "Security Audit 2a: Pembuatan Sesi Bertanda Tangan Digital Berhasil",
    `Signature: ${validAdminSession.signatureHash.slice(0, 16)}...`
  );

  // 3. Uji Anti-Tampering: Serangan manipulasi role secara paksa di storage
  const tamperedSession = {
    ...validAdminSession,
    role: "guest",
  };
  assertTest(
    verifySessionIntegrity(tamperedSession) === false,
    "Security Audit 2b: Anti-Tampering Berhasil Menolak Manipulasi Role DevTools",
    "Pemeriksaan Checksum Integritas Gagal Sesuai Harapan"
  );

  // 4. Uji Kedaluwarsa Sesi (Expiring Signed Session Token)
  const expiredSession = {
    ...validAdminSession,
    expiresAt: Date.now() - 5000,
  };
  assertTest(
    verifySessionIntegrity(expiredSession) === false,
    "Security Audit 2c: Penolakan Sesi yang Telah Kedaluwarsa",
    "Expiring Session Token Berhasil Divalidasi"
  );

  // 5. Uji Parameter Auth URL (?auth=<idToken>)
  const cleanEndpoint = "https://classsense-6ef75-default-rtdb.asia-southeast1.firebasedatabase.app/rooms.json";
  const urlWithoutAuth = buildFirebaseEndpoint(cleanEndpoint, null);
  const testIdToken = "firebase_jwt_token_sample_12345";
  const urlWithAuth = buildFirebaseEndpoint(cleanEndpoint, testIdToken);
  assertTest(
    urlWithoutAuth === cleanEndpoint &&
    urlWithAuth.includes("?auth=firebase_jwt_token_sample_12345"),
    "Security Audit 3: Operasi Tulis Firebase Menyertakan ?auth=<idToken>",
    `Target: ${urlWithAuth}`
  );

  // --------------------------------------------------------------------------
  // 15. FIREBASE RTDB: Smart URL Normalizer (Firebase Console Link -> REST JSON)
  // --------------------------------------------------------------------------
  console.log("\n🔥 Menguji Firebase RTDB URL Normalizer...");
  const consoleLink = "https://console.firebase.google.com/u/2/project/classsense-6ef75/database/classsense-6ef75-default-rtdb/data/~2F";
  const normalizedConsole = normalizeFirebaseUrl(consoleLink);
  assertTest(
    normalizedConsole.dbName === "classsense-6ef75-default-rtdb" &&
    normalizedConsole.collectionUrl.includes("classsense-6ef75-default-rtdb") &&
    normalizedConsole.collectionUrl.endsWith("/rooms.json"),
    "Firebase RTDB 1: Ekstraksi URL Console Firebase ke REST Endpoint",
    `Db: ${normalizedConsole.dbName}, Endpoint: ${normalizedConsole.collectionUrl}`
  );

  const directBase = "https://classsense-6ef75-default-rtdb.asia-southeast1.firebasedatabase.app";
  const normalizedDirect = normalizeFirebaseUrl(directBase);
  assertTest(
    normalizedDirect.collectionUrl === "https://classsense-6ef75-default-rtdb.asia-southeast1.firebasedatabase.app/rooms.json" &&
    normalizedDirect.itemUrlFn("B12-204") === "https://classsense-6ef75-default-rtdb.asia-southeast1.firebasedatabase.app/rooms/B12-204.json",
    "Firebase RTDB 2: Resolusi Base URL ke Koleksi dan Dokumen Tunggal",
    `Single Item: ${normalizedDirect.itemUrlFn("B12-204")}`
  );

  // --------------------------------------------------------------------------
  // 16. FIREBASE RTDB: Penambahan Ruangan Baru (+ Tambah Ruangan)
  // --------------------------------------------------------------------------
  console.log("🔥 Menguji addRoomToApi (Penambahan Ruangan Baru & Kalkulasi On-Device)...");
  const testRoomInput = {
    code: "B12-999",
    name: "Lab Robotika Lanjut B12",
    building: "Gedung B12 FT (DTEI)",
    buildingCode: "B12",
    floor: "Lantai 3",
    category: "Lab Komputer / IoT",
    capacity: 35,
    occupancyCount: 0,
    temp: 23.0,
    humidity: 50,
    co2: 440,
    pm25: 8.5,
    lux: 410,
    acActive: true,
    lightsActive: true,
    facilities: ["WiFi 6", "Smart TV 75\"", "Workstation GPU", "LoRa Node"],
  };

  let addRoomRequest;
  const addRoomResult = await withMockApi(
    async (url, options) => {
      addRoomRequest = { url, options };
      return jsonResponse({});
    },
    () => addRoomToApi(testRoomInput)
  );
  assertTest(
    addRoomResult.success === true &&
    addRoomResult.mode === "firebase-synced" &&
    addRoomResult.data.code === "B12-999" &&
    typeof addRoomResult.data.aqi === "number" &&
    typeof addRoomResult.data.heatIndex === "number" &&
    typeof addRoomResult.data.distanceMeters === "number" &&
    addRoomRequest.options.method === "PUT" &&
    addRoomRequest.url === `${MOCK_FIREBASE_URL}/rooms/B12-999.json`,
    "Firebase RTDB 3: addRoomToApi dengan On-Device Compute Berjalan Nyata",
    `Ruangan: ${addRoomResult.data.code}, AQI: ${addRoomResult.data.aqi}, Jarak: ${addRoomResult.data.distanceMeters}m`
  );

  // --------------------------------------------------------------------------
  // 17. FIREBASE RTDB: Penghapusan Ruangan (Delete Room)
  // --------------------------------------------------------------------------
  console.log("🔥 Menguji deleteRoomFromApi...");
  let deleteRoomRequest;
  const deleteRoomResult = await withMockApi(
    async (url, options) => {
      deleteRoomRequest = { url, options };
      return jsonResponse({});
    },
    () => deleteRoomFromApi("B12-999")
  );
  assertTest(
    deleteRoomResult.success === true &&
    deleteRoomResult.mode === "firebase-deleted" &&
    deleteRoomResult.roomId === "B12-999" &&
    deleteRoomRequest.options.method === "DELETE" &&
    deleteRoomRequest.url === `${MOCK_FIREBASE_URL}/rooms/B12-999.json`,
    "Firebase RTDB 4: deleteRoomFromApi (Penghapusan Ruangan)",
    `Deleted Room ID: ${deleteRoomResult.roomId}`
  );

  console.log("\n================================================================================");
  console.log(`🎉 HASIL PENGUJIAN: ${passedTests}/${totalTests} TESTS BERHASIL DENGAN SEMPURNA!`);
  console.log("================================================================================\n");
}

runTestSuite().catch((err) => {
  console.error("FATAL ERROR IN TEST SUITE:", err);
  process.exit(1);
});
