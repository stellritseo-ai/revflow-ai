"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldAlert, Cpu } from "lucide-react";
import { useAuthStore, UserRole } from "@/lib/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loginDev, loading, initialize } = useAuthStore();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDevRole, setSelectedDevRole] = useState<UserRole>("clinic_owner");

  useEffect(() => {
    initialize();
  }, [initialize]);

  // If already logged in, redirect based on role
  useEffect(() => {
    if (user) {
      if (user.role === "super_admin") {
        router.push("/super-admin");
      } else {
        router.push("/");
      }
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setError(null);
    try {
      await login(email, password, rememberMe);
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.role === "super_admin") {
        router.push("/super-admin");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials or verification required.");
    }
  };

  const handleDevLogin = async () => {
    setError(null);
    const loginEmail = email || `${selectedDevRole}@practice.com`;
    try {
      await loginDev(loginEmail, selectedDevRole);
      if (selectedDevRole === "super_admin") {
        router.push("/super-admin");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "Failed dev authentication.");
    }
  };

  const handleDevRoleShortcut = (role: UserRole) => {
    setSelectedDevRole(role);
    setEmail(`${role}@practice.com`);
    setPassword("password12345");
  };

  return (
    <div className="bg-[#0b1329]/80 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative max-w-md w-full mx-auto">
      
      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3 md:hidden">
          <Cpu className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-center text-white">Welcome Back</h2>
        <p className="text-slate-400 text-xs text-center mt-1">
          Sign in to your RevFlow practice account.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@practice.com"
            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-semibold text-slate-400">Password</label>
            <Link href="/auth/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300">
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded bg-slate-950/50 border-white/10 text-indigo-600 focus:ring-0 focus:ring-offset-0"
            />
            <span className="text-xs text-slate-400">Remember me</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 mt-4"
        >
          {loading ? "Authenticating..." : "Sign In"}
        </button>
      </form>

      {/* Developer Shortcut Panel */}
      <div className="mt-8 pt-6 border-t border-white/5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Dev Mode Shortcuts
          </span>
          <button
            onClick={handleDevLogin}
            disabled={loading}
            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300"
          >
            Authenticate Mock ⚡
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { role: "super_admin", label: "Super Admin" },
            { role: "clinic_owner", label: "Clinic Owner" },
            { role: "receptionist", label: "Receptionist" },
            { role: "doctor", label: "Doctor" },
            { role: "office_manager", label: "Office Manager" },
            { role: "viewer", label: "Viewer" },
          ].map((item) => (
            <button
              key={item.role}
              type="button"
              onClick={() => handleDevRoleShortcut(item.role as UserRole)}
              className={`px-3 py-2 text-xs rounded-xl border text-left transition-all duration-150 ${
                selectedDevRole === item.role
                  ? "bg-indigo-500/10 border-indigo-500 text-indigo-300 font-semibold"
                  : "bg-slate-950/30 border-white/5 text-slate-400 hover:bg-white/5 hover:border-white/10"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 mt-6">
        Need to onboard a new clinic?{" "}
        <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold">
          Create account
        </Link>
      </p>
    </div>
  );
}
