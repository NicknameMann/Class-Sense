import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Home,
  Building2,
  LineChart,
  Zap,
  Search,
  Bell,
  Wind,
  Thermometer,
  Droplets,
  Users,
  Navigation,
  Power,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Sliders,
  CheckCircle2,
  Clock,
  MapPin,
  Bookmark,
  Share2,
  X,
  Play,
  Pause,
  ChevronRight,
  Flame,
  ShieldCheck,
  Sun,
  Activity,
  Layers,
  Map,
  ListFilter,
  Check,
  Calendar,
  Send,
  SlidersHorizontal,
  Info,
  Maximize2,
  Globe,
  CloudSun,
  Wifi,
} from "lucide-react";

import {
  calculateEPA_AQI,
  calculateHeatIndex,
  rankRoomsSAW,
  calculateHaversineDistance,
  fuzzySearchRooms,
  downsampleLTTB,
  smoothOccupancyEMA,
  evaluateEnergyAnomalies,
  computeRoomStateDiff,
  evaluateAirQualityAlert,
} from "./utils/mobileCompute";

import {
  CURRENT_USER_LOCATION,
  RAW_CAMPUS_ROOMS,
  INITIAL_ANALYTICS_SERIES,
  enrichRoomsWithMobileCompute,
  fetchCampusOutdoorClimate,
  fetchRoomsFromApi,
  syncActuatorToApi,
  DEFAULT_OUTDOOR_CLIMATE,
} from "./services/iotSimulatorApi";

export default function App() {
  // Navigation State (4 Tab Utama Sesuai Pemetaan PDF)
  // Tab 1: beranda (PDF Hal 2)
  // Tab 2: ruangan (PDF Hal 1)
  // Tab 3: analitik (PDF Hal 3)
  // Tab 4: audit (PDF Hal 4)
  const [activeTab, setActiveTab] = useState("beranda");

  // State Ruangan Mentah (IoT Sensing Layer ESP32 Simulation)
  const [rawRooms, setRawRooms] = useState(() => {
    const saved = localStorage.getItem("classsense_rooms");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return RAW_CAMPUS_ROOMS;
  });

  // User GPS Coordinate (Simulasi posisi mahasiswa)
  const [userLocation, setUserLocation] = useState(CURRENT_USER_LOCATION);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedBuilding, setSelectedBuilding] = useState("Semua Gedung");
  const [roomStatusFilter, setRoomStatusFilter] = useState("Semua"); // "Semua" | "Kosong" | "Terisi"
  const [roomViewMode, setRoomViewMode] = useState("daftar"); // "daftar" | "denah"
  const [selectedAnalyticsRoomId, setSelectedAnalyticsRoomId] = useState("A-101");
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState("harian"); // "harian" | "mingguan"

  // Algoritma 3: Bobot Preferensi SAW yang dapat diubah dinamis oleh pengguna
  const [sawWeights, setSawWeights] = useState({
    occupancy: 0.35,
    temp: 0.25,
    aqi: 0.20,
    distance: 0.20,
  });
  const [showWeightModal, setShowWeightModal] = useState(false);

  // Algoritma 7: Nilai EMA Smoothing Okupansi sebelumnya
  const [emaOccupancyState, setEmaOccupancyState] = useState({});

  // Algoritma 10: Alert Engine Rate Limiting State (Cooldown 15 menit)
  const [lastAlertTime, setLastAlertTime] = useState(0);
  const [alertBannerVisible, setAlertBannerVisible] = useState(true);
  const [activeCriticalAlert, setActiveCriticalAlert] = useState(null);

  // State Interaktif: Favorit, Booking, dan Laporan
  const [favoriteRoomIds, setFavoriteRoomIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("classsense_favorites") || '["A-101"]');
    } catch {
      return ["A-101"];
    }
  });
  const [toastMessage, setToastMessage] = useState(null);
  const [bookingModalRoom, setBookingModalRoom] = useState(null);
  const [navigationModalRoom, setNavigationModalRoom] = useState(null);
  const [reportModalRoom, setReportModalRoom] = useState(null);
  const [reportForm, setReportForm] = useState({ category: "AC Kurang Dingin", notes: "" });

  // Simulator IoT Controller Drawer (Demo Dosen Mode)
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isAutoStreaming, setIsAutoStreaming] = useState(true);
  const [streamingSpeedSec, setStreamingSpeedSec] = useState(4);
  const [selectedSimulatorRoomId, setSelectedSimulatorRoomId] = useState("B-201");
  const [lastDiffStats, setLastDiffStats] = useState({ changedCount: 0, time: "Baru saja" });

  // REST API State (Open-Meteo Weather & Cloud Telemetry Endpoint)
  const [outdoorClimate, setOutdoorClimate] = useState(DEFAULT_OUTDOOR_CLIMATE);
  const [apiConnectionStatus, setApiConnectionStatus] = useState({
    isConnected: true,
    isLive: false,
    source: "Menghubungkan ke Open-Meteo REST API...",
    lastSyncTime: "Menghubungkan...",
    isSyncing: false,
  });

  // Simpan ke LocalStorage saat ada perubahan
  useEffect(() => {
    localStorage.setItem("classsense_rooms", JSON.stringify(rawRooms));
  }, [rawRooms]);

  useEffect(() => {
    localStorage.setItem("classsense_favorites", JSON.stringify(favoriteRoomIds));
  }, [favoriteRoomIds]);

  // Toast Helper
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  // Fungsi Sinkronisasi Nyata HTTP REST API (Open-Meteo & Cloud IoT)
  const syncAllApis = useCallback(async (manual = false) => {
    setApiConnectionStatus((prev) => ({ ...prev, isSyncing: true }));
    try {
      // 1. HTTP GET ke Open-Meteo Weather & Air Quality API
      const climate = await fetchCampusOutdoorClimate(7000);
      setOutdoorClimate(climate);

      // 2. HTTP GET ke Cloud REST Telemetry Endpoint (jika ada VITE_IOT_API_URL)
      const cloudRooms = await fetchRoomsFromApi(5000);
      if (cloudRooms.isLiveApi && Array.isArray(cloudRooms.data) && cloudRooms.data.length > 0) {
        setRawRooms(cloudRooms.data);
      }

      setApiConnectionStatus({
        isConnected: true,
        isLive: climate.isLive || cloudRooms.isLiveApi,
        source: cloudRooms.isLiveApi ? cloudRooms.source : climate.source,
        lastSyncTime: climate.lastSync,
        isSyncing: false,
      });

      if (manual) {
        showToast(
          climate.isLive
            ? `Sinkronisasi REST API Berhasil! Iklim Luar UM: ${climate.temp}°C, AQI: ${climate.usAqi}`
            : "Sinkronisasi selesai (Mode Fallback Terkalibrasi)."
        );
      }
    } catch (err) {
      setApiConnectionStatus((prev) => ({
        ...prev,
        isSyncing: false,
        source: "Open-Meteo Cache (Offline Fallback)",
      }));
      if (manual) showToast("Sinkronisasi gagal, menggunakan cache lokal.");
    }
  }, [showToast]);

  // Initial Sync & Periodic Sync (tiap 60 detik)
  useEffect(() => {
    syncAllApis(false);
    const interval = setInterval(() => {
      syncAllApis(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [syncAllApis]);

  // --------------------------------------------------------------------------
  // STREAMING TELEMETRI IOT OTOMATIS (SETIAP 4 DETIK)
  // Menyimulasikan transmisi data sensor nirkabel dari mikrokontroler ESP32
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isAutoStreaming) return;

    const interval = setInterval(() => {
      setRawRooms((prevRooms) => {
        const updated = prevRooms.map((room) => {
          // Variasi alami sensor DHT22 & MQ-135
          const tempJitter = Number(((Math.random() - 0.5) * 0.15).toFixed(1));
          const newTemp = Number(Math.max(16, Math.min(32, room.temp + tempJitter)).toFixed(1));

          const humJitter = Math.round((Math.random() - 0.5) * 2);
          const newHumidity = Math.max(30, Math.min(95, room.humidity + humJitter));

          let newCo2 = room.co2;
          // Pertahankan lonjakan jika ruangan tertentu sengaja disimulasikan kritis
          if (room.id === "R-204" && room.co2 >= 1100) {
            newCo2 = Math.max(1050, Math.min(1300, room.co2 + Math.round((Math.random() - 0.5) * 10)));
          } else {
            newCo2 = Math.max(380, Math.min(1500, room.co2 + Math.round((Math.random() - 0.5) * 6)));
          }

          const newPm25 = Number(Math.max(1.0, Math.min(100.0, room.pm25 + (Math.random() - 0.5) * 0.4)).toFixed(1));

          // Algoritma 7: Terapkan Exponential Moving Average (EMA) untuk Okupansi PIR
          const rawSignal = (room.occupancyCount || 0) > 0 ? 1 : 0;
          const prevEma = emaOccupancyState[room.id]?.smoothedValue ?? rawSignal;
          const { smoothedValue, isOccupiedStable } = smoothOccupancyEMA(rawSignal, prevEma, 0.35);

          return {
            ...room,
            temp: newTemp,
            humidity: newHumidity,
            co2: newCo2,
            pm25: newPm25,
            emaOccupancy: smoothedValue,
            isOccupied: isOccupiedStable,
          };
        });

        // Algoritma 9: Evaluasi State Diffing (Myers Diff / selective check)
        const { changedIds } = computeRoomStateDiff(prevRooms, updated);
        setLastDiffStats({
          changedCount: changedIds.length,
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        });

        return updated;
      });
    }, streamingSpeedSec * 1000);

    return () => clearInterval(interval);
  }, [isAutoStreaming, streamingSpeedSec, emaOccupancyState]);

  // --------------------------------------------------------------------------
  // ON-DEVICE MOBILE COMPUTE: PERKAYA DATA RUANGAN DENGAN 10 ALGORITMA
  // --------------------------------------------------------------------------
  const computedRooms = useMemo(() => {
    return enrichRoomsWithMobileCompute(rawRooms, userLocation);
  }, [rawRooms, userLocation]);

  // Algoritma 10: Evaluasi Rate-Limiting Alert Engine Kualitas Udara
  useEffect(() => {
    const alertResult = evaluateAirQualityAlert(computedRooms, lastAlertTime, 15 * 60 * 1000);
    if (alertResult.criticalRoom) {
      setActiveCriticalAlert(alertResult.criticalRoom);
      if (alertResult.shouldTrigger) {
        setAlertBannerVisible(true);
        setLastAlertTime(alertResult.nextTimestamp);
      }
    } else {
      setActiveCriticalAlert(null);
    }
  }, [computedRooms, lastAlertTime]);

  // Algoritma 3: Perankingan SAW Rekomendasi Ruang Terbaik
  const rankedRooms = useMemo(() => {
    return rankRoomsSAW(computedRooms, sawWeights);
  }, [computedRooms, sawWeights]);

  // Ruangan Best Match (#1)
  const bestMatchRoom = rankedRooms[0] || computedRooms[0];
  const secondaryRecommended = rankedRooms.slice(1, 3);

  // Algoritma 5: Fuzzy Search toleran typo (Levenshtein Distance <= 2 edit)
  const filteredRooms = useMemo(() => {
    let result = computedRooms;

    // Filter Gedung
    if (selectedBuilding !== "Semua Gedung") {
      result = result.filter((r) => r.buildingCode === selectedBuilding.replace("Gedung ", ""));
    }

    // Filter Kategori (Beranda / Ruangan)
    if (selectedCategory === "Dekat Saya") {
      result = [...result].sort((a, b) => a.distanceMeters - b.distanceMeters);
    } else if (selectedCategory === "Lab Komputer") {
      result = result.filter((r) => r.category.toLowerCase().includes("lab"));
    } else if (selectedCategory === "Ruang Seminar") {
      result = result.filter((r) => r.category.toLowerCase().includes("seminar"));
    } else if (selectedCategory === "Ruang Teori") {
      result = result.filter((r) => r.category.toLowerCase().includes("teori"));
    }

    // Filter Status Ruangan (Semua / Kosong / Terisi)
    if (roomStatusFilter === "Kosong") {
      result = result.filter((r) => !r.isOccupied);
    } else if (roomStatusFilter === "Terisi") {
      result = result.filter((r) => r.isOccupied);
    }

    // Algoritma 5 Levenshtein
    if (searchQuery.trim()) {
      result = fuzzySearchRooms(result, searchQuery, 2);
    }

    return result;
  }, [computedRooms, selectedBuilding, selectedCategory, roomStatusFilter, searchQuery]);

  // Algoritma 8: Forward-Chaining Rule Anomali Pemborosan Energi (Tab 4)
  const anomalyRooms = useMemo(() => {
    return evaluateEnergyAnomalies(computedRooms, 30);
  }, [computedRooms]);

  // Filter Kategori Anomali pada Tab 4
  const [anomalyFilter, setAnomalyFilter] = useState("Semua");
  const filteredAnomalies = useMemo(() => {
    if (anomalyFilter === "AC") {
      return anomalyRooms.filter((r) => r.anomalyType === "AC_WASTE");
    }
    if (anomalyFilter === "Lampu") {
      return anomalyRooms.filter((r) => r.anomalyType === "LIGHT_WASTE");
    }
    return anomalyRooms;
  }, [anomalyRooms, anomalyFilter]);

  // Hitung Skor Kampus & Potensi Hemat Energi
  const campusEnergyScore = useMemo(() => {
    const totalPotentialWastedKwh = anomalyRooms.reduce((acc, curr) => acc + (curr.wastedKwh || 0), 0);
    // Jika semua anomali mati, skor 98%
    if (anomalyRooms.length === 0) return { score: 98, grade: "A+" };
    const penalty = Math.min(30, anomalyRooms.length * 4);
    const score = Math.max(70, 98 - penalty);
    let grade = "B+";
    if (score >= 90) grade = "A";
    else if (score >= 80) grade = "B+";
    else grade = "B";
    return { score, grade, totalKwh: totalPotentialWastedKwh.toFixed(1) };
  }, [anomalyRooms]);

  // Ruangan yang sedang dilihat di Tab 3 Analitik
  const currentAnalyticsRoom = useMemo(() => {
    return computedRooms.find((r) => r.id === selectedAnalyticsRoomId) || computedRooms[0];
  }, [computedRooms, selectedAnalyticsRoomId]);

  // Algoritma 6: Downsampling LTTB untuk Grafik Historis di Tab 3 Analitik
  const downsampledChartData = useMemo(() => {
    // Ambil data deret waktu mentah 33-48 titik
    const rawData = INITIAL_ANALYTICS_SERIES.map((pt) => {
      // Sesuaikan offset dengan suhu ruangan saat ini agar grafik realistis
      const baseOffset = (currentAnalyticsRoom.temp - 23.2);
      return {
        ...pt,
        temp: Number((pt.temp + baseOffset).toFixed(1)),
        aqi: Math.max(10, Math.min(150, Math.round(pt.aqi * (currentAnalyticsRoom.aqi / 22)))),
      };
    });

    // Terapkan LTTB: Reduksi menjadi 10 representatif titik untuk canvas mobile yang mulus
    return downsampleLTTB(rawData, 10);
  }, [currentAnalyticsRoom]);

  // --------------------------------------------------------------------------
  // HANDLERS KONTROL AKSI JARAK JAUH & DEMO
  // --------------------------------------------------------------------------
  const handleTurnOffSingleAC = async (roomId) => {
    setRawRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, acActive: false, temp: 24.5 } : r))
    );
    await syncActuatorToApi(roomId, { acActive: false, temp: 24.5 });
    showToast(`AC pada ruangan ${roomId} berhasil dimatikan (HTTP Sync).`);
  };

  const handleTurnOffAllAC = async () => {
    setRawRooms((prev) =>
      prev.map((r) => (!r.isOccupied ? { ...r, acActive: false, temp: 24.5 } : r))
    );
    await Promise.all(
      anomalyRooms.map((r) => syncActuatorToApi(r.id, { acActive: false, temp: 24.5 }))
    );
    showToast("Semua AC di ruangan kosong berhasil dipadamkan sekaligus (HTTP Sync)!");
  };

  const handleTurnOffCorridorLamps = async () => {
    setRawRooms((prev) =>
      prev.map((r) => (r.id === "K-WEST" ? { ...r, lightsActive: false, lux: 420 } : r))
    );
    await syncActuatorToApi("K-WEST", { lightsActive: false, lux: 420 });
    showToast("Lampu Koridor Sayap Barat berhasil dipadamkan (HTTP Sync)!");
  };

  const toggleFavoriteRoom = (roomId) => {
    setFavoriteRoomIds((prev) => {
      const exists = prev.includes(roomId);
      const next = exists ? prev.filter((id) => id !== roomId) : [...prev, roomId];
      showToast(exists ? "Dihapus dari Ruangan Favorit" : "Ditambahkan ke Ruangan Favorit");
      return next;
    });
  };

  const handleBookRoom = async (room) => {
    const updatePayload = {
      isOccupied: true,
      occupancyCount: 1,
      scheduleInfo: "Digunakan oleh Anda (Belajar Mandiri)",
    };
    setRawRooms((prev) =>
      prev.map((r) =>
        r.id === room.id
          ? {
              ...r,
              ...updatePayload,
            }
          : r
      )
    );
    await syncActuatorToApi(room.id, updatePayload);
    setBookingModalRoom(null);
    showToast(`Ruangan ${room.code} berhasil dipesan dan siap digunakan (HTTP Sync)!`);
  };

  const handleSubmitReport = (e) => {
    e.preventDefault();
    showToast(`Laporan terkait ${reportModalRoom?.name} terkirim ke Tim Sarpras FT.`);
    setReportModalRoom(null);
    setReportForm({ category: "AC Kurang Dingin", notes: "" });
  };

  // Demo Scenarios Preset untuk Dosen
  const handleTriggerPreset = (type) => {
    if (type === "co2_hazard") {
      setRawRooms((prev) =>
        prev.map((r) =>
          r.id === "R-204"
            ? { ...r, co2: 1150, pm25: 42.5, isOccupied: true, occupancyCount: 48 }
            : r
        )
      );
      setAlertBannerVisible(true);
      showToast("Preset Dimuat: Kadar CO2 R-204 dinaikkan ke 1.150 ppm (Kritis)!");
    } else if (type === "freeze_empty") {
      setRawRooms((prev) =>
        prev.map((r) =>
          r.id === "B-302"
            ? { ...r, isOccupied: false, occupancyCount: 0, acActive: true, temp: 19.5, emptyDurationMins: 165 }
            : r
        )
      );
      showToast("Preset Dimuat: B-302 Kosong dibekukan ke 19.5°C dengan AC Aktif!");
    } else if (type === "pir_noise") {
      // Simulasikan spike instan
      setRawRooms((prev) =>
        prev.map((r) =>
          r.id === "A-101"
            ? { ...r, occupancyCount: Math.random() > 0.5 ? 2 : 0 }
            : r
        )
      );
      showToast("Preset Dimuat: Noise sensor PIR diinjeksikan untuk diuji oleh EMA!");
    } else if (type === "gps_walk") {
      // Pindahkan lokasi mahasiswa mendekat ke Gedung B
      setUserLocation({
        lat: -7.96135,
        lon: 112.61775,
        name: "Di Depan Gedung B (Lantai 2)",
      });
      showToast("Preset Dimuat: Posisi GPS mahasiswa dipindahkan mendekat ke Gedung B!");
    } else if (type === "normal") {
      setRawRooms(RAW_CAMPUS_ROOMS);
      setUserLocation(CURRENT_USER_LOCATION);
      setAlertBannerVisible(true);
      showToast("Kondisi Smart Campus FT dikembalikan ke parameter standar.");
    }
  };

  // Statistik Real-Time Kampus
  const totalEmpty = computedRooms.filter((r) => !r.isOccupied).length;
  const totalOccupied = computedRooms.filter((r) => r.isOccupied).length;
  const averageTemp = (
    computedRooms.reduce((sum, r) => sum + r.temp, 0) / (computedRooms.length || 1)
  ).toFixed(1);
  const averageAqi = Math.round(
    computedRooms.reduce((sum, r) => sum + r.aqi, 0) / (computedRooms.length || 1)
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-800 flex justify-center selection:bg-teal-500 selection:text-white">
      {/* Mobile Shell Frame (Pixel-Perfect Mobile Width max 430px) */}
      <div className="w-full max-w-[430px] bg-slate-50 min-h-screen flex flex-col relative shadow-2xl overflow-x-hidden font-sans pb-20">

        {/* ==================================================================== */}
        {/* GLOBAL TOP APP BAR (Sticky Header)                                 */}
        {/* ==================================================================== */}
        <header className="bg-white px-4 py-3 border-b border-slate-100 sticky top-0 z-30 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-700/20">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-tight">
                  ClassSense
                </h1>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-800 uppercase tracking-wider">
                  IoT Demo
                </span>
              </div>
              <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 leading-none mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Gedung FT &amp; Sains UM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bell Notifikasi dengan status kritis */}
            <button
              onClick={() => {
                if (activeCriticalAlert) {
                  setAlertBannerVisible(true);
                  showToast(`Kondisi kritis di ${activeCriticalAlert.code}: CO2 ${activeCriticalAlert.co2} ppm`);
                } else {
                  showToast("Semua ruangan saat ini dalam batas kualitas udara aman.");
                }
              }}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 relative hover:bg-slate-200 transition"
              title="Notifikasi Kualitas Udara"
            >
              <Bell className="w-4 h-4" />
              {activeCriticalAlert && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white ring-2 ring-red-400/40 animate-ping"></span>
              )}
            </button>

            {/* Profile Avatar Mahasiswa */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-xs">
              UM
            </div>
          </div>
        </header>

        {/* ==================================================================== */}
        {/* LIVE REST API SYNCHRONIZATION STATUS BAR                           */}
        {/* ==================================================================== */}
        <div className="bg-slate-900 text-slate-100 px-3.5 py-1.5 flex items-center justify-between text-[10px] border-b border-slate-800">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                apiConnectionStatus.isLive ? "bg-emerald-400 animate-pulse" : "bg-teal-400"
              }`}
            ></span>
            <span className="font-semibold text-slate-200 truncate">
              {apiConnectionStatus.isLive
                ? "API Connected • Open-Meteo & IoT Telemetry Sync"
                : "API Standby • Open-Meteo & IoT Telemetry Sync"}
            </span>
            <span className="text-slate-400 text-[9px] shrink-0">
              ({apiConnectionStatus.lastSyncTime})
            </span>
          </div>
          <button
            onClick={() => syncAllApis(true)}
            disabled={apiConnectionStatus.isSyncing}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-teal-300 font-bold px-2 py-0.5 rounded-md transition shrink-0 ml-1.5"
            title="Sinkronisasi Ulang HTTP REST API"
          >
            <RefreshCw
              className={`w-2.5 h-2.5 ${apiConnectionStatus.isSyncing ? "animate-spin text-amber-400" : ""}`}
            />
            <span>{apiConnectionStatus.isSyncing ? "Syncing..." : "Sync API Sekarang"}</span>
          </button>
        </div>

        {/* ==================================================================== */}
        {/* TOAST NOTIFICATION FLOATING BANNER                                   */}
        {/* ==================================================================== */}
        {toastMessage && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[390px] animate-in fade-in slide-in-from-top duration-200">
            <div className="bg-slate-900/95 text-white px-3.5 py-2.5 rounded-2xl shadow-xl border border-slate-700/60 flex items-center justify-between text-xs backdrop-blur-md">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium text-slate-100 leading-snug">{toastMessage}</span>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 1: BERANDA (PDF Halaman 2)                                       */}
        {/* ==================================================================== */}
        {activeTab === "beranda" && (
          <main className="flex-1 p-4 space-y-4 animate-in fade-in duration-150">
            {/* 1. Kotak Pencarian Fuzzy (Algoritma 5: Levenshtein Distance) */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama ruangan, gedung, lab, fasilitas..."
                className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 2. Filter Kategori Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {[
                { id: "Semua", label: "Semua" },
                { id: "Dekat Saya", label: "Dekat Saya" },
                { id: "Lab Komputer", label: "Lab Komputer" },
                { id: "Ruang Seminar", label: "Ruang Seminar" },
                { id: "Ruang Teori", label: "Ruang Teori" },
              ].map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* 3. Peringatan Kualitas Udara CO2 Tinggi (Algoritma 10 Alert Engine) */}
            {alertBannerVisible && activeCriticalAlert && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/80 rounded-2xl p-3.5 shadow-xs relative">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Wind className="w-4 h-4 animate-bounce" />
                  </div>
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-red-950">
                        Peringatan Kualitas Udara
                      </h4>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-red-600 text-white uppercase tracking-wider">
                        CO2 Tinggi
                      </span>
                    </div>
                    <p className="text-[11px] text-red-800 font-medium leading-relaxed mt-1">
                      Kadar CO2 di <b>{activeCriticalAlert.name}</b> mencapai{" "}
                      <b className="text-red-900 font-bold">{activeCriticalAlert.co2.toLocaleString()} ppm</b> (Batas Aman: &lt; 800 ppm). Ventilasi otomatis diaktifkan.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedAnalyticsRoomId(activeCriticalAlert.id);
                        setActiveTab("analitik");
                      }}
                      className="text-[11px] font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1 mt-2 group"
                    >
                      <span>Lihat Detail Sensor</span>
                      <ChevronRight className="w-3.5 h-3.5 transition group-hover:translate-x-0.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => setAlertBannerVisible(false)}
                    className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-700 p-1"
                    title="Tutup Peringatan"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* 4. Status Kampus Real-Time (Card 4 Metrik) */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                    Status Sensor Simulasi
                  </h3>
                </div>
                <span className="text-[10px] font-medium text-slate-500">
                  Pembaruan: Baru saja
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-emerald-50/80 border border-emerald-100/80 py-2 px-1 rounded-xl">
                  <span className="text-lg font-black text-emerald-700 block leading-tight">
                    {totalEmpty}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-600">Kosong</span>
                </div>
                <div className="bg-red-50/80 border border-red-100/80 py-2 px-1 rounded-xl">
                  <span className="text-lg font-black text-red-600 block leading-tight">
                    {totalOccupied}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-600">Terisi</span>
                </div>
                <div className="bg-sky-50/80 border border-sky-100/80 py-2 px-1 rounded-xl">
                  <span className="text-lg font-black text-sky-700 block leading-tight">
                    {averageTemp}°
                  </span>
                  <span className="text-[10px] font-semibold text-slate-600">Rata Suhu</span>
                </div>
                <div className="bg-teal-50/80 border border-teal-100/80 py-2 px-1 rounded-xl">
                  <span className="text-lg font-black text-teal-700 block leading-tight">
                    {averageAqi}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-600">AQI (Baik)</span>
                </div>
              </div>
            </div>

            {/* Kalibrasi Iklim Luar Kampus UM (Live REST API Open-Meteo) */}
            <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-sky-950 text-white p-3.5 rounded-2xl shadow-xs border border-teal-700/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-[11px] font-extrabold text-teal-200 tracking-tight">
                    Kalibrasi Iklim Luar Kampus UM (Live REST API)
                  </span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  {outdoorClimate.isLive ? "HTTP 200 Live" : "Cache Standby"}
                </span>
              </div>
              <p className="text-[10px] text-slate-300 font-medium leading-snug">
                Data real-time Open-Meteo (-7.9612, 112.6175) digunakan sebagai acuan kalibrasi baseline sensor DHT22 &amp; MQ-135 di seluruh ruangan.
              </p>
              <div className="grid grid-cols-4 gap-1.5 text-center pt-0.5">
                <div className="bg-white/10 backdrop-blur-xs p-1.5 rounded-xl border border-white/5">
                  <span className="text-[9px] text-slate-300 block font-medium">Suhu Luar</span>
                  <span className="text-xs font-black text-white">{outdoorClimate.temp}°C</span>
                </div>
                <div className="bg-white/10 backdrop-blur-xs p-1.5 rounded-xl border border-white/5">
                  <span className="text-[9px] text-slate-300 block font-medium">Lembap Luar</span>
                  <span className="text-xs font-black text-white">{outdoorClimate.humidity}%</span>
                </div>
                <div className="bg-white/10 backdrop-blur-xs p-1.5 rounded-xl border border-white/5">
                  <span className="text-[9px] text-slate-300 block font-medium">AQI US</span>
                  <span className="text-xs font-black text-emerald-400">{outdoorClimate.usAqi}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-xs p-1.5 rounded-xl border border-white/5">
                  <span className="text-[9px] text-slate-300 block font-medium">PM2.5</span>
                  <span className="text-xs font-black text-teal-300">{outdoorClimate.pm25} µg</span>
                </div>
              </div>
            </div>

            {/* 5. Rekomendasi Ruang Terbaik (Algoritma 3 SAW & Algoritma 4 Haversine) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                      Rekomendasi Ruang Terbaik
                    </h3>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <p className="text-[10px] font-medium text-slate-500">
                    Algoritma IoT: Kosong + Suhu 22–25°C + AQI Rendah + Terdekat
                  </p>
                </div>
                <button
                  onClick={() => setShowWeightModal(true)}
                  className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition"
                  title="Sesuaikan Bobot Algoritma SAW"
                >
                  <SlidersHorizontal className="w-3 h-3 text-teal-700" />
                  <span>Bobot SAW</span>
                </button>
              </div>

              {/* Card #1: Best Match Featured Card */}
              {bestMatchRoom && (
                <div className="bg-white rounded-2xl border border-teal-100 shadow-md shadow-teal-900/5 overflow-hidden transition hover:shadow-lg">
                  {/* Image Header with Badges */}
                  <div className="h-32 w-full relative bg-slate-800 overflow-hidden">
                    <img
                      src={
                        bestMatchRoom.image ||
                        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80"
                      }
                      alt={bestMatchRoom.name}
                      className="w-full h-full object-cover opacity-90 hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30"></div>
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="bg-slate-900/80 backdrop-blur-md text-amber-400 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-amber-400/30 flex items-center gap-1">
                        ★ Best Match (#1)
                      </span>
                    </div>
                    <div className="absolute top-2.5 right-2.5">
                      <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                        KOSONG
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 space-y-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                        {bestMatchRoom.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {bestMatchRoom.building}
                      </p>
                      <p className="text-[11px] font-semibold text-teal-800 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                        <span>
                          {bestMatchRoom.distanceMeters} meter dari lokasi Anda (1 mnt jalan kaki)
                        </span>
                      </p>
                    </div>

                    {/* Parameter 4 Grid Sesuai PDF Halaman 2 */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                          <Thermometer className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-medium leading-none">
                            Suhu Ruang
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {bestMatchRoom.temp}°C{" "}
                            <span className="text-[10px] font-semibold text-emerald-600">
                              (Ideal)
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                          <Droplets className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-medium leading-none">
                            Kelembapan
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {bestMatchRoom.humidity}%{" "}
                            <span className="text-[10px] font-semibold text-teal-600">
                              (Optimal)
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Wind className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-medium leading-none">
                            AQI Index
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {bestMatchRoom.aqi}{" "}
                            <span className="text-[10px] font-semibold text-emerald-600">
                              ({bestMatchRoom.aqiCategory})
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                          <Activity className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-medium leading-none">
                            Kadar CO2
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {bestMatchRoom.co2} ppm
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Pesan / Gunakan Ruangan & Navigasi */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => setBookingModalRoom(bestMatchRoom)}
                        className="bg-teal-700 hover:bg-teal-800 active:scale-95 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-teal-800/20 transition"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Pesan / Gunakan Ruangan</span>
                      </button>
                      <button
                        onClick={() => setNavigationModalRoom(bestMatchRoom)}
                        className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition border border-slate-200/80"
                      >
                        <Navigation className="w-3.5 h-3.5 text-teal-700" />
                        <span>Navigasi</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Secondary Recommended Cards Sesuai PDF Halaman 2 */}
              <div className="space-y-2 pt-1">
                {secondaryRecommended.map((room) => (
                  <div
                    key={room.id}
                    className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3 hover:border-teal-200 transition"
                  >
                    <img
                      src={
                        room.image ||
                        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=400&q=80"
                      }
                      alt={room.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {room.name}
                        </h4>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          • KOSONG
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">
                        {room.building}
                      </p>
                      <p className="text-[10px] font-medium text-teal-800 flex items-center gap-1 mt-0.5">
                        <Navigation className="w-2.5 h-2.5 text-teal-600" />
                        <span>{room.distanceMeters} meter dari lokasi Anda</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-600">
                        <span>🌡️ {room.temp}°C</span>
                        <span>💧 {room.humidity}%</span>
                        <span className="font-semibold text-emerald-700">🍃 AQI {room.aqi}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedAnalyticsRoomId(room.id);
                        setActiveTab("analitik");
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 text-[10px] font-bold rounded-xl shrink-0 transition"
                    >
                      Detail &amp; Booking &gt;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </main>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: RUANGAN (PDF Halaman 1)                                       */}
        {/* ==================================================================== */}
        {activeTab === "ruangan" && (
          <main className="flex-1 p-4 space-y-3.5 animate-in fade-in duration-150">
            {/* Header Kontrol: Dropdown Gedung & Toggle Daftar/Denah */}
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <select
                  value={selectedBuilding}
                  onChange={(e) => setSelectedBuilding(e.target.value)}
                  className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 appearance-none shadow-xs focus:outline-none focus:ring-2 focus:ring-teal-700/30"
                >
                  <option value="Semua Gedung">Semua Gedung (A, B, C, D)</option>
                  <option value="Gedung A">Gedung A (Kuliah Utama)</option>
                  <option value="Gedung B">Gedung B (Teknik &amp; Sains)</option>
                  <option value="Gedung C">Gedung C (Workshop &amp; Lab)</option>
                  <option value="Gedung D">Gedung D (Dekanat &amp; MIPA)</option>
                </select>
                <Building2 className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Toggle Mode: Daftar vs Denah */}
              <div className="bg-slate-200/80 p-0.5 rounded-xl flex items-center text-xs font-bold shrink-0">
                <button
                  onClick={() => setRoomViewMode("daftar")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
                    roomViewMode === "daftar"
                      ? "bg-white text-teal-800 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>Daftar</span>
                </button>
                <button
                  onClick={() => setRoomViewMode("denah")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
                    roomViewMode === "denah"
                      ? "bg-white text-teal-800 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>Denah</span>
                </button>
              </div>
            </div>

            {/* Status Filter Pills: Semua (60), Kosong (42), Terisi (18) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRoomStatusFilter("Semua")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  roomStatusFilter === "Semua"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                <span>Semua</span>
                <span className="text-[10px] opacity-90">60</span>
              </button>

              <button
                onClick={() => setRoomStatusFilter("Kosong")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  roomStatusFilter === "Kosong"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Kosong</span>
                <span className="text-[10px] opacity-90">{totalEmpty}</span>
              </button>

              <button
                onClick={() => setRoomStatusFilter("Terisi")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  roomStatusFilter === "Terisi"
                    ? "bg-red-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                <span>Terisi</span>
                <span className="text-[10px] opacity-90">{totalOccupied}</span>
              </button>
            </div>

            {/* TAMPILAN MODE DAFTAR (Halaman 1 PDF) */}
            {roomViewMode === "daftar" ? (
              <div className="space-y-3">
                {filteredRooms.map((room) => {
                  const isOccupied = room.isOccupied;
                  return (
                    <div
                      key={room.id}
                      onClick={() => {
                        setSelectedAnalyticsRoomId(room.id);
                        setActiveTab("analitik");
                      }}
                      className={`bg-white rounded-2xl border p-3.5 space-y-2.5 shadow-xs cursor-pointer transition hover:shadow-md ${
                        isOccupied
                          ? "border-l-4 border-l-red-500 border-slate-200/80"
                          : "border-slate-200/80 hover:border-teal-200"
                      }`}
                    >
                      {/* Top Row: Room Name & Status Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                            {room.name}
                          </h3>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {room.building}
                          </p>
                        </div>
                        <span
                          className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 flex items-center gap-1 ${
                            isOccupied
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isOccupied ? "bg-red-500" : "bg-emerald-500 animate-pulse"
                            }`}
                          ></span>
                          {isOccupied ? "TERISI / AKTIF" : "KOSONG / TERSEDIA"}
                        </span>
                      </div>

                      {/* Schedule / Course Context Banner Sesuai Halaman 1 PDF */}
                      {room.scheduleInfo && (
                        <div
                          className={`p-2 rounded-xl text-xs flex items-center justify-between ${
                            isOccupied
                              ? "bg-slate-50 border border-slate-100 text-slate-800"
                              : "bg-sky-50/70 text-sky-900 border border-sky-100"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Clock className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                            <span className="font-semibold truncate">
                              {room.scheduleInfo}
                            </span>
                          </div>
                          {room.lecturer && (
                            <span className="text-[10px] text-slate-500 font-medium shrink-0 ml-1">
                              {room.lecturer}
                            </span>
                          )}
                        </div>
                      )}

                      {/* 4 Sensor Metrics Grid Sesuai Halaman 1 PDF */}
                      <div className="grid grid-cols-4 gap-1.5 text-center bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-medium">Suhu</span>
                          <span className="text-xs font-bold text-slate-800">
                            {room.temp}°C
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-medium">Lembap</span>
                          <span className="text-xs font-bold text-slate-800">
                            {room.humidity}%
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-medium">AQI</span>
                          <span
                            className={`text-xs font-bold ${
                              room.aqi > 100
                                ? "text-red-600"
                                : room.aqi > 50
                                ? "text-amber-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {room.aqi}
                          </span>
                          <span className="text-[8px] block text-slate-500 leading-none">
                            {room.aqiCategory}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-medium">
                            {isOccupied ? "Okupansi" : "Kursi"}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {room.occupancyCount}/{room.capacity}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer Link */}
                      <div className="flex items-center justify-between pt-0.5 text-[11px] text-slate-500 font-medium">
                        <span>
                          {isOccupied
                            ? "Ketuk untuk monitoring konsumsi daya AC"
                            : "Ketuk untuk detail histori sensor"}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* TAMPILAN MODE DENAH (Interactive 2D Campus Floorplan) */
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900">
                    Denah Lantai Gedung Kuliah (2D Smart View)
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-semibold">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Kosong
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span> Terisi
                    </span>
                  </div>
                </div>

                <div className="relative bg-slate-900 rounded-xl p-3 text-white overflow-hidden shadow-inner border border-slate-700">
                  <p className="text-[10px] text-slate-400 mb-2">
                    Lantai 1 &amp; 2 • Ketuk ruangan pada denah untuk inspeksi telemetri:
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    {/* Visual Floorplan Blocks */}
                    {computedRooms.slice(0, 6).map((r) => {
                      const isOcc = r.isOccupied;
                      return (
                        <div
                          key={r.id}
                          onClick={() => {
                            setSelectedAnalyticsRoomId(r.id);
                            setActiveTab("analitik");
                          }}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isOcc
                              ? "bg-red-950/60 border-red-500/60 hover:bg-red-900/80 text-red-200"
                              : "bg-emerald-950/60 border-emerald-500/60 hover:bg-emerald-900/80 text-emerald-200"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black">{r.code}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-black/40">
                              {isOcc ? "Terisi" : "Kosong"}
                            </span>
                          </div>
                          <p className="text-[10px] font-normal truncate opacity-80 mt-1">
                            {r.name}
                          </p>
                          <div className="flex items-center justify-between mt-2 text-[10px] opacity-90">
                            <span>🌡️ {r.temp}°C</span>
                            <span>🍃 AQI {r.aqi}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-teal-400" />
                      Sensor LoRaWAN Node terpasang di tiap plafon
                    </span>
                    <span className="text-teal-400 font-bold">Peta Interaktif</span>
                  </div>
                </div>
              </div>
            )}
          </main>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: ANALITIK (PDF Halaman 3)                                      */}
        {/* ==================================================================== */}
        {activeTab === "analitik" && (
          <main className="flex-1 p-4 space-y-4 animate-in fade-in duration-150">
            {/* Header Navigasi & Action Icons Sesuai PDF Halaman 3 */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveTab("ruangan")}
                className="text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1"
              >
                <span>&larr; Daftar Ruangan</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    showToast("Telemetri sensor diperbarui dari gateway nirkabel.");
                  }}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                  title="Refresh Data Sensor"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleFavoriteRoom(currentAnalyticsRoom.id)}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${
                    favoriteRoomIds.includes(currentAnalyticsRoom.id)
                      ? "bg-amber-50 border-amber-300 text-amber-500"
                      : "bg-white border-slate-200 text-slate-400 hover:text-slate-600"
                  }`}
                  title="Simpan sebagai Favorit"
                >
                  <Bookmark className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            </div>

            {/* Room Title Header & Selector */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700">
                  {currentAnalyticsRoom.category}
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    currentAnalyticsRoom.isOccupied
                      ? "bg-red-100 text-red-700"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {currentAnalyticsRoom.isOccupied ? "• TERISI (Aktif)" : "• KOSONG (Tersedia)"}
                </span>
              </div>

              {/* Selector untuk ganti ruangan di Analitik */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  {currentAnalyticsRoom.name}
                </h2>
                <select
                  value={currentAnalyticsRoom.id}
                  onChange={(e) => setSelectedAnalyticsRoomId(e.target.value)}
                  className="bg-white border border-slate-200 text-[11px] font-bold text-teal-800 rounded-lg px-2 py-1 focus:outline-none"
                >
                  {computedRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.code}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {currentAnalyticsRoom.building}, {currentAnalyticsRoom.zone || "Zona Timur"} • Kampus FT
              </p>
            </div>

            {/* IoT Node Badge Sesuai PDF Halaman 3 */}
            <div className="bg-slate-100/90 border border-slate-200/80 px-3 py-2 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 block text-[11px]">
                    {currentAnalyticsRoom.nodeId || "IoT-Node-A101"}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Protokol {currentAnalyticsRoom.protocol || "LoRaWAN Class A"}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Online • 30 dtk lalu
              </span>
            </div>

            {/* Kalibrasi Ambien Luar FT UM (Open-Meteo REST API) */}
            <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-sky-950 text-white px-3 py-2 rounded-xl text-xs flex items-center justify-between border border-teal-700/40">
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-teal-300 font-bold block leading-tight">
                    Baseline Ambien Luar FT UM (Open-Meteo REST API)
                  </span>
                  <span className="text-[11px] font-semibold text-slate-200">
                    Suhu: <b>{outdoorClimate.temp}°C</b> • Lembap: <b>{outdoorClimate.humidity}%</b> • AQI: <b>{outdoorClimate.usAqi}</b>
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-400/30 shrink-0 ml-1">
                Live REST
              </span>
            </div>

            {/* 1. Thermal Cards Sesuai PDF Halaman 3 */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">Suhu Udara</span>
                  <Thermometer className="w-4 h-4 text-sky-600" />
                </div>
                <div className="text-xl font-black text-slate-900">
                  {currentAnalyticsRoom.temp}°C
                </div>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                  ❄️ Sejuk Ideal
                </span>
                <p className="text-[10px] text-slate-400 pt-1 font-medium">
                  Target Rentang: 22° – 25°C
                </p>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">Kelembapan (RH)</span>
                  <Droplets className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-xl font-black text-slate-900">
                  {currentAnalyticsRoom.humidity}%
                </div>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ✓ Nyaman / Normal
                </span>
                <p className="text-[10px] text-slate-400 pt-1 font-medium">
                  Rentang Ideal: 40% – 60%
                </p>
              </div>
            </div>

            {/* 2. Algoritma 2: Persepsi Termal Humidex (Rothfusz Regression) */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  😊
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    Persepsi Termal (Humidex Steadman)
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    Suhu Efektif {currentAnalyticsRoom.heatIndexC}°C (
                    <span className="text-emerald-700">{currentAnalyticsRoom.comfortLabel}</span>)
                  </span>
                </div>
              </div>
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
            </div>

            {/* 3. Algoritma 1: Indeks Kualitas Udara (AQI US EPA) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Indeks Kualitas Udara (AQI)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Real-time Environmental Telemetry
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  ISPU Standar
                </span>
              </div>

              {/* Gauge Meter AQI Sesuai PDF Halaman 3 */}
              <div className="flex flex-col items-center justify-center py-2 relative">
                <div className="w-36 h-20 overflow-hidden relative flex items-end justify-center">
                  <div className="w-36 h-36 rounded-full border-[14px] border-slate-100 border-t-emerald-500 border-r-teal-500 border-b-transparent border-l-sky-400 transform -rotate-45"></div>
                  <div className="absolute bottom-0 text-center">
                    <span className="text-3xl font-black text-slate-900 leading-none block">
                      {currentAnalyticsRoom.aqi}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                      AQI US
                    </span>
                  </div>
                </div>

                <div className="mt-2">
                  <span
                    className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border ${currentAnalyticsRoom.aqiBadgeColor}`}
                  >
                    ✓ {currentAnalyticsRoom.aqiBadge}
                  </span>
                </div>
              </div>

              {/* ISPU Bar Spectrum */}
              <div className="space-y-1">
                <div className="h-2 w-full rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500 relative">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-slate-900 shadow-md transform -translate-x-1/2"
                    style={{
                      left: `${Math.min(100, Math.max(0, (currentAnalyticsRoom.aqi / 200) * 100))}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-[9px] font-semibold text-slate-400 px-0.5">
                  <span>0 (Baik)</span>
                  <span>50</span>
                  <span>100</span>
                  <span>150</span>
                  <span>200+</span>
                </div>
              </div>

              {/* 3 Sub-Sensors Sesuai Halaman 3 PDF (PM2.5, CO2, TVOC) */}
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 block font-medium">PM2.5</span>
                  <span className="text-xs font-bold text-slate-800 block">
                    {currentAnalyticsRoom.pm25} µg/m³
                  </span>
                  <span className="text-[9px] text-emerald-600 font-semibold">Bagus</span>
                </div>

                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 block font-medium">CO₂</span>
                  <span className="text-xs font-bold text-slate-800 block">
                    {currentAnalyticsRoom.co2} ppm
                  </span>
                  <span
                    className={`text-[9px] font-semibold ${
                      currentAnalyticsRoom.co2 > 1000 ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {currentAnalyticsRoom.co2 > 1000 ? "Tinggi" : "Segar"}
                  </span>
                </div>

                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 block font-medium">TVOC</span>
                  <span className="text-xs font-bold text-slate-800 block">
                    {currentAnalyticsRoom.tvoc || 0.08} mg/m³
                  </span>
                  <span className="text-[9px] text-emerald-600 font-semibold">Aman</span>
                </div>
              </div>
            </div>

            {/* 4. Algoritma 6: Tren Fluktuasi LTTB Downsampling Sesuai PDF Hal 3 */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Tren Fluktuasi
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Korelasi Suhu &amp; Kualitas Udara
                  </p>
                </div>
                <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-[10px] font-bold">
                  <button
                    onClick={() => setAnalyticsTimeframe("harian")}
                    className={`px-2 py-0.5 rounded-md ${
                      analyticsTimeframe === "harian" ? "bg-white text-teal-800 shadow-xs" : "text-slate-500"
                    }`}
                  >
                    Harian
                  </button>
                  <button
                    onClick={() => setAnalyticsTimeframe("mingguan")}
                    className={`px-2 py-0.5 rounded-md ${
                      analyticsTimeframe === "mingguan" ? "bg-white text-teal-800 shadow-xs" : "text-slate-500"
                    }`}
                  >
                    Mingguan
                  </button>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 pt-1">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                    Suhu (°C)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                    AQI Index
                  </span>
                </div>
                <span className="text-slate-400">08:00 – 16:00</span>
              </div>

              {/* Interactive SVG Chart (Downsampled using LTTB Algorithm) */}
              <div className="h-36 w-full pt-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 320 110">
                  <defs>
                    <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guide Lines */}
                  <line x1="0" y1="20" x2="320" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="0" y1="55" x2="320" y2="55" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="0" y1="90" x2="320" y2="90" stroke="#f1f5f9" strokeDasharray="3 3" />

                  {/* Generate Path for Suhu */}
                  {(() => {
                    const points = downsampledChartData.map((d, idx) => {
                      const x = (idx / (downsampledChartData.length - 1)) * 320;
                      // Mapping Temp 20°C - 26°C -> Y 90 - 20
                      const y = 90 - ((d.temp - 20) / (26 - 20)) * 70;
                      return { x, y, temp: d.temp, time: d.time };
                    });

                    const pathStr = points.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");
                    const areaStr = `${pathStr} L 320 100 L 0 100 Z`;

                    return (
                      <>
                        <path d={areaStr} fill="url(#tempGradient)" />
                        <path d={pathStr} fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" />
                        {points.map((p, i) => (
                          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#ffffff" stroke="#0ea5e9" strokeWidth="2" />
                        ))}
                      </>
                    );
                  })()}

                  {/* Generate Path for AQI */}
                  {(() => {
                    const points = downsampledChartData.map((d, idx) => {
                      const x = (idx / (downsampledChartData.length - 1)) * 320;
                      // Mapping AQI 10 - 50 -> Y 95 - 30
                      const y = 95 - ((d.aqi - 10) / (50 - 10)) * 65;
                      return { x, y, aqi: d.aqi };
                    });

                    const pathStr = points.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");

                    return (
                      <>
                        <path d={pathStr} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 2" />
                        {points.map((p, i) => (
                          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#ffffff" stroke="#0d9488" strokeWidth="2" />
                        ))}
                      </>
                    );
                  })()}
                </svg>

                {/* X-Axis Labels Sesuai PDF Halaman 3 */}
                <div className="flex justify-between text-[10px] font-semibold text-slate-400 mt-1">
                  <span>08.00</span>
                  <span>10.00</span>
                  <span className="text-teal-700 font-bold">12.30</span>
                  <span>14.00</span>
                  <span>16.00</span>
                </div>
              </div>

              {/* Ringkasan Analitik Hari Ini Card */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                  <span>Ringkasan Analitik Hari Ini</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  • Suhu puncak: <b>24.5°C</b> tercatat pada pukul 12.30 saat aktivitas kelas kuliah siang.
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  • Kualitas udara konsisten prima dengan sirkulasi ventilasi mekanis bekerja <b>98% efisien</b>.
                </p>
              </div>
            </div>

            {/* Action Buttons Sesuai PDF Halaman 3 */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => toggleFavoriteRoom(currentAnalyticsRoom.id)}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition ${
                  favoriteRoomIds.includes(currentAnalyticsRoom.id)
                    ? "bg-amber-50 border-amber-300 text-amber-800"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Bookmark className="w-4 h-4 text-amber-500" />
                <span>
                  {favoriteRoomIds.includes(currentAnalyticsRoom.id)
                    ? "★ Ruangan Favorit (Tersimpan)"
                    : "☆ Jadikan Ruangan Favorit"}
                </span>
              </button>

              <button
                onClick={() => setReportModalRoom(currentAnalyticsRoom)}
                className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/80 transition"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Laporkan Masalah AC / Sensor</span>
              </button>
            </div>
          </main>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: AUDIT ENERGI (PDF Halaman 4)                                  */}
        {/* ==================================================================== */}
        {activeTab === "audit" && (
          <main className="flex-1 p-4 space-y-3.5 animate-in fade-in duration-150">
            {/* Header: Energy Savings & Facility Audit */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                    ⚡ Energy Savings &amp; Facility Audit
                  </span>
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug">
                    Deteksi Pemborosan Energi
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">
                    Audit otomatis fasilitas smart-campus FT &amp; Sains berdasarkan sensor IoT okupansi dan iklim ruangan.
                  </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-center shrink-0 ml-2">
                  <span className="text-lg font-black text-emerald-700 block leading-tight">
                    {campusEnergyScore.score}%
                  </span>
                  <span className="text-[9px] font-bold text-emerald-800">
                    Skor Kampus ({campusEnergyScore.grade})
                  </span>
                </div>
              </div>

              {/* 2 Summary Metric Cards Sesuai PDF Halaman 4 */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-red-50/80 border border-red-100 p-2.5 rounded-xl">
                  <span className="text-[10px] font-bold text-red-700 block">
                    Peringatan Aktif
                  </span>
                  <span className="text-lg font-black text-red-900 leading-tight block">
                    {anomalyRooms.length} Ruangan
                  </span>
                  <span className="text-[10px] text-red-600 font-medium">
                    Anomali Terdeteksi
                  </span>
                </div>

                <div className="bg-teal-50/80 border border-teal-100 p-2.5 rounded-xl">
                  <span className="text-[10px] font-bold text-teal-800 block">
                    Potensi Hemat
                  </span>
                  <span className="text-lg font-black text-teal-900 leading-tight block">
                    ~{campusEnergyScore.totalKwh} kWh
                  </span>
                  <span className="text-[10px] text-teal-700 font-medium">
                    Rp {(anomalyRooms.reduce((acc, c) => acc + (c.wastedIdr || 0), 0)).toLocaleString("id-ID")} / jam
                  </span>
                </div>
              </div>

              {/* Master Button Sesuai Halaman 4 PDF */}
              <button
                onClick={handleTurnOffAllAC}
                disabled={anomalyRooms.length === 0}
                className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition ${
                  anomalyRooms.length === 0
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                    : "bg-teal-800 hover:bg-teal-900 text-white shadow-teal-900/20 active:scale-95"
                }`}
              >
                <Power className="w-4 h-4" />
                <span>Matikan AC Ruangan Kosong Sekaligus</span>
              </button>
            </div>

            {/* Filter Kategori Anomali & Audit Sinkron */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setAnomalyFilter("Semua")}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    anomalyFilter === "Semua"
                      ? "bg-sky-600 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  Semua Anomali {anomalyRooms.length}
                </button>
                <button
                  onClick={() => setAnomalyFilter("AC")}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    anomalyFilter === "AC"
                      ? "bg-sky-600 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  AC Menyala Ruang Kosong {anomalyRooms.filter((r) => r.anomalyType === "AC_WASTE").length}
                </button>
                <button
                  onClick={() => setAnomalyFilter("Lampu")}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    anomalyFilter === "Lampu"
                      ? "bg-sky-600 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  Lampu Nyala Siang Hari {anomalyRooms.filter((r) => r.anomalyType === "LIGHT_WASTE").length}
                </button>
              </div>

              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 shrink-0 ml-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Audit Sinkron
              </span>
            </div>

            {/* Rule Audit Aktif (Algoritma 8: Forward Chaining) */}
            <div className="bg-slate-200/80 border border-slate-300/60 p-2.5 rounded-xl text-[11px] text-slate-700 font-mono">
              <b>⠶ Rule Audit Aktif:</b> Okupansi = KOSONG &amp; Suhu &lt; 23°C (AC Beroperasi Tanpa Pengguna).
            </div>

            {/* List Anomali Ruangan Sesuai PDF Halaman 4 */}
            <div className="space-y-3">
              {filteredAnomalies.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl text-center border border-slate-200/80 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Tidak Ada Pemborosan Energi Terdeteksi
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Seluruh fasilitas AC dan pencahayaan smart-campus beroperasi secara efisien sesuai keberadaan mahasiswa.
                  </p>
                </div>
              ) : (
                filteredAnomalies.map((room) => {
                  const isACWaste = room.anomalyType === "AC_WASTE";
                  return (
                    <div
                      key={room.id}
                      className="bg-white rounded-2xl border border-red-200 p-3.5 space-y-3 shadow-xs"
                    >
                      {/* Top Header Card */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            {isACWaste ? (
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                            ) : (
                              <Sun className="w-4 h-4 text-amber-600" />
                            )}
                            <h3 className="text-sm font-extrabold text-slate-900">
                              {room.name}
                            </h3>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {room.building}
                          </p>
                        </div>
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            room.priority === "PRIORITAS TINGGI"
                              ? "bg-red-600 text-white"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {room.priority}
                        </span>
                      </div>

                      {/* Sensor Parameters Grid */}
                      {isACWaste ? (
                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-medium">
                              Okupansi PIR
                            </span>
                            <span className="font-extrabold text-slate-800">
                              0 Orang (KOSONG)
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-medium">
                              Suhu Ruangan
                            </span>
                            <span className="font-extrabold text-sky-600">
                              {room.temp}°C (Sangat Dingin)
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-medium">
                              Lux Siang
                            </span>
                            <span className="font-extrabold text-amber-600">
                              {room.lux} Lux (Terang)
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-medium">
                              Lampu Tabung
                            </span>
                            <span className="font-extrabold text-slate-800">
                              {room.lampCount || 8} Titik Nyala
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Anomaly Description Alert */}
                      <div className="bg-red-50/90 border border-red-200/80 p-2.5 rounded-xl text-xs space-y-1">
                        <span className="font-bold text-red-900 block text-[11px]">
                          {isACWaste ? "⚠️ Anomali Beban Pendingin" : "💡 Lampu Nyala Siang Hari"}
                        </span>
                        <p className="text-[11px] text-red-800 leading-relaxed">
                          {room.scheduleInfo}
                        </p>
                      </div>

                      {/* Action Button */}
                      {isACWaste ? (
                        <button
                          onClick={() => handleTurnOffSingleAC(room.id)}
                          className="w-full bg-red-700 hover:bg-red-800 active:scale-95 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>Matikan AC Jarak Jauh</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleTurnOffCorridorLamps}
                          className="w-full bg-teal-800 hover:bg-teal-900 active:scale-95 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>Padamkan Lampu Koridor</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Log Telemetri Sesuai PDF Halaman 4 */}
            <div className="bg-slate-100/90 border border-slate-200/80 p-3 rounded-xl flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-teal-700" />
                <div>
                  <span className="font-bold text-slate-800 block text-[11px]">
                    Log Telemetri Audit IoT
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Telemetri simulasi diperbarui otomatis setiap 4 detik
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-teal-800">
                Demo lokal
              </span>
            </div>
          </main>
        )}

        {/* ==================================================================== */}
        {/* BOTTOM NAVIGATION BAR (4 TAB UTAMA)                                  */}
        {/* ==================================================================== */}
        <nav className="fixed bottom-0 w-full max-w-[430px] bg-white border-t border-slate-200/80 grid grid-cols-4 py-1.5 z-40 shadow-lg">
          {[
            { id: "beranda", label: "Beranda", icon: Home, pdfPage: "Hal 2" },
            { id: "ruangan", label: "Ruangan", icon: Building2, pdfPage: "Hal 1" },
            { id: "analitik", label: "Analitik", icon: LineChart, pdfPage: "Hal 3" },
            { id: "audit", label: "Audit Energi", icon: Zap, pdfPage: "Hal 4" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1 transition-all ${
                  isActive
                    ? "text-teal-800 font-extrabold scale-105"
                    : "text-slate-400 hover:text-slate-600 font-medium"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : "stroke-[1.8px]"}`} />
                <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ==================================================================== */}
        {/* FLOATING TRIGGER: IOT SIMULATOR CONTROL DRAWER (DEMO DOSEN)         */}
        {/* ==================================================================== */}
        <div className="fixed bottom-20 right-4 z-40">
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-slate-900 to-teal-950 text-white px-3 py-2 rounded-full shadow-xl border border-teal-500/40 text-xs font-bold hover:scale-105 active:scale-95 transition"
          >
            <Sliders className="w-3.5 h-3.5 text-teal-400 animate-spin" style={{ animationDuration: "6s" }} />
            <span>IoT Demo Control</span>
          </button>
        </div>

        {/* ==================================================================== */}
        {/* MODAL / DRAWER: IOT SIMULATOR CONTROL (DEMO MODE DOSEN)             */}
        {/* ==================================================================== */}
        {isSimulatorOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-0 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-[430px] max-h-[85vh] rounded-t-3xl p-5 overflow-y-auto space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-800 text-white flex items-center justify-center">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      IoT Telemetry Simulator Panel
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Kontrol demonstrasi on-device mobile compute di hadapan dosen
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSimulatorOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Streaming Status & Execution Telemetry */}
              <div className="bg-slate-900 text-white p-3 rounded-2xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-300">
                    Status Auto-Streaming ESP32:
                  </span>
                  <button
                    onClick={() => setIsAutoStreaming(!isAutoStreaming)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                      isAutoStreaming ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"
                    }`}
                  >
                    {isAutoStreaming ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    <span>{isAutoStreaming ? "Aktif (4 dtk)" : "Dijeda"}</span>
                  </button>
                </div>
                <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                  <div>
                    <span>Mobile Compute Latency:</span>{" "}
                    <b className="text-emerald-400">&lt; 1 ms (Lokal)</b>
                  </div>
                  <div>
                    <span>State Diffing (Myers):</span>{" "}
                    <b className="text-teal-300">{lastDiffStats.changedCount} node di-patch</b>
                  </div>
                </div>
              </div>

              {/* Tombol Skenario Cepat (One-Click Demo Presets) */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  Skenario Demo Instan (Pengujian Algoritma):
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handleTriggerPreset("co2_hazard")}
                    className="p-2.5 bg-red-50 hover:bg-red-100 text-red-900 border border-red-200 rounded-xl text-left transition"
                  >
                    <b className="block text-[11px]">🚨 Uji Kritis CO2 &gt; 1100</b>
                    <span className="text-[9px] text-red-700 block mt-0.5">
                      Picu Algoritma 10 &amp; Alert Banner
                    </span>
                  </button>

                  <button
                    onClick={() => handleTriggerPreset("freeze_empty")}
                    className="p-2.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 rounded-xl text-left transition"
                  >
                    <b className="block text-[11px]">❄️ Anomali AC Kosong</b>
                    <span className="text-[9px] text-sky-700 block mt-0.5">
                      Picu Algoritma 8 Audit Energi
                    </span>
                  </button>

                  <button
                    onClick={() => handleTriggerPreset("pir_noise")}
                    className="p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-left transition"
                  >
                    <b className="block text-[11px]">⚡ Injeksi Noise PIR</b>
                    <span className="text-[9px] text-purple-700 block mt-0.5">
                      Uji Algoritma 7 EMA Smoothing
                    </span>
                  </button>

                  <button
                    onClick={() => handleTriggerPreset("gps_walk")}
                    className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-left transition"
                  >
                    <b className="block text-[11px]">🚶 Simulasi GPS Bergerak</b>
                    <span className="text-[9px] text-emerald-700 block mt-0.5">
                      Uji Algoritma 4 Haversine &amp; SAW
                    </span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    syncAllApis(true);
                    showToast(`Sensor ruangan dikalibrasi dengan data Open-Meteo (${outdoorClimate.temp}°C, AQI ${outdoorClimate.usAqi}).`);
                  }}
                  className="w-full py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Globe className="w-3.5 h-3.5 text-teal-300" />
                  <span>🌐 Kalibrasi Sensor dari Live Open-Meteo API</span>
                </button>

                <button
                  onClick={() => handleTriggerPreset("normal")}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  🔄 Reset Semua Parameter ke Standar Kampus
                </button>
              </div>

              {/* Slider Manual Override untuk Ruangan Tertentu */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Manipulasi Sensor Manual:
                  </span>
                  <select
                    value={selectedSimulatorRoomId}
                    onChange={(e) => setSelectedSimulatorRoomId(e.target.value)}
                    className="bg-slate-100 text-xs font-bold rounded-lg px-2 py-1 text-slate-800 focus:outline-none"
                  >
                    {rawRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code} - {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {(() => {
                  const targetRoom = rawRooms.find((r) => r.id === selectedSimulatorRoomId) || rawRooms[0];
                  return (
                    <div className="space-y-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs">
                      {/* Suhu Slider */}
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                          <span>Suhu DHT22:</span>
                          <span className="font-bold text-teal-800">{targetRoom.temp}°C</span>
                        </div>
                        <input
                          type="range"
                          min="16"
                          max="32"
                          step="0.5"
                          value={targetRoom.temp}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setRawRooms((prev) =>
                              prev.map((r) => (r.id === targetRoom.id ? { ...r, temp: val } : r))
                            );
                          }}
                          className="w-full accent-teal-700"
                        />
                      </div>

                      {/* CO2 Slider */}
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                          <span>Kadar CO2 MQ-135:</span>
                          <span className="font-bold text-red-600">{targetRoom.co2} ppm</span>
                        </div>
                        <input
                          type="range"
                          min="380"
                          max="1600"
                          step="20"
                          value={targetRoom.co2}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setRawRooms((prev) =>
                              prev.map((r) => (r.id === targetRoom.id ? { ...r, co2: val } : r))
                            );
                          }}
                          className="w-full accent-red-600"
                        />
                      </div>

                      {/* Status Okupansi Toggle */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] font-semibold text-slate-700">
                          Status PIR / Okupansi:
                        </span>
                        <button
                          onClick={() => {
                            setRawRooms((prev) =>
                              prev.map((r) =>
                                r.id === targetRoom.id
                                  ? {
                                      ...r,
                                      isOccupied: !r.isOccupied,
                                      occupancyCount: r.isOccupied ? 0 : 25,
                                    }
                                  : r
                              )
                            );
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold ${
                            targetRoom.isOccupied
                              ? "bg-red-600 text-white"
                              : "bg-emerald-600 text-white"
                          }`}
                        >
                          {targetRoom.isOccupied ? "Terisi (25 Org)" : "Kosong (0 Org)"}
                        </button>
                      </div>

                      {/* Status AC Toggle */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] font-semibold text-slate-700">
                          Operasional AC:
                        </span>
                        <button
                          onClick={() => {
                            setRawRooms((prev) =>
                              prev.map((r) =>
                                r.id === targetRoom.id ? { ...r, acActive: !r.acActive } : r
                              )
                            );
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold ${
                            targetRoom.acActive
                              ? "bg-sky-600 text-white"
                              : "bg-slate-300 text-slate-700"
                          }`}
                        >
                          {targetRoom.acActive ? "AC ON" : "AC OFF"}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* MODAL: BOBOT PREFERENSI SAW (ALGORITMA 3)                            */}
        {/* ==================================================================== */}
        {showWeightModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white w-full max-w-[380px] rounded-3xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-teal-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Atur Bobot Preferensi SAW
                  </h3>
                </div>
                <button
                  onClick={() => setShowWeightModal(false)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Sesuaikan bobot prioritas perhitungan <b>Simple Additive Weighting (SAW)</b> untuk menentukan ruang terbaik menurut preferensi Anda:
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-semibold">
                    <span>Status Kekosongan (Benefit):</span>
                    <span className="font-bold text-teal-800">
                      {Math.round(sawWeights.occupancy * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.6"
                    step="0.05"
                    value={sawWeights.occupancy}
                    onChange={(e) =>
                      setSawWeights({ ...sawWeights, occupancy: parseFloat(e.target.value) })
                    }
                    className="w-full accent-teal-700"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold">
                    <span>Kenyamanan Suhu (Cost / Rentang 22-25°C):</span>
                    <span className="font-bold text-teal-800">
                      {Math.round(sawWeights.temp * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.5"
                    step="0.05"
                    value={sawWeights.temp}
                    onChange={(e) =>
                      setSawWeights({ ...sawWeights, temp: parseFloat(e.target.value) })
                    }
                    className="w-full accent-teal-700"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold">
                    <span>Kualitas Udara AQI Rendah (Cost):</span>
                    <span className="font-bold text-teal-800">
                      {Math.round(sawWeights.aqi * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.5"
                    step="0.05"
                    value={sawWeights.aqi}
                    onChange={(e) =>
                      setSawWeights({ ...sawWeights, aqi: parseFloat(e.target.value) })
                    }
                    className="w-full accent-teal-700"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold">
                    <span>Kedekatan Jarak Haversine (Cost):</span>
                    <span className="font-bold text-teal-800">
                      {Math.round(sawWeights.distance * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.5"
                    step="0.05"
                    value={sawWeights.distance}
                    onChange={(e) =>
                      setSawWeights({ ...sawWeights, distance: parseFloat(e.target.value) })
                    }
                    className="w-full accent-teal-700"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => {
                    setSawWeights({ occupancy: 0.35, temp: 0.25, aqi: 0.20, distance: 0.20 });
                    showToast("Bobot SAW direset ke default.");
                  }}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Reset Default
                </button>
                <button
                  onClick={() => {
                    setShowWeightModal(false);
                    showToast("Ranking SAW berhasil dihitung ulang!");
                  }}
                  className="flex-1 py-2 bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-900/20"
                >
                  Terapkan Bobot
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* MODAL: PESAN / GUNAKAN RUANGAN                                       */}
        {/* ==================================================================== */}
        {bookingModalRoom && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white w-full max-w-[380px] rounded-3xl p-5 space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Pesan / Gunakan Ruangan
                  </h3>
                </div>
                <button
                  onClick={() => setBookingModalRoom(null)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-900">
                  {bookingModalRoom.name}
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  {bookingModalRoom.building} • Kapasitas {bookingModalRoom.capacity} Orang
                </p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Kondisi Suhu:</span>
                  <b>{bookingModalRoom.temp}°C (Sejuk)</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kualitas Udara:</span>
                  <b className="text-emerald-700">AQI {bookingModalRoom.aqi} (Prima)</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Jarak Jalan:</span>
                  <b>{bookingModalRoom.distanceMeters} m</b>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold text-slate-700 block">
                  Pilih Keperluan:
                </label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium">
                  <option>Belajar Mandiri</option>
                  <option>Diskusi Tugas Kelompok</option>
                  <option>Rapat Organisasi / Himpunan Mahasiswa</option>
                  <option>Persiapan Ujian Praktikum</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setBookingModalRoom(null)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleBookRoom(bookingModalRoom)}
                  className="flex-1 py-2 bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-900/20"
                >
                  Konfirmasi Booking
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* MODAL: NAVIGASI GEOSPASIAL (ALGORITMA 4 HAVERSINE)                  */}
        {/* ==================================================================== */}
        {navigationModalRoom && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white w-full max-w-[380px] rounded-3xl p-5 space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-teal-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Panduan Navigasi Kampus
                  </h3>
                </div>
                <button
                  onClick={() => setNavigationModalRoom(null)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-900 text-white p-3.5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Tujuan:</span>
                  <b className="text-teal-400">{navigationModalRoom.name}</b>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Jarak Lurus (Haversine):</span>
                  <b className="text-emerald-400">{navigationModalRoom.distanceMeters} Meter</b>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Estimasi Jalan Kaki:</span>
                  <b>~{Math.max(1, Math.round(navigationModalRoom.distanceMeters / 60))} Menit</b>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <h5 className="font-bold text-slate-800">Petunjuk Rute:</h5>
                <ol className="space-y-1.5 text-[11px] text-slate-600 pl-4 list-decimal">
                  <li>Mulai dari titik lobi utama Fakultas Teknik (Posisi Anda).</li>
                  <li>Ambil lorong koridor timur menuju tangga lantai {navigationModalRoom.floor || 2}.</li>
                  <li>Naik ke lantai {navigationModalRoom.floor || 2}, belok kiri 10 meter.</li>
                  <li>Pintu masuk <b>{navigationModalRoom.code}</b> berada di sisi kanan Anda.</li>
                </ol>
              </div>

              <button
                onClick={() => setNavigationModalRoom(null)}
                className="w-full py-2.5 bg-teal-800 text-white rounded-xl text-xs font-bold"
              >
                Mulai Berjalan
              </button>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* MODAL: LAPORKAN MASALAH AC / SENSOR                                  */}
        {/* ==================================================================== */}
        {reportModalRoom && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white w-full max-w-[380px] rounded-3xl p-5 space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Laporkan Kendala Fasilitas
                  </h3>
                </div>
                <button
                  onClick={() => setReportModalRoom(null)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Ruangan: <b>{reportModalRoom.name}</b> ({reportModalRoom.building})
              </p>

              <form onSubmit={handleSubmitReport} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Jenis Kendala:
                  </label>
                  <select
                    value={reportForm.category}
                    onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                  >
                    <option>AC Kurang Dingin</option>
                    <option>AC Terlalu Dingin / Suhu Beku</option>
                    <option>Udara Pengap / CO2 Tinggi</option>
                    <option>Sensor Gerak / PIR Tidak Merespons</option>
                    <option>Lampu Koridor Masih Menyala Siang Hari</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Catatan Tambahan (Opsional):
                  </label>
                  <textarea
                    rows={2}
                    value={reportForm.notes}
                    onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })}
                    placeholder="Contoh: Suhu remote AC tidak bisa dinaikkan dari 18°C..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                  ></textarea>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setReportModalRoom(null)}
                    className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-md shadow-red-900/20"
                  >
                    Kirim Laporan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
