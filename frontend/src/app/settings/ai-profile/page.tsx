"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Save, Bot, MessageSquare, Settings2, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface AIProfile {
  ai_name: string;
  receptionist_name: string;
  greeting_message: string;
  personality: string;
  response_length: string;
  emergency_rules: string;
  escalation_rules: string;
  booking_rules: string;
  business_rules: string;
  insurance_rules: string;
  appointment_rules: string;
  custom_instructions: string;
  is_active: boolean;
}

const defaultAiProfile: AIProfile = {
  ai_name: "RevFlow AI Voice Engine",
  receptionist_name: "Aria (AI Receptionist)",
  greeting_message: "Hello! Thank you for calling RevFlow Dental Clinic. I'm Aria, your AI Assistant. How can I help you today?",
  personality: "friendly",
  response_length: "standard",
  emergency_rules: "Prioritize toothaches, broken teeth, and severe pain. Reserve emergency morning slots with Dr. Sarah Jenkins.",
  escalation_rules: "If patient requests a human staff member twice or has complex billing disputes, transfer immediately to front desk extension 101.",
  booking_rules: "Schedule routine cleanings for 45 min, emergency exams for 30 min. Require patient name, phone, and DOB.",
  business_rules: "Clinic hours are Mon-Fri 8 AM - 5 PM. Closed on Sundays.",
  insurance_rules: "Accept Delta Dental PPO, MetLife, Cigna, and Guardian. 100% coverage for preventative checkups.",
  appointment_rules: "Require 24-hour notice for appointment cancellations.",
  custom_instructions: "Maintain a warm, empathetic tone. Emphasize patient comfort and pain relief for emergency calls.",
  is_active: true
};

export default function AIProfilePage() {
  const [profile, setProfile] = useState<AIProfile>(defaultAiProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    let localProf: AIProfile | null = null;
    try {
      const raw = localStorage.getItem("revflow_ai_profile");
      if (raw) localProf = JSON.parse(raw);
    } catch (e) {}

    try {
      const data = await fetchApi<AIProfile>("/ai/profile");
      if (data && data.receptionist_name) {
        setProfile({
          ...data,
          greeting_message: data.greeting_message || defaultAiProfile.greeting_message,
          emergency_rules: data.emergency_rules || defaultAiProfile.emergency_rules,
          escalation_rules: data.escalation_rules || defaultAiProfile.escalation_rules,
          booking_rules: data.booking_rules || defaultAiProfile.booking_rules,
          business_rules: data.business_rules || defaultAiProfile.business_rules,
          insurance_rules: data.insurance_rules || defaultAiProfile.insurance_rules,
          appointment_rules: data.appointment_rules || defaultAiProfile.appointment_rules,
          custom_instructions: data.custom_instructions || defaultAiProfile.custom_instructions,
        });
      } else if (localProf) {
        setProfile(localProf);
      } else {
        setProfile(defaultAiProfile);
      }
    } catch (err) {
      console.log("Using local default AI profile");
      setProfile(localProf || defaultAiProfile);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    
    setProfile((prev) => ({ ...prev, [name]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      localStorage.setItem("revflow_ai_profile", JSON.stringify(profile));
      await fetchApi("/ai/profile", {
        method: "PUT",
        body: JSON.stringify(profile),
      });
    } catch (err) {
      console.log("Saved AI profile to local storage");
    } finally {
      setSaving(false);
      setToastNotice("✨ AI Receptionist Profile updated successfully!");
      setTimeout(() => setToastNotice(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Toast Notice */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-indigo-500/40 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <Sparkles className="h-5 w-5 text-emerald-400 fill-emerald-400" />
          <span className="text-xs font-bold">{toastNotice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
              <Bot className="h-6 w-6 text-indigo-500" />
              AI Receptionist Persona & Rule Configuration
            </h1>
            <span className="text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Aria AI Active
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Configure the identity, prompt instructions, emergency rules, and escalation thresholds for your clinic's AI assistant.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-6 text-xs font-bold flex items-center gap-2 shadow-md shrink-0"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save AI Profile
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Identity Section */}
        <section className="p-6 rounded-3xl border bg-card shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold">Identity & Patient Greeting</h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">AI System Name (Internal)</label>
              <input
                type="text"
                name="ai_name"
                value={profile.ai_name}
                onChange={handleChange}
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">Receptionist Name (Patient-facing)</label>
              <input
                type="text"
                name="receptionist_name"
                value={profile.receptionist_name}
                onChange={handleChange}
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground">Standard Telephony Greeting Phrase</label>
            <p className="text-[11px] text-muted-foreground mb-1">The exact phrase spoken by the AI when answering incoming calls.</p>
            <textarea
              name="greeting_message"
              value={profile.greeting_message}
              onChange={handleChange}
              rows={2}
              className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </section>

        {/* Personality Section */}
        <section className="p-6 rounded-3xl border bg-card shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b">
            <div className="p-2 bg-teal-500/10 rounded-xl text-teal-600">
              <Settings2 className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold">Tone of Voice & Dialogue Length</h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">Personality Persona</label>
              <select
                name="personality"
                value={profile.personality}
                onChange={handleChange}
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="professional">Professional & Efficient</option>
                <option value="friendly">Friendly & Warm (Recommended)</option>
                <option value="warm">Empathetic & Caring</option>
                <option value="premium">Premium & High-End Practice</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">Response Length</label>
              <select
                name="response_length"
                value={profile.response_length}
                onChange={handleChange}
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="brief">Brief (1-2 sentences)</option>
                <option value="standard">Standard (2-4 sentences)</option>
                <option value="detailed">Detailed (Thorough explanations)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Core Rules Section */}
        <section className="p-6 rounded-3xl border bg-card shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b">
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold">Clinical Prompt Rules & Safeguards</h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">Appointment Booking Rules</label>
              <textarea
                name="booking_rules"
                value={profile.booking_rules}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">Insurance & Payment Verification Rules</label>
              <textarea
                name="insurance_rules"
                value={profile.insurance_rules}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">Emergency Toothache Protocols</label>
              <textarea
                name="emergency_rules"
                value={profile.emergency_rules}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">Human Staff Escalation Rules</label>
              <textarea
                name="escalation_rules"
                value={profile.escalation_rules}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
          
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-muted-foreground">Custom System Instructions & RAG Prompts</label>
            <textarea
              name="custom_instructions"
              value={profile.custom_instructions}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </section>

        {/* Footer Action Bar */}
        <div className="p-6 rounded-3xl border bg-card shadow-lg flex items-center justify-between sticky bottom-6 z-40">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={profile.is_active}
              onChange={handleChange}
              className="h-5 w-5 rounded border-input text-indigo-600 focus:ring-indigo-500 bg-background cursor-pointer"
            />
            <div>
              <label htmlFor="is_active" className="font-bold text-xs text-foreground cursor-pointer">
                AI Receptionist Active & Answering Live Calls
              </label>
              <p className="text-muted-foreground text-[10px]">Uncheck to route all incoming calls directly to human receptionists.</p>
            </div>
          </div>
          
          <Button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-6 text-xs font-bold flex items-center gap-2 shadow-md"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save AI Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}
