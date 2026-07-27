"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Cpu,
  LayoutDashboard,
  PhoneCall,
  Calendar,
  Users,
  BarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useTenant } from "@/lib/tenant-context";

const navItems = [
  { href: "/super-admin", label: "Super Admin Portal", icon: ShieldCheck, roles: ["super_admin"] },
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin", "clinic_owner", "office_manager", "receptionist", "doctor", "marketing", "billing", "viewer"] },
  { href: "/calls", label: "Missed Calls", icon: PhoneCall, roles: ["super_admin", "clinic_owner", "office_manager", "receptionist", "doctor"] },
  { href: "/calendar", label: "Calendar", icon: Calendar, roles: ["super_admin", "clinic_owner", "office_manager", "receptionist", "doctor"] },
  { href: "/patients", label: "Patients", icon: Users, roles: ["super_admin", "clinic_owner", "office_manager", "receptionist", "doctor"] },
  { href: "/admin/users", label: "Staff Directory", icon: Shield, roles: ["super_admin", "clinic_owner", "office_manager"] },
  { href: "/analytics", label: "Analytics", icon: BarChart2, roles: ["super_admin", "clinic_owner", "office_manager", "marketing", "billing"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["super_admin", "clinic_owner", "office_manager"] },
];

const ROLE_COLORS: Record<string, string> = {
  super_admin: "text-rose-400 bg-rose-500/10",
  clinic_owner: "text-indigo-400 bg-indigo-500/10",
  receptionist: "text-emerald-400 bg-emerald-500/10",
  doctor: "text-sky-400 bg-sky-500/10",
  office_manager: "text-violet-400 bg-violet-500/10",
  marketing: "text-pink-400 bg-pink-500/10",
  billing: "text-amber-400 bg-amber-500/10",
  viewer: "text-slate-400 bg-slate-500/10",
};


function getRoleLabel(role: string) {
  return role.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { tenant } = useTenant();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const visibleNav = navItems.filter(item => item.roles.includes(user.role));
  const roleColorClass = ROLE_COLORS[user.role] || "text-slate-400 bg-slate-500/10";

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  return (
    <aside
      className={`flex flex-col h-screen bg-slate-950 border-r border-white/5 transition-all duration-300 ease-in-out ${
        collapsed ? "w-[68px]" : "w-[240px]"
      } shrink-0`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
          <Cpu className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <span className="text-sm font-bold tracking-tight text-white">
              RevFlow <span className="text-indigo-400">AI</span>
            </span>
            <span className="block text-[9px] text-slate-500 font-medium tracking-widest uppercase">
              Enterprise
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-slate-500 hover:text-white transition-colors"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Clinic Info */}
      {!collapsed && tenant && (
        <div className="px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            {tenant.ai_enabled ? (
              <Wifi className="h-3 w-3 text-emerald-400 shrink-0" />
            ) : (
              <WifiOff className="h-3 w-3 text-slate-500 shrink-0" />
            )}
            <span className="text-xs text-slate-300 font-medium truncate">{tenant.name}</span>
          </div>
          <span className="block text-[10px] text-slate-500 mt-0.5 truncate">
            {tenant.subdomain}.revflow.ai
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-indigo-400" : "group-hover:text-white"}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="border-t border-white/5 p-3">
        <div className={`flex items-center gap-3 mb-2 ${collapsed ? "justify-center" : ""}`}>
          <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-xs font-bold shrink-0">
            {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <span className="block text-xs font-semibold text-white truncate">
                {user.first_name} {user.last_name}
              </span>
              <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 ${roleColorClass}`}>
                {getRoleLabel(user.role)}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all duration-150 ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </aside>
  );
}
