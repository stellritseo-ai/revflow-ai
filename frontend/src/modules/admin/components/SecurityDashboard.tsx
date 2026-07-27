"use client";

import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, Key, Lock, UserCheck, AlertTriangle, Search, Filter, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const mockAuditLogs = [
  { id: "log-1", timestamp: "2026-07-21 16:48:12", user: "admin@apex.com", action: "LOGIN_SUCCESS", ip: "192.168.1.45", risk: "Low", status: "Allowed" },
  { id: "log-2", timestamp: "2026-07-21 16:42:05", user: "unknown", action: "BRUTE_FORCE_ATTEMPT", ip: "45.142.120.9", risk: "High", status: "Blocked" },
  { id: "log-3", timestamp: "2026-07-21 16:30:19", user: "dr.jenkins@smile.com", action: "TOKEN_REFRESH", ip: "73.180.12.91", risk: "Low", status: "Allowed" },
  { id: "log-4", timestamp: "2026-07-21 16:15:44", user: "reception@smile.com", action: "PATIENT_EXPORT", ip: "73.180.12.91", risk: "Medium", status: "Audited" },
  { id: "log-5", timestamp: "2026-07-21 15:59:01", user: "superadmin@revflow.ai", action: "CONFIG_CHANGE", ip: "10.0.0.1", risk: "Low", status: "Allowed" },
];

export function SecurityDashboard() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = mockAuditLogs.filter(
    (l) => l.user.toLowerCase().includes(searchTerm.toLowerCase()) || l.action.toLowerCase().includes(searchTerm.toLowerCase()) || l.ip.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Security KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-background/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tenant Security Score</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">99.8%</div>
            <p className="text-xs text-muted-foreground mt-1">Zero unhandled breaches</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-background/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Blocked IPs (24h)</CardTitle>
            <ShieldAlert className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-400">14</div>
            <p className="text-xs text-muted-foreground mt-1">Automated rate-limit blocks</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-background/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active JWT Sessions</CardTitle>
            <Key className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground mt-1">Encrypted tenant tokens</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-background/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">HIPAA Audit Compliance</CardTitle>
            <UserCheck className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-400">Verified</div>
            <p className="text-xs text-muted-foreground mt-1">100% Audit log retention</p>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Security Audit Log */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">Platform Security Audit Log</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Real-time immutable event ledger for tenant security compliance</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Stream
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by user, IP or action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b font-semibold">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">User Principal</th>
                  <th className="px-4 py-3">Security Action</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3">Risk Rating</th>
                  <th className="px-4 py-3 text-right">Enforcement</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors font-mono">
                    <td className="px-4 py-3 text-muted-foreground">{log.timestamp}</td>
                    <td className="px-4 py-3 text-foreground font-sans font-medium">{log.user}</td>
                    <td className="px-4 py-3 text-indigo-400 font-semibold">{log.action}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.ip}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-bold ${
                        log.risk === "High" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                        log.risk === "Medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {log.risk}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-sans">
                      <span className={`font-semibold ${log.status === "Blocked" ? "text-rose-400" : "text-emerald-400"}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
