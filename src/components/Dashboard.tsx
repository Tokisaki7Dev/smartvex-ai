import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Zap, Cpu, History, Search, Sparkles, Wand2, Cloud, Clock, Layers, BarChart3, RotateCw, CheckCircle2, Loader2, FileVideo, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { VideoJob, TOOLS, ToolType } from '../types';
import { ProcessWorkspace } from './ProcessWorkspace';
import { QueueMonitor } from './QueueMonitor';

export default function Dashboard() {
  const [activeJobs, setActiveJobs] = useState<VideoJob[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolType>('Clipping');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [engineStatus, setEngineStatus] = useState<'online' | 'offline'>('online');
  const [logs, setLogs] = useState<{msg: string, type: 'info' | 'warn' | 'error' | 'success'}[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const addLog = (msg: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    setLogs(prev => [...prev.slice(-29), { msg, type }]);
  };

  useEffect(() => {
    socketRef.current = io(window.location.origin);
    
    socketRef.current.on('connect', () => {
      setEngineStatus('online');
      addLog('Nexus Engine Conectado Sync.', 'success');
    });

    socketRef.current.on('jobUpdate', (update: Partial<VideoJob>) => {
      setActiveJobs(prev => {
        const index = prev.findIndex(j => j.id === update.id);
        if (index === -1) return prev;
        const newJobs = [...prev];
        newJobs[index] = { ...newJobs[index], ...update };
        return newJobs;
      });
      if (update.status === 'completed') addLog(`Pipeline finalizada com sucesso.`, 'success');
    });

    return () => { socketRef.current?.disconnect(); };
  }, []);

  const handleUpload = async (file: File) => {
    addLog(`Ingestão: Recebendo binário ${file.name}`, 'info');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tool', selectedTool);

    try {
      const r = await fetch('/api/v1/upload', { method: 'POST', body: formData });
      if (!r.ok) throw new Error('Upload failed');
      const data = await r.json();
      const newJob: VideoJob = {
        id: data.jobId,
        name: file.name,
        status: 'queued',
        progress: 0,
        tool: selectedTool,
        userId: 'admin',
        createdAt: new Date().toISOString()
      };
      setActiveJobs(prev => [newJob, ...prev]);
      setSelectedJobId(data.jobId);
    } catch (err) {
      addLog('Erro de conectividade Engine Adaptive Core.', 'error');
      addLog('Verifique limites de memória (2GB) e vCPU.', 'warn');
    }
  };

  const activeJob = activeJobs.find(j => j.id === selectedJobId);

  return (
    <div className="flex h-screen w-full bg-[#050508] text-white selection:bg-pink-500/30 overflow-hidden font-sans">
      {/* SIDEBAR */}
      <aside className="w-80 border-r border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col py-8 overflow-hidden">
        <div className="px-10 mb-12 flex items-center gap-4 cursor-pointer" onClick={() => setSelectedJobId(null)}>
           <div className="w-11 h-11 bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(139,92,246,0.4)] rotate-3">
              <Zap className="w-6 h-6 text-white" />
           </div>
           <div>
              <h1 className="text-xl font-display font-black tracking-tighter italic leading-none">OPUS_VEX</h1>
              <span className="text-[9px] font-mono text-pink-500 uppercase tracking-[0.4em] font-black">Adaptive_Core</span>
           </div>
        </div>

        <div className="flex-1 px-4 space-y-12 overflow-y-auto custom-scrollbar pb-10">
           <section>
              <div className="px-6 flex items-center justify-between mb-6">
                 <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em] font-black">AI Pipeline</h3>
                 <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono text-green-500 font-bold uppercase tracking-widest">Active</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />
                 </div>
              </div>
              <div className="space-y-2 px-2">
                 {TOOLS.map(tool => (
                    <button 
                      key={tool.id}
                      onClick={() => {
                        setSelectedTool(tool.type);
                        setSelectedJobId(null);
                      }}
                      className={`w-full p-4 rounded-[1.5rem] flex items-center gap-4 transition-all group border ${
                        selectedTool === tool.type && !selectedJobId
                          ? 'bg-white/[0.05] border-white/10 shadow-2xl scale-[1.02]' 
                          : 'bg-transparent border-transparent hover:bg-white/[0.02]'
                      }`}
                    >
                       <div className={`p-2.5 rounded-xl transition-all ${
                         selectedTool === tool.type ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg' : 'bg-white/5 text-gray-600'
                       }`}>
                          <tool.icon className="w-5 h-5" />
                       </div>
                       <div className="text-left flex-1 min-w-0">
                          <div className={`text-xs font-bold leading-none mb-1.5 ${selectedTool === tool.type ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{tool.name}</div>
                          <div className="text-[9px] text-gray-600 font-mono truncate uppercase tracking-widest">{tool.description}</div>
                       </div>
                    </button>
                 ))}
              </div>
           </section>

           <section className="px-6">
              <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />
                 <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                       <Cpu className="w-4 h-4 text-pink-400" />
                       <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Engine efficiency</span>
                    </div>
                    <div className="space-y-5">
                       <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-gray-600">Hardware</span>
                          <span className="text-white font-black text-right truncate">1 vCPU • 2GB RAM</span>
                       </div>
                       <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: '92%' }} className="h-full bg-gradient-to-r from-purple-600 to-pink-600 shadow-[0_0_15px_rgba(236,72,153,0.5)]" />
                       </div>
                       <p className="text-[9px] font-mono text-gray-600 leading-relaxed uppercase font-black">Optimized for Vercel/CloudRun</p>
                    </div>
                 </div>
              </div>
           </section>
        </div>

        <div className="p-8 mt-auto">
           <button className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-[0_20px_40px_rgba(236,72,153,0.2)] active:scale-95">
              Sync Node
           </button>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#050508]">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-pink-600/5 blur-[150px] -mr-60 -mt-60 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-purple-600/5 blur-[130px] -mb-40 pointer-events-none" />

        <header className="h-24 px-12 flex items-center justify-between border-b border-white/[0.03] bg-black/20 backdrop-blur-3xl z-20">
           <div className="flex items-center gap-10">
              <div className="flex flex-col">
                 <span className="text-[9px] font-mono text-pink-600 uppercase tracking-[0.4em] font-black mb-1">Status_Core</span>
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                    <span className="text-xs font-bold text-white uppercase italic tracking-tighter">Cluster Sync Active</span>
                 </div>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="flex items-center gap-8 text-gray-500 text-[10px] font-mono uppercase tracking-widest">
                 {['Compute', 'Assets', 'Logs', 'Secure'].map(nav => (
                    <button key={nav} className="hover:text-white transition-all">{nav}</button>
                 ))}
              </div>
           </div>

           <div className="flex items-center gap-10">
              <div className="hidden lg:flex items-center gap-6 bg-white/[0.02] rounded-2xl px-5 py-2.5 border border-white/5 group focus-within:border-pink-500/50 transition-all">
                 <Search className="w-4 h-4 text-gray-600 group-focus-within:text-pink-400" />
                 <input type="text" placeholder="Scan Archive..." className="bg-transparent text-[10px] focus:outline-none w-48 font-mono uppercase tracking-widest" />
              </div>
              <div className="flex items-center gap-5">
                 <div className="text-right">
                    <div className="text-[10px] font-black uppercase tracking-tighter">Endrio_Node</div>
                    <div className="text-[9px] text-gray-600 font-mono uppercase font-medium">Administrator</div>
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black italic shadow-2xl text-pink-500 relative group cursor-pointer">
                    <div className="absolute inset-0 bg-pink-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-all" />
                    <span className="relative z-10 transition-transform group-hover:scale-110">EV</span>
                 </div>
              </div>
           </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
           <div className="flex-1 overflow-y-auto p-16 custom-scrollbar relative z-10">
              <AnimatePresence mode="wait">
                 {selectedJobId ? (
                   <motion.div key="workspace" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full">
                      <ProcessWorkspace activeJob={activeJob || null} selectedTool={selectedTool} />
                   </motion.div>
                 ) : (
                    <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto py-10 space-y-20">
                        <div className="space-y-8 text-center">
                           <motion.div 
                             initial={{ opacity: 0, y: 10 }}
                             animate={{ opacity: 1, y: 0 }}
                             className="inline-flex items-center gap-3 px-5 py-2 bg-pink-500/5 border border-pink-500/20 rounded-full text-[10px] font-mono font-black uppercase tracking-[0.4em] text-pink-400"
                           >
                             <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
                             Nexus Engine v2.0 Adaptive Active
                           </motion.div>
                           <h2 className="text-8xl font-display font-black uppercase italic tracking-tighter leading-none">
                             Crie Vídeos Virais <br />
                             <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#8B5CF6] animate-gradient bg-[length:200%_auto]">Com Inteligência Pura.</span>
                           </h2>
                           <p className="text-gray-500 font-mono text-xs max-w-xl mx-auto uppercase tracking-[0.4em] leading-relaxed opacity-70">
                             Motor de processamento adaptativo <br />
                             otimizado para Vercel Core (1 vCPU / 2GB RAM).
                           </p>
                        </div>

                        {/* BENTO GRID FEATURES */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                           {TOOLS.map((tool, idx) => (
                              <motion.div 
                                key={tool.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => setSelectedTool(tool.type)}
                                className={`group relative p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04] transition-all hover:-translate-y-1 overflow-hidden ${
                                  selectedTool === tool.type ? 'border-pink-500/50 bg-white/[0.05]' : ''
                                }`}
                              >
                                 <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700">
                                    <tool.icon className="w-32 h-32" />
                                 </div>
                                 
                                 <div className="relative z-10 space-y-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                                       selectedTool === tool.type ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg' : 'bg-white/5 text-gray-400'
                                    }`}>
                                       <tool.icon className="w-7 h-7" />
                                    </div>
                                    <div className="space-y-2">
                                       <h4 className={`text-lg font-display font-black uppercase italic tracking-tighter transition-colors ${
                                          selectedTool === tool.type ? 'text-pink-400' : 'text-white group-hover:text-pink-400'
                                       }`}>{tool.name}</h4>
                                       <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest leading-relaxed line-clamp-2">{tool.description}</p>
                                    </div>
                                 </div>

                                 {selectedTool === tool.type && (
                                    <motion.div layoutId="activeTool" className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
                                 )}
                              </motion.div>
                           ))}
                        </div>

                        <div className="relative group max-w-4xl mx-auto pt-10">
                           <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-[4.5rem] blur-3xl opacity-10 group-hover:opacity-20 transition-all duration-700" />
                           <div className="relative bg-white/[0.01] backdrop-blur-3xl rounded-[4rem] p-24 flex flex-col items-center text-center gap-16 border border-white/[0.05] shadow-2xl">
                              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />
                              
                              <div className="w-32 h-32 bg-white/[0.02] rounded-[2.5rem] flex items-center justify-center border border-white/[0.05] text-pink-500 shadow-2xl relative overflow-hidden group-hover:scale-110 transition-transform duration-500">
                                 <div className="absolute inset-0 bg-pink-500/10 blur-2xl animate-pulse" />
                                 <Sparkles className="w-12 h-12 relative z-10" />
                              </div>
                              
                              <div className="space-y-4">
                                 <h3 className="text-4xl font-display font-black uppercase italic tracking-tighter">Injete seu Ativo</h3>
                                 <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.5em] font-black">Nexus Engine • Max 1GB / MP4 • Otimizado para {selectedTool}</p>
                              </div>
                              
                              <label className="relative cursor-pointer group/btn">
                                 <div className="absolute -inset-10 bg-pink-500/20 blur-[60px] opacity-0 group-hover/btn:opacity-100 transition-all duration-500" />
                                 <div className="relative px-20 py-8 bg-white text-black rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] hover:scale-105 active:scale-95 transition-all shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
                                    Iniciar Processo
                                    <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
                                 </div>
                              </label>
                           </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                           {[
                             { label: 'Cluster Performance', val: 'Nexus 2.0', desc: 'Adaptive Efficiency', icon: Cpu },
                             { label: 'Latency Sinc', val: '0.4ms', desc: 'Intra-Node Sync', icon: History },
                             { label: 'Engine Pipeline', val: 'E2E Secure', desc: 'Resource Balanced', icon: Zap }
                           ].map(stat => (
                              <div key={stat.label} className="p-12 rounded-[3.5rem] bg-white/[0.01] border border-white/[0.03] flex flex-col gap-8 relative overflow-hidden group hover:border-white/10 transition-all">
                                 <div className="p-4 bg-white/5 rounded-2xl text-pink-500 w-fit relative z-10 shadow-xl group-hover:bg-pink-500 group-hover:text-white transition-all duration-500"><stat.icon className="w-6 h-6" /></div>
                                 <div className="relative z-10">
                                    <div className="text-[10px] font-mono text-gray-600 uppercase tracking-[0.3em] mb-3 font-black">{stat.label}</div>
                                    <div className="text-3xl font-display font-black uppercase italic tracking-tighter mb-2">{stat.val}</div>
                                    <div className="text-[10px] font-mono text-pink-600 font-black uppercase tracking-widest opacity-80">{stat.desc}</div>
                                 </div>
                                 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                                    <stat.icon className="w-24 h-24 rotate-12" />
                                 </div>
                              </div>
                           ))}
                        </div>
                     </motion.div>
                 )}
              </AnimatePresence>
           </div>

           {/* MONITOR */}
           <aside className="w-[26rem] border-l border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col">
              <QueueMonitor 
                 jobs={activeJobs}
                 logs={logs}
                 selectedJobId={selectedJobId}
                 onSelectJob={setSelectedJobId}
                 onDownload={(j) => j.outputUrl && window.open(j.outputUrl)}
                 onRetry={() => {}}
              />
           </aside>
        </div>
      </main>
    </div>
  );
}
