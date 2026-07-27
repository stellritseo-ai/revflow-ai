"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Lock, Fingerprint, Activity, Users, Key } from 'lucide-react';
import { Switch } from "@/components/ui/switch";

export default function SecurityDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><div className="animate-pulse flex flex-col items-center"><ShieldCheck className="h-12 w-12 text-blue-500 mb-4" /><div>Loading Security Center...</div></div></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enterprise Security</h1>
          <p className="text-muted-foreground mt-2">Monitor and configure platform-wide security policies.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="px-3 py-1 bg-green-500/10 text-green-600 border-green-200">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            System Secure
          </Badge>
          <Badge variant="outline" className="px-3 py-1">Score: 94/100</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">MFA Adoption</CardTitle>
            <Fingerprint className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">82%</div>
            <p className="text-xs text-muted-foreground mt-1">+12% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground mt-1">Across 42 tenants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Blocked Attacks</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,204</div>
            <p className="text-xs text-muted-foreground mt-1">Rate limits & prompt injections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Encrypted Fields</CardTitle>
            <Lock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground mt-1">At-rest encryption active</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Security Policies</CardTitle>
            <CardDescription>Configure global enforcement policies.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium">Enforce MFA Globally</div>
                <div className="text-sm text-muted-foreground">Require all users to enable Two-Factor Authentication.</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium">Strict Password Policy</div>
                <div className="text-sm text-muted-foreground">Min 12 chars, upper, lower, numbers, symbols.</div>
              </div>
              <Switch defaultChecked disabled />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium">AI Prompt Injection Guard</div>
                <div className="text-sm text-muted-foreground">Block heuristic patterns in patient messages.</div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Audit Logs</CardTitle>
            <CardDescription>Security and administrative events.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'password_reset_success', user: 'admin@clinic.com', time: '10 mins ago', type: 'auth' },
                { action: 'update_insurance', user: 'owner@dentist.com', time: '1 hour ago', type: 'settings' },
                { action: 'prompt_injection_blocked', user: 'anonymous', time: '3 hours ago', type: 'security' },
                { action: 'logout_all_devices', user: 'doctor@dental.com', time: '5 hours ago', type: 'auth' },
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${
                      log.type === 'auth' ? 'bg-blue-100 text-blue-600' :
                      log.type === 'security' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {log.type === 'auth' ? <Users size={16} /> : log.type === 'security' ? <ShieldAlert size={16} /> : <Lock size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{log.action}</p>
                      <p className="text-xs text-muted-foreground">{log.user}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{log.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
