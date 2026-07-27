"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export default function BusinessHoursPage() {
  return (
    <div className="p-6 md:p-8 max-w-5xl h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Business Hours</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Set weekly operating hours and holiday exceptions.
        </p>
      </div>

      <div className="flex-1 border rounded-lg border-dashed flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary/40" />
        <p>This module is currently under construction.</p>
        <p className="text-sm mt-2">Enterprise deployment scheduled for next phase.</p>
      </div>
    </div>
  );
}
