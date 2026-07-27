"use client";

import React, { useState } from "react";
import {
  MapPin, Building2, Phone, Clock, Plus, Edit3, Trash2, CheckCircle2,
  Globe, Stethoscope, Search, RefreshCw, X, ShieldCheck, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClinicLocation {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  lead_doctor: string;
  operating_hours: string;
  is_main: boolean;
  status: "active" | "inactive";
}

const defaultLocations: ClinicLocation[] = [
  {
    id: "loc-1",
    name: "RevFlow Dental • Main Suite",
    code: "MAIN-400",
    address: "742 Evergreen Terrace, Suite 400",
    city: "Springfield",
    state: "IL",
    zip: "62704",
    phone: "(555) 234-8901",
    lead_doctor: "Dr. Sarah Jenkins, DDS",
    operating_hours: "Mon – Fri: 8:00 AM – 5:00 PM",
    is_main: true,
    status: "active"
  },
  {
    id: "loc-2",
    name: "RevFlow Cosmetic & Ortho Center",
    code: "WEST-102",
    address: "1284 Westside Blvd, Suite 102",
    city: "Springfield",
    state: "IL",
    zip: "62708",
    phone: "(555) 890-1234",
    lead_doctor: "Dr. Michael Chen, MS",
    operating_hours: "Mon – Thu: 9:00 AM – 6:00 PM",
    is_main: false,
    status: "active"
  },
  {
    id: "loc-3",
    name: "RevFlow Pediatric Care Facility",
    code: "PED-205",
    address: "450 Childrens Plaza, Suite 205",
    city: "Springfield",
    state: "IL",
    zip: "62711",
    phone: "(555) 456-7890",
    lead_doctor: "Dr. Elena Rostova, DND",
    operating_hours: "Tue – Sat: 8:30 AM – 4:30 PM",
    is_main: false,
    status: "active"
  }
];

export default function LocationsPage() {
  const [locations, setLocations] = useState<ClinicLocation[]>(defaultLocations);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCity, setFormCity] = useState("Springfield");
  const [formState, setFormState] = useState("IL");
  const [formZip, setFormZip] = useState("62704");
  const [formPhone, setFormPhone] = useState("");
  const [formLeadDoctor, setFormLeadDoctor] = useState("Dr. Sarah Jenkins, DDS");
  const [isSaving, setIsSaving] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.phone.includes(searchTerm)
  );

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setIsSaving(true);

    setTimeout(() => {
      const newLoc: ClinicLocation = {
        id: `loc-${Date.now()}`,
        name: formName.trim(),
        code: `LOC-${Math.floor(100 + Math.random() * 900)}`,
        address: formAddress.trim() || "100 Health Way, Suite 100",
        city: formCity,
        state: formState,
        zip: formZip,
        phone: formPhone.trim() || "(555) 000-0000",
        lead_doctor: formLeadDoctor,
        operating_hours: "Mon – Fri: 8:00 AM – 5:00 PM",
        is_main: false,
        status: "active"
      };

      setLocations([...locations, newLoc]);
      setIsSaving(false);
      setIsAddModalOpen(false);

      // Reset
      setFormName("");
      setFormAddress("");
      setFormPhone("");

      setToastNotice(`✨ Created new clinic location: ${newLoc.name}!`);
      setTimeout(() => setToastNotice(null), 4000);
    }, 600);
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
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
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
              <MapPin className="h-6 w-6 text-indigo-500" />
              Clinic Locations & Facilities
            </h1>
            <span className="text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              {locations.length} Multi-Branch Facilities
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Manage multi-branch dental practices, physical facility addresses, operating hours, and lead doctors.
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-5 text-xs font-bold flex items-center gap-2 shadow-md shrink-0"
        >
          <Plus className="h-4 w-4" /> Add Clinic Location
        </Button>
      </div>

      {/* Search Toolbar */}
      <div className="relative max-w-md">
        <Search className="h-4 w-4 absolute left-3.5 top-3 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search locations, address, phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
        />
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredLocations.map(loc => (
          <div
            key={loc.id}
            className={`p-5 rounded-3xl border bg-card shadow-sm hover:shadow-md transition-all space-y-4 relative ${
              loc.is_main ? "border-indigo-500/50 bg-indigo-500/5" : ""
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-foreground">{loc.name}</h3>
                  {loc.is_main && (
                    <span className="text-[9px] font-black uppercase bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                      HQ Main
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full border">
                  {loc.code}
                </span>
              </div>

              <span className="text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Active
              </span>
            </div>

            {/* Address & Contact */}
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <span>{loc.address}, {loc.city}, {loc.state} {loc.zip}</span>
              </div>

              <div className="flex items-center gap-2 font-mono">
                <Phone className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <span>{loc.phone}</span>
              </div>

              <div className="flex items-center gap-2">
                <Stethoscope className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <span className="font-semibold text-foreground">{loc.lead_doctor}</span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <span>{loc.operating_hours}</span>
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-3 border-t flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground">RevFlow Telephony Configured</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => alert(`Editing configuration for ${loc.name}`)}
                className="text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl"
              >
                <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Add Location */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddLocation}
            className="bg-background border rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-500" />
                Add New Clinic Branch Location
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Location / Facility Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RevFlow Eastside Dental"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 500 Medical Parkway, Suite 200"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">City</label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">State</label>
                  <input
                    type="text"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Zip</label>
                  <input
                    type="text"
                    value={formZip}
                    onChange={(e) => setFormZip(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Location Direct Phone</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. (555) 999-8888"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Lead Doctor</label>
                <select
                  value={formLeadDoctor}
                  onChange={(e) => setFormLeadDoctor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                >
                  <option value="Dr. Sarah Jenkins, DDS">Dr. Sarah Jenkins, DDS</option>
                  <option value="Dr. Michael Chen, MS">Dr. Michael Chen, MS</option>
                  <option value="Dr. Elena Rostova, DND">Dr. Elena Rostova, DND</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
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
                    <Building2 className="h-3.5 w-3.5" />
                    Save Location
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
