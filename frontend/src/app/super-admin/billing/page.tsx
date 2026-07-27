"use client";

import React from "react";
import { CreditCard } from "lucide-react";
import { AICostDashboard } from "@/modules/admin/components/AICostDashboard";
import { FeatureToggle } from "@/modules/admin/components/FeatureToggle";

export default function BillingPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-indigo-500" />
          Billing & Usage
        </h1>
        <p className="text-muted-foreground mt-2">Manage platform revenue, usage costs, and feature gating.</p>
      </div>
      
      <AICostDashboard />
      <FeatureToggle />
    </div>
  );
}
