"use client";

import React, { useState } from "react";
import {
  Bell, AlertTriangle, CheckCircle2, Sparkles, Filter, Search, PhoneCall,
  Calendar, ShieldAlert, Bot, Mail, Check, Trash2, ArrowRight, Eye, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ClinicNotification {
  id: string;
  category: "emergency" | "ai_booking" | "sms_recovered" | "system";
  title: string;
  description: string;
  patient_name?: string;
  patient_phone?: string;
  time: string;
  read: boolean;
  priority: "High" | "Medium" | "Normal";
}

const defaultNotifications: ClinicNotification[] = [
  {
    id: "notif-1",
    category: "emergency",
    title: "🚨 Emergency Toothache Pain Escalation",
    description: "Jack Miller called reporting severe lower right molar pain. Aria AI reserved emergency slot for Mon, Jul 27 at 10:00 AM with Dr. Sarah Jenkins.",
    patient_name: "Jack Miller",
    patient_phone: "(555) 234-8901",
    time: "10 mins ago",
    read: false,
    priority: "High"
  },
  {
    id: "notif-2",
    category: "ai_booking",
    title: "✨ AI Confirmed Appointment #REV-9021",
    description: "Emily Watson confirmed 45-min Invisalign consultation for Tue, Jul 28 at 02:00 PM with Dr. Michael Chen.",
    patient_name: "Emily Watson",
    patient_phone: "(555) 890-1234",
    time: "25 mins ago",
    read: false,
    priority: "Medium"
  },
  {
    id: "notif-3",
    category: "sms_recovered",
    title: "📞 Missed Call Auto-SMS Engaged",
    description: "After-hours caller (555) 345-6789 missed call was auto-sent SMS. Patient replied requesting 6-month cleaning slot.",
    patient_name: "Marcus Brody",
    patient_phone: "(555) 345-6789",
    time: "1 hour ago",
    read: true,
    priority: "Normal"
  },
  {
    id: "notif-4",
    category: "system",
    title: "📢 Platform Update: ElevenLabs Voice v2.4 Live",
    description: "RevFlow AI Telephony engine upgraded to low-latency 280ms voice streaming mode.",
    time: "3 hours ago",
    read: true,
    priority: "Normal"
  },
  {
    id: "notif-5",
    category: "ai_booking",
    title: "✨ AI Confirmed Appointment #REV-9018",
    description: "Sarah Connor booked routine prophylaxis cleaning for Wed, Jul 29 at 11:00 AM.",
    patient_name: "Sarah Connor",
    patient_phone: "(555) 901-2345",
    time: "5 hours ago",
    read: true,
    priority: "Normal"
  }
];

export default function ClinicNotificationsPage() {
  const [notifications, setNotifications] = useState<ClinicNotification[]>(defaultNotifications);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setToastNotice("✓ All notifications marked as read!");
    setTimeout(() => setToastNotice(null), 3500);
  };

  const handleToggleRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesCategory = filterCategory === "all" ||
      (filterCategory === "unread" && !n.read) ||
      n.category === filterCategory;

    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.patient_name && n.patient_name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Toast Notice */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-indigo-500/40 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <Sparkles className="h-5 w-5 text-emerald-400 fill-emerald-400" />
          <span className="text-xs font-bold">{toastNotice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
              <Bell className="h-6 w-6 text-indigo-600" />
              Clinic Notifications & AI Alert Hub
            </h1>
            {unreadCount > 0 && (
              <span className="text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                {unreadCount} Unread Alerts
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time notifications for emergency toothache escalations, AI appointment bookings, missed call recoveries, and system notices.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={handleMarkAllRead}
            variant="outline"
            size="sm"
            className="rounded-2xl text-xs font-bold"
          >
            <Check className="h-4 w-4 mr-1 text-emerald-500" /> Mark All Read
          </Button>

          <Link href="/settings/notifications">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold">
              Alert Rules Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold pb-1 [scrollbar-width:none]">
          <button
            onClick={() => setFilterCategory("all")}
            className={`px-3.5 py-1.5 rounded-2xl transition-all ${
              filterCategory === "all" ? "bg-indigo-600 text-white shadow-sm" : "bg-card border text-muted-foreground hover:bg-muted"
            }`}
          >
            All ({notifications.length})
          </button>

          <button
            onClick={() => setFilterCategory("unread")}
            className={`px-3.5 py-1.5 rounded-2xl transition-all ${
              filterCategory === "unread" ? "bg-indigo-600 text-white shadow-sm" : "bg-card border text-muted-foreground hover:bg-muted"
            }`}
          >
            Unread ({unreadCount})
          </button>

          <button
            onClick={() => setFilterCategory("emergency")}
            className={`px-3.5 py-1.5 rounded-2xl transition-all ${
              filterCategory === "emergency" ? "bg-rose-600 text-white shadow-sm" : "bg-card border text-muted-foreground hover:bg-muted"
            }`}
          >
            Emergency Toothaches
          </button>

          <button
            onClick={() => setFilterCategory("ai_booking")}
            className={`px-3.5 py-1.5 rounded-2xl transition-all ${
              filterCategory === "ai_booking" ? "bg-emerald-600 text-white shadow-sm" : "bg-card border text-muted-foreground hover:bg-muted"
            }`}
          >
            AI Bookings
          </button>

          <button
            onClick={() => setFilterCategory("sms_recovered")}
            className={`px-3.5 py-1.5 rounded-2xl transition-all ${
              filterCategory === "sms_recovered" ? "bg-purple-600 text-white shadow-sm" : "bg-card border text-muted-foreground hover:bg-muted"
            }`}
          >
            Missed Call SMS
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search alerts or patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-2xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
          />
        </div>
      </div>

      {/* Notifications Roster Feed */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border bg-card space-y-3">
            <Bell className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <h3 className="font-extrabold text-sm text-foreground">No Notifications Found</h3>
            <p className="text-xs text-muted-foreground">You are all caught up! No notifications match your selected filter.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 rounded-3xl border transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                !n.read
                  ? "bg-indigo-500/5 border-indigo-500/30 dark:bg-indigo-950/20"
                  : "bg-card border-border/60 hover:bg-muted/20"
              }`}
            >
              <div className="flex items-start gap-4 min-w-0">
                <div className={`p-3 rounded-2xl shrink-0 mt-0.5 ${
                  n.category === "emergency"
                    ? "bg-rose-500/10 text-rose-600"
                    : n.category === "ai_booking"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : n.category === "sms_recovered"
                    ? "bg-purple-500/10 text-purple-600"
                    : "bg-blue-500/10 text-blue-600"
                }`}>
                  {n.category === "emergency" ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : n.category === "ai_booking" ? (
                    <Sparkles className="h-5 w-5" />
                  ) : n.category === "sms_recovered" ? (
                    <PhoneCall className="h-5 w-5" />
                  ) : (
                    <Bell className="h-5 w-5" />
                  )}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-extrabold text-sm text-foreground">{n.title}</h3>
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{n.description}</p>

                  <div className="flex items-center gap-3 pt-1 text-[10px] font-mono text-muted-foreground">
                    <span>{n.time}</span>
                    {n.patient_name && (
                      <>
                        <span>•</span>
                        <span className="font-bold text-foreground">{n.patient_name} ({n.patient_phone})</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 justify-end">
                {n.patient_name && (
                  <Link href="/patients">
                    <Button variant="outline" size="sm" className="rounded-xl text-[11px] font-bold">
                      <User className="h-3.5 w-3.5 mr-1" /> View Patient
                    </Button>
                  </Link>
                )}

                <button
                  onClick={() => handleToggleRead(n.id)}
                  title={n.read ? "Mark Unread" : "Mark Read"}
                  className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Check className={`h-4 w-4 ${n.read ? "text-emerald-500" : ""}`} />
                </button>

                <button
                  onClick={() => handleDeleteNotification(n.id)}
                  title="Delete Alert"
                  className="p-2 rounded-xl text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
