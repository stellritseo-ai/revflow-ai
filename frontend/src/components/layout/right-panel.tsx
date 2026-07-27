"use client"

import React from "react"
import { X, Bell, Zap, Calendar, UserPlus, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface RightPanelProps {
  isOpen: boolean
  onClose: () => void
}

const notifications = [
  { id: 1, type: 'appointment', title: 'New Appointment', description: 'Sarah Jenkins booked for tomorrow at 10 AM', time: '10 min ago', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 2, type: 'ai', title: 'AI Assistant', description: 'Handled 5 missed calls successfully in the last hour.', time: '1 hour ago', icon: Zap, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  { id: 3, type: 'patient', title: 'New Patient', description: 'Michael Scott completed onboarding.', time: '2 hours ago', icon: UserPlus, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 4, type: 'system', title: 'System Update', description: 'New features available in the dashboard.', time: '1 day ago', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
]

export function RightPanel({ isOpen, onClose }: RightPanelProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" 
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-80 border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-in-out sm:w-96",
          !isOpen && "translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-2 font-semibold">
            <Bell className="h-5 w-5" />
            Notifications
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)] p-6">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recent</h3>
                <span className="text-xs text-primary cursor-pointer hover:underline">Mark all as read</span>
              </div>
              <div className="space-y-4">
                {notifications.map((notif) => {
                  const Icon = notif.icon
                  return (
                    <div key={notif.id} className="flex gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors group cursor-pointer border border-transparent hover:border-border">
                      <div className={cn("mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0", notif.bg, notif.color)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">{notif.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{notif.description}</p>
                        <p className="text-xs text-muted-foreground/60 font-medium pt-1">{notif.time}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">System Health</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">AI Agents</span>
                  <span className="font-medium text-emerald-500 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Online</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">API Latency</span>
                  <span className="font-medium">24ms</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Telephony</span>
                  <span className="font-medium text-emerald-500 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Twilio Connected</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </aside>
    </>
  )
}
