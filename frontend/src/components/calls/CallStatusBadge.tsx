import React from "react";
import { PhoneMissed, PhoneForwarded, CheckCircle2, AlertCircle, PhoneIncoming } from "lucide-react";
import { cn } from "@/lib/utils";

export type CallStatus = "missed" | "queued" | "calling_back" | "recovered" | "failed";

interface CallStatusBadgeProps {
  status: string;
  className?: string;
}

export function CallStatusBadge({ status, className }: CallStatusBadgeProps) {
  const normalizedStatus = status.toLowerCase() as CallStatus;

  switch (normalizedStatus) {
    case "missed":
      return (
        <span className={cn("inline-flex items-center gap-1.5 rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-600 ring-1 ring-inset ring-red-500/20", className)}>
          <PhoneMissed className="h-3 w-3" />
          Missed
        </span>
      );
    case "queued":
      return (
        <span className={cn("inline-flex items-center gap-1.5 rounded-md bg-slate-500/10 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/20", className)}>
          <AlertCircle className="h-3 w-3" />
          Queued
        </span>
      );
    case "calling_back":
      return (
        <span className={cn("inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-600 ring-1 ring-inset ring-amber-500/20", className)}>
          <PhoneForwarded className="h-3 w-3 animate-pulse" />
          AI Calling...
        </span>
      );
    case "recovered":
      return (
        <span className={cn("inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600 ring-1 ring-inset ring-emerald-500/20", className)}>
          <CheckCircle2 className="h-3 w-3" />
          Recovered
        </span>
      );
    case "failed":
      return (
        <span className={cn("inline-flex items-center gap-1.5 rounded-md bg-rose-500/10 px-2 py-1 text-xs font-medium text-rose-600 ring-1 ring-inset ring-rose-500/20", className)}>
          <AlertCircle className="h-3 w-3" />
          AI Failed
        </span>
      );
    default:
      return (
        <span className={cn("inline-flex items-center gap-1.5 rounded-md bg-slate-500/10 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/20", className)}>
          <PhoneIncoming className="h-3 w-3" />
          {status}
        </span>
      );
  }
}
