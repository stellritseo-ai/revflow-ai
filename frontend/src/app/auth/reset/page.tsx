"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Inbox } from "lucide-react";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 1000);
  };

  if (submitted) {
    return (
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl text-center">
        <div className="mx-auto h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
          <Inbox className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight mb-2">Check your email</h2>
        <p className="text-slate-400 text-xs mb-6 max-w-xs mx-auto">
          We have sent recovery instructions to <span className="text-white font-medium">{email}</span>. 
          Please check your inbox.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative">
      <div className="flex flex-col items-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-center">Reset Password</h2>
        <p className="text-slate-400 text-xs text-center mt-1">
          Enter your email to receive recovery instructions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@dentalcare.com"
            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 mt-6"
        >
          {loading ? "Sending Instructions..." : "Send Instructions"}
        </button>
      </form>

      <p className="text-center text-xs text-slate-500 mt-6">
        Remembered your password?{" "}
        <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1">
          Log in
        </Link>
      </p>
    </div>
  );
}
