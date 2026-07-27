"use client";

import { useState } from "react";
import { Building2, Palette, Globe, Shield, Users, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PartnerPortal() {
  const [activeTab, setActiveTab] = useState("branding");
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert("Settings saved successfully.");
    }, 1000);
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Partner Portal</h2>
          <p className="text-muted-foreground">Manage your white-label settings, sub-accounts, and platform branding.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-2">
          <button
            onClick={() => setActiveTab("branding")}
            className={`w-full flex items-center gap-2 justify-start px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'branding' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
          >
            <Palette className="h-4 w-4" /> Branding & Theme
          </button>
          <button
            onClick={() => setActiveTab("domain")}
            className={`w-full flex items-center gap-2 justify-start px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'domain' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
          >
            <Globe className="h-4 w-4" /> Custom Domain
          </button>
          <button
            onClick={() => setActiveTab("accounts")}
            className={`w-full flex items-center gap-2 justify-start px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'accounts' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
          >
            <Users className="h-4 w-4" /> Sub-Accounts
          </button>
        </div>

        <div className="md:col-span-3">
          <div className="border rounded-xl bg-card p-6 shadow-sm">
            
            {activeTab === "branding" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-1">White-Label Branding</h3>
                  <p className="text-sm text-muted-foreground">Customize the platform appearance for your clients.</p>
                </div>
                
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Company Name</label>
                    <Input defaultValue="Acme Healthcare Solutions" />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Primary Brand Color (Hex)</label>
                    <div className="flex gap-2">
                      <div className="w-10 h-10 rounded border bg-[#0ea5e9]"></div>
                      <Input defaultValue="#0ea5e9" className="font-mono uppercase" />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Company Logo URL</label>
                    <Input defaultValue="https://acme-health.com/logo.png" />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> Save Branding Settings
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "domain" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-1">Custom Domain Configuration</h3>
                  <p className="text-sm text-muted-foreground">Host the portal on your own domain (e.g. portal.yourdomain.com).</p>
                </div>
                
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Domain Name</label>
                    <Input placeholder="portal.yourdomain.com" />
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">DNS Configuration Required</h4>
                  <p className="text-sm text-muted-foreground mb-4">Please add the following CNAME record to your DNS provider:</p>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm bg-background border rounded p-2 font-mono">
                    <div className="font-semibold text-muted-foreground">Type</div>
                    <div className="font-semibold text-muted-foreground">Name</div>
                    <div className="font-semibold text-muted-foreground">Value</div>
                    
                    <div>CNAME</div>
                    <div>portal</div>
                    <div>cname.revflow.com</div>
                  </div>
                </div>

                <div className="pt-4 border-t flex gap-2">
                  <Button onClick={handleSave} disabled={saving}>Verify Domain</Button>
                </div>
              </div>
            )}

            {activeTab === "accounts" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-1">Sub-Accounts Overview</h3>
                  <p className="text-sm text-muted-foreground">Manage the clinics operating under your partner umbrella.</p>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left font-medium p-4">Clinic Name</th>
                        <th className="text-left font-medium p-4">Status</th>
                        <th className="text-left font-medium p-4">AI Usage (Mo)</th>
                        <th className="text-left font-medium p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="p-4 font-medium flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          Downtown Dental
                        </td>
                        <td className="p-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Active</span></td>
                        <td className="p-4 text-muted-foreground">4,230 calls</td>
                        <td className="p-4"><Button variant="outline" size="sm">Manage</Button></td>
                      </tr>
                      <tr>
                        <td className="p-4 font-medium flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          Westside Wellness
                        </td>
                        <td className="p-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Active</span></td>
                        <td className="p-4 text-muted-foreground">1,105 calls</td>
                        <td className="p-4"><Button variant="outline" size="sm">Manage</Button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
