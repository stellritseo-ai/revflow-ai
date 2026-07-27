import React, { useState } from "react";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";

export function AIStudioInterface() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate API call to backend
    setTimeout(() => {
      setIsGenerating(false);
      alert("AI Campaign Generated successfully!");
    }, 2000);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-8 border border-blue-100 dark:border-blue-900 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles className="h-48 w-48 text-blue-500" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
              <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100">AI Marketing Strategist</h2>
          </div>
          
          <p className="text-blue-800/80 dark:text-blue-200/80 mb-6 text-lg">
            Describe your goal in plain English, and the AI will identify the audience, generate copy, and build the automation journey.
          </p>

          <div className="space-y-4">
            <div className="relative">
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. I want to promote Invisalign to patients aged 18-35 who haven't visited in the last year."
                className="w-full h-32 rounded-xl border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 px-4 py-3 text-base shadow-sm focus:border-blue-500 focus:ring-blue-500 resize-none"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-600 dark:text-blue-400">
                AI will generate: Segment, Subject, Copy, and Schedule
              </div>
              <button 
                onClick={handleGenerate}
                disabled={!prompt || isGenerating}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-12 px-6 rounded-lg flex items-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Generate Campaign
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder for generated preview */}
      <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-12 text-center text-gray-500 flex flex-col items-center">
        <Sparkles className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
        <p>Your AI-generated marketing strategy will appear here.</p>
      </div>
    </div>
  );
}
