import React, { useState } from 'react';
import { Play, Globe, Terminal, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function PreviewPanel({ url }: { url?: string }) {
  const [key, setKey] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);
  const [status, setStatus] = useState('Waiting for deployment...');

  const handleRefresh = () => {
    setKey(prev => prev + 1);
  };

  const handleDeploy = () => {
    setIsDeploying(true);
    setStatus('Deploying to VibeCloud...');
    setTimeout(() => {
      setIsDeploying(false);
      setStatus('Deployed successfully at ' + new Date().toLocaleTimeString());
      toast.success('Application deployed to production!');
    }, 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background border-l border-border">
      <div className="px-4 py-2 border-b border-border flex justify-between items-center bg-muted/20">
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-muted-foreground" />
          <span className="text-xs font-medium">Live Preview</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            className="p-1 hover:bg-accent rounded text-muted-foreground transition-colors"
            title="Refresh Preview"
          >
            <RefreshCw size={14} />
          </button>
          <button className="p-1 hover:bg-accent rounded text-muted-foreground transition-colors">
            <Terminal size={14} />
          </button>
          <button 
            onClick={handleDeploy}
            disabled={isDeploying}
            className={`p-1 hover:bg-accent rounded text-primary transition-colors ${isDeploying ? 'animate-pulse' : ''}`}
            title="Run Application"
          >
            <Play size={14} fill="currentColor" />
          </button>
        </div>
      </div>
      <div className="flex-1 bg-white relative overflow-hidden">
        {url ? (
          <iframe 
            key={key}
            src={url} 
            className="w-full h-full border-none" 
            title="App Preview" 
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-10 text-center bg-zinc-50">
            <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4 border border-zinc-200 shadow-sm">
              <Globe size={32} className="opacity-20" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">No Preview Available</h3>
            <p className="text-sm max-w-xs">Once the AI generates your application, the live preview will appear here.</p>
            <div className="mt-6 p-4 bg-zinc-100/50 rounded-lg border border-zinc-200 text-xs text-left w-full max-w-xs">
              <p className="font-bold mb-1 uppercase text-zinc-400">Status</p>
              <p>{status}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
