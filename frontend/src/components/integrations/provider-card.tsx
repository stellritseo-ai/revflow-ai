"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, ArrowRight, Cable, AlertTriangle } from "lucide-react"

export interface ProviderCatalogItem {
  id: string
  name: string
  auth: string
  supports_webhooks: boolean
  logo: string
  description: string
  status: "available" | "coming_soon"
}

interface ProviderCardProps {
  provider: ProviderCatalogItem
  isConnected: boolean
  isVerified: boolean
  isConnecting: boolean
  onConnect: (providerId: string) => void
  onDisconnect: (credentialId: string) => void
  credentialId?: string
}

export function ProviderCard({
  provider,
  isConnected,
  isVerified,
  isConnecting,
  onConnect,
  onDisconnect,
  credentialId,
}: ProviderCardProps) {
  const isAvailable = provider.status === "available"

  return (
    <Card className={`relative overflow-hidden border-border/50 transition-all duration-300 hover:shadow-md ${isConnected ? 'ring-1 ring-primary/20' : ''}`}>
      {/* Background glow for connected providers */}
      {isConnected && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
      )}
      
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{provider.logo}</span>
            <CardTitle className="text-lg font-bold tracking-tight">{provider.name}</CardTitle>
          </div>
          <CardDescription className="text-xs pt-1">
            Auth: <span className="font-semibold text-muted-foreground uppercase">{provider.auth.replace('_', ' ')}</span>
          </CardDescription>
        </div>

        <div>
          {isConnected ? (
            isVerified ? (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Unverified
              </Badge>
            )
          ) : isAvailable ? (
            <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              Ready
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-muted text-muted-foreground">
              Coming Soon
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-6">
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
          {provider.description}
        </p>
        
        {provider.supports_webhooks && (
          <div className="mt-3 flex items-center gap-1 text-[10px] text-primary/60 font-semibold bg-primary/5 px-2 py-0.5 rounded-full w-fit">
            <Cable className="w-3 h-3" />
            Supports Webhooks
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t border-border/40 bg-muted/10 pt-4 flex gap-2 justify-end">
        {isConnected ? (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-rose-500 border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-600"
              onClick={() => credentialId && onDisconnect(credentialId)}
            >
              Disconnect
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => onConnect(provider.id)}
            >
              Configure
            </Button>
          </>
        ) : (
          <Button
            variant={isAvailable ? "default" : "outline"}
            size="sm"
            disabled={!isAvailable || isConnecting}
            className={isAvailable ? "shadow-sm" : "text-muted-foreground"}
            onClick={() => onConnect(provider.id)}
          >
            {isConnecting ? "Connecting..." : isAvailable ? "Configure" : "Locked"}
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
