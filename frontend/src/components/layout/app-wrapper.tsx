"use client"

import React, { useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { usePathname, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useAuthStore } from "@/lib/auth-store"

const PUBLIC_ROUTES = [
  "/auth/",
  "/onboarding",
  "/health",
]

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, initialized, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route))
  const isSuperAdminRoute = pathname?.startsWith("/super-admin")

  // Redirect unauthenticated users away from protected routes
  useEffect(() => {
    if (!initialized) return
    if (!user && !isPublicRoute) {
      router.push("/auth/login")
    }
  }, [initialized, user, isPublicRoute, router])

  // Show loading while auth is being initialized
  if (!initialized && !isPublicRoute) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
        <div className="h-screen w-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      {isPublicRoute || isSuperAdminRoute ? (
        children
      ) : (
        <DashboardLayout>
          {children}
        </DashboardLayout>
      )}
    </ThemeProvider>
  )
}
