"use client";

import React, { useState } from "react";
import {
  Phone, ShieldCheck, Bot, CheckCircle2, Clock, Plus, Sparkles, X,
  AlertCircle, FileText, Lock, Volume2, MessageSquare, RefreshCw, Send, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AssignedNumber {
  id: string;
  phone_number: string;
  type: "Local" | "Toll-Free";
  provider: string;
  voice_enabled: boolean;
  sms_enabled: boolean;
  ai_enabled: boolean;
  assigned_ai_agent: string;
  status: "Active & Live" | "Suspended";
  assigned_date: string;
  monthly_usage: string;
}

interface NumberRequest {
  id: string;
  country: string;
  state: string;
  city: string;
  number_type: "Local" | "Toll-Free";
  intended_use: string;
  preferred_area_code?: string;
  requested_date: string;
  status: "Pending Review" | "Under Review" | "Approved" | "Assigned & Active";
}

const defaultAssignedNumbers: AssignedNumber[] = [
  {
    id: "num-1",
    phone_number: "(555) 234-8901",
    type: "Local",
    provider: "Twilio Enterprise SIP",
    voice_enabled: true,
    sms_enabled: true,
    ai_enabled: true,
    assigned_ai_agent: "Aria (AI Receptionist)",
    status: "Active & Live",
    assigned_date: "2025-10-12",
    monthly_usage: "840 Calls • 2,420 Mins"
  }
];

const defaultRequests: NumberRequest[] = [
  {
    id: "req-101",
    country: "United States",
    state: "Illinois",
    city: "Springfield",
    number_type: "Local",
    intended_use: "Dedicated Emergency Toothache Line",
    preferred_area_code: "217",
    requested_date: "Jul 26, 2026",
    status: "Pending Review"
  }
];

export default function ClinicPhoneNumbersSettingsPage() {
  const [assignedNumbers] = useState<AssignedNumber[]>(defaultAssignedNumbers);
  const [requests, setRequests] = useState<NumberRequest[]>(defaultRequests);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Request Form State
  const [country, setCountry] = useState("United States");
  const [state, setState] = useState("Illinois");
  const [city, setCity] = useState("Springfield");
  const [numberType, setNumberType] = useState<"Local" | "Toll-Free">("Local");
  const [intendedUse, setIntendedUse] = useState("AI Receptionist & Voice Booking");
  const [areaCode, setAreaCode] = useState("217");
  const [notes, setNotes] = useState("");

  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();

    const newReq: NumberRequest = {
      id: `req-${Date.now()}`,
      country,
      state,
      city,
      number_type: numberType,
      intended_use: intendedUse,
      preferred_area_code: areaCode,
      requested_date: "Today",
      status: "Pending Review"
    };

    setRequests([newReq, ...requests]);
    setIsRequestModalOpen(false);

    setToastNotice("📩 Phone Number Provisioning Request submitted to Super Admin! (Status: Pending Review)");
    setTimeout(() => setToastNotice(null), 4500);
  };

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
              <Phone className="h-6 w-6 text-indigo-600" />
              Managed Telephony & Phone Numbers
            </h1>
            <span className="text-xs font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              Super Admin Managed Resource
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            View your clinic's assigned phone numbers, AI receptionist agent status, and submit number provisioning requests to Super Admin.
          </p>
        </div>

        <Button
          onClick={() => setIsRequestModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-5 text-xs font-bold flex items-center gap-2 shadow-md shrink-0"
        >
          <Plus className="h-4 w-4" /> Request New Phone Number
        </Button>
      </div>

      {/* Security & Provisioning Compliance Banner */}
      <div className="p-5 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3.5 text-xs">
        <Lock className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-foreground">Centralized Enterprise Provisioning Policy</div>
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            For security, billing, and regulatory compliance, all phone numbers are purchased and provisioned directly by RevFlow Super Admin. Clinics cannot delete or modify provider credentials directly.
          </p>
        </div>
      </div>

      {/* SECTION 1: Assigned Managed Phone Numbers */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Assigned Managed Clinic Numbers ({assignedNumbers.length})
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {assignedNumbers.map((num) => (
            <div key={num.id} className="p-6 rounded-3xl border bg-card shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-black text-foreground font-mono">{num.phone_number}</div>
                  <span className="text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> {num.status}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                    {num.type}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold">
                    <Bot className="h-3.5 w-3.5" /> {num.assigned_ai_agent}
                  </span>
                  <span>•</span>
                  <span>Provider: {num.provider}</span>
                  <span>•</span>
                  <span className="font-mono">{num.monthly_usage}</span>
                </div>

                <div className="flex items-center gap-2 pt-2 text-[11px]">
                  <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md font-semibold border border-emerald-500/20">
                    ✓ Voice Enabled
                  </span>
                  <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md font-semibold border border-emerald-500/20">
                    ✓ SMS Enabled
                  </span>
                  <span className="bg-purple-500/10 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md font-semibold border border-purple-500/20">
                    ✓ AI Receptionist Active
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold">
                  Configure Greeting
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Phone Number Provisioning Requests Track */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-600" /> Number Provisioning Requests Queue ({requests.length})
        </h2>

        <div className="border rounded-3xl bg-card shadow-md overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Location / Area Code</th>
                <th className="px-5 py-3.5">Number Type</th>
                <th className="px-5 py-3.5">Intended Use</th>
                <th className="px-5 py-3.5">Date Requested</th>
                <th className="px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className="px-5 py-4 font-bold text-foreground">
                    {r.city}, {r.state} ({r.preferred_area_code || "Any"})
                  </td>
                  <td className="px-5 py-4 font-mono text-muted-foreground">{r.number_type}</td>
                  <td className="px-5 py-4 font-semibold text-indigo-600 dark:text-indigo-400">{r.intended_use}</td>
                  <td className="px-5 py-4 text-muted-foreground">{r.requested_date}</td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Request New Phone Number */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitRequest}
            className="bg-background border rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                <Phone className="h-5 w-5 text-indigo-600" />
                Request Phone Number Provisioning
              </h3>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">State / Province</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">Number Type</label>
                  <select
                    value={numberType}
                    onChange={(e) => setNumberType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                  >
                    <option value="Local">Local Number</option>
                    <option value="Toll-Free">Toll-Free 800 Number</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">Preferred Area Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 217"
                    value={areaCode}
                    onChange={(e) => setAreaCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Intended Workflow Use</label>
                <select
                  value={intendedUse}
                  onChange={(e) => setIntendedUse(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                >
                  <option value="AI Receptionist & Voice Booking">AI Receptionist & Primary Telephony</option>
                  <option value="Dedicated Emergency Toothache Line">Dedicated Emergency Toothache Line</option>
                  <option value="Outbound SMS Recall Campaign">Outbound SMS Recall Campaign</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Notes for Super Admin</label>
                <textarea
                  rows={2}
                  placeholder="Special routing instructions or area code requirements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRequestModalOpen(false)}
                className="rounded-full text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs px-5"
              >
                Submit Request
              </Button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
