"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, ArrowRight, Save, RotateCcw, Loader2 } from "lucide-react"
import { fetchApi } from "@/lib/api-client"

export interface FieldMapping {
  id: string
  credential_id: string
  module: string
  pms_field: string
  revflow_field: string
  transform?: string
  is_active: boolean
  created_at: string
}

interface FieldMapperProps {
  credentialId?: string
  mappings: FieldMapping[]
  onMappingChanged: () => void
}

export function FieldMapper({ credentialId, mappings: initialMappings, onMappingChanged }: FieldMapperProps) {
  const [activeModule, setActiveModule] = useState<"patients" | "appointments">("patients")
  const [mappings, setMappings] = useState<FieldMapping[]>(initialMappings)
  const [saving, setSaving] = useState(false)

  // New mapping row state
  const [newPmsField, setNewPmsField] = useState("")
  const [newRevflowField, setNewRevflowField] = useState("")
  const [newTransform, setNewTransform] = useState("none")

  useEffect(() => {
    setMappings(initialMappings)
  }, [initialMappings])

  const filteredMappings = mappings.filter(m => m.module === activeModule)

  const internalFields = {
    patients: [
      { name: "first_name", label: "First Name" },
      { name: "last_name", label: "Last Name" },
      { name: "date_of_birth", label: "Date of Birth" },
      { name: "phone", label: "Phone Number" },
      { name: "email", label: "Email Address" },
      { name: "address", label: "Billing Address" },
      { name: "insurance_name", label: "Insurance Plan Name" },
    ],
    appointments: [
      { name: "start_datetime", label: "Start Date & Time" },
      { name: "end_datetime", label: "End Date & Time" },
      { name: "status", label: "Appointment Status" },
      { name: "operatory", label: "Operatory Room ID" },
      { name: "notes", label: "Appointment Notes" },
    ]
  }

  const handleAddMapping = async () => {
    if (!newPmsField || !newRevflowField || !credentialId) return
    setSaving(true)
    try {
      await fetchApi("/integrations/mapping", {
        method: "POST",
        body: JSON.stringify({
          credential_id: credentialId,
          module: activeModule,
          pms_field: newPmsField,
          revflow_field: newRevflowField,
          transform: newTransform === "none" ? null : newTransform,
        })
      })
      setNewPmsField("")
      setNewRevflowField("")
      setNewTransform("none")
      onMappingChanged()
    } catch (err) {
      console.error("Failed to save field mapping", err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMapping = async (id: string) => {
    try {
      await fetchApi(`/integrations/mapping/${id}`, {
        method: "DELETE"
      })
      onMappingChanged()
    } catch (err) {
      console.error("Failed to delete field mapping", err)
    }
  }

  const handleLoadDefaults = async () => {
    if (!credentialId) return
    setSaving(true)
    try {
      const res = await fetchApi<any>(`/integrations/mapping/defaults/${activeModule}`)
      const defaults = res.mappings || []
      
      for (const def of defaults) {
        // Skip if already mapped
        if (mappings.some(m => m.module === activeModule && m.revflow_field === def.revflow_field)) continue
        
        await fetchApi("/integrations/mapping", {
          method: "POST",
          body: JSON.stringify({
            credential_id: credentialId,
            module: activeModule,
            pms_field: def.pms_field,
            revflow_field: def.revflow_field,
          })
        })
      }
      onMappingChanged()
    } catch (err) {
      console.error("Failed to load default mappings", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Default Loader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-muted p-1 rounded-lg">
          <Button
            variant={activeModule === "patients" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveModule("patients")}
            className="text-xs h-8"
          >
            Patient Field Map
          </Button>
          <Button
            variant={activeModule === "appointments" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveModule("appointments")}
            className="text-xs h-8"
          >
            Appointment Field Map
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={saving || !credentialId}
          onClick={handleLoadDefaults}
          className="text-xs h-8"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Load Defaults
        </Button>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-base font-bold tracking-tight">Active Mappings</CardTitle>
          <CardDescription className="text-xs">
            Map {activeModule === "patients" ? "Patient" : "Appointment"} fields from the external Practice Management System to RevFlow canonical fields.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40">
                <th className="p-3 font-bold text-xs">PMS System Field (Source)</th>
                <th className="w-12"></th>
                <th className="p-3 font-bold text-xs">RevFlow Canonical (Target)</th>
                <th className="p-3 font-bold text-xs">Transformation</th>
                <th className="p-3 font-bold text-xs text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMappings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                    No custom mappings defined. Click 'Load Defaults' to pre-populate.
                  </td>
                </tr>
              ) : (
                filteredMappings.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/10 border-b border-border/30 last:border-0">
                    <td className="p-3 font-mono text-sm font-semibold">{m.pms_field}</td>
                    <td className="p-3"><ArrowRight className="w-4 h-4 text-muted-foreground" /></td>
                    <td className="p-3 font-mono text-sm font-semibold text-primary">{m.revflow_field}</td>
                    <td className="p-3">
                      {m.transform ? (
                        <Badge variant="secondary" className="capitalize text-[10px]">{m.transform}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">None</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-rose-500 rounded-full h-8 w-8"
                        onClick={() => handleDeleteMapping(m.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}

              {/* Add row */}
              {credentialId && (
                <tr className="bg-muted/5 hover:bg-muted/5 border-t border-border/40">
                  <td className="p-3">
                    <Input
                      placeholder="e.g. PatNum, HmPhone"
                      value={newPmsField}
                      onChange={e => setNewPmsField(e.target.value)}
                      className="h-9 bg-background"
                    />
                  </td>
                  <td className="p-3">
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </td>
                  <td className="p-3">
                    <select
                      value={newRevflowField}
                      onChange={e => setNewRevflowField(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Select target field</option>
                      {internalFields[activeModule].map(f => (
                        <option key={f.name} value={f.name}>{f.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <select
                      value={newTransform}
                      onChange={e => setNewTransform(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="none">None</option>
                      <option value="upper">UPPERCASE</option>
                      <option value="lower">lowercase</option>
                      <option value="trim">Trim Spaces</option>
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      size="sm"
                      disabled={saving || !newPmsField || !newRevflowField}
                      onClick={handleAddMapping}
                      className="shadow-sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Map
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
