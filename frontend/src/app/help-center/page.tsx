"use client"

import { HelpCircle } from "lucide-react"
import { PlaceholderView } from "@/components/placeholder-view"

export default function HelpCenterPage() {
  return (
    <PlaceholderView 
      title="Support & Help Center" 
      description="Get help, read documentation, and contact our dedicated support team."
      icon={HelpCircle}
      features={[
        "Comprehensive knowledge base",
        "Video tutorials and webinars",
        "Live chat support",
        "API documentation"
      ]}
    />
  )
}
