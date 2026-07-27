"use client";

import React, { useState } from "react";
import { Sliders, Sparkles, CheckCircle2, ShieldAlert, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SuperAdminFeatureFlagsPage() {
  const [flags, setFlags] = useState([
    { key: "ai_voice_outbound_calling", label: "AI Voice Outbound Telephony Calling", desc: "Allows clinics to trigger automated outbound calls for 6-month hygiene recalls.", plan: "Enterprise AI Only", enabled: true },
    { key: "dentrix_pms_connector", label: "Dentrix & Open Dental Direct PMS Sync", desc: "Live API connector to sync patient records directly from PMS software.", plan: "Enterprise AI & Pro", enabled: true },
    { key: "waitlist_autofill_engine", label: "Cancellation Waitlist Auto-Fill Engine", desc: "Automatically text patients on the waitlist when a slot opens up.", plan: "Enterprise AI Only", enabled: true },
    { key: "patient_sms_autoresponder", label: "Missed Call Patient SMS Auto-Responder", desc: "Triggers instant SMS conversation when a clinic call is missed after-hours.", plan: "All Plans", enabled: true },
    { key: "developer_api_access", label: "Developer REST API & Webhooks Access", desc: "Exposes public API keys and webhooks for custom integrations.", plan: "Enterprise AI Only", enabled: false }
  ]);

  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const toggleFlag = (key: string) => {
    setFlags(prev => prev.map(f => {
      if (f.key === key) {
        const nextState = !f.enabled;
        setToastNotice(`Feature flag '${f.label}' is now ${nextState ? 'ENABLED' : 'DISABLED'}`);
        setTimeout(() => setToastNotice(null), 3500);
        return { ...f, enabled: nextState };
      }
      return f;
    }));
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
              <Sliders className="h-6 w-6 text-indigo-600" />
              Global SaaS Feature Flags & Module Toggles
            </h1>
            <span className="text-xs font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
              5 Active Modules
            </span>
          </div>
          <p className="text-muted-foreground text-xs mt-1">
            Enable or disable specific platform modules globally or restrict features based on subscription pricing tiers.
          </p>
        </div>
      </div>

      {/* Feature Flags List */}
      <div className="p-6 rounded-3xl border bg-card shadow-md space-y-4">
        <h2 className="text-lg font-extrabold text-foreground">Active Module Flags</h2>

        <div className="space-y-3">
          {flags.map((f) => (
            <div key={f.key} className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-foreground text-sm">{f.label}</span>
                  <span className="text-[9px] font-mono bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                    {f.plan}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">{f.desc}</p>
              </div>

              <input
                type="checkbox"
                checked={f.enabled}
                onChange={() => toggleFlag(f.key)}
                className="h-6 w-6 rounded border-input text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
              />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
