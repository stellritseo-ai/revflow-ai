"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Search, Filter, Phone, MessageSquare, Plus, BellRing, MoreVertical } from "lucide-react"

export default function RecallEnginePage() {
  const [recalls] = useState([
    { id: 1, patient: "David Smith", phone: "(555) 123-4567", type: "6 Mo Prophy", due: "2 weeks ago", risk: "High Churn", status: "Uncontacted" },
    { id: 2, patient: "Jessica Alba", phone: "(555) 987-6543", type: "3 Mo Perio", due: "1 month ago", risk: "Medium Churn", status: "SMS Sent" },
    { id: 3, patient: "Robert Downey", phone: "(555) 456-7890", type: "6 Mo Prophy", due: "3 days ago", risk: "Low Churn", status: "Voice AI Calling" },
    { id: 4, patient: "Emma Stone", phone: "(555) 234-5678", type: "Annual Exam", due: "2 months ago", risk: "High Churn", status: "Uncontacted" },
    { id: 5, patient: "Chris Evans", phone: "(555) 876-5432", type: "3 Mo Perio", due: "1 week ago", risk: "Medium Churn", status: "Uncontacted" },
  ])

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link href="/revenue" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2 w-fit">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <BellRing className="w-8 h-8 text-amber-500" />
            Recall Engine
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Manage overdue patients and automate re-engagement campaigns.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm shadow-amber-500/20">
            <MessageSquare className="w-4 h-4" />
            Bulk SMS Campaign
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between gap-4 bg-muted/20">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search patients..." 
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Recall Type</th>
                <th className="px-6 py-4 font-medium">Due Date</th>
                <th className="px-6 py-4 font-medium">Risk Score</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recalls.map((recall) => (
                <tr key={recall.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{recall.patient}</td>
                  <td className="px-6 py-4 text-muted-foreground">{recall.phone}</td>
                  <td className="px-6 py-4">
                    <span className="bg-secondary px-2.5 py-1 rounded-md text-xs font-medium text-secondary-foreground border border-border">
                      {recall.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-amber-600 dark:text-amber-400">{recall.due}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded w-fit ${recall.risk.includes("High") ? 'text-rose-600 bg-rose-500/10' : recall.risk.includes("Medium") ? 'text-amber-600 bg-amber-500/10' : 'text-emerald-600 bg-emerald-500/10'}`}>
                      {recall.risk}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium ${recall.status === 'Uncontacted' ? 'text-muted-foreground' : 'text-indigo-500'}`}>
                      {recall.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 bg-background border border-border rounded hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors text-muted-foreground">
                        <Phone className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 bg-background border border-border rounded hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors text-muted-foreground">
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
