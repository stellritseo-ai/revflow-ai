"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Users, Search, User, Phone, Mail, Calendar, FileText, ChevronRight, Plus, Loader2,
  Sparkles, Filter, CheckCircle2, ShieldCheck, HeartPulse, PhoneCall, ArrowUpRight,
  Printer, X, RefreshCw, Eye, Edit, Stethoscope, Clock, Activity, MessageSquare
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { BookingModal } from "@/components/booking-modal";

interface Patient {
  id?: string;
  phone: string;
  name: string;
  email: string | null;
  total_calls: number;
  total_bookings: number;
  last_interaction: string | null;
  ai_notes: string | null;
  mrn?: string;
  status?: "active" | "vip" | "lead" | "inactive";
  preferred_doctor?: string;
}

const mockPatients: Patient[] = [
  {
    id: "p-1",
    name: "Jack Miller",
    phone: "(555) 234-8901",
    email: "jack.miller@example.com",
    total_calls: 5,
    total_bookings: 3,
    last_interaction: "2026-07-24T10:30:00.000Z",
    ai_notes: "Intent: Emergency Dental Toothache • Patient expressed sharp pain in lower molar. AI booked priority appointment with Dr. Sarah Jenkins.",
    mrn: "MRN-89012",
    status: "vip",
    preferred_doctor: "Dr. Sarah Jenkins, DDS"
  },
  {
    id: "p-2",
    name: "Emily Watson",
    phone: "(555) 890-1234",
    email: "emily.w@example.com",
    total_calls: 3,
    total_bookings: 2,
    last_interaction: "2026-07-20T11:15:00.000Z",
    ai_notes: "Intent: Invisalign Alignment Check • Patient inquired about tray #14 tracking. AI confirmed appointment.",
    mrn: "MRN-12345",
    status: "active",
    preferred_doctor: "Dr. Michael Chen, MS"
  },
  {
    id: "p-3",
    name: "Sophia Martinez",
    phone: "(555) 456-7890",
    email: "sophia.m@example.com",
    total_calls: 2,
    total_bookings: 1,
    last_interaction: "2026-07-18T09:00:00.000Z",
    ai_notes: "Intent: Pediatric Fluoride Treatment • Patient scheduled checkup for daughter. Requested morning slot.",
    mrn: "MRN-78901",
    status: "active",
    preferred_doctor: "Dr. Elena Rostova, DND"
  },
  {
    id: "p-4",
    name: "Robert Vance",
    phone: "(555) 678-9012",
    email: "robert.vance@example.com",
    total_calls: 1,
    total_bookings: 1,
    last_interaction: "2026-07-15T15:45:00.000Z",
    ai_notes: "Intent: Crown Replacement Cost Quote • Patient called regarding insurance coverage for Zirconia crown.",
    mrn: "MRN-90123",
    status: "lead",
    preferred_doctor: "Dr. Alex Rivera, DMD"
  }
];

export default function PatientsDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<"all" | "active" | "vip" | "lead">("all");
  
  // Selected Patient Modal
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  // Create Patient Modal
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [newPatientEmail, setNewPatientEmail] = useState("");
  const [newPatientDoctor, setNewPatientDoctor] = useState("Dr. Sarah Jenkins, DDS");
  const [newPatientNotes, setNewPatientNotes] = useState("");
  const [isSavingPatient, setIsSavingPatient] = useState(false);

  // Booking modal launcher
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const loadPatients = async () => {
    setLoading(true);
    let localCache: Patient[] = [];
    try {
      const raw = localStorage.getItem("revflow_patients_list");
      if (raw) localCache = JSON.parse(raw);
    } catch (e) {}

    try {
      const serverData = await fetchApi<Patient[]>("/patients");
      if (serverData && Array.isArray(serverData) && serverData.length > 0) {
        const map = new Map<string, Patient>();
        serverData.forEach(p => map.set(p.phone, p));
        localCache.forEach(p => {
          if (!map.has(p.phone)) map.set(p.phone, p);
        });
        const merged = Array.from(map.values());
        setPatients(merged);
        try {
          localStorage.setItem("revflow_patients_list", JSON.stringify(merged));
        } catch (e) {}
      } else if (localCache.length > 0) {
        setPatients(localCache);
      } else {
        setPatients(mockPatients);
      }
    } catch (err) {
      console.log("Using local patients repository");
      setPatients(localCache.length > 0 ? localCache : mockPatients);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  // Filtered patients calculation
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone.includes(searchTerm) ||
        (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterCategory === "vip") return p.status === "vip" || p.total_bookings >= 3;
      if (filterCategory === "lead") return p.status === "lead" || p.total_bookings === 0;
      if (filterCategory === "active") return p.total_bookings > 0;
      return true;
    });
  }, [patients, searchTerm, filterCategory]);

  // Create Patient Handler
  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingPatient) return;
    setIsSavingPatient(true);

    const newP: Patient = {
      id: `p-${Date.now()}`,
      name: newPatientName.trim() || "New Patient",
      phone: newPatientPhone.trim() || "(555) 000-0000",
      email: newPatientEmail.trim() || null,
      total_calls: 1,
      total_bookings: 1,
      last_interaction: new Date().toISOString(),
      ai_notes: newPatientNotes.trim() || "Patient registered via Clinic CRM portal.",
      mrn: `MRN-${Math.floor(10000 + Math.random() * 90000)}`,
      status: "active",
      preferred_doctor: newPatientDoctor
    };

    const updated = [newP, ...patients];
    setPatients(updated);
    try {
      localStorage.setItem("revflow_patients_list", JSON.stringify(updated));
    } catch (e) {}

    try {
      await fetchApi("/patients", {
        method: "POST",
        body: JSON.stringify(newP)
      });
    } catch (err) {}

    setIsSavingPatient(false);
    setIsAddPatientOpen(false);
    
    // Reset Form
    setNewPatientName("");
    setNewPatientPhone("");
    setNewPatientEmail("");
    setNewPatientNotes("");
  };

  // Metrics
  const totalPatientsCount = patients.length;
  const totalCallsCount = patients.reduce((sum, p) => sum + (p.total_calls || 0), 0);
  const totalBookingsCount = patients.reduce((sum, p) => sum + (p.total_bookings || 0), 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
              AI Voice & PMS Patient Directory CRM
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-white">
            <Users className="h-8 w-8 text-indigo-400" />
            Patient Directory & CRM Hub
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Centralized patient profiles automatically updated by AI voice interactions, phone calls, and PMS appointment scheduling.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Button
            onClick={() => setIsAddPatientOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-5 py-2.5 shadow-lg shadow-indigo-600/30 flex items-center gap-2 font-medium transition-all active:scale-95 text-xs"
          >
            <Plus className="h-4 w-4" />
            Add New Patient
          </Button>

          <Button
            onClick={() => window.print()}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl px-4 py-2.5 backdrop-blur-md flex items-center gap-2 font-medium transition-all active:scale-95 text-xs"
          >
            <Printer className="h-4 w-4" />
            Export Directory
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Patients</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">{totalPatientsCount} Patients</div>
            <div className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">
              <span>Active clinic CRM roster</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Voice Interactions</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <PhoneCall className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">{totalCallsCount} Calls Logged</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>Handled by AI Receptionist</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Confirmed Bookings</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">{totalBookingsCount} Bookings</div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              <span>Active appointments</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Patient Retention</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <HeartPulse className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">96.4%</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>High recall & satisfaction</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Table Container */}
      <div className="rounded-3xl border bg-background shadow-sm overflow-hidden flex flex-col">
        
        {/* Toolbar & Filter Tabs */}
        <div className="p-4 border-b flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/20">
          
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, phone, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border rounded-2xl pl-10 pr-4 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 font-medium"
            />
          </div>

          {/* Filter Categories */}
          <div className="flex items-center bg-muted/50 p-1 rounded-full border text-xs font-medium w-full md:w-auto justify-between">
            <button
              onClick={() => setFilterCategory("all")}
              className={`px-3.5 py-1 rounded-full transition-all ${
                filterCategory === "all" ? "bg-indigo-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Patients ({patients.length})
            </button>

            <button
              onClick={() => setFilterCategory("active")}
              className={`px-3.5 py-1 rounded-full transition-all ${
                filterCategory === "active" ? "bg-indigo-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Active Visits
            </button>

            <button
              onClick={() => setFilterCategory("vip")}
              className={`px-3.5 py-1 rounded-full transition-all ${
                filterCategory === "vip" ? "bg-indigo-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              VIP / Frequent
            </button>

            <button
              onClick={() => setFilterCategory("lead")}
              className={`px-3.5 py-1 rounded-full transition-all ${
                filterCategory === "lead" ? "bg-indigo-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Leads
            </button>
          </div>

        </div>

        {/* Patients Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b text-muted-foreground uppercase tracking-wider text-[10px] font-bold sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-3.5">Patient Info & MRN</th>
                <th className="px-6 py-3.5">Engagement Stats</th>
                <th className="px-6 py-3.5">Last Interaction</th>
                <th className="px-6 py-3.5">AI Receptionist Insight</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={5} className="h-48 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-500" />
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-48 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    No patients found matching your search.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient, idx) => (
                  <tr
                    key={patient.phone + idx}
                    onClick={() => setSelectedPatient(patient)}
                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                  >
                    
                    {/* Patient Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center shrink-0 shadow-sm text-sm">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-foreground text-sm">
                              {patient.name}
                            </p>
                            {patient.status === "vip" && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                                VIP
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1 font-mono"><Phone className="h-3 w-3 text-indigo-500" />{patient.phone}</span>
                            {patient.email && (
                              <span className="hidden sm:flex items-center gap-1"><Mail className="h-3 w-3" />{patient.email}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Engagement */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300 font-bold border border-blue-500/20">
                          <PhoneCall className="h-3 w-3" />
                          <span>{patient.total_calls} Calls</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-bold border border-emerald-500/20">
                          <Calendar className="h-3 w-3" />
                          <span>{patient.total_bookings} Visits</span>
                        </div>
                      </div>
                    </td>

                    {/* Last Interaction */}
                    <td className="px-6 py-4 text-muted-foreground">
                      {patient.last_interaction ? (
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-indigo-500" />
                          <span className="font-medium text-foreground">
                            {new Date(
                              patient.last_interaction.endsWith("Z") || patient.last_interaction.includes("+")
                                ? patient.last_interaction
                                : patient.last_interaction + "Z"
                            ).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* Latest AI Insight */}
                    <td className="px-6 py-4">
                      {patient.ai_notes ? (
                        <div className="text-xs text-muted-foreground line-clamp-2 max-w-xs flex gap-2 bg-indigo-500/5 p-2 rounded-xl border border-indigo-500/10">
                          <Sparkles className="h-4 w-4 shrink-0 text-indigo-500" />
                          <span title={patient.ai_notes} className="text-[11px] leading-relaxed">
                            {patient.ai_notes}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No AI notes</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <Button
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setSelectedPatient(patient);
                        }}
                        variant="ghost" size="sm" className="rounded-full text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 font-bold text-xs"
                      >
                        View Profile <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Patient Profile & CRM Details */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                  {selectedPatient.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">{selectedPatient.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{selectedPatient.mrn || "MRN-Active"}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Info Grid */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground font-medium">Phone Number:</span>
                <span className="font-mono font-bold text-foreground">{selectedPatient.phone}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground font-medium">Email Address:</span>
                <span className="font-semibold text-foreground">{selectedPatient.email || "Not provided"}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground font-medium">Preferred Provider:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {selectedPatient.preferred_doctor || "Dr. Sarah Jenkins, DDS"}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground font-medium">Total Calls & Visits:</span>
                <span className="font-bold text-foreground">
                  {selectedPatient.total_calls} Calls • {selectedPatient.total_bookings} Bookings
                </span>
              </div>
            </div>

            {/* AI Call Summary Box */}
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-2">
              <div className="font-bold text-indigo-600 dark:text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /> AI Voice Call Notes & Intent
              </div>
              <p className="text-foreground leading-relaxed text-[11px] bg-background/60 p-3 rounded-xl border border-indigo-500/20 italic">
                "{selectedPatient.ai_notes || "Patient consulted AI receptionist regarding routine checkup."}"
              </p>
            </div>

            {/* Actions Footer */}
            <div className="pt-2 flex items-center justify-between border-t gap-2">
              <Button
                onClick={() => {
                  window.location.href = `/records`;
                }}
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
              >
                <FileText className="h-3.5 w-3.5 mr-1" /> View Medical Chart
              </Button>

              <Button
                onClick={() => {
                  setSelectedPatient(null);
                  setIsBookingOpen(true);
                }}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs px-4"
              >
                <Calendar className="h-3.5 w-3.5 mr-1" /> Book Appointment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add New Patient */}
      {isAddPatientOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePatient}
            className="bg-background border rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <User className="h-5 w-5 text-indigo-500" />
                Register New Patient
              </h3>
              <button
                type="button"
                onClick={() => setIsAddPatientOpen(false)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jack Miller"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. (555) 234-8901"
                  value={newPatientPhone}
                  onChange={(e) => setNewPatientPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 font-mono rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. jack@example.com"
                  value={newPatientEmail}
                  onChange={(e) => setNewPatientEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Preferred Doctor</label>
                <select
                  value={newPatientDoctor}
                  onChange={(e) => setNewPatientDoctor(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                >
                  <option value="Dr. Sarah Jenkins, DDS">Dr. Sarah Jenkins, DDS</option>
                  <option value="Dr. Alex Rivera, DMD">Dr. Alex Rivera, DMD</option>
                  <option value="Dr. Michael Chen, MS">Dr. Michael Chen, MS</option>
                  <option value="Dr. Elena Rostova, DND">Dr. Elena Rostova, DND</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Initial Notes / Chief Concern</label>
                <textarea
                  rows={2}
                  placeholder="Enter initial patient notes..."
                  value={newPatientNotes}
                  onChange={(e) => setNewPatientNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddPatientOpen(false)}
                className="rounded-full text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingPatient}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs px-5 flex items-center gap-2"
              >
                {isSavingPatient ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <User className="h-3.5 w-3.5" />
                    Register Patient
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={() => loadPatients()}
      />

    </div>
  );
}
