"use client";

import React from "react";
import { StudioDashboard } from "@/modules/ai-studio/components/StudioDashboard";

export default function AIStudioPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Studio Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage agents, workflows, and prompts for your clinic.</p>
      </div>
      
      <StudioDashboard />
    </div>
  );
}
