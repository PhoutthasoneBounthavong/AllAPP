import React, { useState } from "react";
import {
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Trash2,
  ExternalLink,
  Phone,
  Mail,
  Building,
  User,
  MapPin,
  Globe,
  Tag,
  Grid,
  List as ListIcon,
  Calendar,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { getCardVcardUrl, getExportCsvUrl, deleteCard, getImageUrl } from "../api";

export default function CardsVault({ cards, onRefresh, onSelectCard }) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
  const [selectedCard, setSelectedCard] = useState(null);

  const filteredCards = cards.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.job_title?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  });

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this business card?")) return;
    try {
      await deleteCard(id);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert("Error deleting card: " + err.message);
    }
  };

  const parseMultiplePhones = (phoneString) => {
    if (!phoneString) return [];
    const rawParts = phoneString.split(/[,/|;\n&]|\bor\b|\s{2,}/i);
    const phones = [];
    for (let part of rawParts) {
      const trimmed = part.trim();
      const digits = trimmed.replace(/[^\d]/g, "");
      if (digits.length >= 7) {
        phones.push(trimmed);
      }
    }
    if (phones.length === 0 && phoneString.trim()) {
      return [phoneString.trim()];
    }
    return phones;
  };

  const getWhatsAppUrl = (phone) => {
    if (!phone) return "";
    let clean = phone.replace(/[^\d]/g, "");
    if (clean.startsWith("0") && (clean.length === 9 || clean.length === 10)) {
      clean = "66" + clean.slice(1);
    }
    return `https://wa.me/${clean}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white flex items-center gap-2">
            <span>Cards Vault</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.1] text-[#1D1D1F] dark:text-white">
              {cards.length} Scanned
            </span>
          </h1>
          <p className="text-sm text-[#86868B] mt-1">
            Organize, search, and export all physical business cards digitized via OCR.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <a
            href={getExportCsvUrl()}
            download="contacts_export.csv"
            aria-label="Export all contacts to CSV spreadsheet"
            className="flex items-center gap-2 px-4 py-2 rounded-apple-md bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-[#0071E3]"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" aria-hidden="true" />
            <span>Export to CSV</span>
          </a>

          {/* Grid / Table Toggle */}
          <div className="flex items-center p-1 rounded-apple-md bg-black/[0.05] dark:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.06]" role="group" aria-label="View layout options">
            <button
              onClick={() => setViewMode("grid")}
              aria-label="Switch to Grid View"
              aria-pressed={viewMode === "grid"}
              className={`p-2 rounded-apple-sm text-xs transition-all focus-visible:ring-2 focus-visible:ring-[#0071E3] ${viewMode === "grid"
                ? "bg-white dark:bg-[#2C2C2E] text-[#0071E3] shadow-sm"
                : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                }`}
            >
              <Grid className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              aria-label="Switch to Table View"
              aria-pressed={viewMode === "table"}
              className={`p-2 rounded-apple-sm text-xs transition-all focus-visible:ring-2 focus-visible:ring-[#0071E3] ${viewMode === "table"
                ? "bg-white dark:bg-[#2C2C2E] text-[#0071E3] shadow-sm"
                : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                }`}
            >
              <ListIcon className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search contacts"
          placeholder="Search contacts by name, company, title, email, or phone..."
          className="w-full pl-10 pr-4 py-2.5 rounded-apple-md bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3] shadow-sm"
        />
      </div>


      {/* Cards Display */}
      {filteredCards.length === 0 ? (
        <div className="apple-glass rounded-apple-xl p-12 text-center border border-dashed border-black/[0.1] dark:border-white/[0.1]">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/30 text-[#0071E3] flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-white">No business cards found</h3>
          <p className="text-xs text-[#86868B] mt-1 max-w-sm mx-auto">
            {search
              ? "No contacts matched your search query. Try typing another name or keyword."
              : "You haven't scanned any business cards yet. Head over to Quick Scanner to scan your first card!"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              onClick={() => setSelectedCard(card)}
              className="apple-glass-card rounded-apple-xl p-5 cursor-pointer hover:shadow-apple-md hover:border-black/20 dark:hover:border-white/20 transition-all duration-200 relative group flex flex-col justify-between"
            >
              <div>
                {/* Header: Name & Company */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-apple-md bg-gradient-to-br from-[#0071E3] to-[#409CFF] text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                      {(card.full_name || "C")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold tracking-tight text-[#1D1D1F] dark:text-white truncate">
                        {card.full_name || "Unnamed Contact"}
                      </h3>
                      <p className="text-xs text-[#86868B] truncate">{card.job_title || "Professional"}</p>
                    </div>
                  </div>

                  <span className="text-[10px] text-[#86868B] font-medium shrink-0">
                    {new Date(card.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Company Tag */}
                {card.company && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0071E3] dark:text-[#409CFF] mb-3">
                    <Building className="w-3.5 h-3.5" />
                    <span className="truncate">{card.company}</span>
                  </div>
                )}

                {/* Contact Snippets */}
                <div className="space-y-1.5 text-xs text-[#0071E3] dark:text-[#AEAEB2] mb-4">
                  {card.phone && (
                    <div className="space-y-1">
                      {parseMultiplePhones(card.phone).map((p, pIdx, arr) => (
                        <div key={pIdx} className="flex items-center justify-between gap-2 truncate">
                          <div className="flex items-center gap-2 truncate min-w-0">
                            <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="truncate">{p}</span>
                          </div>
                          <a
                            href={getWhatsAppUrl(p)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-semibold transition-colors shrink-0"
                            title={`Chat on WhatsApp (${p})`}
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>{arr.length > 1 ? `WA #${pIdx + 1}` : "WhatsApp"}</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                  {card.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{card.email}</span>
                    </div>
                  )}
                  {card.website && (
                    <div className="flex items-center gap-2 truncate">
                      <Globe className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span className="truncate">{card.website}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
                <a
                  href={getCardVcardUrl(card.id)}
                  download
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0071E3] hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>vCard (.vcf)</span>
                </a>

                <button
                  onClick={(e) => handleDelete(card.id, e)}
                  className="p-1.5 text-[#86868B] hover:text-rose-500 rounded-apple-sm hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="apple-glass rounded-apple-xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/[0.02] dark:bg-white/[0.04] border-b border-black/[0.06] dark:border-white/[0.08] text-[#86868B] uppercase font-semibold text-[10px]">
              <tr>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {filteredCards.map((card) => (
                <tr
                  key={card.id}
                  onClick={() => setSelectedCard(card)}
                  className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-[#1D1D1F] dark:text-white">
                    <div className="font-bold">{card.full_name || "—"}</div>
                    <div className="text-[11px] text-[#86868B]">{card.job_title}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#0071E3] dark:text-[#409CFF]">{card.company || "—"}</td>
                  <td className="px-4 py-3 text-[#636366] dark:text-[#AEAEB2]">
                    {card.phone ? (
                      <div className="space-y-0.5">
                        {parseMultiplePhones(card.phone).map((p, pIdx) => (
                          <div key={pIdx}>{p}</div>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#636366] dark:text-[#AEAEB2]">{card.email || "—"}</td>
                  <td className="px-4 py-3 text-[#86868B]">{new Date(card.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      {card.phone &&
                        parseMultiplePhones(card.phone).map((p, pIdx, arr) => (
                          <a
                            key={pIdx}
                            href={getWhatsAppUrl(p)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-apple-sm transition-colors"
                            title={`Chat on WhatsApp (${p})`}
                          >
                            <span className="flex items-center text-[10px] font-bold gap-0.5">
                              <MessageCircle className="w-3.5 h-3.5" />
                              {arr.length > 1 && <span>#{pIdx + 1}</span>}
                            </span>
                          </a>
                        ))}
                      <a
                        href={getCardVcardUrl(card.id)}
                        download
                        className="p-1.5 text-[#0071E3] hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-apple-sm"
                        title="Download vCard"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={(e) => handleDelete(card.id, e)}
                        className="p-1.5 text-[#86868B] hover:text-rose-500 rounded-apple-sm hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Card Details Modal Sheet */}
      {selectedCard && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="card-detail-title"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="apple-glass-card rounded-apple-2xl p-6 max-w-md w-full shadow-2xl border border-black/10 dark:border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div>
                <h2 id="card-detail-title" className="text-lg font-bold text-[#1D1D1F] dark:text-white">{selectedCard.full_name}</h2>
                <p className="text-xs text-[#86868B]">{selectedCard.job_title}</p>
              </div>
              <button
                onClick={() => setSelectedCard(null)}
                aria-label="Close dialog"
                className="w-8 h-8 rounded-full bg-black/[0.05] dark:bg-white/[0.1] text-xs font-semibold flex items-center justify-center hover:opacity-70 focus-visible:ring-2 focus-visible:ring-[#0071E3]"
              >
                ✕
              </button>
            </div>


            <div className="py-4 space-y-3 text-xs">
              {selectedCard.company && (
                <div className="flex items-center gap-3">
                  <Building className="w-4 h-4 text-[#0071E3]" />
                  <span className="font-medium text-[#1D1D1F] dark:text-white">{selectedCard.company}</span>
                </div>
              )}
              {selectedCard.phone && (
                <div className="space-y-2">
                  {parseMultiplePhones(selectedCard.phone).map((p, pIdx, arr) => (
                    <div key={pIdx} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-emerald-500" />
                        <a href={`tel:${p}`} className="hover:underline text-emerald-600 dark:text-emerald-400 font-medium">
                          {p}
                        </a>
                      </div>
                      <a
                        href={getWhatsAppUrl(p)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-apple-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold transition-colors"
                        title={`Chat on WhatsApp (${p})`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{arr.length > 1 ? `WhatsApp #${pIdx + 1}` : "WhatsApp"}</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
              {selectedCard.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <a href={`mailto:${selectedCard.email}`} className="hover:underline text-blue-600 dark:text-blue-400 font-medium">
                    {selectedCard.email}
                  </a>
                </div>
              )}
              {selectedCard.website && (
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-purple-500" />
                  <a href={selectedCard.website} target="_blank" rel="noreferrer" className="hover:underline text-purple-600 dark:text-purple-400 font-medium truncate">
                    {selectedCard.website}
                  </a>
                </div>
              )}
              {selectedCard.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <span className="text-[#636366] dark:text-[#AEAEB2]">{selectedCard.address}</span>
                </div>
              )}
            </div>

            {selectedCard.image_url && (
              <div className="mt-2 mb-4 rounded-apple-md overflow-hidden border border-black/10 dark:border-white/10">
                <img src={getImageUrl(selectedCard.image_url)} alt="Scanned Card" className="w-full h-auto object-cover" />
              </div>
            )}

            <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-wrap items-center justify-end gap-2">
              {selectedCard.phone &&
                parseMultiplePhones(selectedCard.phone).map((p, pIdx, arr) => (
                  <a
                    key={pIdx}
                    href={getWhatsAppUrl(p)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-apple-md bg-emerald-600 text-white text-xs font-semibold shadow-sm hover:bg-emerald-700 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{arr.length > 1 ? `WhatsApp #${pIdx + 1}` : "Chat on WhatsApp"}</span>
                  </a>
                ))}
              <a
                href={getCardVcardUrl(selectedCard.id)}
                download
                className="flex items-center gap-1.5 px-4 py-2 rounded-apple-md bg-[#0071E3] text-white text-xs font-semibold shadow-sm hover:bg-[#0077ED]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save to Phone Contacts (.vcf)</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
