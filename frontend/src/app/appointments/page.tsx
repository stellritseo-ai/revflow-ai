"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Calendar as CalendarIcon, Clock, User, Phone, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { BookingModal } from "@/components/booking-modal";

interface Appointment {
  id: string;
  patient_name: string;
  patient_phone: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
  scheduled_at: string;
  duration_minutes: number;
  treatment_type: string | null;
  provider_name: string | null;
  revenue_amount: number | null;
}

const statusColors = {
  scheduled: "bg-blue-500/10 text-blue-600 ring-blue-500/20",
  confirmed: "bg-indigo-500/10 text-indigo-600 ring-indigo-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20",
  cancelled: "bg-slate-500/10 text-slate-600 ring-slate-500/20",
  no_show: "bg-rose-500/10 text-rose-600 ring-rose-500/20",
};

export default function AppointmentsDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const loadAppointments = async () => {
    setLoading(true);
    let localCache: Appointment[] = [];
    try {
      const raw = localStorage.getItem("revflow_appointments");
      if (raw) localCache = JSON.parse(raw);
    } catch (e) {}

    try {
      const serverData = await fetchApi<Appointment[]>("/appointments?limit=100");
      const apptMap = new Map<string, Appointment>();
      (serverData || []).forEach(a => apptMap.set(a.id, a));
      localCache.forEach(a => {
        if (!apptMap.has(a.id)) {
          apptMap.set(a.id, a);
        }
      });
      const merged = Array.from(apptMap.values()).sort((a, b) => 
        new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
      );
      setAppointments(merged);
    } catch (err) {
      console.error("Failed to load appointments from server", err);
      if (localCache.length > 0) {
        setAppointments(localCache);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    
    // Real-time WebSocket connection
    let ws: WebSocket | null = null;
    const storedUser = localStorage.getItem('revflow_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        const clientId = userData.client_id;
        if (clientId) {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const wsUrl = `${protocol}//localhost:8000/api/v1/calls/live?client_id=${clientId}`;
          ws = new WebSocket(wsUrl);
          
          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (data.event === "appointment_booked") {
                console.log("📅 Appointments Table: AI booked appointment, refreshing...");
                loadAppointments();
              }
            } catch (e) {
              console.error(e);
            }
          };
        }
      } catch (e) {}
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const updateStatus = async (id: string, status: Appointment["status"]) => {
    try {
      const updated = await fetchApi<Appointment>(`/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      setAppointments(appointments.map(a => a.id === id ? updated : a));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAppointmentCreated = (newAppt: Appointment) => {
    setAppointments(prev => [newAppt, ...prev.filter(a => a.id !== newAppt.id)]);
    loadAppointments();
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-indigo-500" />
            Appointments
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage upcoming visits, confirm attendances, and view PMS schedules.
          </p>
        </div>
        <Button onClick={() => setIsBookingOpen(true)} className="flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 bg-indigo-600 hover:bg-indigo-700 rounded-full px-6">
          <Plus className="h-4 w-4" /> Book Appointment
        </Button>
      </div>

      {/* Main Container */}
      <div className="rounded-2xl border bg-background shadow-sm overflow-hidden flex flex-col h-[650px]">
        {/* Toolbar */}
        <div className="p-4 border-b flex items-center justify-between bg-muted/20">
          <div className="text-sm text-muted-foreground font-medium">
            Schedule Overview
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b text-muted-foreground sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-medium">Time & Provider</th>
                <th className="px-6 py-4 font-medium">Patient Info</th>
                <th className="px-6 py-4 font-medium">Treatment</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={5} className="h-48 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-48 text-center text-muted-foreground">
                    <CalendarIcon className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    No upcoming appointments found.
                  </td>
                </tr>
              ) : (
                appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-muted/30 transition-colors group">
                    
                    {/* Time & Provider */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-medium">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {new Date(appt.scheduled_at).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 ml-6">
                        {appt.provider_name || "Any Provider"} • {appt.duration_minutes || 60} min
                      </div>
                    </td>

                    {/* Patient Info */}
                    <td className="px-6 py-4">
                      <p className="font-medium">{appt.patient_name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Phone className="h-3 w-3" /> {appt.patient_phone}
                      </div>
                    </td>

                    {/* Treatment */}
                    <td className="px-6 py-4 text-muted-foreground">
                      {appt.treatment_type || "General"}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusColors[appt.status || "scheduled"]}`}>
                        {(appt.status || "scheduled").replace("_", " ").toUpperCase()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {appt.status === "scheduled" && (
                          <Button size="sm" variant="outline" className="h-8 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => updateStatus(appt.id, "confirmed")}>
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Confirm
                          </Button>
                        )}
                        {(appt.status === "scheduled" || appt.status === "confirmed") && (
                          <>
                            <Button size="sm" variant="outline" className="h-8 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => updateStatus(appt.id, "completed")}>
                              Complete
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 text-xs text-rose-600 hover:bg-rose-50" onClick={() => updateStatus(appt.id, "no_show")}>
                              No Show
                            </Button>
                          </>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={handleAppointmentCreated}
      />

    </div>
  );
}
