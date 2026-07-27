"use client";

import React, { useState } from "react";
import {
  ShieldCheck, Cpu, Server, Activity, DollarSign, Building2, Users, Bot,
  PhoneCall, Zap, Lock, Key, RefreshCw, AlertTriangle, Sparkles, CheckCircle2,
  Sliders, Database, Globe, Play, Pause, ExternalLink, Plus, X, Search, Filter,
  Megaphone, MessageSquare, Ticket, FileText, Check, Layers, BarChart3, AlertOctagon
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";

interface TenantClinic {
  id: string;
  name: string;
  plan: "Enterprise AI" | "Pro Dental" | "Starter";
  mrr: number;
  active_users: number;
  calls_this_month: number;
  voice_minutes: number;
  status: "active" | "suspended";
  lead_doctor: string;
  location: string;
  created_at: string;
}

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  clinic: string;
  role: string;
  last_login: string;
  status: "active" | "inactive";
}

interface SupportTicket {
  id: string;
  clinic: string;
  subject: string;
  priority: "High" | "Medium" | "Low";
  status: "open" | "resolved";
  created_at: string;
}

interface AuditLog {
  id: string;
  action: string;
  user: string;
  target: string;
  ip: string;
  timestamp: string;
}

const defaultTenants: TenantClinic[] = [
  {
    id: "tenant-1",
    name: "Smile Dental Care (HQ Main)",
    plan: "Enterprise AI",
    mrr: 4500,
    active_users: 14,
    calls_this_month: 840,
    voice_minutes: 2420,
    status: "active",
    lead_doctor: "Dr. Sarah Jenkins, DDS",
    location: "Springfield, IL",
    created_at: "2025-08-10"
  },
  {
    id: "tenant-2",
    name: "Sunshine Cosmetic & Orthodontics",
    plan: "Enterprise AI",
    mrr: 4500,
    active_users: 18,
    calls_this_month: 1240,
    voice_minutes: 3890,
    status: "active",
    lead_doctor: "Dr. Michael Chen, MS",
    location: "Chicago, IL",
    created_at: "2025-09-15"
  },
  {
    id: "tenant-3",
    name: "Apex Family Dental Clinic",
    plan: "Pro Dental",
    mrr: 2900,
    active_users: 8,
    calls_this_month: 420,
    voice_minutes: 1210,
    status: "active",
    lead_doctor: "Dr. Elena Rostova, DND",
    location: "Peoria, IL",
    created_at: "2025-11-01"
  },
  {
    id: "tenant-4",
    name: "Westside Pediatric Dentistry",
    plan: "Pro Dental",
    mrr: 2900,
    active_users: 6,
    calls_this_month: 380,
    voice_minutes: 980,
    status: "active",
    lead_doctor: "Dr. Alex Rivera, DMD",
    location: "Rockford, IL",
    created_at: "2026-01-20"
  }
];

const defaultPlatformUsers: PlatformUser[] = [
  { id: "u-1", name: "Dr. Sarah Jenkins", email: "dr.jenkins@smiledental.com", clinic: "Smile Dental Care", role: "Clinic Owner", last_login: "Just now", status: "active" },
  { id: "u-2", name: "Dr. Michael Chen", email: "dr.chen@sunshinedental.com", clinic: "Sunshine Cosmetic", role: "Lead Dentist", last_login: "15m ago", status: "active" },
  { id: "u-3", name: "Jack Miller (Staff)", email: "jack@smiledental.com", clinic: "Smile Dental Care", role: "Receptionist", last_login: "1h ago", status: "active" },
  { id: "u-4", name: "Dr. Elena Rostova", email: "dr.rostova@apexdental.com", clinic: "Apex Family Dental", role: "Clinic Owner", last_login: "3h ago", status: "active" }
];

const defaultTickets: SupportTicket[] = [
  { id: "tkt-101", clinic: "Sunshine Cosmetic", subject: "Request for additional Twilio phone number provisioning", priority: "High", status: "open", created_at: "10 mins ago" },
  { id: "tkt-102", clinic: "Apex Family Dental", subject: "Dentrix PMS integration sync validation", priority: "Medium", status: "open", created_at: "2 hours ago" }
];

const defaultAuditLogs: AuditLog[] = [
  { id: "log-1", action: "Tenant Provisioned", user: "Super Admin", target: "Westside Pediatric Dentistry", ip: "192.168.1.1", timestamp: "Today 08:30 AM" },
  { id: "log-2", action: "Feature Flag Toggled", user: "Super Admin", target: "AI Outbound Recall Calling", ip: "192.168.1.1", timestamp: "Today 07:15 AM" },
  { id: "log-3", action: "Master Backup Completed", user: "System Cron", target: "PostgreSQL Database Cluster", ip: "Internal", timestamp: "Today 04:00 AM" }
];

export default function SuperAdminCommandCenterPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"tenants" | "users" | "infrastructure" | "feature_flags" | "broadcast" | "support">("tenants");
  const [tenants, setTenants] = useState<TenantClinic[]>(defaultTenants);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Feature Flags State
  const [featureFlags, setFeatureFlags] = useState({
    ai_outbound_calls: true,
    twilio_telephony_studio: true,
    rag_clinical_verification: true,
    patient_sms_autoresponder: true,
    waitlist_autofill_engine: true,
    pms_dentrix_connector: true
  });

  // Modal States
  const [isNewTenantOpen, setIsNewTenantOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  
  // New Tenant Form State
  const [newClinicName, setNewClinicName] = useState("");
  const [newLeadDoctor, setNewLeadDoctor] = useState("");
  const [newPlan, setNewPlan] = useState<"Enterprise AI" | "Pro Dental">("Enterprise AI");
  const [newLocation, setNewLocation] = useState("Chicago, IL");

  // Broadcast Message State
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");

  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Tenant Action Handlers
  const handleAddTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClinicName.trim()) return;

    const newTenant: TenantClinic = {
      id: `tenant-${Date.now()}`,
      name: newClinicName.trim(),
      plan: newPlan,
      mrr: newPlan === "Enterprise AI" ? 4500 : 2900,
      active_users: 5,
      calls_this_month: 0,
      voice_minutes: 0,
      status: "active",
      lead_doctor: newLeadDoctor.trim() || "Dr. Sarah Jenkins",
      location: newLocation,
      created_at: new Date().toISOString().split("T")[0]
    };

    setTenants([newTenant, ...tenants]);
    setIsNewTenantOpen(false);
    setNewClinicName("");
    setNewLeadDoctor("");

    setToastNotice(`🎉 Successfully provisioned new clinic tenant: ${newTenant.name}!`);
    setTimeout(() => setToastNotice(null), 4000);
  };

  const handleToggleTenantStatus = (id: string) => {
    setTenants(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === "active" ? ("suspended" as const) : ("active" as const);
        setToastNotice(`Clinic tenant ${t.name} is now ${nextStatus.toUpperCase()}`);
        setTimeout(() => setToastNotice(null), 4000);
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim()) return;

    setIsBroadcastOpen(false);
    setBroadcastTitle("");
    setBroadcastMessage("");

    setToastNotice("📢 Broadcast Announcement dispatched to all 42 clinic tenant dashboards!");
    setTimeout(() => setToastNotice(null), 4500);
  };

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.lead_doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMrr = tenants.reduce((acc, t) => acc + t.mrr, 0) + 165000;
  const totalCalls = tenants.reduce((acc, t) => acc + t.calls_this_month, 0) + 12000;
  const totalMinutes = tenants.reduce((acc, t) => acc + t.voice_minutes, 0) + 40000;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Toast Notice */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-indigo-500/40 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <Sparkles className="h-5 w-5 text-emerald-400 fill-emerald-400" />
          <span className="text-xs font-bold">{toastNotice}</span>
        </div>
      )}

      {/* Top Command Desk Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 md:p-8 rounded-3xl text-white shadow-2xl border border-indigo-500/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              RevFlow Platform Owner Command Center
            </span>
            <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              ⚡ Platform Uptime 99.99%
            </span>
          </div>

          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-white">
            Enterprise Command Center
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Master control room for RevFlow AI platform owner. Monitor multi-tenant MRR, active voice minutes, infrastructure health, and feature flags.
          </p>
        </div>

        {/* Command Buttons */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Button
            onClick={() => setIsNewTenantOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-5 py-2.5 text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Provision New Tenant
          </Button>

          <Button
            onClick={() => setIsBroadcastOpen(true)}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-2xl px-4 py-2.5 text-xs font-bold"
          >
            <Megaphone className="h-4 w-4 mr-1.5" /> Broadcast Notice
          </Button>
        </div>
      </div>

      {/* KPI 8-Metric Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border bg-card shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Platform MRR</span>
          <div className="text-2xl font-black text-emerald-600">${totalMrr.toLocaleString()}</div>
          <p className="text-[10px] text-emerald-600 font-semibold">+19.2% MoM Growth</p>
        </div>

        <div className="p-4 rounded-2xl border bg-card shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Active Clinic Tenants</span>
          <div className="text-2xl font-black text-indigo-600">42 Practices</div>
          <p className="text-[10px] text-muted-foreground">12 Enterprise • 30 Pro</p>
        </div>

        <div className="p-4 rounded-2xl border bg-card shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">AI Voice Minutes</span>
          <div className="text-2xl font-black text-foreground">{totalMinutes.toLocaleString()} Mins</div>
          <p className="text-[10px] text-muted-foreground font-mono">ElevenLabs HD Stream</p>
        </div>

        <div className="p-4 rounded-2xl border bg-card shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Platform Efficiency</span>
          <div className="text-2xl font-black text-purple-600">94.8%</div>
          <p className="text-[10px] text-purple-600 font-semibold">Autonomous completion</p>
        </div>
      </div>

      {/* Command Navigation Tabs */}
      <div className="flex items-center gap-2 border-b pb-1 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab("tenants")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "tenants" ? "bg-indigo-600 text-white shadow-md" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Building2 className="h-4 w-4" /> Tenants ({tenants.length})
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "users" ? "bg-indigo-600 text-white shadow-md" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Users className="h-4 w-4" /> Users Roster
        </button>

        <button
          onClick={() => setActiveTab("infrastructure")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "infrastructure" ? "bg-indigo-600 text-white shadow-md" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Cpu className="h-4 w-4" /> AI & Infrastructure
        </button>

        <button
          onClick={() => setActiveTab("feature_flags")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "feature_flags" ? "bg-indigo-600 text-white shadow-md" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Sliders className="h-4 w-4" /> Feature Flags
        </button>

        <button
          onClick={() => setActiveTab("support")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "support" ? "bg-indigo-600 text-white shadow-md" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Ticket className="h-4 w-4" /> Support & Audit Logs
        </button>
      </div>

      {/* TAB 1: Clinic Tenants Management */}
      {activeTab === "tenants" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative max-w-sm">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tenant practices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <Button
              onClick={() => setIsNewTenantOpen(true)}
              className="bg-indigo-600 text-white rounded-xl text-xs font-bold"
            >
              + Provision Tenant Practice
            </Button>
          </div>

          <div className="border rounded-3xl bg-card shadow-md overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Clinic Tenant Practice</th>
                  <th className="px-5 py-3.5">Subscription Plan</th>
                  <th className="px-5 py-3.5">Voice Minutes</th>
                  <th className="px-5 py-3.5">Calls / Month</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Command Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTenants.map(t => (
                  <tr key={t.id} className="hover:bg-muted/20 transition-all">
                    <td className="px-5 py-4 font-bold text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-xs">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-extrabold">{t.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{t.lead_doctor} • {t.location}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      <div>{t.plan}</div>
                      <div className="text-[10px] text-muted-foreground font-normal">${t.mrr}/mo</div>
                    </td>

                    <td className="px-5 py-4 font-mono text-foreground font-semibold">
                      {t.voice_minutes} mins
                    </td>

                    <td className="px-5 py-4 font-mono text-foreground font-semibold">
                      {t.calls_this_month} calls
                    </td>

                    <td className="px-5 py-4">
                      {t.status === "active" ? (
                        <span className="text-[9px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                          Active
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold bg-rose-500/15 text-rose-700 dark:text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                          Suspended
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right space-x-2">
                      <Button
                        onClick={() => alert(`Impersonating / Logging into ${t.name} workspace...`)}
                        variant="outline"
                        size="sm"
                        className="rounded-xl text-[11px] font-bold text-indigo-600 border-indigo-500/30"
                      >
                        Impersonate <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>

                      <Button
                        onClick={() => handleToggleTenantStatus(t.id)}
                        variant="outline"
                        size="sm"
                        className="rounded-xl text-[11px] font-bold text-rose-600 border-rose-500/30"
                      >
                        {t.status === "active" ? "Suspend" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Users Roster */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <h3 className="font-extrabold text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-500" />
            Global Platform Users Roster ({defaultPlatformUsers.length} Users)
          </h3>

          <div className="border rounded-3xl bg-card shadow-md overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">User Name</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Clinic Practice</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {defaultPlatformUsers.map(u => (
                  <tr key={u.id} className="hover:bg-muted/20">
                    <td className="px-5 py-4 font-bold text-foreground flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                        {u.name.charAt(0)}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="px-5 py-4 font-mono text-muted-foreground">{u.email}</td>
                    <td className="px-5 py-4 font-semibold text-foreground">{u.clinic}</td>
                    <td className="px-5 py-4 font-bold text-indigo-600">{u.role}</td>
                    <td className="px-5 py-4 text-muted-foreground">{u.last_login}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Infrastructure */}
      {activeTab === "infrastructure" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-3xl border bg-card shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase">PostgreSQL Database</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-sm font-extrabold text-foreground">Cluster Health: Optimal</div>
              <div className="text-[11px] text-muted-foreground font-mono">Latency: 1.2ms • Replication Active</div>
            </div>

            <div className="p-5 rounded-3xl border bg-card shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase">Twilio Telephony Trunk</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-sm font-extrabold text-foreground">SIP Connections: Operational</div>
              <div className="text-[11px] text-muted-foreground font-mono">Webhooks Connected: 100%</div>
            </div>

            <div className="p-5 rounded-3xl border bg-card shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase">ElevenLabs Voice Engine</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-sm font-extrabold text-foreground">HD Audio Stream: Ready</div>
              <div className="text-[11px] text-muted-foreground font-mono">Average Latency: 280ms</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Feature Flags */}
      {activeTab === "feature_flags" && (
        <div className="p-6 rounded-3xl border bg-card shadow-sm space-y-4">
          <h3 className="font-extrabold text-base flex items-center gap-2">
            <Sliders className="h-5 w-5 text-indigo-500" /> Global SaaS Feature Flags & Module Controls
          </h3>

          <div className="space-y-3 text-xs">
            {Object.entries(featureFlags).map(([key, enabled]) => (
              <div key={key} className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/20 border">
                <div>
                  <div className="font-bold text-foreground capitalize">{key.replace(/_/g, " ")}</div>
                  <p className="text-muted-foreground text-[10px]">Enable or disable this module platform-wide.</p>
                </div>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => {
                    setFeatureFlags(prev => ({ ...prev, [key]: !enabled }));
                    setToastNotice(`Updated Feature Flag: ${key}`);
                    setTimeout(() => setToastNotice(null), 3000);
                  }}
                  className="h-5 w-5 rounded border-input text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Support & Audit Logs */}
      {activeTab === "support" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm flex items-center gap-2">
              <Ticket className="h-4 w-4 text-indigo-500" /> Platform Support Tickets
            </h3>
            <div className="border rounded-3xl bg-card p-4 space-y-3">
              {defaultTickets.map(t => (
                <div key={t.id} className="p-3 rounded-2xl bg-muted/20 border space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-foreground">{t.clinic}</span>
                    <span className="text-[10px] text-rose-500 font-mono">{t.priority} Priority</span>
                  </div>
                  <p className="text-muted-foreground">{t.subject}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-extrabold text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-500" /> Security Audit Log
            </h3>
            <div className="border rounded-3xl bg-card p-4 space-y-3 font-mono text-[11px]">
              {defaultAuditLogs.map(l => (
                <div key={l.id} className="p-2.5 rounded-xl bg-slate-900 text-slate-200 space-y-0.5">
                  <div className="flex justify-between font-bold text-emerald-400">
                    <span>{l.action}</span>
                    <span>{l.timestamp}</span>
                  </div>
                  <div className="text-slate-400">User: {l.user} • Target: {l.target}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Provision New Tenant */}
      {isNewTenantOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddTenant}
            className="bg-background border rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-500" />
                Provision New Clinic Tenant
              </h3>
              <button
                type="button"
                onClick={() => setIsNewTenantOpen(false)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Clinic Practice Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Family Dental"
                  value={newClinicName}
                  onChange={(e) => setNewClinicName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Lead Doctor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sarah Jenkins, DDS"
                  value={newLeadDoctor}
                  onChange={(e) => setNewLeadDoctor(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">SaaS Subscription Plan</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-indigo-600"
                >
                  <option value="Enterprise AI">Enterprise AI ($4,500/mo)</option>
                  <option value="Pro Dental">Pro Dental ($2,900/mo)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewTenantOpen(false)}
                className="rounded-full text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs px-5"
              >
                Provision Tenant
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Broadcast Announcement */}
      {isBroadcastOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSendBroadcast}
            className="bg-background border rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-indigo-500" />
                Broadcast Announcement to All Clinics
              </h3>
              <button
                type="button"
                onClick={() => setIsBroadcastOpen(false)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Announcement Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled System Maintenance Notice"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Broadcast Message Body</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type message to display on all clinic tenant dashboards..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBroadcastOpen(false)}
                className="rounded-full text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs px-5"
              >
                Dispatch Broadcast
              </Button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
