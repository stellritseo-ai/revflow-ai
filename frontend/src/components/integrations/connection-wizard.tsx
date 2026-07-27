"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, XCircle, ShieldAlert, Eye, EyeOff } from "lucide-react"
import { fetchApi } from "@/lib/api-client"

interface ConnectionWizardProps {
  isOpen: boolean
  onClose: () => void
  providerId: string | null
  providerName: string
  authMethod: string
  onConnectionSuccess: () => void
  existingCredential?: any
}

export function ConnectionWizard({
  isOpen,
  onClose,
  providerId,
  providerName,
  authMethod,
  onConnectionSuccess,
  existingCredential,
}: ConnectionWizardProps) {
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency_ms?: number } | null>(null)
  
  // Fields state
  const [environment, setEnvironment] = useState("sandbox")
  const [apiUrl, setApiUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [clientSecret, setClientSecret] = useState("")
  const [accessToken, setAccessToken] = useState("")
  const [conflictResolution, setConflictResolution] = useState("keep_pms")
  const [syncInterval, setSyncInterval] = useState(60)
  const [autoSync, setAutoSync] = useState(true)
  
  // UI helpers
  const [showPassword, setShowPassword] = useState(false)

  // Pre-fill if editing an existing credential
  useEffect(() => {
    if (existingCredential) {
      setEnvironment(existingCredential.environment || "sandbox")
      setApiUrl(existingCredential.api_url || "")
      setConflictResolution(existingCredential.default_conflict_resolution || "keep_pms")
      setSyncInterval(existingCredential.sync_interval_minutes || 60)
      setAutoSync(existingCredential.auto_sync_enabled !== false)
      
      // Mask values for editing security
      setApiKey(existingCredential.is_verified ? "••••••••••••••••" : "")
      setUsername(existingCredential.is_verified ? "••••••••" : "")
      setPassword(existingCredential.is_verified ? "••••••••" : "")
      setClientSecret(existingCredential.is_verified ? "••••••••" : "")
      setAccessToken(existingCredential.is_verified ? "••••••••" : "")
    } else {
      // Clear fields
      setEnvironment("sandbox")
      setApiUrl(
        providerId === "open_dental" ? "http://localhost:8000/api/mock/opendental" :
        providerId === "dentrix" ? "https://api.dentrixascend.com/sandbox" :
        providerId === "eaglesoft" ? "http://localhost:8000/api/mock/eaglesoft" :
        providerId === "curve_dental" ? "https://api.curvedental.com/v3" : ""
      )
      setApiKey("")
      setUsername("")
      setPassword("")
      setClientSecret("")
      setAccessToken("")
      setConflictResolution("keep_pms")
      setSyncInterval(60)
      setAutoSync(true)
    }
    setTestResult(null)
  }, [existingCredential, providerId, isOpen])

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetchApi<any>("/integrations/credentials/connect", {
        method: "POST",
        body: JSON.stringify({
          provider: providerId,
          environment,
          api_url: apiUrl,
          api_key: apiKey === "••••••••••••••••" ? null : apiKey,
          username: username === "••••••••" ? null : username,
          password: password === "••••••••" ? null : password,
          client_secret: clientSecret === "••••••••" ? null : clientSecret,
          access_token: accessToken === "••••••••" ? null : accessToken,
          conflict_resolution: conflictResolution,
          sync_interval_minutes: syncInterval,
          auto_sync_enabled: autoSync,
        })
      })
      setTestResult({
        success: res.success,
        message: res.success ? `Successfully verified connection. Latency: ${res.latency_ms}ms` : res.message,
        latency_ms: res.latency_ms,
      })
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Failed to reach PMS api endpoint.",
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetchApi("/integrations/credentials/connect", {
        method: "POST",
        body: JSON.stringify({
          provider: providerId,
          environment,
          api_url: apiUrl,
          api_key: apiKey === "••••••••••••••••" ? null : apiKey,
          username: username === "••••••••" ? null : username,
          password: password === "••••••••" ? null : password,
          client_secret: clientSecret === "••••••••" ? null : clientSecret,
          access_token: accessToken === "••••••••" ? null : accessToken,
          conflict_resolution: conflictResolution,
          sync_interval_minutes: syncInterval,
          auto_sync_enabled: autoSync,
        })
      })
      onConnectionSuccess()
      onClose()
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Failed to connect provider.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border-border/80 shadow-2xl overflow-y-auto max-h-[90vh]" onClose={onClose}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <span>Connect {providerName}</span>
          </DialogTitle>
          <DialogDescription>
            Configure authentication and real-time synchronization rules for your Practice Management System.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5 py-2">
          {/* Environment */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Environment</Label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="environment"
                  value="sandbox"
                  checked={environment === "sandbox"}
                  onChange={() => setEnvironment("sandbox")}
                  className="h-4 w-4 text-primary border-border focus:ring-primary"
                />
                <span className="text-sm">Sandbox / Demo</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="environment"
                  value="production"
                  checked={environment === "production"}
                  onChange={() => setEnvironment("production")}
                  className="h-4 w-4 text-primary border-border focus:ring-primary"
                />
                <span className="text-sm">Production</span>
              </label>
            </div>
          </div>

          {/* API URL */}
          {authMethod !== "none" && (
            <div className="space-y-1.5">
              <Label htmlFor="api-url" className="text-sm font-semibold">API Endpoint URL</Label>
              <Input
                id="api-url"
                type="url"
                required
                placeholder="https://api.yourpms.com/v1"
                value={apiUrl}
                onChange={e => setApiUrl(e.target.value)}
                className="bg-muted/10 border-border/50"
              />
            </div>
          )}

          {/* API Key */}
          {authMethod === "api_key" && (
            <div className="space-y-1.5">
              <Label htmlFor="api-key" className="text-sm font-semibold">Developer API Key</Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter API Key / Token"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="bg-muted/10 border-border/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Username / Password */}
          {authMethod === "username_password" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-sm font-semibold">API Username</Label>
                <Input
                  id="username"
                  type="text"
                  required
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="bg-muted/10 border-border/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-semibold">API Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="bg-muted/10 border-border/50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* OAuth 2.0 Credentials */}
          {authMethod === "oauth2" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="client-id" className="text-sm font-semibold">OAuth Client ID</Label>
                <Input
                  id="client-id"
                  type="text"
                  placeholder="Enter Client ID"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="bg-muted/10 border-border/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client-secret" className="text-sm font-semibold">OAuth Client Secret</Label>
                <Input
                  id="client-secret"
                  type="password"
                  placeholder="Enter Client Secret"
                  value={clientSecret}
                  onChange={e => setClientSecret(e.target.value)}
                  className="bg-muted/10 border-border/50"
                />
              </div>
            </div>
          )}

          <div className="border-t border-border/40 my-4 pt-4 space-y-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sync Configuration</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="resolution" className="text-sm font-semibold">Conflict Resolution</Label>
                <select
                  id="resolution"
                  value={conflictResolution}
                  onChange={e => setConflictResolution(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="keep_pms">Keep PMS (Recommended)</option>
                  <option value="keep_revflow">Keep RevFlow</option>
                  <option value="ask_user">Ask Clinic Staff</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="interval" className="text-sm font-semibold">Sync Frequency</Label>
                <select
                  id="interval"
                  value={String(syncInterval)}
                  onChange={e => setSyncInterval(Number(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="15">Every 15 minutes</option>
                  <option value="30">Every 30 minutes</option>
                  <option value="60">Hourly</option>
                  <option value="1440">Daily</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between bg-muted/5 border border-border/40 p-3 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold cursor-pointer" htmlFor="auto-sync">Enable Automatic Sync</Label>
                <p className="text-xs text-muted-foreground">Keep data updated automatically without manual triggers.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="auto-sync"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          {/* Connection Test Results */}
          {testResult && (
            <div className={`flex gap-2 items-start border p-3 rounded-lg ${testResult.success ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
              {testResult.success ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 shrink-0 mt-0.5" />}
              <div className="text-xs">
                <p className="font-semibold">{testResult.success ? "Success" : "Connection Failed"}</p>
                <p className="mt-0.5 opacity-90">{testResult.message}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-4 border-t border-border/40 justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={testing || loading}
              onClick={handleTestConnection}
              className="mr-auto"
            >
              {testing && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              Test Connection
            </Button>
            
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading || testing}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || testing}>
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              Save Configuration
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
