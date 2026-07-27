"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bot, Plus, Settings } from "lucide-react";

export default function AgentBuilderPage() {
  const agents = [
    { name: "Front Desk Receptionist", type: "Receptionist", status: "Active" },
    { name: "Billing Assistant", type: "Billing", status: "Draft" },
    { name: "Emergency Triage", type: "Support", status: "Active" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Bot className="w-8 h-8 text-indigo-500" />
            Agent Builder
          </h1>
          <p className="text-muted-foreground mt-2">Create and configure AI agents for specific roles.</p>
        </div>
        <button className="px-4 py-2 bg-indigo-500 text-white rounded-md font-medium hover:bg-indigo-600 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Agent
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent, i) => (
          <Card key={i} className="hover:border-indigo-500/30 transition-all cursor-pointer">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{agent.name}</CardTitle>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  agent.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {agent.status}
                </div>
              </div>
              <CardDescription>Type: {agent.type}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mt-2">
                <button className="flex-1 px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <Settings className="w-4 h-4" />
                  Configure
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
