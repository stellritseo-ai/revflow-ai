"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Plus, MoreHorizontal, Activity, Clock, Tag, Zap } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface Service {
  id: string;
  name: string;
  category: string | null;
  duration_minutes: number;
  estimated_price_range: string | null;
  online_booking_enabled: boolean;
  is_active: boolean;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "general",
    duration_minutes: 60,
    estimated_price_range: "",
    online_booking_enabled: true,
  });

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<Service[]>("/clinic/services");
      setServices(data);
    } catch (err) {
      console.error("Failed to load services", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const newService = await fetchApi<Service>("/clinic/services", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          duration_minutes: parseInt(formData.duration_minutes.toString(), 10),
        }),
      });
      setServices([...services, newService]);
      setIsModalOpen(false);
      setFormData({
        name: "",
        category: "general",
        duration_minutes: 60,
        estimated_price_range: "",
        online_booking_enabled: true,
      });
    } catch (err) {
      console.error("Failed to add service", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Services & Treatments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure the treatments your clinic offers and how AI books them.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Service
        </Button>
      </div>

      <div className="rounded-xl border bg-background shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Service Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Duration & Price</th>
                <th className="px-4 py-3 font-medium">Online Booking</th>
                <th className="px-4 py-3 font-medium text-right">Status</th>
                <th className="px-4 py-3 font-medium w-[50px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="h-24 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-32 text-center text-muted-foreground">
                    No services defined. Add a treatment to enable AI scheduling.
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500">
                          <Activity className="h-4 w-4" />
                        </div>
                        <p className="font-medium">{service.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {service.category ? (
                        <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/20 capitalize">
                          {service.category.replace("_", " ")}
                        </span>
                      ) : (
                        <span className="opacity-50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {service.duration_minutes} mins</span>
                        {service.estimated_price_range && (
                          <span className="flex items-center gap-1.5"><Tag className="h-3 w-3" /> {service.estimated_price_range}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {service.online_booking_enabled ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-500">
                          <Zap className="h-3 w-3" /> Enabled
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground opacity-50">Disabled</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${service.is_active ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                        <span className="text-xs font-medium text-muted-foreground">{service.is_active ? 'Active' : 'Inactive'}</span>
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
            <h2 className="text-lg font-bold">Add Service</h2>
            <p className="text-sm text-muted-foreground mb-6">Configure a new treatment or appointment type.</p>
            
            <form onSubmit={handleAddService} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Service Name</label>
                <input
                  required
                  autoFocus
                  placeholder="e.g. New Patient Exam"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="general">General</option>
                    <option value="consultation">Consultation</option>
                    <option value="hygiene">Hygiene & Cleaning</option>
                    <option value="restorative">Restorative</option>
                    <option value="cosmetic">Cosmetic</option>
                    <option value="surgery">Surgery</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Duration (mins)</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    required
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value, 10) || 0 })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Estimated Price Range (Optional)</label>
                <input
                  placeholder="e.g. $150 - $300"
                  value={formData.estimated_price_range}
                  onChange={(e) => setFormData({ ...formData, estimated_price_range: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                <div>
                  <p className="text-sm font-medium">Allow AI & Online Booking</p>
                  <p className="text-xs text-muted-foreground">Patients can schedule this service automatically.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, online_booking_enabled: !formData.online_booking_enabled })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${formData.online_booking_enabled ? "bg-primary" : "bg-input"}`}
                >
                  <span className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out ${formData.online_booking_enabled ? "translate-x-2" : "-translate-x-2"}`} />
                </button>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Service"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
