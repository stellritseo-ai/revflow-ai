"use client";

import React from "react";
import { Activity, Server, Database, Cpu, HardDrive, CheckCircle2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const services = [
  { name: "FastAPI Application Server", status: "Operational", uptime: "99.99%", latency: "14ms", icon: Server },
  { name: "PostgreSQL Database Cluster", status: "Operational", uptime: "100.0%", latency: "2ms", icon: Database },
  { name: "Redis Key-Value Cache", status: "Operational", uptime: "99.98%", latency: "1ms", icon: Cpu },
  { name: "MinIO Object Storage", status: "Operational", uptime: "99.95%", latency: "8ms", icon: HardDrive },
];

export function SystemMonitoringDashboard() {
  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-background/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overall System Status</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">100% Operational</div>
            <p className="text-xs text-muted-foreground mt-1">All microservices green</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-background/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg API Latency</CardTitle>
            <Activity className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-400">18.4 ms</div>
            <p className="text-xs text-muted-foreground mt-1">p99 response time</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-background/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14.2%</div>
            <p className="text-xs text-muted-foreground mt-1">across Kubernetes nodes</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-background/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Memory Allocation</CardTitle>
            <HardDrive className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4 GB / 8.0 GB</div>
            <p className="text-xs text-muted-foreground mt-1">30% total memory pool</p>
          </CardContent>
        </Card>
      </div>

      {/* Services Grid */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">Core Infrastructure Microservices</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Real-time health status of RevFlow AI production environment</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            Check Health Now
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {services.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={idx} className="flex items-center justify-between p-4 rounded-xl border bg-muted/10">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">{s.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Latency: {s.latency} • Uptime: {s.uptime}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    {s.status}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
