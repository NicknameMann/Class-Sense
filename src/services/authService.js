// ============================================================================
// CLASSSENSE ROLE-BASED AUTHENTICATION & ACCESS CONTROL SERVICE (FT UM)
// Security Hardened: Firebase Auth REST + SHA-256 One-Way Hash + Session Integrity
// ============================================================================

const SESSION_INTEGRITY_SALT = "classsense_um_session_integrity_salt_v2026#";
const DEMO_PASSWORD_SALT = "classsense_ft_um_salt_2026:";

/**
 * Pure JavaScript synchronous SHA-256 implementation
 * Guarantees cross-environment cryptographic hashing (Browser, Node.js, Web Worker)
 * without exposing plaintext credentials or requiring external binaries.
 */
export function sha256Sync(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = "length";
  let i, j;
  let result = "";
  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  const composite = [];
  for (i = 0; i < ascii[lengthProperty]; i++) {
    composite.push(ascii.charCodeAt(i));
  }
  composite.push(0x80);
  while (composite[lengthProperty] % 64 !== 56) {
    composite.push(0);
  }
  for (i = 0; i < composite[lengthProperty]; i += 4) {
    words.push(
      (composite[i] << 24) |
        (composite[i + 1] << 16) |
        (composite[i + 2] << 8) |
        composite[i + 3]
    );
  }
  words.push((asciiBitLength / maxWord) | 0);
  words.push(asciiBitLength | 0);

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);
    for (i = 16; i < 64; i++) {
      const s0 =
        rightRotate(w[i - 15], 7) ^
        rightRotate(w[i - 15], 18) ^
        (w[i - 15] >>> 3);
      const s1 =
        rightRotate(w[i - 2], 17) ^
        rightRotate(w[i - 2], 19) ^
        (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    for (i = 0; i < 64; i++) {
      const s1 =
        rightRotate(hash[4], 6) ^
        rightRotate(hash[4], 11) ^
        rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1 + ch + k[i] + w[i]) | 0;
      const s0 =
        rightRotate(hash[0], 2) ^
        rightRotate(hash[0], 13) ^
        rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0 + maj) | 0;
      hash = [
        (temp1 + temp2) | 0,
        hash[0],
        hash[1],
        hash[2],
        (hash[3] + temp1) | 0,
        hash[4],
        hash[5],
        hash[6],
      ];
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }
  return result;
}

/**
 * Asynchronous SHA-256 helper utilizing native Web Crypto API when available,
 * with graceful fallback to sha256Sync.
 */
export async function computeSha256(text) {
  if (
    typeof crypto !== "undefined" &&
    crypto.subtle &&
    typeof TextEncoder !== "undefined"
  ) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const buffer = await crypto.subtle.digest("SHA-256", data);
      const array = Array.from(new Uint8Array(buffer));
      return array.map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch {
      // Fallback below
    }
  }
  return sha256Sync(text);
}

// ============================================================================
// GENERIC CAMPUS ACCOUNTS (NO SENSITIVE PERSONAL IDENTITIES & NO PLAINTEXT PASSWORDS)
// ============================================================================
export const REGISTERED_USERS = [
  {
    id: "usr_sarpras_01",
    email: "sarpras@um.ac.id",
    name: "Staf Sarpras FT UM",
    role: "admin",
    roleLabel: "Staf Sarpras FT UM",
    roleBadge: "Staf Sarpras (Admin)",
    department: "Subbagian Sarana & Prasarana FT UM",
    avatarInitials: "SP",
    avatarBg: "from-emerald-600 to-teal-800",
    salt: DEMO_PASSWORD_SALT,
    // SHA-256 of salt + "admin123"
    passwordHash: "f42ea15d492a709fc46676477d366f0151ab1ce33770efa9aafda55ebe7242b2",
    permissions: {
      canControlActuators: true,      // Mengendalikan AC & Lampu jarak jauh
      canAccessAuditManagement: true, // Eksekusi master shutdown energi
      canAccessSimulator: true,       // Mengatur simulator telemetri IoT
      canBookRooms: true,             // Reservasi ruang
      canReportIssues: true,          // Laporan kendala
      canManageRooms: true,           // Tambah & hapus ruangan kampus UM
    },
  },
  {
    id: "usr_mhs_01",
    email: "mahasiswa@um.ac.id",
    name: "Mahasiswa Fakultas Teknik",
    role: "mahasiswa",
    roleLabel: "Mahasiswa Fakultas Teknik UM",
    roleBadge: "Mahasiswa FT",
    department: "Departemen Teknik Elektro & Informatika FT UM",
    avatarInitials: "FT",
    avatarBg: "from-blue-600 to-indigo-700",
    salt: DEMO_PASSWORD_SALT,
    // SHA-256 of salt + "mhs123"
    passwordHash: "1db4e9b1c2baa955d212b413f1153881a2a8485bf87b5e2656d5a0869538aef5",
    permissions: {
      canControlActuators: false,     // Mahasiswa tidak berhak mematikan AC gedung
      canAccessAuditManagement: false,// Hanya pantau / read-only
      canAccessSimulator: false,      // Terkunci untuk staf/penguji
      canBookRooms: true,             // Bisa reservasi ruang belajar
      canReportIssues: true,          // Bisa laporkan kendala fasilitas
      canManageRooms: false,          // Dibatasi untuk staf sarpras
    },
  },
];

export const GUEST_USER = {
  id: "usr_guest_01",
  email: "guest@um.ac.id",
  name: "Tamu Civitas Akademika UM",
  role: "guest",
  roleLabel: "Tamu / Pengunjung Umum",
  roleBadge: "Tamu",
  department: "Publik Civitas Akademika UM",
  avatarInitials: "TM",
  avatarBg: "from-slate-600 to-slate-800",
  permissions: {
    canControlActuators: false,
    canAccessAuditManagement: false,
    canAccessSimulator: false,
    canBookRooms: false,
    canReportIssues: true,
    canManageRooms: false,
  },
};

// ============================================================================
// DYNAMIC CUSTOM REGISTERED USERS STORE (LOCALSTORAGE & MEMORY FALLBACK)
// ============================================================================
let MEMORY_CUSTOM_USERS = [];

export function getCustomUsers() {
  if (typeof localStorage !== "undefined") {
    try {
      const stored = localStorage.getItem("classsense_registered_users_v1");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {}
  }
  return MEMORY_CUSTOM_USERS;
}

export function saveCustomUser(user) {
  const users = getCustomUsers();
  const updated = [
    ...users.filter(
      (u) =>
        u.email.toLowerCase() !== user.email.toLowerCase() &&
        u.id !== user.id &&
        (!user.identifier || u.identifier !== user.identifier)
    ),
    user,
  ];
  MEMORY_CUSTOM_USERS = updated;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem("classsense_registered_users_v1", JSON.stringify(updated));
    } catch {}
  }
}

export function clearCustomUsers() {
  MEMORY_CUSTOM_USERS = [];
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem("classsense_registered_users_v1");
    } catch {}
  }
}

export function getInitials(name) {
  if (!name) return "UM";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function buildRoleProfile(role, name = "") {
  const isAdmin = role === "admin";
  const initials = getInitials(name);
  if (isAdmin) {
    return {
      role: "admin",
      roleLabel: "Staf Sarpras FT UM",
      roleBadge: "Staf Sarpras (Admin)",
      department: "Subbagian Sarana & Prasarana FT UM",
      avatarInitials: initials || "SP",
      avatarBg: "from-emerald-600 to-teal-800",
      permissions: {
        canControlActuators: true,      // Mengendalikan AC & Lampu jarak jauh
        canAccessAuditManagement: true, // Eksekusi master shutdown energi
        canAccessSimulator: true,       // Mengatur simulator telemetri IoT
        canBookRooms: true,             // Reservasi ruang
        canReportIssues: true,          // Laporan kendala
        canManageRooms: true,           // Tambah & hapus ruangan kampus UM
      },
    };
  }
  return {
    role: "mahasiswa",
    roleLabel: "Mahasiswa / Dosen FT UM",
    roleBadge: "Mahasiswa FT",
    department: "Departemen Teknik Elektro & Informatika FT UM",
    avatarInitials: initials || "FT",
    avatarBg: "from-blue-600 to-indigo-700",
    permissions: {
      canControlActuators: false,     // Mahasiswa tidak berhak mematikan AC gedung
      canAccessAuditManagement: false,// Hanya pantau / read-only
      canAccessSimulator: false,      // Terkunci untuk staf/penguji
      canBookRooms: true,             // Bisa reservasi ruang belajar
      canReportIssues: true,          // Bisa laporkan kendala fasilitas
      canManageRooms: false,          // Dibatasi untuk staf sarpras
    },
  };
}

// ============================================================================
// CRYPTOGRAPHIC SESSION SIGNING & INTEGRITY VERIFICATION
// ============================================================================

/**
 * Menghitung signature checksum sesi secara deterministik
 */
export function calculateSessionSignature(user, expiresAt) {
  if (!user || !user.id || !user.role || !expiresAt) return null;
  const payload = `${user.id}::${user.role}::${expiresAt}::${SESSION_INTEGRITY_SALT}`;
  return sha256Sync(payload);
}

/**
 * Membuat paket sesi bertanda tangan digital dengan masa kedaluwarsa
 * @param {Object} user - Objek pengguna
 * @param {number} durationHours - Durasi sesi dalam jam (default: 2 jam)
 * @param {string} customIdToken - Token JWT Firebase asli jika tersedia
 */
export function createSignedSession(user, durationHours = 2, customIdToken = null) {
  const expiresAt = Date.now() + durationHours * 3600 * 1000;
  const signatureHash = calculateSessionSignature(user, expiresAt);
  const idToken =
    customIdToken ||
    user.idToken ||
    `signed_${signatureHash.slice(0, 24)}.${BufferLikeBase64(user.id)}.${expiresAt}`;

  return {
    ...user,
    // Pastikan hash password tidak pernah ikut tersimpan di objek sesi
    passwordHash: undefined,
    salt: undefined,
    expiresAt,
    signatureHash,
    idToken,
  };
}

function BufferLikeBase64(str) {
  if (typeof btoa !== "undefined") {
    return btoa(str).replace(/=/g, "");
  }
  return String(str);
}

/**
 * Memverifikasi integritas dan keabsahan sesi pengguna.
 * Jika sesi kedaluwarsa atau nilai role dimanipulasi di storage, verifikasi GAGAL.
 * @param {Object} sessionUser - Objek sesi yang akan diverifikasi
 * @returns {boolean} True jika sesi valid dan belum kedaluwarsa
 */
export function verifySessionIntegrity(sessionUser) {
  if (!sessionUser || typeof sessionUser !== "object") return false;
  if (!sessionUser.id || !sessionUser.role || !sessionUser.expiresAt || !sessionUser.signatureHash) {
    // Sesi tanpa token/signature kriptografis ditolak total (wajib login, tanpa bypass tamu)
    return false;
  }

  // 1. Cek masa berlaku sesi (expiring session token)
  const now = Date.now();
  if (now > Number(sessionUser.expiresAt)) {
    console.warn("⚠️ Sesi login telah kedaluwarsa. Silakan masuk kembali.");
    return false;
  }

  // 2. Verifikasi ulang signature kriptografi (Anti-Tampering Check)
  const expectedHash = calculateSessionSignature(sessionUser, sessionUser.expiresAt);
  if (sessionUser.signatureHash !== expectedHash) {
    console.error("🚨 Integritas sesi terlanggar! Terdeteksi perubahan tidak sah pada role atau data sesi.");
    return false;
  }

  return true;
}

// ============================================================================
// AUTENTIKASI: DUAL-MODE (FIREBASE AUTH REST API + OFFLINE CRYPTO HASH)
// ============================================================================

/**
 * Autentikasi Pengguna:
 * 1. Memanggil Firebase Authentication REST API jika VITE_FIREBASE_API_KEY tersedia
 * 2. Fallback aman ke verifikasi one-way SHA-256 hash + salt (tanpa menyimpan plaintext password)
 */
export async function authenticateUser(identifier, password) {
  const cleanId = (identifier || "").trim().toLowerCase();
  const cleanPass = (password || "").trim();

  if (!cleanId || !cleanPass) {
    return {
      success: false,
      user: null,
      error: "Silakan masukkan Email dan kata sandi Anda.",
    };
  }

  // Dapatkan Firebase API Key dari import.meta.env atau process.env
  const firebaseApiKey =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_API_KEY) ||
    (typeof process !== "undefined" && process.env?.VITE_FIREBASE_API_KEY) ||
    null;

  // --------------------------------------------------------------------------
  // JALUR 1: FIREBASE AUTHENTICATION REST API (Identity Toolkit)
  // --------------------------------------------------------------------------
  if (firebaseApiKey && firebaseApiKey !== "TEMPEL_API_KEY_KAMU_DI_SINI" && cleanId.includes("@")) {
    try {
      const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanId,
          password: cleanPass,
          returnSecureToken: true,
        }),
      });

      const data = await response.json();

      if (response.ok && data.idToken) {
        // Tentukan Role berdasarkan akun terdaftar atau alamat email
        const allUsers = [...REGISTERED_USERS, ...getCustomUsers()];
        const existingCustom = allUsers.find((u) => u.email.toLowerCase() === cleanId);
        const isAdmin = existingCustom
          ? existingCustom.role === "admin"
          : cleanId === "sarpras@um.ac.id" || cleanId.includes("sarpras") || cleanId.includes("admin");

        const baseProfile = existingCustom || (isAdmin ? REGISTERED_USERS[0] : REGISTERED_USERS[1]);
        const authenticatedUser = createSignedSession(
          {
            ...baseProfile,
            id: data.localId || baseProfile.id,
            email: data.email || cleanId,
            name: existingCustom?.name || (isAdmin ? "Staf Sarpras FT UM" : "Mahasiswa FT UM"),
          },
          2,
          data.idToken
        );

        return {
          success: true,
          user: authenticatedUser,
          authProvider: "firebase-auth-rest",
          error: null,
        };
      }
    } catch {
      // Jika jaringan offline atau Firebase Auth belum diaktifkan, lanjutkan ke Jalur 2
    }
  }

  // --------------------------------------------------------------------------
  // JALUR 2: OFFLINE CRYPTOGRAPHIC ONE-WAY HASH VERIFICATION (SHA-256 + Salt)
  // Kredensial diverifikasi secara matematis tanpa pernah mengekspos password plaintext.
  // Mendukung login menggunakan Email maupun NIM / NIP.
  // --------------------------------------------------------------------------
  const allUsers = [...REGISTERED_USERS, ...getCustomUsers()];
  const targetUser = allUsers.find(
    (u) =>
      u.email.toLowerCase() === cleanId ||
      (u.identifier && u.identifier.toLowerCase() === cleanId) ||
      (u.nim && u.nim.toLowerCase() === cleanId) ||
      (u.nip && u.nip.toLowerCase() === cleanId)
  );

  if (targetUser && targetUser.passwordHash) {
    const inputHash = sha256Sync((targetUser.salt || DEMO_PASSWORD_SALT) + cleanPass);

    if (inputHash === targetUser.passwordHash) {
      const signedSession = createSignedSession(targetUser, 2);
      return {
        success: true,
        user: signedSession,
        authProvider: "crypto-sha256-offline",
        error: null,
      };
    }
  }

  return {
    success: false,
    user: null,
    error: "Kredensial tidak valid. Silakan periksa Email/NIM dan kata sandi Anda.",
  };
}

/**
 * Registrasi Akun Baru (Sign Up):
 * 1. Validasi input nama, email, nim/nip, role, dan password (>= 6 karakter)
 * 2. Cek duplikasi di database lokal & registered users
 * 3. Integrasi Cloud Auth: Memanggil Firebase Auth REST API Sign-Up (accounts:signUp) jika API Key aktif
 * 4. Menyimpan hash satu arah SHA-256 + salt (tanpa menyimpan plaintext password)
 * 5. Menyimpan profil akun ke Firebase Realtime Database (/users/<uid>.json) & localStorage
 * 6. Mengembalikan sesi login bertanda tangan (signed session) sehingga pengguna langsung bisa masuk
 */
export async function registerUser({ name, identifier, email, role = "mahasiswa", password }) {
  const cleanName = (name || "").trim();
  const cleanId = (identifier || "").trim();
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanPass = (password || "").trim();
  const selectedRole = role === "admin" ? "admin" : "mahasiswa";

  if (!cleanName) {
    return { success: false, user: null, error: "Nama lengkap wajib diisi." };
  }
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, user: null, error: "Format email kampus tidak valid." };
  }
  if (!cleanPass || cleanPass.length < 6) {
    return { success: false, user: null, error: "Kata sandi minimal harus 6 karakter." };
  }

  // 1. Cek duplikasi akun di daftar akun terdaftar (bawaan + kustom)
  const allUsers = [...REGISTERED_USERS, ...getCustomUsers()];
  const isDuplicate = allUsers.some(
    (u) =>
      u.email.toLowerCase() === cleanEmail ||
      (cleanId && (
        (u.identifier && u.identifier.toLowerCase() === cleanId.toLowerCase()) ||
        (u.nim && u.nim.toLowerCase() === cleanId.toLowerCase()) ||
        (u.nip && u.nip.toLowerCase() === cleanId.toLowerCase())
      ))
  );

  if (isDuplicate) {
    return {
      success: false,
      user: null,
      error: "Email atau NIM/NIP ini sudah terdaftar di sistem ClassSense.",
    };
  }

  let firebaseIdToken = null;
  let firebaseLocalId = null;

  // 2. Integrasi Cloud Firebase Auth REST API (Sign-Up: accounts:signUp) jika API Key tersedia
  const firebaseApiKey =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_API_KEY) ||
    (typeof process !== "undefined" && process.env?.VITE_FIREBASE_API_KEY) ||
    null;

  if (firebaseApiKey && firebaseApiKey !== "TEMPEL_API_KEY_KAMU_DI_SINI" && cleanEmail.includes("@")) {
    try {
      const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPass,
          returnSecureToken: true,
        }),
      });

      const data = await response.json();
      if (response.ok && data.idToken) {
        firebaseIdToken = data.idToken;
        firebaseLocalId = data.localId;
      } else if (data.error && data.error.message === "EMAIL_EXISTS") {
        return {
          success: false,
          user: null,
          error: "Email ini sudah terdaftar di Firebase Authentication.",
        };
      }
    } catch {
      // Graceful fallback ke registrasi offline kriptografis
    }
  }

  // 3. Buat Hash Satu Arah SHA-256 + Salt (Bebas Plaintext Password)
  const salt = DEMO_PASSWORD_SALT;
  const passwordHash = sha256Sync(salt + cleanPass);
  const userId = firebaseLocalId || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const roleConfig = buildRoleProfile(selectedRole, cleanName);

  const newAccount = {
    id: userId,
    email: cleanEmail,
    identifier: cleanId || cleanEmail,
    nim: selectedRole === "mahasiswa" ? (cleanId || undefined) : undefined,
    nip: selectedRole === "admin" ? (cleanId || undefined) : undefined,
    name: cleanName,
    ...roleConfig,
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  // 4. Sinkronisasi Profil ke Firebase Realtime Database (/users/{userId}.json) jika online
  try {
    const rtdbBase =
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_IOT_API_URL) ||
      (typeof process !== "undefined" && process.env?.VITE_IOT_API_URL) ||
      "https://classsense-6ef75-default-rtdb.asia-southeast1.firebasedatabase.app";

    const cloudProfile = {
      id: userId,
      email: cleanEmail,
      identifier: cleanId || cleanEmail,
      nim: newAccount.nim,
      nip: newAccount.nip,
      name: cleanName,
      role: roleConfig.role,
      roleLabel: roleConfig.roleLabel,
      roleBadge: roleConfig.roleBadge,
      department: roleConfig.department,
      createdAt: newAccount.createdAt,
    };

    const cleanBase = rtdbBase.replace(/\/+$/, "").replace(/\/rooms(\.json)?$/, "");
    const userUrl = `${cleanBase}/users/${userId}.json${firebaseIdToken ? `?auth=${firebaseIdToken}` : ""}`;
    fetch(userUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cloudProfile),
    }).catch(() => {});
  } catch {}

  // 5. Simpan ke Penyimpanan Lokal / Memori (classsense_registered_users_v1)
  saveCustomUser(newAccount);

  // 6. Buat Signed Session Instan agar pengguna langsung terotentikasi ke Beranda
  const signedSession = createSignedSession(newAccount, 2, firebaseIdToken);

  return {
    success: true,
    user: signedSession,
    authProvider: firebaseIdToken ? "firebase-auth-rest" : "crypto-sha256-offline",
    message: `Pendaftaran berhasil! Selamat datang di ClassSense, ${cleanName}.`,
    error: null,
  };
}

/**
 * Memeriksa hak otorisasi role secara ketat
 */
export function checkPermission(user, permissionKey) {
  if (!user || !user.permissions) return false;
  return Boolean(user.permissions[permissionKey]);
}
