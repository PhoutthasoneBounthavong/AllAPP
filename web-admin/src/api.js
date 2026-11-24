const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000/api`
    : "http://localhost:8000/api");

export function getAdminToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("sbusinesscard_admin_token") || "";
  }
  return "";
}

export function getStoredAdminUser() {
  if (typeof window !== "undefined") {
    try {
      const u = localStorage.getItem("sbusinesscard_admin_user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }
  return null;
}

export async function loginAdmin(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || "Login failed. Please check your credentials.");
  }
  if (!data.user || !["admin", "super_admin"].includes(data.user.role)) {
    throw new Error("Access Denied: Only administrator accounts can access this console.");
  }
  if (typeof window !== "undefined") {
    localStorage.setItem("sbusinesscard_admin_token", data.token);
    localStorage.setItem("sbusinesscard_admin_user", JSON.stringify(data.user));
  }
  return data;
}

export function logoutAdmin() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("sbusinesscard_admin_token");
    localStorage.removeItem("sbusinesscard_admin_user");
  }
}

function adminHeaders(extra = {}) {
  const token = getAdminToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export async function fetchDigitalCard() {
  const res = await fetch(`${API_BASE}/digital-card`, { headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to fetch digital card");
  return res.json();
}

export async function updateDigitalCard(cardData) {
  const res = await fetch(`${API_BASE}/digital-card`, {
    method: "PUT",
    headers: adminHeaders(),
    body: JSON.stringify(cardData),
  });
  if (!res.ok) throw new Error("Failed to update digital card");
  return res.json();
}

export async function getDigitalCardQr() {
  const res = await fetch(`${API_BASE}/digital-card/qr`, { headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to generate QR");
  return res.json();
}

export async function fetchScannedCards(search = "", tag = "") {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (tag) params.append("tag", tag);
  const res = await fetch(`${API_BASE}/cards?${params.toString()}`, { headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to fetch cards");
  return res.json();
}

export async function scanCardImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/scan`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getAdminToken()}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || "Failed to scan card image");
  }
  return res.json();
}

export async function createCard(cardData) {
  const res = await fetch(`${API_BASE}/cards`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(cardData),
  });
  if (!res.ok) throw new Error("Failed to save card");
  return res.json();
}

export async function updateCard(cardId, cardData) {
  const res = await fetch(`${API_BASE}/cards/${cardId}`, {
    method: "PUT",
    headers: adminHeaders(),
    body: JSON.stringify(cardData),
  });
  if (!res.ok) throw new Error("Failed to update card");
  return res.json();
}

export async function deleteCard(cardId) {
  const res = await fetch(`${API_BASE}/cards/${cardId}`, {
    method: "DELETE",
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete card");
  return res.json();
}

export async function getPublicCard(slug) {
  const res = await fetch(`${API_BASE}/c/${slug}`);
  if (!res.ok) throw new Error("Card not found");
  return res.json();
}

export const getCardVcardUrl = (id) => `${API_BASE}/cards/${id}/vcard`;
export const getPublicCardVcardUrl = (slug) => `${API_BASE}/c/${slug}/vcard`;
export const getExportCsvUrl = () => `${API_BASE}/cards/export/csv?token=${encodeURIComponent(getAdminToken())}`;
export const getDbBackupUrl = () => `${API_BASE}/admin/db-backup?token=${encodeURIComponent(getAdminToken())}`;
export const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const host = typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:8000` : "http://localhost:8000";
  return `${host}${path}`;
};

// --- Super Admin Control Panel API ---

export async function fetchAdminOverview() {
  const res = await fetch(`${API_BASE}/admin/overview`, { headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to fetch admin overview");
  return res.json();
}

export async function fetchAdminUsers() {
  const res = await fetch(`${API_BASE}/admin/users`, { headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function createAdminUser(payload) {
  const res = await fetch(`${API_BASE}/admin/users`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Failed to create user");
  return data;
}

export async function updateAdminUser(userId, payload) {
  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: "PUT",
    headers: adminHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Failed to update user");
  return data;
}

export async function deleteAdminUser(userId) {
  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: "DELETE",
    headers: adminHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Failed to delete user");
  return data;
}

export async function fetchAdminConfig() {
  const res = await fetch(`${API_BASE}/admin/config`, { headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to fetch system config");
  return res.json();
}

export async function updateAdminConfig(settings) {
  const res = await fetch(`${API_BASE}/admin/config`, {
    method: "PUT",
    headers: adminHeaders(),
    body: JSON.stringify({ settings }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Failed to update config");
  return data;
}

export async function testDatabaseConnections() {
  const res = await fetch(`${API_BASE}/admin/db-test`, { method: "POST", headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to test database connections");
  return res.json();
}

export async function fetchPostgresSqlSchema() {
  const res = await fetch(`${API_BASE}/admin/sql-schema`, { headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to load SQL schema");
  return res.json();
}
