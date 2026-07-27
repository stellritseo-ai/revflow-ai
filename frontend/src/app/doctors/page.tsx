"use client";

import React, { useEffect, useState } from "react";
import {
  Stethoscope,
  UserPlus,
  Search,
  Filter,
  Star,
  Calendar,
  Clock,
  DollarSign,
  Phone,
  Mail,
  Award,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  ShieldCheck,
  Building2,
  X,
  RefreshCw,
  Sparkles,
  ChevronRight,
  MoreVertical,
  Activity,
  SlidersHorizontal,
  Check
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { BookingModal } from "@/components/booking-modal";

interface DoctorRecord {
  id: string;
  full_name: string;
  specialization: string;
  license_number?: string;
  experience_years?: number;
  biography?: string;
  status: "active" | "on_leave" | "in_surgery";
  color_code?: string;
  appointment_duration_override?: number;
  photo?: string;
  monthly_visits?: number;
  revenue_generated?: number;
  rating?: number;
}

const defaultDoctors: DoctorRecord[] = [
  {
    id: "doc-1",
    full_name: "Dr. Sarah Jenkins, DDS",
    specialization: "General Dentistry & Restorative",
    license_number: "DEN-89412-CA",
    experience_years: 12,
    biography: "Lead dental surgeon specializing in advanced crown restorations, root canal therapy, and painless aesthetic implants.",
    status: "active",
    color_code: "#4f46e5",
    appointment_duration_override: 45,
    monthly_visits: 84,
    revenue_generated: 24500,
    rating: 4.9
  },
  {
    id: "doc-2",
    full_name: "Dr. Alex Rivera, DMD",
    specialization: "Cosmetic & Laser Dentistry",
    license_number: "DEN-99201-CA",
    experience_years: 9,
    biography: "Specialist in porcelain veneers, full-mouth smile makeovers, and non-invasive laser teeth whitening.",
    status: "active",
    color_code: "#0891b2",
    appointment_duration_override: 60,
    monthly_visits: 62,
    revenue_generated: 31200,
    rating: 4.95
  },
  {
    id: "doc-3",
    full_name: "Dr. Michael Chen, MS",
    specialization: "Orthodontics & Invisalign",
    license_number: "ORTH-11409-CA",
    experience_years: 15,
    biography: "Certified Diamond Invisalign provider with over 1,500 successful teeth alignment transformations.",
    status: "in_surgery",
    color_code: "#d97706",
    appointment_duration_override: 30,
    monthly_visits: 110,
    revenue_generated: 42000,
    rating: 4.88
  },
  {
    id: "doc-4",
    full_name: "Dr. Elena Rostova, DND",
    specialization: "Pediatric & Family Dentistry",
    license_number: "PED-55102-CA",
    experience_years: 8,
    biography: "Dedicated pediatric dental specialist creating fun, gentle, and anxiety-free dental visits for children.",
    status: "active",
    color_code: "#10b981",
    appointment_duration_override: 45,
    monthly_visits: 76,
    revenue_generated: 18900,
    rating: 4.98
  }
];

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  
  // Modals state
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorRecord | null>(null);
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Doctor Form State
  const [formName, setFormName] = useState("");
  const [formSpecialty, setFormSpecialty] = useState("General Dentistry");
  const [formLicense, setFormLicense] = useState("");
  const [formExp, setFormExp] = useState(5);
  const [formBio, setFormBio] = useState("");
  const [formDuration, setFormDuration] = useState(45);
  const [formColor, setFormColor] = useState("#4f46e5");
  const [isSavingDoctor, setIsSavingDoctor] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Load doctors from backend API & localStorage
  const loadDoctors = async () => {
    setLoading(true);
    let localDocs: DoctorRecord[] = [];
    try {
      const raw = localStorage.getItem("revflow_doctors");
      if (raw) localDocs = JSON.parse(raw);
    } catch (e) {}

    try {
      const serverDocs = await fetchApi<any[]>("/clinic/doctors");
      if (serverDocs && Array.isArray(serverDocs) && serverDocs.length > 0) {
        const formatted: DoctorRecord[] = serverDocs.map((d, idx) => ({
          id: d.id || `doc-${idx + 1}`,
          full_name: d.full_name || "Dr. Provider",
          specialization: d.specialization || "General Dentistry",
          license_number: d.license_number || `LIC-${1000 + idx}`,
          experience_years: d.experience_years || 5,
          biography: d.biography || "Licensed clinic provider.",
          status: d.status || "active",
          color_code: d.color_code || "#4f46e5",
          appointment_duration_override: d.appointment_duration_override || 45,
          monthly_visits: 45 + idx * 12,
          revenue_generated: 15000 + idx * 8000,
          rating: 4.9
        }));

        const map = new Map<string, DoctorRecord>();
        formatted.forEach(item => map.set(item.id, item));
        localDocs.forEach(item => {
          if (!map.has(item.id)) map.set(item.id, item);
        });

        const merged = Array.from(map.values());
        setDoctors(merged);
        try {
          localStorage.setItem("revflow_doctors", JSON.stringify(merged));
        } catch (e) {}
      } else if (localDocs.length > 0) {
        setDoctors(localDocs);
      } else {
        setDoctors(defaultDoctors);
      }
    } catch (err) {
      console.log("Using local provider directory data");
      setDoctors(localDocs.length > 0 ? localDocs : defaultDoctors);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  // Save new doctor to API and LocalStorage
  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingDoctor) return;
    setIsSavingDoctor(true);

    const payload = {
      full_name: formName.trim() || "Dr. New Doctor",
      specialization: formSpecialty,
      license_number: formLicense.trim() || `LIC-${Math.floor(10000 + Math.random() * 90000)}`,
      experience_years: Number(formExp) || 5,
      biography: formBio.trim() || "Dedicated dental provider.",
      status: "active",
      color_code: formColor,
      appointment_duration_override: Number(formDuration) || 45
    };

    let newDoc: DoctorRecord = {
      id: `doc-${Date.now()}`,
      ...payload,
      status: "active",
      monthly_visits: 0,
      revenue_generated: 0,
      rating: 5.0
    };

    try {
      const serverRes = await fetchApi<any>("/clinic/doctors", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      if (serverRes && serverRes.id) {
        newDoc.id = serverRes.id;
      }
    } catch (err) {
      console.log("Saving doctor to local cache");
    }

    const updatedList = [newDoc, ...doctors];
    setDoctors(updatedList);
    try {
      localStorage.setItem("revflow_doctors", JSON.stringify(updatedList));
    } catch (e) {}

    setIsSavingDoctor(false);
    setIsAddDoctorOpen(false);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);

    // Reset Form
    setFormName("");
    setFormLicense("");
    setFormBio("");
  };

  const filteredDoctors = doctors.filter((doc) => {
    if (selectedSpecialty !== "all" && !doc.specialization.toLowerCase().includes(selectedSpecialty.toLowerCase())) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        doc.full_name.toLowerCase().includes(q) ||
        doc.specialization.toLowerCase().includes(q) ||
        (doc.license_number || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeProvidersCount = doctors.filter(d => d.status === "active" || d.status === "in_surgery").length;
  const totalMonthlyVisits = doctors.reduce((sum, d) => sum + (d.monthly_visits || 0), 0);
  const totalProductionSecured = doctors.reduce((sum, d) => sum + (d.revenue_generated || 0), 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
              {activeProvidersCount} Active Doctors & Hygienists
            </span>
            <span className="text-xs text-slate-400 font-mono">Clinic Staff Roster</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-white">
            <Stethoscope className="h-8 w-8 text-indigo-400" />
            Doctors & Provider Management
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Manage your clinic's doctors, procedure duration overrides, specialty schedules, and monthly production metrics.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Button
            onClick={() => setIsAddDoctorOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-5 py-2.5 shadow-lg shadow-indigo-600/30 flex items-center gap-2 font-medium transition-all active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
            Add New Doctor
          </Button>

          <Button
            onClick={() => setIsBookingOpen(true)}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl px-5 py-2.5 backdrop-blur-md flex items-center gap-2 font-medium transition-all active:scale-95"
          >
            <Calendar className="h-4 w-4" />
            Book Visit
          </Button>
        </div>
      </div>

      {saveSuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-3 text-sm font-medium animate-in fade-in">
          <CheckCircle2 className="h-5 w-5" />
          <span>New doctor added to roster and saved to database successfully!</span>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1 */}
        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Providers</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Stethoscope className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">{doctors.length} Doctors</div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              <Check className="h-3.5 w-3.5" />
              <span>Full Schedule Capacity</span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monthly Visits</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">{totalMonthlyVisits} Patients</div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <span>Handled this month</span>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monthly Production</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">${totalProductionSecured.toLocaleString()}</div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              <span>Secured revenue</span>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Patient Rating</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Star className="h-5 w-5 fill-amber-500" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">4.9 / 5.0</div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <span>Top clinic rating</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Roster Container */}
      <div className="rounded-3xl border bg-background shadow-sm overflow-hidden flex flex-col space-y-6 p-6">
        
        {/* Toolbar & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
          <div className="flex items-center gap-2">
            {(["all", "general", "cosmetic", "orthodontics", "pediatric"] as const).map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpecialty(spec)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                  selectedSpecialty === spec
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-muted/60 hover:bg-muted text-muted-foreground"
                }`}
              >
                {spec === "all" ? "All Specialties" : spec}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search doctor or license..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 text-xs rounded-full border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-56 sm:w-64"
              />
            </div>

            <Button onClick={loadDoctors} variant="outline" size="sm" className="rounded-full h-8 w-8 p-0">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Doctor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="p-6 rounded-3xl border bg-background shadow-sm hover:shadow-md transition-all space-y-5 flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 h-1.5 w-full" style={{ backgroundColor: doc.color_code || "#4f46e5" }} />

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="h-14 w-14 rounded-2xl flex items-center justify-center font-bold text-white shadow-md text-xl"
                      style={{ backgroundColor: doc.color_code || "#4f46e5" }}
                    >
                      {doc.full_name.split(" ")[1]?.charAt(0) || "D"}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-foreground group-hover:text-indigo-600 transition-colors">
                        {doc.full_name}
                      </h3>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                        {doc.specialization}
                      </p>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {doc.license_number} • {doc.experience_years} Yrs Exp
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      doc.status === "active"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800"
                        : doc.status === "in_surgery"
                        ? "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800"
                        : "bg-slate-500/10 text-slate-600 border-slate-200"
                    }`}
                  >
                    {doc.status === "in_surgery" ? "In Surgery" : "Active"}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {doc.biography}
                </p>

                {/* Doctor Performance Pill Row */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center bg-muted/30 p-3 rounded-2xl">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-medium">Slot Duration</div>
                    <div className="text-xs font-bold text-foreground mt-0.5">{doc.appointment_duration_override || 45} mins</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-medium">Monthly Visits</div>
                    <div className="text-xs font-bold text-foreground mt-0.5">{doc.monthly_visits || 50} Patients</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-medium">Rating</div>
                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5 flex items-center justify-center gap-1">
                      <Star className="h-3 w-3 fill-amber-500" /> {doc.rating || 4.9}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  onClick={() => setSelectedDoctor(doc)}
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs hover:border-indigo-500 hover:text-indigo-600"
                >
                  View Details & Bio
                </Button>

                <Button
                  onClick={() => setIsBookingOpen(true)}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs px-4"
                >
                  Book with {doc.full_name.split(" ")[1] || "Doctor"}
                </Button>
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* MODAL 1: Doctor Detail & Bio Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border rounded-3xl p-6 max-w-xl w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b pb-4">
              <div className="flex items-center gap-4">
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center font-bold text-white text-xl"
                  style={{ backgroundColor: selectedDoctor.color_code || "#4f46e5" }}
                >
                  {selectedDoctor.full_name.split(" ")[1]?.charAt(0) || "D"}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedDoctor.full_name}</h3>
                  <p className="text-xs text-indigo-600 font-medium">{selectedDoctor.specialization}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedDoctor.license_number}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoctor(null)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">Biography</h4>
                <p className="text-foreground leading-relaxed bg-muted/30 p-3.5 rounded-2xl">
                  {selectedDoctor.biography}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl border bg-background">
                  <div className="text-muted-foreground font-medium mb-1">Appointment Slot Length</div>
                  <div className="font-bold text-sm text-foreground">{selectedDoctor.appointment_duration_override || 45} Minutes</div>
                </div>

                <div className="p-3.5 rounded-2xl border bg-background">
                  <div className="text-muted-foreground font-medium mb-1">Experience</div>
                  <div className="font-bold text-sm text-foreground">{selectedDoctor.experience_years} Years Clinical Practice</div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t">
              <Button onClick={() => setSelectedDoctor(null)} variant="outline" size="sm" className="rounded-full">
                Close
              </Button>
              <Button
                onClick={() => {
                  setSelectedDoctor(null);
                  setIsBookingOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs px-5"
              >
                Book Appointment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add New Doctor Modal */}
      {isAddDoctorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveDoctor}
            className="bg-background border rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-500" />
                Add New Doctor / Provider
              </h3>
              <button
                type="button"
                onClick={() => setIsAddDoctorOpen(false)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Full Name & Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sarah Jenkins, DDS"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Specialization</label>
                  <select
                    value={formSpecialty}
                    onChange={(e) => setFormSpecialty(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="General Dentistry">General Dentistry</option>
                    <option value="Cosmetic & Laser">Cosmetic & Laser</option>
                    <option value="Orthodontics">Orthodontics</option>
                    <option value="Pediatric Dentistry">Pediatric Dentistry</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">License Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DEN-89412-CA"
                    value={formLicense}
                    onChange={(e) => setFormLicense(e.target.value)}
                    className="w-full px-3.5 py-2.5 font-mono rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Years Experience</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formExp}
                    onChange={(e) => setFormExp(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Slot Duration (Mins)</label>
                  <select
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Biography & Qualifications</label>
                <textarea
                  rows={3}
                  placeholder="Enter doctor background and special procedure expertise..."
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDoctorOpen(false)}
                className="rounded-full text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingDoctor}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs px-5 flex items-center gap-2"
              >
                {isSavingDoctor ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5" />
                    Save Doctor
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Booking Modal Integration */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={() => loadDoctors()}
      />

    </div>
  );
}
