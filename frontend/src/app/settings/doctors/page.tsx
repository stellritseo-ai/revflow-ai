"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Plus, MoreHorizontal, User, Mail, Phone, Calendar } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  specialty: string | null;
  npi_number: string | null;
  is_active: boolean;
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    specialty: "",
  });

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<Doctor[]>("/clinic/doctors");
      setDoctors(data);
    } catch (err) {
      console.error("Failed to load doctors", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const newDoctor = await fetchApi<Doctor>("/clinic/doctors", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setDoctors([...doctors, newDoctor]);
      setIsModalOpen(false);
      setFormData({ first_name: "", last_name: "", email: "", specialty: "" });
    } catch (err) {
      console.error("Failed to add doctor", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Doctors</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your clinic's doctors, their specialties, and basic details.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Doctor
        </Button>
      </div>

      <div className="rounded-xl border bg-background shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Provider Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Specialty</th>
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
              ) : doctors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-32 text-center text-muted-foreground">
                    No doctors found. Add your first provider to get started.
                  </td>
                </tr>
              ) : (
                doctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {doctor.first_name[0]}{doctor.last_name[0]}
                        </div>
                        <div>
                          <p className="font-medium">Dr. {doctor.first_name} {doctor.last_name}</p>
                          {doctor.npi_number && <p className="text-[11px] text-muted-foreground font-mono">NPI: {doctor.npi_number}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        {doctor.email ? (
                          <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {doctor.email}</span>
                        ) : (
                          <span className="opacity-50">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {doctor.specialty ? (
                        <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-500 ring-1 ring-inset ring-indigo-500/20">
                          {doctor.specialty}
                        </span>
                      ) : (
                        <span className="text-muted-foreground opacity-50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${doctor.is_active ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                        <span className="text-xs font-medium text-muted-foreground">{doctor.is_active ? 'Active' : 'Inactive'}</span>
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
            <h2 className="text-lg font-bold">Add New Doctor</h2>
            <p className="text-sm text-muted-foreground mb-6">Enter the provider's primary details.</p>
            
            <form onSubmit={handleAddDoctor} className="space-y-4">
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
                <label className="text-xs font-medium">Specialty</label>
                <input
                  value={formData.specialty}
                  placeholder="e.g. Orthodontist"
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Provider"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
