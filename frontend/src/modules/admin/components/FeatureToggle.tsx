"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function FeatureToggle() {
  const [flags, setFlags] = useState([
    { id: "voice_ai", name: "Voice AI Receptionist", enabled: true, scope: "Global" },
    { id: "sms_marketing", name: "SMS Marketing Engine", enabled: true, scope: "Global" },
    { id: "ai_studio", name: "AI Marketing Studio", enabled: false, scope: "Beta (Select Plans)" },
    { id: "pms_integration", name: "PMS Real-time Sync", enabled: true, scope: "Global" },
    { id: "white_label", name: "White-label Customization", enabled: true, scope: "Enterprise Only" }
  ]);

  const toggleFlag = (id: string) => {
    setFlags(flags.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
        <CardDescription>Enable or disable features across the entire platform or for specific tenant plans.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {flags.map((flag) => (
            <div key={flag.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-background/50 hover:bg-muted/30 transition-colors">
              <div>
                <p className="font-medium text-foreground">{flag.name}</p>
                <p className="text-xs text-muted-foreground mt-1">Scope: {flag.scope} • Key: <code className="bg-muted px-1 py-0.5 rounded text-[10px]">{flag.id}</code></p>
              </div>
              <input 
                type="checkbox"
                className="w-5 h-5 accent-indigo-500 rounded border-gray-300 focus:ring-indigo-500"
                checked={flag.enabled} 
                onChange={() => toggleFlag(flag.id)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
