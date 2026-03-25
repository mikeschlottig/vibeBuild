import React from 'react';
import { Play, Globe, Terminal } from 'lucide-react';

export function PreviewPanel({ url }: { url?: string }) {
  return (
    <div className="flex-1 flex flex-col h-full bg-background border-l border-border">
      <div className="px-4 py-2 border-b border-border flex justify-between items-center bg-muted/20">
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-muted-foreground" />
          <span className="text-xs font-medium">Live Preview</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1 hover:bg-accent rounded text-muted-foreground">
            <Terminal size={14} />
          </button>
          <button className="p-1 hover:bg-accent rounded text-primary">
            <Play size={14} fill="currentColor" />
          </button>
        </div>
      </div>
      <div className="flex-1 bg-white relative overflow-hidden">
        {url ? (
          <iframe src={url} className="w-full h-full border-none" title="App Preview" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Globe size={32} className="opacity-20" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">No Preview Available</h3>
            <p className="text-sm max-w-xs">Once the AI generates your application, the live preview will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
