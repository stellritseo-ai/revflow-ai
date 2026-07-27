"use client";

import React, { useState } from "react";
import { Megaphone, Send, Sparkles, Bell, CheckCircle2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SuperAdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<"maintenance" | "update" | "alert">("update");
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const [pastAnnouncements] = useState([
    { id: "ann-1", title: "Scheduled System Maintenance Notice", type: "maintenance", sent_at: "Today 04:00 AM", status: "Delivered to 42 Clinics" },
    { id: "ann-2", title: "New ElevenLabs HD Voice Model Upgrade v2.4", type: "update", sent_at: "Yesterday 02:30 PM", status: "Delivered to 42 Clinics" }
  ]);

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setTitle("");
    setBody("");
    setToastNotice("📢 Broadcast Announcement dispatched to all 42 clinic practice dashboards!");
    setTimeout(() => setToastNotice(null), 4000);
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Toast Notice */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-indigo-500/40 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <Sparkles className="h-5 w-5 text-emerald-400 fill-emerald-400" />
          <span className="text-xs font-bold">{toastNotice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5 text-foreground">
              <Megaphone className="h-6 w-6 text-indigo-600" />
              Broadcast Announcements & Maintenance Banners
            </h1>
            <span className="text-xs font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
              42 Clinic Dashboards Target
            </span>
          </div>
          <p className="text-muted-foreground text-xs mt-1">
            Compose and broadcast platform updates, scheduled maintenance notices, or security alerts across all subscribed clinic tenant dashboards.
          </p>
        </div>
      </div>

      {/* Broadcast Composer Form */}
      <form onSubmit={handleSendBroadcast} className="p-6 rounded-3xl border bg-card shadow-md space-y-5">
        <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
          <Send className="h-5 w-5 text-indigo-600" /> Compose Platform Announcement
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-muted-foreground">Announcement Title</label>
            <input
              type="text"
              required
              placeholder="e.g. System Upgrade to ElevenLabs Voice Engine v2.4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-muted-foreground">Notice Type Banner</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
            >
              <option value="update">Product & Feature Release Update (Blue Banner)</option>
              <option value="maintenance">Scheduled System Maintenance (Amber Banner)</option>
              <option value="alert">Critical Security Alert (Red Banner)</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          <label className="font-bold text-muted-foreground">Announcement Message Body</label>
          <textarea
            rows={4}
            required
            placeholder="Type notification message to be displayed to clinic doctors & staff..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
          />
        </div>

        <div className="pt-3 border-t flex justify-end">
          <Button type="submit" className="bg-indigo-600 text-white rounded-2xl text-xs font-bold px-6">
            Dispatch Broadcast Notice
          </Button>
        </div>
      </form>

      {/* Past Announcements History */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-foreground">Broadcast History</h2>

        <div className="border rounded-3xl bg-card shadow-md p-4 space-y-3">
          {pastAnnouncements.map((a) => (
            <div key={a.id} className="p-4 rounded-2xl bg-muted/20 border flex items-center justify-between text-xs">
              <div>
                <div className="font-extrabold text-foreground">{a.title}</div>
                <div className="text-muted-foreground text-[10px]">{a.sent_at}</div>
              </div>
              <span className="text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {a.status}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
