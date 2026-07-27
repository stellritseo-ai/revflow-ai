"use client";

import React from "react";
import Link from "next/link";
import { Clock, Key } from "lucide-react";

export default function SessionExpiredPage() {
  return (
    <div className="bg-[#0b1329]/85 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative max-w-md w-full mx-auto text-center">
      <div className="flex flex-col items-center py-6">
        <div className="h-14 w-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-500">
          <Clock className="h-8 w-8 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-white">Session Expired</h2>
        <p className="text-slate-400 text-xs mt-2 px-4 leading-relaxed">
          You have been signed out because your authentication session token has expired or was revoked.
        </p>
      </div>

      <div className="my-6 p-4 rounded-xl bg-slate-950/40 border border-white/5 text-left text-xs space-y-2">
        <div className="flex items-center gap-1.5 text-indigo-400 font-semibold">
          <Key className="h-3.5 w-3.5" />
          <span>Security Timeouts</span>
        </div>
        <p className="text-slate-400 leading-relaxed text-[11px]">
          RevFlow implements security token rotations to protect sensitive clinic records from unmonitored devices. Re-authenticating restores full credentials context instantly.
        </p>
      </div>

      <Link
        href="/auth/login"
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 mt-8 block"
      >
        Sign Back In
      </Link>
    </div>
  );
}
