import React from "react";
import { BarChart, Users, Mail, MessageSquare } from "lucide-react";

export default function MarketingDashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Marketing Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Active Campaigns</h3>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">5</div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Leads Generated</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">120</div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Conversion Rate</h3>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">15.2%</div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Reviews</h3>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">4.8 / 5.0</div>
        </div>
      </div>
    </div>
  );
}
