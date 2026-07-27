"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ChevronRight } from "lucide-react"

function humanize(seg: string) {
  const map: Record<string, string> = {
    "ai-receptionist": "AI Receptionist",
    "live-calls": "Live Calls",
    "live-chat": "Live Chat",
    "web-email": "Web Email",
    patients: "Patient Management",
    doctors: "Doctors",
    records: "Medical Records",
    treatments: "Treatment Plans",
    billing: "Billing & Payments",
    sms: "SMS Conversations",
    voice: "AI Voice Calls",
    followups: "Follow-ups",
    analytics: "Reports & Analytics",
    knowledge: "Knowledge Base",
    users: "User Management",
    activity: "Activity Logs",
    permissions: "Permissions",
    roles: "Roles",
    forbidden: "Access denied",
  }
  if (map[seg]) return map[seg]
  return seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function Breadcrumbs({ trail }: { trail?: { label: string; href?: string }[] }) {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  
  // Create breadcrumb items natively if no trail provided
  const items = trail ?? segments.slice(1).map((seg, i) => ({
    label: humanize(seg),
    href: i < segments.length - 2 ? "/" + segments.slice(0, i + 2).join("/") : undefined,
  }))

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Link href="/" className="flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-muted/60 hover:text-foreground transition-colors">
        <Home className="h-3 w-3" /> Dashboard
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3 opacity-60" />
          {item.href ? (
            <Link href={item.href} className="rounded-md px-1.5 py-0.5 hover:bg-muted/60 hover:text-foreground transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="rounded-md px-1.5 py-0.5 font-medium text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  breadcrumbs,
  children,
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  breadcrumbs?: { label: string; href?: string }[]
  children: ReactNode
}) {
  return (
    <div className="space-y-6 p-4 lg:p-6 w-full max-w-[1400px] mx-auto">
      <div className="relative z-10">
        <Breadcrumbs trail={breadcrumbs} />
      </div>
      <section className="relative z-10 fade-up flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && (
            <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">
              {eyebrow}
            </div>
          )}
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </section>
      <div className="relative z-10 space-y-6">{children}</div>
    </div>
  )
}

export function Card({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-2xl border border-border/60 bg-card shadow-soft ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            {title && <div className="text-sm font-semibold">{title}</div>}
            {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}

export function Pill({
  children,
  tone = "default",
}: {
  children: ReactNode
  tone?: "default" | "primary" | "success" | "warning" | "danger" | "violet"
}) {
  const tones: Record<string, string> = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-foreground",
    danger: "bg-destructive/10 text-destructive",
    violet: "bg-violet/10 text-violet",
  }
  return (
    <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  )
}
