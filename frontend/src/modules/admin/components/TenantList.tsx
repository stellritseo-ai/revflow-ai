"use client";

import React, { useState } from "react";
import { Search, MoreVertical, Play, Pause, Trash, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ClientTenant {
  id: string;
  uuid: string;
  clinic_name: string;
  slug: string;
  subscription_plan: string;
  active: boolean;
  health_score: number;
}

export function TenantList() {
  const [tenants] = useState<ClientTenant[]>([
    { id: "1", uuid: "123", clinic_name: "Smile Dental", slug: "smile-dental", subscription_plan: "enterprise", active: true, health_score: 95 },
    { id: "2", uuid: "456", clinic_name: "Apex Ortho", slug: "apex-ortho", subscription_plan: "professional", active: true, health_score: 72 },
    { id: "3", uuid: "789", clinic_name: "Bright Kids", slug: "bright-kids", subscription_plan: "starter", active: false, health_score: 45 },
  ]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Tenant Manager</CardTitle>
            <CardDescription>Manage clinics and view health scores.</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input placeholder="Search clinics..." className="pl-9 bg-background/50" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Clinic Name</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Health Score</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tenants.map(t => (
                <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{t.clinic_name}</td>
                  <td className="px-4 py-3 capitalize">{t.subscription_plan}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${t.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {t.active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Heart className={`w-4 h-4 ${t.health_score > 80 ? 'text-emerald-500' : t.health_score > 60 ? 'text-amber-500' : 'text-rose-500'}`} />
                      <span className="font-semibold">{t.health_score}/100</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Impersonate Tenant</DropdownMenuItem>
                        <DropdownMenuItem>View Usage Details</DropdownMenuItem>
                        {t.active ? (
                          <DropdownMenuItem className="text-rose-500"><Pause className="w-4 h-4 mr-2"/> Suspend</DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-emerald-500"><Play className="w-4 h-4 mr-2"/> Activate</DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-rose-600"><Trash className="w-4 h-4 mr-2"/> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
