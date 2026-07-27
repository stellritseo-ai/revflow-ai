import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileText, Bot, DollarSign } from "lucide-react";

interface CallNotesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  notes: string | null;
  revenue: number | null;
}

export function CallNotesDialog({ isOpen, onOpenChange, notes, revenue }: CallNotesDialogProps) {
  
  // Basic parsing for the structured AI notes
  const renderNotes = () => {
    if (!notes) return <p className="text-muted-foreground text-sm">No notes available for this call.</p>;
    
    // Split into lines for basic formatting
    const lines = notes.split('\n');
    
    return (
      <div className="space-y-3 mt-4 text-sm">
        {lines.map((line, idx) => {
          if (line.startsWith('[AI Qualified]')) {
            return (
              <div key={idx} className="flex items-center gap-2 font-semibold text-primary">
                <Bot className="h-4 w-4" />
                {line.replace('[AI Qualified]', '').trim()}
              </div>
            );
          }
          if (line.startsWith('Treatment:')) {
            return <div key={idx}><strong>Treatment:</strong> <span className="text-muted-foreground">{line.replace('Treatment:', '').trim()}</span></div>;
          }
          if (line.startsWith('Summary:')) {
            return <div key={idx} className="bg-muted/30 p-3 rounded-md border text-muted-foreground">{line.replace('Summary:', '').trim()}</div>;
          }
          if (line.startsWith('Patient said:')) {
            return (
              <div key={idx} className="mt-4 border-l-2 border-indigo-500 pl-3">
                <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider block mb-1">Live Transcript Snippet</span>
                <p className="italic text-muted-foreground">{line.replace('Patient said:', '').trim()}</p>
              </div>
            );
          }
          if (line.startsWith('Revenue Estimate:')) {
            // we skip it here and show it prominently in the header
            return null;
          }
          if (line.trim() === '') return null;
          
          return <p key={idx} className="text-muted-foreground">{line}</p>;
        })}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              AI Call Analysis
            </DialogTitle>
            {revenue && (
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full text-sm font-semibold border border-emerald-500/20 mr-4">
                <DollarSign className="h-3.5 w-3.5" />
                {revenue.toLocaleString()}
              </div>
            )}
          </div>
          <DialogDescription>
            Extracted intent, treatment requirements, and conversation summary.
          </DialogDescription>
        </DialogHeader>
        
        {renderNotes()}

      </DialogContent>
    </Dialog>
  );
}
