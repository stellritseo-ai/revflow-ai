"use client";

import React from "react";
import { WorkflowCanvas } from "@/modules/ai-studio/components/WorkflowCanvas";
import { Network, Save, Play } from "lucide-react";

export default function WorkflowBuilderPage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-md">
            <Network className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold">New Patient Intake Workflow</h1>
            <p className="text-xs text-muted-foreground">Draft • Last edited 2 mins ago</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border border-border text-foreground rounded-md font-medium hover:bg-muted transition-colors flex items-center gap-2 text-sm">
            <Play className="w-4 h-4" />
            Test
          </button>
          <button className="px-4 py-2 bg-indigo-500 text-white rounded-md font-medium hover:bg-indigo-600 transition-colors flex items-center gap-2 text-sm">
            <Save className="w-4 h-4" />
            Save & Publish
          </button>
        </div>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <WorkflowCanvas />
      </div>
    </div>
  );
}
