"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, AlertTriangle } from "lucide-react";

export default function AccountLockoutPage() {
  return (
    <div className="bg-[#0b1329]/85 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative max-w-md w-full mx-auto text-center">
      <div className="flex flex-col items-center py-6">
        <div className="h-14 w-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-500">
          <ShieldAlert className="h-8 w-8 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-white">Account Locked Out</h2>
        <p className="text-slate-400 text-xs mt-2 px-4 leading-relaxed">
          For security reasons, your account has been temporarily locked due to 5 consecutive failed login attempts.
        </p>
      </div>

      <div className="my-6 p-4 rounded-xl bg-slate-950/40 border border-white/5 text-left text-xs space-y-2">
        <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Brute Force Lockout Policy</span>
        </div>
        <p className="text-slate-400 leading-relaxed text-[11px]">
          Access will be restored automatically after **15 minutes**. If you forgot your password, you can request a password reset below immediately to lift the block.
        </p>
      </div>

      <div className="flex flex-col gap-2 mt-8">
        <Link
          href="/auth/forgot-password"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 block"
        >
          Reset Password Now
        </Link>
        <Link
          href="/auth/login"
          className="w-full py-3 bg-slate-800 border border-white/10 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 block"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}
