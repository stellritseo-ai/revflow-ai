"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Activity, ToggleLeft, ToggleRight, Settings } from "lucide-react"

export default function AutomationRulesPage() {
  const [rules, setRules] = useState([
    { id: 1, name: "No-Show Rebooking Link", trigger: "NO_SHOW", action: "SEND_SMS", delay: "60 mins", active: true },
    { id: 2, name: "6 Month Recall Follow-up", trigger: "RECALL_DUE", action: "SEND_SMS", delay: "0 mins", active: true },
    { id: 3, name: "High Value Treatment Open > 7 Days", trigger: "TREATMENT_PENDING", action: "AI_VOICE_CALL", delay: "7 days", active: false },
    { id: 4, name: "Insurance Expiring End of Year", trigger: "INSURANCE_EXPIRING", action: "SEND_EMAIL", delay: "30 days", active: true },
    { id: 5, name: "Cancellation Waitlist Match", trigger: "CANCELLATION", action: "CREATE_TASK", delay: "0 mins", active: true },
  ])

  const toggleRule = (id: number) => {
    setRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r))
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link href="/revenue" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2 w-fit">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Activity className="w-8 h-8 text-indigo-500" />
            Automation Rules
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Configure AI triggers and orchestrations for revenue recovery.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm shadow-indigo-500/20">
            <Plus className="w-4 h-4" />
            Create Rule
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {rules.map(rule => (
          <div key={rule.id} className={`bg-card border ${rule.active ? 'border-indigo-200 shadow-indigo-500/10 shadow-md' : 'border-border shadow-sm'} rounded-xl p-5 flex flex-col transition-all relative overflow-hidden group`}>
            {rule.active && (
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <h3 className={`font-bold ${rule.active ? 'text-foreground' : 'text-muted-foreground'}`}>{rule.name}</h3>
              <button onClick={() => toggleRule(rule.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                {rule.active ? (
                  <ToggleRight className="w-6 h-6 text-indigo-500" />
                ) : (
                  <ToggleLeft className="w-6 h-6" />
                )}
              </button>
            </div>
            
            <div className="flex flex-col gap-3 flex-1 mt-2">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">When</span>
                <span className="text-sm font-medium px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded w-fit mt-1 border border-border">
                  {rule.trigger.replace('_', ' ')}
                </span>
              </div>
              
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Then</span>
                <span className="text-sm font-medium px-2.5 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 rounded w-fit mt-1 border border-indigo-200 dark:border-indigo-500/20">
                  {rule.action.replace(/_/g, ' ')}
                </span>
              </div>
              
              <div className="flex flex-col mt-auto pt-4 border-t border-border/50">
                <span className="text-xs text-muted-foreground">
                  Delay: <span className="font-medium text-foreground">{rule.delay}</span>
                </span>
              </div>
            </div>
            
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 bg-background border border-border rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
