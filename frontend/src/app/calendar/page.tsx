"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Calendar as CalendarIcon, Clock, User, Phone,
  ChevronLeft, ChevronRight, Plus, Loader2, Sparkles, Filter,
  CheckCircle2, List, CalendarDays, MapPin, Stethoscope, X, FileText, Check, AlertCircle, Grid, Move, Building2, ArrowRight, MousePointerClick
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { BookingModal } from "@/components/booking-modal";

interface Appointment {
  id: string;
  patient_name: string;
  patient_phone: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
  scheduled_at: string; // ISO String
  duration_minutes: number;
  treatment_type: string | null;
  provider_name: string | null;
}

const DOCTORS = [
  "All Providers",
  "Dr. Sarah Jenkins",
  "Dr. Alex Rivera",
  "Dr. Emily Chen",
  "Dr. Michael Vance"
];

// Hours range for time grid (7 AM to 7 PM)
const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

// Extracts hours and minutes directly from ISO string or date without timezone shifts
const parseIsoHourMin = (scheduledAt: string): { hour: number; minute: number; ampm: string; timeStr: string } => {
  if (!scheduledAt) return { hour: 14, minute: 0, ampm: "PM", timeStr: "2:00 PM" };
  try {
    let h = 14;
    let m = 0;

    if (scheduledAt.includes("T")) {
      const timePart = scheduledAt.split("T")[1];
      const [hStr, mStr] = timePart.substring(0, 5).split(":");
      h = parseInt(hStr, 10);
      m = parseInt(mStr, 10);
    } else {
      const d = new Date(scheduledAt);
      if (!isNaN(d.getTime())) {
        h = d.getUTCHours();
        m = d.getUTCMinutes();
      }
    }

    if (isNaN(h)) h = 14;
    if (isNaN(m)) m = 0;

    const ampm = h >= 12 ? "PM" : "AM";
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    const mPadded = String(m).padStart(2, "0");
    
    return {
      hour: h,
      minute: m,
      ampm,
      timeStr: `${h12}:${mPadded} ${ampm}`
    };
  } catch (e) {
    return { hour: 14, minute: 0, ampm: "PM", timeStr: "2:00 PM" };
  }
};

const getTimeVal = (scheduledAt: string): string => {
  const parsed = parseIsoHourMin(scheduledAt);
  let h12 = parsed.hour % 12;
  if (h12 === 0) h12 = 12;
  const mPadded = String(parsed.minute).padStart(2, "0");
  return `${h12}:${mPadded}`;
};

const getTimeAmpm = (scheduledAt: string): string => {
  return parseIsoHourMin(scheduledAt).ampm;
};

const formatApptTime = (scheduledAt: string): string => {
  return parseIsoHourMin(scheduledAt).timeStr;
};

const formatApptFullDateTime = (scheduledAt: string): string => {
  if (!scheduledAt) return "Jul 27, 2026 • 2:00 PM";
  try {
    let dateStr = scheduledAt.split("T")[0];
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dateFormatted = dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
    const timeFormatted = formatApptTime(scheduledAt);
    return `${dateFormatted} • ${timeFormatted}`;
  } catch (e) {
    return `${scheduledAt} • ${formatApptTime(scheduledAt)}`;
  }
};

// Helper to calculate end time string
const formatEndTime = (scheduledAt: string, durationMins: number = 45) => {
  try {
    const parsed = parseIsoHourMin(scheduledAt);
    let totalMins = parsed.hour * 60 + parsed.minute + durationMins;
    let endH = Math.floor(totalMins / 60) % 24;
    let endM = totalMins % 60;
    const ampm = endH >= 12 ? "PM" : "AM";
    let h12 = endH % 12;
    if (h12 === 0) h12 = 12;
    const mPadded = String(endM).padStart(2, "0");
    return `${h12}:${mPadded} ${ampm}`;
  } catch (e) {
    return "2:45 PM";
  }
};

// Helper to extract hour number (0-23) reliably
const getApptHour = (scheduledAt: string): number => {
  return parseIsoHourMin(scheduledAt).hour;
};

// Helper to check if appointment is on a target date (YYYY-MM-DD)
const isSameDay = (scheduledAt: string, targetDateStr: string): boolean => {
  if (!scheduledAt || !targetDateStr) return false;
  if (scheduledAt.startsWith(targetDateStr)) return true;
  try {
    const datePart = scheduledAt.split("T")[0];
    if (datePart === targetDateStr) return true;
    const d = new Date(scheduledAt);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}` === targetDateStr;
    }
  } catch (e) {}
  return false;
};

// Status gradient themes matched to image design
const statusGradientMap: Record<string, string> = {
  scheduled: "from-purple-600 via-indigo-600 to-violet-600 border-indigo-400/40",
  confirmed: "from-indigo-600 via-purple-600 to-violet-600 border-purple-400/40",
  completed: "from-emerald-600 via-teal-600 to-cyan-600 border-emerald-400/40",
  cancelled: "from-rose-600 via-pink-600 to-rose-700 border-rose-400/40",
  no_show: "from-amber-600 via-orange-600 to-amber-700 border-amber-400/40"
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState("All Providers");
  const [viewMode, setViewMode] = useState<"week" | "month" | "day" | "agenda">("week");
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Drag & Drop State + Click-To-Move Active Appt State
  const [draggedApptId, setDraggedApptId] = useState<string | null>(null);
  const [dragOverDateStr, setDragOverDateStr] = useState<string | null>(null);
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);
  const [rescheduleNotice, setRescheduleNotice] = useState<string | null>(null);

  const fetchAppointments = async () => {
    setLoading(true);
    let localCache: Appointment[] = [];
    try {
      const raw = localStorage.getItem("revflow_appointments");
      if (raw) localCache = JSON.parse(raw);
    } catch (e) {}

    try {
      const res = await fetchApi<Appointment[]>("/appointments?limit=300");
      const apptMap = new Map<string, Appointment>();
      (res || []).forEach(a => apptMap.set(a.id, a));
      localCache.forEach(a => {
        if (!apptMap.has(a.id)) {
          apptMap.set(a.id, a);
        }
      });
      setAppointments(Array.from(apptMap.values()));
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
      if (localCache.length > 0) {
        setAppointments(localCache);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Real-time synchronization
  useEffect(() => {
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
                fetchAppointments();
              }
            } catch (e) {}
          };
        }
      } catch (e) {}
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Currently dragged or selected moving appointment
  const activeMovingAppt = useMemo(() => {
    if (!draggedApptId) return null;
    return appointments.find(a => a.id === draggedApptId) || null;
  }, [draggedApptId, appointments]);

  // Filter appointments by doctor
  const filteredAppointments = useMemo(() => {
    if (selectedDoctor === "All Providers") return appointments;
    return appointments.filter(a => a.provider_name === selectedDoctor);
  }, [appointments, selectedDoctor]);

  // Compute 7 Days for Week View (Monday to Sunday)
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay(); // 0 is Sunday
    const distanceToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(curr);
    monday.setDate(curr.getDate() + distanceToMon);
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  // Compute Month View Days Grid (35 or 42 cells)
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
    const totalDays = lastDayOfMonth.getDate();

    const days: Array<{ date: Date; isCurrentMonth: boolean; dateStr: string }> = [];

    // Previous month padding
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      const dateStr = prevDate.toISOString().split("T")[0];
      days.push({ date: prevDate, isCurrentMonth: false, dateStr });
    }

    // Current month
    for (let i = 1; i <= totalDays; i++) {
      const currDate = new Date(year, month, i);
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({ date: currDate, isCurrentMonth: true, dateStr });
    }

    // Next month padding
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dateStr = nextDate.toISOString().split("T")[0];
      days.push({ date: nextDate, isCurrentMonth: false, dateStr });
    }

    return days;
  }, [currentDate]);

  // Navigation handlers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === "month") {
      next.setMonth(next.getMonth() - 1);
    } else if (viewMode === "week") {
      next.setDate(next.getDate() - 7);
    } else {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === "month") {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === "week") {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Move Appointment Logic (Callable by Drag-Drop or Click-To-Slot)
  const moveAppointmentToSlot = async (apptId: string, targetDateStr: string, targetHour?: number) => {
    const targetAppt = appointments.find(a => a.id === apptId);
    if (!targetAppt) return;

    const origTimeFormatted = formatApptTime(targetAppt.scheduled_at);
    let origDayNum = 20;
    try {
      origDayNum = new Date(targetAppt.scheduled_at).getDate();
    } catch (err) {}

    let targetTimePart = "10:00:00.000Z";
    let targetTimeFormatted = "10:00 AM";

    if (targetHour !== undefined) {
      const h = String(targetHour).padStart(2, "0");
      targetTimePart = `${h}:00:00.000Z`;
      const hour12 = targetHour > 12 ? targetHour - 12 : targetHour;
      const ampm = targetHour >= 12 ? "PM" : "AM";
      targetTimeFormatted = `${hour12}:00 ${ampm}`;
    } else {
      try {
        const origDate = new Date(targetAppt.scheduled_at);
        const h = String(origDate.getHours()).padStart(2, "0");
        const m = String(origDate.getMinutes()).padStart(2, "0");
        targetTimePart = `${h}:${m}:00.000Z`;
        targetTimeFormatted = origTimeFormatted;
      } catch (err) {}
    }

    const newScheduledAt = `${targetDateStr}T${targetTimePart}`;
    const targetDayNum = new Date(targetDateStr).getDate();

    // 1. Update React state immediately
    const updatedAppointments = appointments.map(a => {
      if (a.id === apptId) {
        return { ...a, scheduled_at: newScheduledAt };
      }
      return a;
    });
    setAppointments(updatedAppointments);
    setDraggedApptId(null);
    setDragOverDateStr(null);
    setDragOverHour(null);

    // 2. Persist to LocalStorage
    try {
      localStorage.setItem("revflow_appointments", JSON.stringify(updatedAppointments));
    } catch (err) {}

    // 3. Show Notice
    setRescheduleNotice(`✨ Moved ${targetAppt.patient_name}: ${origDayNum}th, ${origTimeFormatted} ➜ ${targetDayNum}th, ${targetTimeFormatted}`);
    setTimeout(() => setRescheduleNotice(null), 4500);

    // 4. Update Backend API
    try {
      await fetchApi(`/appointments/${apptId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: targetAppt.status, scheduled_at: newScheduledAt })
      });
    } catch (err) {}
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, apptId: string) => {
    e.stopPropagation();
    e.dataTransfer.setData("text/plain", apptId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedApptId(apptId);
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string, hour?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverDateStr !== dateStr) {
      setDragOverDateStr(dateStr);
    }
    if (hour !== undefined && dragOverHour !== hour) {
      setDragOverHour(hour);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetDateStr: string, targetHour?: number) => {
    e.preventDefault();
    e.stopPropagation();
    const apptId = e.dataTransfer.getData("text/plain") || draggedApptId;
    if (apptId) {
      await moveAppointmentToSlot(apptId, targetDateStr, targetHour);
    }
  };

  // Status Change Handler
  const handleUpdateStatus = async (apptId: string, newStatus: Appointment["status"]) => {
    const updatedAppointments = appointments.map(a =>
      a.id === apptId ? { ...a, status: newStatus } : a
    );
    setAppointments(updatedAppointments);
    if (selectedAppt && selectedAppt.id === apptId) {
      setSelectedAppt({ ...selectedAppt, status: newStatus });
    }

    try {
      localStorage.setItem("revflow_appointments", JSON.stringify(updatedAppointments));
    } catch (e) {}

    try {
      await fetchApi(`/appointments/${apptId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {}
  };

  // Header Title Helper
  const getHeaderTitle = () => {
    if (viewMode === "month") {
      return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    if (viewMode === "week") {
      const start = weekDays[0];
      const end = weekDays[6];
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Reschedule Toast Notice */}
      {rescheduleNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-indigo-500/40 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <Sparkles className="h-5 w-5 text-emerald-400 fill-emerald-400" />
          <span className="text-xs font-bold">{rescheduleNotice}</span>
        </div>
      )}

      {/* ACTIVE MOVING APPOINTMENT BANNER */}
      {activeMovingAppt && (
        <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 p-4 rounded-2xl border border-indigo-500/50 text-white flex items-center justify-between shadow-xl animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/30 border border-indigo-400/40">
              <Move className="h-5 w-5 text-amber-300 animate-bounce" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <MousePointerClick className="h-3.5 w-3.5 text-amber-400" />
                Moving Mode Active (Drag or Click Slot)
              </div>
              <div className="text-sm font-bold flex items-center gap-2 mt-0.5">
                <span>{activeMovingAppt.patient_name}</span>
                <span className="text-slate-300 text-xs font-mono bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-700">
                  From: {new Date(activeMovingAppt.scheduled_at).getDate()}th, {formatApptTime(activeMovingAppt.scheduled_at)}
                </span>
                <ArrowRight className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-300 font-extrabold bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-600/40">
                  {dragOverDateStr
                    ? `To: ${new Date(dragOverDateStr).getDate()}th, ${dragOverHour !== null ? `${dragOverHour > 12 ? dragOverHour - 12 : dragOverHour}:00 ${dragOverHour >= 12 ? 'PM' : 'AM'}` : formatApptTime(activeMovingAppt.scheduled_at)} (Available Slot)`
                    : "Click or Drag to target hour..."}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setDraggedApptId(null)}
            className="text-xs font-mono bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full border border-white/20 text-white"
          >
            Cancel Move
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-indigo-500" />
            Clinic Master Calendar
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Drag and drop or click any appointment to instantly move patient visits across hours and days.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsBookingOpen(true)}
            className="flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5"
          >
            <Plus className="h-4 w-4" /> Book Appointment
          </Button>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div className="rounded-3xl border bg-background shadow-xl overflow-hidden flex flex-col">
        
        {/* Navigation & Controls Bar */}
        <div className="p-4 border-b flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/20">
          
          {/* Date Navigator */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleToday} className="rounded-full text-xs font-medium px-4">
              Today
            </Button>

            <div className="flex items-center gap-1 bg-background border rounded-full p-1 shadow-sm">
              <button
                onClick={handlePrev}
                className="p-1.5 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <h2 className="text-base font-bold min-w-[200px]">
              {getHeaderTitle()}
            </h2>
          </div>

          {/* Provider Filter & View Mode Switcher */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            
            {/* Provider Select */}
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="text-xs rounded-full border bg-background px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
              >
                {DOCTORS.map(doc => (
                  <option key={doc} value={doc}>{doc}</option>
                ))}
              </select>
            </div>

            {/* View Mode Buttons */}
            <div className="flex items-center bg-muted/50 p-1 rounded-full border text-xs font-medium">
              <button
                onClick={() => setViewMode("week")}
                className={`px-3.5 py-1 rounded-full transition-all flex items-center gap-1 ${
                  viewMode === "week" ? "bg-indigo-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span>Week (Grid)</span>
              </button>

              <button
                onClick={() => setViewMode("month")}
                className={`px-3.5 py-1 rounded-full transition-all flex items-center gap-1 ${
                  viewMode === "month" ? "bg-indigo-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Grid className="h-3.5 w-3.5" />
                <span>Month</span>
              </button>

              <button
                onClick={() => setViewMode("day")}
                className={`px-3.5 py-1 rounded-full transition-all flex items-center gap-1 ${
                  viewMode === "day" ? "bg-indigo-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Day</span>
              </button>

              <button
                onClick={() => setViewMode("agenda")}
                className={`px-3.5 py-1 rounded-full transition-all flex items-center gap-1 ${
                  viewMode === "agenda" ? "bg-indigo-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span>Agenda</span>
              </button>
            </div>

          </div>

        </div>

        {/* ─── VIEW 1: HOURLY WEEK TIME GRID (GOOGLE CALENDAR STYLE LAYOUT) ─── */}
        {viewMode === "week" && (
          <div className="flex flex-col flex-1 overflow-x-auto">
            
            {/* Top Date Header Row */}
            <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b bg-muted/10 text-center sticky top-0 z-20 backdrop-blur-md">
              <div className="py-3 text-[11px] font-bold text-muted-foreground uppercase border-r flex items-center justify-center">
                Time
              </div>
              {weekDays.map((d) => {
                const dateStr = d.toISOString().split("T")[0];
                const isToday = new Date().toDateString() === d.toDateString();

                return (
                  <div key={dateStr} className="py-3 border-r last:border-r-0 space-y-1">
                    <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      {d.toLocaleDateString("en-US", { weekday: "short" })}
                    </div>
                    <div
                      className={`text-xl font-extrabold mx-auto h-9 w-9 rounded-full flex items-center justify-center transition-all ${
                        isToday
                          ? "bg-blue-600 text-white ring-4 ring-blue-600/20 shadow-md"
                          : "text-foreground"
                      }`}
                    >
                      {d.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top All-Day Summary Bar */}
            <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b bg-muted/5 text-xs py-2.5 divide-x">
              <div className="px-2 text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-center gap-1">
                <User className="h-3 w-3 text-indigo-500" />
                <span>Summary</span>
              </div>
              {weekDays.map((d) => {
                const dateStr = d.toISOString().split("T")[0];
                const count = filteredAppointments.filter(a => isSameDay(a.scheduled_at, dateStr)).length;
                return (
                  <div key={dateStr} className="px-2 py-0.5 flex items-center justify-center">
                    {count > 0 ? (
                      <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs backdrop-blur-md">
                        <User className="h-2.5 w-2.5 text-indigo-500" />
                        <span>{count} {count === 1 ? "Patient Visit" : "Patient Visits"}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/30 font-medium font-mono">No visits</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Hourly Grid Rows (7 AM to 7 PM) */}
            <div className="relative flex flex-col divide-y bg-background">
              {HOURS.map((hour) => {
                const hourFormatted = `${hour > 12 ? hour - 12 : hour} ${hour >= 12 ? "PM" : "AM"}`;
                return (
                  <div key={hour} className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] min-h-[72px] divide-x">
                    
                    {/* Time Label Column */}
                    <div className="pr-3 text-right py-2 text-xs font-semibold text-muted-foreground font-mono bg-muted/10 border-r flex items-start justify-end">
                      {hourFormatted}
                    </div>

                    {/* 7 Day Column Slots */}
                    {weekDays.map((d) => {
                      const dateStr = d.toISOString().split("T")[0];
                      const isDragTarget = dragOverDateStr === dateStr && dragOverHour === hour;

                      // Find appointments for this day & hour
                      const slotAppts = filteredAppointments.filter(a => {
                        return isSameDay(a.scheduled_at, dateStr) && getApptHour(a.scheduled_at) === hour;
                      });

                      return (
                        <div
                          key={dateStr}
                          onDragOver={(e) => handleDragOver(e, dateStr, hour)}
                          onDrop={(e) => handleDrop(e, dateStr, hour)}
                          onClick={() => {
                            if (draggedApptId) {
                              moveAppointmentToSlot(draggedApptId, dateStr, hour);
                            }
                          }}
                          className={`p-1.5 transition-all relative min-h-[72px] flex flex-col gap-1.5 ${
                            isDragTarget
                              ? "bg-emerald-500/20 ring-2 ring-emerald-500 border-emerald-500 z-10 scale-[0.98]"
                              : "hover:bg-muted/15"
                          }`}
                        >
                          {/* Live Drag Over Target Slot Indicator */}
                          {isDragTarget && (
                            <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/25 px-2 py-1 rounded-lg border border-emerald-500/40 text-center animate-pulse shadow-sm">
                              ✨ Drop at {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? "PM" : "AM"}
                            </div>
                          )}

                          {/* 🎨 EXACT IMAGE MATCHED APPOINTMENT CARDS */}
                          {slotAppts.map((appt) => {
                            const grad = statusGradientMap[appt.status] || statusGradientMap.scheduled;
                            const timeVal = getTimeVal(appt.scheduled_at);
                            const timeAmpm = getTimeAmpm(appt.scheduled_at);
                            const isBeingMoved = draggedApptId === appt.id;

                            return (
                              <div
                                key={appt.id}
                                draggable={true}
                                onDragStart={(e) => handleDragStart(e, appt.id)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (draggedApptId === appt.id) {
                                    setDraggedApptId(null);
                                  } else {
                                    setSelectedAppt(appt);
                                  }
                                }}
                                className={`p-3 rounded-[20px] cursor-grab active:cursor-grabbing transition-all select-none shadow-md hover:shadow-xl hover:scale-[1.02] bg-gradient-to-br ${grad} ${
                                  isBeingMoved ? "ring-4 ring-amber-400 scale-105 z-30" : ""
                                }`}
                              >
                                {/* Top Line: Patient Name (lowercase / bold white) */}
                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                  <span className="font-extrabold text-white text-sm tracking-tight truncate lowercase">
                                    {appt.patient_name}
                                  </span>
                                  <Move className="h-3.5 w-3.5 text-white/80 group-hover:scale-110 transition-transform flex-shrink-0" />
                                </div>

                                {/* Bottom Line: Capsule Time Pill + Treatment Text */}
                                <div className="flex items-center gap-2">
                                  {/* Capsule Time Pill */}
                                  <div className="px-2.5 py-1 rounded-[14px] bg-white/20 border border-white/30 text-white backdrop-blur-md flex items-center gap-1.5 shadow-inner">
                                    <Clock className="h-3 w-3 text-white flex-shrink-0" />
                                    <div className="flex flex-col leading-none text-left">
                                      <span className="font-extrabold text-[11px] text-white tracking-tight">{timeVal}</span>
                                      <span className="font-extrabold text-[9px] text-white/90 uppercase mt-0.5">{timeAmpm}</span>
                                    </div>
                                  </div>

                                  {/* Treatment Text */}
                                  <span className="text-xs text-white/90 font-medium truncate flex-1">
                                    {appt.treatment_type || "Routine Checkup"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ─── VIEW 2: MONTH VIEW ─── */}
        {viewMode === "month" && (
          <div className="flex flex-col flex-1 overflow-x-auto">
            {/* Day Header Row */}
            <div className="grid grid-cols-7 border-b bg-muted/10 text-center py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Month Grid Cells */}
            <div className="grid grid-cols-7 grid-rows-5 min-h-[650px] divide-x divide-y border-b">
              {monthDays.map(({ date, isCurrentMonth, dateStr }) => {
                const dayAppts = filteredAppointments.filter(a => isSameDay(a.scheduled_at, dateStr));
                const isToday = new Date().toDateString() === date.toDateString();
                const isDragTarget = dragOverDateStr === dateStr;

                return (
                  <div
                    key={dateStr}
                    onDragOver={(e) => handleDragOver(e, dateStr)}
                    onDrop={(e) => handleDrop(e, dateStr)}
                    onClick={() => {
                      if (draggedApptId) {
                        moveAppointmentToSlot(draggedApptId, dateStr);
                      }
                    }}
                    className={`p-2 flex flex-col justify-start min-h-[120px] transition-all relative ${
                      !isCurrentMonth ? "bg-muted/10 opacity-40" : "bg-background hover:bg-muted/20"
                    } ${isDragTarget ? "bg-indigo-500/15 ring-2 ring-indigo-500 border-indigo-500 scale-[0.99]" : ""}`}
                  >
                    {/* Day Number Header */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center ${
                          isToday
                            ? "bg-blue-600 text-white shadow-md"
                            : isCurrentMonth
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {date.getDate()}
                      </span>

                      {isDragTarget && (
                        <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40 animate-pulse">
                          {date.getDate()}th, Slot Available
                        </span>
                      )}
                    </div>

                    {/* Appointment Draggable Cards */}
                    <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[100px]">
                      {dayAppts.map((appt) => {
                        const grad = statusGradientMap[appt.status] || statusGradientMap.scheduled;
                        const timeVal = getTimeVal(appt.scheduled_at);
                        const timeAmpm = getTimeAmpm(appt.scheduled_at);

                        return (
                          <div
                            key={appt.id}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, appt.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppt(appt);
                            }}
                            className={`p-2 rounded-[16px] border text-xs cursor-grab active:cursor-grabbing transition-all shadow-sm hover:shadow-md flex flex-col gap-1 bg-gradient-to-br ${grad}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-white text-xs truncate lowercase">
                                {appt.patient_name}
                              </span>
                              <Move className="h-3 w-3 text-white/80 flex-shrink-0" />
                            </div>

                            <div className="flex items-center gap-1.5">
                              <div className="px-1.5 py-0.5 rounded-[10px] bg-white/20 border border-white/30 text-white text-[9px] font-bold flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                {timeVal} {timeAmpm}
                              </div>
                              <span className="text-[9px] text-white/90 truncate">
                                {appt.treatment_type || "Visit"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── VIEW 3: DAY VIEW ─── */}
        {viewMode === "day" && (
          <div className="p-6 space-y-4 min-h-[500px]">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="text-sm font-bold text-foreground">
                Hourly Operating Schedule for {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </div>
              <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
                Business Hours: 8:00 AM - 6:00 PM
              </div>
            </div>
            
            <div className="space-y-2">
              {HOURS.map((hour) => {
                const hourFormatted = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? "PM" : "AM"}`;
                const targetDateStr = currentDate.toISOString().split("T")[0];

                const hourAppts = filteredAppointments.filter(a => {
                  return isSameDay(a.scheduled_at, targetDateStr) && getApptHour(a.scheduled_at) === hour;
                });

                return (
                  <div
                    key={hour}
                    onDragOver={(e) => handleDragOver(e, targetDateStr, hour)}
                    onDrop={(e) => handleDrop(e, targetDateStr, hour)}
                    onClick={() => {
                      if (draggedApptId) {
                        moveAppointmentToSlot(draggedApptId, targetDateStr, hour);
                      }
                    }}
                    className="p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors bg-background hover:bg-muted/30 border-border"
                  >
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <span className="text-xs font-bold font-mono text-muted-foreground w-16">{hourFormatted}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                        {currentDate.getDate()}th, Slot Available
                      </span>
                    </div>

                    <div className="flex-1 space-y-2">
                      {hourAppts.map(appt => {
                        const grad = statusGradientMap[appt.status] || statusGradientMap.scheduled;
                        const timeVal = getTimeVal(appt.scheduled_at);
                        const timeAmpm = getTimeAmpm(appt.scheduled_at);

                        return (
                          <div
                            key={appt.id}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, appt.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppt(appt);
                            }}
                            className={`p-3 rounded-[18px] border text-xs cursor-grab active:cursor-grabbing flex items-center justify-between gap-2 shadow-sm bg-gradient-to-br ${grad}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="px-2.5 py-1 rounded-[12px] bg-white/20 border border-white/30 text-white font-bold flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {timeVal} {timeAmpm}
                              </div>
                              <div>
                                <div className="font-extrabold text-white text-sm lowercase">{appt.patient_name}</div>
                                <div className="text-[10px] text-white/90">{appt.treatment_type || "Checkup"} • {appt.provider_name}</div>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-white/20 text-white border border-white/30">
                              {appt.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── VIEW 4: AGENDA VIEW ─── */}
        {viewMode === "agenda" && (
          <div className="p-6 space-y-4 divide-y">
            {filteredAppointments.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">No appointments scheduled</div>
            ) : (
              filteredAppointments.map(appt => (
                <div
                  key={appt.id}
                  onClick={() => setSelectedAppt(appt)}
                  className="py-4 first:pt-0 flex items-center justify-between hover:bg-muted/20 px-4 rounded-2xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <div className="text-xs font-bold text-indigo-600 uppercase">
                        {new Date(appt.scheduled_at).toLocaleDateString("en-US", { month: "short" })}
                      </div>
                      <div className="text-lg font-extrabold">
                        {new Date(appt.scheduled_at).getDate()}
                      </div>
                    </div>

                    <div>
                      <div className="font-bold text-sm">{appt.patient_name}</div>
                      <div className="text-xs text-muted-foreground">{appt.patient_phone} • {appt.treatment_type || "Routine Visit"}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-semibold">{appt.provider_name || "Doctor"}</div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-600/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 mt-1">
                      {formatApptTime(appt.scheduled_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* Appointment Details & Status Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-indigo-500" />
                Appointment Details
              </h3>
              <button onClick={() => setSelectedAppt(null)} className="p-1 rounded-full hover:bg-muted text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground font-medium">Patient Name:</span>
                <span className="font-bold text-foreground">{selectedAppt.patient_name}</span>
              </div>

              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground font-medium">Phone Number:</span>
                <span className="font-mono text-foreground">{selectedAppt.patient_phone}</span>
              </div>

              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground font-medium">Doctor / Provider:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedAppt.provider_name || "Unassigned"}</span>
              </div>

              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground font-medium">Date & Time:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {formatApptFullDateTime(selectedAppt.scheduled_at)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground font-medium">Treatment Type:</span>
                <span className="font-semibold text-foreground">{selectedAppt.treatment_type || "General Checkup"}</span>
              </div>
            </div>

            {/* Quick Move Action in Modal */}
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-2">
              <div className="font-bold text-indigo-600 dark:text-indigo-300 flex items-center gap-1.5">
                <Move className="h-4 w-4" /> Quick Reschedule Slot
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    const todayStr = new Date().toISOString().split("T")[0];
                    moveAppointmentToSlot(selectedAppt.id, todayStr, 10);
                    setSelectedAppt(null);
                  }}
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-[11px] flex-1"
                >
                  Move Today 10 AM
                </Button>
                <Button
                  onClick={() => {
                    const tom = new Date();
                    tom.setDate(tom.getDate() + 1);
                    const tomStr = tom.toISOString().split("T")[0];
                    moveAppointmentToSlot(selectedAppt.id, tomStr, 14);
                    setSelectedAppt(null);
                  }}
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-[11px] flex-1"
                >
                  Move Tomorrow 2 PM
                </Button>
              </div>
            </div>

            {/* Quick Status Action Buttons */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-bold text-muted-foreground uppercase">Update Status:</div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => handleUpdateStatus(selectedAppt.id, "confirmed")}
                  size="sm"
                  variant={selectedAppt.status === "confirmed" ? "default" : "outline"}
                  className="rounded-xl text-xs"
                >
                  Confirm
                </Button>
                <Button
                  onClick={() => handleUpdateStatus(selectedAppt.id, "completed")}
                  size="sm"
                  variant={selectedAppt.status === "completed" ? "default" : "outline"}
                  className="rounded-xl text-xs"
                >
                  Complete
                </Button>
                <Button
                  onClick={() => handleUpdateStatus(selectedAppt.id, "cancelled")}
                  size="sm"
                  variant={selectedAppt.status === "cancelled" ? "destructive" : "outline"}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t">
              <Button onClick={() => setSelectedAppt(null)} variant="outline" size="sm" className="rounded-full">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={() => fetchAppointments()}
      />

    </div>
  );
}
