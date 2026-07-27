"use client";

import React, { useEffect, useState, useRef } from "react";
import { Loader2, Phone, Search, SlidersHorizontal, BrainCircuit, PhoneIncoming, FileText, Activity } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { CallStatusBadge } from "@/components/calls/CallStatusBadge";
import { CallNotesDialog } from "@/components/calls/CallNotesDialog";


interface Call {
  id: string;
  client_id: string;
  call_sid: string;
  from_number: string;
  to_number: string;
  status: string;
  direction: string;
  duration_seconds: number | null;
  notes: string | null;
  revenue_estimate: number | null;
  created_at: string;
  updated_at: string;
}

export default function CallsDashboard() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Action states
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  // Dialog State
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  
  // WebSocket Reference
  const ws = useRef<WebSocket | null>(null);

  const loadCalls = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<Call[]>("/calls?limit=100");
      setCalls(data);
    } catch (err) {
      console.error("Failed to load calls", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalls();
    
    // Grab client_id from the auth store's localStorage key
    const storedUser = localStorage.getItem('revflow_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        const clientId = userData.client_id;
        if (clientId) {
          // Connect to the WebSocket Live Feed
          // Ensure we use ws:// for http and wss:// for https
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const wsUrl = `${protocol}//localhost:8000/api/v1/calls/live?client_id=${clientId}`;
          
          ws.current = new WebSocket(wsUrl);
          
          ws.current.onopen = () => {
            console.log("🟢 Connected to AI Voice Live Feed");
          };
          
          ws.current.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (data.event === "connected" || data.event === "pong") return;
              
              if (data.event === "call_created" || data.event === "call_updated") {
                loadCalls();
              }

              if (data.event === "appointment_booked") {
                // Reload calls to show the updated status
                loadCalls();
                // Show a browser notification or banner
                const appt = data.appointment;
                if (appt) {
                  console.log("📅 AI booked appointment:", appt);
                  // Dispatch a custom event so other pages (calendar) can react
                  window.dispatchEvent(new CustomEvent("ai_appointment_booked", { detail: appt }));
                }
              }
            } catch (e) {
              console.error("Failed to parse websocket message", e);
            }
          };
          
          ws.current.onclose = () => {
            console.log("🔴 Disconnected from AI Voice Live Feed");
          };
        }
      } catch (e) {
        console.error("Auth parsing failed", e);
      }
    }

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const handleSimulateCall = async () => {
    setIsSimulating(true);
    try {
      await fetchApi("/calls/simulate", {
        method: "POST",
        body: JSON.stringify({ from_number: "+15551234567" })
      });
      // The WebSocket will automatically trigger a refresh!
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleTriggerAI = async (callId: string) => {
    setActiveActionId(callId);
    try {
      await fetchApi(`/calls/${callId}/ai-qualify`, {
        method: "POST"
      });
      // The WebSocket will automatically trigger a refresh!
      loadCalls(); // fallback just in case
    } catch (err) {
      console.error(err);
    } finally {
      setActiveActionId(null);
    }
  };

  const handleCallback = async (callId: string, fromNumber: string) => {
    setActiveActionId(callId);
    try {
      await fetchApi(`/calls/${callId}/dial`, {
        method: "POST",
        body: JSON.stringify({ to_number: fromNumber })
      });
      loadCalls(); // fallback
    } catch (err) {
      console.error(err);
    } finally {
      setActiveActionId(null);
    }
  };

  // Metrics calculation
  const missedCount = calls.filter(c => c.status === "missed").length;
  const recoveredCount = calls.filter(c => c.status === "recovered").length;
  const totalRevenue = calls.reduce((sum, c) => sum + (c.revenue_estimate || 0), 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-indigo-500" />
            AI Voice Console
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time feed of missed calls, AI qualifications, and outbound recoveries.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live WebSocket Active
          </div>
          <Button onClick={handleSimulateCall} disabled={isSimulating} variant="outline" className="flex items-center gap-2">
            {isSimulating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneIncoming className="h-4 w-4" />}
            Simulate Missed Call
          </Button>
        </div>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Action Required</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-red-500">{missedCount}</span>
            <span className="text-sm text-muted-foreground">missed calls</span>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">AI Recovered</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-500">{recoveredCount}</span>
            <span className="text-sm text-muted-foreground">appointments</span>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Revenue Saved</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-indigo-500">${totalRevenue.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">estimated</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border bg-background shadow-sm overflow-hidden flex flex-col h-[600px]">
        {/* Toolbar */}
        <div className="p-4 border-b flex items-center justify-between bg-muted/20">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search phone number..."
              className="w-full bg-background border rounded-md pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" /> Filter
          </Button>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm text-left relative">
            <thead className="bg-muted/50 border-b text-muted-foreground sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Caller ID</th>
                <th className="px-6 py-3 font-medium">Time</th>
                <th className="px-6 py-3 font-medium">AI Insights</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && calls.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : calls.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-32 text-center text-muted-foreground">
                    No calls recorded yet. Click "Simulate Missed Call" to test the pipeline.
                  </td>
                </tr>
              ) : (
                calls.map((call) => (
                  <tr key={call.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <CallStatusBadge status={call.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium font-mono text-sm">{call.from_number}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 capitalize">{call.direction}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">
                      {call.created_at ? new Date(call.created_at + "Z").toLocaleString() : "Recently"}
                    </td>
                    <td className="px-6 py-4 min-w-[200px]">
                      {call.notes ? (
                        <div className="flex items-center gap-3">
                          {call.revenue_estimate && (
                            <span className="font-medium text-indigo-600">${call.revenue_estimate.toLocaleString()}</span>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-xs flex items-center gap-1.5"
                            onClick={() => setSelectedCall(call)}
                          >
                            <FileText className="h-3 w-3" /> View Summary
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Pending Analysis...</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {call.status === "missed" && !call.notes && (
                          <Button 
                            size="sm" 
                            variant="secondary"
                            className="h-8 text-xs"
                            onClick={() => handleTriggerAI(call.id)}
                            disabled={activeActionId === call.id}
                          >
                            {activeActionId === call.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <BrainCircuit className="h-3 w-3 mr-1" />}
                            Run AI Qualification
                          </Button>
                        )}
                        {(call.status === "missed" || call.status === "failed") && (
                          <Button 
                            size="sm" 
                            className="h-8 text-xs"
                            onClick={() => handleCallback(call.id, call.from_number)}
                            disabled={activeActionId === call.id}
                          >
                            {activeActionId === call.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Phone className="h-3 w-3 mr-1" />}
                            AI Callback
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Call Notes Modal */}
      <CallNotesDialog 
        isOpen={!!selectedCall}
        onOpenChange={(open) => !open && setSelectedCall(null)}
        notes={selectedCall?.notes || null}
        revenue={selectedCall?.revenue_estimate || null}
      />

    </div>
  );
}
