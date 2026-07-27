"use client"

import React from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 transition-all duration-300">
        <Header />
        
        <main className="relative flex-1 overflow-auto bg-background">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-64 gradient-mesh opacity-40" />
          <div className="relative h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
