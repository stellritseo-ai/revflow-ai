import React from "react";
import { Activity } from "lucide-react";
import { SystemMonitoringDashboard } from "@/modules/admin/components/SystemMonitoringDashboard";

export default function MonitoringPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Activity className="w-8 h-8 text-indigo-500" />
          System Monitoring
        </h1>
        <p className="text-muted-foreground mt-2">Live view of database, API queues, and server health.</p>
      </div>
      
      <SystemMonitoringDashboard />
    </div>
  );
}
