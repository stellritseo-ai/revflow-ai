"use client";

import React from "react";
import {
  Cpu, Server, Database, HardDrive, Activity, Zap, ShieldCheck, Clock,
  RefreshCw, CheckCircle2, AlertTriangle, Layers, Radio, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InfrastructureMonitoringPage() {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Cpu className="h-6 w-6 text-emerald-400" />
              SaaS Infrastructure & Telephony Monitoring
            </h1>
            <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              Datadog Telemetry Active
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Real-time server metrics, database cluster health, Redis background queue workers, and telephony latency.
          </p>
        </div>

        <Button className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold px-4">
          <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh System Gauges
        </Button>
      </div>

      {/* Cluster Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-400 uppercase">CPU Usage</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-white">18.4%</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full w-[18%]" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-400 uppercase">RAM Memory</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-white">4.2 GB / 32 GB</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-400 h-full w-[24%]" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-400 uppercase">PostgreSQL Latency</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-emerald-400">1.2ms</div>
          <p className="text-[10px] text-slate-400">Replication Factor: 3 Node Cluster</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-400 uppercase">Redis Queue Jobs</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-white">0 Pending</div>
          <p className="text-[10px] text-emerald-400 font-semibold">12 Celery Workers Active</p>
        </div>
      </div>

      {/* Telephony & AI Voice Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-400" /> Twilio Telephony SIP Trunk Status
          </h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">SIP Trunk Status:</span>
              <span className="font-bold text-emerald-400">CONNECTED (100%)</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Inbound Webhook Response:</span>
              <span className="font-bold text-emerald-400">18ms</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-indigo-400" /> ElevenLabs Speech-to-Speech Engine
          </h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Streaming Speech Latency:</span>
              <span className="font-bold text-indigo-400">280ms</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Active Voice Streams:</span>
              <span className="font-bold text-white">4 Streams Active</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
