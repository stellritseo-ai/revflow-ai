"use client";

import React, { useState } from "react";
import {
  Bot, Cpu, Zap, Sparkles, Sliders, ShieldAlert, CheckCircle2, RefreshCw,
  MessageSquare, FileText, Database, Activity, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SuperAdminAiControlPage() {
  const [selectedPrimaryModel, setSelectedPrimaryModel] = useState("gemini-1.5-pro");
  const [selectedFallbackModel, setSelectedFallbackModel] = useState("gpt-4o");
  const [temperature, setTemperature] = useState("0.2");
  const [maxTokens, setMaxTokens] = useState("1024");
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const handleSaveAiConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setToastNotice("✨ Global AI Provider & Token Configuration saved successfully!");
    setTimeout(() => setToastNotice(null), 4000);
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Toast Notice */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-indigo-500/40 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <Sparkles className="h-5 w-5 text-emerald-400 fill-emerald-400" />
          <span className="text-xs font-bold">{toastNotice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5 text-foreground">
              <Bot className="h-6 w-6 text-indigo-600" />
              Global AI Provider & LLM Engine Control
            </h1>
            <span className="text-xs font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
              Gemini 1.5 Pro Primary
            </span>
          </div>
          <p className="text-muted-foreground text-xs mt-1">
            Configure LLM models, API provider keys, token budgets, RAG prompt safeguards, and response latencies across all 42 dental clinics.
          </p>
        </div>

        <Button
          onClick={handleSaveAiConfig}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold px-5"
        >
          <Save className="h-4 w-4 mr-1.5" /> Save AI Configuration
        </Button>
      </div>

      {/* AI Telemetry Gauge Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-3xl border bg-card shadow-sm space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase">Tokens Processed Today</span>
          <div className="text-3xl font-black text-indigo-600">4,280,500 Tokens</div>
          <p className="text-xs text-muted-foreground">Across all tenant prompts</p>
        </div>

        <div className="p-5 rounded-3xl border bg-card shadow-sm space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase">Average LLM Latency</span>
          <div className="text-3xl font-black text-emerald-600">280ms</div>
          <p className="text-xs text-emerald-600 font-semibold">Low-latency streaming mode</p>
        </div>

        <div className="p-5 rounded-3xl border bg-card shadow-sm space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase">AI Conversation Accuracy</span>
          <div className="text-3xl font-black text-purple-600">98.4%</div>
          <p className="text-xs text-purple-600 font-semibold">RAG Verified Responses</p>
        </div>

        <div className="p-5 rounded-3xl border bg-card shadow-sm space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase">Estimated LLM API Cost</span>
          <div className="text-3xl font-black text-foreground">$142.80 / day</div>
          <p className="text-xs text-muted-foreground">Gemini + OpenAI Combined</p>
        </div>
      </div>

      {/* AI Provider Config Form */}
      <form onSubmit={handleSaveAiConfig} className="p-6 rounded-3xl border bg-card shadow-md space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b">
          <div className="p-2.5 bg-indigo-500/10 rounded-2xl text-indigo-600">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-foreground">Primary & Fallback Model Selection</h2>
            <p className="text-xs text-muted-foreground">Select the primary LLM engine for voice calls and receptionist chat.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-2">
            <label className="font-bold text-muted-foreground">Primary LLM Provider Model</label>
            <select
              value={selectedPrimaryModel}
              onChange={(e) => setSelectedPrimaryModel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-indigo-600"
            >
              <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Recommended - Lowest Latency)</option>
              <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Ultra Fast)</option>
              <option value="gpt-4o">OpenAI GPT-4o Multi-Modal</option>
              <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="font-bold text-muted-foreground">Fallback Failover Model</label>
            <select
              value={selectedFallbackModel}
              onChange={(e) => setSelectedFallbackModel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
            >
              <option value="gpt-4o">OpenAI GPT-4o (Automatic Failover)</option>
              <option value="gemini-1.5-flash">Google Gemini 1.5 Flash</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="font-bold text-muted-foreground">Model Temperature (0.0 = Precise, 1.0 = Creative)</label>
            <input
              type="text"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="font-bold text-muted-foreground">Max Tokens Output Limit</label>
            <input
              type="text"
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
            />
          </div>
        </div>

        <div className="pt-4 border-t flex justify-end">
          <Button type="submit" className="bg-indigo-600 text-white rounded-2xl text-xs font-bold px-6">
            Save AI Settings
          </Button>
        </div>
      </form>

    </div>
  );
}
