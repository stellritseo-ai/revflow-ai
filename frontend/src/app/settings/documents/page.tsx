"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Upload, FileText, Trash2, ShieldAlert } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  category: string;
  url: string;
  size_bytes: number | null;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<Document[]>("/clinic/documents");
      setDocuments(data);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleSimulatedUpload = async () => {
    setIsUploading(true);
    // Simulate upload delay
    setTimeout(async () => {
      try {
        const newDoc = await fetchApi<Document>("/clinic/documents", {
          method: "POST",
          body: JSON.stringify({
            file_name: `Patient_Intake_Form_v${Math.floor(Math.random() * 10)}.pdf`,
            file_type: "application/pdf",
            category: "Intake Forms",
            url: "https://example.com/fake.pdf",
            size_bytes: Math.floor(Math.random() * 1024 * 1024 * 2) // random MBs
          }),
        });
        setDocuments([...documents, newDoc]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploading(false);
      }
    }, 1500);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetchApi(`/clinic/documents/${id}`, { method: "DELETE" });
      setDocuments(documents.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return "Unknown";
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compliance & Documents</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your clinic's patient intake forms, consent templates, and HIPAA compliance policies.
          </p>
        </div>
        <Button onClick={handleSimulatedUpload} disabled={isUploading} className="flex items-center gap-2">
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload Document
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col items-center justify-center text-center gap-2">
          <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-2">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="font-semibold">Intake Forms</h3>
          <p className="text-xs text-muted-foreground">Digital forms sent to new patients automatically via the AI.</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col items-center justify-center text-center gap-2">
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h3 className="font-semibold">Consent & HIPAA</h3>
          <p className="text-xs text-muted-foreground">Legal documents requiring patient e-signatures before treatment.</p>
        </div>
        <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/10 p-6 flex flex-col items-center justify-center text-center hover:bg-muted/30 transition-colors cursor-pointer" onClick={handleSimulatedUpload}>
          <p className="text-sm font-medium text-muted-foreground mb-1">Need a custom template?</p>
          <span className="text-xs text-primary font-medium">Drag and drop here</span>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-4">Document Library</h3>
      <div className="rounded-xl border bg-background shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Document Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={4} className="h-24 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="h-32 text-center text-muted-foreground">
                    Your document library is empty.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{doc.file_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/20">
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {formatBytes(doc.size_bytes)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(doc.id)} className="text-red-500/70 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
