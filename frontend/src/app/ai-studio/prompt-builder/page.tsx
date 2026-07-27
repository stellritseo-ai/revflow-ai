"use client";

import React from "react";
import { PromptEditor } from "@/modules/ai-studio/components/PromptEditor";
import { Save, Wand2 } from "lucide-react";

export default function PromptBuilderPage() {
  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold">Emergency Triage Prompt</h1>
          <p className="text-sm text-muted-foreground mt-1">Version 1.2 • Published</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border border-border text-foreground rounded-md font-medium hover:bg-muted transition-colors flex items-center gap-2 text-sm">
            <Wand2 className="w-4 h-4" />
            Optimize with AI
          </button>
          <button className="px-4 py-2 bg-indigo-500 text-white rounded-md font-medium hover:bg-indigo-600 transition-colors flex items-center gap-2 text-sm">
            <Save className="w-4 h-4" />
            Save as Draft
          </button>
        </div>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <PromptEditor />
      </div>
    </div>
  );
}
