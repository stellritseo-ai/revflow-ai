"use client"

import React from "react"
import { ArrowLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface PlaceholderViewProps {
  title: string
  description: string
  icon: React.ElementType
  features: string[]
}

export function PlaceholderView({ title, description, icon: Icon, features }: PlaceholderViewProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center mb-8 border border-indigo-500/20 shadow-xl shadow-indigo-500/5">
        <Icon className="w-10 h-10 text-indigo-500" />
      </div>
      
      <h1 className="text-4xl font-bold tracking-tight mb-4">{title}</h1>
      <p className="text-lg text-muted-foreground max-w-xl mb-12">
        {description}
      </p>

      <div className="grid sm:grid-cols-2 gap-4 max-w-2xl w-full mb-12 text-left">
        {features.map((feature, i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border shadow-sm">
            <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
            <span className="font-medium">{feature}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <Button variant="outline" size="lg" onClick={() => router.back()} className="rounded-full px-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
        <Button size="lg" className="rounded-full px-8 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => router.push("/")}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  )
}
