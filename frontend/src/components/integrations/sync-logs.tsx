"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, RotateCcw, AlertTriangle, Check, ShieldAlert } from "lucide-react"
import { fetchApi } from "@/lib/api-client"

export interface LogEntry {
  id: string
  job_id: string
  level: "info" | "warning" | "error"
  module: string
  message: string
  record_id?: string
  created_at: string
}

export interface ErrorEntry {
  id: string
  job_id: string
  error_type: string
  error_message: string
  record_id?: string
  module?: string
  is_retried: boolean
  retry_count: number
  resolved: boolean
  created_at: string
}

interface SyncLogsProps {
  logs: LogEntry[]
  errors: ErrorEntry[]
  onResolveError: (errorId: string) => void
}

export function SyncLogs({ logs: initialLogs, errors: initialErrors, onResolveError }: SyncLogsProps) {
  const [activeTab, setActiveTab] = useState<"all" | "errors">("all")
  const [levelFilter, setLevelFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const [logs, setLogs] = useState<LogEntry[]>(initialLogs)
  const [errors, setErrors] = useState<ErrorEntry[]>(initialErrors)

  useEffect(() => {
    setLogs(initialLogs)
  }, [initialLogs])

  useEffect(() => {
    setErrors(initialErrors)
  }, [initialErrors])

  const filteredLogs = logs.filter(log => {
    const matchesLevel = levelFilter === "all" || log.level === levelFilter
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (log.record_id && log.record_id.includes(searchQuery))
    return matchesLevel && matchesSearch
  })

  const filteredErrors = errors.filter(err => {
    const matchesSearch = err.error_message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (err.module && err.module.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (err.record_id && err.record_id.includes(searchQuery))
    return matchesSearch
  })

  const getLogLevelBadge = (level: string) => {
    switch (level) {
      case "error":
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">Error</Badge>
      case "warning":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">Warning</Badge>
      default:
        return <Badge variant="outline" className="bg-muted text-muted-foreground border-border/40">Info</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header and filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Tab switcher */}
        <div className="flex bg-muted p-1 rounded-lg">
          <Button
            variant={activeTab === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("all")}
            className="text-xs h-8"
          >
            All Log Messages
          </Button>
          <Button
            variant={activeTab === "errors" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("errors")}
            className="text-xs h-8 flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            Unresolved Errors
            {errors.filter(e => !e.resolved).length > 0 && (
              <span className="bg-rose-500 text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                {errors.filter(e => !e.resolved).length}
              </span>
            )}
          </Button>
        </div>

        {/* Inputs */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>

          {activeTab === "all" && (
            <select
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value)}
              className="flex h-10 w-[130px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          )}
        </div>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {activeTab === "all" ? (
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40">
                    <th className="p-3 font-bold text-xs">Level</th>
                    <th className="p-3 font-bold text-xs">Module</th>
                    <th className="p-3 font-bold text-xs">Record ID</th>
                    <th className="p-3 font-bold text-xs">Message</th>
                    <th className="p-3 font-bold text-xs text-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                        No logs match filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/20 border-b border-border/30 last:border-0">
                        <td className="p-3">{getLogLevelBadge(log.level)}</td>
                        <td className="p-3 font-semibold text-xs capitalize">{log.module}</td>
                        <td className="p-3 font-mono text-xs text-muted-foreground">{log.record_id || "—"}</td>
                        <td className="p-3 text-sm max-w-md truncate">{log.message}</td>
                        <td className="p-3 text-right text-xs text-muted-foreground font-mono">
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40">
                    <th className="p-3 font-bold text-xs">Error Type</th>
                    <th className="p-3 font-bold text-xs">Module</th>
                    <th className="p-3 font-bold text-xs">Record ID</th>
                    <th className="p-3 font-bold text-xs">Error Description</th>
                    <th className="p-3 font-bold text-xs text-center">Retries</th>
                    <th className="p-3 font-bold text-xs text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredErrors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                        No errors recorded.
                      </td>
                    </tr>
                  ) : (
                    filteredErrors.map((err) => (
                      <tr key={err.id} className="hover:bg-muted/20 border-b border-border/30 last:border-0">
                        <td className="p-3 font-semibold text-xs text-rose-500 font-mono">{err.error_type}</td>
                        <td className="p-3 font-semibold text-xs capitalize">{err.module || "—"}</td>
                        <td className="p-3 font-mono text-xs text-muted-foreground">{err.record_id || "—"}</td>
                        <td className="p-3 text-sm max-w-sm font-medium text-foreground">{err.error_message}</td>
                        <td className="p-3 text-center font-mono text-xs">{err.retry_count}</td>
                        <td className="p-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 bg-transparent flex items-center gap-1"
                            onClick={() => onResolveError(err.id)}
                          >
                            <Check className="w-3.5 h-3.5" />
                            Resolve
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
