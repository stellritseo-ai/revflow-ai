"use client";

import React, { useState } from "react";
import {
  PhoneCall, PhoneIncoming, PhoneOutgoing, Activity, CheckCircle2,
  Clock, Zap, Sparkles, Filter, Search, Volume2
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceCallRecord {
  id: string;
  clinic: string;
  patient_phone: string;
  direction: "Inbound" | "Outbound AI";
  duration: string;
  outcome: "Appointment Booked" | "Inquiry Answered" | "Staff Transferred";
  ai_latency: string;
  timestamp: string;
}

const defaultVoiceCalls: VoiceCallRecord[] = [
  { id: "call-101", clinic: "Smile Dental Care", patient_phone: "(555) 234-8901", direction: "Inbound", duration: "2m 14s", outcome: "Appointment Booked", ai_latency: "280ms", timestamp: "10:14 AM" },
  { id: "call-102", clinic: "Sunshine Cosmetic", patient_phone: "(555) 890-1234", direction: "Outbound AI", duration: "1m 45s", outcome: "Appointment Booked", ai_latency: "295ms", timestamp: "10:02 AM" },
  { id: "call-103", clinic: "Apex Family Dental", patient_phone: "(555) 345-6789", direction: "Inbound", duration: "3m 10s", outcome: "Inquiry Answered", ai_latency: "270ms", timestamp: "09:48 AM" },
  { id: "call-104", clinic: "Westside Pediatric", patient_phone: "(555) 901-2345", direction: "Inbound", duration: "1m 20s", outcome: "Staff Transferred", ai_latency: "310ms", timestamp: "09:30 AM" }
];

export default function SuperAdminVoicePage() {
  const [calls] = useState<VoiceCallRecord[]>(defaultVoiceCalls);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCalls = calls.filter(c =>
    c.clinic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.patient_phone.includes(searchTerm) ||
    c.outcome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5 text-foreground">
              <PhoneCall className="h-6 w-6 text-indigo-600" />
              Platform Voice Telephony & AI Call Telemetry
            </h1>
            <span className="text-xs font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
              48,500 Voice Mins
            </span>
          </div>
          <p className="text-muted-foreground text-xs mt-1">
            Real-time telephony stream monitoring, call conversion outcomes, ElevenLabs speech latency, and Twilio SIP trunk metrics.
          </p>
        </div>
      </div>

      {/* Voice Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-3xl border bg-card shadow-sm space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase">Voice Minutes Consumed</span>
          <div className="text-3xl font-black text-indigo-600">48,500 Mins</div>
          <p className="text-xs text-muted-foreground">HD Audio Stream</p>
        </div>

        <div className="p-5 rounded-3xl border bg-card shadow-sm space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase">Call Booking Conversion Rate</span>
          <div className="text-3xl font-black text-emerald-600">88.4%</div>
          <p className="text-xs text-emerald-600 font-semibold">1,420 appointments booked today</p>
        </div>

        <div className="p-5 rounded-3xl border bg-card shadow-sm space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase">Average Latency</span>
          <div className="text-3xl font-black text-purple-600">280ms</div>
          <p className="text-xs text-purple-600 font-semibold">ElevenLabs Speech Stream</p>
        </div>

        <div className="p-5 rounded-3xl border bg-card shadow-sm space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase">Twilio SIP Connection</span>
          <div className="text-3xl font-black text-foreground">100% Online</div>
          <p className="text-xs text-emerald-600 font-semibold">0 dropped packets</p>
        </div>
      </div>

      {/* Real-time Call Log Stream Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-indigo-600" /> Live AI Voice Call Stream Logs
          </h2>

          <div className="relative max-w-sm">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search calls by clinic or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="border rounded-3xl bg-card shadow-md overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Clinic Practice</th>
                <th className="px-5 py-3.5">Patient Phone</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Duration</th>
                <th className="px-5 py-3.5">AI Speech Latency</th>
                <th className="px-5 py-3.5 text-right">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredCalls.map(c => (
                <tr key={c.id} className="hover:bg-muted/20">
                  <td className="px-5 py-4 font-bold text-foreground">{c.clinic}</td>
                  <td className="px-5 py-4 font-mono text-muted-foreground">{c.patient_phone}</td>
                  <td className="px-5 py-4 font-semibold text-foreground">
                    <span className="inline-flex items-center gap-1">
                      {c.direction === "Inbound" ? <PhoneIncoming className="h-3.5 w-3.5 text-indigo-500" /> : <PhoneOutgoing className="h-3.5 w-3.5 text-emerald-500" />}
                      {c.direction}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono text-foreground">{c.duration}</td>
                  <td className="px-5 py-4 font-mono text-purple-600 font-bold">{c.ai_latency}</td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      {c.outcome}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
