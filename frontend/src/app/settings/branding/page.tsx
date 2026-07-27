"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Palette, Image as ImageIcon, Type, MessageSquare, Paintbrush } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface Branding {
  id?: string;
  logo_url: string | null;
  primary_color: string | null;
  email_signature: string | null;
  sms_signature: string | null;
}

export default function BrandingPage() {
  const [branding, setBranding] = useState<Branding>({
    logo_url: "",
    primary_color: "#3b82f6",
    email_signature: "Best regards,\nThe Team at Smile Dental",
    sms_signature: "Reply STOP to opt out.",
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<Branding[]>("/clinic/branding");
      if (data && data.length > 0) {
        setBranding(data[0]);
      }
    } catch (err) {
      console.error("Failed to load branding", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (field: keyof Branding, value: string) => {
    setBranding(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (branding.id) {
        await fetchApi(`/clinic/branding/${branding.id}`, {
          method: "PUT",
          body: JSON.stringify(branding)
        });
      } else {
        const newBranding = await fetchApi<Branding>("/clinic/branding", {
          method: "POST",
          body: JSON.stringify(branding)
        });
        setBranding(newBranding);
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
          <h1 className="text-2xl font-bold tracking-tight">Branding & Comms</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Customize how your clinic looks and communicates with patients.
          </p>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving} className="flex items-center gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paintbrush className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Visual Identity */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b pb-2">
            <Palette className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-semibold">Visual Identity</h2>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Brand Logo URL</label>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl border bg-muted/20 flex items-center justify-center overflow-hidden shrink-0">
                {branding.logo_url ? (
                  <img src={branding.logo_url} alt="Logo" className="object-contain w-full h-full p-2" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground opacity-50" />
                )}
              </div>
              <input
                value={branding.logo_url || ""}
                onChange={(e) => handleChange("logo_url", e.target.value)}
                placeholder="https://example.com/logo.png"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center justify-between">
              Primary Brand Color
              <span className="text-muted-foreground font-mono text-xs">{branding.primary_color}</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={branding.primary_color || "#000000"}
                onChange={(e) => handleChange("primary_color", e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <div className="flex-1 space-y-1">
                <p className="text-xs text-muted-foreground">This color will be used in patient-facing portals and emails.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Communications */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b pb-2">
            <MessageSquare className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-semibold">Signatures</h2>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email Footer / Signature</label>
            <textarea
              value={branding.email_signature || ""}
              onChange={(e) => handleChange("email_signature", e.target.value)}
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">Appended to automated emails like appointment confirmations.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">SMS Footer</label>
            <input
              value={branding.sms_signature || ""}
              onChange={(e) => handleChange("sms_signature", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">Keep this short (e.g., Reply STOP to opt-out).</p>
          </div>
        </section>
      </div>

    </div>
  );
}
