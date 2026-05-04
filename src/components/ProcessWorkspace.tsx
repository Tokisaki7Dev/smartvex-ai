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
    <div className="flex-1 w-full flex flex-col p-8 overflow-hidden bg-black">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-purple-400 relative">
            {toolDef && <toolDef.icon className="w-7 h-7 relative z-10" />}
          </div>
          <div>
            <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tighter">{activeJob.name}</h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-[10px] font-mono text-purple-500 font-black uppercase tracking-widest">Pipeline: {selectedTool}</span>
               <div className="w-1 h-1 bg-white/20 rounded-full" />
               <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">ID: {activeJob.id}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4">
             {steps.map((step) => (
                <div key={step.name} className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${
                     step.status === 'complete' ? 'bg-green-500' :
                     step.status === 'active' ? 'bg-purple-500 animate-pulse' : 'bg-gray-800'
                   }`}></div>
                   <span className={`text-[9px] font-mono uppercase tracking-widest ${
                     step.status === 'pending' ? 'text-gray-700' : 'text-gray-400'
                   }`}>{step.name}</span>
                </div>
             ))}
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-8">
        {/* VIEWPORT PRINCIPAL */}
        <div className="col-span-8 flex flex-col gap-8">
          <div className="flex-1 bg-[#050508] rounded-[3rem] border border-white/5 relative overflow-hidden group">
             <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-12">
               {activeJob.status === 'processing' && (
                  <div className="text-center w-full">
                    <div className="relative inline-block mb-12">
                       <Loader2 className="w-24 h-24 text-purple-500 animate-spin" />
                       <div className="absolute inset-x-0 -bottom-12 flex justify-center">
                          <span className="text-[10px] font-mono text-purple-500 uppercase tracking-[0.5em] font-black">AI Computing</span>
                       </div>
                    </div>
                    <div className="text-center w-full max-w-sm mx-auto">
                       <div className="flex items-end justify-center gap-2 mb-4">
                          <span className="text-8xl font-display font-black text-white tracking-tighter leading-none">{activeJob.progress}</span>
                          <span className="text-2xl font-display font-black text-purple-500 leading-none mb-3">%</span>
                       </div>
                       <div className="space-y-4">
                          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Escalando threads Xeon...</div>
                          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                             <div 
                               style={{ width: `${activeJob.progress}%` }}
                               className="h-full bg-purple-500"
                             />
                          </div>
                       </div>
                    </div>
                  </div>
               )}
               {activeJob.status === 'completed' && (
                  <div className="text-center">
                     <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20 text-green-500 mb-8 mx-auto">
                        <CheckCircle2 className="w-10 h-10" />
                     </div>
                     <h3 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter mb-4">Processamento Concluído</h3>
                     <p className="text-sm text-gray-500 font-mono uppercase tracking-widest mb-10">O ativo está pronto para distribuição no cluster.</p>
                     <button 
                        onClick={() => activeJob.outputUrl && window.open(activeJob.outputUrl)}
                        className="px-10 py-4 bg-white text-black rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-purple-500 hover:text-white transition-all shadow-2xl"
                     >
                        Transferir Vídeo
                     </button>
                  </div>
               )}
               {(activeJob.status === 'queued') && (
                  <div className="text-center">
                     <History className="w-12 h-12 text-gray-800 animate-bounce mb-6 mx-auto" />
                     <span className="text-xs font-mono text-gray-600 uppercase tracking-widest">Sincronizando Nodes...</span>
                  </div>
               )}
             </div>
          </div>
        </div>

        {/* INFO LATERAL */}
        <div className="col-span-4 flex flex-col gap-6">
           <div className="glass-card p-8 rounded-[2.5rem] flex-1">
              <h3 className="text-[10px] font-mono text-purple-600 font-black uppercase tracking-[0.3em] mb-8">Metadata Process</h3>
              
              <div className="space-y-8">
                 {[
                   { label: 'Formato Saída', value: 'MP4 / H.264', icon: FileVideo },
                   { label: 'Otimização', value: 'Threads Máximas', icon: Target },
                   { label: 'Segurança', value: 'SSL Cluster', icon: Zap },
                   { label: 'Latência', value: '1.2ms Node', icon: History }
                 ].map(item => (
                   <div key={item.label} className="flex items-center gap-4">
                      <div className="p-2 bg-white/5 rounded-lg text-gray-600"><item.icon className="w-4 h-4" /></div>
                      <div>
                         <div className="text-[9px] font-mono text-gray-700 uppercase tracking-widest leading-none mb-1">{item.label}</div>
                         <div className="text-[11px] font-bold text-gray-300">{item.value}</div>
                      </div>
                   </div>
                 ))}
              </div>

              <div className="mt-12 p-6 bg-purple-500/5 border border-purple-500/10 rounded-2xl">
                 <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">IA Feedback</span>
                 </div>
                 <p className="text-[10px] text-gray-500 leading-relaxed font-mono">
                    Qualidade visual incrementada em 40% usando filtros Xeon Gold. Nitidez estabilizada.
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
