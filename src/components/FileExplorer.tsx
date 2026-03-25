import React from 'react';
import { Folder, FileText, ChevronRight, Plus, Trash2 } from 'lucide-react';

interface File {
  id: string;
  path: string;
  content: string;
}

export function FileExplorer({ files, onFileSelect, selectedPath }: { files: File[], onFileSelect: (file: File) => void, selectedPath?: string }) {
  return (
    <div className="w-64 border-r border-border bg-muted/30 flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Folder size={16} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Explorer</h3>
        </div>
        <button className="p-1 hover:bg-accent rounded text-muted-foreground" title="New File">
          <Plus size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {files.length === 0 ? (
          <div className="p-4 text-xs text-muted-foreground italic">No files generated yet.</div>
        ) : (
          files.map((file) => (
            <div key={file.id} className="group relative">
              <button
                onClick={() => onFileSelect(file)}
                className={`w-full flex items-center gap-2 px-4 py-1.5 text-sm transition-colors ${selectedPath === file.path ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'hover:bg-accent text-foreground/70'}`}
              >
                <ChevronRight size={12} className={selectedPath === file.path ? 'rotate-90' : ''} />
                <FileText size={14} />
                <span className="truncate font-mono text-xs">{file.path}</span>
              </button>
              <button 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                title="Delete File"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
