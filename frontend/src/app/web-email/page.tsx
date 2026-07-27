"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Inbox, Mail, Send, Search, Filter, Clock, User, Phone, Calendar, Sparkles,
  CheckCircle2, AlertTriangle, ShieldCheck, Stethoscope, ArrowRight, RefreshCw,
  Plus, X, Printer, Reply, Trash2, Tag, Check, ExternalLink, MessageSquare
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { BookingModal } from "@/components/booking-modal";

interface WebEmail {
  id: string;
  form_type: "Appointment Request Form" | "General Contact Form" | "Emergency Toothache Alert" | "Insurance Inquiry Form";
  visitor_name: string;
  visitor_email: string;
  visitor_phone: string;
  subject: string;
  message: string;
  requested_date?: string;
  requested_time?: string;
  treatment_type?: string;
  preferred_doctor?: string;
  received_at: string;
  status: "unread" | "read" | "replied" | "booked";
  ai_summary?: string;
}

const defaultWebEmails: WebEmail[] = [
  {
    id: "web-email-1",
    form_type: "Appointment Request Form",
    visitor_name: "Jack Miller",
    visitor_email: "jack.miller@example.com",
    visitor_phone: "(555) 234-8901",
    subject: "Website Booking Request: Emergency Molar Evaluation",
    message: "Hi Dr. Jenkins, I submitted this form through your website. I have a severe sharp pain in my lower right tooth. Hoping to get an appointment tomorrow morning if possible.",
    requested_date: "2026-07-27",
    requested_time: "10:00 AM",
    treatment_type: "Emergency Consultation",
    preferred_doctor: "Dr. Sarah Jenkins, DDS",
    received_at: "2026-07-26T08:20:00.000Z",
    status: "unread",
    ai_summary: "Emergency Molar Pain • Visitor requested Monday 10:00 AM slot with Dr. Sarah Jenkins."
  },
  {
    id: "web-email-2",
    form_type: "Appointment Request Form",
    visitor_name: "Emily Watson",
    visitor_email: "emily.w@example.com",
    visitor_phone: "(555) 890-1234",
    subject: "Website Consultation Request: Invisalign Alignment Exam",
    message: "Hello! I would like to schedule a consultation for Invisalign clear aligners. Does your clinic offer free initial 3D scans?",
    requested_date: "2026-07-28",
    requested_time: "02:00 PM",
    treatment_type: "Invisalign Consultation",
    preferred_doctor: "Dr. Michael Chen, MS",
    received_at: "2026-07-25T14:15:00.000Z",
    status: "read",
    ai_summary: "Cosmetic Orthodontic Inquiry • Visitor interested in 3D Invisalign scan."
  },
  {
    id: "web-email-3",
    form_type: "Emergency Toothache Alert",
    visitor_name: "Marcus Brody",
    visitor_email: "marcus.brody@example.com",
    visitor_phone: "(555) 345-6789",
    subject: "URGENT: Broken Tooth from Sports Injury",
    message: "Broke my front incisor during basketball game tonight. Need emergency repair as soon as clinic opens.",
    requested_date: "2026-07-27",
    requested_time: "08:00 AM",
    treatment_type: "Trauma / Emergency Repair",
    preferred_doctor: "Dr. Alex Rivera, DMD",
    received_at: "2026-07-25T21:40:00.000Z",
    status: "unread",
    ai_summary: "High Urgency Trauma • Broken front tooth, requested 8:00 AM appointment."
  },
  {
    id: "web-email-4",
    form_type: "Insurance Inquiry Form",
    visitor_name: "Sophia Martinez",
    visitor_email: "sophia.m@example.com",
    visitor_phone: "(555) 456-7890",
    subject: "Website Inquiry: Delta Dental PPO Coverage & Co-pay",
    message: "Hello, I filled out the contact form on your website. Do you accept Delta Dental Premier PPO for pediatric checkups for my daughter?",
    received_at: "2026-07-24T11:05:00.000Z",
    status: "replied",
    ai_summary: "Insurance Verification • In-network PPO coverage confirmed by staff."
  }
];

export default function WebEmailPage() {
  const [emails, setEmails] = useState<WebEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<"all" | "unread" | "appointment" | "emergency" | "replied">("all");
  const [selectedEmailId, setSelectedEmailId] = useState<string>("web-email-1");

  // Reply Composer State
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replySuccessToast, setReplySuccessToast] = useState<string | null>(null);

  // Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Load Web Emails
  const loadEmails = async () => {
    setLoading(true);
    let localCache: WebEmail[] = [];
    try {
      const raw = localStorage.getItem("revflow_web_emails");
      if (raw) localCache = JSON.parse(raw);
    } catch (e) {}

    try {
      const serverData = await fetchApi<any[]>("/web-email/inbox");
      if (serverData && Array.isArray(serverData) && serverData.length > 0) {
        const map = new Map<string, WebEmail>();
        serverData.forEach((item, idx) => {
          map.set(item.id || `email-srv-${idx}`, {
            id: item.id || `email-srv-${idx}`,
            form_type: item.form_type || "Appointment Request Form",
            visitor_name: item.visitor_name || "Website Visitor",
            visitor_email: item.visitor_email || "visitor@example.com",
            visitor_phone: item.visitor_phone || "(555) 000-0000",
            subject: item.subject || "Website Form Submission",
            message: item.message || "No message content",
            requested_date: item.requested_date,
            requested_time: item.requested_time,
            treatment_type: item.treatment_type,
            preferred_doctor: item.preferred_doctor,
            received_at: item.received_at || new Date().toISOString(),
            status: item.status || "unread",
            ai_summary: item.ai_summary
          });
        });
        localCache.forEach(e => {
          if (!map.has(e.id)) map.set(e.id, e);
        });
        const merged = Array.from(map.values());
        setEmails(merged);
        try {
          localStorage.setItem("revflow_web_emails", JSON.stringify(merged));
        } catch (e) {}
      } else if (localCache.length > 0) {
        setEmails(localCache);
      } else {
        setEmails(defaultWebEmails);
      }
    } catch (err) {
      console.log("Using local web email repository");
      setEmails(localCache.length > 0 ? localCache : defaultWebEmails);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, []);

  // Currently Selected Email
  const activeEmail = useMemo(() => {
    return emails.find(e => e.id === selectedEmailId) || emails[0] || null;
  }, [emails, selectedEmailId]);

  // Mark as read when selected
  useEffect(() => {
    if (activeEmail && activeEmail.status === "unread") {
      const updated = emails.map(e => e.id === activeEmail.id ? { ...e, status: "read" as const } : e);
      setEmails(updated);
      try {
        localStorage.setItem("revflow_web_emails", JSON.stringify(updated));
      } catch (err) {}
    }
  }, [selectedEmailId]);

  // Filtered Emails Calculation
  const filteredEmails = useMemo(() => {
    return emails.filter(e => {
      const matchesSearch =
        e.visitor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.visitor_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.visitor_phone.includes(searchTerm);

      if (!matchesSearch) return false;
      if (filterCategory === "unread") return e.status === "unread";
      if (filterCategory === "appointment") return e.form_type.includes("Appointment");
      if (filterCategory === "emergency") return e.form_type.includes("Emergency") || e.subject.toLowerCase().includes("urgent");
      if (filterCategory === "replied") return e.status === "replied" || e.status === "booked";
      return true;
    });
  }, [emails, searchTerm, filterCategory]);

  // Simulate Live Website Form Submission (Demo Test Tool)
  const handleSimulateFormSubmission = () => {
    const demoNames = ["David Clark", "Rachel Green", "Brian Adams", "Laura Vance"];
    const randomName = demoNames[Math.floor(Math.random() * demoNames.length)];
    const randomId = `web-email-${Date.now()}`;

    const newFormEmail: WebEmail = {
      id: randomId,
      form_type: "Appointment Request Form",
      visitor_name: randomName,
      visitor_email: `${randomName.toLowerCase().replace(" ", ".")}@example.com`,
      visitor_phone: "(555) 789-0123",
      subject: `New Website Appointment Request from ${randomName}`,
      message: `Hello RevFlow Dental! I just filled out your online appointment form. I would like to schedule a routine dental checkup and teeth cleaning next week.`,
      requested_date: "2026-07-29",
      requested_time: "11:00 AM",
      treatment_type: "Checkup & Cleaning",
      preferred_doctor: "Dr. Sarah Jenkins, DDS",
      received_at: new Date().toISOString(),
      status: "unread",
      ai_summary: `Routine Hygiene Request • ${randomName} requested 11:00 AM appointment.`
    };

    const updated = [newFormEmail, ...emails];
    setEmails(updated);
    setSelectedEmailId(randomId);
    try {
      localStorage.setItem("revflow_web_emails", JSON.stringify(updated));
    } catch (e) {}

    setReplySuccessToast(`✨ Received live web form submission from ${randomName}!`);
    setTimeout(() => setReplySuccessToast(null), 4000);
  };

  // Send Email Reply Handler
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeEmail) return;
    setIsSendingReply(true);

    setTimeout(() => {
      const updated = emails.map(em => em.id === activeEmail.id ? { ...em, status: "replied" as const } : em);
      setEmails(updated);
      try {
        localStorage.setItem("revflow_web_emails", JSON.stringify(updated));
      } catch (e) {}

      setIsSendingReply(false);
      setReplyText("");
      setReplySuccessToast(`✉️ Email reply sent successfully to ${activeEmail.visitor_email}!`);
      setTimeout(() => setReplySuccessToast(null), 4000);
    }, 800);
  };

  // Metrics
  const totalEmailsCount = emails.length;
  const unreadCount = emails.filter(e => e.status === "unread").length;
  const appointmentFormsCount = emails.filter(e => e.form_type.includes("Appointment")).length;
  const emergencyCount = emails.filter(e => e.form_type.includes("Emergency")).length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Toast Notice */}
      {replySuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-indigo-500/40 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <Sparkles className="h-5 w-5 text-emerald-400 fill-emerald-400" />
          <span className="text-xs font-bold">{replySuccessToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
              Website Contact & Appointment Forms Integration
            </span>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {unreadCount} Unread Forms
              </span>
            )}
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-white">
            <Inbox className="h-8 w-8 text-indigo-400" />
            Website Contact & Booking Web Email Inbox
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Real-time inbox for website visitor appointment forms, contact us enquiries, and emergency toothache alerts.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Button
            onClick={handleSimulateFormSubmission}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-5 py-2.5 shadow-lg shadow-indigo-600/30 flex items-center gap-2 font-medium transition-all active:scale-95 text-xs"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            Simulate Web Form Submission
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Web Form Emails</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Inbox className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">{totalEmailsCount} Received</div>
            <div className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">
              <span>Website visitor inquiries</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Booking Forms</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">{appointmentFormsCount} Requests</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>Submitted online</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Emergency Alerts</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">{emergencyCount} Urgent</div>
            <div className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 font-medium mt-1">
              <span>Priority toothache alerts</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unread Submissions</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Mail className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">{unreadCount} Pending</div>
            <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
              <span>Needs staff response</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main 2-Column Mail Client Application Shell */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px] rounded-3xl border bg-background shadow-xl overflow-hidden">
        
        {/* LEFT COLUMN: Email Inbox Roster (5 Cols) */}
        <div className="lg:col-span-5 border-r flex flex-col bg-muted/10">
          
          {/* Toolbar & Search */}
          <div className="p-4 border-b space-y-3 bg-muted/20">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Inbox className="h-4 w-4 text-indigo-500" />
                Website Web Emails
              </h3>
              <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-500/20">
                {filteredEmails.length} Emails
              </span>
            </div>

            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search visitor, email, subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
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
                onClick={() => setFilterCategory("unread")}
                className={`px-3 py-0.5 rounded-full transition-all ${
                  filterCategory === "unread" ? "bg-indigo-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setFilterCategory("appointment")}
                className={`px-3 py-0.5 rounded-full transition-all ${
                  filterCategory === "appointment" ? "bg-indigo-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Bookings
              </button>
              <button
                onClick={() => setFilterCategory("emergency")}
                className={`px-3 py-0.5 rounded-full transition-all ${
                  filterCategory === "emergency" ? "bg-indigo-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Urgent
              </button>
            </div>
          </div>

          {/* Email List */}
          <div className="flex-1 overflow-y-auto divide-y [scrollbar-width:thin]">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-500 mb-2" />
                Loading web emails...
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-xs">
                No web form emails found matching your search.
              </div>
            ) : (
              filteredEmails.map(em => {
                const isSelected = em.id === activeEmail?.id;
                const isUnread = em.status === "unread";
                const isEmergency = em.form_type.includes("Emergency");

                return (
                  <div
                    key={em.id}
                    onClick={() => setSelectedEmailId(em.id)}
                    className={`p-4 cursor-pointer transition-all flex items-start gap-3 relative ${
                      isSelected
                        ? "bg-indigo-600/10 border-l-4 border-indigo-600"
                        : isUnread
                        ? "bg-background font-bold"
                        : "bg-muted/10 hover:bg-muted/30"
                    }`}
                  >
                    <div className={`h-9 w-9 rounded-2xl flex items-center justify-center text-xs font-bold text-white shadow-xs flex-shrink-0 ${
                      isEmergency ? "bg-rose-600" : "bg-indigo-600"
                    }`}>
                      {em.visitor_name.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs truncate ${isUnread ? "font-extrabold text-foreground" : "font-semibold text-foreground"}`}>
                          {em.visitor_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                          {new Date(em.received_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>

                      <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold truncate mt-0.5">
                        {em.subject}
                      </div>

                      <p className="text-[11px] text-muted-foreground truncate mt-0.5 line-clamp-1">
                        {em.message}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                          isEmergency
                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                            : "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30"
                        }`}>
                          {em.form_type}
                        </span>

                        {em.status === "replied" && (
                          <span className="text-[9px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            Replied
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Reading Pane & Reply Composer (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col h-full bg-background overflow-hidden">
          {activeEmail ? (
            <div className="flex flex-col h-full overflow-y-auto [scrollbar-width:thin] p-6 space-y-6">
              
              {/* Mail Header */}
              <div className="border-b pb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20">
                    {activeEmail.form_type}
                  </span>

                  <span className="text-xs text-muted-foreground font-mono">
                    Received: {new Date(activeEmail.received_at).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>

                <h2 className="text-xl font-extrabold text-foreground tracking-tight">
                  {activeEmail.subject}
                </h2>

                {/* Visitor Details Card */}
                <div className="p-4 rounded-2xl bg-muted/20 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                      {activeEmail.visitor_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground">{activeEmail.visitor_name}</div>
                      <div className="text-muted-foreground flex items-center gap-2 font-mono text-[11px] mt-0.5">
                        <span><Mail className="h-3 w-3 inline mr-1" />{activeEmail.visitor_email}</span>
                        <span>•</span>
                        <span><Phone className="h-3 w-3 inline mr-1" />{activeEmail.visitor_phone}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => setIsBookingOpen(true)}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs px-4"
                  >
                    <Calendar className="h-3.5 w-3.5 mr-1" /> Book to Calendar
                  </Button>
                </div>
              </div>

              {/* Form Data Summary Box */}
              {activeEmail.requested_date && (
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2 text-xs">
                  <div className="font-bold text-indigo-600 dark:text-indigo-300 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                    <Sparkles className="h-3.5 w-3.5" /> Extracted Website Form Fields
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-semibold pt-1">
                    <div className="p-2.5 rounded-xl bg-background border">
                      <span className="text-[10px] text-muted-foreground block font-normal">Requested Date:</span>
                      <span className="text-foreground font-mono">{activeEmail.requested_date}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-background border">
                      <span className="text-[10px] text-muted-foreground block font-normal">Preferred Time:</span>
                      <span className="text-foreground font-mono">{activeEmail.requested_time || "10:00 AM"}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-background border">
                      <span className="text-[10px] text-muted-foreground block font-normal">Treatment Service:</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{activeEmail.treatment_type || "General Checkup"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Full Email Message Content */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Visitor Message</span>
                <div className="p-5 rounded-2xl bg-muted/15 border text-xs text-foreground leading-relaxed whitespace-pre-wrap font-medium">
                  {activeEmail.message}
                </div>
              </div>

              {/* Quick Email Reply Composer */}
              <form onSubmit={handleSendReply} className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-xs flex items-center gap-1.5 text-foreground">
                    <Reply className="h-4 w-4 text-indigo-500" />
                    Reply to {activeEmail.visitor_name} ({activeEmail.visitor_email})
                  </label>
                  
                  {/* Template autofill buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setReplyText(`Hi ${activeEmail.visitor_name},\n\nThank you for reaching out to RevFlow Dental Clinic! We have received your website appointment request for ${activeEmail.requested_date || "tomorrow"} at ${activeEmail.requested_time || "10:00 AM"}. Your slot has been reserved with ${activeEmail.preferred_doctor || "Dr. Sarah Jenkins"}.\n\nPlease let us know if you have any questions!\n\nBest regards,\nRevFlow Dental Staff`)}
                      className="rounded-full text-[10px] h-6 px-2.5"
                    >
                      Autofill Confirmation Template
                    </Button>
                  </div>
                </div>

                <textarea
                  rows={4}
                  required
                  placeholder="Type your email reply to the patient..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full p-3 text-xs rounded-2xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    Replies will be dispatched via clinic SMTP email server.
                  </span>

                  <Button
                    type="submit"
                    disabled={isSendingReply}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs px-5 flex items-center gap-2"
                  >
                    {isSendingReply ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Sending Email...
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        Send Email Reply
                      </>
                    )}
                  </Button>
                </div>
              </form>

            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">Select an email from the left inbox to view details.</div>
          )}
        </div>

      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={() => loadEmails()}
      />

    </div>
  );
}
