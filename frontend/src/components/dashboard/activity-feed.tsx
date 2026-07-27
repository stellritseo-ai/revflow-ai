"use client";

import React from "react";
import { UserPlus, Calendar, Stethoscope, Building, Bot } from "lucide-react";

const activities = [
  {
    id: 1,
    title: "Patient Registered",
    description: "Sarah Jenkins completed online registration.",
    time: "10 mins ago",
    icon: UserPlus,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
  },
  {
    id: 2,
    title: "AI Event",
    description: "RevFlow AI booked an appointment from a missed call.",
    time: "25 mins ago",
    icon: Bot,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
  {
    id: 3,
    title: "Appointment Created",
    description: "Michael Scott scheduled for Teeth Whitening.",
    time: "1 hour ago",
    icon: Calendar,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    id: 4,
    title: "Doctor Added",
    description: "Dr. Emily Chen added to the schedule.",
    time: "2 hours ago",
    icon: Stethoscope,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    id: 5,
    title: "Clinic Updated",
    description: "Business hours updated by admin.",
    time: "5 hours ago",
    icon: Building,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
];

export function ActivityFeed() {
  return (
    <div className="space-y-5">
      {activities.map((activity, index) => {
        const Icon = activity.icon;
        return (
          <div key={activity.id} className="relative flex gap-3.5 items-start">
            {/* Vertical Connector Line */}
            {index !== activities.length - 1 && (
              <div className="absolute left-4 top-9 bottom-[-20px] w-[2px] bg-border/60" />
            )}

            <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${activity.bg} ${activity.color} shadow-2xs`}>
              <Icon className="h-4 w-4" />
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-foreground">{activity.title}</p>
                <span className="text-[10px] text-muted-foreground font-mono">{activity.time}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {activity.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
