import React from 'react';
import Editor from '@monaco-editor/react';
import { Terminal } from 'lucide-react';

interface File {
  path: string;
  content: string;
}

export function CodeEditor({ file }: { file: File | null }) {
  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950 text-zinc-500">
        <p>Select a file to view code</p>
      </div>
    );
  }

  const language = file.path.endsWith('.ts') || file.path.endsWith('.tsx') ? 'typescript' : 
                   file.path.endsWith('.js') || file.path.endsWith('.jsx') ? 'javascript' :
                   file.path.endsWith('.css') ? 'css' : 'html';

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950">
      <div className="px-4 py-2 border-b border-white/10 text-xs font-mono text-zinc-400 flex justify-between items-center">
        <span>{file.path}</span>
        <span className="uppercase text-[10px] bg-white/5 px-2 py-0.5 rounded">{language}</span>
      </div>
      <Editor
        height="100%"
        theme="vs-dark"
        language={language}
        value={file.content}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'JetBrains Mono, monospace',
          readOnly: true,
          padding: { top: 20 },
        }}
      />
      <div className="h-1/4 border-t border-white/10 bg-black p-4 font-mono text-xs text-green-500 overflow-y-auto">
        <div className="flex items-center gap-2 mb-2 text-zinc-500">
          <Terminal size={12} />
          <span>Vibe Terminal</span>
        </div>
        <div className="space-y-1">
          <p>{">"} Initializing VibeBuilder environment...</p>
          <p>{">"} Connecting to {file.path.split('.').pop()} language server...</p>
          <p>{">"} Ready.</p>
        </div>
      </div>
    </div>
  );
}
