"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ShieldCheck, Building2, Users, Bot, Cpu, Lock, DollarSign,
  PhoneCall, Phone, Sliders, Megaphone, FileText, Activity, Search, Bell, Sparkles,
  ChevronDown, Server, RefreshCw, Command, Globe, CheckCircle2, AlertTriangle,
  X, Send, ArrowUpRight, Sun, Moon, LogOut, User, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";

const SUPER_ADMIN_NAV = [
  {
    group: "Command Center",
    items: [
      { title: "Global Dashboard", icon: LayoutDashboard, href: "/super-admin" },
      { title: "Live Operations Stream", icon: Activity, href: "/super-admin/monitoring" },
    ]
  },
  {
    group: "Tenant & User Access",
    items: [
      { title: "Clinic Tenants", icon: Building2, href: "/super-admin/tenants" },
      { title: "Global Users Roster", icon: Users, href: "/super-admin/profile" },
    ]
  },
  {
    group: "AI & Telephony Engine",
    items: [
      { title: "AI Control Center", icon: Bot, href: "/super-admin/ai-control" },
      { title: "Voice Telephony Analytics", icon: PhoneCall, href: "/super-admin/voice" },
      { title: "Phone Provisioning", icon: Phone, href: "/super-admin/phone-numbers" },
    ]
  },
  {
    group: "SaaS Business & System",
    items: [
      { title: "Subscriptions & MRR", icon: DollarSign, href: "/super-admin/subscriptions" },
      { title: "Infrastructure Monitoring", icon: Cpu, href: "/super-admin/infrastructure" },
      { title: "Security & Audit Logs", icon: ShieldCheck, href: "/super-admin/security" },
      { title: "Feature Flags", icon: Sliders, href: "/super-admin/feature-flags" },
      { title: "Broadcast Notifications", icon: Megaphone, href: "/super-admin/notifications" },
    ]
  }
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [commandQuery, setCommandQuery] = useState("");
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // Default Light Mode!

  // Toast Notification State
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // AI Assistant Chat State
  const [aiInput, setAiInput] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const [aiChatHistory, setAiChatHistory] = useState([
    {
      role: "ai",
      text: "Hello Owner! I am your RevFlow Enterprise Executive AI Assistant. Ask me anything about clinic health, platform MRR, active calls, or security alerts."
    }
  ]);

  // Command Palette Keyboard Shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    setToastNotice("🔒 Logging out of Super Admin Command Center...");
    setTimeout(() => {
      logout();
      router.push("/auth/login");
    }, 700);
  };

  const handleAskAiAssistant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const query = aiInput.trim();
    setAiChatHistory(prev => [...prev, { role: "user", text: query }]);
    setAiInput("");
    setAiThinking(true);

    setTimeout(() => {
      let reply = "All platform services are operational at 99.99% uptime.";
      const q = query.toLowerCase();

      if (q.includes("revenue") || q.includes("mrr") || q.includes("money")) {
        reply = "Current Platform MRR is $184,500/mo across 42 active clinic tenants (+19.2% MoM growth). Today's production is $8,450.";
      } else if (q.includes("inactive") || q.includes("suspend") || q.includes("clinic")) {
        reply = "Out of 42 clinic tenants, 40 are active, 2 are in trial, and 0 are suspended. Westside Pediatrics has high volume today (380 calls).";
      } else if (q.includes("call") || q.includes("voice") || q.includes("minutes")) {
        reply = "1,420 AI voice calls processed today across all clinics. 48,290 voice minutes consumed this month with an average latency of 280ms.";
      } else if (q.includes("security") || q.includes("alert")) {
        reply = "0 critical security alerts detected. 3 failed login attempts blocked by rate limiter. MFA adoption is 94.2%.";
      } else if (q.includes("health") || q.includes("server")) {
        reply = "PostgreSQL DB latency: 1.2ms. Redis Queue: 0 pending jobs. ElevenLabs Voice API: Healthy. Overall System Health Score: 98.4/100.";
      }

      setAiChatHistory(prev => [...prev, { role: "ai", text: reply }]);
      setAiThinking(false);
    }, 1100);
  };

  return (
    <div className={cn(
      "flex h-screen font-sans overflow-hidden transition-colors duration-200",
      isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    )}>
      
      {/* Toast Notice */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-indigo-500/40 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <Sparkles className="h-5 w-5 text-emerald-400 fill-emerald-400" />
          <span className="text-xs font-bold">{toastNotice}</span>
        </div>
      )}

      {/* LEFT COMMAND SIDEBAR */}
      <aside className={cn(
        "w-64 shrink-0 border-r flex flex-col justify-between z-30 transition-colors duration-200",
        isDarkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white shadow-sm"
      )}>
        <div className="flex flex-col h-full justify-between">
          
          {/* Top Section: Logo & Nav */}
          <div>
            {/* Logo & Platform Identifier */}
            <div className={cn(
              "p-5 border-b flex items-center justify-between",
              isDarkMode ? "border-slate-800" : "border-slate-200"
            )}>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-emerald-500 text-white font-black flex items-center justify-center text-sm shadow-xl">
                  RF
                </div>
                <div>
                  <div className={cn("font-extrabold text-sm tracking-tight flex items-center gap-1.5", isDarkMode ? "text-white" : "text-slate-900")}>
                    RevFlow OS <span className="text-[9px] font-black uppercase bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">PROD</span>
                  </div>
                  <div className={cn("text-[10px] font-mono", isDarkMode ? "text-slate-400" : "text-slate-500")}>Enterprise Command Desk</div>
                </div>
              </div>
            </div>

            {/* Super Admin Navigation Group List */}
            <nav className="p-4 space-y-5 overflow-y-auto max-h-[calc(100vh-180px)] [scrollbar-width:thin]">
              {SUPER_ADMIN_NAV.map((group) => (
                <div key={group.group} className="space-y-1">
                  <div className={cn("px-2 text-[10px] font-bold uppercase tracking-wider", isDarkMode ? "text-slate-500" : "text-slate-400")}>
                    {group.group}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/super-admin");
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.title}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all",
                            isActive
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                              : isDarkMode
                              ? "text-slate-400 hover:bg-slate-900 hover:text-white"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          )}
                        >
                          <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : isDarkMode ? "text-slate-400" : "text-slate-500")} />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* Bottom Section: Platform Owner Profile Card & Logout Button */}
          <div className={cn(
            "p-3.5 border m-3 rounded-2xl flex items-center justify-between gap-2 shadow-xs",
            isDarkMode ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-slate-50"
          )}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-md shrink-0">
                SA
              </div>
              <div className="min-w-0 flex-1">
                <div className={cn("text-xs font-bold truncate", isDarkMode ? "text-white" : "text-slate-900")}>
                  {user?.first_name || "Platform Owner"}
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono truncate flex items-center gap-1 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Super Admin
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Log out of Super Admin"
              className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition-all shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

        </div>
      </aside>

      {/* RIGHT MAIN COMMAND CENTER BODY */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* TOP NAVIGATION BAR */}
        <header className={cn(
          "h-16 border-b px-6 flex items-center justify-between shrink-0 z-20 transition-colors duration-200",
          isDarkMode ? "border-slate-800/80 bg-slate-950/90 backdrop-blur-md" : "border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs"
        )}>
          
          {/* Universal Command Palette Search Button */}
          <button
            onClick={() => setIsCommandOpen(true)}
            className={cn(
              "group relative flex items-center gap-3 border px-3.5 py-2 rounded-2xl text-xs transition-all duration-200 w-80 md:w-96 text-left shadow-2xs hover:shadow-md",
              isDarkMode
                ? "bg-slate-900/90 border-slate-800 text-slate-400 hover:border-indigo-500/50 hover:bg-slate-900"
                : "bg-slate-100/80 border-slate-200/90 text-slate-500 hover:border-indigo-400/60 hover:bg-white"
            )}
          >
            <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <Search className="h-3.5 w-3.5" />
            </div>
            <span className="flex-1 font-medium truncate text-xs text-slate-600 dark:text-slate-300">
              Search tenants, subscriptions, AI models...
            </span>
            <kbd className={cn(
              "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg font-mono border font-semibold tracking-wider shrink-0 transition-colors",
              isDarkMode
                ? "bg-slate-800/90 border-slate-700/80 text-slate-300 group-hover:border-indigo-500/40"
                : "bg-white border-slate-300/80 text-slate-600 group-hover:border-indigo-400/50"
            )}>
              <Command className="h-2.5 w-2.5" /> K
            </kbd>
          </button>

          {/* Right Controls: Dark/Light Mode, System Health, AI Assistant & Super Admin Profile Dropdown */}
          <div className="flex items-center gap-3 text-xs font-semibold">
            
            {/* Dark / Light Mode Toggle Button */}
            <Button
              onClick={() => setIsDarkMode(!isDarkMode)}
              variant="outline"
              size="sm"
              className={cn(
                "rounded-2xl px-3 text-xs font-bold flex items-center gap-1.5 border",
                isDarkMode ? "border-slate-800 bg-slate-900 text-amber-300" : "border-slate-200 bg-slate-100 text-slate-700"
              )}
            >
              {isDarkMode ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" /> Light Mode
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-indigo-600" /> Dark Mode
                </>
              )}
            </Button>

            {/* Live System Health Badge */}
            <div className="hidden lg:flex items-center gap-2 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-full">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>99.99% Operational</span>
            </div>

            {/* AI Executive Assistant Drawer Trigger */}
            <Button
              onClick={() => setIsAiAssistantOpen(!isAiAssistantOpen)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-4 py-1.5 text-xs font-bold shadow-md flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4 text-amber-300 fill-amber-300" />
              AI Assistant
            </Button>

            {/* Super Admin Profile & Logout Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className={cn(
                  "flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl border transition-all",
                  isDarkMode ? "border-slate-800 bg-slate-900 hover:bg-slate-850" : "border-slate-200 bg-slate-100 hover:bg-slate-200/70"
                )}
              >
                <div className="relative">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-black flex items-center justify-center text-xs shadow-sm">
                    SA
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                </div>
                <span className="font-extrabold text-xs hidden sm:inline-block">Super Admin</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {/* Profile Popover Menu */}
              {isProfileMenuOpen && (
                <div className={cn(
                  "absolute right-0 mt-2 w-64 rounded-3xl border shadow-2xl p-2 z-50 animate-in zoom-in-95 duration-150 space-y-1 text-xs",
                  isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
                )}>
                  <div className="p-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="font-extrabold text-sm">{user?.email || "owner@revflow.ai"}</div>
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold">Platform Owner • Super Admin</div>
                  </div>

                  <Link
                    href="/super-admin/profile"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-indigo-500/10 font-bold transition-all"
                  >
                    <User className="h-4 w-4 text-indigo-500" /> Super Admin Profile & Desk
                  </Link>

                  <Link
                    href="/super-admin/security"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-indigo-500/10 font-bold transition-all"
                  >
                    <ShieldCheck className="h-4 w-4 text-emerald-500" /> Security & Audit Logs
                  </Link>

                  <Link
                    href="/super-admin/ai-control"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-indigo-500/10 font-bold transition-all"
                  >
                    <Bot className="h-4 w-4 text-purple-500" /> AI LLM Provider Control
                  </Link>

                  <div className="pt-1 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-600 font-bold transition-all"
                    >
                      <LogOut className="h-4 w-4 text-rose-500" /> Log Out of Super Admin
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main className={cn(
          "flex-1 overflow-y-auto p-6 md:p-8 [scrollbar-width:thin]",
          isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50/50 text-slate-900"
        )}>
          {children}
        </main>

      </div>

      {/* FLOATING AI EXECUTIVE ASSISTANT DRAWER */}
      {isAiAssistantOpen && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 w-96 border rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[520px] animate-in slide-in-from-bottom-5",
          isDarkMode ? "bg-slate-900 border-indigo-500/40" : "bg-white border-slate-300"
        )}>
          <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs text-white">RevFlow Executive AI Assistant</h3>
                <p className="text-[10px] text-slate-300 font-mono">Company Owner Command Desk</p>
              </div>
            </div>

            <button
              onClick={() => setIsAiAssistantOpen(false)}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className={cn(
            "flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs [scrollbar-width:thin]",
            isDarkMode ? "bg-slate-950/80" : "bg-slate-50"
          )}>
            {aiChatHistory.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] p-3 rounded-2xl leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-xs'
                    : isDarkMode
                    ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-xs font-medium'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs font-medium shadow-xs'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}

            {aiThinking && (
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20 w-fit animate-pulse">
                <Sparkles className="h-3.5 w-3.5 animate-spin" />
                Analyzing platform telemetry...
              </div>
            )}
          </div>

          <form onSubmit={handleAskAiAssistant} className={cn("p-3 border-t flex items-center gap-2", isDarkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white")}>
            <input
              type="text"
              placeholder="Ask: 'Show MRR', 'System health', 'Inactive clinics'..."
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              className={cn(
                "flex-1 border rounded-2xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium",
                isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-900"
              )}
            />
            <Button type="submit" size="sm" className="bg-indigo-600 text-white rounded-2xl px-3 py-2 text-xs">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      )}

      {/* UNIVERSAL COMMAND PALETTE (CMD + K) MODAL */}
      {isCommandOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
          <div className={cn("border rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150", isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
            <div className={cn("p-4 border-b flex items-center gap-3", isDarkMode ? "border-slate-800" : "border-slate-200")}>
              <Search className="h-4 w-4 text-indigo-500" />
              <input
                type="text"
                autoFocus
                placeholder="Type a command or search platform resources..."
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                className={cn("w-full bg-transparent text-sm focus:outline-none font-medium", isDarkMode ? "text-white" : "text-slate-900")}
              />
              <button onClick={() => setIsCommandOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-2 text-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quick Actions</div>
              <Link href="/super-admin/subscriptions" onClick={() => setIsCommandOpen(false)} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-500/10 cursor-pointer">
                <span className="font-bold flex items-center gap-2"><DollarSign className="h-4 w-4 text-emerald-500" /> View Subscriptions & MRR</span>
                <span className="text-[10px] font-mono text-muted-foreground">Go to Subscriptions</span>
              </Link>
              <Link href="/super-admin/ai-control" onClick={() => setIsCommandOpen(false)} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-500/10 cursor-pointer">
                <span className="font-bold flex items-center gap-2"><Bot className="h-4 w-4 text-indigo-500" /> AI Provider & Token Control</span>
                <span className="text-[10px] font-mono text-muted-foreground">Go to AI Control</span>
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
