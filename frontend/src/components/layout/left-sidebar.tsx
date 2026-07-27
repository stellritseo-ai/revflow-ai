"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Stethoscope, 
  PhoneCall, 
  MessageSquare, 
  Megaphone, 
  CreditCard, 
  BarChart3, 
  Settings, 
  HelpCircle,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

const mainNavItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Patients", href: "/patients", icon: Users },
  { title: "Appointments", href: "/appointments", icon: Calendar },
  { title: "Doctors", href: "/doctors", icon: Stethoscope },
  { title: "Reception", href: "/reception", icon: PhoneCall },
  { title: "Communication", href: "/communication", icon: MessageSquare },
  { title: "Marketing", href: "/marketing", icon: Megaphone },
  { title: "Revenue", href: "/revenue", icon: CreditCard },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
]

const bottomNavItems = [
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "Help Center", href: "/help-center", icon: HelpCircle },
]

interface LeftSidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function LeftSidebar({ isOpen, setIsOpen }: LeftSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 ease-in-out md:static md:translate-x-0",
          !isOpen && "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              R
            </div>
            RevFlow AI
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1 space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.title}
                  {isActive && (
                    <div className="absolute left-0 h-8 w-1 rounded-r-full bg-primary" />
                  )}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-border mt-auto">
          <nav className="flex flex-col gap-1">
            {bottomNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.title}
                </Link>
              )
            })}
          </nav>
          
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">System Healthy</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              AI Agents are actively handling calls.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
