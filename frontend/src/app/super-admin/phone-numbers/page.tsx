"use client";

import React, { useState } from "react";
import {
  Phone, ShieldCheck, CheckCircle2, Clock, Plus, Sparkles, X,
  AlertCircle, FileText, Lock, Volume2, MessageSquare, RefreshCw, Send, Check,
  Building2, Radio, Server, Bot, Zap, Filter, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuperAdminRequest {
  id: string;
  clinic_name: string;
  requested_by: string;
  country: string;
  state: string;
  city: string;
  number_type: "Local" | "Toll-Free";
  intended_use: string;
  area_code: string;
  requested_date: string;
  priority: "High" | "Medium";
  status: "Pending Review" | "Under Review" | "Approved" | "Provisioned & Live";
}

interface ProviderNumberPool {
  id: string;
  phone_number: string;
  provider: "Twilio" | "Telnyx" | "Plivo" | "Vonage";
  type: "Local" | "Toll-Free";
  area_code: string;
  city_state: string;
  monthly_cost: number;
  capabilities: string[];
  status: "Available" | "Assigned";
  assigned_clinic?: string;
}

const defaultRequests: SuperAdminRequest[] = [
  {
    id: "req-1",
    clinic_name: "Smile Dental Care (HQ Main)",
    requested_by: "Dr. Sarah Jenkins",
    country: "United States",
    state: "Illinois",
    city: "Springfield",
    number_type: "Local",
    intended_use: "Dedicated Emergency Toothache Line",
    area_code: "217",
    requested_date: "Jul 26, 2026",
    priority: "High",
    status: "Pending Review"
  },
  {
    id: "req-2",
    clinic_name: "Sunshine Cosmetic & Orthodontics",
    requested_by: "Dr. Michael Chen",
    country: "United States",
    state: "Illinois",
    city: "Chicago",
    number_type: "Toll-Free",
    intended_use: "Outbound AI Voice Recall Campaign",
    area_code: "800",
    requested_date: "Jul 25, 2026",
    priority: "Medium",
    status: "Under Review"
  }
];

const defaultNumberPool: ProviderNumberPool[] = [
  {
    id: "pool-1",
    phone_number: "(217) 890-4411",
    provider: "Twilio",
    type: "Local",
    area_code: "217",
    city_state: "Springfield, IL",
    monthly_cost: 1.15,
    capabilities: ["Voice", "SMS", "MMS"],
    status: "Available"
  },
  {
    id: "pool-2",
    phone_number: "(800) 459-2099",
    provider: "Telnyx",
    type: "Toll-Free",
    area_code: "800",
    city_state: "National Toll-Free",
    monthly_cost: 2.00,
    capabilities: ["Voice", "SMS"],
    status: "Available"
  },
  {
    id: "pool-3",
    phone_number: "(312) 554-1290",
    provider: "Twilio",
    type: "Local",
    area_code: "312",
    city_state: "Chicago, IL",
    monthly_cost: 1.15,
    capabilities: ["Voice", "SMS", "MMS"],
    status: "Available"
  }
];

export default function SuperAdminPhoneNumberManagementPage() {
  const [requests, setRequests] = useState<SuperAdminRequest[]>(defaultRequests);
  const [numberPool, setNumberPool] = useState<ProviderNumberPool[]>(defaultNumberPool);
  const [selectedRequest, setSelectedRequest] = useState<SuperAdminRequest | null>(null);
  const [selectedPoolNumber, setSelectedPoolNumber] = useState<ProviderNumberPool | null>(null);

  // Provisioning Form
  const [assignedClinic, setAssignedClinic] = useState("Smile Dental Care (HQ Main)");
  const [assignedAgent, setAssignedAgent] = useState("Aria (AI Receptionist)");
  const [enableVoice, setEnableVoice] = useState(true);
  const [enableSms, setEnableSms] = useState(true);
  const [enableRecording, setEnableRecording] = useState(true);

  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const handleApproveAndProvision = (req: SuperAdminRequest) => {
    setSelectedRequest(req);
    // Find matching available number
    const match = numberPool.find(n => n.status === "Available");
    if (match) setSelectedPoolNumber(match);
  };

  const handleExecuteProvisioning = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !selectedPoolNumber) return;

    // Update request status
    setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, status: "Provisioned & Live" as const } : r));

    // Mark pool number as assigned
    setNumberPool(prev => prev.map(n => n.id === selectedPoolNumber.id ? { ...n, status: "Assigned" as const, assigned_clinic: assignedClinic } : n));

    const numStr = selectedPoolNumber.phone_number;
    setSelectedRequest(null);
    setSelectedPoolNumber(null);

    setToastNotice(`🎉 Purchased & Provisioned ${numStr} from ${selectedPoolNumber.provider} -> Assigned to ${assignedClinic}!`);
    setTimeout(() => setToastNotice(null), 5000);
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
              <Phone className="h-6 w-6 text-indigo-600" />
              Phone Number Provisioning & Telephony Management
            </h1>
            <span className="text-xs font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
              Twilio & Telnyx Connected
            </span>
          </div>
          <p className="text-muted-foreground text-xs mt-1">
            Approve clinic number requests, purchase SIP numbers from providers, configure AI voice routing, and assign to target practice clinics.
          </p>
        </div>
      </div>

      {/* Telephony Inventory KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-3xl border bg-card shadow-sm space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase">Pending Requests</span>
          <div className="text-3xl font-black text-amber-600">{requests.filter(r => r.status === "Pending Review").length} Requests</div>
          <p className="text-xs text-amber-600 font-semibold">Requires Super Admin Approval</p>
        </div>

        <div className="p-5 rounded-3xl border bg-card shadow-sm space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase">Available Pool Numbers</span>
          <div className="text-3xl font-black text-indigo-600">{numberPool.filter(n => n.status === "Available").length} Numbers</div>
          <p className="text-xs text-muted-foreground">Twilio + Telnyx Inventory</p>
        </div>

        <div className="p-5 rounded-3xl border bg-card shadow-sm space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase">Assigned Live Numbers</span>
          <div className="text-3xl font-black text-emerald-600">42 Numbers</div>
          <p className="text-xs text-emerald-600 font-semibold">Active across all clinics</p>
        </div>

        <div className="p-5 rounded-3xl border bg-card shadow-sm space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase">Average Provision Time</span>
          <div className="text-3xl font-black text-foreground font-mono">&lt; 45 Seconds</div>
          <p className="text-xs text-muted-foreground">Instant API SIP Bind</p>
        </div>
      </div>

      {/* SECTION 1: Clinic Number Provisioning Requests Queue */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-600" /> Incoming Clinic Requests Queue ({requests.length})
        </h2>

        <div className="border rounded-3xl bg-card shadow-md overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Clinic Practice & Requested By</th>
                <th className="px-5 py-3.5">Location & Area Code</th>
                <th className="px-5 py-3.5">Type & Intended Use</th>
                <th className="px-5 py-3.5">Requested Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Super Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className="px-5 py-4 font-bold text-foreground">
                    <div>{r.clinic_name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">By: {r.requested_by}</div>
                  </td>

                  <td className="px-5 py-4 text-muted-foreground">
                    <span className="font-semibold text-foreground">{r.city}, {r.state}</span>
                    <span className="font-mono text-[10px] ml-1">({r.area_code})</span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-bold text-indigo-600 dark:text-indigo-400">{r.intended_use}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{r.number_type} Number</div>
                  </td>

                  <td className="px-5 py-4 text-muted-foreground">{r.requested_date}</td>

                  <td className="px-5 py-4">
                    {r.status === "Provisioned & Live" ? (
                      <span className="text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        Provisioned & Live
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                        {r.status}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right">
                    {r.status !== "Provisioned & Live" && (
                      <Button
                        onClick={() => handleApproveAndProvision(r)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold px-3 py-1.5 shadow-sm"
                      >
                        Approve & Provision Number
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: Provider Available Number Pool */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
          <Server className="h-5 w-5 text-indigo-600" /> Connected Provider Inventory Pool ({numberPool.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {numberPool.map((n) => (
            <div key={n.id} className="p-5 rounded-3xl border bg-card shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs bg-indigo-500/10 text-indigo-600 px-2.5 py-1 rounded-md">
                  {n.provider} SIP
                </span>
                <span className="text-xs font-extrabold text-emerald-600">${n.monthly_cost.toFixed(2)}/mo</span>
              </div>

              <div className="text-xl font-black font-mono text-foreground">{n.phone_number}</div>

              <div className="text-xs text-muted-foreground">
                Location: <strong className="text-foreground">{n.city_state}</strong>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] pt-1">
                {n.capabilities.map((cap, idx) => (
                  <span key={idx} className="bg-muted px-2 py-0.5 rounded font-bold text-muted-foreground">
                    ✓ {cap}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: Provision & Assign Number */}
      {selectedRequest && selectedPoolNumber && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleExecuteProvisioning}
            className="bg-background border rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                <Radio className="h-5 w-5 text-indigo-600" />
                Provision & Bind Phone Number
              </h3>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-1">
                <div className="font-bold text-indigo-600 dark:text-indigo-300">Selected Provider Number:</div>
                <div className="text-lg font-black font-mono text-foreground">{selectedPoolNumber.phone_number} ({selectedPoolNumber.provider})</div>
                <div className="text-[10px] text-muted-foreground">{selectedPoolNumber.city_state} • ${selectedPoolNumber.monthly_cost}/mo</div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Assign to Clinic Tenant</label>
                <input
                  type="text"
                  required
                  value={assignedClinic}
                  onChange={(e) => setAssignedClinic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-background font-bold text-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Default Assigned AI Receptionist Persona</label>
                <select
                  value={assignedAgent}
                  onChange={(e) => setAssignedAgent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-background font-bold"
                >
                  <option value="Aria (AI Receptionist)">Aria • Dental Assistant (Friendly & Warm)</option>
                  <option value="Marcus • AI Emergency Dispatcher">Marcus • Emergency Dispatcher</option>
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <div className="font-bold text-muted-foreground">Enable SIP Telephony Features</div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableVoice}
                      onChange={(e) => setEnableVoice(e.target.checked)}
                      className="rounded border-input text-indigo-600"
                    />
                    <span>Enable AI Voice Telephony & Streaming</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableSms}
                      onChange={(e) => setEnableSms(e.target.checked)}
                      className="rounded border-input text-indigo-600"
                    />
                    <span>Enable SMS & MMS Auto-Responder</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableRecording}
                      onChange={(e) => setEnableRecording(e.target.checked)}
                      className="rounded border-input text-indigo-600"
                    />
                    <span>Enable HD Dual-Channel Call Recording</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedRequest(null)}
                className="rounded-full text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs px-5 font-bold"
              >
                Purchase & Assign Number
              </Button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
