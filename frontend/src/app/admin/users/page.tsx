"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, UserPlus, Search, Filter, RefreshCw, Edit, Trash2, 
  ShieldAlert, UserX, UserCheck, Key, Shield, ChevronLeft, ChevronRight, X
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import { useAuthStore, type UserRole } from "@/lib/auth-store";
import { TenantProvider, useTenant } from "@/lib/tenant-context";
import { fetchApi } from "@/lib/api-client";

interface UserRecord {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  is_active: boolean;
  is_suspended: boolean;
  is_verified: boolean;
  phone?: string;
  department?: string;
  last_login?: string;
  timezone: string;
}


function UserManagementContent() {
  const router = useRouter();
  const { user, initialized } = useAuthStore();
  const { tenant } = useTenant();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog visibility states
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState<UserRecord | null>(null);

  // Form Fields for Add User
  const [addEmail, setAddEmail] = useState("");
  const [addFirstName, setAddFirstName] = useState("");
  const [addLastName, setAddLastName] = useState("");
  const [addRole, setAddRole] = useState<UserRole>("receptionist");
  const [addPhone, setAddPhone] = useState("");
  const [addDept, setAddDept] = useState("");
  const [addPassword, setAddPassword] = useState("password12345");

  // Form Fields for Edit User
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("receptionist");
  const [editPhone, setEditPhone] = useState("");
  const [editDept, setEditDept] = useState("");

  const limit = 8;

  const loadUsers = useCallback(async () => {
    if (!tenant) return;
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) q.append("search", search);
      if (roleFilter) q.append("role", roleFilter);
      if (statusFilter) q.append("status_filter", statusFilter);

      const res = await fetchApi<{ users: UserRecord[]; total: number }>(`/users/admin/users?${q.toString()}`);
      setUsers(res.users);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message || "Unauthorized access. Permission 'manage_users' is required.");
    } finally {
      setLoading(false);
    }
  }, [tenant, page, search, roleFilter, statusFilter]);

  useEffect(() => {
    if (initialized && !user) router.push("/auth/login");
  }, [user, initialized, router]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Actions
  const handleSuspend = async (record: UserRecord) => {
    setActionLoading(record.id);
    try {
      const updated = await fetchApi<UserRecord>(`/users/admin/users/${record.id}/suspend`, { method: "POST" });
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    } catch (err: any) {
      alert(err.message || "Failed to suspend user.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (record: UserRecord) => {
    setActionLoading(record.id);
    try {
      const updated = await fetchApi<UserRecord>(`/users/admin/users/${record.id}/activate`, { method: "POST" });
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    } catch (err: any) {
      alert(err.message || "Failed to activate user.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (record: UserRecord) => {
    if (!confirm(`Are you sure you want to delete user ${record.email} permanently?`)) return;
    setActionLoading(record.id);
    try {
      await fetchApi(`/users/admin/users/${record.id}`, { method: "DELETE" });
      loadUsers();
    } catch (err: any) {
      alert(err.message || "Failed to delete user.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmail || !addFirstName || !addLastName || !addPassword) {
      alert("Please fill in email, first name, last name, and password.");
      return;
    }
    try {
      await fetchApi("/users/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email: addEmail,
          first_name: addFirstName,
          last_name: addLastName,
          role: addRole,
          phone: addPhone || undefined,
          department: addDept || undefined,
          password: addPassword,
        }),
      });
      setAddUserOpen(false);
      // Reset fields
      setAddEmail("");
      setAddFirstName("");
      setAddLastName("");
      setAddPhone("");
      setAddDept("");
      loadUsers();
    } catch (err: any) {
      alert(err.message || "Failed to create user.");
    }
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserOpen) return;
    try {
      await fetchApi(`/users/admin/users/${editUserOpen.id}`, {
        method: "PUT",
        body: JSON.stringify({
          first_name: editFirstName,
          last_name: editLastName,
          role: editRole,
          phone: editPhone || undefined,
          department: editDept || undefined,
        }),
      });
      setEditUserOpen(null);
      loadUsers();
    } catch (err: any) {
      alert(err.message || "Failed to update user.");
    }
  };

  const openEditModal = (record: UserRecord) => {
    setEditUserOpen(record);
    setEditFirstName(record.first_name || "");
    setEditLastName(record.last_name || "");
    setEditRole(record.role);
    setEditPhone(record.phone || "");
    setEditDept(record.department || "");
  };

  if (!initialized || !user) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <span className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const formatRole = (r: string) => r.replace("_", " ").toUpperCase();
  const formatTime = (iso?: string) => iso ? new Date(iso).toLocaleDateString() : "Never";

  return (
    <div className="flex h-screen bg-[#020617] text-white overflow-hidden">
      <Sidebar />

      <div className="flex-1 overflow-y-auto relative z-10 p-8 max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Staff Directories</h1>
            <p className="text-slate-400 text-sm mt-0.5">Manage clinic access roles, verification statuses, and users</p>
          </div>

          <button
            onClick={() => setAddUserOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-150"
          >
            <UserPlus className="h-4 w-4" />
            Add User
          </button>
        </div>

        {error ? (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center max-w-md mx-auto mt-12">
            <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">Access Restricted</h3>
            <p className="text-rose-300/80 text-xs leading-relaxed mb-4">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-slate-800 border border-white/10 rounded-xl hover:bg-slate-700 text-xs font-semibold"
            >
              Return to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/40 border border-white/5 rounded-2xl p-4">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Roles</option>
                  <option value="clinic_owner">Clinic Owner</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="doctor">Doctor</option>
                  <option value="office_manager">Office Manager</option>
                  <option value="marketing">Marketing</option>
                  <option value="billing">Billing</option>
                  <option value="viewer">Viewer</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="unverified">Unverified</option>
                </select>

                <button
                  onClick={loadUsers}
                  className="p-2 border border-white/10 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* User Directory Table */}
            <div className="bg-slate-900/20 border border-white/5 rounded-2xl overflow-hidden">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <span className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-3" />
                  <p className="text-xs text-slate-500">Querying credentials directories...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-20">
                  <Users className="h-8 w-8 text-slate-600 mx-auto mb-3" />
                  <p className="text-xs text-slate-400">No staff members found matching filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-slate-900/10">
                        <th className="text-xs font-semibold text-slate-500 px-6 py-3.5">Name</th>
                        <th className="text-xs font-semibold text-slate-500 px-4 py-3.5">Department</th>
                        <th className="text-xs font-semibold text-slate-500 px-4 py-3.5">Assigned Role</th>
                        <th className="text-xs font-semibold text-slate-500 px-4 py-3.5">Last Login</th>
                        <th className="text-xs font-semibold text-slate-500 px-4 py-3.5">Status</th>
                        <th className="text-xs font-semibold text-slate-500 px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((rec) => {
                        const isActionLoading = actionLoading === rec.id;
                        return (
                          <tr key={rec.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-400">
                                  {rec.first_name?.[0]}{rec.last_name?.[0]}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-xs text-white">
                                    {rec.first_name} {rec.last_name}
                                  </span>
                                  <span className="text-[10px] text-slate-500 leading-normal">{rec.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-xs text-slate-400">{rec.department || "Clinical Desk"}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 border border-indigo-500/20 rounded-md">
                                <Shield className="h-2.5 w-2.5" />
                                {formatRole(rec.role)}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-xs text-slate-500">{formatTime(rec.last_login)}</span>
                            </td>
                            <td className="px-4 py-4">
                              {rec.is_suspended ? (
                                <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                                  Suspended
                                </span>
                              ) : !rec.is_verified ? (
                                <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
                                  Unverified
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end items-center gap-1.5">
                                <button
                                  onClick={() => openEditModal(rec)}
                                  className="p-1.5 border border-white/15 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                                  title="Edit User Details"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                
                                {rec.is_suspended ? (
                                  <button
                                    onClick={() => handleActivate(rec)}
                                    disabled={isActionLoading}
                                    className="p-1.5 border border-emerald-500/20 text-emerald-400 bg-emerald-500/10 rounded-lg hover:bg-emerald-500/20 transition-all"
                                    title="Activate User"
                                  >
                                    <UserCheck className="h-3.5 w-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleSuspend(rec)}
                                    disabled={isActionLoading || rec.id === user.id}
                                    className="p-1.5 border border-rose-500/20 text-rose-400 bg-rose-500/10 rounded-lg hover:bg-rose-500/20 transition-all disabled:opacity-30"
                                    title="Suspend User"
                                  >
                                    <UserX className="h-3.5 w-3.5" />
                                  </button>
                                )}

                                <button
                                  onClick={() => handleDelete(rec)}
                                  disabled={isActionLoading || rec.id === user.id}
                                  className="p-1.5 border border-white/10 hover:border-rose-500/30 text-slate-500 hover:text-rose-400 rounded-lg transition-colors disabled:opacity-30"
                                  title="Delete User"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {total > limit && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total} staff members
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-2 bg-slate-900 border border-white/10 hover:bg-slate-800 rounded-xl transition-all disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={page * limit >= total}
                    onClick={() => setPage(page + 1)}
                    className="p-2 bg-slate-900 border border-white/10 hover:bg-slate-800 rounded-xl transition-all disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add User Dialog */}
      {addUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleAddUserSubmit}
            className="bg-[#0a1128] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h3 className="text-sm font-bold text-white">Create New Clinic User</h3>
              <button type="button" onClick={() => setAddUserOpen(false)} className="text-slate-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">First Name</label>
                <input
                  type="text"
                  value={addFirstName}
                  onChange={(e) => setAddFirstName(e.target.value)}
                  placeholder="Sarah"
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Last Name</label>
                <input
                  type="text"
                  value={addLastName}
                  onChange={(e) => setAddLastName(e.target.value)}
                  placeholder="Jenkins"
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Email Address</label>
              <input
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="sarah@apexdental.com"
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Assigned Role</label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="receptionist">Receptionist</option>
                  <option value="doctor">Doctor</option>
                  <option value="office_manager">Office Manager</option>
                  <option value="marketing">Marketing</option>
                  <option value="billing">Billing</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Department</label>
                <input
                  type="text"
                  value={addDept}
                  onChange={(e) => setAddDept(e.target.value)}
                  placeholder="Clinical Suite"
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Temporary Password</label>
              <input
                type="text"
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setAddUserOpen(false)}
                className="px-4 py-2 border border-white/10 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/10"
              >
                Create Staff Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit User Dialog */}
      {editUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleEditUserSubmit}
            className="bg-[#0a1128] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h3 className="text-sm font-bold text-white">Edit Staff details</h3>
              <button type="button" onClick={() => setEditUserOpen(null)} className="text-slate-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">First Name</label>
                <input
                  type="text"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Last Name</label>
                <input
                  type="text"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Assigned Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="receptionist">Receptionist</option>
                  <option value="doctor">Doctor</option>
                  <option value="office_manager">Office Manager</option>
                  <option value="marketing">Marketing</option>
                  <option value="billing">Billing</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Department</label>
                <input
                  type="text"
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setEditUserOpen(null)}
                className="px-4 py-2 border border-white/10 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl"
              >
                Update Profile
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function UserManagementPage() {
  return (
    <TenantProvider>
      <UserManagementContent />
    </TenantProvider>
  );
}
