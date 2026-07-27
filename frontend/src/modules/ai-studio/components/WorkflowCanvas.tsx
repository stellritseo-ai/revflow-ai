"use client";

import React from "react";
import { Network, Database, MessageSquare, Phone, Zap } from "lucide-react";

export function WorkflowCanvas() {
  // A visual placeholder mock for a complex node editor (like reactflow)
  
  return (
    <div className="w-full h-full flex bg-[#0F1117] relative">
      {/* Sidebar Tool Palette */}
      <div className="w-64 border-r border-border bg-card p-4 flex flex-col gap-4 overflow-y-auto z-10 shrink-0">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Nodes</h3>
        
        <div className="p-3 border border-border rounded-lg bg-background flex items-center gap-3 cursor-grab hover:border-indigo-500/50">
          <Zap className="w-5 h-5 text-yellow-500" />
          <span className="text-sm font-medium">Trigger</span>
        </div>
        
        <div className="p-3 border border-border rounded-lg bg-background flex items-center gap-3 cursor-grab hover:border-indigo-500/50">
          <Database className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-medium">Knowledge Search</span>
        </div>
        
        <div className="p-3 border border-border rounded-lg bg-background flex items-center gap-3 cursor-grab hover:border-indigo-500/50">
          <Network className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium">AI Decision</span>
        </div>
        
        <div className="p-3 border border-border rounded-lg bg-background flex items-center gap-3 cursor-grab hover:border-indigo-500/50">
          <MessageSquare className="w-5 h-5 text-purple-500" />
          <span className="text-sm font-medium">Send SMS</span>
        </div>

        <div className="p-3 border border-border rounded-lg bg-background flex items-center gap-3 cursor-grab hover:border-indigo-500/50">
          <Phone className="w-5 h-5 text-rose-500" />
          <span className="text-sm font-medium">Transfer to Human</span>
        </div>
      </div>

      {/* Main Canvas Area (Mocked visually) */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-[radial-gradient(#ffffff1a_1px,transparent_1px)] [background-size:24px_24px]">
        
        {/* Connection Line Mock */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          <path d="M 400 300 C 500 300, 500 400, 600 400" fill="none" stroke="#4f46e5" strokeWidth="2" strokeDasharray="5,5" />
        </svg>

        {/* Node 1 */}
        <div className="absolute top-[250px] left-[200px] w-[200px] bg-card border border-indigo-500 rounded-lg shadow-xl shadow-indigo-500/10 z-10">
          <div className="p-3 border-b border-border bg-indigo-500/10 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-semibold">Incoming Call</span>
          </div>
          <div className="p-4">
            <p className="text-xs text-muted-foreground">Listens for new patient calls.</p>
          </div>
        </div>

        {/* Node 2 */}
        <div className="absolute top-[350px] left-[600px] w-[200px] bg-card border border-border rounded-lg shadow-xl z-10">
          <div className="p-3 border-b border-border bg-emerald-500/10 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-semibold">Search FAQs</span>
          </div>
          <div className="p-4">
            <p className="text-xs text-muted-foreground">Queries RAG index for answers.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
