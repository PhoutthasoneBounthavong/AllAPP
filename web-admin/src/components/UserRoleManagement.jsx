import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Search,
  Trash2,
  KeyRound,
  CheckCircle2,
  Ban,
  RefreshCw,
} from "lucide-react";
import {
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from "../api";

const ROLES = [
  { id: "super_admin", label: "Super Admin (Owner)" },
  { id: "admin", label: "Admin" },
  { id: "pro_user", label: "Pro User" },
  { id: "user", label: "Client User" },
];

export default function UserRoleManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resetPwdUser, setResetPwdUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "user",
    status: "active",
  });
  const [notice, setNotice] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminUsers();
      setUsers(res.users || []);
    } catch (err) {
      alert("Failed to load users: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const showToast = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3500);
  };

  const handleRoleChange = async (user, newRole) => {
    try {
      const res = await updateAdminUser(user.id, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.user : u)));
      showToast(`Updated ${user.full_name}'s role to ${newRole}`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStatusToggle = async (user) => {
    const nextStatus = user.status === "suspended" ? "active" : "suspended";
    try {
      const res = await updateAdminUser(user.id, { status: nextStatus });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.user : u)));
      showToast(`${user.full_name} is now ${nextStatus}`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await createAdminUser(form);
      setUsers((prev) => [...prev, res.user]);
      setShowCreateModal(false);
      setForm({ full_name: "", email: "", password: "", role: "user", status: "active" });
      showToast(`Created account for ${res.user.full_name} (${res.user.role})`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPwdUser || newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    try {
      await updateAdminUser(resetPwdUser.id, { password: newPassword });
      showToast(`Password updated for ${resetPwdUser.full_name}`);
      setResetPwdUser(null);
      setNewPassword("");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (user) => {
    if (user.id === 1) {
      alert("Primary Super Admin account (ID #1) cannot be deleted.");
      return;
    }
    if (!confirm(`Delete user "${user.full_name}" (${user.email}) and all their synced cards?`)) {
      return;
    }
    try {
      await deleteAdminUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showToast(`Deleted user ${user.full_name}`);
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === "all" || (u.role || "user") === roleFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (u.full_name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#0071E3]" />
            <span>User & Role Management (RBAC)</span>
          </h1>
          <p className="text-sm text-[#86868B] mt-1">
            Assign Super Admin, Admin, Pro, or Client roles, suspend accounts, or provision new team members.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadUsers}
            className="p-2.5 rounded-apple-md bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.1] text-[#1D1D1F] dark:text-white hover:bg-black/[0.02]"
            title="Refresh users"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#0071E3]" : ""}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-apple-md bg-[#0071E3] text-white text-xs font-semibold hover:bg-[#0077ED] shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User / Admin</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="px-4 py-2.5 rounded-apple-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Search & Role Filter Pills */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email, or role..."
            className="w-full pl-10 pr-4 py-2.5 rounded-apple-md bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto p-1 rounded-apple-md bg-black/[0.05] dark:bg-white/[0.08]">
          {[
            { id: "all", label: "All Roles" },
            { id: "super_admin", label: "Super Admins" },
            { id: "admin", label: "Admins" },
            { id: "pro_user", label: "Pro Users" },
            { id: "user", label: "Client Users" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-apple-sm text-xs font-semibold transition-all shrink-0 ${
                roleFilter === tab.id
                  ? "bg-white dark:bg-[#2C2C2E] text-[#0071E3] shadow-sm"
                  : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="apple-glass rounded-apple-xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-black/[0.02] dark:bg-white/[0.04] border-b border-black/[0.06] dark:border-white/[0.08] text-[#86868B] uppercase font-semibold text-[10px]">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Assigned Role (RBAC)</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Cards in Vault</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-mono text-[#86868B]">#{user.id}</td>
                <td className="px-4 py-3">
                  <div className="font-bold text-[#1D1D1F] dark:text-white">{user.full_name}</div>
                  <div className="text-[11px] text-[#86868B]">{user.email}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="inline-flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#0071E3]" />
                    <select
                      value={user.role || "user"}
                      onChange={(e) => handleRoleChange(user, e.target.value)}
                      className="px-2.5 py-1.5 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/[0.1] dark:border-white/[0.12] text-xs font-semibold text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                    >
                      {ROLES.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleStatusToggle(user)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                      user.status === "suspended"
                        ? "bg-rose-500/15 text-rose-500 hover:bg-rose-500/25"
                        : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                    }`}
                    title="Click to toggle Active / Suspended"
                  >
                    {user.status === "suspended" ? (
                      <>
                        <Ban className="w-3 h-3" />
                        <span>Suspended</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Active</span>
                      </>
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 font-semibold text-[#1D1D1F] dark:text-white">
                  {user.cards_count || 0} cards
                </td>
                <td className="px-4 py-3 text-[#86868B]">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => {
                        setResetPwdUser(user);
                        setNewPassword("");
                      }}
                      className="p-1.5 rounded-apple-sm text-[#0071E3] hover:bg-blue-500/10"
                      title="Reset Password"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>
                    {user.id !== 1 && (
                      <button
                        onClick={() => handleDelete(user)}
                        className="p-1.5 rounded-apple-sm text-[#86868B] hover:text-rose-500 hover:bg-rose-500/10"
                        title="Delete User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User / Admin Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="apple-glass-card rounded-apple-2xl p-6 max-w-md w-full border border-black/10 dark:border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-[#1D1D1F] dark:text-white mb-1">
              Provision New User or Admin
            </h2>
            <p className="text-xs text-[#86868B] mb-4">
              Create an account and assign its role permissions immediately.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="e.g. Sarah Connor"
                  className="w-full px-3 py-2 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/10 dark:border-white/10"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="sarah@sbusinesscard.app"
                  className="w-full px-3 py-2 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/10 dark:border-white/10"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/10 dark:border-white/10"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Role Assignment</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/10 dark:border-white/10 font-semibold"
                >
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-apple-sm bg-black/[0.05] dark:bg-white/[0.1] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-apple-sm bg-[#0071E3] text-white font-semibold hover:bg-[#0077ED]"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPwdUser && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setResetPwdUser(null)}
        >
          <div
            className="apple-glass-card rounded-apple-2xl p-6 max-w-sm w-full border border-black/10 dark:border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold text-[#1D1D1F] dark:text-white mb-1">
              Reset Password
            </h2>
            <p className="text-xs text-[#86868B] mb-4">
              Set a new password for <strong>{resetPwdUser.full_name}</strong> ({resetPwdUser.email})
            </p>
            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 6 chars)"
                className="w-full px-3 py-2 rounded-apple-sm bg-white dark:bg-[#2C2C2E] border border-black/10 dark:border-white/10"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPwdUser(null)}
                  className="px-3 py-1.5 rounded-apple-sm bg-black/[0.05] dark:bg-white/[0.1] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-apple-sm bg-[#0071E3] text-white font-semibold"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
