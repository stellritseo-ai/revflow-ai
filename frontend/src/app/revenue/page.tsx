"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { 
  CreditCard, 
  Calendar, 
  UserMinus, 
  TrendingUp, 
  Activity, 
  ArrowRight, 
  RefreshCcw, 
  BellRing
} from "lucide-react"

export default function RevenueDashboard() {
  const [metrics, setMetrics] = useState({
    open_treatment_value: 0,
    patients_due_recall: 0,
    missed_appointments: 0,
    recovered_revenue: 0,
    no_show_rate: 0,
    cancellation_rate: 0
  })

  useEffect(() => {
    // In a real app, fetch from /api/revenue/metrics
    // For now, setting mock high-value data to showcase the design
    setMetrics({
      open_treatment_value: 245000.50,
      patients_due_recall: 142,
      missed_appointments: 18,
      recovered_revenue: 42500.00,
      no_show_rate: 4.2,
      cancellation_rate: 8.5
    })
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-emerald-500" />
            Revenue Intelligence
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            AI-powered revenue recovery and recall automation engine.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link 
            href="/revenue/automation"
            className="flex items-center gap-2 bg-card hover:bg-muted border border-border px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Activity className="w-4 h-4 text-indigo-500" />
            Automation Rules
          </Link>
          <button className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm shadow-emerald-500/20">
            <RefreshCcw className="w-4 h-4" />
            Sync PMS Data
          </button>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-16 h-16 text-emerald-500" />
          </div>
          <div className="flex flex-col gap-1 relative z-10">
            <span className="text-sm font-medium text-muted-foreground">Open Treatment Value</span>
            <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(metrics.open_treatment_value)}
            </span>
            <span className="text-xs text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full w-fit mt-2">
              +12% vs last month
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Calendar className="w-16 h-16 text-amber-500" />
          </div>
          <div className="flex flex-col gap-1 relative z-10">
            <span className="text-sm font-medium text-muted-foreground">Patients Due Recall</span>
            <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {metrics.patients_due_recall}
            </span>
            <span className="text-xs text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full w-fit mt-2">
              34 High Risk
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <UserMinus className="w-16 h-16 text-rose-500" />
          </div>
          <div className="flex flex-col gap-1 relative z-10">
            <span className="text-sm font-medium text-muted-foreground">Missed Appointments</span>
            <span className="text-3xl font-bold text-rose-600 dark:text-rose-400">
              {metrics.missed_appointments}
            </span>
            <span className="text-xs text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full w-fit mt-2">
              {metrics.no_show_rate}% No Show Rate
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-5 shadow-lg relative overflow-hidden group text-white">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
            <Activity className="w-16 h-16" />
          </div>
          <div className="flex flex-col gap-1 relative z-10">
            <span className="text-sm font-medium text-indigo-100">AI Recovered Revenue</span>
            <span className="text-3xl font-bold">
              {formatCurrency(metrics.recovered_revenue)}
            </span>
            <span className="text-xs text-white bg-white/20 px-2 py-0.5 rounded-full w-fit mt-2">
              This Month
            </span>
          </div>
        </div>
      </div>

      {/* Action Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {/* Unfinished Treatment Module */}
        <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-border flex justify-between items-center bg-muted/30">
            <div>
              <h2 className="text-lg font-bold text-foreground">Unfinished Treatment</h2>
              <p className="text-sm text-muted-foreground">High-value plans waiting to be accepted</p>
            </div>
            <Link href="/revenue/treatment" className="p-2 bg-background border border-border rounded-lg hover:bg-muted transition-colors">
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          </div>
          <div className="p-5 flex-1 flex flex-col gap-4">
            {[
              { patient: "Sarah Jenkins", tx: "Crown & Bridge", value: 4500, priority: "High" },
              { patient: "Michael Chen", tx: "Implant Placement", value: 6200, priority: "High" },
              { patient: "Emma Watson", tx: "Invisalign", value: 5500, priority: "Medium" }
            ].map((opp, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-lg border border-border bg-background hover:border-emerald-500/50 transition-colors group cursor-pointer">
                <div>
                  <div className="font-medium text-sm text-foreground">{opp.patient}</div>
                  <div className="text-xs text-muted-foreground">{opp.tx}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-emerald-600">{formatCurrency(opp.value)}</div>
                  <div className="text-[10px] uppercase font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded w-fit ml-auto mt-1">{opp.priority} Priority</div>
                </div>
              </div>
            ))}
            <Link href="/revenue/treatment" className="text-sm font-medium text-indigo-500 text-center mt-2 hover:underline">View All Opportunities</Link>
          </div>
        </div>

        {/* Recall Engine Module */}
        <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-border flex justify-between items-center bg-muted/30">
            <div>
              <h2 className="text-lg font-bold text-foreground">Recall Engine</h2>
              <p className="text-sm text-muted-foreground">Patients overdue for hygiene/perio</p>
            </div>
            <Link href="/revenue/recall" className="p-2 bg-background border border-border rounded-lg hover:bg-muted transition-colors">
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          </div>
          <div className="p-5 flex-1 flex flex-col gap-4">
            {[
              { patient: "David Smith", type: "6 Mo Prophy", due: "2 weeks ago", risk: "High Churn" },
              { patient: "Jessica Alba", type: "3 Mo Perio", due: "1 month ago", risk: "Medium Churn" },
              { patient: "Robert Downey", type: "6 Mo Prophy", due: "3 days ago", risk: "Low Churn" }
            ].map((recall, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-lg border border-border bg-background hover:border-amber-500/50 transition-colors group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <BellRing className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm text-foreground">{recall.patient}</div>
                    <div className="text-xs text-muted-foreground">{recall.type} • {recall.due}</div>
                  </div>
                </div>
                <div>
                  <div className={`text-[10px] uppercase font-bold px-2 py-1 rounded w-fit ml-auto ${recall.risk.includes("High") ? 'text-rose-600 bg-rose-500/10' : recall.risk.includes("Medium") ? 'text-amber-600 bg-amber-500/10' : 'text-emerald-600 bg-emerald-500/10'}`}>
                    {recall.risk}
                  </div>
                </div>
              </div>
            ))}
            <Link href="/revenue/recall" className="text-sm font-medium text-indigo-500 text-center mt-2 hover:underline">View All Due Recalls</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
