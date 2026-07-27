"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  DollarSign, TrendingUp, Users, Calendar, PhoneMissed,
  Bot, PhoneOutgoing, ArrowUpRight, ArrowDownRight
} from "lucide-react";

interface KPIData {
  title: string;
  value: string;
  trend: string;
  isUp: boolean;
  icon: React.ElementType;
}

const kpiList: KPIData[] = [
  {
    title: "Today's Revenue",
    value: "$4,250",
    trend: "+12.5% vs last week",
    isUp: true,
    icon: DollarSign,
  },
  {
    title: "Recovered Revenue",
    value: "$1,120",
    trend: "+3.2% vs last week",
    isUp: true,
    icon: TrendingUp,
  },
  {
    title: "Patients Today",
    value: "24",
    trend: "+4 vs last week",
    isUp: true,
    icon: Users,
  },
  {
    title: "Appointments",
    value: "32",
    trend: "-2 vs last week",
    isUp: false,
    icon: Calendar,
  },
  {
    title: "Missed Calls",
    value: "5",
    trend: "-12% vs last week",
    isUp: false,
    icon: PhoneMissed,
  },
  {
    title: "AI Conversations",
    value: "14",
    trend: "+8 vs last week",
    isUp: true,
    icon: Bot,
  },
  {
    title: "New Leads",
    value: "7",
    trend: "+2 vs last week",
    isUp: true,
    icon: PhoneOutgoing,
  },
  {
    title: "Conversion Rate",
    value: "68%",
    trend: "+4.1% vs last week",
    isUp: true,
    icon: TrendingUp,
  },
];

export function KPICards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiList.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <Card
            key={idx}
            className="border-border/60 shadow-xs hover:shadow-md transition-all duration-200 rounded-3xl overflow-hidden relative group bg-card"
          >
            {/* Background Soft Giant Watermark Icon */}
            <div className="absolute top-2 right-2 text-sky-500/10 dark:text-sky-400/10 pointer-events-none group-hover:scale-110 transition-transform duration-300">
              <Icon className="w-16 h-16 -mr-2 -mt-2 stroke-[1.2]" />
            </div>

            <CardContent className="p-5 flex flex-col justify-between h-full relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">{kpi.title}</span>
                <div className="h-8 w-8 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div>
                <div className="text-2xl font-extrabold text-foreground tracking-tight">{kpi.value}</div>
                <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold">
                  {kpi.isUp ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                      <ArrowUpRight className="h-3 w-3" /> {kpi.trend}
                    </span>
                  ) : (
                    <span className="text-rose-500 flex items-center gap-0.5">
                      <ArrowDownRight className="h-3 w-3" /> {kpi.trend}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
