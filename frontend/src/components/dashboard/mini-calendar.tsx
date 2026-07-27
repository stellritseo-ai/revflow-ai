"use client"

import React, { useState } from "react"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const upcomingEvents = [
  { time: "09:00 AM", title: "Morning Huddle", type: "internal" },
  { time: "10:30 AM", title: "Sarah Jenkins - Consult", type: "patient" },
  { time: "01:00 PM", title: "Vendor Meeting", type: "external" },
  { time: "03:15 PM", title: "Mike Ross - Whitening", type: "patient" },
]

export function MiniCalendar() {
  const [date] = useState(new Date())

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">
          {date.toLocaleString('default', { month: 'long' })} {date.getFullYear()}
        </h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-4">
        {days.map(day => (
          <div key={day} className="text-[10px] font-medium text-muted-foreground uppercase">
            {day}
          </div>
        ))}
        {/* Placeholder Calendar Grid */}
        {Array.from({ length: 35 }).map((_, i) => {
          const isToday = i === 15 // Mock today
          const hasEvent = [10, 15, 18, 22].includes(i)
          
          return (
            <div 
              key={i} 
              className={`
                aspect-square flex flex-col items-center justify-center rounded-md text-sm relative cursor-pointer
                ${isToday ? 'bg-primary text-primary-foreground font-semibold shadow-md' : 'hover:bg-muted font-medium'}
                ${i < 3 ? 'text-muted-foreground/30' : ''}
              `}
            >
              {(i - 2 > 0 && i - 2 <= 31) ? i - 2 : ''}
              {hasEvent && !isToday && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </div>
          )
        })}
      </div>

      <div className="flex-1 border-t border-border pt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Today's Agenda</h4>
        <div className="space-y-3">
          {upcomingEvents.map((event, i) => (
            <div key={i} className="flex gap-3 items-start group cursor-pointer">
              <div className="flex flex-col items-center mt-0.5">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${
                  event.type === 'patient' ? 'bg-emerald-500' :
                  event.type === 'internal' ? 'bg-indigo-500' : 'bg-orange-500'
                }`} />
                {i !== upcomingEvents.length - 1 && <div className="w-[1px] h-6 bg-border mt-1" />}
              </div>
              <div className="flex-1 group-hover:bg-muted/50 p-1 -m-1 rounded-md transition-colors">
                <p className="text-sm font-medium leading-none mb-1 group-hover:text-primary transition-colors">{event.title}</p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 mr-1" />
                  {event.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
