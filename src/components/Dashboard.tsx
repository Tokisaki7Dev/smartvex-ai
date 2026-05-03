import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Plus, 
  Activity, 
  Cpu, 
  Zap, 
  FileVideo, 
  Layout, 
  Settings, 
  BarChart3, 
  Github, 
  LogOut,
  Bell,
  Search,
  ChevronRight,
  Sparkles,
  Scissors,
  Type,
  Waves,
  Mic,
  Wand2,
  LayoutTemplate,
  BarChart,
  Calendar,
  Cloud,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { ToolType, TOOLS, VideoJob } from '../types';
import { ToolSelector } from './ToolSelector';
import { ProcessWorkspace } from './ProcessWorkspace';
import { QueueMonitor } from './QueueMonitor';

export default function Dashboard() {
  const [user, setUser] = useState({ name: 'Enterprise User', isGuest: false });
  const logout = () => console.log('Logout');
  const [activeJobs, setActiveJobs] = useState<VideoJob[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolType>('Clipping');
  const [toolSettings, setToolSettings] = useState<Record<string, any>>({});
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [engineStatus, setEngineStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [logs, setLogs] = useState<{msg: string, type: 'info' | 'warn' | 'error' | 'success'}[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const activeToolDef = TOOLS.find(t => t.type === selectedTool);

  // Sync settings when tool changes
  useEffect(() => {
    if (activeToolDef) {
      const defaults = activeToolDef.settings.reduce((acc, s) => ({ ...acc, [s.id]: s.default }), {});
      setToolSettings(prev => ({ ...defaults, ...prev }));
    }
  }, [selectedTool, activeToolDef]);

  const addLog = (msg: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    setLogs(prev => [...prev.slice(-49), { msg, type }]);
  };

  useEffect(() => {
    socketRef.current = io(window.location.origin, {
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 20000,
    });
    
    const checkEngine = async () => {
      if (socketRef.current?.connected) {
        setEngineStatus('online');
        return;
      }

      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 4000);
        const r = await fetch('/api/health', { 
          cache: 'no-store',
          headers: { 'Pragma': 'no-cache' },
          signal: controller.signal
        });
        clearTimeout(tid);
        setEngineStatus(r.ok ? 'online' : 'offline');
      } catch (err) {
        setEngineStatus('offline');
      }
    };
    
    checkEngine();
    const clusterCheckInterval = setInterval(checkEngine, 10000);

    socketRef.current.on('connect', () => {
      setEngineStatus('online');
      addLog('Node Xeon conectado via Socket.', 'success');
    });

    socketRef.current.on('jobUpdate', (update: Partial<VideoJob>) => {
      setActiveJobs(prev => prev.map(job => 
        job.id === update.id ? { ...job, ...update } : job
      ));
      if (update.status === 'completed') addLog(`Job finalizado!`, 'success');
      if (update.status === 'failed') addLog(`Erro na pipeline ID: ${update.id}`, 'error');
    });

    socketRef.current.on('disconnect', () => {
      setEngineStatus('offline');
    });

    return () => {
      socketRef.current?.disconnect();
      clearInterval(clusterCheckInterval);
    };
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    if (!user) return;
    
    const MAX_SIZE = 1024 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      addLog(`Arquivo excede 1GB. Upgrade para Enterprise necessário.`, 'error');
      return;
    }

    addLog(`Injetando binário: ${file.name}`, 'info');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tool', selectedTool);
    formData.append('settings', JSON.stringify(toolSettings));

    try {
      const response = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Falha no cluster');

      const data = await response.json();
      const newJob: VideoJob = {
        id: data.jobId,
        name: file.name,
        status: 'queued',
        progress: 0,
        tool: selectedTool,
        timestamp: new Date().toISOString()
      };

      setActiveJobs(prev => [newJob, ...prev]);
      setSelectedJobId(data.jobId);
      addLog(`Stream estabelecido. JobID: ${data.jobId}`, 'success');
    } catch (err) {
      addLog(`Erro crítico no upload. Cluster offline?`, 'error');
    }
  }, [user, selectedTool]);

  const activeJob = activeJobs.find(j => j.id === selectedJobId);

  return (
    <div className="flex h-screen w-full bg-[#050505] text-white selection:bg-purple-500/30 overflow-hidden font-sans">
      {/* SIDEBAR DE CONTROLE */}
      <aside className="w-72 border-r border-white/10 bg-black flex flex-col py-8 overflow-y-auto custom-scrollbar">
        <div className="flex-1 flex flex-col gap-8 px-6">
           {/* LOGO AREA */}
           <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto shrink-0 mb-4 mt-2 shadow-lg">
              <Activity className="w-6 h-6 text-white" />
           </div>

           <div className="h-px bg-white/5 w-full"></div>

           {/* TOOL SETTINGS PANEL */}
           <div className="flex-1 flex flex-col gap-8 pb-10">
              <div className="space-y-4">
                 <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-500 flex items-center gap-2">
                    <Zap className="w-3 h-3" /> Configs IA
                 </h3>
                 
                 <div className="space-y-6">
                    {activeToolDef?.settings.map(setting => (
                      <div key={setting.id} className="flex flex-col gap-3">
                        <label className="text-[9px] font-mono uppercase text-gray-500 font-bold">{setting.label}</label>
                        {setting.type === 'select' && (
                            <select 
                              value={toolSettings[setting.id] || setting.default}
                              onChange={(e) => setToolSettings(prev => ({ ...prev, [setting.id]: e.target.value }))}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white focus:border-purple-500/50 outline-none transition-all"
                            >
                              {setting.options?.map(opt => <option key={opt} value={opt} className="bg-[#0a0a0a] text-white">{opt}</option>)}
                            </select>
                        )}
                        {setting.type === 'slider' && (
                          <div className="flex items-center gap-3">
                            <input 
                              type="range"
                              min={setting.min}
                              max={setting.max}
                              value={toolSettings[setting.id] || setting.default}
                              onChange={(e) => setToolSettings(prev => ({ ...prev, [setting.id]: parseInt(e.target.value) }))}
                              className="accent-purple-500 h-1 grow cursor-pointer"
                            />
                            <span className="text-[10px] font-mono text-purple-400 w-8">{toolSettings[setting.id] || setting.default}%</span>
                          </div>
                        )}
                        {setting.type === 'toggle' && (
                           <button 
                            onClick={() => setToolSettings(prev => ({ ...prev, [setting.id]: !prev[setting.id] }))}
                            className={`w-full py-2 rounded-lg text-[9px] font-bold tracking-widest transition-all border ${
                              toolSettings[setting.id] 
                                ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' 
                                : 'bg-white/5 border-white/10 text-gray-600'
                            }`}
                          >
                            {toolSettings[setting.id] ? 'ATIVADO' : 'DESATIVADO'}
                          </button>
                        )}
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-black sticky bottom-0">
           <button onClick={logout} className="w-full py-3 rounded-xl flex items-center justify-center gap-3 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20">
              <LogOut className="w-4 h-4" />
              <span className="text-[10px] uppercase font-bold tracking-widest">Sair do Node</span>
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col relative bg-[#050505]">
        {/* TOP NAVBAR */}
        <header className="h-20 px-8 flex items-center justify-between border-b border-white/5 bg-black z-20">
           <div className="flex items-center gap-6">
              <h1 className="text-xl font-display font-black uppercase tracking-tighter italic">SmartVex <span className="text-purple-500 font-mono text-[10px] not-italic tracking-widest ml-2 opacity-50">Enterprise</span></h1>
              <div className="h-4 w-px bg-white/10"></div>
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                 <div className={`w-1.5 h-1.5 rounded-full ${engineStatus === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-rose-500'}`}></div>
                 <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest font-black">Cluster_{engineStatus}</span>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <div className="relative group">
                 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-purple-400 transition-colors" />
                 <input 
                    type="text" 
                    placeholder="Search projects..." 
                    className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs w-64 focus:outline-none focus:border-purple-500/50 transition-all"
                 />
              </div>
              <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all"><Bell className="w-4 h-4 text-gray-400" /></button>
              <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-black text-xs">
                {user?.name?.[0] || 'U'}
              </div>
           </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <div className="flex-1 flex overflow-hidden bg-black">
           {/* DISCOVER & TOOLS */}
           <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <AnimatePresence mode="wait">
                {selectedJobId ? (
                   <motion.div
                    key="workspace"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="h-full"
                   >
                      <ProcessWorkspace 
                        activeJob={activeJob || null} 
                        selectedTool={selectedTool}
                      />
                   </motion.div>
                ) : (
                  <motion.div
                    key="tools"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="max-w-6xl mx-auto"
                  >
                     <div className="mb-12">
                        <motion.h2 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2"
                        >
                          Crie clipes que <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">viralizam</span>
                        </motion.h2>
                        <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.4em]">Xeon v4.2 Gold Cluster Ready</p>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {TOOLS.map((tool) => (
                           <div 
                            key={tool.id}
                            onClick={() => setSelectedTool(tool.type)}
                            className={`p-8 rounded-[2rem] border transition-all cursor-pointer group relative overflow-hidden h-72 flex flex-col justify-between ${
                              selectedTool === tool.type 
                                ? 'bg-purple-600/10 border-purple-500/40' 
                                : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                            }`}
                           >
                              <div>
                                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all ${
                                   selectedTool === tool.type ? 'bg-purple-500 text-white shadow-xl' : 'bg-white/5 text-gray-600'
                                 }`}>
                                    <tool.icon className="w-7 h-7" />
                                 </div>
                                 <h3 className="text-xl font-display font-black text-white uppercase tracking-tight italic mb-2">{tool.name}</h3>
                                 <p className="text-xs text-gray-500 font-mono leading-relaxed line-clamp-2">{tool.description}</p>
                              </div>
                              <div className="flex items-center justify-between">
                                 <span className="text-[9px] font-mono text-purple-400 font-black tracking-[0.2em] uppercase">Enterprise</span>
                                 <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-white transition-colors" />
                              </div>
                           </div>
                        ))}
                     </div>

                     <div className="mt-16 p-1 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-transparent rounded-[3.5rem] border border-white/5">
                        <div className="bg-[#080808] rounded-[3.4rem] p-12 flex flex-col lg:flex-row items-center gap-10">
                           <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 shrink-0">
                              <Plus className="w-10 h-10 text-gray-400" />
                           </div>
                           <div className="flex-1 text-center lg:text-left">
                              <h3 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter mb-2">Importar novo Ativo</h3>
                              <p className="text-sm text-gray-500 font-mono uppercase tracking-[0.1em]">Arraste um vídeo ou clique no botão para processamento em tempo real.</p>
                           </div>
                           <label className="px-10 py-4 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest cursor-pointer hover:bg-purple-500 hover:text-white transition-all shadow-2xl">
                              <input 
                                type="file" 
                                className="hidden" 
                                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                              />
                              Upload Media
                           </label>
                        </div>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>

           {/* RIGHT PANEL - MONITOR & HISTORY */}
           <aside className="w-96 border-l border-white/5 bg-black flex flex-col overflow-hidden">
              <QueueMonitor 
                 jobs={activeJobs}
                 logs={logs}
                 selectedJobId={selectedJobId}
                 onSelectJob={setSelectedJobId}
                 onDownload={(j) => window.open(`/outputs/${j.id}.mp4`)}
                 onRetry={() => {}}
              />
           </aside>
        </div>
      </main>

      {/* CLUSTER STATUS NOTIFICATION (DISCREET) */}
      <AnimatePresence>
        {engineStatus === 'offline' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-rose-500 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-[0_10px_40px_rgba(244,63,94,0.3)] border border-white/20"
          >
             <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></div>
             <span className="text-[10px] font-mono font-black uppercase tracking-widest">
                Cluster Offline - Sincronizando...
             </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
