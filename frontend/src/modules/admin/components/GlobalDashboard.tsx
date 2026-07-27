"use client";

import React from "react";
import { ShieldCheck, Building2, Users, Search, AlertTriangle, CreditCard, Activity, Cpu } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function GlobalDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-indigo-400">
              <Building2 className="w-4 h-4" />
              Total Active Clinics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">1,248</span>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-400">
              <CreditCard className="w-4 h-4" />
              Monthly Recurring Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">$48,200</span>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-400">
              <Activity className="w-4 h-4" />
              AI Requests (Today)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">14,392</span>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-500/10 to-transparent border-rose-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">3</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Health Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-indigo-500" />
                  <span>Main API Server</span>
                </div>
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">Healthy</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-indigo-500" />
                  <span>Database Cluster</span>
                </div>
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">Healthy</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-rose-500" />
                  <span>Worker Queues</span>
                </div>
                <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">High Load</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>• New tenant <strong>Smile Dental</strong> signed up for Professional Plan (2m ago)</p>
              <p>• AI usage spike detected on <strong>Apex Ortho</strong> (15m ago)</p>
              <p>• <strong>Invoice #INV-293</strong> paid successfully (1h ago)</p>
              <p>• Support ticket #402 escalated to urgent (2h ago)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
