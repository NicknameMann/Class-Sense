import React, { useState } from "react";
import {
  Building2,
  Lock,
  Unlock,
  KeyRound,
  User,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  Info,
} from "lucide-react";
import {
  authenticateUser,
  createSignedSession,
  REGISTERED_USERS,
  GUEST_USER,
} from "../services/authService";

export default function LoginPage({
  onLoginSuccess,
  onCancel,
  permissionPromptMessage = null,
  currentUser = null,
}) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!identifier.trim() || !password.trim()) {
      setErrorMessage("Silakan masukkan Email akun dan kata sandi.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await authenticateUser(identifier, password);
      setIsLoading(false);
      if (result.success) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.error);
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err.message || "Gagal memproses autentikasi.");
    }
  };

  const handleQuickLogin = (userType) => {
    setIsLoading(true);
    setErrorMessage("");
    setTimeout(() => {
      setIsLoading(false);
      if (userType === "sarpras") {
        onLoginSuccess(createSignedSession(REGISTERED_USERS[0], 2));
      } else if (userType === "mahasiswa") {
        onLoginSuccess(createSignedSession(REGISTERED_USERS[1], 2));
      } else if (userType === "guest") {
        onLoginSuccess(GUEST_USER);
      }
    }, 250);
  };

  return (
    <div className="flex-1 p-4 pb-12 flex flex-col justify-center animate-in fade-in duration-200">
      {/* Back button jika login dibuka dari tab lain */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="self-start text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1.5 mb-3 px-2 py-1 rounded-lg hover:bg-slate-100 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </button>
      )}

      {/* Permission Redirect Alert Banner jika dipicu oleh aksi terlarang */}
      {permissionPromptMessage && (
        <div className="mb-4 bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 shadow-xs animate-in slide-in-from-top duration-200">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-extrabold block text-amber-950">
              Otorisasi Hak Akses Diperlukan
            </span>
            <p className="text-[11px] text-amber-800 mt-0.5 leading-snug">
              {permissionPromptMessage}
            </p>
          </div>
        </div>
      )}

      {/* Sesi Pengguna Aktif Saat Ini */}
      {currentUser && (
        <div className="mb-4 p-3 rounded-2xl bg-slate-100/90 border border-slate-200 flex items-center justify-between text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl bg-gradient-to-br ${
                currentUser.avatarBg || "from-slate-600 to-slate-800"
              } text-white text-xs font-black flex items-center justify-center shadow-xs`}
            >
              {currentUser.avatarInitials || "UM"}
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-medium block leading-none">
                Sesi Masuk Aktif:
              </span>
              <span className="text-xs font-extrabold text-slate-900 leading-tight block mt-0.5">
                {currentUser.name}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
            {currentUser.roleBadge}
          </span>
        </div>
      )}

      {/* Brand Header Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-teal-700/25">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
              Smart Campus FT UM
            </span>
            <h2 className="text-lg font-black text-slate-900 tracking-tight mt-1.5">
              Masuk ke ClassSense
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Sistem Otomasi &amp; Monitoring Kualitas Lingkungan Ruang Kuliah Berbasis Wireless IoT
            </p>
          </div>
        </div>

        {/* Hak Akses Info Box */}
        <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-2xl text-[11px] text-slate-600 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span>Tingkatan Hak Akses Pengguna:</span>
          </div>
          <ul className="space-y-1 text-[10px] pl-1 text-slate-600">
            <li className="flex items-start gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
              <span>
                <b>Staf Sarpras (Admin):</b> Berhak mengendalikan AC &amp; lampu jarak jauh, master shutdown energi, dan simulator telemetri IoT.
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1 shrink-0"></span>
              <span>
                <b>Mahasiswa:</b> Pemantauan suhu &amp; kualitas udara real-time, pencarian ruang kuliah, dan reservasi belajar mandiri.
              </span>
            </li>
          </ul>
        </div>

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {errorMessage && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Email Akun Kampus
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="sarpras@um.ac.id atau mahasiswa@um.ac.id"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Kata Sandi
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi akun"
                className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-teal-800 hover:bg-teal-900 active:scale-95 text-white text-xs font-extrabold rounded-xl transition shadow-md shadow-teal-900/20 flex items-center justify-center gap-2"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isLoading ? "Memverifikasi..." : "Masuk ke Sistem"}</span>
          </button>
        </form>

        {/* Divider */}
        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-extrabold">
            <span className="bg-white px-2 text-slate-400">
              Atau Pilih Akses Cepat Demo Dosen
            </span>
          </div>
        </div>

        {/* Quick Demo Login Presets */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleQuickLogin("sarpras")}
            className="w-full p-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-300 rounded-2xl flex items-center justify-between text-left transition active:scale-98 shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                SP
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 block leading-tight">
                  Staf Sarpras FT (Hak Penuh Admin)
                </span>
                <span className="text-[10px] text-emerald-800 font-semibold block">
                  Bisa Kendalikan AC &amp; Lampu, Audit, Tambah Ruangan
                </span>
              </div>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-600 text-white shrink-0">
              Pilih &gt;
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin("mahasiswa")}
            className="w-full p-2.5 bg-gradient-to-r from-sky-50 to-indigo-50 hover:from-sky-100 hover:to-indigo-100 border border-sky-300 rounded-2xl flex items-center justify-between text-left transition active:scale-98 shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                FT
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 block leading-tight">
                  Mahasiswa FT (Akses Reguler)
                </span>
                <span className="text-[10px] text-sky-800 font-semibold block">
                  Monitoring Ruang, Booking, Lapor Kendala
                </span>
              </div>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-sky-600 text-white shrink-0">
              Pilih &gt;
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin("guest")}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition text-center"
          >
            Lanjut sebagai Tamu / Publik
          </button>
        </div>
      </div>
    </div>
  );
}
