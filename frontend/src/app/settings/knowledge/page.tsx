"use client";

import React, { useEffect, useState, useRef } from "react";
import { Loader2, Upload, FileText, Trash2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface KnowledgeSource {
  id: string;
  title: string;
  source_type: string;
  status: string;
  chunk_count: number;
  character_count: number;
  file_size_bytes: number | null;
  error_message: string | null;
  created_at: string | null;
}

export default function KnowledgeCenterPage() {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadSources = async () => {
    try {
      const data = await fetchApi<KnowledgeSource[]>("/ai/knowledge/sources");
      setSources(data);
    } catch (err) {
      console.error("Failed to load knowledge sources", err);
    } finally {
      setLoading(false);
    }
  };

  // Setup periodic polling for pending items
  useEffect(() => {
    loadSources();
    
    const interval = setInterval(() => {
      setSources((currentSources) => {
        const hasPending = currentSources.some(s => s.status === 'pending' || s.status === 'processing');
        if (hasPending) {
          loadSources(); // Refresh if anything is still processing
        }
        return currentSources;
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (20MB)
    if (file.size > 20 * 1024 * 1024) {
      setUploadError("File size exceeds 20MB limit.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("source_type", "faq");
    formData.append("title", file.name);

    try {
      // Direct fetch to bypass JSON stringification in our basic API client for FormData
      const token = localStorage.getItem("token");
      const res = await fetch("http://127.0.0.1:8000/api/v1/ai/knowledge/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Upload failed");
      }
      
      await loadSources();
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document? The AI will no longer know this information.")) {
      return;
    }
    
    try {
      await fetchApi(`/ai/knowledge/sources/${id}`, { method: "DELETE" });
      setSources(s => s.filter(x => x.id !== id));
    } catch (err) {
      console.error("Failed to delete source", err);
      alert("Failed to delete source.");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "pending":
      case "processing":
      default:
        return <Clock className="h-4 w-4 text-amber-500 animate-pulse" />;
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "Unknown";
    const kb = bytes / 1024;
    if (kb > 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${kb.toFixed(1)} KB`;
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Knowledge Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload FAQs, service catalogs, and clinic policies so the AI can answer patient questions automatically.
          </p>
        </div>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden"
            accept=".pdf,.docx,.txt,.md"
          />
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={uploading}
            className="flex items-center gap-2"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload Document
          </Button>
        </div>
      </div>

      {uploadError && (
        <div className="mb-6 p-4 rounded-md bg-red-50 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {uploadError}
        </div>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center border rounded-md bg-muted/20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : sources.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border rounded-md bg-muted/20 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/50 mb-4" />
          <h3 className="font-medium">No Knowledge Documents</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
            The AI relies entirely on its core instructions. Upload documents to give it deep knowledge about your clinic.
          </p>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            Upload First Document
          </Button>
        </div>
      ) : (
        <div className="rounded-md border bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Document Name</th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Status</th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Knowledge Extracted</th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Uploaded</th>
                <th className="h-10 px-4 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4 align-middle">
                    <div className="flex flex-col">
                      <span className="font-medium">{source.title}</span>
                      <span className="text-xs text-muted-foreground">{formatSize(source.file_size_bytes)}</span>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(source.status)}
                      <span className="capitalize">{source.status}</span>
                    </div>
                    {source.status === 'error' && (
                      <p className="text-xs text-red-500 mt-1 max-w-[200px] truncate" title={source.error_message || ""}>
                        {source.error_message}
                      </p>
                    )}
                  </td>
                  <td className="p-4 align-middle text-muted-foreground">
                    {source.status === 'active' ? (
                      <span>{source.chunk_count} passages</span>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                  <td className="p-4 align-middle text-muted-foreground">
                    {source.created_at ? new Date(source.created_at).toLocaleDateString() : "Unknown"}
                  </td>
                  <td className="p-4 align-middle text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(source.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
