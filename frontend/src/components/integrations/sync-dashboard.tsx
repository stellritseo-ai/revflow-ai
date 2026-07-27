"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Play, AlertCircle, CheckCircle2, Loader2, ArrowRight } from "lucide-react"

export interface SyncJob {
  id: string
  provider: string
  sync_type: string
  module: string
  status: "queued" | "running" | "completed" | "failed" | "cancelled" | "retrying"
  started_at?: string
  completed_at?: string
  duration_seconds?: number
  records_synced: number
  records_created: number
  records_updated: number
  errors_count: number
  warnings_count: number
  error_message?: string
  triggered_by: string
  created_at: string
}

interface SyncDashboardProps {
  jobs: SyncJob[]
  isSyncing: boolean
  onTriggerSync: (module: string) => void
}

export function SyncDashboard({ jobs, isSyncing, onTriggerSync }: SyncDashboardProps) {
  const [selectedModule, setSelectedModule] = useState("all")
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
            Completed
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">
            Failed
          </Badge>
        )
      case "running":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 animate-pulse">
            Running
          </Badge>
        )
      case "queued":
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground border-border/40">
            Queued
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return "—"
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}m ${secs}s`
  }

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return "—"
    const date = new Date(isoStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className="space-y-6">
      {/* Metrics Card Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase text-muted-foreground">Connected PMS</CardDescription>
            <CardTitle className="text-2xl font-bold tracking-tight">Open Dental</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-muted-foreground font-medium">Real-time Webhook Active</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase text-muted-foreground">Sync Frequency</CardDescription>
            <CardTitle className="text-2xl font-bold tracking-tight">Hourly</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-muted-foreground">Next scheduled: 14 min</span>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase text-muted-foreground">Records Synced</CardDescription>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {jobs.reduce((acc, job) => acc + (job.status === "completed" ? job.records_synced : 0), 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-muted-foreground">Across all modules</span>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase text-muted-foreground">Failed Jobs (24h)</CardDescription>
            <CardTitle className="text-2xl font-bold tracking-tight text-rose-500">
              {jobs.filter(j => j.status === "failed").length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-muted-foreground">Auto-retry queue active</span>
          </CardContent>
        </Card>
      </div>

      {/* Manual Sync Trigger Card */}
      <Card className="border-border/50 shadow-sm overflow-hidden bg-gradient-to-r from-primary/[0.02] to-transparent">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg">Manual Sync</h3>
              <p className="text-muted-foreground text-sm mt-0.5">
                Force a full or incremental data sync from your Practice Management System immediately.
              </p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={selectedModule}
                onChange={e => setSelectedModule(e.target.value)}
                className="flex h-10 w-full md:w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Modules</option>
                <option value="patients">Patients Only</option>
                <option value="appointments">Appointments Only</option>
                <option value="providers">Providers Only</option>
                <option value="insurance">Insurance Plans</option>
              </select>
              
              <Button 
                disabled={isSyncing} 
                onClick={() => onTriggerSync(selectedModule)}
                className="shadow-md shadow-primary/10 whitespace-nowrap w-full md:w-auto"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Syncing
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Sync
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live / Recent Jobs Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg font-bold tracking-tight">Sync Execution Logs</CardTitle>
            <CardDescription className="text-xs pt-0.5">Real-time status and telemetry of recent sync procedures.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40">
                  <th className="p-3 font-bold text-xs">Job ID</th>
                  <th className="p-3 font-bold text-xs">Module</th>
                  <th className="p-3 font-bold text-xs">Sync Type</th>
                  <th className="p-3 font-bold text-xs">Status</th>
                  <th className="p-3 font-bold text-xs">Duration</th>
                  <th className="p-3 font-bold text-xs text-right">Synced</th>
                  <th className="p-3 font-bold text-xs text-right">Errors</th>
                  <th className="p-3 font-bold text-xs text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
                      No sync executions recorded.
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-muted/20 border-b border-border/30 last:border-0">
                      <td className="p-3 font-mono text-xs text-muted-foreground">{job.id.substring(0, 8)}</td>
                      <td className="p-3 font-semibold capitalize text-sm">{job.module}</td>
                      <td className="p-3 capitalize text-xs text-muted-foreground">{job.sync_type}</td>
                      <td className="p-3">{getStatusBadge(job.status)}</td>
                      <td className="p-3 text-xs font-mono">{formatDuration(job.duration_seconds)}</td>
                      <td className="p-3 text-right font-mono font-semibold text-sm">
                        {job.records_synced}
                      </td>
                      <td className="p-3 text-right">
                        {job.errors_count > 0 ? (
                          <span className="font-mono font-bold text-rose-500">{job.errors_count}</span>
                        ) : (
                          <span className="font-mono text-muted-foreground/40">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right text-xs text-muted-foreground font-mono">
                        {formatDate(job.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
