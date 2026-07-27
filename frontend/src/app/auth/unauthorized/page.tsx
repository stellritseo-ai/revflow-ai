"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, LogOut } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

export default function UnauthorizedPage() {
  const { logout } = useAuthStore();

  return (
    <div className="bg-[#0b1329]/85 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative max-w-md w-full mx-auto text-center">
      <div className="flex flex-col items-center py-6">
        <div className="h-14 w-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-500">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-slate-400 text-xs mt-2 px-4 leading-relaxed">
          You do not have the required database permission roles to view this administrative resource.
        </p>
      </div>

      <div className="my-6 p-4 rounded-xl bg-slate-950/40 border border-white/5 text-left text-[11px] text-slate-400 leading-relaxed">
        If you believe this is an error, please coordinate with your clinic administrator to update your profile role assignments inside the user directory.
      </div>

      <div className="flex flex-col gap-2 mt-8">
        <Link
          href="/"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 block"
        >
          Return to Dashboard
        </Link>
        <button
          onClick={() => {
            logout();
            window.location.href = "/auth/login";
          }}
          className="w-full py-3 bg-slate-800 border border-white/10 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out / Change User
        </button>
      </div>
    </div>
  );
}
