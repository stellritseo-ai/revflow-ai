"use client";

import { useState } from "react";
import { Search, Puzzle, CheckCircle, DownloadCloud, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PLUGINS = [
  { id: "1", name: "Epic EHR Sync", category: "EHR", installed: true, author: "RevFlow AI", icon: "🏥", desc: "Bi-directional sync for Epic Systems." },
  { id: "2", name: "Salesforce CRM", category: "CRM", installed: false, author: "Salesforce", icon: "☁️", desc: "Sync leads and marketing campaigns." },
  { id: "3", name: "Slack Notifications", category: "Communication", installed: true, author: "Slack", icon: "💬", desc: "Real-time alerts for missed calls." },
  { id: "4", name: "Google Analytics 4", category: "Analytics", installed: false, author: "Google", icon: "📊", desc: "Track conversion rates for online booking." },
  { id: "5", name: "Stripe Billing", category: "Payments", installed: false, author: "Stripe", icon: "💳", desc: "Process copays and outstanding balances." },
  { id: "6", name: "AthenaHealth Sync", category: "EHR", installed: false, author: "RevFlow AI", icon: "⚕️", desc: "Real-time appointment scheduling." },
];

export default function IntegrationMarketplace() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const categories = ["All", "EHR", "CRM", "Communication", "Analytics", "Payments"];

  const filteredPlugins = PLUGINS.filter(p => 
    (filter === "All" || p.category === filter) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Integration Marketplace</h2>
          <p className="text-muted-foreground">Connect RevFlow AI with your favorite tools.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search apps..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${filter === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-secondary'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlugins.map(plugin => (
          <div key={plugin.id} className="border rounded-xl p-6 bg-card flex flex-col hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center text-2xl">
                {plugin.icon}
              </div>
              {plugin.installed ? (
                <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <CheckCircle className="h-3 w-3 mr-1" /> Installed
                </span>
              ) : (
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {plugin.category}
                </span>
              )}
            </div>
            
            <h3 className="font-semibold text-lg mb-1">{plugin.name}</h3>
            <p className="text-sm text-muted-foreground mb-4 flex-1">{plugin.desc}</p>
            
            <div className="flex items-center justify-between mt-auto pt-4 border-t">
              <span className="text-xs text-muted-foreground">By {plugin.author}</span>
              <Button variant={plugin.installed ? "outline" : "default"} size="sm">
                {plugin.installed ? "Configure" : "Install App"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
