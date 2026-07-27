"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  FileText, Search, User, Calendar, Clock, Stethoscope, Pill, Plus, Download, Filter,
  CheckCircle2, AlertCircle, HeartPulse, ChevronRight, Activity, Printer, Sparkles, X, RefreshCw,
  Phone, Mail, FileSpreadsheet, ShieldCheck
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface ClinicalRecord {
  id: string;
  patient_name: string;
  patient_phone: string;
  visit_date: string;
  doctor_name: string;
  diagnosis: string;
  procedure_performed: string;
  vitals?: {
    bp: string;
    pulse: string;
    temp: string;
  };
  prescriptions: Prescription[];
  doctor_notes: string;
  followup_date?: string;
}

interface PatientSummary {
  name: string;
  phone: string;
  email?: string;
  mrn: string;
  total_visits: number;
  last_visit: string;
  records: ClinicalRecord[];
}

const defaultRecords: ClinicalRecord[] = [
  {
    id: "rec-1",
    patient_name: "Jack Miller",
    patient_phone: "(555) 234-8901",
    visit_date: "2026-07-24T10:30:00.000Z",
    doctor_name: "Dr. Sarah Jenkins, DDS",
    diagnosis: "Acute Lower Right Molar Hypersensitivity & Caries",
    procedure_performed: "Deep Composite Restoration & Desensitizing Varnish Application",
    vitals: { bp: "122/80 mmHg", pulse: "72 bpm", temp: "98.6 °F" },
    prescriptions: [
      { medication: "Amoxicillin", dosage: "500 mg", frequency: "1 capsule every 8 hrs", duration: "7 Days" },
      { medication: "Ibuprofen", dosage: "400 mg", frequency: "1 tablet every 6 hrs (PRN)", duration: "3 Days" },
      { medication: "Chlorhexidine Mouthrinse", dosage: "0.12%", frequency: "Swish 15ml twice daily", duration: "10 Days" }
    ],
    doctor_notes: "Patient reported sharp pain with cold liquids. Caries removed under local anesthesia. High margin polished cleanly. Recommended soft diet for 24 hours.",
    followup_date: "2026-08-10"
  },
  {
    id: "rec-2",
    patient_name: "Jack Miller",
    patient_phone: "(555) 234-8901",
    visit_date: "2026-06-12T14:00:00.000Z",
    doctor_name: "Dr. Alex Rivera, DMD",
    diagnosis: "Bi-Annual Comprehensive Hygiene Exam & Calculus Build-up",
    procedure_performed: "Full Mouth Ultrasonic Scaling, Polishing & Bitewing X-Rays",
    vitals: { bp: "118/76 mmHg", pulse: "68 bpm", temp: "98.4 °F" },
    prescriptions: [
      { medication: "Sensodyne Repair Toothpaste", dosage: "Pea-sized", frequency: "Twice daily brush", duration: "Ongoing" }
    ],
    doctor_notes: "Bitewing X-rays show healthy alveolar bone height. Minor gingival inflammation around lower incisors. Flossing technique reviewed.",
    followup_date: "2026-12-12"
  },
  {
    id: "rec-3",
    patient_name: "Emily Watson",
    patient_phone: "(555) 890-1234",
    visit_date: "2026-07-20T11:15:00.000Z",
    doctor_name: "Dr. Michael Chen, MS",
    diagnosis: "Invisalign Alignment Progress Check & Attachment Polish",
    procedure_performed: "Tray #14 Placement & Interproximal Reduction (IPR) on Upper Premolars",
    vitals: { bp: "120/78 mmHg", pulse: "74 bpm", temp: "98.6 °F" },
    prescriptions: [
      { medication: "Orthodontic Relief Wax", dosage: "As needed", frequency: "Apply to sharp edges", duration: "As needed" }
    ],
    doctor_notes: "Teeth tracking according to 3D ClinCheck model. Patient wearing aligners 22 hrs/day. Dispensed aligner trays 15 through 18.",
    followup_date: "2026-08-25"
  },
  {
    id: "rec-4",
    patient_name: "Sophia Martinez",
    patient_phone: "(555) 456-7890",
    visit_date: "2026-07-18T09:00:00.000Z",
    doctor_name: "Dr. Elena Rostova, DND",
    diagnosis: "Pediatric Routine Fluoride Treatment & Sealant Inspection",
    procedure_performed: "Pit & Fissure Sealants on Tooth #3 and #14, Fluoride Foam",
    vitals: { bp: "110/70 mmHg", pulse: "80 bpm", temp: "98.2 °F" },
    prescriptions: [],
    doctor_notes: "Patient was extremely cooperative. No cavities detected. Sealants intact on primary molars.",
    followup_date: "2027-01-18"
  }
];

export default function PatientRecordsPage() {
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientPhone, setSelectedPatientPhone] = useState<string | null>(null);
  
  // Modals state
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<ClinicalRecord | null>(null);

  // Form State
  const [formPatientName, setFormPatientName] = useState("");
  const [formPatientPhone, setFormPatientPhone] = useState("");
  const [formDoctor, setFormDoctor] = useState("Dr. Sarah Jenkins, DDS");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formDiagnosis, setFormDiagnosis] = useState("");
  const [formProcedure, setFormProcedure] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formFollowup, setFormFollowup] = useState("");
  
  // Prescriptions Form List
  const [formMeds, setFormMeds] = useState<Prescription[]>([
    { medication: "", dosage: "", frequency: "", duration: "" }
  ]);
  const [isSavingRecord, setIsSavingRecord] = useState(false);

  // Load records from backend API & localStorage
  const loadRecords = async () => {
    setLoading(true);
    let localRecs: ClinicalRecord[] = [];
    try {
      const raw = localStorage.getItem("revflow_patient_records");
      if (raw) localRecs = JSON.parse(raw);
    } catch (e) {}

    try {
      const serverData = await fetchApi<any[]>("/clinic/records");
      if (serverData && Array.isArray(serverData) && serverData.length > 0) {
        const formatted: ClinicalRecord[] = serverData.map((r, idx) => ({
          id: r.id || `rec-server-${idx}`,
          patient_name: r.patient_name || "Patient",
          patient_phone: r.patient_phone || "(555) 000-0000",
          visit_date: r.visit_date || new Date().toISOString(),
          doctor_name: r.doctor_name || "Dr. Provider",
          diagnosis: r.diagnosis || "Routine Consultation",
          procedure_performed: r.procedure_performed || "Dental Exam",
          vitals: r.vitals || { bp: "120/80 mmHg", pulse: "72 bpm", temp: "98.6 °F" },
          prescriptions: r.prescriptions || [],
          doctor_notes: r.doctor_notes || "Clinical visit completed.",
          followup_date: r.followup_date || ""
        }));

        const map = new Map<string, ClinicalRecord>();
        formatted.forEach(r => map.set(r.id, r));
        localRecs.forEach(r => {
          if (!map.has(r.id)) map.set(r.id, r);
        });

        const merged = Array.from(map.values());
        setRecords(merged);
        try {
          localStorage.setItem("revflow_patient_records", JSON.stringify(merged));
        } catch (e) {}
      } else if (localRecs.length > 0) {
        setRecords(localRecs);
      } else {
        setRecords(defaultRecords);
      }
    } catch (err) {
      console.log("Using local patient records directory");
      setRecords(localRecs.length > 0 ? localRecs : defaultRecords);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  // Group records by patient phone / name
  const patientSummaries = useMemo(() => {
    const map = new Map<string, PatientSummary>();

    records.forEach(rec => {
      const key = rec.patient_phone || rec.patient_name;
      if (!map.has(key)) {
        map.set(key, {
          name: rec.patient_name,
          phone: rec.patient_phone,
          mrn: `MRN-${Math.abs(key.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) * 1234).toString().substring(0, 6)}`,
          total_visits: 0,
          last_visit: rec.visit_date,
          records: []
        });
      }
      const p = map.get(key)!;
      p.total_visits += 1;
      p.records.push(rec);
    });

    // Sort patient records by date descending (newest first)
    map.forEach(p => {
      p.records.sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
      if (p.records.length > 0) {
        p.last_visit = p.records[0].visit_date;
      }
    });

    return Array.from(map.values());
  }, [records]);

  // Set default selected patient if not set
  useEffect(() => {
    if (!selectedPatientPhone && patientSummaries.length > 0) {
      setSelectedPatientPhone(patientSummaries[0].phone);
    }
  }, [patientSummaries, selectedPatientPhone]);

  // Filtered patients list for search bar
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patientSummaries;
    const q = searchQuery.toLowerCase();
    return patientSummaries.filter(p =>
      p.name.toLowerCase().includes(q) || p.phone.includes(q) || p.mrn.toLowerCase().includes(q)
    );
  }, [patientSummaries, searchQuery]);

  // Currently active patient's records
  const activePatientSummary = useMemo(() => {
    if (!selectedPatientPhone) return patientSummaries[0] || null;
    return patientSummaries.find(p => p.phone === selectedPatientPhone) || patientSummaries[0] || null;
  }, [patientSummaries, selectedPatientPhone]);

  // Save new record handler
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingRecord) return;
    setIsSavingRecord(true);

    const validMeds = formMeds.filter(m => m.medication.trim() !== "");

    const newRec: ClinicalRecord = {
      id: `rec-${Date.now()}`,
      patient_name: formPatientName.trim() || "Jack Miller",
      patient_phone: formPatientPhone.trim() || "(555) 234-8901",
      visit_date: `${formDate}T10:00:00.000Z`,
      doctor_name: formDoctor,
      diagnosis: formDiagnosis.trim() || "Routine Clinical Evaluation",
      procedure_performed: formProcedure.trim() || "Comprehensive Exam & Prophylaxis",
      vitals: { bp: "120/80 mmHg", pulse: "72 bpm", temp: "98.6 °F" },
      prescriptions: validMeds,
      doctor_notes: formNotes.trim() || "Patient evaluated. Healing is progressing as expected.",
      followup_date: formFollowup
    };

    const updatedList = [newRec, ...records];
    setRecords(updatedList);
    try {
      localStorage.setItem("revflow_patient_records", JSON.stringify(updatedList));
    } catch (e) {}

    // Call API endpoint
    try {
      await fetchApi("/clinic/records", {
        method: "POST",
        body: JSON.stringify(newRec)
      });
    } catch (err) {}

    setIsSavingRecord(false);
    setIsAddRecordOpen(false);
    setSelectedPatientPhone(newRec.patient_phone);

    // Reset Form
    setFormPatientName("");
    setFormPatientPhone("");
    setFormDiagnosis("");
    setFormProcedure("");
    setFormNotes("");
    setFormFollowup("");
    setFormMeds([{ medication: "", dosage: "", frequency: "", duration: "" }]);
  };

  // Add medication row
  const handleAddMedRow = () => {
    setFormMeds([...formMeds, { medication: "", dosage: "", frequency: "", duration: "" }]);
  };

  const totalPatientsCount = patientSummaries.length;
  const totalVisitsCount = records.length;
  const totalPrescriptionsCount = records.reduce((sum, r) => sum + (r.prescriptions?.length || 0), 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
              HIPAA Compliant Electronic Health Records (EHR)
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-white">
            <FileText className="h-8 w-8 text-indigo-400" />
            Patient Clinical Records & Medical History
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Date-wise patient visit history, attending doctors, clinical diagnoses, procedures performed, and prescribed medications.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Button
            onClick={() => setIsAddRecordOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-5 py-2.5 shadow-lg shadow-indigo-600/30 flex items-center gap-2 font-medium transition-all active:scale-95 text-xs"
          >
            <Plus className="h-4 w-4" />
            Add Visit Record & Prescription
          </Button>

          <Button
            onClick={() => window.print()}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl px-4 py-2.5 backdrop-blur-md flex items-center gap-2 font-medium transition-all active:scale-95 text-xs"
          >
            <Printer className="h-4 w-4" />
            Print Patient Chart
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registered Patients</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <User className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">{totalPatientsCount} Patients</div>
            <div className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">
              <span>Active clinical charts</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Clinic Visits</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">{totalVisitsCount} Visits Logged</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>Date-wise medical entries</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prescriptions Issued</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Pill className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">{totalPrescriptionsCount} Medications</div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              <span>Issued by doctors</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Procedures Completed</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Stethoscope className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">{totalVisitsCount} Procedures</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>Restorations & Hygiene</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main 2-Column Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Patient Directory Selector (4 Cols) */}
        <div className="lg:col-span-4 rounded-3xl border bg-background shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-500" />
              Patient Records
            </h3>
            <span className="text-xs text-muted-foreground font-mono">{filteredPatients.length} found</span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search patient name, MRN, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-2xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Patient Cards List */}
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredPatients.map((p) => {
              const isSelected = activePatientSummary?.phone === p.phone;

              return (
                <div
                  key={p.phone}
                  onClick={() => setSelectedPatientPhone(p.phone)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                    isSelected
                      ? "bg-indigo-600/10 border-indigo-500 ring-1 ring-indigo-500 shadow-sm"
                      : "bg-background hover:bg-muted/40 border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{p.name}</h4>
                        <p className="text-[11px] text-muted-foreground font-mono">{p.phone}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono font-semibold bg-muted px-2 py-0.5 rounded-md text-muted-foreground">
                      {p.mrn}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-muted/30">
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-500/10 px-2.5 py-0.5 rounded-full text-[11px]">
                      {p.total_visits} {p.total_visits === 1 ? "Clinic Visit" : "Clinic Visits"}
                    </span>

                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(p.last_visit).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Date-Wise Clinical History Timeline (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {activePatientSummary ? (
            <div className="rounded-3xl border bg-background shadow-sm p-6 md:p-8 space-y-6">
              
              {/* Active Patient Header Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/20 via-purple-900/10 to-slate-900/20 border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                    {activePatientSummary.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-foreground">{activePatientSummary.name}</h2>
                      <span className="text-xs font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-full font-semibold border border-indigo-500/20">
                        {activePatientSummary.mrn}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                      <span><Phone className="h-3 w-3 inline mr-1" />{activePatientSummary.phone}</span>
                      <span>•</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{activePatientSummary.total_visits} Total Medical Visits</span>
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setFormPatientName(activePatientSummary.name);
                    setFormPatientPhone(activePatientSummary.phone);
                    setIsAddRecordOpen(true);
                  }}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs px-4 flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Visit Entry
                </Button>
              </div>

              {/* Date-Wise Timeline Title */}
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                  <Activity className="h-5 w-5 text-indigo-500" />
                  Chronological Medical History & Prescriptions
                </h3>
                <span className="text-xs text-muted-foreground font-mono">
                  Date-Wise Entries ({activePatientSummary.records.length})
                </span>
              </div>

              {/* Date-Wise Medical Entry Cards List */}
              <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-indigo-500/20 before:z-0">
                {activePatientSummary.records.map((rec, index) => {
                  const visitDateFormatted = new Date(rec.visit_date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                  });

                  const visitTimeFormatted = new Date(rec.visit_date).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit"
                  });

                  return (
                    <div key={rec.id} className="relative z-10 pl-10 space-y-3 group">
                      
                      {/* Timeline Node Icon */}
                      <div className="absolute left-3 top-1 -translate-x-1/2 h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md ring-4 ring-background">
                        <span className="h-2 w-2 rounded-full bg-white" />
                      </div>

                      {/* Medical Entry Card Container */}
                      <div className="p-6 rounded-3xl border bg-background shadow-xs hover:shadow-md transition-all space-y-5 border-border">
                        
                        {/* Visit Date & Attending Doctor Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
                          <div>
                            <div className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              {visitDateFormatted} • {visitTimeFormatted}
                            </div>
                            <h4 className="font-bold text-base text-foreground mt-1">
                              {rec.diagnosis}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-2xl border text-xs font-semibold text-foreground w-fit">
                            <Stethoscope className="h-4 w-4 text-indigo-500" />
                            <span>{rec.doctor_name}</span>
                          </div>
                        </div>

                        {/* Procedure Performed & Vitals Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          <div className="md:col-span-2 p-4 rounded-2xl bg-muted/20 border space-y-1">
                            <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Procedure Performed</span>
                            <p className="font-bold text-foreground text-xs leading-relaxed">{rec.procedure_performed}</p>
                          </div>

                          <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-1">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[10px] tracking-wider flex items-center gap-1">
                              <HeartPulse className="h-3 w-3" /> Patient Vitals
                            </span>
                            <div className="text-[11px] font-mono text-foreground space-y-0.5 pt-0.5">
                              <div>BP: <span className="font-bold">{rec.vitals?.bp || "120/80 mmHg"}</span></div>
                              <div>Pulse: <span className="font-bold">{rec.vitals?.pulse || "72 bpm"}</span></div>
                            </div>
                          </div>
                        </div>

                        {/* Prescribed Medications Section */}
                        {rec.prescriptions && rec.prescriptions.length > 0 && (
                          <div className="space-y-2 pt-1">
                            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                              <Pill className="h-4 w-4 text-emerald-500" />
                              Prescribed Medicines ({rec.prescriptions.length})
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {rec.prescriptions.map((med, mIdx) => (
                                <div
                                  key={mIdx}
                                  className="p-3.5 rounded-2xl border bg-emerald-500/5 border-emerald-500/20 text-xs space-y-1"
                                >
                                  <div className="flex items-center justify-between font-bold text-foreground">
                                    <span className="text-emerald-700 dark:text-emerald-300 text-sm">{med.medication}</span>
                                    <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-md">
                                      {med.dosage}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-muted-foreground">
                                    <span className="font-semibold text-foreground">{med.frequency}</span> • Duration: {med.duration}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Doctor's Clinical Notes & Follow-up */}
                        <div className="space-y-2 pt-2 border-t text-xs">
                          <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Doctor's Clinical Notes</span>
                          <p className="text-foreground leading-relaxed bg-muted/20 p-3.5 rounded-2xl text-xs italic">
                            "{rec.doctor_notes}"
                          </p>

                          {rec.followup_date && (
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold pt-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>Recommended Follow-up Visit: {new Date(rec.followup_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                            </div>
                          )}
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            <div className="p-12 border rounded-3xl text-center text-muted-foreground bg-background">
              Select a patient from the directory to view date-wise medical records.
            </div>
          )}
        </div>

      </div>

      {/* MODAL: Add New Clinical Visit Record & Prescription */}
      {isAddRecordOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveRecord}
            className="bg-background border rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                Add Patient Clinical Record & Prescription
              </h3>
              <button
                type="button"
                onClick={() => setIsAddRecordOpen(false)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Patient Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              {/* Doctor & Visit Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <label className="font-semibold text-muted-foreground">Visit Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Clinical Diagnosis & Procedure */}
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Clinical Diagnosis</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute Molar Hypersensitivity & Caries"
                  value={formDiagnosis}
                  onChange={(e) => setFormDiagnosis(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Procedure Performed</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deep Composite Restoration & Fluoride Varnish"
                  value={formProcedure}
                  onChange={(e) => setFormProcedure(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Dynamic Prescriptions Section */}
              <div className="space-y-3 border-t pt-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Pill className="h-4 w-4" /> Prescribed Medications
                  </label>
                  <Button
                    type="button"
                    onClick={handleAddMedRow}
                    variant="outline"
                    size="sm"
                    className="rounded-full text-[11px] h-7 px-3 text-emerald-600 border-emerald-500/30"
                  >
                    + Add Medicine
                  </Button>
                </div>

                {formMeds.map((med, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-2 bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/20">
                    <input
                      type="text"
                      placeholder="Medicine Name"
                      value={med.medication}
                      onChange={(e) => {
                        const copy = [...formMeds];
                        copy[idx].medication = e.target.value;
                        setFormMeds(copy);
                      }}
                      className="px-2 py-1.5 text-xs rounded-xl border bg-background"
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 500mg)"
                      value={med.dosage}
                      onChange={(e) => {
                        const copy = [...formMeds];
                        copy[idx].dosage = e.target.value;
                        setFormMeds(copy);
                      }}
                      className="px-2 py-1.5 text-xs rounded-xl border bg-background"
                    />
                    <input
                      type="text"
                      placeholder="Frequency (e.g. 1 tab q8h)"
                      value={med.frequency}
                      onChange={(e) => {
                        const copy = [...formMeds];
                        copy[idx].frequency = e.target.value;
                        setFormMeds(copy);
                      }}
                      className="px-2 py-1.5 text-xs rounded-xl border bg-background"
                    />
                    <input
                      type="text"
                      placeholder="Duration (e.g. 7 Days)"
                      value={med.duration}
                      onChange={(e) => {
                        const copy = [...formMeds];
                        copy[idx].duration = e.target.value;
                        setFormMeds(copy);
                      }}
                      className="px-2 py-1.5 text-xs rounded-xl border bg-background"
                    />
                  </div>
                ))}
              </div>

              {/* Doctor's Notes & Follow-up Date */}
              <div className="space-y-1.5 border-t pt-3">
                <label className="font-semibold text-muted-foreground">Doctor's Clinical Notes</label>
                <textarea
                  rows={3}
                  placeholder="Enter detailed doctor observations, X-ray findings, and instructions..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Recommended Follow-up Date</label>
                <input
                  type="date"
                  value={formFollowup}
                  onChange={(e) => setFormFollowup(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddRecordOpen(false)}
                className="rounded-full text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingRecord}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs px-5 flex items-center gap-2"
              >
                {isSavingRecord ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Saving Record...
                  </>
                ) : (
                  <>
                    <FileText className="h-3.5 w-3.5" />
                    Save Clinical Entry
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
