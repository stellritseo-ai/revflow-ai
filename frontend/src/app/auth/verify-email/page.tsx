"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ShieldAlert, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { verifyEmail } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("No email verification token was found in the URL.");
      setLoading(false);
      return;
    }

    verifyEmail(token)
      .then(() => {
        setSuccess(true);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || "Failed to verify email address. The token might have expired.");
        setLoading(false);
      });
  }, [token, verifyEmail]);

  return (
    <div className="bg-[#0b1329]/85 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative max-w-md w-full mx-auto text-center">
      
      {loading && (
        <div className="flex flex-col items-center py-6">
          <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mb-4" />
          <h2 className="text-xl font-bold text-white">Verifying Account</h2>
          <p className="text-slate-400 text-xs mt-1">Please wait while we activate your login credentials...</p>
        </div>
      )}

      {!loading && success && (
        <div className="flex flex-col items-center py-4">
          <CheckCircle2 className="h-14 w-14 text-emerald-400 mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-white">Email Address Verified!</h2>
          <p className="text-slate-400 text-xs mt-2 px-4 leading-relaxed">
            Your clinic admin profile is now fully active. You can proceed to log in to the dashboard portal.
          </p>
          <Link
            href="/auth/login"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 mt-8 block"
          >
            Sign In to Practice
          </Link>
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center py-4">
          <ShieldAlert className="h-14 w-14 text-rose-500 mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-white">Verification Failed</h2>
          <p className="text-rose-300/80 text-xs mt-2 px-4 leading-relaxed">
            {error}
          </p>
          <Link
            href="/auth/signup"
            className="w-full py-3 bg-slate-800 border border-white/10 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 mt-8 block"
          >
            Back to Onboarding
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="bg-[#0b1329]/85 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative max-w-md w-full mx-auto text-center flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
