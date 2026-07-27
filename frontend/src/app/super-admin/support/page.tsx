"use client";

import React from "react";
import { LifeBuoy } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <LifeBuoy className="w-8 h-8 text-indigo-500" />
          Support Center
        </h1>
        <p className="text-muted-foreground mt-2">Manage customer tickets and escalations.</p>
      </div>
      
      <div className="p-8 text-center text-muted-foreground bg-muted/10 rounded-xl border border-border border-dashed">
        Ticketing system coming soon...
      </div>
    </div>
  );
}
