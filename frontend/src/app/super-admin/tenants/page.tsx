"use client";

import React from "react";
import { Building2 } from "lucide-react";
import { TenantList } from "@/modules/admin/components/TenantList";

export default function TenantsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Building2 className="w-8 h-8 text-indigo-500" />
          Tenant Manager
        </h1>
        <p className="text-muted-foreground mt-2">Detailed view of all clinics on the platform.</p>
      </div>
      
      <TenantList />
    </div>
  );
}
