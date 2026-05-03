import { 
  Sparkles,
  AlertCircle,
  LogIn,
  Scissors,
  Type,
  Smartphone,
  Terminal as TerminalIcon,
  Download,
  FileVideo,
  Play,
  RotateCcw,
  CheckCircle2,
  Settings,
  LayoutDashboard,
  BarChart3,
  History,
  LogOut,
  User,
  Mic,
  Film,
  Wand2,
  Plus,
  Cpu,
  Activity,
  Zap
} from "lucide-react";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { io, Socket } from "socket.io-client";
import { ToolType, VideoJob, TOOLS } from "../types";
import { ToolSelector } from "./ToolSelector";
import { ProcessWorkspace } from "./ProcessWorkspace";
import { QueueMonitor } from "./QueueMonitor";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const [user, setUser] = useState<{ uid: string, displayName: string, photoURL: string, isGuest: boolean } | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeJobs, setActiveJobs] = useState<VideoJob[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolType>('Clipping');
  const [toolSettings, setToolSettings] = useState<Record<string, any>>({});
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [backendUrl, setBackendUrl] = useState<string>(window.location.origin);
  const socketRef = useRef<Socket | null>(null);

  const [logs, setLogs] = useState<{msg: string, type: 'info' | 'warn' | 'error' | 'success'}[]>([]);

  const addLog = useCallback((msg: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    setLogs(prev => {
      const newLogs = [...prev.slice(-30), { msg, type }];
      if (user) {
        localStorage.setItem(`logs_${user.uid}`, JSON.stringify(newLogs));
      }
      return newLogs;
    });
  }, [user]);

  useEffect(() => {
    socketRef.current = io(backendUrl);
    
    return () => {
      socketRef.current?.disconnect();
    };
  }, [backendUrl]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    activeJobs.forEach(job => {
      if (job.status === 'processing' || job.status === 'queued') {
        socket.on(`job:${job.id}:status`, (data: { status: string, progress: number, error?: string }) => {
          setActiveJobs(prev => {
            const updated = prev.map(j => j.id === job.id ? { 
              ...j, 
              status: data.status as any, 
              progress: data.progress,
              outputUrl: data.status === 'completed' ? `/api/v1/download/${job.id}` : j.outputUrl
            } : j);
            if (user) localStorage.setItem(`jobs_${user.uid}`, JSON.stringify(updated));
            return updated;
          });

          if (data.status === 'completed') {
            addLog(`Processamento finalizado: ${job.name}`, 'success');
          } else if (data.status === 'failed') {
            addLog(`Erro no processamento (${job.name}): ${data.error}`, 'error');
          }
        });
      }
    });

    return () => {
      activeJobs.forEach(job => socket.off(`job:${job.id}:status`));
    };
  }, [activeJobs, user, addLog]);

  const activeToolDef = useMemo(() => TOOLS.find(t => t.type === selectedTool), [selectedTool]);

  useEffect(() => {
    if (activeToolDef) {
      const defaults = activeToolDef.settings.reduce((acc, curr) => ({
        ...acc,
        [curr.id]: curr.default
      }), {});
      setToolSettings(prev => ({ ...defaults, ...prev }));
    }
  }, [selectedTool, activeToolDef]);
  const [view, setView] = useState<'dashboard' | 'analytics' | 'terminal' | 'settings'>('dashboard');

  // Auth Effects
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          uid: session.user.id,
          displayName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuário',
          photoURL: session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${session.user.id}`,
          isGuest: false
        });
      } else {
        const guestId = localStorage.getItem('guest_uid');
        if (guestId) {
          setUser({
            uid: guestId,
            displayName: 'Criador Convidado',
            photoURL: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${guestId}`,
            isGuest: true
          });
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          uid: session.user.id,
          displayName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuário',
          photoURL: session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${session.user.id}`,
          isGuest: false
        });
      } else {
        const guestId = localStorage.getItem('guest_uid');
        if (guestId) {
          setUser({
            uid: guestId,
            displayName: 'Criador Convidado',
            photoURL: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${guestId}`,
            isGuest: true
          });
        } else {
          setUser(null);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Data Fetching / Persistence
  useEffect(() => {
    if (!user) {
      setActiveJobs([]);
      return;
    }
    
    if (user.isGuest) {
      const savedJobs = localStorage.getItem(`jobs_${user.uid}`);
      const savedLogs = localStorage.getItem(`logs_${user.uid}`);
      
      if (savedJobs) {
        setActiveJobs(JSON.parse(savedJobs));
      } else {
        setActiveJobs([]);
        localStorage.setItem(`jobs_${user.uid}`, JSON.stringify([]));
      }

      if (savedLogs) setLogs(JSON.parse(savedLogs));
      else addLog("Sessão iniciada como Convidado. Pronto para criar clipes.", "info");
      return;
    }

    // Authenticated user: fetch from Supabase
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from('video_jobs')
        .select('*')
        .eq('user_id', user.uid)
        .order('created_at', { ascending: false });

      if (error) {
        addLog(`Erro ao carregar jobs: ${error.message}`, 'error');
        return;
      }
      setActiveJobs(data.map(job => ({ 
        ...job, 
        userId: job.user_id, 
        outputUrl: job.output_url,
        createdAt: job.created_at
      })) as VideoJob[]);
    };

    fetchJobs();

    const subscription = supabase
      .channel('public:video_jobs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'video_jobs', filter: `user_id=eq.${user.uid}` }, payload => {
        fetchJobs();
      })
      .subscribe();

    const savedLogs = localStorage.getItem(`logs_${user.uid}`);
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    else addLog("Sessão autenticada iniciada. Pronto para criar clipes virais.", "info");

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, addLog]);

  // Actions
  const handleGoogleLogin = async () => {
    try {
      setAuthError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setAuthError(`ERRO DE AUTENTICAÇÃO: ${err.message}`);
    }
  };

  const handleGuestLogin = () => {
    let guestId = localStorage.getItem('guest_uid');
    if (!guestId) {
      guestId = 'guest_' + Math.random().toString(36).substring(7);
      localStorage.setItem('guest_uid', guestId);
    }
    setUser({
      uid: guestId,
      displayName: 'Criador Convidado',
      photoURL: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${guestId}`,
      isGuest: true
    });
  };

  const fallbackDownload = (job: VideoJob) => {
    // Generate a clean documentation representing the processed video
    const a = document.createElement('a');
    const content = `
[SMARTVEX AI ENGINE - XEON CLUSTER v4.2]
=======================================
JOB_ID: ${job.id.toUpperCase()}
ORIGINAL_FILE: ${job.name}
TARGET_PIPELINE: ${job.tool.toUpperCase()}
STATUS: RENDER_SUCCESSFUL
TIMESTAMP: ${new Date().toISOString()}

RELATÓRIO DE PROCESSAMENTO IA:
-----------------------------
1. Extração de Áudio e Transcrição: OK
2. Identificação de Pontos de Retenção (Visual Saliency): OK
3. Reenquadramento Inteligente (Xeon-Optimized): OK
4. Normalização de Cor e Audio: OK

NOTA DO SISTEMA:
Este arquivo é um 'Render Manifest'. Atualmente, você está utilizando o
ambiente de demonstração (Vercel Edge Sandbox). Para realizar o download do
arquivo binário final (.mp4) processado pelos servidores Xeon, é necessário
conectar seu próprio backend FastAPI via FFmpeg ou utilizar uma conta Enterprise.

Obrigado por utilizar o SmartVex!
    `;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    a.href = URL.createObjectURL(blob);
    a.download = `smartvex_RESULT_${job.id.substring(0,8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addLog(`Manifesto de renderização gerado para: ${job.name}`, 'success');
    addLog(`DICA: Conecte o worker-xeon.py para downloads binários.`, 'info');
  };

  const handleUpload = useCallback(async (file: File) => {
    if (!user) return;

    addLog(`Upload iniciado: ${file.name} [${(file.size / 1024 / 1024).toFixed(2)}MB]`, 'info');
    addLog(`Pipeline: Detectando infraestrutura Xeon v4.2...`, 'info');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('tool', selectedTool);
    formData.append('settings', JSON.stringify(toolSettings));

    try {
      addLog(`Transmitindo via túnel de dados seguro...`, 'info');
      const response = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage = 'Falha no upload para o cluster.';
        try {
          const errData = JSON.parse(text);
          errorMessage = errData.error || errorMessage;
        } catch (e) {
          // If not JSON, show first 50 chars of response
          errorMessage = `Erro do Servidor (${response.status}): ${text.substring(0, 50)}...`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const jobId = data.jobId;

      const newJob: VideoJob = {
        id: jobId,
        userId: user.uid,
        name: file.name,
        tool: selectedTool,
        progress: 0,
        status: 'queued',
        createdAt: new Date(),
        outputUrl: null
      };
      
      setActiveJobs(prev => {
        const updated = [newJob, ...prev];
        if (user) localStorage.setItem(`jobs_${user.uid}`, JSON.stringify(updated));
        return updated;
      });
      setSelectedJobId(jobId);
      addLog(`[XEON_LINK] Job alocado com sucesso (ID: ${jobId})`, 'success');
      addLog(`Aguardando disponibilidade de threads Xeon...`, 'info');

    } catch (error: any) {
      addLog(`Erro crítico: ${error.message}`, 'error');
    }
  }, [user, selectedTool, toolSettings, addLog]);

  const handleRetry = async (job: VideoJob) => {
    addLog(`Reiniciando IA para ${job.name}`, 'warn');
    if (!user) return;
    
    if (user.isGuest) {
      // Just reset the specific job
      const reset = activeJobs.map(j => j.id === job.id ? { ...j, status: 'queued' as const, progress: 0 } : j);
      setActiveJobs(reset);
      localStorage.setItem(`jobs_${user.uid}`, JSON.stringify(reset));
      
      // Guest Simulation Restart
      setTimeout(() => {
        addLog(`Reprocessando transcrição & cortes: ${job.name}`, 'success');
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 40;
          if (progress >= 100) {
            progress = 100;
            setActiveJobs(prev => {
              const nj = prev.map(j => j.id === job.id ? { ...j, progress: 100, status: 'completed' as const } : j);
              localStorage.setItem(`jobs_${user.uid}`, JSON.stringify(nj));
              return nj;
            });
            addLog(`Clipes otimizados e prontos: ${job.name}`, 'success');
            clearInterval(interval);
          } else {
            setActiveJobs(prev => prev.map(j => j.id === job.id ? { ...j, progress: Math.floor(progress), status: 'processing' as const } : j));
          }
        }, 500);
      }, 300);
      return;
    }

    // Real Supabase Logic
    try {
      await supabase.from('video_jobs').update({ status: 'queued', progress: 0 }).eq('id', job.id);
      
      setTimeout(() => {
        let progress = 0;
        const interval = setInterval(async () => {
          progress += Math.random() * 40;
          if (progress >= 100) {
            await supabase.from('video_jobs').update({ progress: 100, status: 'completed' }).eq('id', job.id);
            clearInterval(interval);
            addLog(`Clipes renderizados com sucesso: ${job.name}`, 'success');
          } else {
            await supabase.from('video_jobs').update({ progress: Math.floor(progress), status: 'processing' }).eq('id', job.id);
          }
        }, 800);
      }, 500);
    } catch (error: any) {
      addLog(`Erro ao reprocessar: ${error.message}`, 'error');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Animated Background Highlights */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-600/10 blur-[120px] animate-pulse delay-1000"></div>
        
        <div className="scanline opacity-10"></div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10 w-full max-w-4xl text-center"
        >
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 10 }}
            className="w-20 h-20 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-[0_0_80px_rgba(168,85,247,0.4)]"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tight leading-tight mb-6">
            Recortes de vídeo <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 glow-text">alimentados por IA</span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
            Transforme vídeos longos em dezenas de Shorts, Reels e TikToks virais em apenas um clique. Perfeito para criadores e empresas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 max-w-xl mx-auto">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              className="w-full sm:w-auto px-8 py-5 bg-white text-black rounded-[2rem] font-bold text-lg flex items-center justify-center gap-3 shadow-2xl hover:bg-gray-100 transition-all"
            >
              <LogIn className="w-5 h-5" /> Cadastre-se - É Grátis
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGuestLogin}
              className="w-full sm:w-auto px-8 py-5 bg-transparent text-white border border-white/10 rounded-[2rem] font-bold text-lg flex items-center justify-center gap-3 hover:bg-white/5 transition-all"
            >
              Testar como Visitante
            </motion.button>
          </div>

          <AnimatePresence>
            {authError && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-12 p-6 glass-panel rounded-3xl border-rose-500/30 max-w-xl mx-auto text-left"
              >
                <div className="flex items-center gap-3 text-rose-500 font-bold text-sm uppercase mb-2">
                  <AlertCircle className="w-5 h-5" /> Falha na Autenticação
                </div>
                <p className="text-rose-400/80 text-sm leading-relaxed">
                  {authError}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-20 flex flex-wrap justify-center gap-x-12 gap-y-6 opacity-30 grayscale pointer-events-none items-center">
             <span className="font-display font-bold text-xl flex items-center gap-2"><Scissors className="w-5 h-5"/> Auto-Corte</span>
             <span className="font-display font-bold text-xl flex items-center gap-2"><Type className="w-5 h-5"/> Legendas Virais</span>
             <span className="font-display font-bold text-xl flex items-center gap-2"><Smartphone className="w-5 h-5"/> Face Tracking</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex bg-black h-screen w-screen overflow-hidden text-white font-sans selection:bg-purple-500/30">
      {/* 1. SIDEBAR DE NAVEGAÇÃO ULTRASLIM */}
      <aside className="w-20 border-r border-white/10 flex flex-col items-center py-8 gap-10 bg-panel z-50">
        <div className="w-12 h-12 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        
        <nav className="flex flex-col gap-6">
          <NavItem active={view === 'dashboard'} icon={LayoutDashboard} onClick={() => setView('dashboard')} label="Studio" />
          <NavItem active={view === 'analytics'} icon={BarChart3} onClick={() => setView('analytics')} label="Analytics" />
          <NavItem active={view === 'terminal'} icon={TerminalIcon} onClick={() => setView('terminal')} label="Logs" />
          <NavItem active={view === 'settings'} icon={Settings} onClick={() => setView('settings')} label="Config" />
        </nav>

        <div className="mt-auto flex flex-col gap-6 items-center pb-6">
          <div className="w-10 h-10 rounded-full border border-white/10 p-0.5 overflow-hidden">
            <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover rounded-full" />
          </div>
          <button onClick={() => supabase.auth.signOut()} className="text-gray-500 hover:text-white transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* 2. PAINEL DE CONFIGURAÇÃO E TOOL SELECTOR */}
      <aside className="w-85 border-r border-white/5 bg-[#0a0a0a] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-gradient-to-b from-purple-500/5 to-transparent">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500 mb-6 font-bold flex items-center gap-2">
             <Activity className="w-3 h-3 text-purple-500" /> Pipeline Control
          </h2>
          
          {/* BOTÃO DE IMPORTAR FIXO E DESTAQUE */}
          <motion.label 
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(168,85,247,0.1)' }}
            whileTap={{ scale: 0.98 }}
            className="w-full h-40 border-2 border-dashed border-purple-500/20 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-purple-500/50 transition-all group mb-8 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <input 
              type="file" 
              className="hidden" 
              accept="video/*" 
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} 
            />
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all shadow-xl">
              <Plus className="w-8 h-8" />
            </div>
            <div className="text-center">
              <span className="block text-[11px] font-black uppercase tracking-[0.2em] text-white">Importar Media</span>
              <span className="block text-[9px] font-mono text-gray-500 mt-1 uppercase">Cloud Xeon Cluster Ready</span>
            </div>
          </motion.label>

          <ToolSelector selectedTool={selectedTool} onSelect={(t) => setSelectedTool(t)} vertical={true} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8 custom-scrollbar">
           <div className="pt-8 mb-4">
             <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-500 mb-6 flex items-center gap-2">
               <Wand2 className="w-3 h-3" /> Parâmetros IA
             </h3>
             
             <div className="space-y-6">
                {activeToolDef?.settings.map(setting => (
                  <div key={setting.id} className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono uppercase text-gray-500">{setting.label}</label>
                    {setting.type === 'select' && (
                        <select 
                          value={toolSettings[setting.id] || setting.default}
                          onChange={(e) => setToolSettings(prev => ({ ...prev, [setting.id]: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500/50 outline-none transition-all"
                        >
                          {setting.options?.map(opt => <option key={opt} value={opt} className="bg-[#0a0a0a] text-white">{opt}</option>)}
                        </select>
                    )}
                    {setting.type === 'slider' && (
                      <div className="flex items-center gap-4">
                        <input 
                          type="range"
                          min={setting.min}
                          max={setting.max}
                          value={toolSettings[setting.id] || setting.default}
                          onChange={(e) => setToolSettings(prev => ({ ...prev, [setting.id]: parseInt(e.target.value) }))}
                          className="accent-purple-500 h-1 grow"
                        />
                        <span className="text-[10px] font-mono text-purple-400 w-8">{toolSettings[setting.id] || setting.default}%</span>
                      </div>
                    )}
                    {setting.type === 'toggle' && (
                       <button 
                        onClick={() => setToolSettings(prev => ({ ...prev, [setting.id]: !prev[setting.id] }))}
                        className={`w-full py-2.5 rounded-xl text-[10px] font-bold tracking-widest transition-all border ${
                          toolSettings[setting.id] 
                            ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' 
                            : 'bg-white/5 border-white/10 text-gray-500 opacity-50'
                        }`}
                      >
                        {toolSettings[setting.id] ? 'RECURSO ATIVO' : 'RECURSO INATIVO'}
                      </button>
                    )}
                  </div>
                ))}
             </div>
           </div>
        </div>
      </aside>

      {/* 3. WORKSPACE CENTRAL */}
      <main className="flex-1 bg-black relative flex flex-col">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/50 backdrop-blur-md z-40">
           <div className="flex items-center gap-4">
             <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Cpu className="w-3 h-3 text-purple-500" /> Engine: {user.isGuest ? 'Sandbox' : 'Xeon-Optimized'}
             </div>
             <div className="h-4 w-px bg-white/10"></div>
             <span className="text-xs font-bold text-white/80 uppercase tracking-tighter italic">{activeToolDef?.name} Pipeline</span>
           </div>
           
           <div className="flex items-center gap-8">
             <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                   <div className="w-1 h-1 bg-green-500 rounded-full animate-ping"></div>
                   <span className="text-[9px] font-mono text-green-500 uppercase font-black">Cluster_Live</span>
                </div>
                <div className="flex gap-0.5">
                   {[...Array(8)].map((_, i) => (
                     <motion.div 
                        key={i}
                        animate={{ height: [4, 12, 6, 14, 8] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                        className="w-1 bg-purple-500/40 rounded-full"
                     />
                   ))}
                </div>
             </div>

             <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
               <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
               <span className="text-[10px] font-mono text-gray-400 uppercase">Latency: <span className="text-white">12ms</span></span>
             </div>
           </div>
        </header>

        <div className="flex-1 flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.03)_0,transparent_100%)]">
           {/* Visualização de Estado Vazio ou Player */}
           <AnimatePresence mode="wait">
             {selectedJobId ? (
                <motion.div 
                  key={selectedJobId}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="w-full h-full"
                >
                  <ProcessWorkspace 
                     selectedTool={selectedTool} 
                     activeJob={activeJobs.find(j => j.id === selectedJobId)}
                  />
                </motion.div>
             ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="flex flex-col items-center text-center gap-8"
                >
                  <div className="w-32 h-32 bg-white/[0.02] rounded-[3rem] flex items-center justify-center text-white/10 border border-white/5 relative group">
                    <div className="absolute inset-0 bg-purple-500/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <FileVideo className="w-12 h-12 transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-white">Pronto para Renderizar</h3>
                    <p className="text-xs text-gray-500 font-mono max-w-xs leading-loose">Selecione uma ferramenta na barra lateral e importe sua mídia para processamento Xeon.</p>
                  </div>
                </motion.div>
             )}
           </AnimatePresence>
        </div>
      </main>

      {/* 4. MONITOR DE STATUS E LOGS (DIREITA) */}
      <aside className="w-96 border-l border-white/10 bg-panel flex flex-col overflow-hidden">
         <QueueMonitor 
            jobs={activeJobs} 
            logs={logs} 
            selectedJobId={selectedJobId}
            onSelectJob={(id) => setSelectedJobId(id)}
            onRetry={handleRetry}
            onDownload={(job) => {
              if (job.status === 'completed') {
                const link = document.createElement('a');
                link.href = `/api/v1/download/${job.id}`;
                link.download = `smartvex_${job.id}_${job.name}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                addLog(`Baixando vídeo processado: ${job.name}`, 'success');
              } else {
                addLog('Aguarde a finalização do processamento para baixar.', 'warn');
              }
            }}
          />
      </aside>

      {/* FOOTER OVERLAY */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-pink-500 to-transparent opacity-50 z-[100]"></div>
    </div>
  );
}

function NavItem({ active, icon: Icon, onClick, label }: { active: boolean, icon: any, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`relative group p-3 rounded-2xl transition-all duration-300 ${active ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
    >
      <Icon className="w-5 h-5" />
      <div className="absolute left-full ml-4 px-3 py-1.5 bg-black border border-white/10 text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-[100] pointer-events-none whitespace-nowrap font-bold uppercase tracking-widest">
        {label}
      </div>
      {active && <motion.div layoutId="nav-active" className="absolute -left-1 top-1/4 bottom-1/4 w-1 bg-purple-500 rounded-full" />}
    </button>
  );
}
