"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Building2, MapPin, Users, Stethoscope, 
  Clock, Activity, ShieldCheck, FileText, 
  Palette, CreditCard, Link2, Bell, Phone,
  Bot, Mic, BookOpen
} from "lucide-react"

import { cn } from "@/lib/utils"

const navGroups = [
  {
    title: "Clinic Identity",
    items: [
      {
        title: "Business Info",
        href: "/settings/business",
        icon: Building2,
      },
      {
        title: "Locations",
        href: "/settings/locations",
        icon: MapPin,
      },
      {
        title: "Branding",
        href: "/settings/branding",
        icon: Palette,
      },
    ]
  },
  {
    title: "Team",
    items: [
      {
        title: "Doctors",
        href: "/settings/doctors",
        icon: Stethoscope,
      },
      {
        title: "Staff & Roles",
        href: "/settings/staff",
        icon: Users,
      },
    ]
  },
  {
    title: "AI Brain",
    items: [
      {
        title: "AI Profile",
        href: "/settings/ai-profile",
        icon: Bot,
      },
      {
        title: "Voice Configuration",
        href: "/settings/voice",
        icon: Mic,
      },
      {
        title: "Knowledge Center",
        href: "/settings/knowledge",
        icon: BookOpen,
      },
      {
        title: "Patient Feed & AI Campaign",
        href: "/settings/import",
        icon: Users,
      },
    ]
  },
  {
    title: "Operations",
    items: [
      {
        title: "Services",
        href: "/settings/services",
        icon: Activity,
      },
      {
        title: "Business Hours",
        href: "/settings/hours",
        icon: Clock,
      },
      {
        title: "Finances & Insurance",
        href: "/settings/finance",
        icon: CreditCard,
      },
      {
        title: "Documents",
        href: "/settings/documents",
        icon: FileText,
      },
    ]
  },
  {
    title: "System",
    items: [
      {
        title: "Security",
        href: "/settings/security",
        icon: ShieldCheck,
      },
      {
        title: "Integrations",
        href: "/settings/integrations",
        icon: Link2,
      },
      {
        title: "Phone Numbers",
        href: "/settings/phone-numbers",
        icon: Phone,
      },
      {
        title: "Notifications",
        href: "/settings/notifications",
        icon: Bell,
      },
    ]
  }
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-6 pb-8">
      {navGroups.map((group) => (
        <div key={group.title}>
          <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.title}
          </h4>
          <div className="space-y-1">
            {group.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.title}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
