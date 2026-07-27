"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Network, Key, CheckCircle, Activity, BookOpen } from "lucide-react";
import Link from "next/link";

export function StudioDashboard() {
  const metrics = [
    { title: "Active Agents", value: "4", icon: Bot, href: "/ai-studio/agent-builder" },
    { title: "Active Workflows", value: "12", icon: Network, href: "/ai-studio/workflow-builder" },
    { title: "Prompt Versions", value: "34", icon: Key, href: "/ai-studio/prompt-builder" },
    { title: "Knowledge Sources", value: "8", icon: BookOpen, href: "#" },
  ];

  return (
    <div className="space-y-8">
      {/* Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <Link key={i} href={m.href}>
            <Card className="hover:border-indigo-500/50 transition-colors cursor-pointer group">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{m.title}</p>
                  <p className="text-3xl font-bold mt-2">{m.value}</p>
                </div>
                <div className="p-3 bg-indigo-500/10 rounded-full group-hover:bg-indigo-500/20 transition-colors">
                  <m.icon className="w-6 h-6 text-indigo-500" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              Conversation Automation Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-lg border border-dashed border-border">
              <p className="text-muted-foreground">Automation chart loading...</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-500" />
              AI Accuracy Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[300px] space-y-4">
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-purple-500">
              94%
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Based on fallback rates and human escalation tracking over the last 30 days.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
