"use client";

import React, { useEffect, useState } from "react";
import { Loader2, ShieldCheck, History, GlobeLock, Fingerprint } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface SecuritySetting {
  id?: string;
  session_timeout_minutes: number;
  audit_logging_enabled: boolean;
}

export default function SecurityPage() {
  const [security, setSecurity] = useState<SecuritySetting>({
    session_timeout_minutes: 60,
    audit_logging_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<SecuritySetting[]>("/clinic/security");
      if (data && data.length > 0) {
        setSecurity(data[0]);
      }
    } catch (err) {
      console.error("Failed to load security settings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (field: keyof SecuritySetting, value: any) => {
    setSecurity(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (security.id) {
        await fetchApi(`/clinic/security/${security.id}`, {
          method: "PUT",
          body: JSON.stringify(security)
        });
      } else {
        const newSec = await fetchApi<SecuritySetting>("/clinic/security", {
          method: "POST",
          body: JSON.stringify(security)
        });
        setSecurity(newSec);
      }
      setHasChanges(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl space-y-10">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security & Privacy</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure access controls, session limits, and HIPAA audit trails.
          </p>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving} className="flex items-center gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Save Security Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* Session Management */}
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <GlobeLock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Session Management</h2>
              <p className="text-xs text-muted-foreground">Control how long users stay logged in.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Auto-Logout Timeout</label>
                <p className="text-xs text-muted-foreground">Inactivity duration (minutes) before requiring re-authentication.</p>
              </div>
              <select
                value={security.session_timeout_minutes}
                onChange={(e) => handleChange("session_timeout_minutes", parseInt(e.target.value, 10))}
                className="flex h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>1 Hour</option>
                <option value={120}>2 Hours</option>
                <option value={480}>8 Hours</option>
              </select>
            </div>
          </div>
        </section>

        {/* Audit Logging */}
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Compliance Audit Trails</h2>
              <p className="text-xs text-muted-foreground">HIPAA-compliant logging of system access and modifications.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <label className="text-sm font-medium">Enable Audit Logging</label>
                <p className="text-xs text-muted-foreground max-w-md">Record all actions performed by staff and AI, including record views, edits, and exports.</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange("audit_logging_enabled", !security.audit_logging_enabled)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${security.audit_logging_enabled ? "bg-primary" : "bg-input"}`}
              >
                <span className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out ${security.audit_logging_enabled ? "translate-x-2" : "-translate-x-2"}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Advanced Access */}
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500">
              <Fingerprint className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Advanced Access Control</h2>
              <p className="text-xs text-muted-foreground">IP whitelisting and 2FA requirements.</p>
            </div>
          </div>

          <div className="flex items-center justify-center h-24 border border-dashed rounded-lg bg-muted/10 text-muted-foreground text-sm">
            Available on Enterprise Plan
          </div>
        </section>

      </div>
    </div>
  );
}
