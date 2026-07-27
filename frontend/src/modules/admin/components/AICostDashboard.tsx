"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, DollarSign, Database, Phone, MessageSquare } from "lucide-react";

export function AICostDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-indigo-400">Total API Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">$1,204.50</span>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-400">Gemini Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">$450.20</span>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-emerald-400">Voice TTS Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">$380.10</span>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-400">SMS Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">$310.00</span>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-400">Storage Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">$64.20</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Usage Tenants</CardTitle>
          <CardDescription>Clinics with highest resource consumption this month.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Example item */}
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Smile Dental</p>
                <p className="text-xs text-muted-foreground">Enterprise Plan</p>
              </div>
              <div className="flex gap-6">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Activity className="w-3 h-3"/> AI Tokens</span>
                  <span className="font-mono text-sm">4.2M</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3"/> Voice Min</span>
                  <span className="font-mono text-sm">1,200</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3"/> Est. Cost</span>
                  <span className="font-mono text-sm text-rose-400">$124.50</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Apex Ortho</p>
                <p className="text-xs text-muted-foreground">Professional Plan</p>
              </div>
              <div className="flex gap-6">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Activity className="w-3 h-3"/> AI Tokens</span>
                  <span className="font-mono text-sm">1.8M</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3"/> Voice Min</span>
                  <span className="font-mono text-sm">450</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3"/> Est. Cost</span>
                  <span className="font-mono text-sm text-amber-400">$48.20</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
