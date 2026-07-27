"use client";

import { useState } from "react";
import { Plus, Key, Link as LinkIcon, Activity, Trash2, Webhook, FileText, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Mock data
const INITIAL_KEYS = [
  { id: "1", name: "Zapier Integration", prefix: "rev_xk92", created: "2026-07-21", lastUsed: "2 hrs ago" },
  { id: "2", name: "Custom Billing Sync", prefix: "rev_mm42", created: "2026-07-20", lastUsed: "1 day ago" },
];

const INITIAL_WEBHOOKS = [
  { id: "1", url: "https://api.myapp.com/webhooks/revflow", events: ["appointment.booked", "patient.created"], status: "active" },
];

export default function DeveloperPortal() {
  const [activeTab, setActiveTab] = useState<"keys" | "webhooks" | "docs">("keys");
  const [keys, setKeys] = useState(INITIAL_KEYS);
  const [webhooks, setWebhooks] = useState(INITIAL_WEBHOOKS);

  const generateKey = () => {
    alert("New API Key: rev_" + Math.random().toString(36).substring(7) + "\n\nPlease copy this key now, you won't be able to see it again.");
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Developer Portal</h2>
          <p className="text-muted-foreground">Manage your API keys, webhooks, and integrations.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b pb-2">
        <button
          onClick={() => setActiveTab("keys")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 ${activeTab === "keys" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          API Keys
        </button>
        <button
          onClick={() => setActiveTab("webhooks")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 ${activeTab === "webhooks" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Webhooks
        </button>
        <button
          onClick={() => setActiveTab("docs")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 ${activeTab === "docs" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          API Reference
        </button>
      </div>

      <div className="mt-6">
        {activeTab === "keys" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Active API Keys</h3>
                <p className="text-sm text-muted-foreground">Keys used to authenticate external applications.</p>
              </div>
              <Button onClick={generateKey}>
                <Plus className="h-4 w-4 mr-2" />
                Generate New Key
              </Button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left font-medium p-4">Name</th>
                    <th className="text-left font-medium p-4">Key Prefix</th>
                    <th className="text-left font-medium p-4">Created</th>
                    <th className="text-left font-medium p-4">Last Used</th>
                    <th className="text-left font-medium p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {keys.map((key) => (
                    <tr key={key.id}>
                      <td className="p-4 font-medium flex items-center gap-2">
                        <Key className="h-4 w-4 text-primary" />
                        {key.name}
                      </td>
                      <td className="p-4 text-muted-foreground">{key.prefix}••••••••••••</td>
                      <td className="p-4 text-muted-foreground">{key.created}</td>
                      <td className="p-4 text-muted-foreground">{key.lastUsed}</td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "webhooks" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Webhook Endpoints</h3>
                <p className="text-sm text-muted-foreground">Receive real-time HTTP POST payloads on specific events.</p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Endpoint
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left font-medium p-4">URL Endpoint</th>
                    <th className="text-left font-medium p-4">Subscribed Events</th>
                    <th className="text-left font-medium p-4">Status</th>
                    <th className="text-left font-medium p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {webhooks.map((wh) => (
                    <tr key={wh.id}>
                      <td className="p-4 font-medium flex items-center gap-2">
                        <Webhook className="h-4 w-4 text-blue-500" />
                        {wh.url}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        <div className="flex gap-1 flex-wrap">
                          {wh.events.map(ev => (
                            <span key={ev} className="bg-secondary px-2 py-1 rounded-md text-xs">{ev}</span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-medium">Active</span>
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "docs" && (
          <div className="space-y-6">
            <div className="bg-muted p-6 rounded-lg text-center border">
              <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">RevFlow AI Public API</h3>
              <p className="text-muted-foreground mb-4">Explore the complete OpenAPI specification and interact with our endpoints.</p>
              <Button onClick={() => window.open("http://127.0.0.1:8000/docs", "_blank")}>
                View Swagger UI
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="border p-4 rounded-lg flex gap-4 items-start">
                <Code2 className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Node.js SDK</h4>
                  <p className="text-sm text-muted-foreground mb-2">Official SDK for integrating RevFlow AI into Node.js backend services.</p>
                  <Button variant="link" className="p-0 h-auto">View NPM Package →</Button>
                </div>
              </div>
              <div className="border p-4 rounded-lg flex gap-4 items-start">
                <Code2 className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Python SDK</h4>
                  <p className="text-sm text-muted-foreground mb-2">Official SDK for Python integrations and AI orchestration.</p>
                  <Button variant="link" className="p-0 h-auto">View PyPI Package →</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
