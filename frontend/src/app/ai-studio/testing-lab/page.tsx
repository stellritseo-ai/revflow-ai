"use client";

import React from "react";
import { SimulatorTerminal } from "@/modules/ai-studio/components/SimulatorTerminal";
import { FlaskConical } from "lucide-react";

export default function TestingLabPage() {
  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <FlaskConical className="w-6 h-6 text-indigo-500" />
          <h1 className="text-xl font-bold">AI Testing Lab</h1>
        </div>
        <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
          Agent: <span className="text-foreground bg-muted px-2 py-1 rounded">Front Desk Receptionist (v1.2)</span>
        </div>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <SimulatorTerminal />
      </div>
    </div>
  );
}
