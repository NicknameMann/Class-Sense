import React, { useState } from "react";
import {
  Building2,
  Lock,
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
  LogIn,
  Zap,
  UserCheck,
  Shield,
  UserPlus,
  Mail,
  BadgeInfo,
  Check,
} from "lucide-react";
import {
  authenticateUser,
  registerUser,
  createSignedSession,
  REGISTERED_USERS,
} from "../services/authService";

export default function LoginPage({
  onLoginSuccess,
  onCancel,
  permissionPromptMessage = null,
  currentUser = null,
  isGateMode = false,
}) {
  // Mode autentikasi: 'login' (Masuk Akun) atau 'register' (Daftar Akun Baru)
  const [authMode, setAuthMode] = useState("login");

  // State Formulir Login
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // State Formulir Registrasi Akun Baru
  const [regName, setRegName] = useState("");
  const [regIdentifier, setRegIdentifier] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regRole, setRegRole] = useState("mahasiswa"); // 'mahasiswa' atau 'admin'
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Status & Feedback
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handler Submit Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setErrorMessage("Silakan masukkan Email/NIM dan kata sandi akun Anda.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await authenticateUser(loginIdentifier, loginPassword);
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

  // Handler Submit Registrasi Akun Baru
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!regName.trim()) {
      setErrorMessage("Nama lengkap wajib diisi.");
      return;
    }
    if (!regEmail.trim() || !regEmail.includes("@")) {
      setErrorMessage("Format email tidak valid. Gunakan email aktif atau email kampus UM.");
      return;
    }
    if (!regPassword.trim() || regPassword.length < 6) {
      setErrorMessage("Kata sandi minimal harus 6 karakter.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak cocok. Silakan periksa kembali.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerUser({
        name: regName,
        identifier: regIdentifier || regEmail,
        email: regEmail,
        role: regRole,
        password: regPassword,
      });

      setIsLoading(false);
      if (result.success) {
        setSuccessMessage("Pendaftaran akun berhasil! Mengalihkan ke sistem...");
        setTimeout(() => {
          onLoginSuccess(result.user);
        }, 300);
      } else {
        setErrorMessage(result.error);
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err.message || "Gagal memproses pendaftaran akun.");
    }
  };

  // Preset Pengisian Cepat Form Login
  const handleFillLoginDemo = (userType) => {
    setErrorMessage("");
    setSuccessMessage("");
    if (userType === "sarpras") {
      setLoginIdentifier("sarpras@um.ac.id");
      setLoginPassword("admin123");
    } else if (userType === "mahasiswa") {
      setLoginIdentifier("mahasiswa@um.ac.id");
      setLoginPassword("mhs123");
    }
  };

  // Preset Login Cepat Instan
  const handleInstantDemoLogin = (userType) => {
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setTimeout(() => {
      setIsLoading(false);
      if (userType === "sarpras") {
        onLoginSuccess(createSignedSession(REGISTERED_USERS[0], 2));
      } else if (userType === "mahasiswa") {
        onLoginSuccess(createSignedSession(REGISTERED_USERS[1], 2));
      }
    }, 200);
  };

  // Preset Pengisian Contoh Registrasi
  const handleFillRegisterDemo = (type) => {
    setErrorMessage("");
    setSuccessMessage("");
    if (type === "mahasiswa") {
      setRegName("Yudhistira Baraendra Rafi");
      setRegIdentifier("240535615714");
      setRegEmail("rafi.2405356@students.um.ac.id");
      setRegRole("mahasiswa");
      setRegPassword("mhs2026");
      setRegConfirmPassword("mhs2026");
    } else {
      setRegName("Staf Sarpras Baru FT UM");
      setRegIdentifier("198908152014041002");
      setRegEmail("sarpras.baru@um.ac.id");
      setRegRole("admin");
      setRegPassword("admin2026");
      setRegConfirmPassword("admin2026");
    }
  };

  return (
    <div className="flex-1 p-4 pb-12 flex flex-col justify-center animate-in fade-in duration-200">
      {/* Back button jika login dibuka dari modal profil (bukan full-screen gate) */}
      {!isGateMode && onCancel && (
        <button
          onClick={onCancel}
          className="self-start text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1.5 mb-3 px-2 py-1 rounded-lg hover:bg-slate-100 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
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

      {/* Sesi Pengguna Aktif Saat Ini jika sedang ganti akun */}
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
              {authMode === "login" ? "Masuk ke ClassSense" : "Daftar Akun ClassSense"}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Sistem Otomasi &amp; Monitoring Kualitas Lingkungan Ruang Kuliah Berbasis Wireless IoT
            </p>
          </div>
        </div>

        {/* ================================================================== */}
        {/* INTERACTIVE MODE TOGGLE: MASUK (LOGIN) vs DAFTAR (REGISTRASI)     */}
        {/* ================================================================== */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => {
              setAuthMode("login");
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
              authMode === "login"
                ? "bg-white text-teal-900 shadow-sm border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk Akun</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("register");
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
              authMode === "register"
                ? "bg-white text-teal-900 shadow-sm border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Daftar Akun Baru</span>
          </button>
        </div>

        {/* Alert Feedback Messages */}
        {errorMessage && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ================================================================== */}
        {/* VIEW 1: FORMULIR MASUK AKUN (LOGIN)                                */}
        {/* ================================================================== */}
        {authMode === "login" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Hak Akses Info Box Singkat */}
            <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-2xl text-[11px] text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <span>Hak Akses Terotentikasi:</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-snug">
                <b>Admin Sarpras:</b> Kontrol AC/Lampu, Audit, Tambah/Hapus Ruang &amp; Simulator.
                <br />
                <b>Mahasiswa FT:</b> Monitoring Suhu/AQI, Rekomendasi SAW &amp; Reservasi Ruang.
              </p>
            </div>

            {/* Form Login Kredensial */}
            <form onSubmit={handleLoginSubmit} className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Email Kampus atau NIM / NIP
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
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
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Masukkan kata sandi akun"
                    className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-teal-800 hover:bg-teal-900 active:scale-95 text-white text-xs font-extrabold rounded-xl transition shadow-md shadow-teal-900/20 flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isLoading ? "Memverifikasi Kredensial..." : "Masuk ke Sistem"}</span>
              </button>
            </form>

            {/* Divider Presets Demo */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-extrabold">
                <span className="bg-white px-2 text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Akun Uji Demo Cepat
                </span>
              </div>
            </div>

            {/* Preset 1: Staf Sarpras (Admin) */}
            <div className="p-3 bg-gradient-to-r from-emerald-50/90 to-teal-50/90 border border-emerald-300/80 rounded-2xl space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                    SP
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block leading-tight">
                      Staf Sarpras FT UM (Admin)
                    </span>
                    <span className="text-[9px] text-emerald-800 font-bold block">
                      sarpras@um.ac.id • sandi: admin123
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Hak Penuh
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleFillLoginDemo("sarpras")}
                  className="py-1.5 px-2 bg-white hover:bg-emerald-100/60 border border-emerald-200 text-emerald-800 text-[10px] font-bold rounded-xl transition text-center active:scale-95"
                >
                  Isi Form
                </button>
                <button
                  type="button"
                  onClick={() => handleInstantDemoLogin("sarpras")}
                  className="py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-extrabold rounded-xl transition text-center shadow-xs active:scale-95 flex items-center justify-center gap-1"
                >
                  <Zap className="w-3 h-3 text-amber-300" />
                  <span>Masuk Cepat</span>
                </button>
              </div>
            </div>

            {/* Preset 2: Mahasiswa FT UM (Reguler) */}
            <div className="p-3 bg-gradient-to-r from-sky-50/90 to-indigo-50/90 border border-sky-300/80 rounded-2xl space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                    FT
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block leading-tight">
                      Mahasiswa FT UM (Reguler)
                    </span>
                    <span className="text-[9px] text-sky-800 font-bold block">
                      mahasiswa@um.ac.id • sandi: mhs123
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-200">
                  Monitoring
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleFillLoginDemo("mahasiswa")}
                  className="py-1.5 px-2 bg-white hover:bg-sky-100/60 border border-sky-200 text-sky-800 text-[10px] font-bold rounded-xl transition text-center active:scale-95"
                >
                  Isi Form
                </button>
                <button
                  type="button"
                  onClick={() => handleInstantDemoLogin("mahasiswa")}
                  className="py-1.5 px-2 bg-sky-700 hover:bg-sky-800 text-white text-[10px] font-extrabold rounded-xl transition text-center shadow-xs active:scale-95 flex items-center justify-center gap-1"
                >
                  <Zap className="w-3 h-3 text-amber-300" />
                  <span>Masuk Cepat</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* VIEW 2: FORMULIR DAFTAR AKUN BARU (SIGN UP)                        */}
        {/* ================================================================== */}
        {authMode === "register" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              {/* Nama Lengkap */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama Lengkap *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="contoh: Yudhistira Baraendra Rafi"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    required
                  />
                </div>
              </div>

              {/* NIM / NIP */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  NIM / NIP Identitas Kampus
                </label>
                <div className="relative">
                  <BadgeInfo className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regIdentifier}
                    onChange={(e) => setRegIdentifier(e.target.value)}
                    placeholder="contoh: 240535615714"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  />
                </div>
              </div>

              {/* Email Kampus / Aktif */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Email Kampus / Aktif *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="contoh: rafi.2405356@students.um.ac.id"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    required
                  />
                </div>
              </div>

              {/* Pilihan Peran (Role RBAC) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Peran di Lingkungan Kampus UM *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setRegRole("mahasiswa")}
                    className={`p-2.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between text-left ${
                      regRole === "mahasiswa"
                        ? "bg-sky-50 border-sky-400 ring-2 ring-sky-300/40"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-900">
                        Mahasiswa / Dosen
                      </span>
                      {regRole === "mahasiswa" && (
                        <Check className="w-3.5 h-3.5 text-sky-600" />
                      )}
                    </div>
                    <span className="text-[9px] text-sky-800 font-semibold block mt-1">
                      Monitoring, SAW &amp; Booking
                    </span>
                  </div>

                  <div
                    onClick={() => setRegRole("admin")}
                    className={`p-2.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between text-left ${
                      regRole === "admin"
                        ? "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300/40"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-900">
                        Staf Sarpras
                      </span>
                      {regRole === "admin" && (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </div>
                    <span className="text-[9px] text-emerald-800 font-semibold block mt-1">
                      Kendali AC, Audit &amp; Ruangan
                    </span>
                  </div>
                </div>
              </div>

              {/* Kata Sandi */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Kata Sandi (Minimal 6 Karakter) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? "text" : "password"}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Buat kata sandi akun"
                    className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Kata Sandi */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Konfirmasi Kata Sandi *
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegConfirmPassword ? "text" : "password"}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi"
                    className={`w-full pl-9 pr-9 py-2 bg-slate-50 border rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 ${
                      regConfirmPassword && regPassword === regConfirmPassword
                        ? "border-emerald-400 focus:ring-emerald-500/20 focus:border-emerald-600"
                        : "border-slate-200 focus:ring-teal-700/20 focus:border-teal-700"
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {regConfirmPassword && (
                  <p
                    className={`text-[10px] mt-1 font-bold ${
                      regPassword === regConfirmPassword ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {regPassword === regConfirmPassword
                      ? "✓ Kata sandi cocok."
                      : "✕ Kata sandi tidak cocok."}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-gradient-to-r from-teal-800 to-emerald-700 hover:from-teal-900 hover:to-emerald-800 active:scale-95 text-white text-xs font-extrabold rounded-xl transition shadow-md shadow-teal-900/20 flex items-center justify-center gap-2 mt-2"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isLoading ? "Mendaftarkan Akun..." : "Daftar & Masuk ke Sistem"}</span>
              </button>
            </form>

            {/* Tombol Bantu Demo Registrasi */}
            <div className="pt-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block text-center mb-1.5">
                Isi Otomatis Data Registrasi Uji
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleFillRegisterDemo("mahasiswa")}
                  className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 text-center transition active:scale-95"
                >
                  Contoh: Mahasiswa
                </button>
                <button
                  type="button"
                  onClick={() => handleFillRegisterDemo("sarpras")}
                  className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 text-center transition active:scale-95"
                >
                  Contoh: Staf Sarpras
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Security Note */}
        <p className="text-[10px] text-slate-400 text-center leading-relaxed">
          Autentikasi terenkripsi satu arah SHA-256 + salt dan verifikasi tanda tangan sesi digital, menjamin keamanan hak akses fasilitas kampus UM.
        </p>
      </div>
    </div>
  );
}
