"use client";

import React, { useState, useEffect } from "react";
import {
  User, Mail, Phone, ShieldCheck, Key, Lock, Bell, Sparkles, CheckCircle2,
  Stethoscope, Save, RefreshCw, Camera, BadgeCheck, FileText, Check, QrCode
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export default function UserProfileSettingsPage() {
  const { user } = useAuthStore();

  // Personal Info Form State
  const [firstName, setFirstName] = useState(user?.first_name || "Sarah");
  const [lastName, setLastName] = useState(user?.last_name || "Jenkins");
  const [email, setEmail] = useState(user?.email || "dr.jenkins@revflow.com");
  const [phone, setPhone] = useState("(555) 234-8901");
  const [title, setTitle] = useState("Lead Dentist & Clinic Owner");
  const [npiNumber, setNpiNumber] = useState("1928374650");
  const [licenseState, setLicenseState] = useState("Illinois Board #304912");

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(true);

  // Notification Preferences
  const [notifyEmergencyCalls, setNotifyEmergencyCalls] = useState(true);
  const [notifyDailyDigest, setNotifyDailyDigest] = useState(true);
  const [notifyBookingSms, setNotifyBookingSms] = useState(true);

  // Loading & Toast State
  const [isSaving, setIsSaving] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      setIsSaving(false);
      setToastNotice("✨ User Profile and Security Credentials updated successfully!");
      setTimeout(() => setToastNotice(null), 4000);
    }, 700);
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Toast Notice */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-indigo-500/40 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <Sparkles className="h-5 w-5 text-emerald-400 fill-emerald-400" />
          <span className="text-xs font-bold">{toastNotice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
              <User className="h-6 w-6 text-indigo-500" />
              Doctor & Staff Profile Settings
            </h1>
            <span className="text-xs font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              {user?.role ? user.role.replace("_", " ") : "Clinic Owner"}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your personal contact info, clinical credentials, security preferences, and notification alerts.
          </p>
        </div>

        <Button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-6 text-xs font-bold flex items-center gap-2 shadow-md shrink-0"
        >
          {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? "Saving..." : "Save Profile"}
        </Button>
      </div>

      {/* Profile Overview Header Card */}
      <div className="p-6 rounded-3xl border bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-5 relative z-10">
          <div className="relative">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-2xl flex items-center justify-center shadow-2xl border-2 border-white/20">
              {firstName.charAt(0)}{lastName.charAt(0)}
            </div>
            <button className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-slate-900 border border-white/20 text-white hover:bg-indigo-600 transition-all">
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">Dr. {firstName} {lastName}, DDS</h2>
              <BadgeCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-slate-300 text-xs font-medium">{title}</p>
            <div className="flex items-center gap-3 pt-1 text-[11px] text-indigo-200 font-mono">
              <span>NPI: {npiNumber}</span>
              <span>•</span>
              <span>{licenseState}</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Verified Practitioner Account
          </span>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-8">
        
        {/* Personal & Professional Details */}
        <section className="p-6 rounded-3xl border bg-card shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-600">
              <User className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold">Personal & Clinical Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground">Last Name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-indigo-500" /> Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-indigo-500" /> Direct Phone Number
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground">Professional Title / Role</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground">NPI (National Provider Identifier)</label>
              <input
                type="text"
                value={npiNumber}
                onChange={(e) => setNpiNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
              />
            </div>
          </div>
        </section>

        {/* Account Security & Password */}
        <section className="p-6 rounded-3xl border bg-card shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold">Account Security & MFA Authentication</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground">Confirm New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t text-xs">
            <div className="space-y-0.5">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <QrCode className="h-4 w-4 text-indigo-500" /> Two-Factor Authentication (2FA)
              </div>
              <p className="text-muted-foreground text-[11px]">Require authenticator app passcode for extra login security.</p>
            </div>

            <input
              type="checkbox"
              checked={mfaEnabled}
              onChange={(e) => setMfaEnabled(e.target.checked)}
              className="h-5 w-5 rounded border-input text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        </section>

        {/* Notification Preferences */}
        <section className="p-6 rounded-3xl border bg-card shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b">
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-600">
              <Bell className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold">Personal Alert & Notification Preferences</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border">
              <div>
                <div className="font-bold text-foreground">Emergency Toothache Call Alerts</div>
                <p className="text-muted-foreground text-[11px]">Receive immediate push/SMS notification when AI escalates toothache pain.</p>
              </div>
              <input
                type="checkbox"
                checked={notifyEmergencyCalls}
                onChange={(e) => setNotifyEmergencyCalls(e.target.checked)}
                className="h-5 w-5 rounded border-input text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border">
              <div>
                <div className="font-bold text-foreground">Daily AI Revenue & Executive Digest</div>
                <p className="text-muted-foreground text-[11px]">Receive a 7:00 AM daily email summary of yesterday's AI bookings.</p>
              </div>
              <input
                type="checkbox"
                checked={notifyDailyDigest}
                onChange={(e) => setNotifyDailyDigest(e.target.checked)}
                className="h-5 w-5 rounded border-input text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* Footer Action */}
        <div className="p-6 rounded-3xl border bg-card shadow-lg flex items-center justify-between sticky bottom-6 z-40">
          <span className="text-xs font-semibold text-muted-foreground">
            Signed in as <strong className="text-foreground">{user?.email || "dr.jenkins@revflow.com"}</strong>
          </span>

          <Button
            type="submit"
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-6 text-xs font-bold flex items-center gap-2 shadow-md"
          >
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? "Saving..." : "Save Profile"}
          </Button>
        </div>

      </form>

    </div>
  );
}
