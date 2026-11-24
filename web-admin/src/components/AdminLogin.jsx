import React, { useState } from "react";
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, KeyRound } from "lucide-react";
import { loginAdmin } from "../api";

export default function AdminLogin({ onLoginSuccess, darkMode, setDarkMode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await loginAdmin(email, password);
      if (res && res.user) {
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (fillEmail, fillPwd) => {
    setEmail(fillEmail);
    setPassword(fillPwd);
    setError("");
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#F5F5F7] dark:bg-[#000000] text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col justify-center items-center p-4 transition-colors duration-200">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] bg-gradient-to-tr from-[#0071E3]/20 to-purple-600/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="apple-glass p-8 sm:p-10 rounded-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl backdrop-blur-2xl">
          {/* Header & Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-[#0071E3] to-[#409CFF] flex items-center justify-center text-white shadow-lg shadow-[#0071E3]/30">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">
              SBusinessCard Admin
            </h1>
            <p className="text-xs text-[#86868B] mt-1.5 font-medium">
              Enterprise Management & Database Control Console
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#86868B] mb-1.5 uppercase tracking-wider">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cardr.app"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] text-sm text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#86868B] mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] text-sm text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#0071E3]/25 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Preset */}
          <div className="mt-6 pt-5 border-t border-black/[0.06] dark:border-white/[0.08]">
            <p className="text-[11px] text-center text-[#86868B] font-medium mb-2.5">
              Quick Admin Access:
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("demo@cardr.app", "demo1234")}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-[11px] font-medium text-[#0071E3] dark:text-[#409CFF] flex items-center justify-center gap-1.5 transition-colors border border-black/[0.04] dark:border-white/[0.06]"
              >
                <KeyRound className="w-3 h-3" />
                <span>Super Admin (Demo)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("georgewassup31@gmail.com", "")}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-[11px] font-medium text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white flex items-center justify-center gap-1.5 transition-colors border border-black/[0.04] dark:border-white/[0.06]"
              >
                <span>georgewassup31</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Footer Note */}
        <p className="text-center text-[11px] text-[#86868B] mt-5">
          Protected by End-to-End Cryptographic JWT & Multi-Tenant RBAC Security
        </p>
      </div>
    </div>
  );
}
