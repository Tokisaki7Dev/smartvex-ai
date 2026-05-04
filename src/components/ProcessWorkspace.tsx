'use client';
import React from 'react';
import { motion } from 'motion/react';
import { 
  DownloadCloud, 
  Loader2, 
  Cpu, 
  Layers, 
  Zap, 
  History, 
  FileVideo, 
  Sparkles,
  BarChart3,
  BarChart,
  Target
} from 'lucide-react';
import { VideoJob, TOOLS, ToolType } from '../types';

interface ProcessWorkspaceProps {
  activeJob: VideoJob | null;
  selectedTool: ToolType;
}

export function ProcessWorkspace({ activeJob, selectedTool }: ProcessWorkspaceProps) {
  const toolDef = TOOLS.find(t => t.type === selectedTool);

  const steps = [
    { name: 'Upload', status: 'complete' },
    { name: 'Multithreading', status: activeJob?.status === 'processing' ? 'active' : activeJob?.status === 'completed' ? 'complete' : 'pending' },
    { name: 'Finalização', status: activeJob?.status === 'completed' ? 'complete' : 'pending' }
  ];

  if (!activeJob) {
    return (
       <div className="flex flex-col items-center justify-center h-full text-center p-12">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-8 border border-white/10 opacity-20">
             <FileVideo className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-display font-black text-gray-700 uppercase italic tracking-widest">Aguardando Injeção</h3>
          <p className="text-xs text-gray-800 font-mono mt-4 uppercase tracking-[0.4em]">Selecione um ativo para começar</p>
       </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col p-8 overflow-hidden bg-black rounded-[3rem] border border-white/5 shadow-2xl relative">
      <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
         <Sparkles className="w-64 h-64 text-pink-500 blur-3xl opacity-50" />
      </div>

      <header className="flex items-center justify-between mb-12 relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center border border-white/10 text-white relative shadow-lg">
            {toolDef && <toolDef.icon className="w-7 h-7 relative z-10" />}
          </div>
          <div>
            <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tighter">{activeJob.name}</h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-[10px] font-mono text-pink-500 font-black uppercase tracking-widest">Pipeline: {selectedTool}</span>
               <div className="w-1 h-1 bg-white/20 rounded-full" />
               <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Job_ID: {activeJob.id}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.03]">
          <div className="hidden md:flex items-center gap-6">
             {steps.map((step) => (
                <div key={step.name} className="flex items-center gap-3">
                   <div className={`w-2 h-2 rounded-full ${
                     step.status === 'complete' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
                     step.status === 'active' ? 'bg-pink-500 animate-pulse shadow-[0_0_8px_rgba(236,72,153,0.6)]' : 'bg-gray-800'
                   }`}></div>
                   <span className={`text-[10px] font-mono uppercase tracking-[0.2em] font-black ${
                     step.status === 'pending' ? 'text-gray-700' : 'text-gray-400'
                   }`}>{step.name}</span>
                </div>
             ))}
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-12 relative z-10">
        {/* VIEWPORT PRINCIPAL */}
        <div className="col-span-8 flex flex-col gap-8">
          <div className="flex-1 bg-[#050508] rounded-[3.5rem] border border-white/5 relative overflow-hidden group shadow-inner">
             <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-12">
               {activeJob.status === 'processing' && (
                  <div className="text-center w-full">
                    <div className="relative inline-block mb-12">
                       <Loader2 className="w-32 h-32 text-pink-500 animate-spin opacity-20" />
                       <div className="absolute inset-0 flex items-center justify-center">
                          {toolDef && <toolDef.icon className="w-12 h-12 text-pink-500 animate-pulse" />}
                       </div>
                       <div className="absolute inset-x-0 -bottom-16 flex justify-center">
                          <span className="text-[10px] font-mono text-pink-500 uppercase tracking-[0.5em] font-black">AI Computing Adaptive</span>
                       </div>
                    </div>
                    <div className="text-center w-full max-w-sm mx-auto">
                       <div className="flex items-end justify-center gap-2 mb-6">
                          <span className="text-9xl font-display font-black text-white tracking-tighter leading-none">{activeJob.progress}</span>
                          <span className="text-3xl font-display font-black text-pink-500 leading-none mb-3">%</span>
                       </div>
                       <div className="space-y-6">
                          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em] font-black">Escalando Adaptive Core Pipeline...</div>
                          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden p-0.5 border border-white/5">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${activeJob.progress}%` }}
                               className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-[0_0_15px_rgba(236,72,153,0.5)]"
                             />
                          </div>
                       </div>
                    </div>
                  </div>
               )}
               {activeJob.status === 'completed' && (
                  <div className="text-center">
                     <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20 text-green-500 mb-10 mx-auto shadow-2xl">
                        <CheckCircle2 className="w-12 h-12" />
                     </div>
                     <h3 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-4">Pipeline Concluída</h3>
                     <p className="text-sm text-gray-500 font-mono uppercase tracking-[0.3em] mb-12 opacity-70">O ativo foi processado e otimizado pelo Adaptive Core.</p>
                     <button 
                        onClick={() => activeJob.outputUrl && window.open(activeJob.outputUrl)}
                        className="px-12 py-6 bg-white text-black rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-pink-500 hover:text-white transition-all shadow-[0_30px_60px_rgba(0,0,0,0.5)] hover:scale-105"
                     >
                        Transferir Ativo
                     </button>
                  </div>
               )}
               {(activeJob.status === 'queued') && (
                  <div className="text-center">
                     <History className="w-16 h-16 text-gray-800 animate-bounce mb-8 mx-auto opacity-20" />
                     <span className="text-xs font-mono text-gray-600 uppercase tracking-[0.5em] font-black italic">Sincronizando Nodes SmartVex...</span>
                  </div>
               )}
             </div>
          </div>
        </div>

        {/* INFO LATERAL */}
        <div className="col-span-4 flex flex-col gap-8">
           <div className="bg-white/[0.01] border border-white/[0.03] p-10 rounded-[3rem] flex-1 backdrop-blur-3xl">
              <h3 className="text-[10px] font-mono text-pink-600 font-black uppercase tracking-[0.4em] mb-10 border-b border-pink-500/10 pb-4">Metadata Engine</h3>
              
              <div className="space-y-10">
                 {[
                   { label: 'Formato Adaptive', value: 'MP4 Ultra / H.264', icon: FileVideo },
                   { label: 'Otimização Core', value: 'Adaptive Sync', icon: Target },
                   { label: 'Segurança Node', value: 'SmartVex v2.0', icon: Zap },
                   { label: 'Latência Sync', val: '0.4ms Peak', icon: History }
                 ].map(item => (
                   <div key={item.label} className="flex items-center gap-5 group">
                      <div className="p-3 bg-white/5 rounded-2xl text-gray-600 group-hover:text-pink-500 transition-colors group-hover:bg-pink-500/10"><item.icon className="w-5 h-5" /></div>
                      <div>
                         <div className="text-[10px] font-mono text-gray-700 uppercase tracking-[0.2em] leading-none mb-2 font-black italic">{item.label}</div>
                         <div className="text-[12px] font-bold text-gray-300 group-hover:text-white transition-colors">{item.value || (item as any).val}</div>
                      </div>
                   </div>
                 ))}
              </div>

              <div className="mt-16 p-8 bg-pink-500/[0.02] border border-pink-500/5 rounded-3xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Sparkles className="w-12 h-12" />
                 </div>
                 <div className="flex items-center gap-4 mb-4">
                    <Sparkles className="w-5 h-5 text-pink-500" />
                    <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">IA SmartVex Report</span>
                 </div>
                 <p className="text-[11px] text-gray-500 leading-relaxed font-mono uppercase tracking-widest opacity-80">
                    Processamento adaptativo concluído com 98% de eficiência no cluster SmartVex. Estabilidade garantida.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
