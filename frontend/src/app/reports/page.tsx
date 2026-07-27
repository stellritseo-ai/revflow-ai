"use client"

import { BarChart3 } from "lucide-react"
import { PlaceholderView } from "@/components/placeholder-view"

export default function ReportsPage() {
  return (
    <PlaceholderView 
      title="Advanced Reports" 
      description="Generate comprehensive reports on clinical, financial, and operational metrics."
      icon={BarChart3}
      features={[
        "Custom report builder",
        "Scheduled email reports",
        "End-of-day summary sheets",
        "Staff payroll and commissions"
      ]}
    />
  )
}
