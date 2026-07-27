"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Mic, Phone, PhoneCall, Calendar, Clock, CheckCircle2, AlertCircle, Play, Pause,
  Sparkles, Search, Filter, ShieldCheck, Stethoscope, ArrowUpRight, User, FileText,
  MessageSquare, Volume2, RefreshCw, ChevronRight, Activity, Zap, Check, HeartPulse
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface CallTranscriptTurn {
  speaker: "AI" | "Patient";
  text: string;
  timestamp: string;
}

interface VoiceCallLog {
  id: string;
  call_id: string;
  patient_name: string;
  patient_phone: string;
  patient_avatar: string;
  call_time: string;
  duration: string;
  duration_seconds: number;
  outcome: "Appointment Booked" | "Inquiry Answered" | "Human Handoff";
  converted: boolean;
  booked_details?: string;
  intent: string;
  sentiment: "Positive" | "Neutral font" | "Urgent / Pain";
  summary: string;
  transcript: CallTranscriptTurn[];
}

const defaultVoiceCalls: VoiceCallLog[] = [
  {
    id: "call-1",
    call_id: "CALL-2026-9081",
    patient_name: "Jack Miller",
    patient_phone: "(555) 234-8901",
    patient_avatar: "J",
    call_time: "2026-07-26T10:14:00.000Z",
    duration: "2m 18s",
    duration_seconds: 138,
    outcome: "Appointment Booked",
    converted: true,
    booked_details: "Emergency Toothache Visit • Mon, Jul 27 @ 10:00 AM with Dr. Sarah Jenkins",
    intent: "Emergency Molar Pain & Immediate Booking",
    sentiment: "Urgent / Pain",
    summary: "Patient called reporting severe lower right molar pain. AI voice receptionist verified emergency slot with Dr. Sarah Jenkins for Monday 10:00 AM, collected insurance info, and sent instant SMS confirmation.",
    transcript: [
      { speaker: "AI", text: "Hello! Thank you for calling RevFlow Dental Clinic. I'm Aria, your AI Voice Assistant. How can I help you today?", timestamp: "0:02" },
      { speaker: "Patient", text: "Hi, I have a really bad toothache in my lower right molar. Do you have any emergency appointments open?", timestamp: "0:12" },
      { speaker: "AI", text: "I'm so sorry to hear you're in pain Jack! We prioritize emergency toothaches. Dr. Sarah Jenkins has an emergency slot open tomorrow morning at 10:00 AM. Would that work for you?", timestamp: "0:25" },
      { speaker: "Patient", text: "Yes! 10:00 AM tomorrow works great.", timestamp: "0:38" },
      { speaker: "AI", text: "Perfect! I have booked your appointment for Monday, July 27th at 10:00 AM with Dr. Jenkins. I've also sent an SMS text confirmation to your phone. Please arrive 10 minutes early!", timestamp: "0:52" }
    ]
  },
  {
    id: "call-2",
    call_id: "CALL-2026-9082",
    patient_name: "Emily Watson",
    patient_phone: "(555) 890-1234",
    patient_avatar: "E",
    call_time: "2026-07-25T14:30:00.000Z",
    duration: "1m 45s",
    duration_seconds: 105,
    outcome: "Appointment Booked",
    converted: true,
    booked_details: "Invisalign 3D Scan • Tue, Jul 28 @ 02:00 PM with Dr. Michael Chen",
    intent: "Invisalign Cosmetic Consultation",
    sentiment: "Positive",
    summary: "Patient called inquiring about clear aligners and pricing. AI explained PPO insurance benefits, 0% APR financing, and booked 3D ClinCheck scan.",
    transcript: [
      { speaker: "AI", text: "Thank you for calling RevFlow Dental Clinic. This is Aria! How can I assist your smile today?", timestamp: "0:02" },
      { speaker: "Patient", text: "Hi, I wanted to ask about Invisalign consultations and if you accept Delta Dental PPO?", timestamp: "0:10" },
      { speaker: "AI", text: "Yes! We are in-network with Delta Dental PPO, and initial 3D aligner scans are complimentary. Would you like to schedule an exam with Dr. Michael Chen?", timestamp: "0:22 font-mono" },
      { speaker: "Patient", text: "Sure, Tuesday afternoon would be great.", timestamp: "0:35" },
      { speaker: "AI", text: "I have Tuesday at 2:00 PM reserved for you with Dr. Chen! See you then!", timestamp: "0:48" }
    ]
  },
  {
    id: "call-3",
    call_id: "CALL-2026-9083",
    patient_name: "Sophia Martinez",
    patient_phone: "(555) 456-7890",
    patient_avatar: "S",
    call_time: "2026-07-24T11:00:00.000Z",
    duration: "3m 05s",
    duration_seconds: 185,
    outcome: "Inquiry Answered",
    converted: false,
    intent: "Pediatric Cleaning & Insurance Policy",
    sentiment: "Neutral font",
    summary: "Caller inquired about pediatric sealants and fluoride coverage. AI provided full policy details and sent clinic brochure via SMS text.",
    transcript: [
      { speaker: "AI", text: "RevFlow Dental Clinic, Aria speaking! How can I help you?", timestamp: "0:02" },
      { speaker: "Patient", text: "Hi, does your clinic treat children for sealant coatings?", timestamp: "0:15" },
      { speaker: "AI", text: "Absolutely! Dr. Elena Rostova specializes in pediatric dentistry. Sealants are 100% covered by most insurance plans.", timestamp: "0:28" }
    ]
  },
  {
    id: "call-4",
    call_id: "CALL-2026-9084",
    patient_name: "Marcus Brody",
    patient_phone: "(555) 345-6789",
    patient_avatar: "M",
    call_time: "2026-07-23T16:20:00.000Z",
    duration: "1m 12s",
    duration_seconds: 72,
    outcome: "Human Handoff",
    converted: false,
    intent: "Complex Oral Surgery Referral",
    sentiment: "Urgent / Pain",
    summary: "Patient requested direct transfer to oral surgeon regarding wisdom teeth extraction. AI performed warm handoff to front desk receptionist.",
    transcript: [
      { speaker: "AI", text: "RevFlow Dental AI Receptionist. How may I assist you?", timestamp: "0:02" },
      { speaker: "Patient", text: "I need to talk to a human receptionist about wisdom tooth surgery.", timestamp: "0:10" },
      { speaker: "AI", text: "Connecting you directly to our front desk team right now!", timestamp: "0:20" }
    ]
  }
];

export default function VoiceCallsPage() {
  const [calls, setCalls] = useState<VoiceCallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<"all" | "converted" | "inquiry" | "handoff">("all");
  const [selectedCallId, setSelectedCallId] = useState<string>("call-1");

  // Audio Playback Simulation State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Load Voice Calls
  const loadCalls = async () => {
    setLoading(true);
    let localCalls: VoiceCallLog[] = [];
    try {
      const raw = localStorage.getItem("revflow_voice_calls");
      if (raw) localCalls = JSON.parse(raw);
    } catch (e) {}

    try {
      const serverData = await fetchApi<any[]>("/calls?limit=300");
      if (serverData && Array.isArray(serverData) && serverData.length > 0) {
        const map = new Map<string, VoiceCallLog>();
        serverData.forEach((c, idx) => {
          map.set(c.id || `call-srv-${idx}`, {
            id: c.id || `call-srv-${idx}`,
            call_id: c.call_id || `CALL-2026-${100 + idx}`,
            patient_name: c.patient_name || c.caller_name || "Phone Caller",
            patient_phone: c.patient_phone || c.phone || "(555) 000-0000",
            patient_avatar: (c.patient_name || c.caller_name || "P").charAt(0),
            call_time: c.call_time || c.created_at || new Date().toISOString(),
            duration: c.duration || "2m 10s",
            duration_seconds: c.duration_seconds || 130,
            outcome: c.appointment_booked ? "Appointment Booked" : c.outcome || "Inquiry Answered",
            converted: c.appointment_booked ?? (c.outcome === "Appointment Booked"),
            booked_details: c.booked_details || "Confirmed Clinical Booking",
            intent: c.intent || "General Dental Consultation",
            sentiment: c.sentiment || "Positive",
            summary: c.summary || c.ai_notes || "AI voice call processed successfully.",
            transcript: c.transcript || [
              { speaker: "AI", text: "Hello! Thank you for calling RevFlow Dental Clinic.", timestamp: "0:02" },
              { speaker: "Patient", text: "Hi, I called to inquire about appointment openings.", timestamp: "0:12" }
            ]
          });
        });
        localCalls.forEach(c => {
          if (!map.has(c.id)) map.set(c.id, c);
        });
        const merged = Array.from(map.values());
        setCalls(merged);
        try {
          localStorage.setItem("revflow_voice_calls", JSON.stringify(merged));
        } catch (e) {}
      } else if (localCalls.length > 0) {
        setCalls(localCalls);
      } else {
        setCalls(defaultVoiceCalls);
      }
    } catch (err) {
      console.log("Using local voice calls repository");
      setCalls(localCalls.length > 0 ? localCalls : defaultVoiceCalls);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalls();
  }, []);

  // Currently Selected Call
  const activeCall = useMemo(() => {
    return calls.find(c => c.id === selectedCallId) || calls[0] || null;
  }, [calls, selectedCallId]);

  // Filtered Calls Calculation
  const filteredCalls = useMemo(() => {
    return calls.filter(c => {
      const matchesSearch =
        c.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.patient_phone.includes(searchTerm) ||
        c.call_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.intent.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (filterCategory === "converted") return c.converted;
      if (filterCategory === "inquiry") return c.outcome === "Inquiry Answered";
      if (filterCategory === "handoff") return c.outcome === "Human Handoff";
      return true;
    });
  }, [calls, searchTerm, filterCategory]);

  // Metrics
  const totalCallsCount = calls.length;
  const convertedCallsCount = calls.filter(c => c.converted).length;
  const conversionRate = totalCallsCount > 0 ? Math.round((convertedCallsCount / totalCallsCount) * 100) : 62;

  // Simulate AI Voice Call Demo Tool
  const handleSimulateVoiceCall = () => {
    const names = ["David Miller", "Rachel Green", "James Wilson", "Laura Vance"];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const callId = `call-${Date.now()}`;

    const newCall: VoiceCallLog = {
      id: callId,
      call_id: `CALL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patient_name: randomName,
      patient_phone: "(555) 789-0123",
      patient_avatar: randomName.charAt(0),
      call_time: new Date().toISOString(),
      duration: "2m 05s",
      duration_seconds: 125,
      outcome: "Appointment Booked",
      converted: true,
      booked_details: "Routine Hygiene & Checkup • Tomorrow @ 11:00 AM with Dr. Sarah Jenkins",
      intent: "Checkup Booking & Hygiene Inquiry",
      sentiment: "Positive",
      summary: `${randomName} called seeking a routine dental exam. AI voice receptionist verified insurance benefits and confirmed booking for 11:00 AM with Dr. Sarah Jenkins.`,
      transcript: [
        { speaker: "AI", text: "Hello! RevFlow Dental Clinic, Aria speaking! How may I help you?", timestamp: "0:02" },
        { speaker: "Patient", text: `Hi, my name is ${randomName}. I'd like to book a routine cleaning and checkup.`, timestamp: "0:12" },
        { speaker: "AI", text: "I can help with that right away! I have an opening tomorrow at 11:00 AM with Dr. Sarah Jenkins. Shall I book that for you?", timestamp: "0:28" },
        { speaker: "Patient", text: "Yes, that time is perfect. Thank you!", timestamp: "0:45" },
        { speaker: "AI", text: "Your appointment is confirmed for 11:00 AM tomorrow. I've sent an SMS text confirmation to your phone. Have a wonderful day!", timestamp: "1:02" }
      ]
    };

    const updated = [newCall, ...calls];
    setCalls(updated);
    setSelectedCallId(callId);
    try {
      localStorage.setItem("revflow_voice_calls", JSON.stringify(updated));
    } catch (e) {}
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              AI Voice Call Receptionist Active
            </span>
            <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              {conversionRate}% Conversion Rate
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-white">
            <PhoneCall className="h-8 w-8 text-indigo-400" />
            AI Voice Calls & Appointment Conversion Studio
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Detailed transcripts, conversion analytics, patient intents, and audio playback for all incoming AI voice calls.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Button
            onClick={handleSimulateVoiceCall}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-5 py-2.5 shadow-lg shadow-indigo-600/30 flex items-center gap-2 font-medium transition-all active:scale-95 text-xs"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            Simulate AI Voice Call
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Calls Received</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <PhoneCall className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">{totalCallsCount} Calls</div>
            <div className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">
              <span>Handled by AI Voice Bot</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Converted Bookings</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">{convertedCallsCount} Appointments</div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>{conversionRate}% Conversion Rate</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Call Duration</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">2m 14s</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>Efficient AI dialogue</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Voice Accuracy</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <HeartPulse className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">98.6%</div>
            <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-300 font-medium mt-1">
              <span>Patient satisfaction rating</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main 2-Column Voice Call Application Shell */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px] rounded-3xl border bg-background shadow-xl overflow-hidden">
        
        {/* LEFT COLUMN: Voice Call Log Roster (5 Cols) */}
        <div className="lg:col-span-5 border-r flex flex-col bg-muted/10">
          
          {/* Toolbar & Search */}
          <div className="p-4 border-b space-y-3 bg-muted/20">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-indigo-500" />
                AI Voice Call Logs
              </h3>
              <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-500/20">
                {filteredCalls.length} Calls
              </span>
            </div>

            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search patient, phone, intent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-muted/50 p-1 rounded-full border text-[11px] font-medium justify-between overflow-x-auto">
              <button
                onClick={() => setFilterCategory("all")}
                className={`px-3 py-0.5 rounded-full transition-all ${
                  filterCategory === "all" ? "bg-indigo-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Calls
              </button>

              <button
                onClick={() => setFilterCategory("converted")}
                className={`px-3 py-0.5 rounded-full transition-all ${
                  filterCategory === "converted" ? "bg-indigo-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Converted ({convertedCallsCount})
              </button>

              <button
                onClick={() => setFilterCategory("inquiry")}
                className={`px-3 py-0.5 rounded-full transition-all ${
                  filterCategory === "inquiry" ? "bg-indigo-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Inquiries
              </button>

              <button
                onClick={() => setFilterCategory("handoff")}
                className={`px-3 py-0.5 rounded-full transition-all ${
                  filterCategory === "handoff" ? "bg-indigo-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Handoffs
              </button>
            </div>
          </div>

          {/* Calls List */}
          <div className="flex-1 overflow-y-auto divide-y [scrollbar-width:thin]">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-500 mb-2" />
                Loading AI voice calls...
              </div>
            ) : filteredCalls.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-xs">
                No voice calls found matching your search.
              </div>
            ) : (
              filteredCalls.map(c => {
                const isSelected = c.id === activeCall?.id;

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCallId(c.id)}
                    className={`p-4 cursor-pointer transition-all flex items-start gap-3 relative ${
                      isSelected
                        ? "bg-indigo-600/10 border-l-4 border-indigo-600"
                        : "bg-muted/10 hover:bg-muted/30"
                    }`}
                  >
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0">
                      {c.patient_avatar}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs truncate text-foreground">{c.patient_name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">{c.duration}</span>
                      </div>

                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{c.patient_phone}</div>

                      <div className="flex items-center gap-1.5 mt-2">
                        {c.converted ? (
                          <span className="text-[9px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Appointment Booked
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold bg-muted px-2 py-0.5 rounded-full text-muted-foreground border">
                            {c.outcome}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Full Transcript & Audio Player Viewer (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col h-full bg-background overflow-hidden">
          {activeCall ? (
            <div className="flex flex-col h-full overflow-y-auto [scrollbar-width:thin] p-6 space-y-6">
              
              {/* Call Detail Header & Audio Player */}
              <div className="border-b pb-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-base shadow-md">
                      {activeCall.patient_avatar}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-foreground">{activeCall.patient_name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{activeCall.patient_phone} • {activeCall.call_id}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20">
                      Duration: {activeCall.duration}
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {new Date(activeCall.call_time).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </div>

                {/* Simulated Audio Player Waveform Card */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-lg border border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className="h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md transition-all active:scale-95"
                    >
                      {isPlayingAudio ? <Pause className="h-5 w-5 fill-white" /> : <Play className="h-5 w-5 fill-white ml-0.5" />}
                    </button>
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <Volume2 className="h-4 w-4 text-indigo-400" />
                        AI Voice Call Recording
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {isPlayingAudio ? "Playing audio stream..." : "Click play to listen to HD call audio"}
                      </div>
                    </div>
                  </div>

                  {/* Waveform Bar Graphic */}
                  <div className="flex items-center gap-1">
                    {[40, 70, 30, 90, 50, 80, 40, 100, 60, 30, 75, 45, 85].map((h, i) => (
                      <span
                        key={i}
                        style={{ height: `${h}%` }}
                        className={`w-1 rounded-full transition-all ${
                          isPlayingAudio ? "bg-indigo-400 animate-pulse" : "bg-slate-700"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Conversion Outcome Banner */}
              {activeCall.converted && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                  <div className="font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Appointment Successfully Booked by AI!
                  </div>
                  <p className="text-foreground font-semibold font-mono">{activeCall.booked_details}</p>
                </div>
              )}

              {/* Executive Call Summary Box */}
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-2">
                <div className="font-bold text-indigo-600 dark:text-indigo-300 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                  <Sparkles className="h-4 w-4" /> AI Executive Call Summary
                </div>
                <p className="text-foreground leading-relaxed text-xs italic bg-background/60 p-3.5 rounded-xl border border-indigo-500/20">
                  "{activeCall.summary}"
                </p>
              </div>

              {/* Turn-by-Turn Text Transcript View */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-indigo-500" />
                    Full Text Transcript ({activeCall.transcript?.length || 0} Turns)
                  </h4>
                  <span className="text-[10px] font-mono text-muted-foreground">Voice Speech-to-Text</span>
                </div>

                <div className="space-y-3">
                  {activeCall.transcript?.map((turn, idx) => {
                    const isAi = turn.speaker === "AI";

                    return (
                      <div key={idx} className={`flex items-start gap-3 text-xs ${isAi ? "pl-2" : "pr-2"}`}>
                        <div className={`h-7 w-7 rounded-xl flex items-center justify-center font-bold text-[10px] text-white shrink-0 mt-0.5 ${
                          isAi ? "bg-indigo-600" : "bg-slate-700"
                        }`}>
                          {isAi ? "AI" : "P"}
                        </div>

                        <div className="flex-1 p-3 rounded-2xl border bg-muted/20 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-[11px] text-foreground">
                              {isAi ? "Aria (AI Receptionist)" : activeCall.patient_name}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">{turn.timestamp}</span>
                          </div>
                          <p className="text-foreground leading-relaxed font-medium">{turn.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">Select a call log from the left roster to view transcript.</div>
          )}
        </div>

      </div>

    </div>
  );
}
