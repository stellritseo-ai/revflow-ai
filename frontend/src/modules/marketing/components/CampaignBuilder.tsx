import React from "react";
import { Send, FileText, Smartphone, Phone, Sparkles } from "lucide-react";

export function CampaignBuilder() {
  return (
    <div className="bg-card text-card-foreground rounded-xl border shadow p-6 max-w-4xl">
      <h2 className="text-xl font-semibold mb-4">Create New Campaign</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
          <Mail className="h-8 w-8 mb-2" />
          <span>Email</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
          <Smartphone className="h-8 w-8 mb-2" />
          <span>SMS</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
          <Phone className="h-8 w-8 mb-2" />
          <span>Voice</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-blue-500">
          <Sparkles className="h-8 w-8 mb-2" />
          <span>AI Generate</span>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Campaign Name</label>
          <input type="text" className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" placeholder="e.g. Fall Whitening Special" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Audience Segment</label>
          <select className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
            <option>All Patients</option>
            <option>Recall Due</option>
            <option>High Value VIPs</option>
            <option>Custom Segment</option>
          </select>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end">
        <button className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md">
          Next Step
        </button>
      </div>
    </div>
  );
}

// Ensure Mail is imported (Lucide doesn't export Mail directly without import, so let's fix it above)
import { Mail } from "lucide-react";
