"use client"

import React from "react"
import { Bell, Search, Menu, Building2, Sun, Moon, LogOut, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthStore } from "@/lib/auth-store"
import { useTheme } from "@/components/theme-provider"
import { useRouter } from "next/navigation"

interface TopNavProps {
  toggleSidebar: () => void
  toggleRightPanel: () => void
}

export function TopNav({ toggleSidebar, toggleRightPanel }: TopNavProps) {
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full flex items-center px-4 md:px-6 justify-between">
      <div className="flex items-center gap-4 flex-1">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden md:flex">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="relative w-full max-w-sm hidden sm:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search... (Ctrl+K)"
            className="w-full bg-muted/50 border-none pl-9 rounded-full h-9 focus-visible:ring-1 focus-visible:ring-primary/50"
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'k', 'ctrlKey': true}))}
            readOnly
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Actions */}
        <div className="hidden lg:flex items-center gap-2 border-r border-border pr-4 mr-2">
          <span className="text-sm font-medium flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Building2 className="w-4 h-4" />
            Smile Dental Care
          </span>
        </div>

        {/* Theme Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-full h-9 w-9"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" onClick={toggleRightPanel} className="relative rounded-full h-9 w-9">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-background"></span>
        </Button>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-1 border border-border">
              <Avatar className="h-9 w-9">
                <AvatarImage src={undefined} alt="User" />
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/settings/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-rose-500 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-500/10 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
