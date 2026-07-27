import React from "react"
import { SettingsNav } from "@/components/settings/settings-nav"
import { TenantProvider } from "@/lib/tenant-context"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TenantProvider>
      <div className="flex flex-col md:flex-row gap-6 h-full max-w-7xl mx-auto w-full">
        {/* Sub-navigation Sidebar for Settings */}
        <aside className="w-full md:w-64 shrink-0">
          <SettingsNav />
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0 bg-background rounded-xl border shadow-sm">
          {children}
        </div>
      </div>
    </TenantProvider>
  )
}
