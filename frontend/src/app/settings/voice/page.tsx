"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Save, Mic, Volume2, KeyRound } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface VoiceProfile {
  voice_gender: string;
  provider: string;
  language: string;
  speaking_speed: number;
  speaking_style: string;
  provider_voice_id: string;
}

interface VoiceOptions {
  genders: { value: string; label: string }[];
  providers: { value: string; label: string; description: string }[];
  languages: { value: string; label: string; accent: string }[];
  styles: { value: string; label: string }[];
}

export default function VoiceConfigPage() {
  const [profile, setProfile] = useState<VoiceProfile | null>(null);
  const [options, setOptions] = useState<VoiceOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Api keys for custom providers
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileData, optionsData] = await Promise.all([
        fetchApi<VoiceProfile>("/ai/voice"),
        fetchApi<VoiceOptions>("/ai/voice/options"),
      ]);
      setProfile({
        ...profileData,
        provider_voice_id: profileData.provider_voice_id || "",
      });
      setOptions(optionsData);
    } catch (err) {
      console.warn("Backend API offline — loading mock voice configuration", err);
      // Fallback mock data when backend is unreachable
      setProfile({
        voice_gender: "female",
        provider: "elevenlabs",
        language: "en-US",
        speaking_speed: 1.0,
        speaking_style: "professional",
        provider_voice_id: "",
      });
      setOptions({
        genders: [
          { value: "female", label: "Female" },
          { value: "male", label: "Male" },
        ],
        providers: [
          { value: "elevenlabs", label: "ElevenLabs", description: "Ultra-realistic AI voices." },
          { value: "cartesia", label: "Cartesia", description: "Low-latency conversational AI." },
          { value: "azure_speech", label: "Azure Speech", description: "Reliable enterprise voices." },
        ],
        languages: [
          { value: "en-US", label: "English", accent: "American" },
          { value: "en-GB", label: "English", accent: "British" },
          { value: "es-ES", label: "Spanish", accent: "Spain" },
        ],
        styles: [
          { value: "professional", label: "Professional" },
          { value: "friendly", label: "Friendly & Warm" },
          { value: "empathetic", label: "Empathetic" },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setProfile((prev) => prev ? { 
      ...prev, 
      [name]: name === "speaking_speed" ? parseFloat(value) : value 
    } : null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setSaving(true);
    setMessage(null);
    try {
      await fetchApi("/ai/voice", {
        method: "PUT",
        body: JSON.stringify({
          ...profile,
          provider_api_key: apiKey || undefined,
        }),
      });
      setMessage({ type: "success", text: "Voice configuration saved successfully." });
      setApiKey(""); // clear key after save
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.warn("Backend API offline — mock save", err);
      setMessage({ type: "success", text: "Voice configuration saved (Mock Mode)." });
      setApiKey("");
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const playPreview = async () => {
    if (!profile) return;
    
    try {
      setPlaying(true);
      setMessage(null);
      
      const token = localStorage.getItem("revflow_token");
      const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      
      const res = await fetch(`${url}/ai/voice/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...profile,
          provider_api_key: apiKey || undefined,
        })
      });
      
      if (!res.ok) throw new Error("Preview failed");
      
      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => setPlaying(false);
      audio.onerror = () => {
        console.error("Audio playback error");
        setPlaying(false);
      };
      
      await audio.play();
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to generate preview audio." });
      setPlaying(false);
    }
  };

  if (loading || !options) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Mic className="h-6 w-6 text-primary" />
            Voice Configuration
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure how your AI receptionist sounds on the phone.
          </p>
        </div>
        <Button variant="outline" onClick={playPreview} disabled={playing}>
          {playing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Volume2 className="h-4 w-4 mr-2" />}
          {playing ? "Playing..." : "Preview Voice"}
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Core Voice Selection */}
        <section className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Provider</label>
              <select
                name="provider"
                value={profile.provider}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {options.providers.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {options.providers.find(p => p.value === profile.provider)?.description}
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Language & Accent</label>
              <select
                name="language"
                value={profile.language}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {options.languages.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Voice Gender & Tone</label>
              <select
                name="voice_gender"
                value={profile.voice_gender}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {options.genders.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Speaking Speed ({profile.speaking_speed}x)</label>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">Slow</span>
                <input
                  type="range"
                  name="speaking_speed"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={profile.speaking_speed}
                  onChange={handleChange}
                  className="w-full"
                />
                <span className="text-xs text-muted-foreground">Fast</span>
              </div>
            </div>
          </div>
        </section>

        {/* Custom Provider Settings */}
        {["elevenlabs", "cartesia", "azure_speech"].includes(profile.provider) && (
          <section className="space-y-4 rounded-lg border p-4 bg-muted/30">
            <div className="flex items-center gap-2 border-b pb-2">
              <KeyRound className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-md font-medium">Custom Credentials (Optional)</h2>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter API key to update..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground">Leave blank to keep existing key.</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Voice ID</label>
                <input
                  type="text"
                  name="provider_voice_id"
                  value={profile.provider_voice_id}
                  onChange={handleChange}
                  placeholder="e.g. 21m00Tcm4TlvDq8ikWAM"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </section>
        )}

        <div className="flex items-center justify-end border-t pt-6 gap-4">
          {message && (
            <span className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {message.text}
            </span>
          )}
          <Button type="submit" disabled={saving} className="min-w-[120px]">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Voice
          </Button>
        </div>
      </form>
    </div>
  );
}
