"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuthStore();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simToken, setSimToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please specify your email address.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await forgotPassword(email);
      setSuccess(true);
      setSimToken(response.reset_token_sim);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0b1329]/85 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative max-w-md w-full mx-auto text-center">
      
      {!success ? (
        <>
          <div className="flex flex-col items-center mb-6">
            <h2 className="text-xl font-bold tracking-tight text-white">Reset Password</h2>
            <p className="text-slate-400 text-xs mt-1">
              Enter your email to receive a secure reset link (valid for 15 minutes).
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 text-left">
              <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@practice.com"
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 mt-6"
            >
              {loading ? "Sending link..." : "Send Reset Instructions"}
            </button>
          </form>
        </>
      ) : (
        <div className="flex flex-col items-center py-4">
          <CheckCircle2 className="h-14 w-14 text-emerald-400 mb-4" />
          <h2 className="text-xl font-bold text-white">Instructions Sent</h2>
          <p className="text-slate-400 text-xs mt-2 px-4 leading-relaxed">
            If this account exists, we have simulated sending a secure password recovery code to your registered email.
          </p>

          {/* Dev mode password reset simulator helper */}
          {simToken && (
            <div className="my-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-left w-full">
              <span className="block text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-1.5">
                Password Reset Simulator (Dev Mode)
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed mb-3">
                Since we are running in local sandbox development, click below to verify and reset your password instantly.
              </p>
              <Link
                href={`/auth/reset-password?token=${simToken}`}
                className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all"
              >
                Reset Password Link ⚡
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-white/5">
        <Link href="/auth/login" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
          Return to Login
        </Link>
      </div>
    </div>
  );
}
