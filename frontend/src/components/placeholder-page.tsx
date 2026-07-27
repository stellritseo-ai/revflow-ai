"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { TenantProvider } from "@/lib/tenant-context";
import Sidebar from "@/components/sidebar";

interface PlaceholderPageProps {
  icon: string;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  step: string;
}

function PlaceholderContent({ icon, title, description, badge, badgeColor, step }: PlaceholderPageProps) {
  const router = useRouter();
  const { user, initialize, initialized } = useAuthStore();

  useEffect(() => { initialize(); }, [initialize]);
  useEffect(() => {
    if (initialized && !user) router.push("/auth/login");
  }, [user, initialized, router]);

  if (!initialized || !user) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <span className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#020617] text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

        <div className="relative z-10 text-center max-w-md px-8">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-4xl">
            {icon}
          </div>

          {/* Step badge */}
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full mb-4 ${badgeColor}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            {badge}
          </span>

          {/* Title */}
          <h1 className="text-2xl font-bold tracking-tight mb-3">{title}</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">{description}</p>

          {/* Progress bar */}
          <div className="bg-slate-900 border border-white/5 rounded-xl p-4 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Build Progress</span>
              <span className="text-xs font-bold text-indigo-400">{step}</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full w-[40%] animate-pulse" />
            </div>
            <p className="text-xs text-slate-500 mt-2">Step 3 of 7 complete. This feature arrives in Step 4.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlaceholderPage({ icon, title, description, badge, badgeColor, step }: PlaceholderPageProps) {
  return (
    <TenantProvider>
      <PlaceholderContent icon={icon} title={title} description={description} badge={badge} badgeColor={badgeColor} step={step} />
    </TenantProvider>
  );
}
