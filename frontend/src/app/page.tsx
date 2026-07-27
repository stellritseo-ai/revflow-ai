"use client";

import React, { useState, useEffect, useRef } from "react";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageCircle, Sparkles, Send, Bot, User, CheckCircle2,
  Zap, Plus, Calendar, PhoneCall, Download
} from "lucide-react";
import { BookingModal } from "@/components/booking-modal";

interface DashboardChatMessage {
  id: string;
  sender: "patient" | "ai";
  text: string;
  timestamp: string;
  card?: {
    title: string;
    details: string;
  };
}

const defaultDashboardMessages: DashboardChatMessage[] = [
  {
    id: "dash-msg-1",
    sender: "patient",
    text: "Perfect! Please book tomorrow at 10:00 AM for me.",
    timestamp: "10:15 AM"
  },
  {
    id: "dash-msg-2",
    sender: "ai",
    text: "Your appointment is confirmed for tomorrow at 10:00 AM! An SMS confirmation has been sent to (555) 234-8901.",
    timestamp: "10:15 AM",
    card: {
      title: "Confirmed Appointment #REV-9021",
      details: "Jack Miller • Suite 400 • Mon 10:00 AM"
    }
  }
];

export default function DashboardHome() {
  const [messages, setMessages] = useState<DashboardChatMessage[]>(defaultDashboardMessages);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendDashboardChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    setInputText("");

    const newMsg: DashboardChatMessage = {
      id: `d-msg-${Date.now()}`,
      sender: "patient",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);

    setIsTyping(true);
    setTimeout(() => {
      let replyText = "Thank you for contacting RevFlow Dental! I've logged your inquiry. Would you like me to reserve an appointment slot for you?";
      let cardObj: DashboardChatMessage["card"] | undefined = undefined;

      const lower = userText.toLowerCase();
      if (lower.includes("book") || lower.includes("appointment") || lower.includes("tomorrow") || lower.includes("cleaning")) {
        replyText = "I have an opening available tomorrow at 2:00 PM with Dr. Sarah Jenkins. I can confirm this for you right now!";
        cardObj = {
          title: "Available Dental Appointment",
          details: "Tomorrow at 2:00 PM • Dr. Sarah Jenkins, DDS"
        };
      } else if (lower.includes("price") || lower.includes("cost") || lower.includes("insurance")) {
        replyText = "Comprehensive exams & cleanings are $150, covered 100% by PPO plans like Delta Dental and Cigna!";
      }

      const aiMsg: DashboardChatMessage = {
        id: `d-ai-${Date.now()}`,
        sender: "ai",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        card: cardObj
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* TOP EXECUTIVE WELCOME HEADER BANNER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              RevFlow AI Engine Active (Aria • Dental Assistant)
            </span>
            <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              ⚡ 280ms Latency
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-white">
            Good morning, Dr. Sarah Jenkins
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Here's what's happening at Smile Dental Care today. 12 appointments booked automatically by AI, 8 missed calls recovered.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 relative z-10">
          <Button
            onClick={() => setIsBookingOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-5 py-2.5 shadow-lg shadow-indigo-600/30 flex items-center gap-2 font-bold transition-all active:scale-95 text-xs"
          >
            <Plus className="h-4 w-4" />
            Book Appointment
          </Button>
        </div>
      </div>

      {/* SECTION 1: 8 KPI Stat Cards Grid */}
      <KPICards />

      {/* SECTION 2: Live AI Chat Assistant + Revenue Overview Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Live AI Chat Assistant Widget (5 Cols) */}
        <Card className="lg:col-span-5 border-border/60 shadow-md rounded-3xl overflow-hidden flex flex-col h-[400px]">
          
          {/* Dark Header */}
          <div className="p-4 border-b bg-slate-950 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs text-white flex items-center gap-1.5">
                  Live AI Chat Assistant
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[10px] text-slate-400">Test live AI bot responses & bookings</p>
              </div>
            </div>

            <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
              Interactive
            </span>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-muted/10 [scrollbar-width:thin]">
            {messages.map((msg) => {
              const isAi = msg.sender === "ai";
              const isPatient = msg.sender === "patient";

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isPatient ? "items-start" : "items-end"}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] text-muted-foreground font-medium">
                    {isAi ? (
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-indigo-500" /> Aria (AI Assistant)
                      </span>
                    ) : (
                      <span className="font-bold text-foreground">Patient</span>
                    )}
                    <span>• {msg.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[90%] p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                      isPatient
                        ? "bg-muted/80 text-foreground border rounded-tl-xs"
                        : "bg-indigo-600 text-white rounded-tr-xs shadow-indigo-600/20"
                    }`}
                  >
                    <p>{msg.text}</p>

                    {msg.card && (
                      <div className="mt-2 p-2.5 rounded-xl bg-white/15 border border-white/25 text-white backdrop-blur-md space-y-0.5">
                        <div className="font-extrabold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-300" />
                          {msg.card.title}
                        </div>
                        <p className="text-[10px] opacity-90">{msg.card.details}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-500/10 px-3 py-2 rounded-2xl w-fit border border-indigo-500/20 animate-pulse">
                <Sparkles className="h-3.5 w-3.5 animate-spin" />
                Aria AI is typing response...
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Form Input */}
          <form onSubmit={handleSendDashboardChat} className="p-3 border-t bg-card flex items-center gap-2 shrink-0">
            <input
              type="text"
              placeholder="Type message to test AI Bot..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-muted/30 border rounded-2xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
            />
            <Button
              type="submit"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-3.5 py-2 text-xs shadow-md"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>

        </Card>

        {/* Revenue Overview Chart (7 Cols) */}
        <Card className="lg:col-span-7 border-border/60 shadow-md rounded-3xl overflow-hidden p-6 h-[400px]">
          <RevenueChart />
        </Card>

      </div>

      {/* SECTION 3: Quick Operations + Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Quick Operations (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500 fill-amber-500" /> Quick Operations
          </h2>
          <QuickActions />
        </div>

        {/* Recent Activity (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-foreground">Recent Activity</h2>
            <Button variant="link" className="text-indigo-600 text-xs font-bold h-auto p-0">
              View all
            </Button>
          </div>

          <Card className="border-border/60 shadow-md rounded-3xl p-5">
            <ActivityFeed />
          </Card>
        </div>

      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={() => {}}
      />

    </div>
  );
}
