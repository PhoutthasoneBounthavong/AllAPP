const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000/api`
    : "http://localhost:8000/api");

export async function fetchDigitalCard() {
  const res = await fetch(`${API_BASE}/digital-card`);
  if (!res.ok) throw new Error("Failed to fetch digital card");
  return res.json();
}

export async function updateDigitalCard(cardData) {
  const res = await fetch(`${API_BASE}/digital-card`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cardData),
  });
  if (!res.ok) throw new Error("Failed to update digital card");
  return res.json();
}

export async function getDigitalCardQr() {
  const res = await fetch(`${API_BASE}/digital-card/qr`);
  if (!res.ok) throw new Error("Failed to generate QR");
  return res.json();
}

export async function fetchScannedCards(search = "", tag = "") {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (tag) params.append("tag", tag);
  const res = await fetch(`${API_BASE}/cards?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch cards");
  return res.json();
}

export async function scanCardImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/scan`, {
    method: "POST",
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cardData),
  });
  if (!res.ok) throw new Error("Failed to save card");
  return res.json();
}

export async function updateCard(cardId, cardData) {
  const res = await fetch(`${API_BASE}/cards/${cardId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cardData),
  });
  if (!res.ok) throw new Error("Failed to update card");
  return res.json();
}

export async function deleteCard(cardId) {
  const res = await fetch(`${API_BASE}/cards/${cardId}`, {
    method: "DELETE",
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
export const getExportCsvUrl = () => `${API_BASE}/cards/export/csv`;
export const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const host = typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:8000` : "http://localhost:8000";
  return `${host}${path}`;
};
