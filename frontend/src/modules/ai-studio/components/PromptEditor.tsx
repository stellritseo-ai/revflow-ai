"use client";

import React from "react";

export function PromptEditor() {
  return (
    <div className="w-full h-full flex flex-col lg:flex-row">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-6 relative">
          <textarea 
            className="w-full h-full resize-none bg-transparent outline-none text-foreground font-mono leading-relaxed"
            defaultValue={`You are an AI medical receptionist for [clinic_name].

Your role is to handle emergency triage calls.
Listen carefully to the patient's symptoms.

Rules:
1. If the patient reports severe pain (score > 7), immediately transfer to human.
2. For bleeding or trauma, escalate to emergency queue.
3. Be empathetic and professional.`}
          />
        </div>
      </div>
      
      {/* Variables Sidebar */}
      <div className="w-full lg:w-80 border-l border-border bg-card p-6 flex flex-col gap-6 shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Available Variables</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-2 text-sm font-mono bg-muted/50 p-2 rounded border border-border">
              <span className="text-indigo-400">[clinic_name]</span>
            </li>
            <li className="flex items-center gap-2 text-sm font-mono bg-muted/50 p-2 rounded border border-border">
              <span className="text-emerald-400">[patient_first_name]</span>
            </li>
            <li className="flex items-center gap-2 text-sm font-mono bg-muted/50 p-2 rounded border border-border">
              <span className="text-amber-400">[emergency_phone]</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
