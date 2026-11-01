import React, { useState, useEffect } from "react";
import {
  Building2,
  PlusCircle,
  X,
  Thermometer,
  Wind,
  Droplets,
  Users,
  Power,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  MapPin,
  Layers,
} from "lucide-react";
import { UM_CAMPUS_BUILDINGS } from "../services/iotSimulatorApi";

export default function AddRoomModal({ isOpen, onClose, onAddRoom, existingRoomCodes = [] }) {
  const [selectedBuildingCode, setSelectedBuildingCode] = useState("B12");
  const [roomCode, setRoomCode] = useState("");
  const [roomName, setRoomName] = useState("");
  const [floor, setFloor] = useState(2);
  const [category, setCategory] = useState("Lab Komputer");
  const [capacity, setCapacity] = useState(40);
  const [facilities, setFacilities] = useState("35 Unit PC, Smart TV 65 Inci, AC Split 2 PK, Wi-Fi 6 Eduroam FT UM");
  
  // Parameter Sensor IoT Awal
  const [temp, setTemp] = useState(23.2);
  const [humidity, setHumidity] = useState(50);
  const [co2, setCo2] = useState(420);
  const [pm25, setPm25] = useState(6.5);
  const [isOccupied, setIsOccupied] = useState(false);
  const [acActive, setAcActive] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentBuilding =
    UM_CAMPUS_BUILDINGS.find((b) => b.code === selectedBuildingCode) || UM_CAMPUS_BUILDINGS[0];

  // Auto-generate contoh kode saat ganti gedung
  useEffect(() => {
    if (!roomCode || roomCode.includes("-")) {
      const prefix = currentBuilding.code;
      const num = `${floor}0${Math.floor(Math.random() * 5) + 5}`;
      setRoomCode(`${prefix}-${num}`);
    }
  }, [selectedBuildingCode, floor]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanCode = roomCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage("Kode ruangan wajib diisi (contoh: B12-205).");
      return;
    }

    if (existingRoomCodes.includes(cleanCode)) {
      setErrorMessage(`Kode ruangan "${cleanCode}" sudah terdaftar di database. Silakan gunakan kode lain.`);
      return;
    }

    if (!roomName.trim()) {
      setErrorMessage("Nama ruangan wajib diisi (contoh: Lab Komputasi Cerdas B12).");
      return;
    }

    setIsSubmitting(true);

    const newRoomPayload = {
      id: cleanCode,
      code: cleanCode,
      name: roomName.trim(),
      building: `${currentBuilding.name} • Lt. ${floor}`,
      buildingCode: currentBuilding.code,
      floor: Number(floor),
      zone: `Zona ${currentBuilding.code}`,
      category,
      capacity: Number(capacity) || 40,
      facilities: facilities.trim() || "Fasilitas Perkuliahan Standar FT UM",
      scheduleInfo: isOccupied
        ? "Terjadwal Perkuliahan / Praktikum"
        : "KOSONG / Siap Digunakan Belajar Mandiri",
      isOccupied,
      occupancyCount: isOccupied ? Math.max(1, Math.round(Number(capacity) * 0.75)) : 0,
      acActive,
      lightsActive: isOccupied,
      temp: Number(temp),
      humidity: Number(humidity),
      co2: Number(co2),
      pm25: Number(pm25),
      tvoc: 0.08,
      lux: isOccupied ? 420 : 280,
      emptyDurationMins: isOccupied ? 0 : 35,
      lat: currentBuilding.lat + (Math.random() - 0.5) * 0.00008,
      lon: currentBuilding.lon + (Math.random() - 0.5) * 0.00008,
      targetTempRange: "22° – 25°C",
      targetHumidityRange: "40% – 60%",
      nodeId: `IoT-Node-${cleanCode.replace(/[^a-zA-Z0-9]/g, "")}`,
      protocol: "LoRaWAN Class A",
      createdAt: new Date().toISOString(),
    };

    try {
      await onAddRoom(newRoomPayload);
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(err.message || "Gagal menyimpan ruangan ke Firebase RTDB.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-3 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-[420px] max-h-[92vh] rounded-3xl p-5 shadow-2xl flex flex-col space-y-3.5 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                Tambah Ruang Kuliah / Lab UM
              </h3>
              <p className="text-[10px] text-slate-500">
                Registrasi telemetri IoT &amp; sinkronisasi ke Firebase RTDB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto space-y-3.5 pr-1 text-xs flex-1">
          {errorMessage && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Identitas Gedung & Kode */}
          <div className="space-y-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Lokasi Gedung Kampus UM</span>
            </span>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Pilih Gedung Kampus Universitas Negeri Malang:
              </label>
              <select
                value={selectedBuildingCode}
                onChange={(e) => setSelectedBuildingCode(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
              >
                {UM_CAMPUS_BUILDINGS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name} — {b.fullName}
                  </option>
                ))}
              </select>
              <p className="text-[9px] text-slate-500 mt-1 italic">
                {currentBuilding.description} (GPS: {currentBuilding.lat}, {currentBuilding.lon})
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Lantai:
                </label>
                <select
                  value={floor}
                  onChange={(e) => setFloor(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                >
                  {currentBuilding.floors.map((f) => (
                    <option key={f} value={f}>
                      Lantai {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Kode Ruangan:
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: B12-205"
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-teal-900 tracking-wide uppercase focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Nama Ruangan:
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Contoh: Lab Komputasi Cerdas &amp; AI B12"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
              />
            </div>
          </div>

          {/* Section 2: Kategori & Kapasitas */}
          <div className="space-y-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Klasifikasi &amp; Fasilitas</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Kategori Ruang:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                >
                  <option value="Ruang Teori">Ruang Teori</option>
                  <option value="Lab Komputer">Lab Komputer</option>
                  <option value="Ruang Seminar">Ruang Seminar</option>
                  <option value="Ruang Diskusi">Ruang Diskusi</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Kapasitas Kursi:
                </label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Fasilitas Unggulan:
              </label>
              <input
                type="text"
                value={facilities}
                onChange={(e) => setFacilities(e.target.value)}
                placeholder="Contoh: 35 Unit PC, Smart TV, AC Split 2 PK"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700"
              />
            </div>
          </div>

          {/* Section 3: Telemetri IoT Awal */}
          <div className="space-y-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5" />
              <span>Kondisi Awal Sensor IoT ESP32</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Suhu (°C):
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Kelembapan (%):
                </label>
                <input
                  type="number"
                  value={humidity}
                  onChange={(e) => setHumidity(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Kadar CO2 (ppm):
                </label>
                <input
                  type="number"
                  value={co2}
                  onChange={(e) => setCo2(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  PM2.5 (µg/m³):
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={pm25}
                  onChange={(e) => setPm25(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOccupied}
                  onChange={(e) => setIsOccupied(e.target.checked)}
                  className="rounded text-teal-800 focus:ring-teal-700"
                />
                <span className="text-[11px] font-bold text-slate-800">
                  {isOccupied ? "Status: Terisi" : "Status: Kosong"}
                </span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acActive}
                  onChange={(e) => setAcActive(e.target.checked)}
                  className="rounded text-teal-800 focus:ring-teal-700"
                />
                <span className="text-[11px] font-bold text-slate-800">
                  {acActive ? "AC: Menyala" : "AC: Mati"}
                </span>
              </label>
            </div>
          </div>

          {/* Action Submit Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition text-center"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-teal-800 hover:bg-teal-900 active:scale-95 text-white rounded-xl text-xs font-extrabold shadow-md shadow-teal-900/20 transition flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isSubmitting ? "Menyimpan..." : "Simpan ke Firebase"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

