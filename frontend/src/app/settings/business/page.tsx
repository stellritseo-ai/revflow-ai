"use client";

import React, { useEffect, useState } from "react";
import { Save, Building2, Phone, Clock, Cpu, Wifi, AlertCircle, ShieldCheck, PhoneOutgoing, Copy, CheckCircle2, Loader2, Zap, ExternalLink, Globe } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useTenant, PmsType } from "@/lib/tenant-context";

interface TwilioStatusData {
  twilio_enabled: boolean;
  phone_number: string | null;
  mode: string;
  studio_flow_enabled: boolean;
  flow_sid: string | null;
  call_method: string;
  webhook_base_url: string;
  inbound_webhook_url: string;
  status_callback_url: string;
}

const PMS_OPTIONS: { value: PmsType; label: string }[] = [
  { value: "dentrix", label: "Dentrix" },
  { value: "open_dental", label: "Open Dental" },
  { value: "eaglesoft", label: "Eaglesoft" },
  { value: "other", label: "Other" },
  { value: "none", label: "Not Connected" },
];

const TIMEZONE_OPTIONS = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
];

export default function BusinessSettingsPage() {
  const { user, initialized } = useAuthStore();
  const { tenant, loading: tenantLoading, updateSettings } = useTenant();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [pmsType, setPmsType] = useState<PmsType>("none");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Twilio configuration state
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioPhone, setTwilioPhone] = useState("");
  const [twilioStatus, setTwilioStatus] = useState<"unchecked" | "checking" | "ok" | "error">("unchecked");
  const [twilioEnabled, setTwilioEnabled] = useState(false);
  const [webhookCopied, setWebhookCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [twilioData, setTwilioData] = useState<TwilioStatusData | null>(null);

  useEffect(() => {
    if (tenant) {
      setName(tenant.name);
      setPhone(tenant.phone_number || "");
      setTimezone(tenant.timezone);
      setPmsType(tenant.pms_type);
      setAiEnabled(tenant.ai_enabled);
    }
  }, [tenant]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await updateSettings({
        name,
        phone_number: phone || null,
        timezone,
        pms_type: pmsType,
        ai_enabled: aiEnabled,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    import("@/lib/api-client").then(({ fetchApi }) => {
      fetchApi<TwilioStatusData>("/calls/twilio/status")
        .then(d => {
          setTwilioData(d);
          setTwilioEnabled(d.twilio_enabled);
          if (d.phone_number) setTwilioPhone(d.phone_number);
          if (d.twilio_enabled) setTwilioStatus("ok");
        })
        .catch(() => {});
    });
  }, [user]);

  const verifyTwilio = async () => {
    if (!twilioSid || !twilioToken) return;
    setTwilioStatus("checking");
    try {
      const { fetchApi } = await import("@/lib/api-client");
      const res = await fetchApi<{ valid: boolean }>("/calls/twilio/verify", {
        method: "POST",
        body: JSON.stringify({ account_sid: twilioSid, auth_token: twilioToken }),
      });
      setTwilioStatus(res.valid ? "ok" : "error");
    } catch {
      setTwilioStatus("error");
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setWebhookCopied(true);
    setTimeout(() => { setWebhookCopied(false); setCopiedUrl(null); }, 2000);
  };

  const inboundUrl = twilioData?.inbound_webhook_url || "http://127.0.0.1:8000/api/v1/calls/webhook/inbound";
  const statusUrl = twilioData?.status_callback_url || "http://127.0.0.1:8000/api/v1/calls/webhook/status";
  const webhookBase = twilioData?.webhook_base_url || "http://127.0.0.1:8000";
  const isNgrok = webhookBase.includes("ngrok") || webhookBase.includes("tunnel") || webhookBase.startsWith("https://");

  if (!initialized || !user) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Business Info</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your clinic's primary configuration and system integrations.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {tenantLoading ? (
        <div className="flex items-center gap-3 text-muted-foreground p-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading clinic data...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8">
          {/* Clinic Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Building2 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Clinic Identity</h2>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Clinic Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="e.g., Sunshine Dental Care"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Primary Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {TIMEZONE_OPTIONS.map(tz => (
                    <option key={tz} value={tz}>{tz.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* PMS Integration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Cpu className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">PMS Integration</h2>
            </div>
            <p className="text-xs text-muted-foreground">Select the Practice Management System your clinic uses.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PMS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPmsType(opt.value)}
                  className={`px-4 py-3 text-sm rounded-lg border text-left transition-all duration-200 ${
                    pmsType === opt.value
                      ? "bg-primary/10 border-primary text-primary font-semibold"
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <button
              type="submit"
              disabled={saving}
              className={`w-full sm:w-auto px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                saved
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
              }`}
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : saved ? "Saved Successfully" : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
