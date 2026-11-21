import React, { useState, useEffect } from "react";
import {
  Database,
  Cloud,
  Server,
  Cpu,
  Download,
  Copy,
  CheckCircle2,
  Activity,
  Save,
  Code2,
} from "lucide-react";
import {
  fetchAdminConfig,
  updateAdminConfig,
  testDatabaseConnections,
  fetchPostgresSqlSchema,
  getDbBackupUrl,
} from "../api";

export default function DatabaseConfig() {
  const [settings, setSettings] = useState({
    db_engine: "sqlite_plus_supabase_backup",
    supabase_url: "",
    custom_database_url: "",
    auto_cloud_backup: "true",
    gemini_model: "gemini-3.5-flash-lite",
    ocr_fallback_enabled: "true",
    allow_public_registration: "true",
    default_user_role: "user",
    max_cards_free_tier: "500",
  });
  const [dbInfo, setDbInfo] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sqlSchema, setSqlSchema] = useState("");
  const [copiedSql, setCopiedSql] = useState(false);
  const [notice, setNotice] = useState("");

  const loadConfig = async () => {
    try {
      const [cfgRes, sqlRes] = await Promise.all([
        fetchAdminConfig(),
        fetchPostgresSqlSchema().catch(() => ({ sql: "" })),
      ]);
      if (cfgRes.settings) setSettings((prev) => ({ ...prev, ...cfgRes.settings }));
      if (cfgRes.database_info) setDbInfo(cfgRes.database_info);
      if (sqlRes.sql) setSqlSchema(sqlRes.sql);
    } catch (e) {
      console.error("Failed to load config:", e);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateAdminConfig(settings);
      setSettings((prev) => ({ ...prev, ...res.settings }));
      setNotice("Database & system configuration saved successfully!");
      setTimeout(() => setNotice(""), 3500);
    } catch (err) {
      alert("Error saving configuration: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnections = async () => {
    setTesting(true);
    try {
      const res = await testDatabaseConnections();
      setTestResults(res.results);
    } catch (err) {
      alert("Connection test failed: " + err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleCopySql = () => {
    if (!sqlSchema) return;
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-[#0071E3]" />
            <span>Database, Cloud Sync & System Config</span>
          </h1>
          <p className="text-sm text-[#86868B] mt-1">
            Configure your active database mode, test cloud connections, export full backups, or migrate to enterprise PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleTestConnections}
            disabled={testing}
            className="flex items-center gap-2 px-4 py-2 rounded-apple-md bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.1] text-xs font-semibold text-[#1D1D1F] dark:text-white hover:bg-black/[0.02] shadow-sm"
          >
            <Activity className={`w-4 h-4 text-emerald-500 ${testing ? "animate-pulse" : ""}`} />
            <span>{testing ? "Testing Connections..." : "Test DB Connections"}</span>
          </button>

          <a
            href={getDbBackupUrl()}
            download="sbusinesscard_full_db_backup.json"
            className="flex items-center gap-2 px-4 py-2 rounded-apple-md bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Full Database Backup (.json)</span>
          </a>
        </div>
      </div>

      {notice && (
        <div className="px-4 py-2.5 rounded-apple-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Live Connection Test Results */}
      {testResults && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(testResults).map(([key, info]) => (
            <div
              key={key}
              className={`p-4 rounded-apple-xl border flex items-center justify-between ${
                info.ok
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
              }`}
            >
              <div>
                <div className="text-xs font-bold uppercase tracking-wider">
                  {key === "sqlite" ? "Primary Engine (SQLite WAL)" : "Supabase Cloud PostgreSQL"}
                </div>
                <div className="text-xs mt-0.5">{info.message}</div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-black/10 dark:bg-white/10 text-xs font-mono font-bold">
                {info.latency_ms} ms
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Database Engine & Cloud Credentials */}
        <div className="lg:col-span-2 apple-glass-card rounded-apple-xl p-6 border border-black/[0.06] dark:border-white/[0.08] space-y-5">
          <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-[#0071E3]" />
            <span>1. Database Architecture & Cloud Migration</span>
          </h2>

          {/* 3 Architecture Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: "sqlite_plus_supabase_backup",
                title: "Hybrid Local + Cloud",
                desc: "0ms phone Local Vault + SQLite WAL + Supabase Cloud Backup",
                icon: Cloud,
              },
              {
                id: "supabase_cloud",
                title: "Supabase PostgreSQL",
                desc: "Managed cloud Postgres for App Store & Play Store launch",
                icon: Database,
              },
              {
                id: "custom_postgres",
                title: "Enterprise PostgreSQL",
                desc: "AWS RDS / Google Cloud SQL / Custom Postgres URL (1M+ users)",
                icon: Server,
              },
            ].map((opt) => {
              const Icon = opt.icon;
              const active = settings.db_engine === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setSettings({ ...settings, db_engine: opt.id })}
                  className={`p-3.5 rounded-apple-md border cursor-pointer transition-all ${
                    active
                      ? "border-[#0071E3] bg-[#0071E3]/10"
                      : "border-black/[0.08] dark:border-white/[0.1] hover:border-[#0071E3]/40"
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-2 ${active ? "text-[#0071E3]" : "text-[#86868B]"}`} />
                  <div className="text-xs font-bold text-[#1D1D1F] dark:text-white">{opt.title}</div>
                  <div className="text-[11px] text-[#86868B] mt-1">{opt.desc}</div>
                </div>
              );
            })}
          </div>

          <div className="space-y-4 text-xs pt-2">
            <div>
              <label className="block font-semibold text-[#1D1D1F] dark:text-white mb-1">
                Supabase Cloud Project URL
              </label>
              <input
                type="text"
                value={settings.supabase_url || ""}
                onChange={(e) => setSettings({ ...settings, supabase_url: e.target.value })}
                placeholder="https://your-project.supabase.co"
                className="w-full px-3.5 py-2.5 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/10 dark:border-white/10 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1D1D1F] dark:text-white mb-1">
                Future Enterprise PostgreSQL Connection String (`DATABASE_URL`)
              </label>
              <input
                type="text"
                value={settings.custom_database_url || ""}
                onChange={(e) => setSettings({ ...settings, custom_database_url: e.target.value })}
                placeholder="postgresql://postgres:password@db.aws-rds-or-supabase.com:5432/postgres"
                className="w-full px-3.5 py-2.5 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/10 dark:border-white/10 font-mono text-xs"
              />
              <p className="text-[11px] text-[#86868B] mt-1">
                When your app grows to 1M+ downloads, paste your AWS RDS, Google Cloud SQL, or Supabase direct Postgres URI here.
              </p>
            </div>
          </div>

          {/* Current Table Row Counts */}
          {dbInfo && (
            <div className="p-3.5 rounded-apple-md bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[#86868B]">Active Database File: </span>
                <span className="font-mono font-semibold text-[#1D1D1F] dark:text-white">
                  business_contact.db ({dbInfo.sqlite_size_kb} KB)
                </span>
              </div>
              <div className="flex items-center gap-4 font-semibold">
                <span>Users: {dbInfo.tables?.users ?? 0}</span>
                <span>Scanned Cards: {dbInfo.tables?.scanned_cards ?? 0}</span>
                <span>Digital Cards: {dbInfo.tables?.digital_cards ?? 0}</span>
              </div>
            </div>
          )}
        </div>

        {/* Column 3: AI Vision, Role Defaults & Save */}
        <div className="apple-glass-card rounded-apple-xl p-6 border border-black/[0.06] dark:border-white/[0.08] flex flex-col justify-between space-y-5">
          <div className="space-y-4 text-xs">
            <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#0071E3]" />
              <span>2. AI OCR & Default Role Policy</span>
            </h2>

            <div>
              <label className="block font-semibold mb-1">Primary Gemini Vision AI Model</label>
              <select
                value={settings.gemini_model || "gemini-3.5-flash-lite"}
                onChange={(e) => setSettings({ ...settings, gemini_model: e.target.value })}
                className="w-full px-3 py-2 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/10 dark:border-white/10 font-semibold"
              >
                <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Fastest)</option>
                <option value="gemini-3.8-flash">gemini-3.8-flash (Highest Accuracy)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fallback Lite)</option>
                <option value="gemini-3.5-flash">gemini-3.5-flash (Balanced)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Default Role for New Mobile Signups</label>
              <select
                value={settings.default_user_role || "user"}
                onChange={(e) => setSettings({ ...settings, default_user_role: e.target.value })}
                className="w-full px-3 py-2 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/10 dark:border-white/10 font-semibold"
              >
                <option value="user">Standard Client User (Free Tier)</option>
                <option value="pro_user">Pro Client User (Unlimited)</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Max Synced Cards (Standard Free Role)</label>
              <input
                type="number"
                value={settings.max_cards_free_tier || "500"}
                onChange={(e) => setSettings({ ...settings, max_cards_free_tier: e.target.value })}
                className="w-full px-3 py-2 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/10 dark:border-white/10 font-semibold"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="font-semibold">Automatic Cloud Backup on Mobile</span>
              <input
                type="checkbox"
                checked={settings.auto_cloud_backup === "true"}
                onChange={(e) =>
                  setSettings({ ...settings, auto_cloud_backup: e.target.checked ? "true" : "false" })
                }
                className="w-4 h-4 accent-[#0071E3]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-apple-md bg-[#0071E3] text-white text-xs font-semibold hover:bg-[#0077ED] shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving Configuration..." : "Save System Configuration"}</span>
          </button>
        </div>
      </form>

      {/* Ready-to-Run Supabase / PostgreSQL Migration Schema */}
      <div className="apple-glass-card rounded-apple-xl p-6 border border-black/[0.06] dark:border-white/[0.08] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#0071E3]" />
              <span>Ready-to-Run PostgreSQL / Supabase Migration Schema</span>
            </h2>
            <p className="text-xs text-[#86868B]">
              Paste this SQL into Supabase SQL Editor (or AWS RDS / Google Cloud SQL) anytime to initialize your cloud tables.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopySql}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-apple-sm bg-[#0071E3]/10 text-[#0071E3] dark:text-[#409CFF] text-xs font-semibold hover:bg-[#0071E3]/20 self-start"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedSql ? "Copied SQL!" : "Copy PostgreSQL Schema"}</span>
          </button>
        </div>

        <pre className="p-4 rounded-apple-md bg-[#1C1C1E] text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-60">
          {sqlSchema || "-- Loading schema..."}
        </pre>
      </div>
    </div>
  );
}
