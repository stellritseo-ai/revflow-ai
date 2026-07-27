"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Database, CheckCircle2, XCircle, ArrowLeft, RefreshCw, Server } from "lucide-react";
import { fetchApi } from "@/lib/api-client";

interface HealthDetails {
  database_latency_ms?: number;
  redis_latency_ms?: number;
  database_error?: string;
  redis_error?: string;
}

interface HealthResponse {
  status: string;
  services: {
    database: string;
    redis: string;
  };
  details: HealthDetails;
}

export default function HealthPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApi<HealthResponse>("/health");
      setHealth(data);
    } catch (err: any) {
      console.error("Health check error:", err);
      setError(err.message || "Failed to contact backend API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col justify-between relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center gap-4 border-b border-white/5 relative z-10">
        <Link 
          href="/" 
          className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">RevFlow Diagnostics</h1>
          <p className="text-xs text-slate-500">Live operational health statistics</p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="ml-auto flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto w-full px-6 py-12 flex-grow flex flex-col justify-center relative z-10">
        
        {/* Error notification banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-rose-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Backend Unreachable</p>
              <p className="text-xs text-rose-400/90">{error}. Ensure the backend service is started.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* FastAPI Core Server Status */}
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Server className="h-6 w-6" />
              </div>
              {loading ? (
                <span className="h-3 w-3 rounded-full bg-slate-500 animate-pulse" />
              ) : error ? (
                <XCircle className="h-6 w-6 text-rose-500" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              )}
            </div>
            <h3 className="text-md font-semibold text-white">API Engine</h3>
            <p className="text-xs text-slate-500 mb-4">FastAPI Web Server instance</p>
            <div className="text-sm font-mono text-slate-300 border-t border-white/5 pt-3 mt-3">
              Status: {error ? "Offline" : "Healthy"}
            </div>
          </div>

          {/* Database (Postgres) */}
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Database className="h-6 w-6" />
              </div>
              {loading ? (
                <span className="h-3 w-3 rounded-full bg-slate-500 animate-pulse" />
              ) : health?.services.database === "healthy" ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              ) : (
                <XCircle className="h-6 w-6 text-rose-500" />
              )}
            </div>
            <h3 className="text-md font-semibold text-white">PostgreSQL</h3>
            <p className="text-xs text-slate-500 mb-4">Persistent Client DB Connection</p>
            <div className="text-sm font-mono text-slate-300 border-t border-white/5 pt-3 mt-3">
              Latency: {health?.details.database_latency_ms ? `${health.details.database_latency_ms}ms` : "N/A"}
            </div>
          </div>

          {/* Cache/State Core (Redis) */}
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Activity className="h-6 w-6" />
              </div>
              {loading ? (
                <span className="h-3 w-3 rounded-full bg-slate-500 animate-pulse" />
              ) : health?.services.redis === "healthy" ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              ) : (
                <XCircle className="h-6 w-6 text-rose-500" />
              )}
            </div>
            <h3 className="text-md font-semibold text-white">Redis Cache</h3>
            <p className="text-xs text-slate-500 mb-4">Task Queue & Context Memory</p>
            <div className="text-sm font-mono text-slate-300 border-t border-white/5 pt-3 mt-3">
              Latency: {health?.details.redis_latency_ms ? `${health.details.redis_latency_ms}ms` : "N/A"}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-6 border-t border-white/5 relative z-10 text-slate-500 text-xs flex justify-between items-center">
        <p>&copy; 2026 RevFlow AI Inc. All rights reserved.</p>
        <p className="font-mono">RevFlow AI Infrastructure Console</p>
      </footer>
    </div>
  );
}
