"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart3, TrendingUp, Users, Calendar, Bot, Activity, Sparkles, 
  ArrowUpRight, ArrowDownRight, Send, Download, DollarSign, ShieldCheck,
  UserCheck, PhoneMissed, Clock, CheckCircle2, RefreshCw, Zap
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

// Monthly Revenue Comparison (Without AI vs With RevFlow AI)
const revenueGrowthData = [
  { month: "Jan", legacyWithoutAi: 88000, withRevflowAi: 112000, aiUplift: 24000 },
  { month: "Feb", legacyWithoutAi: 91000, withRevflowAi: 119000, aiUplift: 28000 },
  { month: "Mar", legacyWithoutAi: 89000, withRevflowAi: 124000, aiUplift: 35000 },
  { month: "Apr", legacyWithoutAi: 92000, withRevflowAi: 131000, aiUplift: 39000 },
  { month: "May", legacyWithoutAi: 95000, withRevflowAi: 138000, aiUplift: 43000 },
  { month: "Jun", legacyWithoutAi: 94000, withRevflowAi: 142850, aiUplift: 48850 },
];

export default function AnalyticsDashboard() {
  const [query, setQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      role: "ai",
      text: "Good morning Doctor! RevFlow AI generated +$38,400 in incremental revenue this month by converting 92 missed call opportunities and automated 3-month recalls. How can I assist your executive analysis today?"
    }
  ]);

  const maxRevenue = Math.max(...revenueGrowthData.map(d => d.withRevflowAi));

  const handleAskAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userQuery = query.trim();
    setChatHistory(prev => [...prev, { role: "user", text: userQuery }]);
    setQuery("");
    setIsTyping(true);

    setTimeout(() => {
      let aiResponse = "RevFlow AI operations are performing at 98.4% accuracy.";
      const q = userQuery.toLowerCase();
      
      if (q.includes("remove") || q.includes("human") || q.includes("takeover") || q.includes("staff")) {
        aiResponse = "Only 14 out of 156 patient conversations (8.9%) required human staff takeover this month. 91.1% of all patient bookings were completely automated by AI!";
      } else if (q.includes("revenue") || q.includes("increase") || q.includes("money") || q.includes("growth")) {
        aiResponse = "RevFlow AI increased monthly revenue by +$38,400 (+26.8% uplift) by capturing after-hours calls, executing 3-month automated recalls, and web chat bookings.";
      } else if (q.includes("missed") || q.includes("call")) {
        aiResponse = "AI auto-responded to 92 missed phone calls within 3.2 seconds, recovering 46 confirmed appointments valued at $28,600.";
      } else if (q.includes("doctor") || q.includes("jenkins")) {
        aiResponse = "Dr. Sarah Jenkins generated $48,500 this month, with 42% of bookings coming directly through AI voice and recall outreach.";
      }
      
      setChatHistory(prev => [...prev, { role: "ai", text: aiResponse }]);
      setIsTyping(false);
    }, 1200);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              AI Revenue Growth & ROI Analytics Active
            </span>
            <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              +$38,400 Monthly AI Revenue Lift
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-white">
            <BarChart3 className="h-8 w-8 text-indigo-400" />
            Executive Intelligence & AI Revenue ROI Report
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Real-time business analytics measuring AI revenue uplift, staff takeover rates, missed call recovery, and patient lifetime value retention.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 relative z-10">
          <Button
            onClick={() => {
              alert("Exporting Executive AI Revenue Report (PDF/CSV)...");
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-5 py-2.5 shadow-lg shadow-indigo-600/30 flex items-center gap-2 font-medium transition-all active:scale-95 text-xs"
          >
            <Download className="h-4 w-4" />
            Export Executive Report
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Production */}
        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Monthly Revenue</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">$142,850</div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>+26.8% YoY Increase</span>
            </div>
          </div>
        </div>

        {/* AI Revenue Uplift */}
        <div className="p-5 rounded-2xl border bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">AI Incremental Revenue Lift</span>
            <div className="p-2 rounded-xl bg-white/10 text-emerald-400 border border-white/20">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <div className="text-3xl font-black text-emerald-400 tracking-tight">+$38,400 / mo</div>
            <div className="flex items-center gap-1 text-xs text-slate-300 font-medium mt-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Revenue generated purely by AI</span>
            </div>
          </div>
        </div>

        {/* Staff Takeover Rate (How many clients/staff remove AI) */}
        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Human Staff Takeovers</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">14 Cases (8.9%)</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>91.1% Fully Autonomous AI Rate</span>
            </div>
          </div>
        </div>

        {/* Missed Call Recovery */}
        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Missed Call Recovery</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <PhoneMissed className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">$28,600</div>
            <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
              <span>46 appointments saved</span>
            </div>
          </div>
        </div>

      </div>

      {/* Analytics Main Body: Chart + AI Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT CHART: Revenue Growth Comparison (8 Cols) */}
        <div className="lg:col-span-8 bg-card border border-border rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-500" />
                Clinic Revenue Growth: Without AI vs. With RevFlow AI
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Visualizing baseline staff production vs. incremental revenue added by AI voice, SMS, and recalls.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className="text-muted-foreground">Without AI</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-indigo-600" />
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">With RevFlow AI (+$38.4k)</span>
              </div>
            </div>
          </div>

          {/* Bar Comparison Graphic */}
          <div className="pt-6 pb-2">
            <div className="relative h-64 w-full flex items-end justify-between gap-3 sm:gap-6 border-b border-border/60 pb-3">
              {revenueGrowthData.map((d, i) => {
                const totalPct = (d.withRevflowAi / maxRevenue) * 100;
                const legacyPct = (d.legacyWithoutAi / maxRevenue) * 100;
                
                return (
                  <div key={i} className="relative flex flex-col items-center flex-1 h-full justify-end group">
                    
                    {/* Tooltip */}
                    <div className="absolute -top-12 bg-slate-900 text-white text-[11px] p-2 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none border border-indigo-500/40 whitespace-nowrap">
                      <div className="font-bold">{d.month}: {formatCurrency(d.withRevflowAi)}</div>
                      <div className="text-emerald-400 font-mono text-[10px]">AI Lift: +{formatCurrency(d.aiUplift)}</div>
                    </div>
                    
                    {/* Double Stacked Bar Container */}
                    <div className="w-full max-w-[48px] h-full flex items-end gap-1 relative justify-center">
                      
                      {/* Legacy Bar */}
                      <div
                        className="w-1/2 bg-slate-300 dark:bg-slate-700 rounded-t-md transition-all duration-500 group-hover:bg-slate-400"
                        style={{ height: `${legacyPct}%` }}
                      />

                      {/* With AI Bar */}
                      <div
                        className="w-1/2 bg-gradient-to-t from-indigo-600 to-purple-600 rounded-t-md transition-all duration-500 group-hover:from-indigo-500 group-hover:to-purple-500 shadow-lg shadow-indigo-600/20"
                        style={{ height: `${totalPct}%` }}
                      />
                    </div>
                    
                    <span className="text-xs font-bold text-muted-foreground mt-3">{d.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Insights Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t text-xs">
            <div className="p-3 rounded-2xl bg-muted/20 border space-y-1">
              <span className="font-bold text-muted-foreground text-[10px] uppercase">Missed Call Recovery</span>
              <div className="font-extrabold text-foreground text-sm">+$18,200 / mo</div>
              <p className="text-[10px] text-muted-foreground">Captured after-hours callers</p>
            </div>

            <div className="p-3 rounded-2xl bg-muted/20 border space-y-1">
              <span className="font-bold text-muted-foreground text-[10px] uppercase">3-Month Recalls</span>
              <div className="font-extrabold text-emerald-600 text-sm">+$12,400 / mo</div>
              <p className="text-[10px] text-muted-foreground">Pre-outreach 1 week prior</p>
            </div>

            <div className="p-3 rounded-2xl bg-muted/20 border space-y-1">
              <span className="font-bold text-muted-foreground text-[10px] uppercase">24/7 Web Chat</span>
              <div className="font-extrabold text-indigo-600 text-sm">+$7,800 / mo</div>
              <p className="text-[10px] text-muted-foreground">Instant appointment booking</p>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: AI Executive Assistant Chatbot (4 Cols) */}
        <div className="lg:col-span-4 bg-card border border-border rounded-3xl shadow-xl flex flex-col overflow-hidden h-[500px] lg:h-auto">
          
          <div className="p-4 border-b bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 text-white flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">AI Executive Analyst</h2>
              <p className="text-[11px] text-indigo-200">Ask real-time clinic revenue insights</p>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 [scrollbar-width:thin] bg-muted/5">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-xs shadow-md'
                    : 'bg-background text-foreground border border-border rounded-tl-xs shadow-xs font-medium'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-background text-foreground border rounded-2xl rounded-tl-xs px-4 py-3 text-xs flex gap-1.5 items-center">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-spin" />
                  <span className="font-semibold text-indigo-600">Analyzing revenue metrics...</span>
                </div>
              </div>
            )}
          </div>

          {/* Query Input */}
          <div className="p-3 border-t bg-background shrink-0">
            <form onSubmit={handleAskAI} className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about AI revenue, staff takeovers, calls..."
                className="w-full bg-muted/30 border rounded-2xl pl-4 pr-10 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
              />
              <button
                type="submit"
                disabled={!query.trim() || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
