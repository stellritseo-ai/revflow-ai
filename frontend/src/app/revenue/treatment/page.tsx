"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Search, Filter, Phone, MessageSquare, TrendingUp, MoreVertical, CheckCircle2 } from "lucide-react"

export default function TreatmentPipelinePage() {
  const [opportunities] = useState([
    { id: 1, patient: "Sarah Jenkins", tx: "Crown & Bridge", value: 4500, date: "Oct 12, 2023", priority: "High", status: "Open" },
    { id: 2, patient: "Michael Chen", tx: "Implant Placement", value: 6200, date: "Nov 05, 2023", priority: "High", status: "Follow-up Sent" },
    { id: 3, patient: "Emma Watson", tx: "Invisalign", value: 5500, date: "Dec 01, 2023", priority: "Medium", status: "Open" },
    { id: 4, patient: "James Wilson", tx: "Root Canal Therapy", value: 1200, date: "Dec 10, 2023", priority: "High", status: "Scheduled" },
    { id: 5, patient: "Olivia Davis", tx: "Veneers x4", value: 4800, date: "Nov 20, 2023", priority: "Low", status: "Open" },
  ])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link href="/revenue" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2 w-fit">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-emerald-500" />
            Treatment Pipeline
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Track and recover high-value unfinished treatment plans.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            Pipeline Value: <span className="font-bold text-emerald-800">$22,200.00</span>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between gap-4 bg-muted/20">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search treatment plans..." 
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Patient</th>
                <th className="px-6 py-4 font-medium">Treatment</th>
                <th className="px-6 py-4 font-medium">Value</th>
                <th className="px-6 py-4 font-medium">Date Identified</th>
                <th className="px-6 py-4 font-medium">Priority</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {opportunities.map((opp) => (
                <tr key={opp.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{opp.patient}</td>
                  <td className="px-6 py-4 text-muted-foreground">{opp.tx}</td>
                  <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(opp.value)}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{opp.date}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded w-fit ${opp.priority === 'High' ? 'text-rose-600 bg-rose-500/10' : opp.priority === 'Medium' ? 'text-amber-600 bg-amber-500/10' : 'text-slate-600 bg-slate-500/10'}`}>
                      {opp.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium ${opp.status === 'Open' ? 'text-muted-foreground' : opp.status === 'Scheduled' ? 'text-emerald-600' : 'text-indigo-500'}`}>
                      {opp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 bg-background border border-border rounded hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors text-muted-foreground" title="Mark Scheduled">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 bg-background border border-border rounded hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors text-muted-foreground" title="Send SMS">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-muted-foreground hover:text-foreground">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
