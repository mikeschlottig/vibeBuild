import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function Blueprint({ content }: { content?: string }) {
  if (!content) {
    return (
      <div className="p-10 text-zinc-500 italic text-center">
        No blueprint generated yet. Describe your app to begin.
      </div>
    );
  }

  let data;
  try {
    const cleanContent = content.replace(/```json\n?/, '').replace(/```/, '').trim();
    data = JSON.parse(cleanContent);
  } catch (e) {
    return <div className="p-10 text-red-500">Error parsing blueprint JSON.</div>;
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8 pb-20">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-primary">{data.title}</h1>
        <p className="text-zinc-400 text-lg">{data.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Tech Stack</h3>
          <div className="flex flex-wrap gap-2">
            {data.techStack?.map((tech: string) => (
              <span key={tech} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold border border-primary/20">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Implementation Phases</h3>
        <div className="space-y-4">
          {data.phases?.map((phase: any, i: number) => (
            <div key={i} className="p-4 bg-zinc-900 border border-white/5 rounded-lg space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <h4 className="font-bold">{phase.name}</h4>
              </div>
              <ul className="pl-9 space-y-1">
                {phase.files?.map((file: string) => (
                  <li key={file} className="text-xs text-zinc-400 font-mono">{file}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
