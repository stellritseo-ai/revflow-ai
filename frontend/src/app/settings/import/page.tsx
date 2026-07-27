"use client";

import React, { useState } from "react";
import {
  UploadCloud, FileSpreadsheet, Bot, PhoneCall, CheckCircle2, Play,
  Sparkles, Download, Users, RefreshCw, AlertCircle, Calendar, Phone,
  Mail, Stethoscope, Search, ShieldCheck, ArrowRight, Zap, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImportedPatient {
  id: string;
  name: string;
  phone: string;
  email: string;
  last_visit: string;
  recommended_treatment: string;
  assigned_doctor: string;
  ai_status: "pending_call" | "ai_calling" | "booked" | "failed";
  booked_slot?: string;
}

const defaultImportedPatients: ImportedPatient[] = [
  {
    id: "imp-1",
    name: "Jack Miller",
    phone: "(555) 234-8901",
    email: "jack.miller@example.com",
    last_visit: "6 months ago (Jan 2026)",
    recommended_treatment: "6-Month Hygiene Exam & Cleaning",
    assigned_doctor: "Dr. Sarah Jenkins, DDS",
    ai_status: "booked",
    booked_slot: "Mon, Jul 27 @ 10:00 AM"
  },
  {
    id: "imp-2",
    name: "Emily Watson",
    phone: "(555) 890-1234",
    email: "emily.w@example.com",
    last_visit: "8 months ago (Nov 2025)",
    recommended_treatment: "Invisalign Aligner Checkup",
    assigned_doctor: "Dr. Michael Chen, MS",
    ai_status: "booked",
    booked_slot: "Tue, Jul 28 @ 02:00 PM"
  },
  {
    id: "imp-3",
    name: "Marcus Brody",
    phone: "(555) 345-6789",
    email: "marcus.b@example.com",
    last_visit: "4 months ago (Mar 2026)",
    recommended_treatment: "Crown Restoration Follow-Up",
    assigned_doctor: "Dr. Alex Rivera, DMD",
    ai_status: "pending_call"
  },
  {
    id: "imp-4",
    name: "Sarah Connor",
    phone: "(555) 901-2345",
    email: "sarah.c@example.com",
    last_visit: "7 months ago (Dec 2025)",
    recommended_treatment: "Overdue Prophylaxis",
    assigned_doctor: "Dr. Sarah Jenkins, DDS",
    ai_status: "pending_call"
  },
  {
    id: "imp-5",
    name: "David Miller",
    phone: "(555) 678-1234",
    email: "david.m@example.com",
    last_visit: "9 months ago (Oct 2025)",
    recommended_treatment: "Composite Filling Evaluation",
    assigned_doctor: "Dr. Elena Rostova, DND",
    ai_status: "pending_call"
  }
];

export default function PatientImportPage() {
  const [patients, setPatients] = useState<ImportedPatient[]>(defaultImportedPatients);
  const [campaignName, setCampaignName] = useState("6-Month Overdue Hygiene Recall Campaign");
  const [channel, setChannel] = useState<"voice" | "sms" | "both">("voice");
  const [isCampaignRunning, setIsCampaignRunning] = useState(false);
  const [campaignProgressLog, setCampaignProgressLog] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // File Upload Demo Simulation
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const handleFileUploadSim = (fileName: string) => {
    setUploadedFileName(fileName);
    setToastNotice(`📄 Successfully parsed existing patient list from ${fileName}! (5 Records Loaded)`);
    setTimeout(() => setToastNotice(null), 4000);
  };

  // Launch AI Outbound Calling Campaign
  const handleLaunchCampaign = () => {
    if (isCampaignRunning) return;
    setIsCampaignRunning(true);
    setCampaignProgressLog(["🤖 Initializing RevFlow AI Outbound Telephony Campaign Engine..."]);

    const pendingList = patients.filter(p => p.ai_status === "pending_call");
    if (pendingList.length === 0) {
      setCampaignProgressLog(prev => [...prev, "All imported patients have already been called and booked!"]);
      setIsCampaignRunning(false);
      return;
    }

    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx >= pendingList.length) {
        clearInterval(interval);
        setIsCampaignRunning(false);
        setCampaignProgressLog(prev => [...prev, "🎉 Campaign Completed! All target patients contacted and booked."]);
        setToastNotice("🎉 AI Outbound Call Campaign Completed Successfully!");
        setTimeout(() => setToastNotice(null), 4000);
        return;
      }

      const p = pendingList[currentIdx];
      const timeSlot = `Mon, Jul 27 @ ${10 + currentIdx}:00 AM`;

      setCampaignProgressLog(prev => [
        ...prev,
        `📞 AI Calling ${p.name} at ${p.phone}... Connected! AI verified interest & reserved ${timeSlot}.`
      ]);

      setPatients(prev => prev.map(item => item.id === p.id ? {
        ...item,
        ai_status: "booked" as const,
        booked_slot: timeSlot
      } : item));

      currentIdx++;
    }, 1500);
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm) ||
    p.recommended_treatment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const bookedCount = patients.filter(p => p.ai_status === "booked").length;
  const pendingCount = patients.filter(p => p.ai_status === "pending_call").length;

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              Existing Patient Feed & AI Outbound Calling Engine
            </span>
            <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              {bookedCount} / {patients.length} Booked by AI
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-white">
            <FileSpreadsheet className="h-8 w-8 text-indigo-400" />
            Bulk Patient Feed & AI Campaign Caller
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Feed existing clinic client data into RevFlow via CSV/Excel or PMS sync. RevFlow AI automatically calls patients to book appointment slots.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 relative z-10">
          <Button
            onClick={handleLaunchCampaign}
            disabled={isCampaignRunning || pendingCount === 0}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-5 py-2.5 shadow-lg shadow-indigo-600/30 flex items-center gap-2 font-medium transition-all active:scale-95 text-xs"
          >
            {isCampaignRunning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-amber-300" />
                AI Campaign Calling Live...
              </>
            ) : (
              <>
                <PhoneCall className="h-4 w-4 text-emerald-300" />
                Launch AI Outbound Campaign ({pendingCount} Left)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* SECTION 1: CSV Drag & Drop Upload + Sample Template */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Upload Box */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFileUploadSim("existing_patients_july2026.csv"); }}
          className={`md:col-span-2 p-8 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center space-y-3 ${
            isDragOver
              ? "border-indigo-500 bg-indigo-500/10"
              : "border-border bg-card hover:bg-muted/10"
          }`}
        >
          <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
            <UploadCloud className="h-7 w-7" />
          </div>

          <div>
            <h3 className="font-extrabold text-sm text-foreground">
              {uploadedFileName ? `Loaded: ${uploadedFileName}` : "Drag & Drop Existing Patient CSV / Excel File"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              Feed existing clinic client records (Name, Phone, Email, Recommended Recall Treatment, Attending Doctor).
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={() => handleFileUploadSim("existing_patients_july2026.csv")}
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
            >
              Browse Files (.CSV, .XLSX)
            </Button>
          </div>
        </div>

        {/* PMS Integration Feed Card */}
        <div className="p-6 rounded-3xl border bg-card shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <h3 className="font-bold text-sm text-foreground">PMS Auto-Sync Feed</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Direct API sync with Dentrix, Open Dental, or Eaglesoft to auto-pull overdue patient lists.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-600 dark:text-indigo-300 space-y-1">
            <div>Connected: Open Dental API</div>
            <div className="text-[10px] text-muted-foreground font-mono">Last Auto-Sync: 10 mins ago</div>
          </div>

          <Button
            onClick={() => {
              setToastNotice("🔄 Synced 12 additional overdue records from Open Dental!");
              setTimeout(() => setToastNotice(null), 4000);
            }}
            variant="outline"
            size="sm"
            className="w-full rounded-xl text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-2 text-indigo-500" /> Sync PMS Database Now
          </Button>
        </div>

      </div>

      {/* SECTION 2: AI Campaign Configuration Banner */}
      <div className="p-6 rounded-3xl border bg-card shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-extrabold text-sm flex items-center gap-2 text-foreground">
            <Bot className="h-4 w-4 text-indigo-500" />
            Outbound AI Voice Campaign Settings
          </h3>
          <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            Aria Outbound Voice Engine Ready
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-muted-foreground">Campaign Name</label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-muted-foreground">Outbound Outreach Channel</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as any)}
              className="w-full px-3.5 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
            >
              <option value="voice">AI Voice Outbound Phone Call (Recommended)</option>
              <option value="sms">AI SMS Text Message Campaign</option>
              <option value="both">Multi-Channel (Voice Call + SMS Backup)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaign Progress Console Log */}
      {campaignProgressLog.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 border border-slate-800 space-y-2 text-xs font-mono">
          <div className="font-bold text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-2">
            <PhoneCall className="h-4 w-4 text-emerald-400 animate-pulse" />
            AI Outbound Telephony Campaign Console
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto [scrollbar-width:thin]">
            {campaignProgressLog.map((log, idx) => (
              <div key={idx} className="text-emerald-300">
                &gt; {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: Imported Patient Data Roster Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 text-indigo-500" />
              Imported Existing Patient Feed ({filteredPatients.length} Records)
            </h3>
            <p className="text-xs text-muted-foreground">
              List of existing clinic clients fed into the system ready for AI call booking.
            </p>
          </div>

          <div className="relative w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search imported list..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="border rounded-3xl bg-card shadow-md overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Patient Name</th>
                <th className="px-5 py-3.5">Phone & Email</th>
                <th className="px-5 py-3.5">Last Visit</th>
                <th className="px-5 py-3.5">Recall Treatment</th>
                <th className="px-5 py-3.5">Attending Doctor</th>
                <th className="px-5 py-3.5 text-right">AI Outbound Call Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPatients.map(p => (
                <tr key={p.id} className="hover:bg-muted/20 transition-all">
                  <td className="px-5 py-4 font-bold text-foreground flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                      {p.name.charAt(0)}
                    </div>
                    <span>{p.name}</span>
                  </td>

                  <td className="px-5 py-4 font-mono text-muted-foreground">
                    <div>{p.phone}</div>
                    <div className="text-[10px] opacity-75">{p.email}</div>
                  </td>

                  <td className="px-5 py-4 text-muted-foreground font-medium">
                    {p.last_visit}
                  </td>

                  <td className="px-5 py-4 font-semibold text-indigo-600 dark:text-indigo-400">
                    {p.recommended_treatment}
                  </td>

                  <td className="px-5 py-4 text-foreground font-medium">
                    {p.assigned_doctor}
                  </td>

                  <td className="px-5 py-4 text-right font-bold">
                    {p.ai_status === "booked" ? (
                      <div className="inline-flex flex-col items-end">
                        <span className="text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" /> AI Booked Appointment
                        </span>
                        {p.booked_slot && (
                          <span className="text-[9px] font-mono text-muted-foreground mt-0.5">{p.booked_slot}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                        Pending AI Call
                      </span>
                    )}
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
