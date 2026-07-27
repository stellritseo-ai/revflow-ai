"use client";

import React from "react";
import {
  UserPlus, CalendarPlus, UserCog, Calendar,
  Settings, MessageSquare, BarChart, Headset
} from "lucide-react";
import { useRouter } from "next/navigation";

const actions = [
  { name: "Add Patient", icon: UserPlus, href: "/patients", color: "text-sky-500", bg: "bg-sky-500/10" },
  { name: "Book Appointment", icon: CalendarPlus, href: "/calendar", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { name: "Create User", icon: UserCog, href: "/settings/staff", color: "text-purple-500", bg: "bg-purple-500/10" },
  { name: "Open Calendar", icon: Calendar, href: "/calendar", color: "text-orange-500", bg: "bg-orange-500/10" },
  { name: "Clinic Settings", icon: Settings, href: "/settings", color: "text-slate-500", bg: "bg-slate-500/10" },
  { name: "Communication", icon: MessageSquare, href: "/communication", color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { name: "Generate Report", icon: BarChart, href: "/analytics", color: "text-rose-500", bg: "bg-rose-500/10" },
  { name: "Reception Hub", icon: Headset, href: "/voice", color: "text-cyan-500", bg: "bg-cyan-500/10" },
];

export function QuickActions() {
  const router = useRouter();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {actions.map((action, idx) => {
        const Icon = action.icon;
        return (
          <div
            key={idx}
            onClick={() => router.push(action.href)}
            className="group p-4 rounded-3xl border border-border/60 bg-card hover:bg-muted/30 hover:border-indigo-500/30 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col items-center justify-center text-center space-y-2.5"
          >
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${action.bg} ${action.color} group-hover:scale-110 transition-transform duration-200`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-foreground leading-tight">
              {action.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
