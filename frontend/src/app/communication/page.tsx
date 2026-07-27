"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  MessageCircle, Bot, User, Send, Sparkles, CheckCircle2, Clock, Phone,
  Calendar, ShieldCheck, Stethoscope, Search, Zap, ArrowRight, RefreshCw,
  Plus, MoreVertical, Paperclip, Smile, PhoneCall, Check, UserCheck, Play, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api-client";

interface ChatMessage {
  id: string;
  sender: "patient" | "ai" | "system";
  text: string;
  timestamp: string;
  card?: {
    type: "booking" | "treatment" | "doctor";
    title: string;
    details: string;
    actionText?: string;
  };
}

interface ChatConversation {
  id: string;
  patient_name: string;
  patient_phone: string;
  patient_avatar: string;
  status: "ai_managed" | "human_handoff" | "completed";
  last_message: string;
  last_time: string;
  unread: number;
  intent: string;
  messages: ChatMessage[];
}

const defaultConversations: ChatConversation[] = [
  {
    id: "chat-1",
    patient_name: "Jack Miller",
    patient_phone: "(555) 234-8901",
    patient_avatar: "J",
    status: "ai_managed",
    last_message: "Perfect! Can I book tomorrow at 10:00 AM with Dr. Jenkins?",
    last_time: "Just now",
    unread: 1,
    intent: "Appointment Booking • Emergency Toothache",
    messages: [
      {
        id: "m-1",
        sender: "patient",
        text: "Hi, I have a sharp pain in my lower right molar since yesterday. Do you have any emergency appointments available?",
        timestamp: "10:28 AM"
      },
      {
        id: "m-2",
        sender: "ai",
        text: "Hello Jack! I'm Aria, RevFlow's AI Dental Assistant. I'm so sorry to hear you're experiencing pain! We prioritize toothache emergencies. Let me check Dr. Sarah Jenkins' schedule for you.",
        timestamp: "10:28 AM"
      },
      {
        id: "m-3",
        sender: "ai",
        text: "I have an emergency slot open tomorrow (Monday, July 27th) at 10:00 AM with Dr. Sarah Jenkins, DDS.",
        timestamp: "10:29 AM",
        card: {
          type: "booking",
          title: "Emergency Consultation & Molar Exam",
          details: "Mon, Jul 27 • 10:00 AM – 10:45 AM with Dr. Sarah Jenkins",
          actionText: "Slot Reserved"
        }
      },
      {
        id: "m-4",
        sender: "patient",
        text: "Perfect! Can I book tomorrow at 10:00 AM with Dr. Jenkins?",
        timestamp: "10:30 AM"
      },
      {
        id: "m-5",
        sender: "ai",
        text: "Your appointment is confirmed for tomorrow at 10:00 AM! I've sent an SMS confirmation to (555) 234-8901. Please arrive 10 minutes early.",
        timestamp: "10:30 AM",
        card: {
          type: "booking",
          title: "Confirmed Appointment #REV-9021",
          details: "Patient: Jack Miller • Provider: Dr. Sarah Jenkins • Location: Suite 400",
          actionText: "Confirmed"
        }
      }
    ]
  },
  {
    id: "chat-2",
    patient_name: "Emily Watson",
    patient_phone: "(555) 890-1234",
    patient_avatar: "E",
    status: "ai_managed",
    last_message: "Does your clinic accept Delta Dental PPO insurance?",
    last_time: "15m ago",
    unread: 0,
    intent: "Insurance & Pricing Inquiry",
    messages: [
      {
        id: "m-21",
        sender: "patient",
        text: "Hi! Does your clinic accept Delta Dental PPO insurance?",
        timestamp: "10:15 AM"
      },
      {
        id: "m-22",
        sender: "ai",
        text: "Yes, Emily! We are in-network with Delta Dental PPO, MetLife, Cigna, and Guardian. Most preventative checkups and cleanings are covered at 100%.",
        timestamp: "10:15 AM",
        card: {
          type: "treatment",
          title: "In-Network Insurance Verification",
          details: "Delta Dental PPO • MetLife • Aetna • Cigna Dental",
          actionText: "100% Preventive Coverage"
        }
      }
    ]
  },
  {
    id: "chat-3",
    patient_name: "Sophia Martinez",
    patient_phone: "(555) 456-7890",
    patient_avatar: "S",
    status: "human_handoff",
    last_message: "I need to discuss payment plan options for teeth whitening.",
    last_time: "1h ago",
    unread: 0,
    intent: "Payment Plan • Human Handoff",
    messages: [
      {
        id: "m-31",
        sender: "patient",
        text: "I need to discuss payment plan options for teeth whitening.",
        timestamp: "09:30 AM"
      },
      {
        id: "m-32",
        sender: "ai",
        text: "I'd be happy to assist! We offer 0% APR financing through CareCredit and Sunbit for cosmetic whitening procedures. I am transferring this chat to our billing manager for personalized options.",
        timestamp: "09:31 AM"
      }
    ]
  }
];

export default function AiLiveChatPage() {
  const [conversations, setConversations] = useState<ChatConversation[]>(defaultConversations);
  const [activeChatId, setActiveChatId] = useState<string>("chat-1");
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isHumanTakeover, setIsHumanTakeover] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Currently selected active conversation
  const activeChat = useMemo(() => {
    return conversations.find(c => c.id === activeChatId) || conversations[0];
  }, [conversations, activeChatId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages, isTyping]);

  // Auto AI Bot Response Simulation
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    setInputText("");

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: isHumanTakeover ? "system" : "patient",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    };

    // Append user message to active chat
    const updatedConversations = conversations.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          last_message: userText,
          last_time: "Just now",
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    });

    setConversations(updatedConversations);

    // If AI managed (not human takeover), generate auto AI reply
    if (!isHumanTakeover) {
      setIsTyping(true);
      setTimeout(() => {
        let aiReplyText = "Thank you for reaching out! I've noted that in your record. Is there anything else I can assist you with today?";
        let cardObj: ChatMessage["card"] | undefined = undefined;

        const lower = userText.toLowerCase();
        if (lower.includes("book") || lower.includes("appointment") || lower.includes("schedule") || lower.includes("time")) {
          aiReplyText = "I've checked our schedule! We have an opening available tomorrow at 2:00 PM with Dr. Sarah Jenkins. Would you like me to reserve this for you?";
          cardObj = {
            type: "booking",
            title: "Available Appointment Slot",
            details: "Tomorrow at 2:00 PM • Dr. Sarah Jenkins, DDS",
            actionText: "Click to Confirm"
          };
        } else if (lower.includes("price") || lower.includes("cost") || lower.includes("fee") || lower.includes("insurance")) {
          aiReplyText = "Our comprehensive consultation starts at $150, which is usually covered 100% by PPO insurance providers like Delta, Cigna, and MetLife!";
          cardObj = {
            type: "treatment",
            title: "Preventative Care Pricing",
            details: "Comprehensive Exam & X-Rays: $150 (Covered by PPO)",
            actionText: "In-Network PPO"
          };
        } else if (lower.includes("doctor") || lower.includes("jenkins") || lower.includes("chen")) {
          aiReplyText = "Dr. Sarah Jenkins is our lead DDS specializing in restorative dentistry and emergency pain management with 14+ years of experience!";
        }

        const aiMsg: ChatMessage = {
          id: `msg-ai-${Date.now()}`,
          sender: "ai",
          text: aiReplyText,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          card: cardObj
        };

        setConversations(prev => prev.map(c => {
          if (c.id === activeChatId) {
            return {
              ...c,
              last_message: aiReplyText,
              last_time: "Just now",
              messages: [...c.messages, aiMsg]
            };
          }
          return c;
        }));

        setIsTyping(false);
      }, 1200);
    }
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col p-4 md:p-6 max-w-7xl mx-auto space-y-4 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header Banner - Compact & Fixed */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-3.5 rounded-2xl text-white shadow-md border border-indigo-800/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight text-white">AI Live Chat & Autonomous Assistant</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Aria AI Active
              </span>
            </div>
            <p className="text-slate-300 text-xs mt-0.5">
              Real-time 24/7 web chat assistant with instant patient replies and automated appointment bookings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => setIsHumanTakeover(!isHumanTakeover)}
            size="sm"
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
              isHumanTakeover
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white"
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            {isHumanTakeover ? "Human Staff Active" : "AI Bot Active"}
          </Button>
        </div>
      </div>

      {/* Main 3-Column Chat Application Shell - Fits Remaining Viewport Height */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-2xl border bg-background shadow-xl overflow-hidden">
        
        {/* LEFT COLUMN: Conversations List (4 Cols) */}
        <div className="lg:col-span-4 border-r flex flex-col bg-muted/10 h-full min-h-0 overflow-hidden">
          
          {/* List Header & Search */}
          <div className="p-3.5 border-b space-y-2.5 bg-muted/20 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs flex items-center gap-2">
                <MessageCircle className="h-3.5 w-3.5 text-indigo-500" />
                Live Patient Chats
              </h3>
              <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-500/20">
                {conversations.length} Active
              </span>
            </div>

            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search chats..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Conversations Items */}
          <div className="flex-1 overflow-y-auto divide-y [scrollbar-width:thin]">
            {conversations.map(conv => {
              const isSelected = conv.id === activeChatId;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveChatId(conv.id)}
                  className={`p-3.5 cursor-pointer transition-all flex items-start gap-3 relative ${
                    isSelected
                      ? "bg-indigo-600/10 border-l-4 border-indigo-600"
                      : "hover:bg-muted/30"
                  }`}
                >
                  <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-xs flex-shrink-0">
                    {conv.patient_avatar}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-xs truncate text-foreground">{conv.patient_name}</h4>
                      <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">{conv.last_time}</span>
                    </div>

                    <p className="text-[11px] text-muted-foreground truncate mt-0.5 font-medium">
                      {conv.last_message}
                    </p>

                    <div className="flex items-center gap-1.5 mt-1.5">
                      {conv.status === "ai_managed" ? (
                        <span className="text-[9px] font-extrabold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 flex items-center gap-1">
                          <Bot className="h-2.5 w-2.5 text-indigo-500" /> AI Bot
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                          <User className="h-2.5 w-2.5 text-amber-500" /> Human Staff
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* CENTER COLUMN: Live Chat Messenger (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 bg-background border-r overflow-hidden">
          
          {/* Active Chat Header */}
          <div className="p-3.5 border-b flex items-center justify-between bg-muted/20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                {activeChat.patient_avatar}
              </div>
              <div>
                <h3 className="font-bold text-xs text-foreground">{activeChat.patient_name}</h3>
                <p className="text-[10px] text-muted-foreground font-mono">{activeChat.patient_phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Chat Session
              </span>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-muted/5 [scrollbar-width:thin]">
            {activeChat.messages.map(msg => {
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
                        <Sparkles className="h-3 w-3 text-indigo-500" /> Aria (AI Receptionist)
                      </span>
                    ) : (
                      <span className="font-bold text-foreground">{activeChat.patient_name}</span>
                    )}
                    <span>• {msg.timestamp}</span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      isPatient
                        ? "bg-muted/80 text-foreground border border-border rounded-tl-xs"
                        : "bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-600 text-white rounded-tr-xs shadow-indigo-600/20"
                    }`}
                  >
                    <p>{msg.text}</p>

                    {/* Embedded Card Inside Chat Bubble */}
                    {msg.card && (
                      <div className="mt-2.5 p-3 rounded-xl bg-white/15 border border-white/25 text-white backdrop-blur-md space-y-1">
                        <div className="font-extrabold text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                          {msg.card.title}
                        </div>
                        <p className="text-[10px] opacity-90">{msg.card.details}</p>
                        {msg.card.actionText && (
                          <div className="mt-1 font-bold text-[9px] uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded w-fit border border-white/30">
                            {msg.card.actionText}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* AI Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-500/10 px-3 py-2 rounded-2xl w-fit border border-indigo-500/20 animate-pulse">
                <Sparkles className="h-3.5 w-3.5 animate-spin" />
                Aria AI is typing response...
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Form Box */}
          <form onSubmit={handleSendMessage} className="p-3 border-t bg-background flex items-center gap-2 shrink-0">
            <input
              type="text"
              placeholder={isHumanTakeover ? "Type message as Human Staff..." : "Type message to test AI Bot response..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-muted/30 border rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
            />
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-4 py-2.5 text-xs shadow-md flex items-center gap-1"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>

        </div>

        {/* RIGHT COLUMN: AI RAG Memory & Intent Insight (3 Cols) */}
        <div className="lg:col-span-3 p-4 flex flex-col space-y-4 bg-muted/10 h-full min-h-0 overflow-y-auto [scrollbar-width:thin]">
          
          <div className="space-y-1">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" /> AI Intent Detection
            </h4>
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-600 dark:text-indigo-300">
              {activeChat.intent}
            </div>
          </div>

          {/* Extracted RAG Entities */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Extracted Parameters
            </h4>
            
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between p-2 rounded-xl bg-background border">
                <span className="text-muted-foreground">Chief Concern:</span>
                <span className="font-bold text-foreground">Lower Molar Pain</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-background border">
                <span className="text-muted-foreground">Urgency Level:</span>
                <span className="font-bold text-rose-500">High / Emergency</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-background border">
                <span className="text-muted-foreground">Preferred Doctor:</span>
                <span className="font-bold text-indigo-600">Dr. Sarah Jenkins</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-background border">
                <span className="text-muted-foreground">Booked Slot:</span>
                <span className="font-bold text-emerald-600 font-mono">Mon 10:00 AM</span>
              </div>
            </div>
          </div>

          {/* Clinical RAG Knowledge Lookups */}
          <div className="space-y-2 pt-2 border-t">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5 text-indigo-500" /> RAG Knowledge Verification
            </h4>
            <div className="p-3 rounded-2xl bg-background border text-[11px] space-y-1 text-muted-foreground">
              <p className="font-bold text-foreground">Clinic Policy Verified:</p>
              <p>• Emergency Toothache: Guaranteed same-day or next-morning booking.</p>
              <p>• PPO Insurance: Delta Dental, MetLife, Cigna 100% preventative coverage.</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 pt-2 border-t">
            <Button
              onClick={() => {
                alert(`Triggered SMS confirmation to ${activeChat.patient_phone}`);
              }}
              variant="outline"
              size="sm"
              className="w-full rounded-xl text-xs justify-start"
            >
              <Send className="h-3.5 w-3.5 mr-2 text-indigo-500" /> Send SMS Summary
            </Button>
            <Button
              onClick={() => {
                window.location.href = `/records`;
              }}
              variant="outline"
              size="sm"
              className="w-full rounded-xl text-xs justify-start"
            >
              <FileText className="h-3.5 w-3.5 mr-2 text-indigo-500" /> View Medical Chart
            </Button>
          </div>

        </div>

      </div>

    </div>
  );
}
