"use client";

import React, { useState } from "react";
import {
  DollarSign, TrendingUp, CreditCard, Building2, ShieldCheck, Tag, Plus,
  CheckCircle2, Sparkles, Download, RefreshCw, Layers, ArrowUpRight, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: "monthly" | "yearly";
  active_tenants: number;
  features: string[];
}

const defaultPlans: SubscriptionPlan[] = [
  {
    id: "plan-enterprise",
    name: "Enterprise AI Suite",
    price: 4500,
    interval: "monthly",
    active_tenants: 12,
    features: [
      "Unlimited AI Outbound Telephony Calls",
      "Multi-Branch Location Routing",
      "Dentrix, Open Dental & Eaglesoft PMS Sync",
      "24/7 Priority SLA & Dedicated Account Manager",
      "Custom RAG Prompt Safeguards & Voice Persona"
    ]
  },
  {
    id: "plan-pro",
    name: "Pro Dental Practice",
    price: 2900,
    interval: "monthly",
    active_tenants: 30,
    features: [
      "Up to 2,500 Voice Minutes / month",
      "AI Web Chat & SMS Auto-Responder",
      "Standard Calendar & PMS Sync",
      "Emergency Toothache Call Escalation",
      "Email & In-App Support"
    ]
  }
];

export default function SuperAdminSubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(defaultPlans);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

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
              <DollarSign className="h-6 w-6 text-emerald-600" />
              SaaS Subscriptions & Pricing Tier Control
            </h1>
            <span className="text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              $184,500 MRR Active
            </span>
          </div>
          <p className="text-muted-foreground text-xs mt-1">
            Manage practice pricing tiers, billing cycles, coupon codes, and subscription revenue growth across all clinics.
          </p>
        </div>

        <Button
          onClick={() => {
            setToastNotice("✨ Add New Plan modal triggered!");
            setTimeout(() => setToastNotice(null), 3000);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold px-5"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Create Pricing Plan
        </Button>
      </div>

      {/* MRR & SaaS Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-3xl border bg-card shadow-sm space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase">Monthly Recurring Revenue</span>
          <div className="text-3xl font-black text-emerald-600">$184,500 / mo</div>
          <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> +19.2% MoM Revenue
          </div>
        </div>

        <div className="p-5 rounded-3xl border bg-card shadow-sm space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase">Annual Run Rate (ARR)</span>
          <div className="text-3xl font-black text-foreground">$2,214,000 / yr</div>
          <p className="text-xs text-muted-foreground">Projected annual ARR</p>
        </div>

        <div className="p-5 rounded-3xl border bg-card shadow-sm space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase">Average Revenue Per Clinic</span>
          <div className="text-3xl font-black text-indigo-600">$4,392 / clinic</div>
          <p className="text-xs text-muted-foreground">ARPU Metric</p>
        </div>

        <div className="p-5 rounded-3xl border bg-card shadow-sm space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase">Churn Rate</span>
          <div className="text-3xl font-black text-purple-600">0.4%</div>
          <p className="text-xs text-emerald-600 font-semibold">Industry-leading retention</p>
        </div>
      </div>

      {/* Subscribed Tiers Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
          <Layers className="h-5 w-5 text-indigo-600" /> Active Platform Pricing Plans ({plans.length} Tiers)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((p) => (
            <div key={p.id} className="p-6 rounded-3xl border bg-card shadow-md flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-foreground">{p.name}</h3>
                  <span className="text-xs font-extrabold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/30">
                    {p.active_tenants} Subscribed Practices
                  </span>
                </div>

                <div className="text-3xl font-black text-emerald-600">
                  ${p.price.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">/ month</span>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Plan Features</div>
                  {p.features.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-medium text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-end gap-3">
                <Button
                  onClick={() => {
                    setToastNotice(`Editing pricing & limits for ${p.name}`);
                    setTimeout(() => setToastNotice(null), 3000);
                  }}
                  variant="outline"
                  size="sm"
                  className="rounded-2xl text-xs font-bold"
                >
                  Edit Plan Tiers
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
