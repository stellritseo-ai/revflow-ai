"use client";

import React from "react";
import { Cpu, CheckCircle2, TrendingUp, Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col md:flex-row overflow-hidden relative">
      {/* Background Gradient Blurs */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none" />

      {/* Left Panel: Value Proposition Branding */}
      <div className="hidden md:flex md:w-[45%] lg:w-[40%] bg-slate-950/50 border-r border-white/5 p-12 flex-col justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              RevFlow <span className="text-indigo-400">AI</span>
            </span>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="space-y-8 my-auto">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold leading-tight">
              Reclaiming Revenue <br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                One Missed Call at a Time
              </span>
            </h2>
            <p className="text-slate-400 text-sm">
              Connect to your PMS, qualify patients instantly, and book slots directly in seconds.
            </p>
          </div>

          <div className="space-y-4">
            {/* Feature 1 */}
            <div className="flex items-start gap-3 bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
              <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold">Qualify Patients Automatically</h4>
                <p className="text-xs text-slate-400">Intelligent conversational state engine qualifying user intents.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-3 bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
              <TrendingUp className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold">Direct PMS Scheduling Integration</h4>
                <p className="text-xs text-slate-400">Writes bookings directly to Dentrix, Open Dental, Eaglesoft.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-3 bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-pink-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold">Enterprise Performance Analytics</h4>
                <p className="text-xs text-slate-400">Real-time revenue attribution and objection metrics logs.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-600">
          &copy; 2026 RevFlow AI Inc. Built for HIPAA Compliant clinics.
        </div>
      </div>

      {/* Right Panel: children forms */}
      <div className="flex-grow flex items-center justify-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
