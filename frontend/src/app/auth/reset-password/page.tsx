"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const { resetPassword } = useAuthStore();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Strength check
  const checkStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 12) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return score;
  };

  const strength = checkStrength(password);

  const getStrengthLabel = (score: number) => {
    if (score === 0) return { label: "Too Short", color: "bg-slate-700" };
    if (score < 3) return { label: "Weak", color: "bg-rose-500/80" };
    if (score < 5) return { label: "Medium", color: "bg-amber-500/80" };
    return { label: "Strong", color: "bg-emerald-500/80" };
  };

  const strengthMeta = getStrengthLabel(strength);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Missing or invalid reset token. Please request another reset link.");
      return;
    }
    if (!password || !confirmPassword) {
      setError("Please fill out all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (strength < 5) {
      setError("Password must meet complexity rules (minimum: Strong).");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0b1329]/85 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative max-w-md w-full mx-auto text-center">
      
      {!success ? (
        <>
          <div className="flex flex-col items-center mb-6">
            <h2 className="text-xl font-bold tracking-tight text-white">Create New Password</h2>
            <p className="text-slate-400 text-xs mt-1">
              Enter your new credentials below.
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
              <label className="block text-xs font-semibold text-slate-400 mb-1">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              
              {/* Strength Indicators */}
              {password && (
                <div className="mt-2.5 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>Complexity: {strengthMeta.label}</span>
                    <span>{strength} / 5 criteria met</span>
                  </div>
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strengthMeta.color}`}
                      style={{ width: `${(strength / 5) * 100}%` }}
                    />
                  </div>
                  <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px] text-slate-500 mt-1 list-disc pl-3">
                    <li className={password.length >= 12 ? "text-emerald-400" : ""}>Min 12 characters</li>
                    <li className={/[A-Z]/.test(password) ? "text-emerald-400" : ""}>Uppercase letter</li>
                    <li className={/[a-z]/.test(password) ? "text-emerald-400" : ""}>Lowercase letter</li>
                    <li className={/[0-9]/.test(password) ? "text-emerald-400" : ""}>Number</li>
                    <li className={/[^A-Za-z0-9]/.test(password) ? "text-emerald-400" : ""}>Special character</li>
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 mt-6"
            >
              {loading ? "Updating password..." : "Apply New Password"}
            </button>
          </form>
        </>
      ) : (
        <div className="flex flex-col items-center py-4">
          <CheckCircle2 className="h-14 w-14 text-emerald-400 mb-4" />
          <h2 className="text-xl font-bold text-white">Password Updated!</h2>
          <p className="text-slate-400 text-xs mt-2 px-4 leading-relaxed">
            Your new secure password has been applied. You can now use it to sign in to your clinic profile.
          </p>
          <Link
            href="/auth/login"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 mt-8 block"
          >
            Sign In Now
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="bg-[#0b1329]/85 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative max-w-md w-full mx-auto text-center flex items-center justify-center min-h-[300px]">
        <span className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
