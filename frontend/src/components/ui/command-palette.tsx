"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, FileText, User, Calendar, Settings } from "lucide-react"

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  if (!open) return null

  const items = [
    { name: "Dashboard", href: "/", icon: Search },
    { name: "Patients", href: "/patients", icon: User },
    { name: "Appointments", href: "/appointments", icon: Calendar },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Settings", href: "/settings", icon: Settings },
  ]

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-0 shadow-lg sm:rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">No results found.</p>
          ) : (
            filteredItems.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.href}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-3 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  onClick={() => handleSelect(item.href)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{item.name}</span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
