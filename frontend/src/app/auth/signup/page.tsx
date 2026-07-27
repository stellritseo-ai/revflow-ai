"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, CheckCircle2, ChevronRight, ChevronLeft, Calendar, FileText, Lock, Building } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

export default function SignupPage() {
  const router = useRouter();
  const { registerClinic } = useAuthStore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [simToken, setSimToken] = useState<string | null>(null);

  // Step 1: Clinic details
  const [clinicName, setClinicName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("United States");

  // Step 2: Business info
  const [address, setAddress] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [specialty, setSpecialty] = useState("General Dentistry");
  const [website, setWebsite] = useState("");

  // Step 3: Admin account
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password strength validation helpers
  const checkStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 12) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return score;
  };

  const strength = checkStrength(adminPassword);

  const getStrengthLabel = (score: number) => {
    if (score === 0) return { label: "Too Short", color: "bg-slate-700" };
    if (score < 3) return { label: "Weak", color: "bg-rose-500/80" };
    if (score < 5) return { label: "Medium", color: "bg-amber-500/80" };
    return { label: "Strong", color: "bg-emerald-500/80" };
  };

  const strengthMeta = getStrengthLabel(strength);

  // prefills adminEmail if empty
  const handleGoToStep3 = () => {
    if (!adminEmail) {
      setAdminEmail(businessEmail);
    }
    setStep(3);
  };

  // Step Nav validation
  const validateStep = (s: number) => {
    setError(null);
    if (s === 1) {
      if (!clinicName || !ownerName || !businessEmail || !phone) {
        setError("Please fill out all fields on this step.");
        return false;
      }
    }
    if (s === 2) {
      if (!address || !timezone || !specialty) {
        setError("Please specify clinic address, timezone, and specialty.");
        return false;
      }
    }
    if (s === 3) {
      if (!adminEmail || !adminPassword || !confirmPassword) {
        setError("All account details are required.");
        return false;
      }
      if (adminPassword !== confirmPassword) {
        setError("Passwords do not match.");
        return false;
      }
      if (strength < 5) {
        setError("Password does not meet complexity rules (minimum score: Strong).");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step === 3) handleGoToStep3();
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      const response = await registerClinic({
        clinic_name: clinicName,
        owner_name: ownerName,
        business_email: businessEmail,
        phone,
        country,
        address,
        timezone,
        specialty,
        website: website || undefined,
        admin_email: adminEmail,
        admin_password: adminPassword,
      });

      setRegisteredEmail(response.email);
      setSimToken(response.verification_token_sim);
    } catch (err: any) {
      setError(err.message || "Failed to submit clinic registration.");
    } finally {
      setLoading(false);
    }
  };

  // Successful submission screen
  if (registeredEmail) {
    return (
      <div className="bg-[#0b1329]/80 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative max-w-lg w-full mx-auto text-center">
        <div className="flex flex-col items-center mb-6">
          <CheckCircle2 className="h-16 w-16 text-emerald-400 mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold tracking-tight text-white">Clinic Onboarding Initiated!</h2>
          <p className="text-slate-400 text-xs mt-2 px-4 leading-relaxed">
            We have sent a verification code to <span className="text-white font-medium">{registeredEmail}</span>.
            Please verify your email address to activate your dashboard.
          </p>
        </div>

        {/* Developer sandbox token simulator */}
        {simToken && (
          <div className="my-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-left">
            <span className="block text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-1.5">
              Email Token Simulator (Dev Mode)
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed mb-3">
              Since we are running in local sandbox development, click below to verify your email instantly without checking actual SMTP.
            </p>
            <Link
              href={`/auth/verify-email?token=${simToken}`}
              className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all"
            >
              Verify Email Link ⚡
            </Link>
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

  return (
    <div className="bg-[#0b1329]/80 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative max-w-lg w-full mx-auto">
      
      {/* Step indicator header */}
      <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
        {[
          { num: 1, label: "Clinic", icon: <Building className="h-3.5 w-3.5" /> },
          { num: 2, label: "Business", icon: <FileText className="h-3.5 w-3.5" /> },
          { num: 3, label: "Account", icon: <Lock className="h-3.5 w-3.5" /> },
          { num: 4, label: "Review", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-1.5">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= s.num
                ? "bg-indigo-600 text-white font-semibold"
                : "bg-slate-800 text-slate-500 border border-slate-700"
            }`}>
              {s.icon}
            </div>
            <span className={`text-[10px] uppercase font-bold tracking-wider hidden sm:inline ${
              step >= s.num ? "text-slate-200" : "text-slate-600"
            }`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Clinic Onboarding Portal</h2>
        <p className="text-slate-400 text-xs mt-0.5">Step {step} of 4: Setup your clinic details</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Clinic details */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Clinic Name</label>
            <input
              type="text"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="Apex Dental Clinic"
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Owner / Chief Practitioner Name</label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Dr. Sarah Jenkins"
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Business Email Address</label>
            <input
              type="email"
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
              placeholder="info@apexdental.com"
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555-0199"
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="United States"
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Business details */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Clinic Physical Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="100 Medical Plaza, Suite 400"
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Time Zone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-750 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="America/New_York">Eastern Time (EST)</option>
                <option value="America/Chicago">Central Time (CST)</option>
                <option value="America/Denver">Mountain Time (MST)</option>
                <option value="America/Los_Angeles">Pacific Time (PST)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Practice Specialty</label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-750 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="General Dentistry">General Dentistry</option>
                <option value="Orthodontics">Orthodontics</option>
                <option value="Pediatric Dentistry">Pediatric Dentistry</option>
                <option value="Endodontics">Endodontics</option>
                <option value="Oral Surgery">Oral Surgery</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Website URL (Optional)</label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://apexdental.com"
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Step 3: Admin account creation */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Administrator Email Address</label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@practice.com"
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Minimum 12 characters"
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {/* Password strength meter */}
            {adminPassword && (
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
                  <li className={adminPassword.length >= 12 ? "text-emerald-400" : ""}>Min 12 characters</li>
                  <li className={/[A-Z]/.test(adminPassword) ? "text-emerald-400" : ""}>Uppercase letter</li>
                  <li className={/[a-z]/.test(adminPassword) ? "text-emerald-400" : ""}>Lowercase letter</li>
                  <li className={/[0-9]/.test(adminPassword) ? "text-emerald-400" : ""}>Number</li>
                  <li className={/[^A-Za-z0-9]/.test(adminPassword) ? "text-emerald-400" : ""}>Special character</li>
                </ul>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm account password"
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Step 4: Review and Submit details */}
      {step === 4 && (
        <div className="space-y-4 text-slate-300 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 space-y-3 leading-relaxed">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/5 pb-1">
              Practice Information
            </span>
            <div className="grid grid-cols-2 gap-y-1.5 text-xs">
              <span className="text-slate-400 font-semibold">Clinic:</span>
              <span className="text-white text-right">{clinicName}</span>
              <span className="text-slate-400 font-semibold">Specialist:</span>
              <span className="text-white text-right">{specialty}</span>
              <span className="text-slate-400 font-semibold">Owner:</span>
              <span className="text-white text-right">{ownerName}</span>
              <span className="text-slate-400 font-semibold">Timezone:</span>
              <span className="text-white text-right">{timezone.split("/")[1]?.replace("_", " ")}</span>
            </div>

            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/5 pt-3 pb-1">
              Contact & Location
            </span>
            <div className="grid grid-cols-2 gap-y-1.5 text-xs">
              <span className="text-slate-400 font-semibold">Email:</span>
              <span className="text-white text-right truncate">{businessEmail}</span>
              <span className="text-slate-400 font-semibold">Phone:</span>
              <span className="text-white text-right">{phone}</span>
              <span className="text-slate-400 font-semibold">Location:</span>
              <span className="text-white text-right truncate">{address}</span>
            </div>

            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/5 pt-3 pb-1">
              Administrator Profile
            </span>
            <div className="grid grid-cols-2 gap-y-1.5 text-xs">
              <span className="text-slate-400 font-semibold">Admin Account:</span>
              <span className="text-white text-right truncate">{adminEmail}</span>
              <span className="text-slate-400 font-semibold">Assigned Role:</span>
              <span className="text-violet-400 font-semibold text-right">Clinic Owner</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 leading-relaxed px-1">
            By clicking Submit Clinic, you agree to generate a custom administrative dashboard tenant workspace for your dental practice.
          </p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5">
        {step > 1 ? (
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 border border-white/10 hover:bg-slate-800 text-xs font-semibold rounded-xl text-slate-300 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl transition-all shadow-lg shadow-indigo-500/15"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSignupSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-tr from-emerald-500 to-teal-500 text-xs font-bold text-white rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Clinic"}
          </button>
        )}
      </div>

      <p className="text-center text-xs text-slate-500 mt-6">
        Already registered?{" "}
        <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
          Sign in
        </Link>
      </p>
    </div>
  );
}
