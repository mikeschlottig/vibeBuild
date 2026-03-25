import React, { useState, useEffect } from 'react';
import { ChatSidebar } from './components/ChatSidebar';
import { FileExplorer } from './components/FileExplorer';
import { CodeEditor } from './components/CodeEditor';
import { PreviewPanel } from './components/PreviewPanel';
import { Blueprint } from './components/Blueprint';
import { api } from './lib/api';
import { Toaster } from 'sonner';

interface File {
  id: string;
  path: string;
  content: string;
}

export default function App() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (projectId) {
      api.getFiles(projectId).then(setFiles);
    }
  }, [projectId]);

  const refreshFiles = () => {
    if (projectId) api.getFiles(projectId).then(setFiles);
  };

  const [activeMainTab, setActiveMainTab] = useState<'code' | 'blueprint'>('code');
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    if (projectId) {
      api.getFiles(projectId).then(newFiles => {
        setFiles(newFiles);
        // Always select the first file of the new project if no file is selected or if the current selected file is not in the new project
        if (newFiles.length > 0) {
          setSelectedFile(newFiles[0]);
        } else {
          setSelectedFile(null);
        }
      });
      api.getProjects().then(projs => {
        const p = projs.find((x: any) => x.id === projectId);
        setProject(p);
      });
    } else {
      setFiles([]);
      setSelectedFile(null);
      setProject(null);
    }
  }, [projectId]);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      <ChatSidebar 
        projectId={projectId} 
        onProjectSelect={setProjectId} 
        onMessageSent={() => {
          refreshFiles();
          // Also refresh project for blueprint
          api.getProjects().then(projs => {
            const p = projs.find((x: any) => x.id === projectId);
            setProject(p);
          });
        }}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-12 border-b border-border flex items-center px-4 gap-4 bg-card/50">
          <button 
            onClick={() => setActiveMainTab('code')}
            className={`text-xs font-bold uppercase tracking-widest transition-colors ${activeMainTab === 'code' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Editor
          </button>
          <button 
            onClick={() => setActiveMainTab('blueprint')}
            className={`text-xs font-bold uppercase tracking-widest transition-colors ${activeMainTab === 'blueprint' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Blueprint
          </button>
        </div>
        <div className="flex-1 flex min-h-0">
          {activeMainTab === 'code' ? (
            <>
              <FileExplorer 
                files={files} 
                onFileSelect={setSelectedFile} 
                selectedPath={selectedFile?.path} 
              />
              <CodeEditor 
            file={selectedFile} 
            projectId={projectId} 
            onSave={refreshFiles} 
          />
            </>
          ) : (
            <div className="flex-1 overflow-y-auto bg-zinc-950">
              <Blueprint content={project?.blueprint} />
            </div>
          )}
          <PreviewPanel />
        </div>
      </div>
      
      <Toaster position="bottom-right" />
    </div>
  );
}
