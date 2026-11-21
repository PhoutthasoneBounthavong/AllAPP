import React, { useState, useEffect } from "react";
import {
  Users,
  ShieldCheck,
  Database,
  Layers,
  Cpu,
  HardDrive,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
  Cloud,
} from "lucide-react";
import { fetchAdminOverview } from "../api";

const ROLE_BADGES = {
  super_admin: {
    label: "Super Admin",
    cls: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  },
  admin: {
    label: "Admin",
    cls: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  pro_user: {
    label: "Pro User",
    cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  user: {
    label: "Client User",
    cls: "bg-black/[0.06] dark:bg-white/[0.1] text-[#636366] dark:text-[#AEAEB2] border-black/10 dark:border-white/10",
  },
};

export default function AdminOverview({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminOverview();
      setData(res);
    } catch (e) {
      console.error("Failed to load admin overview:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const m = data?.metrics || {};
  const settings = data?.settings || {};
  const roleCounts = data?.role_counts || {};
  const recentUsers = data?.recent_users || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0071E3]/10 text-[#0071E3] dark:text-[#409CFF] text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Super Admin Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">
            SBusinessCard System Overview
          </h1>
          <p className="text-sm text-[#86868B] mt-1">
            Monitor mobile client users, assign RBAC roles, and configure your cloud database & AI engines.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadOverview}
            className="flex items-center gap-2 px-4 py-2 rounded-apple-md bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.1] text-xs font-semibold text-[#1D1D1F] dark:text-white hover:bg-black/[0.02] transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0071E3]" : ""}`} />
            <span>Refresh Telemetry</span>
          </button>
          <button
            onClick={() => onNavigate("database")}
            className="flex items-center gap-2 px-4 py-2 rounded-apple-md bg-[#0071E3] text-white text-xs font-semibold hover:bg-[#0077ED] transition-all shadow-sm"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Database & Cloud Config</span>
          </button>
        </div>
      </div>

      {/* 4 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate("users")}
          className="apple-glass-card rounded-apple-xl p-5 border border-black/[0.06] dark:border-white/[0.08] cursor-pointer hover:border-[#0071E3]/40 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-apple-md bg-blue-500/10 flex items-center justify-center text-[#0071E3]">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-[#0071E3] flex items-center gap-0.5">
              Manage Roles <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#1D1D1F] dark:text-white">
            {m.total_users ?? "—"}
          </div>
          <div className="text-xs text-[#86868B] mt-0.5">
            Registered Accounts ({m.total_admins ?? 1} Admin)
          </div>
        </div>

        <div
          onClick={() => onNavigate("vault")}
          className="apple-glass-card rounded-apple-xl p-5 border border-black/[0.06] dark:border-white/[0.08] cursor-pointer hover:border-emerald-500/40 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-apple-md bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-0.5">
              Inspect Vault <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#1D1D1F] dark:text-white">
            {m.total_cards ?? "—"}
          </div>
          <div className="text-xs text-[#86868B] mt-0.5">
            Total Synced Business Cards
          </div>
        </div>

        <div
          onClick={() => onNavigate("database")}
          className="apple-glass-card rounded-apple-xl p-5 border border-black/[0.06] dark:border-white/[0.08] cursor-pointer hover:border-purple-500/40 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-apple-md bg-purple-500/10 flex items-center justify-center text-purple-500">
              <HardDrive className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-purple-500 flex items-center gap-0.5">
              Configure DB <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="text-base font-bold text-[#1D1D1F] dark:text-white truncate">
            {settings.db_engine === "supabase_cloud"
              ? "Supabase PostgreSQL"
              : settings.db_engine === "custom_postgres"
              ? "Enterprise PostgreSQL"
              : "Local-First + Supabase Sync"}
          </div>
          <div className="text-xs text-[#86868B] mt-1">
            DB: {m.db_size_kb ?? 0} KB • Media: {m.uploads_size_kb ?? 0} KB
          </div>
        </div>

        <div
          onClick={() => onNavigate("database")}
          className="apple-glass-card rounded-apple-xl p-5 border border-black/[0.06] dark:border-white/[0.08] cursor-pointer hover:border-amber-500/40 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-apple-md bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3" /> Active
            </span>
          </div>
          <div className="text-base font-bold text-[#1D1D1F] dark:text-white truncate">
            {settings.gemini_model || "gemini-3.5-flash-lite"}
          </div>
          <div className="text-xs text-[#86868B] mt-1">
            AI Vision + Tesseract OCR Hybrid
          </div>
        </div>
      </div>

      {/* Role Distribution & Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RBAC Role Matrix */}
        <div className="apple-glass-card rounded-apple-xl p-6 border border-black/[0.06] dark:border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0071E3]" />
              <span>RBAC Role Hierarchy</span>
            </h2>
            <button
              onClick={() => onNavigate("users")}
              className="text-xs font-semibold text-[#0071E3] hover:underline"
            >
              Edit Roles →
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {[
              {
                role: "super_admin",
                title: "Super Admin (Owner)",
                desc: "Full access to database config, all users, role assignment & system backups.",
              },
              {
                role: "admin",
                title: "Admin / Moderator",
                desc: "Manage client users, inspect platform cards vault, export reports.",
              },
              {
                role: "pro_user",
                title: "Pro Client User",
                desc: "Unlimited mobile scans, cloud sync backup, priority Gemini AI Vision.",
              },
              {
                role: "user",
                title: "Standard Client User",
                desc: `Mobile scanner app access, local vault + cloud sync (up to ${settings.max_cards_free_tier || 500} cards).`,
              },
            ].map((r) => (
              <div
                key={r.role}
                className="p-3 rounded-apple-md bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.06] flex items-start justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-[#1D1D1F] dark:text-white">{r.title}</div>
                  <div className="text-[11px] text-[#86868B] mt-0.5">{r.desc}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] dark:text-[#409CFF] font-bold text-[11px] shrink-0">
                  {roleCounts[r.role] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Accounts Table */}
        <div className="lg:col-span-2 apple-glass-card rounded-apple-xl p-6 border border-black/[0.06] dark:border-white/[0.08] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
                  Registered Client & Admin Accounts
                </h2>
                <p className="text-xs text-[#86868B]">
                  Users syncing from the SBusinessCard mobile app and web portal
                </p>
              </div>
              <button
                onClick={() => onNavigate("users")}
                className="px-3 py-1.5 rounded-apple-sm bg-[#0071E3] text-white text-xs font-semibold hover:bg-[#0077ED]"
              >
                Open Role Manager
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-black/[0.06] dark:border-white/[0.08] text-[#86868B] uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Cards Synced</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                  {recentUsers.map((u) => {
                    const badge = ROLE_BADGES[u.role] || ROLE_BADGES.user;
                    return (
                      <tr key={u.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-[#1D1D1F] dark:text-white">{u.full_name}</div>
                          <div className="text-[11px] text-[#86868B]">{u.email}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                              u.status === "suspended" ? "text-rose-500" : "text-emerald-500"
                            }`}
                          >
                            ● {u.status === "suspended" ? "Suspended" : "Active"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#1D1D1F] dark:text-white">
                          {u.cards_count || 0} cards
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs text-[#86868B]">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-[#0071E3]" />
              <span>
                Mobile App Strategy: <strong className="text-[#1D1D1F] dark:text-white">Local-First Phone Vault + Automatic Cloud Backup</strong>
              </span>
            </div>
            <button
              onClick={() => onNavigate("database")}
              className="text-[#0071E3] font-semibold hover:underline"
            >
              Switch / Export Cloud Database →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
