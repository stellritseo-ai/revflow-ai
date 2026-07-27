"use client"

import React, { useState, useEffect } from "react"
import { ProviderCard, ProviderCatalogItem } from "@/components/integrations/provider-card"
import { ConnectionWizard } from "@/components/integrations/connection-wizard"
import { SyncDashboard, SyncJob } from "@/components/integrations/sync-dashboard"
import { SyncLogs, LogEntry, ErrorEntry } from "@/components/integrations/sync-logs"
import { FieldMapper, FieldMapping } from "@/components/integrations/field-mapper"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Layers, Cable, History, Sparkles } from "lucide-react"
import { fetchApi } from "@/lib/api-client"

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState("providers")
  const [loading, setLoading] = useState(true)
  const [catalog, setCatalog] = useState<ProviderCatalogItem[]>([])
  const [credentials, setCredentials] = useState<any[]>([])
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([])
  const [syncLogs, setSyncLogs] = useState<LogEntry[]>([])
  const [syncErrors, setSyncErrors] = useState<ErrorEntry[]>([])
  const [mappings, setMappings] = useState<FieldMapping[]>([])

  // Selection states
  const [selectedProvider, setSelectedProvider] = useState<ProviderCatalogItem | null>(null)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  // Load all dashboard info
  const loadData = async () => {
    setLoading(true)
    try {
      const [catRes, credRes, jobsRes, logsRes, errorsRes, mapRes] = await Promise.all([
        fetchApi<{ providers: ProviderCatalogItem[] }>("/integrations/catalog"),
        fetchApi<any[]>("/integrations/credentials"),
        fetchApi<SyncJob[]>("/integrations/sync/jobs"),
        fetchApi<LogEntry[]>("/integrations/logs"),
        fetchApi<ErrorEntry[]>("/integrations/errors"),
        fetchApi<FieldMapping[]>("/integrations/mapping"),
      ])
      
      setCatalog(catRes.providers)
      setCredentials(credRes)
      setSyncJobs(jobsRes)
      setSyncLogs(logsRes)
      setSyncErrors(errorsRes)
      setMappings(mapRes)
    } catch (err) {
      console.error("Failed to load PMS integration details", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleConnectClick = (providerId: string) => {
    const provider = catalog.find(p => p.id === providerId)
    if (provider) {
      setSelectedProvider(provider)
      setWizardOpen(true)
    }
  }

  const handleDisconnectClick = async (credentialId: string) => {
    if (!confirm("Are you sure you want to disconnect this integration? Data sync will be paused.")) return
    try {
      await fetchApi(`/integrations/credentials/${credentialId}`, {
        method: "DELETE"
      })
      await loadData()
    } catch (err) {
      console.error("Failed to disconnect", err)
    }
  }

  const handleTriggerSync = async (module: string) => {
    if (credentials.length === 0) return
    setIsSyncing(true)
    try {
      // Find active credential
      const activeCred = credentials.find(c => c.is_active) || credentials[0]
      if (!activeCred) return

      await fetchApi("/integrations/sync/trigger", {
        method: "POST",
        body: JSON.stringify({
          credential_id: activeCred.id,
          module: module,
        })
      })
      
      // Auto reload after 2.5s once sync completes/starts
      setTimeout(async () => {
        const jobs = await fetchApi<SyncJob[]>("/integrations/sync/jobs")
        const logs = await fetchApi<LogEntry[]>("/integrations/logs")
        setSyncJobs(jobs)
        setSyncLogs(logs)
        setIsSyncing(false)
      }, 2500)
    } catch (err) {
      console.error("Failed to trigger sync", err)
      setIsSyncing(false)
    }
  }

  const handleResolveError = async (id: string) => {
    try {
      await fetchApi(`/integrations/errors/${id}/resolve`, {
        method: "PATCH"
      })
      // Reload errors list
      const errors = await fetchApi<ErrorEntry[]>("/integrations/errors")
      setSyncErrors(errors)
    } catch (err) {
      console.error("Failed to resolve error", err)
    }
  }

  const activeCred = credentials.find(c => c.is_active)
  const activeCredId = activeCred?.id
  const hasCredentials = credentials.length > 0

  if (loading && catalog.length === 0) {
    return (
      <div className="h-[70vh] w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto h-full flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PMS Integration Hub</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Connect and synchronize patients, appointments, schedules, and insurance with major Practice Management Systems.
          </p>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadData} 
          disabled={loading}
          className="shadow-sm h-9 bg-background"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* Tabs Header (Custom State-Based Tabs) */}
      <div className="flex bg-muted p-1 border border-border/40 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("providers")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "providers"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Integrations Catalog
        </button>
        <button
          onClick={() => hasCredentials && setActiveTab("dashboard")}
          disabled={!hasCredentials}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            !hasCredentials
              ? "opacity-40 cursor-not-allowed"
              : activeTab === "dashboard"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Cable className="w-3.5 h-3.5" />
          Sync Dashboard
        </button>
        <button
          onClick={() => hasCredentials && setActiveTab("mapping")}
          disabled={!hasCredentials}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            !hasCredentials
              ? "opacity-40 cursor-not-allowed"
              : activeTab === "mapping"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Field Mapping
        </button>
        <button
          onClick={() => hasCredentials && setActiveTab("logs")}
          disabled={!hasCredentials}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            !hasCredentials
              ? "opacity-40 cursor-not-allowed"
              : activeTab === "logs"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Sync Logs & Telemetry
        </button>
      </div>

      {/* Tabs Content */}
      <div className="mt-2">
        {activeTab === "providers" && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map(provider => {
              const cred = credentials.find(c => c.provider === provider.id)
              return (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  isConnected={!!cred}
                  isVerified={cred?.is_verified}
                  isConnecting={loading}
                  onConnect={handleConnectClick}
                  onDisconnect={handleDisconnectClick}
                  credentialId={cred?.id}
                />
              )
            })}
          </div>
        )}

        {activeTab === "dashboard" && hasCredentials && (
          <SyncDashboard
            jobs={syncJobs}
            isSyncing={isSyncing}
            onTriggerSync={handleTriggerSync}
          />
        )}

        {activeTab === "mapping" && hasCredentials && (
          <FieldMapper
            credentialId={activeCredId}
            mappings={mappings}
            onMappingChanged={loadData}
          />
        )}

        {activeTab === "logs" && hasCredentials && (
          <SyncLogs
            logs={syncLogs}
            errors={syncErrors}
            onResolveError={handleResolveError}
          />
        )}
      </div>

      {/* Connection Wizard Modal */}
      {selectedProvider && (
        <ConnectionWizard
          isOpen={wizardOpen}
          onClose={() => {
            setWizardOpen(false)
            setSelectedProvider(null)
          }}
          providerId={selectedProvider.id}
          providerName={selectedProvider.name}
          authMethod={selectedProvider.auth}
          onConnectionSuccess={loadData}
          existingCredential={credentials.find(c => c.provider === selectedProvider.id)}
        />
      )}

    </div>
  )
}
