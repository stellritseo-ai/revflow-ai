"use client"

import { Bell, Command, LogOut, Moon, Plus, Search, Settings2, Sparkles, Sun, User as UserIcon, KeyRound, ChevronDown } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/auth-store"
import { useTheme } from "@/components/theme-provider"

export function Header() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  
  const { user, logout } = useAuthStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const roleLabel = user ? user.role.replace("_", " ") : "Guest"

  const handleLogout = () => {
    setOpen(false)
    logout()
    router.push("/auth/login")
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-6 backdrop-blur-xl">
      <div className="relative flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search patients, appointments, records…"
          className="h-10 w-full rounded-xl border border-border/60 bg-muted/40 pl-9 pr-16 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:bg-background focus:shadow-glow"
          aria-label="Global search"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-border/60 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:flex">
          <Command className="h-3 w-3" /> K
        </kbd>
      </div>

      <Link
        href="/reception"
        className="hidden items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10 md:inline-flex"
      >
        <Sparkles className="h-3.5 w-3.5" /> AI Assistant
      </Link>

      <div className="hidden items-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 lg:flex">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
        </span>
        <span className="text-xs font-medium">Online</span>
      </div>

      <IconLink href="/appointments/new" label="New appointment"><Plus className="h-4 w-4" /></IconLink>
      
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-border/60 bg-card text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <IconLink href="/notifications" label="Notifications">
        <Bell className="h-4 w-4" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
      </IconLink>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Open profile menu"
          aria-expanded={open}
          className="ml-1 flex items-center gap-2 rounded-xl border border-border/60 bg-card p-1 pr-2 text-sm transition hover:bg-muted/60"
        >
          <img
            alt=""
            className="h-8 w-8 rounded-lg object-cover"
            src={`https://api.dicebear.com/9.x/initials/svg?seed=${user?.first_name || "User"}`}
          />
          <div className="hidden text-left leading-tight sm:block">
            <div className="text-xs font-semibold">{user?.first_name ? `${user.first_name} ${user.last_name}` : "Guest"}</div>
            <div className="text-[10px] text-muted-foreground">{roleLabel}</div>
          </div>
          <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
        </button>

        {open && user && (
          <div className="fade-up absolute right-0 top-12 z-40 w-64 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
            <div className="flex items-center gap-3 border-b border-border/60 p-3">
              <img alt="" className="h-10 w-10 rounded-xl object-cover" src={`https://api.dicebear.com/9.x/initials/svg?seed=${user?.first_name}`} />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{user.first_name} {user.last_name}</div>
                <div className="truncate text-[11px] text-muted-foreground">{user.email}</div>
                <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" /> Online · {roleLabel}
                </div>
              </div>
            </div>
            <div className="p-1 text-sm">
              <MenuItem href="/settings/profile" icon={UserIcon} onSelect={() => setOpen(false)}>My profile</MenuItem>
              <MenuItem href="/settings" icon={Settings2} onSelect={() => setOpen(false)}>Account settings</MenuItem>
              <MenuItem href="/settings/security" icon={KeyRound} onSelect={() => setOpen(false)}>Change password</MenuItem>
              <div className="my-1 border-t border-border/60" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-destructive transition hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

function MenuItem({ href, icon: Icon, children, onSelect }: { href: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; onSelect: () => void }) {
  return (
    <Link href={href} onClick={onSelect} className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground transition hover:bg-muted/60">
      <Icon className="h-4 w-4 text-muted-foreground" /> {children}
    </Link>
  )
}

function IconLink({ href, children, label }: { href: string; children: React.ReactNode; label: string }) {
  return (
    <Link href={href} aria-label={label} className={cn("relative grid h-10 w-10 place-items-center rounded-xl border border-border/60 bg-card text-muted-foreground transition hover:bg-muted/60 hover:text-foreground")}>
      {children}
    </Link>
  )
}
