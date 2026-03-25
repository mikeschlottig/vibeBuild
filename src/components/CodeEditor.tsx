import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Terminal, Settings, Copy, Check } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { useCopyToClipboard } from '../hooks/use-copy-to-clipboard';

interface File {
  path: string;
  content: string;
}

export function CodeEditor({ file, projectId, onSave }: { file: File | null, projectId: string | null, onSave?: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(file?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const { copied, copy } = useCopyToClipboard();

  useEffect(() => {
    setContent(file?.content || '');
    setIsEditing(false);
  }, [file]);

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950 text-zinc-500">
        <p>Select a file to view code</p>
      </div>
    );
  }

  const handleSave = async () => {
    if (!projectId) return;
    setIsSaving(true);
    try {
      await api.saveFile(projectId, file.path, content);
      setIsEditing(false);
      onSave?.();
      toast.success('File saved');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save file');
    } finally {
      setIsSaving(false);
    }
  };

  const language = file.path.endsWith('.ts') || file.path.endsWith('.tsx') ? 'typescript' : 
                   file.path.endsWith('.js') || file.path.endsWith('.jsx') ? 'javascript' :
                   file.path.endsWith('.css') ? 'css' : 'html';

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950">
      <div className="px-4 py-2 border-b border-white/10 text-xs font-mono text-zinc-400 flex justify-between items-center bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <span>{file.path}</span>
          <span className="uppercase text-[10px] bg-white/5 px-2 py-0.5 rounded">{language}</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => copy(content)}
            className="text-[10px] hover:text-white transition-colors flex items-center gap-1"
          >
            {copied ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <div className="w-px h-3 bg-white/10" />
          {isEditing ? (
            <>
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setContent(file.content);
                }}
                disabled={isSaving}
                className="text-[10px] hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="text-[10px] text-primary hover:text-white transition-colors font-bold disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="text-[10px] hover:text-white transition-colors flex items-center gap-1"
            >
              <Settings size={10} />
              Edit File
            </button>
          )}
        </div>
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          theme="vs-dark"
          language={language}
          value={content}
          onChange={(val) => setContent(val || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'JetBrains Mono, monospace',
            readOnly: !isEditing,
            padding: { top: 20 },
          }}
        />
      </div>
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
