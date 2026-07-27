"use client";

import React, { useState } from "react";
import { Send, Bot, User, Code, FileText, Zap } from "lucide-react";

export function SimulatorTerminal() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "agent", content: "Hello! This is RevFlow Dental. How can I help you today?" }
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: "user", content: input }]);
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "agent", 
        content: "I can help you with that! Let me check the schedule." 
      }]);
    }, 1000);
    
    setInput("");
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'agent' && (
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-indigo-500" />
                </div>
              )}
              <div className={`p-4 rounded-xl max-w-[80%] ${
                msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-muted'
              }`}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-500/20 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Input Area */}
        <div className="p-4 border-t border-border bg-card">
          <div className="relative">
            <input 
              type="text" 
              className="w-full bg-background border border-border rounded-lg pl-4 pr-12 py-3 outline-none focus:border-indigo-500 transition-colors"
              placeholder="Simulate patient message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Execution Trace Sidebar */}
      <div className="w-full lg:w-96 border-l border-border bg-card p-6 flex flex-col gap-6 shrink-0 overflow-y-auto">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Execution Trace</h3>
        
        <div className="space-y-4">
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-2 text-indigo-500 font-medium text-sm">
              <Zap className="w-4 h-4" />
              Reasoning
            </div>
            <p className="text-sm text-muted-foreground">User is asking for an appointment. Checking available slots via tool.</p>
          </div>

          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-2 text-emerald-500 font-medium text-sm">
              <Code className="w-4 h-4" />
              Tools Used
            </div>
            <code className="text-xs text-muted-foreground block bg-muted p-2 rounded">
              search_appointment({"{ date: 'today' }"})
            </code>
          </div>

          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-2 text-amber-500 font-medium text-sm">
              <FileText className="w-4 h-4" />
              Knowledge Retrieved
            </div>
            <ul className="text-sm text-muted-foreground list-disc pl-4">
              <li>Cancellation Policy (0.92 score)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
