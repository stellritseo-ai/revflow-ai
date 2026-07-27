"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  MessagesSquare, PhoneMissed, Bot, User, Send, Sparkles, CheckCircle2, Clock, Phone,
  Calendar, ShieldCheck, Stethoscope, Search, Zap, ArrowRight, RefreshCw,
  Plus, Smartphone, Check, UserCheck, PhoneCall, AlertTriangle, FileText
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface SmsMessage {
  id: string;
  sender: "patient" | "ai" | "system";
  text: string;
  timestamp: string;
  status?: "delivered" | "sent" | "failed";
}

interface SmsThread {
  id: string;
  patient_name: string;
  patient_phone: string;
  patient_avatar: string;
  missed_call_time: string;
  trigger_reason: "Missed Call - Busy Line" | "After-Hours Call" | "Web Text Inquiry";
  status: "ai_texting" | "booked" | "human_takeover";
  last_message: string;
  last_time: string;
  intent: string;
  messages: SmsMessage[];
}

const defaultSmsThreads: SmsThread[] = [
  {
    id: "sms-1",
    patient_name: "Jack Miller",
    patient_phone: "(555) 234-8901",
    patient_avatar: "J",
    missed_call_time: "Today at 10:14 AM",
    trigger_reason: "Missed Call - Busy Line",
    status: "booked",
    last_message: "Great, 10:00 AM tomorrow works for me! Thanks Aria.",
    last_time: "Just now",
    intent: "Missed Call Auto-Engage • Emergency Toothache Booking",
    messages: [
      {
        id: "s-1",
        sender: "system",
        text: "📞 MISSED CALL DETECTED at 10:14 AM from (555) 234-8901. Instant AI SMS Auto-Responder triggered.",
        timestamp: "10:14 AM"
      },
      {
        id: "s-2",
        sender: "ai",
        text: "Hi Jack! Sorry we missed your call at RevFlow Dental Clinic. I'm Aria, your AI Assistant. How can I help you today? Do you need to book an appointment or ask a question?",
        timestamp: "10:14 AM",
        status: "delivered"
      },
      {
        id: "s-3",
        sender: "patient",
        text: "Hi, I called because I have a bad toothache on my lower molar. Can I come in tomorrow?",
        timestamp: "10:15 AM"
      },
      {
        id: "s-4",
        sender: "ai",
        text: "We prioritize toothache emergencies! We have an opening tomorrow (Mon, Jul 27) at 10:00 AM with Dr. Sarah Jenkins. Would that time work for you?",
        timestamp: "10:15 AM",
        status: "delivered"
      },
      {
        id: "s-5",
        sender: "patient",
        text: "Great, 10:00 AM tomorrow works for me! Thanks Aria.",
        timestamp: "10:16 AM"
      },
      {
        id: "s-6",
        sender: "ai",
        text: "Your appointment is confirmed for tomorrow at 10:00 AM with Dr. Sarah Jenkins at Suite 400. Reply CANCEL if you need to reschedule.",
        timestamp: "10:16 AM",
        status: "delivered"
      }
    ]
  },
  {
    id: "sms-2",
    patient_name: "Emily Watson",
    patient_phone: "(555) 890-1234",
    patient_avatar: "E",
    missed_call_time: "Yesterday at 6:45 PM",
    trigger_reason: "After-Hours Call",
    status: "ai_texting",
    last_message: "Do you accept Delta Dental insurance?",
    last_time: "15m ago",
    intent: "After-Hours Auto-SMS • Insurance Inquiry",
    messages: [
      {
        id: "s-21",
        sender: "system",
        text: "🌙 AFTER-HOURS CALL DETECTED at 6:45 PM. Instant AI SMS Auto-Responder triggered.",
        timestamp: "6:45 PM"
      },
      {
        id: "s-22",
        sender: "ai",
        text: "Hi Emily! Thanks for calling RevFlow Dental. Our clinic is currently closed for the day, but I'm your 24/7 AI Assistant. How can I help you?",
        timestamp: "6:45 PM",
        status: "delivered"
      },
      {
        id: "s-23",
        sender: "patient",
        text: "Do you accept Delta Dental insurance?",
        timestamp: "6:48 PM"
      },
      {
        id: "s-24",
        sender: "ai",
        text: "Yes, Emily! We are in-network with Delta Dental PPO, MetLife, Cigna, and Guardian. Preventative checkups are covered 100%. Would you like to schedule a visit?",
        timestamp: "6:48 PM",
        status: "delivered"
      }
    ]
  },
  {
    id: "sms-3",
    patient_name: "Marcus Brody",
    patient_phone: "(555) 345-6789",
    patient_avatar: "M",
    missed_call_time: "Today at 08:30 AM",
    trigger_reason: "Missed Call - Busy Line",
    status: "human_takeover",
    last_message: "Please have the doctor call me back ASAP regarding my broken tooth.",
    last_time: "1h ago",
    intent: "Trauma Emergency • Staff Action Required",
    messages: [
      {
        id: "s-31",
        sender: "system",
        text: "📞 MISSED CALL DETECTED at 08:30 AM from (555) 345-6789.",
        timestamp: "08:30 AM"
      },
      {
        id: "s-32",
        sender: "ai",
        text: "Hi Marcus! Sorry we missed your call. I'm Aria at RevFlow Dental. How can I help you right now?",
        timestamp: "08:30 AM",
        status: "delivered"
      },
      {
        id: "s-33",
        sender: "patient",
        text: "Please have the doctor call me back ASAP regarding my broken tooth.",
        timestamp: "08:32 AM"
      }
    ]
  }
];

export default function SmsConversationsPage() {
  const [threads, setThreads] = useState<SmsThread[]>(defaultSmsThreads);
  const [activeThreadId, setActiveThreadId] = useState<string>("sms-1");
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [filterCategory, setFilterCategory] = useState<"all" | "missed" | "booked" | "human">("all");
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Active Selected Thread
  const activeThread = useMemo(() => {
    return threads.find(t => t.id === activeThreadId) || threads[0];
  }, [threads, activeThreadId]);

  // Scroll to bottom of SMS thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages, isTyping]);

  // Filtered Threads Calculation
  const filteredThreads = useMemo(() => {
    return threads.filter(t => {
      if (filterCategory === "missed") return t.trigger_reason.includes("Missed Call");
      if (filterCategory === "booked") return t.status === "booked";
      if (filterCategory === "human") return t.status === "human_takeover";
      return true;
    });
  }, [threads, filterCategory]);

  // Simulate Missed Call & Auto-SMS Trigger (Demo Test)
  const handleSimulateMissedCall = () => {
    const demoPatients = [
      { name: "Sarah Connor", phone: "(555) 901-2345", avatar: "S", concern: "Cleanings & Checkup" },
      { name: "David Miller", phone: "(555) 678-1234", avatar: "D", concern: "Crown Cost Quote" }
    ];
    const p = demoPatients[Math.floor(Math.random() * demoPatients.length)];
    const threadId = `sms-${Date.now()}`;
    const timeNow = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    const newThread: SmsThread = {
      id: threadId,
      patient_name: p.name,
      patient_phone: p.phone,
      patient_avatar: p.avatar,
      missed_call_time: `Today at ${timeNow}`,
      trigger_reason: "Missed Call - Busy Line",
      status: "ai_texting",
      last_message: `Hi ${p.name.split(" ")[0]}! Sorry we missed your call at RevFlow Dental Clinic.`,
      last_time: "Just now",
      intent: "Missed Call Auto-Engage • Instant SMS Trigger",
      messages: [
        {
          id: `sys-${Date.now()}`,
          sender: "system",
          text: `📞 MISSED CALL DETECTED at ${timeNow} from ${p.phone}. Instant AI SMS Auto-Responder triggered.`,
          timestamp: timeNow
        },
        {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: `Hi ${p.name.split(" ")[0]}! Sorry we missed your call at RevFlow Dental Clinic. I'm Aria, your AI Assistant. How can I help you today? Do you need to book an appointment?`,
          timestamp: timeNow,
          status: "delivered"
        }
      ]
    };

    setThreads([newThread, ...threads]);
    setActiveThreadId(threadId);
    setToastNotice(`📞 Simulated Missed Call from ${p.name}! Instant AI SMS sent.`);
    setTimeout(() => setToastNotice(null), 4000);
  };

  // Send SMS Reply Handler
  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textSent = inputText.trim();
    setInputText("");
    const timeNow = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    const userMsg: SmsMessage = {
      id: `s-msg-${Date.now()}`,
      sender: "patient",
      text: textSent,
      timestamp: timeNow
    };

    const updated = threads.map(t => {
      if (t.id === activeThreadId) {
        return {
          ...t,
          last_message: textSent,
          last_time: "Just now",
          messages: [...t.messages, userMsg]
        };
      }
      return t;
    });

    setThreads(updated);

    // AI Auto SMS Reply
    setIsTyping(true);
    setTimeout(() => {
      let aiText = `Thanks for texting! I've logged your request for ${activeThread.patient_name}. Would you like me to book your visit now?`;
      const lower = textSent.toLowerCase();

      if (lower.includes("yes") || lower.includes("book") || lower.includes("time") || lower.includes("tomorrow")) {
        aiText = `Perfect! I've reserved tomorrow at 11:00 AM with Dr. Sarah Jenkins. I've sent your SMS confirmation text!`;
      } else if (lower.includes("price") || lower.includes("cost") || lower.includes("insurance")) {
        aiText = `Our exam & X-rays are $150, fully covered by PPO plans like Delta Dental and Cigna!`;
      }

      const aiReply: SmsMessage = {
        id: `s-ai-${Date.now()}`,
        sender: "ai",
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        status: "delivered"
      };

      setThreads(prev => prev.map(t => {
        if (t.id === activeThreadId) {
          return {
            ...t,
            last_message: aiText,
            last_time: "Just now",
            status: lower.includes("yes") || lower.includes("book") ? ("booked" as const) : t.status,
            messages: [...t.messages, aiReply]
          };
        }
        return t;
      }));

      setIsTyping(false);
    }, 1100);
  };

  // Metrics
  const totalThreads = threads.length;
  const totalMissedConverted = threads.filter(t => t.trigger_reason.includes("Missed Call")).length;
  const totalBookedViaSms = threads.filter(t => t.status === "booked").length;

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col p-4 md:p-6 max-w-7xl mx-auto space-y-4 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      
      {/* Toast Notice */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-indigo-500/40 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <Sparkles className="h-5 w-5 text-emerald-400 fill-emerald-400" />
          <span className="text-xs font-bold">{toastNotice}</span>
        </div>
      )}

      {/* Header Banner - Compact & Fixed */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-3.5 rounded-2xl text-white shadow-md border border-indigo-800/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <PhoneMissed className="h-6 w-6 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight text-white">Missed Call SMS Auto-Responder</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Auto-SMS Active (&lt;5s Trigger)
              </span>
            </div>
            <p className="text-slate-300 text-xs mt-0.5">
              Automated instant SMS text engagement whenever a patient call is missed, busy, or after-hours.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={handleSimulateMissedCall}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold px-4 shadow-md flex items-center gap-2"
          >
            <PhoneMissed className="h-3.5 w-3.5 text-rose-300" />
            Simulate Missed Call & Auto-SMS
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <div className="p-3 rounded-2xl border bg-background flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">SMS Conversations</span>
            <div className="text-lg font-extrabold">{totalThreads} Threads</div>
          </div>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
            <MessagesSquare className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3 rounded-2xl border bg-background flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Missed Calls Engaged</span>
            <div className="text-lg font-extrabold">{totalMissedConverted} Calls</div>
          </div>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
            <PhoneMissed className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3 rounded-2xl border bg-background flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Booked via SMS</span>
            <div className="text-lg font-extrabold text-emerald-600">{totalBookedViaSms} Visits</div>
          </div>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
            <Calendar className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3 rounded-2xl border bg-background flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">SMS Latency</span>
            <div className="text-lg font-extrabold text-indigo-600">3.2 Seconds</div>
          </div>
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
            <Zap className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Main 3-Column SMS Shell - Fits Remaining Viewport Height */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-2xl border bg-background shadow-xl overflow-hidden">
        
        {/* LEFT COLUMN: SMS Conversations Roster (4 Cols) */}
        <div className="lg:col-span-4 border-r flex flex-col bg-muted/10 h-full min-h-0 overflow-hidden">
          
          {/* List Header & Search */}
          <div className="p-3.5 border-b space-y-2.5 bg-muted/20 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs flex items-center gap-2">
                <MessagesSquare className="h-3.5 w-3.5 text-indigo-500" />
                SMS Text Threads
              </h3>
              <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-500/20">
                {filteredThreads.length} SMS Threads
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-muted/50 p-1 rounded-full border text-[11px] font-medium justify-between overflow-x-auto">
              <button
                onClick={() => setFilterCategory("all")}
                className={`px-3 py-0.5 rounded-full transition-all ${
                  filterCategory === "all" ? "bg-indigo-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterCategory("missed")}
                className={`px-3 py-0.5 rounded-full transition-all ${
                  filterCategory === "missed" ? "bg-indigo-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Missed Calls
              </button>
              <button
                onClick={() => setFilterCategory("booked")}
                className={`px-3 py-0.5 rounded-full transition-all ${
                  filterCategory === "booked" ? "bg-indigo-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Booked
              </button>
            </div>
          </div>

          {/* Conversations Items */}
          <div className="flex-1 overflow-y-auto divide-y [scrollbar-width:thin]">
            {filteredThreads.map(t => {
              const isSelected = t.id === activeThreadId;

              return (
                <div
                  key={t.id}
                  onClick={() => setActiveThreadId(t.id)}
                  className={`p-3.5 cursor-pointer transition-all flex items-start gap-3 relative ${
                    isSelected
                      ? "bg-indigo-600/10 border-l-4 border-indigo-600"
                      : "hover:bg-muted/30"
                  }`}
                >
                  <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-xs flex-shrink-0">
                    {t.patient_avatar}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-xs truncate text-foreground">{t.patient_name}</h4>
                      <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">{t.last_time}</span>
                    </div>

                    <p className="text-[11px] text-muted-foreground truncate mt-0.5 font-medium">
                      {t.last_message}
                    </p>

                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[9px] font-extrabold bg-rose-500/15 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-1">
                        <PhoneMissed className="h-2.5 w-2.5 text-rose-500" /> {t.trigger_reason}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* CENTER COLUMN: Live SMS Text Messenger (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 bg-background border-r overflow-hidden">
          
          {/* Active Chat Header */}
          <div className="p-3.5 border-b flex items-center justify-between bg-muted/20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                {activeThread.patient_avatar}
              </div>
              <div>
                <h3 className="font-bold text-xs text-foreground">{activeThread.patient_name}</h3>
                <p className="text-[10px] text-muted-foreground font-mono">{activeThread.patient_phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <PhoneMissed className="h-3 w-3" />
                {activeThread.missed_call_time}
              </span>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-muted/5 [scrollbar-width:thin]">
            {activeThread.messages.map(msg => {
              const isAi = msg.sender === "ai";
              const isPatient = msg.sender === "patient";
              const isSystem = msg.sender === "system";

              if (isSystem) {
                return (
                  <div key={msg.id} className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-[11px] font-bold text-center flex items-center justify-center gap-2">
                    <PhoneMissed className="h-3.5 w-3.5 text-rose-500" />
                    <span>{msg.text}</span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isPatient ? "items-start" : "items-end"}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] text-muted-foreground font-medium">
                    {isAi ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <Smartphone className="h-3 w-3 text-emerald-500" /> RevFlow Auto-SMS Bot • {msg.status}
                      </span>
                    ) : (
                      <span className="font-bold text-foreground">{activeThread.patient_name} (SMS)</span>
                    )}
                    <span>• {msg.timestamp}</span>
                  </div>

                  {/* SMS Message Bubble */}
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      isPatient
                        ? "bg-slate-200 dark:bg-slate-800 text-foreground rounded-tl-xs"
                        : "bg-emerald-600 text-white rounded-tr-xs shadow-emerald-600/20"
                    }`}
                  >
                    <p>{msg.text}</p>
                  </div>
                </div>
              );
            })}

            {/* AI Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-2 rounded-2xl w-fit border border-emerald-500/20 animate-pulse">
                <Sparkles className="h-3.5 w-3.5 animate-spin" />
                RevFlow AI is sending auto-SMS text...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form Box */}
          <form onSubmit={handleSendSms} className="p-3 border-t bg-background flex items-center gap-2 shrink-0">
            <input
              type="text"
              placeholder="Type SMS text message to patient..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-muted/30 border rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
            />
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-4 py-2.5 text-xs shadow-md flex items-center gap-1"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>

        </div>

        {/* RIGHT COLUMN: Telephony Audit & Patient CRM Panel (3 Cols) */}
        <div className="lg:col-span-3 p-4 flex flex-col space-y-4 bg-muted/10 h-full min-h-0 overflow-y-auto [scrollbar-width:thin]">
          
          <div className="space-y-1">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <PhoneMissed className="h-3.5 w-3.5 text-rose-500" /> Missed Call Telephony Audit
            </h4>
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-700 dark:text-rose-300 space-y-1">
              <div>Trigger: {activeThread.trigger_reason}</div>
              <div className="text-[10px] text-muted-foreground font-mono">{activeThread.missed_call_time}</div>
            </div>
          </div>

          {/* Extracted SMS Intent & Status */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Extracted SMS Intent
            </h4>
            
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-600 dark:text-indigo-300">
              {activeThread.intent}
            </div>
          </div>

          {/* Patient Contact Info Card */}
          <div className="space-y-2 border-t pt-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-indigo-500" /> Patient Contact Details
            </h4>
            <div className="p-3 rounded-2xl bg-background border text-xs space-y-1.5">
              <div className="font-bold text-foreground">{activeThread.patient_name}</div>
              <div className="font-mono text-muted-foreground text-[11px]">{activeThread.patient_phone}</div>
              <div className="text-[10px] font-semibold text-emerald-600">SMS Opt-In Active</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 pt-2 border-t">
            <Button
              onClick={() => {
                alert(`Calling ${activeThread.patient_phone} back now...`);
              }}
              variant="outline"
              size="sm"
              className="w-full rounded-xl text-xs justify-start text-emerald-600 border-emerald-500/30"
            >
              <PhoneCall className="h-3.5 w-3.5 mr-2" /> Call Patient Back
            </Button>
            
            <Button
              onClick={() => {
                window.location.href = `/calendar`;
              }}
              variant="outline"
              size="sm"
              className="w-full rounded-xl text-xs justify-start"
            >
              <Calendar className="h-3.5 w-3.5 mr-2 text-indigo-500" /> Master Calendar
            </Button>
          </div>

        </div>

      </div>

    </div>
  );
}
