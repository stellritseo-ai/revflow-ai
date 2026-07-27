"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, Check, AlertTriangle } from "lucide-react";

export function VersionControl() {
  const deployments = [
    { version: "v1.3", env: "Production", date: "2 hours ago", status: "Active", author: "Sarah Jenkins" },
    { version: "v1.2", env: "Production", date: "3 days ago", status: "Archived", author: "Sarah Jenkins" },
    { version: "v1.1", env: "Testing", date: "1 week ago", status: "Failed", author: "Mike Ross" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deployment History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Version</th>
                <th className="px-4 py-3 font-medium">Environment</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Author</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {deployments.map((dep, i) => (
                <tr key={i} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-indigo-500">{dep.version}</td>
                  <td className="px-4 py-3">{dep.env}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5 ${
                      dep.status === 'Active' ? 'text-emerald-500' : 
                      dep.status === 'Archived' ? 'text-muted-foreground' : 'text-rose-500'
                    }`}>
                      {dep.status === 'Active' ? <Check className="w-3.5 h-3.5" /> : 
                       dep.status === 'Failed' ? <AlertTriangle className="w-3.5 h-3.5" /> : null}
                      {dep.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{dep.author}</td>
                  <td className="px-4 py-3 text-muted-foreground">{dep.date}</td>
                  <td className="px-4 py-3 text-right">
                    {dep.status !== 'Active' && dep.status !== 'Failed' && (
                      <button className="text-indigo-500 hover:text-indigo-600 flex items-center gap-1 ml-auto">
                        <RotateCcw className="w-3.5 h-3.5" />
                        Rollback
                      </button>
                    )}
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
