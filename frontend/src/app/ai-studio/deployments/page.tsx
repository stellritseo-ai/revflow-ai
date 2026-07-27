"use client";

import React from "react";
import { VersionControl } from "@/modules/ai-studio/components/VersionControl";
import { Rocket } from "lucide-react";

export default function DeploymentsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Rocket className="w-8 h-8 text-indigo-500" />
            Deployments & Version Control
          </h1>
          <p className="text-muted-foreground mt-2">Manage versions, view history, and rollback changes.</p>
        </div>
      </div>
      
      <VersionControl />
    </div>
  );
}
