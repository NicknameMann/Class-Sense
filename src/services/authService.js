// ============================================================================
// CLASSSENSE ROLE-BASED AUTHENTICATION & ACCESS CONTROL SERVICE (FT UM)
// ============================================================================

export const REGISTERED_USERS = [
  {
    id: "usr_sarpras_01",
    email: "sarpras@um.ac.id",
    nip: "198005122008121002",
    password: "admin123",
    name: "Ir. Bambang S., M.T.",
    role: "admin",
    roleLabel: "Staf Sarpras FT UM",
    roleBadge: "Staf Sarpras (Admin)",
    department: "Subbagian Sarana & Prasarana FT UM",
    avatarInitials: "BS",
    avatarBg: "from-emerald-600 to-teal-800",
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
    nim: "240535615714",
    password: "mhs123",
    name: "Yudhistira Baraendra Rafi Agrapana",
    role: "mahasiswa",
    roleLabel: "Mahasiswa S1 Teknik Informatika",
    roleBadge: "Mahasiswa FT",
    department: "Departemen Teknik Elektro & Informatika FT UM",
    avatarInitials: "RA",
    avatarBg: "from-blue-600 to-indigo-700",
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
  name: "Pengunjung / Tamu Kampus",
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

/**
 * Autentikasi Pengguna berdasarkan Email / NIM / NIP dan Password
 */
export function authenticateUser(identifier, password) {
  const cleanId = (identifier || "").trim().toLowerCase();
  const user = REGISTERED_USERS.find(
    (u) =>
      (u.email.toLowerCase() === cleanId ||
        (u.nip && u.nip === cleanId) ||
        (u.nim && u.nim === cleanId)) &&
      u.password === password
  );

  if (user) {
    return {
      success: true,
      user,
      error: null,
    };
  }

  return {
    success: false,
    user: null,
    error: "Kredensial tidak valid. Silakan periksa Email/NIP/NIM dan kata sandi Anda.",
  };
}

/**
 * Memeriksa hak otorisasi role
 */
export function checkPermission(user, permissionKey) {
  if (!user || !user.permissions) return false;
  return Boolean(user.permissions[permissionKey]);
}

