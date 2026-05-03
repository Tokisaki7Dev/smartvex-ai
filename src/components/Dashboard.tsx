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
  const [selectedTool, setSelectedTool] = useState<ToolType>('Enhancer');
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
      addLog('Node Xeon Conectado Sync.', 'success');
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
      addLog('Falha crítica de conexão com o Core Xeon.', 'error');
    }
  };

  const activeJob = activeJobs.find(j => j.id === selectedJobId);

  return (
    <div className="flex h-screen w-full bg-[#050508] text-white selection:bg-purple-500/30 overflow-hidden font-sans">
      {/* SIDEBAR - PREMIUM SOLVE UI */}
      <aside className="w-80 border-r border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col py-8 overflow-hidden">
        <div className="px-10 mb-12 flex items-center gap-4">
           <div className="w-11 h-11 bg-gradient-to-br from-[#6D28D9] to-[#1D4ED8] rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(109,40,217,0.4)] rotate-3">
              <Zap className="w-6 h-6 text-white" />
           </div>
           <div>
              <h1 className="text-xl font-display font-black tracking-tighter italic leading-none">SMARTVEX</h1>
              <span className="text-[9px] font-mono text-purple-500 uppercase tracking-[0.4em] font-black">Xeon_Cluster</span>
           </div>
        </div>

        <div className="flex-1 px-4 space-y-12 overflow-y-auto custom-scrollbar pb-10">
           <section>
              <div className="px-6 flex items-center justify-between mb-6">
                 <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em] font-black">AI Pipeline</h3>
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />
              </div>
              <div className="space-y-2 px-2">
                 {TOOLS.filter(t => !['Analytics', 'Calendar'].includes(t.type)).map(tool => (
                    <button 
                      key={tool.id}
                      onClick={() => setSelectedTool(tool.type)}
                      className={`w-full p-4 rounded-[1.5rem] flex items-center gap-4 transition-all group border ${
                        selectedTool === tool.type 
                          ? 'bg-white/[0.05] border-white/10 shadow-2xl scale-[1.02]' 
                          : 'bg-transparent border-transparent hover:bg-white/[0.02]'
                      }`}
                    >
                       <div className={`p-2.5 rounded-xl transition-all ${
                         selectedTool === tool.type ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 text-gray-600'
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
                 <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />
                 <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                       <Cpu className="w-4 h-4 text-purple-400" />
                       <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Xeon performance</span>
                    </div>
                    <div className="space-y-5">
                       <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-gray-600">Threads</span>
                          <span className="text-white font-black">64 vCores</span>
                       </div>
                       <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-gradient-to-r from-purple-600 to-blue-600 shadow-[0_0_15px_rgba(109,40,217,0.5)]" />
                       </div>
                       <p className="text-[9px] font-mono text-gray-600 leading-relaxed uppercase font-black">Cluster Stable Node</p>
                    </div>
                 </div>
              </div>
           </section>
        </div>

        <div className="p-8 mt-auto">
           <button className="w-full py-5 bg-white text-black rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-purple-600 hover:text-white transition-all shadow-[0_20px_40px_rgba(0,0,0,0.4)] active:scale-95">
              Sync Node
           </button>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#050508]">
        {/* SOLVE DECORATIVE GLOWS */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-600/5 blur-[150px] -mr-60 -mt-60 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-blue-600/5 blur-[130px] -mb-40 pointer-events-none" />

        <header className="h-24 px-12 flex items-center justify-between border-b border-white/[0.03] bg-black/20 backdrop-blur-3xl z-20">
           <div className="flex items-center gap-10">
              <div className="flex flex-col">
                 <span className="text-[9px] font-mono text-purple-600 uppercase tracking-[0.4em] font-black mb-1">Status_Core</span>
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                    <span className="text-xs font-bold text-white uppercase italic tracking-tighter">Cluster Sync Active</span>
                 </div>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="flex items-center gap-8">
                 {['Compute', 'Assets', 'Logs', 'Secure'].map(nav => (
                    <button key={nav} className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-all hover:tracking-[0.3em]">{nav}</button>
                 ))}
              </div>
           </div>

           <div className="flex items-center gap-10">
              <div className="hidden lg:flex items-center gap-6 bg-white/[0.02] rounded-2xl px-5 py-2.5 border border-white/5 group focus-within:border-purple-500/50 transition-all">
                 <Search className="w-4 h-4 text-gray-600 group-focus-within:text-purple-400" />
                 <input type="text" placeholder="Scan Archive..." className="bg-transparent text-[10px] focus:outline-none w-48 font-mono uppercase tracking-widest" />
              </div>
              <div className="flex items-center gap-5">
                 <div className="text-right">
                    <div className="text-[10px] font-black uppercase tracking-tighter">Endrio_Node</div>
                    <div className="text-[9px] text-gray-600 font-mono uppercase font-medium">Administrator</div>
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black italic shadow-2xl text-purple-500 relative group cursor-pointer">
                    <div className="absolute inset-0 bg-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-all" />
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
                    <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto py-10 space-y-24">
                       <div className="space-y-8 text-center">
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-3 px-5 py-2 bg-purple-500/5 border border-purple-500/20 rounded-full text-[10px] font-mono font-black uppercase tracking-[0.4em] text-purple-400"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                            Xeon v4.2 Pipeline Active
                          </motion.div>
                          <h2 className="text-8xl font-display font-black uppercase italic tracking-tighter leading-none">
                            Transforme Vídeo <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6D28D9] via-[#1D4ED8] to-[#6D28D9] animate-gradient bg-[length:200%_auto]">Em Ouro Visual.</span>
                          </h2>
                          <p className="text-gray-500 font-mono text-xs max-w-xl mx-auto uppercase tracking-[0.4em] leading-relaxed opacity-70">
                            Engine multithread massiva <br />
                            otimizada para fluxos de processamento pesado.
                          </p>
                       </div>

                       <div className="relative group max-w-4xl mx-auto">
                          <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-[4.5rem] blur-3xl opacity-10 group-hover:opacity-20 transition-all duration-700" />
                          <div className="relative bg-white/[0.01] backdrop-blur-3xl rounded-[4rem] p-24 flex flex-col items-center text-center gap-16 border border-white/[0.05] shadow-2xl">
                             <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                             
                             <div className="w-32 h-32 bg-white/[0.02] rounded-[2.5rem] flex items-center justify-center border border-white/[0.05] text-purple-500 shadow-2xl relative overflow-hidden group-hover:scale-110 transition-transform duration-500">
                                <div className="absolute inset-0 bg-purple-500/10 blur-2xl animate-pulse" />
                                <Sparkles className="w-12 h-12 relative z-10" />
                             </div>
                             
                             <div className="space-y-4">
                                <h3 className="text-4xl font-display font-black uppercase italic tracking-tighter">Ingestão de Ativos</h3>
                                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.5em] font-black">Cluster Ingestion • Max 1GB / MP4</p>
                             </div>
                             
                             <label className="relative cursor-pointer group/btn">
                                <div className="absolute -inset-10 bg-purple-500/20 blur-[60px] opacity-0 group-hover/btn:opacity-100 transition-all duration-500" />
                                <div className="relative px-20 py-8 bg-white text-black rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] hover:scale-105 active:scale-95 transition-all shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
                                   Iniciar Injeção
                                   <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
                                </div>
                             </label>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-3 gap-12">
                          {[
                            { label: 'Cluster Performance', val: '4.2 THz', desc: 'Xeon Optimized', icon: Cpu },
                            { label: 'Latency Sinc', val: '0.8ms', desc: 'Intra-Node Sync', icon: History },
                            { label: 'Engine Pipeline', val: 'E2E Secure', desc: 'Hardware Level', icon: Zap }
                          ].map(stat => (
                             <div key={stat.label} className="p-12 rounded-[3.5rem] bg-white/[0.01] border border-white/[0.03] flex flex-col gap-8 relative overflow-hidden group hover:border-white/10 transition-all">
                                <div className="p-4 bg-white/5 rounded-2xl text-purple-500 w-fit relative z-10 shadow-xl group-hover:bg-purple-500 group-hover:text-white transition-all duration-500"><stat.icon className="w-6 h-6" /></div>
                                <div className="relative z-10">
                                   <div className="text-[10px] font-mono text-gray-600 uppercase tracking-[0.3em] mb-3 font-black">{stat.label}</div>
                                   <div className="text-3xl font-display font-black uppercase italic tracking-tighter mb-2">{stat.val}</div>
                                   <div className="text-[10px] font-mono text-purple-600 font-black uppercase tracking-widest opacity-80">{stat.desc}</div>
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
