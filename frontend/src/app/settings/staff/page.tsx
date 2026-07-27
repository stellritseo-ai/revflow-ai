"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Plus, MoreHorizontal, Mail, Shield } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "receptionist",
  });

  const loadStaff = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<StaffMember[]>("/clinic/staff");
      setStaff(data);
    } catch (err) {
      console.error("Failed to load staff", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const newStaff = await fetchApi<StaffMember>("/clinic/staff", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setStaff([...staff, newStaff]);
      setIsModalOpen(false);
      setFormData({ first_name: "", last_name: "", email: "", role: "receptionist" });
    } catch (err) {
      console.error("Failed to add staff", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff & Roles</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your clinic's staff members, receptionists, and their system access.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Staff
        </Button>
      </div>

      <div className="rounded-xl border bg-background shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium text-right">Status</th>
                <th className="px-4 py-3 font-medium w-[50px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={5} className="h-24 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-32 text-center text-muted-foreground">
                    No staff members found. Add your first team member to get started.
                  </td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-500/10 flex items-center justify-center text-slate-500 font-semibold">
                          {member.first_name[0]}{member.last_name[0]}
                        </div>
                        <p className="font-medium">{member.first_name} {member.last_name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        {member.email ? (
                          <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {member.email}</span>
                        ) : (
                          <span className="opacity-50">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/20 capitalize">
                        <Shield className="h-3 w-3 text-slate-400" /> {member.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${member.is_active ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                        <span className="text-xs font-medium text-muted-foreground">{member.is_active ? 'Active' : 'Inactive'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold">Add Staff Member</h2>
            <p className="text-sm text-muted-foreground mb-6">Enter the team member's details and role.</p>
            
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">First Name</label>
                  <input
                    required
                    autoFocus
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Last Name</label>
                  <input
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">System Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="receptionist">Receptionist</option>
                  <option value="clinic_admin">Clinic Admin</option>
                  <option value="hygienist">Hygienist</option>
                  <option value="assistant">Dental Assistant</option>
                  <option value="manager">Office Manager</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Staff"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
