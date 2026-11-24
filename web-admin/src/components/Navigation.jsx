import React from "react";
import {
  ShieldCheck,
  Users,
  Database,
  Layers,
  Sun,
  Moon,
  LogOut,
  UserCheck,
} from "lucide-react";

export default function Navigation({ activeTab, setActiveTab, darkMode, setDarkMode, user, onLogout }) {
  const navItems = [
    { id: "overview", label: "System Overview", shortLabel: "Overview", icon: ShieldCheck },
    { id: "users", label: "Users & Roles", shortLabel: "Roles", icon: Users },
    { id: "database", label: "Database & Config", shortLabel: "Database", icon: Database },
    { id: "vault", label: "All Scanned Cards", shortLabel: "Cards", icon: Layers },
  ];

  return (
    <header className="sticky top-0 z-50 apple-glass border-b border-black/[0.06] dark:border-white/[0.08] transition-colors duration-200 pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div
          onClick={() => setActiveTab("overview")}
          className="flex items-center gap-2 sm:gap-3 shrink-0 cursor-pointer"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-apple-sm bg-gradient-to-tr from-[#0071E3] to-[#409CFF] flex items-center justify-center text-white shadow-apple-sm">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-semibold text-base sm:text-lg tracking-tight text-[#1D1D1F] dark:text-white">
                SBusinessCard
              </span>
              <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400">
                Super Admin
              </span>
            </div>
            <p className="text-[11px] text-[#86868B] hidden sm:block -mt-0.5">
              Database, RBAC Roles & Platform Console
            </p>
          </div>
        </div>

        {/* Apple Segmented Control */}
        <nav
          role="tablist"
          aria-label="Admin Console Sections"
          className="flex items-center p-0.5 sm:p-1 rounded-apple-md bg-black/[0.05] dark:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.06] overflow-x-auto max-w-[calc(100vw-120px)] sm:max-w-none"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                role="tab"
                id={`tab-${item.id}`}
                aria-controls={`panel-${item.id}`}
                aria-selected={isActive}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-apple-sm text-xs font-medium min-h-[34px] sm:min-h-[36px] transition-all duration-200 relative shrink-0 focus-visible:ring-2 focus-visible:ring-[#0071E3] ${
                  isActive
                    ? "bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-sm"
                    : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive ? "text-[#0071E3] dark:text-[#409CFF]" : ""
                  }`}
                  aria-hidden="true"
                />
                <span className="hidden md:inline">{item.label}</span>
                <span className="inline md:hidden text-[11px]">{item.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* User Profile Pill */}
          {user && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08]">
              <div className="w-5 h-5 rounded-full bg-[#0071E3]/20 flex items-center justify-center text-[#0071E3]">
                <UserCheck className="w-3 h-3" />
              </div>
              <span className="text-xs font-medium text-[#1D1D1F] dark:text-white max-w-[130px] truncate">
                {user.full_name || user.email}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400">
                {user.role === "super_admin" ? "Super Admin" : "Admin"}
              </span>
            </div>
          )}

          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-apple-sm flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors focus-visible:ring-2 focus-visible:ring-[#0071E3]"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4" aria-hidden="true" />
            )}
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-apple-sm text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors focus-visible:ring-2 focus-visible:ring-red-500"
              title="Log out of Admin Console"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
