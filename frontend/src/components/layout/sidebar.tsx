"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Bot, PhoneCall, CalendarDays, Users, Stethoscope, Calendar,
  FileText, ClipboardList, ShieldCheck, CreditCard, MessageSquare, MessagesSquare,
  Mic, BellRing, Star, BarChart3, Zap, BookOpen, Settings, ChevronsLeft,
  MessageCircle, Inbox, UserCog, KeyRound, ScrollText,
} from "lucide-react"
import { useState, type ComponentType } from "react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/auth-store"

type NavItem = { title: string; icon: ComponentType<{ className?: string; strokeWidth?: number }>; url: string; badge?: string | null; roleRequired?: string[] }
type NavGroup = { group: string; roleRequired?: string[]; items: NavItem[] }

const NAV: NavGroup[] = [
  { group: "Overview", items: [
    { title: "Dashboard", icon: LayoutDashboard, url: "/", badge: null },
    { title: "AI Receptionist", icon: Bot, url: "/reception", badge: "Live" },
    { title: "Live Calls", icon: PhoneCall, url: "/calls", badge: "3" },
  ]},
  { group: "Clinic", items: [
    { title: "Appointments", icon: CalendarDays, url: "/appointments" },
    { title: "Patient Management", icon: Users, url: "/patients" },
    { title: "Doctors", icon: Stethoscope, url: "/doctors" },
    { title: "Calendar", icon: Calendar, url: "/calendar" },
    { title: "Medical Records", icon: FileText, url: "/records" },
    { title: "Billing & Payments", icon: CreditCard, url: "/billing" },
  ]},
  { group: "Communication", items: [
    { title: "Live Chat", icon: MessageCircle, url: "/communication", badge: "AI" },
    { title: "Web Email", icon: Inbox, url: "/web-email", badge: "New" },
    { title: "SMS Conversations", icon: MessagesSquare, url: "/sms" },
    { title: "AI Voice Calls", icon: Mic, url: "/voice" },
    { title: "Follow-ups", icon: BellRing, url: "/followups" },
  ]},
  { group: "Intelligence", items: [
    { title: "Reports & Analytics", icon: BarChart3, url: "/analytics" },
    { title: "Settings", icon: Settings, url: "/settings" },
  ]},
  { group: "User Management", roleRequired: ["SUPER_ADMIN", "CLINIC_OWNER"], items: [
    { title: "All Users", icon: Users, url: "/users" },
    { title: "Roles", icon: UserCog, url: "/users/roles" },
    { title: "Permissions", icon: KeyRound, url: "/users/permissions" },
    { title: "Activity Logs", icon: ScrollText, url: "/users/activity" },
  ]},
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { user } = useAuthStore()
  const role = user?.role ?? "GUEST"

  // Filter groups based on user role if necessary
  const visibleGroups = NAV
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.roleRequired || i.roleRequired.includes(role)) }))
    .filter((g) => g.items.length > 0 && (!g.roleRequired || g.roleRequired.includes(role)))

  return (
    <aside
      className={cn(
        "sticky top-0 h-dvh shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-out z-20",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-3 px-4">
          <div className={cn(
            "h-8 w-8 shrink-0 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold transition-all",
            !collapsed && "mr-1"
          )}>
            RV
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold tracking-tight">RevFlow AI</div>
              <div className="truncate text-[11px] text-muted-foreground">{user?.client_name || "Dental Clinic"}</div>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            aria-label="Toggle sidebar"
          >
            <ChevronsLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-6 [scrollbar-width:thin]">
          {visibleGroups.map((group) => (
            <div key={group.group} className="mt-4 first:mt-1">
              {!collapsed && (
                <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {group.group}
                </div>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.url || (pathname?.startsWith(item.url + "/") && item.url !== "/");
                  const Icon = item.icon;
                  return (
                    <li key={item.title}>
                      <Link
                        href={item.url}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition-all",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                        )}
                      >
                        {active && (
                          <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full gradient-primary" />
                        )}
                        <Icon
                          className={cn(
                            "h-[18px] w-[18px] shrink-0 transition-colors",
                            active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                          )}
                          strokeWidth={2}
                        />
                        {!collapsed && <span className="min-w-0 flex-1 truncate">{item.title}</span>}
                        {!collapsed && item.badge && (
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                              item.badge === "Live"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-primary/10 text-primary",
                            )}
                          >
                            {item.badge === "Live" && (
                              <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-destructive align-middle" />
                            )}
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {!collapsed && user && (
          <div className="mx-3 mb-3 rounded-2xl border border-sidebar-border bg-gradient-to-br from-primary/5 to-violet/10 p-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              <span className="text-xs font-semibold">Signed in</span>
            </div>
            <p className="mt-1 truncate text-[11px] text-muted-foreground">{user.first_name} {user.last_name} · {user.role.replace("_", " ")}</p>
            <Link href="/settings/profile" className="mt-2 block w-full rounded-lg gradient-primary py-1.5 text-center text-[11px] font-semibold text-white shadow-glow">
              My profile
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}
