"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  BellRing, Calendar, Clock, PhoneCall, Bot, User, CheckCircle2, AlertCircle,
  Sparkles, Search, Filter, ShieldCheck, Stethoscope, ArrowUpRight, Plus, X,
  RefreshCw, FileText, ChevronRight, Activity, Zap, Play, Phone, ArrowRight
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface FollowUpRecord {
  id: string;
  patient_name: string;
  patient_phone: string;
  patient_avatar: string;
  doctor_name: string;
  initial_visit_date: string;
  interval_months: number; // e.g. 3 months
  due_date: string; // Target Follow-up date
  ai_call_trigger_date: string; // 1 week before due_date
  reason: string;
  status: "scheduled" | "ai_called_booked" | "ai_calling_today" | "human_escalation";
  booked_appointment_date?: string;
  ai_call_summary?: string;
}

const defaultFollowUps: FollowUpRecord[] = [
  {
    id: "fup-1",
    patient_name: "Jack Miller",
    patient_phone: "(555) 234-8901",
    patient_avatar: "J",
    doctor_name: "Dr. Sarah Jenkins, DDS",
    initial_visit_date: "2026-04-27",
    interval_months: 3,
    due_date: "2026-07-27",
    ai_call_trigger_date: "2026-07-20",
    reason: "3-Month Molar Restoration & Cavity Re-Evaluation",
    status: "ai_called_booked",
    booked_appointment_date: "Mon, Jul 27, 2026 • 10:00 AM",
    ai_call_summary: "AI called Jack on July 20 (1 week before 3-month due date). Jack accepted the Monday 10:00 AM slot with Dr. Jenkins. SMS text confirmation delivered."
  },
  {
    id: "fup-2",
    patient_name: "Emily Watson",
    patient_phone: "(555) 890-1234",
    patient_avatar: "E",
    doctor_name: "Dr. Michael Chen, MS",
    initial_visit_date: "2026-05-10",
    interval_months: 3,
    due_date: "2026-08-10",
    ai_call_trigger_date: "2026-08-03",
    reason: "3-Month Invisalign ClinCheck Tray Progress Review",
    status: "scheduled",
    ai_call_summary: "AI Outreach Call scheduled for August 3 (1 week prior to 3-month due date on August 10)."
  },
  {
    id: "fup-3",
    patient_name: "Sophia Martinez",
    patient_phone: "(555) 456-7890",
    patient_avatar: "S",
    doctor_name: "Dr. Elena Rostova, DND",
    initial_visit_date: "2026-01-26",
    interval_months: 6,
    due_date: "2026-07-26",
    ai_call_trigger_date: "2026-07-19",
    reason: "6-Month Pediatric Fluoride & Sealant Checkup",
    status: "ai_calling_today",
    ai_call_summary: "AI call queue active today for 6-month pediatric recall."
  },
  {
    id: "fup-4",
    patient_name: "Marcus Brody",
    patient_phone: "(555) 345-6789",
    patient_avatar: "M",
    doctor_name: "Dr. Alex Rivera, DMD",
    initial_visit_date: "2026-06-25",
    interval_months: 1,
    due_date: "2026-07-25",
    ai_call_trigger_date: "2026-07-18",
    reason: "1-Month Surgical Extraction Healing Check",
    status: "human_escalation",
    ai_call_summary: "AI called 1 week prior. Patient requested direct staff callback for prescription adjustment."
  }
];

export default function FollowUpsPage() {
  const [followups, setFollowups] = useState<FollowUpRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "booked" | "due_soon" | "escalation">("all");
  const [selectedFupId, setSelectedFupId] = useState<string>("fup-1");

  // Add Follow-up Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formPatientName, setFormPatientName] = useState("");
  const [formPatientPhone, setFormPatientPhone] = useState("");
  const [formDoctor, setFormDoctor] = useState("Dr. Sarah Jenkins, DDS");
  const [formIntervalMonths, setFormIntervalMonths] = useState(3);
  const [formReason, setFormReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Demo Toast Notice
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Load Followups
  const loadFollowups = async () => {
    setLoading(true);
    let localRecs: FollowUpRecord[] = [];
    try {
      const raw = localStorage.getItem("revflow_clinic_followups");
      if (raw) localRecs = JSON.parse(raw);
    } catch (e) {}

    try {
      const serverData = await fetchApi<any[]>("/followups");
      if (serverData && Array.isArray(serverData) && serverData.length > 0) {
        const map = new Map<string, FollowUpRecord>();
        serverData.forEach((f, idx) => {
          map.set(f.id || `fup-srv-${idx}`, {
            id: f.id || `fup-srv-${idx}`,
            patient_name: f.patient_name || "Patient",
            patient_phone: f.patient_phone || "(555) 000-0000",
            patient_avatar: (f.patient_name || "P").charAt(0),
            doctor_name: f.doctor_name || "Dr. Sarah Jenkins, DDS",
            initial_visit_date: f.initial_visit_date || "2026-04-27",
            interval_months: f.interval_months || 3,
            due_date: f.due_date || "2026-07-27",
            ai_call_trigger_date: f.ai_call_trigger_date || "2026-07-20",
            reason: f.reason || "3-Month Dental Checkup",
            status: f.status || "ai_called_booked",
            booked_appointment_date: f.booked_appointment_date || "Mon, Jul 27, 2026 • 10:00 AM",
            ai_call_summary: f.ai_call_summary || "AI call dispatched 1 week prior."
          });
        });
        localRecs.forEach(f => {
          if (!map.has(f.id)) map.set(f.id, f);
        });
        const merged = Array.from(map.values());
        setFollowups(merged);
        try {
          localStorage.setItem("revflow_clinic_followups", JSON.stringify(merged));
        } catch (e) {}
      } else if (localRecs.length > 0) {
        setFollowups(localRecs);
      } else {
        setFollowups(defaultFollowUps);
      }
    } catch (err) {
      console.log("Using local follow-ups repository");
      setFollowups(localRecs.length > 0 ? localRecs : defaultFollowUps);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowups();
  }, []);

  // Active Selected Follow-Up
  const activeFup = useMemo(() => {
    return followups.find(f => f.id === selectedFupId) || followups[0] || null;
  }, [followups, selectedFupId]);

  // Filtered Calculation
  const filteredFollowups = useMemo(() => {
    return followups.filter(f => {
      const matchesSearch =
        f.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.patient_phone.includes(searchTerm) ||
        f.reason.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (filterStatus === "booked") return f.status === "ai_called_booked";
      if (filterStatus === "due_soon") return f.status === "scheduled" || f.status === "ai_calling_today";
      if (filterStatus === "escalation") return f.status === "human_escalation";
      return true;
    });
  }, [followups, searchTerm, filterStatus]);

  // Save New Doctor-Assigned Follow-Up
  const handleCreateFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    const todayObj = new Date();
    const initialVisitDate = todayObj.toISOString().split("T")[0];

    // Compute due_date = today + interval_months
    const dueDateObj = new Date(todayObj);
    dueDateObj.setMonth(dueDateObj.getMonth() + formIntervalMonths);
    const dueDate = dueDateObj.toISOString().split("T")[0];

    // Compute ai_call_trigger_date = due_date minus 7 days (1 week prior)
    const triggerDateObj = new Date(dueDateObj);
    triggerDateObj.setDate(triggerDateObj.getDate() - 7);
    const aiCallTriggerDate = triggerDateObj.toISOString().split("T")[0];

    const newFup: FollowUpRecord = {
      id: `fup-${Date.now()}`,
      patient_name: formPatientName.trim() || "Jack Miller",
      patient_phone: formPatientPhone.trim() || "(555) 234-8901",
      patient_avatar: (formPatientName || "J").charAt(0).toUpperCase(),
      doctor_name: formDoctor,
      initial_visit_date: initialVisitDate,
      interval_months: formIntervalMonths,
      due_date: dueDate,
      ai_call_trigger_date: aiCallTriggerDate,
      reason: formReason.trim() || `${formIntervalMonths}-Month Routine Dental Checkup`,
      status: "scheduled",
      ai_call_summary: `AI Outreach Call scheduled for ${aiCallTriggerDate} (exactly 1 week prior to ${formIntervalMonths}-month due date on ${dueDate}).`
    };

    const updated = [newFup, ...followups];
    setFollowups(updated);
    setSelectedFupId(newFup.id);
    try {
      localStorage.setItem("revflow_clinic_followups", JSON.stringify(updated));
    } catch (e) {}

    try {
      await fetchApi("/followups", {
        method: "POST",
        body: JSON.stringify(newFup)
      });
    } catch (err) {}

    setIsSaving(false);
    setIsAddOpen(false);

    setToastNotice(`✨ Assigned ${formIntervalMonths}-Month Follow-Up for ${newFup.patient_name}! AI call set for 1 week prior (${aiCallTriggerDate}).`);
    setTimeout(() => setToastNotice(null), 4500);

    // Reset Form
    setFormPatientName("");
    setFormPatientPhone("");
    setFormReason("");
  };

  // Trigger AI Outreach Call Now (Demo Simulator)
  const handleTriggerAiCallNow = (fupId: string) => {
    const updated = followups.map(f => {
      if (f.id === fupId) {
        return {
          ...f,
          status: "ai_called_booked" as const,
          booked_appointment_date: `Mon, Jul 27, 2026 • 10:00 AM`,
          ai_call_summary: `AI voice call dispatched 1 week prior. Patient accepted Monday 10:00 AM slot with ${f.doctor_name}. Confirmed via SMS text.`
        };
      }
      return f;
    });

    setFollowups(updated);
    try {
      localStorage.setItem("revflow_clinic_followups", JSON.stringify(updated));
    } catch (e) {}

    setToastNotice(`📞 AI Call Placed! Patient accepted and appointment was booked to calendar!`);
    setTimeout(() => setToastNotice(null), 4000);
  };

  // Metrics
  const totalAssignedCount = followups.length;
  const totalBookedCount = followups.filter(f => f.status === "ai_called_booked").length;
  const conversionRate = totalAssignedCount > 0 ? Math.round((totalBookedCount / totalAssignedCount) * 100) : 80;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Toast Notice */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-indigo-500/40 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <Sparkles className="h-5 w-5 text-emerald-400 fill-emerald-400" />
          <span className="text-xs font-bold">{toastNotice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Automated 1-Week Pre-Outreach AI Engine Active
            </span>
            <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              {conversionRate}% Re-Booking Rate
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-white">
            <BellRing className="h-8 w-8 text-indigo-400" />
            3-Month Doctor Recall & AI Follow-Up Engine
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            When doctors assign 3-month or 6-month follow-ups, RevFlow AI automatically calls patients <strong>1 week before the due date</strong> to book return appointments.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-5 py-2.5 shadow-lg shadow-indigo-600/30 flex items-center gap-2 font-medium transition-all active:scale-95 text-xs"
          >
            <Plus className="h-4 w-4" />
            Assign Doctor Follow-up
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned Recalls</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Stethoscope className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">{totalAssignedCount} Follow-ups</div>
            <div className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">
              <span>Assigned by clinic doctors</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Re-Booked via AI</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">{totalBookedCount} Booked</div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>{conversionRate}% Re-Booking Rate</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Call Trigger Offset</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">1 Week Prior</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>Automatic outreach offset</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Retained Revenue</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">${(totalBookedCount * 450).toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-300 font-medium mt-1">
              <span>Patient lifetime value saved</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main 2-Column Application Shell */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[680px] rounded-3xl border bg-background shadow-xl overflow-hidden">
        
        {/* LEFT COLUMN: Follow-Up Roster (5 Cols) */}
        <div className="lg:col-span-5 border-r flex flex-col bg-muted/10">
          
          {/* Toolbar & Search */}
          <div className="p-4 border-b space-y-3 bg-muted/20">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <BellRing className="h-4 w-4 text-indigo-500" />
                Assigned Follow-ups
              </h3>
              <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-500/20">
                {filteredFollowups.length} Records
              </span>
            </div>

            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search patient, phone, doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-muted/50 p-1 rounded-full border text-[11px] font-medium justify-between overflow-x-auto">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-3 py-0.5 rounded-full transition-all ${
                  filterStatus === "all" ? "bg-indigo-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus("booked")}
                className={`px-3 py-0.5 rounded-full transition-all ${
                  filterStatus === "booked" ? "bg-indigo-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                AI Re-Booked
              </button>
              <button
                onClick={() => setFilterStatus("due_soon")}
                className={`px-3 py-0.5 rounded-full transition-all ${
                  filterStatus === "due_soon" ? "bg-indigo-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Upcoming Call
              </button>
            </div>
          </div>

          {/* Roster List */}
          <div className="flex-1 overflow-y-auto divide-y [scrollbar-width:thin]">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-500 mb-2" />
                Loading follow-ups...
              </div>
            ) : filteredFollowups.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-xs">
                No follow-ups found matching your search.
              </div>
            ) : (
              filteredFollowups.map(fup => {
                const isSelected = fup.id === activeFup?.id;

                return (
                  <div
                    key={fup.id}
                    onClick={() => setSelectedFupId(fup.id)}
                    className={`p-4 cursor-pointer transition-all flex items-start gap-3 relative ${
                      isSelected
                        ? "bg-indigo-600/10 border-l-4 border-indigo-600"
                        : "bg-muted/10 hover:bg-muted/30"
                    }`}
                  >
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0">
                      {fup.patient_avatar}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs truncate text-foreground">{fup.patient_name}</span>
                        <span className="text-[10px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-500/20">
                          {fup.interval_months} Months
                        </span>
                      </div>

                      <p className="text-[11px] text-muted-foreground truncate mt-0.5 font-medium">
                        {fup.reason}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        {fup.status === "ai_called_booked" ? (
                          <span className="text-[9px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> AI Called & Booked
                          </span>
                        ) : fup.status === "ai_calling_today" ? (
                          <span className="text-[9px] font-extrabold bg-blue-500/15 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-500/30 flex items-center gap-1 animate-pulse">
                            <PhoneCall className="h-3 w-3 text-blue-500" /> AI Calling Today
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-amber-500" /> Call Due: {fup.ai_call_trigger_date}
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

        {/* RIGHT COLUMN: Follow-Up Timeline & AI Outreach Engine (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col h-full bg-background overflow-hidden">
          {activeFup ? (
            <div className="flex flex-col h-full overflow-y-auto [scrollbar-width:thin] p-6 space-y-6">
              
              {/* Header Info */}
              <div className="border-b pb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-base shadow-md">
                      {activeFup.patient_avatar}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-foreground">{activeFup.patient_name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{activeFup.patient_phone}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20">
                      {activeFup.interval_months}-Month Follow-Up
                    </span>
                    <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                      Target Due Date: {activeFup.due_date}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-muted/20 border text-xs flex items-center gap-2 text-foreground font-semibold">
                  <Stethoscope className="h-4 w-4 text-indigo-500" />
                  <span>Assigned by {activeFup.doctor_name}: "{activeFup.reason}"</span>
                </div>
              </div>

              {/* 1-Week Pre-Outreach Automated Timeline */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-indigo-500" /> 1-Week Pre-Outreach AI Execution Timeline
                </h4>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900/10 via-purple-900/10 to-slate-900/10 border border-indigo-500/20 space-y-4 text-xs">
                  
                  {/* Step 1: Initial Visit */}
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-foreground">Initial Clinic Visit</div>
                      <div className="text-[11px] text-muted-foreground">Doctor assigned {activeFup.interval_months}-month follow-up on {activeFup.initial_visit_date}</div>
                    </div>
                  </div>

                  {/* Step 2: 1-Week Trigger Date */}
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-amber-600 dark:text-amber-400">AI Call Trigger Date (1 Week Prior)</div>
                      <div className="text-[11px] text-muted-foreground font-mono">Scheduled AI Outreach: {activeFup.ai_call_trigger_date}</div>
                    </div>
                  </div>

                  {/* Step 3: Target Due Date */}
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">Target Follow-Up Due Date</div>
                      <div className="text-[11px] text-muted-foreground font-mono">Recalled Due Date: {activeFup.due_date}</div>
                    </div>
                  </div>

                </div>
              </div>

              {/* AI Call Result & Summary Box */}
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-2">
                <div className="font-bold text-indigo-600 dark:text-indigo-300 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                  <Sparkles className="h-4 w-4 text-indigo-500" /> AI Outreach Call Summary & Booking
                </div>
                <p className="text-foreground leading-relaxed text-xs italic bg-background/60 p-3.5 rounded-xl border border-indigo-500/20">
                  "{activeFup.ai_call_summary}"
                </p>

                {activeFup.booked_appointment_date && (
                  <div className="pt-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Re-Booked Calendar Slot: {activeFup.booked_appointment_date}</span>
                  </div>
                )}
              </div>

              {/* Quick Action Simulator */}
              <div className="pt-2 border-t flex items-center justify-between">
                <Button
                  onClick={() => handleTriggerAiCallNow(activeFup.id)}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs px-5 flex items-center gap-2"
                >
                  <Play className="h-3.5 w-3.5" /> Trigger AI Outreach Call Now
                </Button>

                <Button
                  onClick={() => {
                    window.location.href = `/calendar`;
                  }}
                  variant="outline"
                  size="sm"
                  className="rounded-2xl text-xs"
                >
                  <Calendar className="h-3.5 w-3.5 mr-1" /> View Master Calendar
                </Button>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">Select a follow-up record from the left roster.</div>
          )}
        </div>

      </div>

      {/* MODAL: Assign Doctor Follow-Up */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateFollowup}
            className="bg-background border rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-indigo-500" />
                Assign Doctor Patient Follow-up
              </h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Patient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jack Miller"
                  value={formPatientName}
                  onChange={(e) => setFormPatientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. (555) 234-8901"
                  value={formPatientPhone}
                  onChange={(e) => setFormPatientPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 font-mono rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Attending Doctor</label>
                <select
                  value={formDoctor}
                  onChange={(e) => setFormDoctor(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                >
                  <option value="Dr. Sarah Jenkins, DDS">Dr. Sarah Jenkins, DDS</option>
                  <option value="Dr. Alex Rivera, DMD">Dr. Alex Rivera, DMD</option>
                  <option value="Dr. Michael Chen, MS">Dr. Michael Chen, MS</option>
                  <option value="Dr. Elena Rostova, DND">Dr. Elena Rostova, DND</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Follow-Up Interval</label>
                <select
                  value={formIntervalMonths}
                  onChange={(e) => setFormIntervalMonths(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-indigo-600"
                >
                  <option value={1}>1 Month Follow-Up</option>
                  <option value={3}>3 Months Follow-Up (Standard Checkup)</option>
                  <option value={6}>6 Months Follow-Up (Hygiene Exam)</option>
                </select>
                <p className="text-[10px] text-muted-foreground italic">
                  AI will automatically place an outgoing phone call <strong>1 week before</strong> the due date to book their appointment.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Reason / Clinical Note</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Molar Restoration & Cavity Re-Evaluation"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="rounded-full text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs px-5 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <BellRing className="h-3.5 w-3.5" />
                    Assign Recall
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
