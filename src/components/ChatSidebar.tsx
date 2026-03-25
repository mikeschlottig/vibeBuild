import React, { useState, useEffect, useCallback } from 'react';
import { Send, Plus, MessageSquare, Settings, LoaderCircle, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: string;
  content: string;
}

interface Project {
  id: string;
  name: string;
}

export function ChatSidebar({ projectId, onProjectSelect, onMessageSent }: { projectId: string | null, onProjectSelect: (id: string) => void, onMessageSent?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('mistralai/mistral-7b-instruct');

  const refreshProjects = useCallback(() => {
    api.getProjects().then(setProjects);
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  useEffect(() => {
    if (projectId) {
      api.getMessages(projectId).then(setMessages);
    } else {
      setMessages([]);
    }
  }, [projectId]);

  const handleSend = async () => {
    console.log('handleSend triggered', { input, projectId, selectedModel });
    if (!input.trim()) return;
    
    if (!projectId) {
      console.warn('No project ID selected');
      toast.error('Please select or create a project first');
      return;
    }
    
    const userMsg = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.sendMessage(projectId, input, selectedModel);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: res.content }]);
      // Trigger file refresh
      onMessageSent?.();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    const name = prompt('Project Name?');
    if (name) {
      try {
        const p = await api.createProject(name, '');
        refreshProjects();
        onProjectSelect(p.id);
        toast.success(`Project "${name}" created`);
      } catch (err) {
        toast.error('Failed to create project');
      }
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;
    const project = projects.find(p => p.id === projectId);
    if (!confirm(`Are you sure you want to delete project "${project?.name}"?`)) return;

    try {
      await api.deleteProject(projectId);
      toast.success('Project deleted');
      onProjectSelect('');
      refreshProjects();
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="w-80 border-r border-border bg-card flex flex-col h-full">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-bold text-lg">VibeBuilder</h2>
        <div className="flex gap-1">
          <button onClick={handleDeleteProject} disabled={!projectId} className="p-2 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 rounded-full transition-colors disabled:opacity-30">
            <Trash2 size={18} />
          </button>
          <button onClick={handleCreateProject} className="p-2 hover:bg-accent rounded-full transition-colors">
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="p-2 border-b">
        <select 
          className="w-full bg-muted p-2 rounded text-sm outline-none"
          onChange={(e) => onProjectSelect(e.target.value)}
          value={projectId || ''}
        >
          <option value="" disabled>Select a project</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {projectId ? (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg max-w-[90%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-muted'}`}
              >
                <div className="text-xs opacity-50 mb-1 font-bold uppercase">{msg.role}</div>
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              </motion.div>
            ))}
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex items-center gap-2 text-xs text-primary font-bold animate-pulse"
              >
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                VIBE ARCHITECT IS THINKING...
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <div className="text-center text-muted-foreground mt-10">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
            <p>Select or create a project to start building.</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Settings size={12} />
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-transparent outline-none border-none cursor-pointer"
          >
            <option value="mistralai/mistral-large">Mistral Large 2</option>
            <option value="mistralai/mistral-small">Mistral Small 4</option>
            <option value="mistralai/codestral-22b">Codestral</option>
            <option value="moonshotai/kimi-2.5">Kimi 2.5 Thinking</option>
            <option value="groq/kimi2-0905">Groq: Kimi2 0905</option>
            <option value="groq/gpt-oss-120b">Groq: GPT OSS 120B</option>
          </select>
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe your app..."
            className="flex-1 bg-muted rounded-md px-3 py-2 text-sm outline-none focus:ring-1 ring-primary"
          />
          <button 
            onClick={handleSend} 
            disabled={loading || !input.trim()}
            className="p-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
