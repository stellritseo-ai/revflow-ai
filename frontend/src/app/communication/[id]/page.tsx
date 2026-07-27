"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Phone, MessageSquare, Mail, 
  Send, User, Bot, AlertCircle, PhoneCall
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchApi } from "@/lib/api-client";

interface Interaction {
  id: string;
  channel: string;
  direction: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function ConversationTimelinePage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.id as string;
  
  const [messages, setMessages] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const loadTimeline = async () => {
      try {
        const data = await fetchApi<Interaction[]>(`/communication/inbox/threads/${threadId}/messages`);
        setMessages(data);
      } catch (err) {
        console.error("Failed to load timeline", err);
        // Mock fallback
        setMessages([
          {
            id: "msg-1",
            channel: "sms",
            direction: "inbound",
            sender_id: "+1 (555) 987-6543",
            content: "Hi, I need to reschedule my appointment.",
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: "msg-2",
            channel: "sms",
            direction: "outbound",
            sender_id: "AI_SYSTEM",
            content: "Hello! I can help you reschedule. Could you please provide your full name and the date of your current appointment?",
            created_at: new Date(Date.now() - 3590000).toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    if (threadId) loadTimeline();
  }, [threadId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;

    setSending(true);
    try {
      // Typically we'd send to the outbound API here to text the patient
      // Mocking the UI update for now
      setMessages(prev => [...prev, {
        id: `mock-msg-${Date.now()}`,
        channel: messages[0]?.channel || "chat",
        direction: "outbound",
        sender_id: "Human Staff",
        content: reply,
        created_at: new Date().toISOString()
      }]);
      setReply("");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const renderIcon = (channel: string, direction: string, sender: string) => {
    if (sender === "AI_SYSTEM") return <Bot className="h-4 w-4 text-primary" />;
    if (sender === "Human Staff") return <User className="h-4 w-4 text-amber-600" />;
    
    switch (channel) {
      case 'voice': return <PhoneCall className="h-4 w-4 text-blue-500" />;
      case 'sms': return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'email': return <Mail className="h-4 w-4 text-purple-500" />;
      default: return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="font-semibold text-lg">{messages[0]?.sender_id || "Conversation"}</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <span>Thread ID: {threadId.substring(0, 8)}...</span>
            {messages.length > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="capitalize">{messages[0].channel}</span>
              </>
            )}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100">
            Take Over Conversation
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/10">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOutbound = msg.direction === "outbound";
            const isAI = msg.sender_id === "AI_SYSTEM";
            
            return (
              <div 
                key={msg.id} 
                className={`flex gap-4 ${isOutbound ? "flex-row-reverse" : "flex-row"}`}
              >
                <div className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                  ${isOutbound ? (isAI ? "bg-primary/20" : "bg-amber-100") : "bg-white border shadow-sm"}
                `}>
                  {renderIcon(msg.channel, msg.direction, msg.sender_id)}
                </div>
                
                <div className={`max-w-[70%] flex flex-col ${isOutbound ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">
                      {isAI ? "AI Assistant" : isOutbound ? "You (Staff)" : "Patient"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(msg.created_at).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  
                  <div className={`
                    p-3 rounded-lg text-sm
                    ${isOutbound 
                      ? (isAI ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-amber-600 text-white rounded-tr-none")
                      : "bg-white border shadow-sm rounded-tl-none"
                    }
                  `}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reply Box */}
      <div className="p-4 border-t bg-card">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input 
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="Type a message to reply as human..." 
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !reply.trim()} className="px-8">
            {sending ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <Send className="h-4 w-4 mr-2" />}
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
