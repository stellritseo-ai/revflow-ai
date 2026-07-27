"use client"

import React, { useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  BarChart3, 
  Filter, 
  Download, 
  Plus, 
  MoreVertical,
  Calendar as CalendarIcon,
  PieChart,
  LineChart
} from "lucide-react"

export default function CustomReportsPage() {
  const [reports] = useState([
    { id: 1, name: "Monthly Revenue by Provider", lastRun: "Today, 08:30 AM", type: "Bar Chart" },
    { id: 2, name: "New Patients Acquisition Source", lastRun: "Yesterday, 14:15 PM", type: "Pie Chart" },
    { id: 3, name: "No-Show Rate vs Weather", lastRun: "Oct 12, 2023", type: "Line Chart" },
    { id: 4, name: "Insurance Claim Aging", lastRun: "Oct 01, 2023", type: "Data Table" },
    { id: 5, name: "AI Call Resolution Rate", lastRun: "Sep 28, 2023", type: "Line Chart" },
  ])

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link href="/analytics" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2 w-fit">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-500" />
            Custom Reports
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Build, save, and schedule custom analytics reports.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm shadow-indigo-500/20">
            <Plus className="w-4 h-4" />
            New Report
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between gap-4 bg-muted/20">
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
              <Filter className="w-4 h-4" />
              Filter By
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
              <CalendarIcon className="w-4 h-4" />
              Date Range
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Report Name</th>
                <th className="px-6 py-4 font-medium">Visualization Type</th>
                <th className="px-6 py-4 font-medium">Last Run</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-6 py-4 font-medium text-foreground">{report.name}</td>
                  <td className="px-6 py-4 text-muted-foreground flex items-center gap-2">
                    {report.type === 'Bar Chart' && <BarChart3 className="w-4 h-4" />}
                    {report.type === 'Pie Chart' && <PieChart className="w-4 h-4" />}
                    {report.type === 'Line Chart' && <LineChart className="w-4 h-4" />}
                    {report.type === 'Data Table' && <Filter className="w-4 h-4" />}
                    {report.type}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{report.lastRun}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 bg-background border border-border rounded hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors text-muted-foreground" title="Download CSV">
                        <Download className="w-4 h-4" />
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
