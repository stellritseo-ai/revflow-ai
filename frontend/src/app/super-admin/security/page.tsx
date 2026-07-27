import React from "react";
import { ShieldCheck } from "lucide-react";
import { SecurityDashboard } from "@/modules/admin/components/SecurityDashboard";

export default function SecurityPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-indigo-500" />
          Security Center
        </h1>
        <p className="text-muted-foreground mt-2">Audit logs, failed logins, and suspicious activity monitoring.</p>
      </div>
      
      <SecurityDashboard />
    </div>
  );
}
