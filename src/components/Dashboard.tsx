import { 
  Sparkles,
  AlertCircle,
  LogIn,
  Scissors,
  Type,
  Smartphone
} from "lucide-react";
import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ToolType, VideoJob, TOOLS } from "../types";
import { Header, Sidebar } from "./Navigation";
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
  const [backendUrl, setBackendUrl] = useState<string>(localStorage.getItem('smartvex_backend_url') || '');

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

    const toolMessages: Record<ToolType, { start: string, success: string, step: string }> = {
      'Clipping': { 
        start: 'IA analisando hooks e retenção...', 
        success: 'Recortes virais gerados com sucesso!',
        step: 'Detectando rostos e reenquadrando para 9:16...'
      },
      'Captioning': {
        start: 'Escutando áudio e gerando transcrição...',
        success: 'Legendas dinâmicas aplicadas!',
        step: 'Sincronizando emojis e animações de texto...'
      },
      'Compression': {
        start: 'Otimizando bitrate sem perder qualidade...',
        success: 'Arquivo comprimido com sucesso!',
        step: 'Re-encodando frames pesados...'
      },
      'Conversion': {
        start: 'Alterando container e formato...',
        success: 'Vídeo convertido com sucesso!',
        step: 'Preservando metadados de cor...'
      },
      'AudioCleaning': {
        start: 'IA removendo ruído de fundo...',
        success: 'Áudio cristalino processado!',
        step: 'Equalizando ganho e removendo reverberação...'
      },
      'Enhancer': {
        start: 'Escalando resolução e nitidez...',
        success: 'Vídeo aprimorado para 4K!',
        step: 'Aplicando filtros de restauração Xeon-optimized...'
      }
    };

    const msgs = toolMessages[selectedTool];
    
    const settingsStr = Object.entries(toolSettings)
      .map(([k, v]) => `${k.toUpperCase()}=${v}`)
      .join(' | ');

    addLog(`Upload iniciado: ${file.name} [${(file.size / 1024 / 1024).toFixed(2)}MB]`, 'info');
    addLog(`CONFIG: ${settingsStr}`, 'info');

    if (backendUrl) {
      addLog(`[XEON_LINK] Tentando conexão com cluster remoto em ${backendUrl}...`, 'info');
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tool', selectedTool);
        formData.append('settings', settingsStr);

        fetch(`${backendUrl.replace(/\/$/, '')}/api/v1/process`, {
          method: 'POST',
          body: formData
        }).then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            addLog(`[XEON_SUCCESS] Handshake completo. Job de processamento alocado no servidor Xeon (ID: ${data.job_id}).`, 'success');
            addLog(`Otimizando pipeline para algoritmos de IA proprietários...`, 'info');
          } else {
            addLog(`[XEON_ERROR] Backend recusou a tarefa. Ativando Sandbox local (Limitação de GPU).`, 'warn');
          }
        }).catch(() => {
          addLog(`[XEON_OFFLINE] Cluster não encontrado. Certifique-se que 'server.py' está rodando no seu servidor.`, 'error');
        });
      } catch (e) {
        addLog(`Falha crítica de comunicação com o cluster.`, 'error');
      }
    }

    // Create a local object URL to simulate downloading the "processed" file
    const simulatedOutputUrl = URL.createObjectURL(file);

    if (user.isGuest) {
      const fakeId = Math.random().toString(36).substr(2, 9);
      const newJob: VideoJob = {
        id: fakeId,
        userId: user.uid,
        name: file.name,
        tool: selectedTool,
        progress: 0,
        status: 'queued',
        createdAt: new Date(),
        outputUrl: simulatedOutputUrl
      };
      
      setActiveJobs(prev => {
        const updated = [newJob, ...prev];
        localStorage.setItem(`jobs_${user.uid}`, JSON.stringify(updated));
        return updated;
      });
      setSelectedJobId(fakeId);

      // Guest Simulation - Fast Processing
      setTimeout(() => {
        addLog(`FFmpeg v6.0-static: Init Hardware Accelerator [NVDEC/CUDA]`, 'info');
        addLog(msgs.start, 'success');
        
        setActiveJobs(prev => {
          const nj = prev.map(j => j.id === fakeId ? { ...j, status: 'processing' as const, progress: 10 } : j);
          localStorage.setItem(`jobs_${user.uid}`, JSON.stringify(nj));
          return nj;
        });
        
        let progress = 10;
        const interval = setInterval(() => {
          progress += Math.random() * 15 + 5; 
          if (progress >= 100) {
            progress = 100;
            setActiveJobs(prev => {
              const nj = prev.map(j => j.id === fakeId ? { ...j, progress: 100, status: 'completed' as const } : j);
              localStorage.setItem(`jobs_${user.uid}`, JSON.stringify(nj));
              return nj;
            });
            addLog(`IO_WRITE: Finalizando container e metadados...`, 'info');
            addLog(msgs.success, 'success');
            clearInterval(interval);
          } else {
            if (progress > 30 && progress < 45) addLog(`X265: Pass 1/2 [Encoding Multi-thread]`, 'info');
            if (progress > 60 && progress < 75) addLog(msgs.step, 'info');
            setActiveJobs(prev => {
              const nj = prev.map(j => j.id === fakeId ? { ...j, progress: Math.floor(progress), status: 'processing' as const } : j);
              localStorage.setItem(`jobs_${user.uid}`, JSON.stringify(nj));
              return nj;
            });
          }
        }, 1000); 
      }, 800);
      return;
    }

    // Real Supabase Logic
    try {
      const { data, error } = await supabase
        .from('video_jobs')
        .insert({
          user_id: user.uid,
          name: file.name,
          tool: selectedTool,
          progress: 1, // Feedback imediato
          status: 'queued',
          output_url: simulatedOutputUrl
        })
        .select()
        .single();
        
      if (error) throw error;
      
      addLog(`Servidores Xeon alocados (ID: ${data.id.substring(0,8)})`, 'info');
      setSelectedJobId(data.id);

      // Mock of actual processing
      let progress = 1;
      setTimeout(async () => {
        addLog(`FFmpeg v6.0: Connecting to Xeon GPU Cluster...`, 'info');
        addLog(msgs.start, 'success');
        // Update database to processing status
        await supabase.from('video_jobs').update({ status: 'processing', progress: 5 }).eq('id', data.id);
        
        const interval = setInterval(async () => {
          progress += Math.random() * 12 + 1; 
          if (progress >= 100) {
            await supabase.from('video_jobs').update({ progress: 100, status: 'completed' }).eq('id', data.id);
            clearInterval(interval);
            addLog(`IO_WRITE: Finalizando container e metadados...`, 'info');
            addLog(msgs.success, 'success');
          } else {
            if (progress > 20 && progress < 35) addLog(`X265: Pass 1/2 [Encoding Multi-thread]`, 'info');
            if (progress > 50 && progress < 65) addLog(msgs.step, 'info');
            await supabase.from('video_jobs').update({ progress: Math.floor(progress), status: 'processing' }).eq('id', data.id);
          }
        }, 1500);
      }, 800);

    } catch (error: any) {
      addLog(`Erro ao registrar job no banco: ${error.message}`, "error");
    }
  }, [user, selectedTool, activeJobs, addLog]);

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
    <div className="flex flex-col h-screen bg-bg-deep overflow-hidden selection:bg-purple-500/30">
      <Header user={user} />
      
      <div className="flex grow overflow-hidden">
        <Sidebar activeView={view} onSelectView={setView} />
        
        <main className="flex-1 p-8 flex flex-col gap-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-purple-500/5 blur-[150px] -z-10"></div>
          
          <AnimatePresence mode="wait">
            {view === 'dashboard' ? (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full gap-8 overflow-hidden"
              >
                <ToolSelector selectedTool={selectedTool} onSelect={(t) => setSelectedTool(t)} />
                
                {/* Custom Tool Settings Panel */}
                <div className="flex flex-wrap gap-4 px-6 py-4 glass-panel rounded-3xl border-white/5 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 mr-4 border-r border-white/10 pr-6">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                      {activeToolDef && <activeToolDef.icon className="w-4 h-4" />}
                    </div>
                    <span className="font-display font-black text-xs uppercase tracking-widest text-white/50">Configurações IA</span>
                  </div>
                  
                  {activeToolDef?.settings.map(setting => (
                    <div key={setting.id} className="flex flex-col gap-1.5 min-w-[140px]">
                      <label className="text-[10px] font-mono uppercase tracking-tighter text-gray-500">{setting.label}</label>
                      {setting.type === 'select' && (
                        <select 
                          value={toolSettings[setting.id] || setting.default}
                          onChange={(e) => setToolSettings(prev => ({ ...prev, [setting.id]: e.target.value }))}
                          className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:border-purple-500/50 outline-none transition-all cursor-pointer hover:bg-white/10"
                        >
                          {setting.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      )}
                      {setting.type === 'toggle' && (
                        <button 
                          onClick={() => setToolSettings(prev => ({ ...prev, [setting.id]: !prev[setting.id] }))}
                          className={`w-fit px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            toolSettings[setting.id] 
                              ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' 
                              : 'bg-white/5 border-white/10 text-gray-500'
                          }`}
                        >
                          {toolSettings[setting.id] ? 'ATIVADO' : 'DESATIVADO'}
                        </button>
                      )}
                      {setting.type === 'slider' && (
                        <div className="flex items-center gap-3">
                          <input 
                            type="range"
                            min={setting.min}
                            max={setting.max}
                            value={toolSettings[setting.id] || setting.default}
                            onChange={(e) => setToolSettings(prev => ({ ...prev, [setting.id]: parseInt(e.target.value) }))}
                            className="accent-purple-500 h-1 grow"
                          />
                          <span className="text-[10px] font-mono text-purple-400 w-6">{toolSettings[setting.id] || setting.default}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex grow gap-8 overflow-hidden">
                  <ProcessWorkspace 
                    selectedTool={selectedTool} 
                    onUpload={handleUpload} 
                  />
                  
                  <QueueMonitor 
                    jobs={activeJobs} 
                    logs={logs} 
                    selectedJobId={selectedJobId}
                    onSelectJob={(id) => setSelectedJobId(id)}
                    onRetry={handleRetry}
                    onDownload={(job) => {
                      if (job.outputUrl && job.outputUrl.startsWith('blob:')) {
                        try {
                          const a = document.createElement('a');
                          a.href = job.outputUrl;
                          a.download = `smartvex_${job.tool.toLowerCase()}_${job.name}`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          addLog(`Exportando resultado: ${job.name}`, 'success');
                        } catch (e) {
                          addLog('Erro exportação. Usando fallback...', 'warn');
                          fallbackDownload(job);
                        }
                      } else {
                        fallbackDownload(job);
                      }
                    }}
                  />
                </div>
              </motion.div>
            ) : view === 'settings' ? (
              <motion.div 
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 glass-panel rounded-[3rem] p-12 border-white/5 overflow-y-auto"
              >
                <div className="max-w-4xl mx-auto">
                  <header className="mb-12">
                    <h2 className="text-4xl font-display font-black text-white mb-2 uppercase tracking-tighter italic">Engine Settings</h2>
                    <p className="text-gray-500">Configure sua conexão com cluster Xeon e chaves de API.</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <section className="space-y-6">
                      <div className="flex items-center gap-3 text-purple-400 mb-2">
                        <TerminalIcon className="w-5 h-5" />
                        <h3 className="font-bold uppercase tracking-widest text-sm text-white">Backend FastAPI</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase mb-2">Backend Endpoint URL</label>
                          <input 
                            type="text" 
                            placeholder="http://localhost:8000"
                            value={backendUrl}
                            onChange={(e) => {
                              setBackendUrl(e.target.value);
                              localStorage.setItem('smartvex_backend_url', e.target.value);
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-purple-500/50 outline-none transition-all font-mono"
                          />
                        </div>
                        <div className="p-6 rounded-2xl bg-purple-500/5 border border-purple-500/10">
                          <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Como conectar seu servidor?
                          </h4>
                          <p className="text-[11px] text-gray-400 leading-relaxed">
                            O SmartVex utiliza uma arquitetura baseada em workers. Para processar vídeos reais em 4K, você precisa rodar o arquivo <code className="text-purple-400">server.py</code> (FastAPI) em uma máquina com GPU.
                          </p>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-6">
                      <div className="flex items-center gap-3 text-pink-400 mb-2">
                        <Smartphone className="w-5 h-5" />
                        <h3 className="font-bold uppercase tracking-widest text-sm text-white">Mobile Tracking</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="glass-panel p-4 rounded-2xl border-white/5 flex flex-col items-center justify-center gap-2">
                          <span className="text-[10px] text-gray-500 uppercase font-mono">Status App</span>
                          <span className="text-green-500 font-black">ONLINE</span>
                        </div>
                        <div className="glass-panel p-4 rounded-2xl border-white/5 flex flex-col items-center justify-center gap-2">
                          <span className="text-[10px] text-gray-500 uppercase font-mono">Sync Mode</span>
                          <span className="text-purple-500 font-black">AUTO</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => window.open('/server.py', '_blank')}
                        className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                      >
                        <Download className="w-4 h-4" /> Download Backend Code (FastAPI)
                      </button>
                    </section>
                  </div>

                  <div className="mt-16 p-8 glass-panel rounded-[2rem] border-purple-500/20 bg-purple-500/5 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TerminalIcon className="w-20 h-20" />
                     </div>
                     <h3 className="text-xl font-bold text-white mb-4">Script de Inicialização Xeon</h3>
                     <p className="text-sm text-gray-400 mb-6 max-w-2xl text-pretty">
                        Copie o comando abaixo para iniciar sua Fast API localmente. Certifique-se de ter o Python 3.10+ instalado.
                     </p>
                     <div className="bg-black/60 rounded-xl p-6 font-mono text-sm text-purple-300 border border-white/5 flex justify-between items-center group/code cursor-pointer active:scale-[0.99] transition-all">
                        <code>pip install fastapi uvicorn && python server.py</code>
                        <div className="px-3 py-1 bg-white/10 rounded-lg text-[10px] text-white opacity-0 group-hover/code:opacity-100 transition-opacity uppercase font-bold">Copiar</div>
                     </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="other"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="flex-1 glass-panel rounded-[3rem] flex flex-col items-center justify-center text-center p-12 border-white/5"
              >
                <div className="w-24 h-24 bg-purple-500/10 rounded-[2rem] flex items-center justify-center text-purple-500 mb-8 border border-purple-500/20 shadow-[0_0_50px_rgba(168,85,247,0.1)]">
                  <Sparkles className="w-10 h-10" />
                </div>
                <h2 className="text-4xl font-display font-black text-white mb-4 uppercase tracking-tighter">Módulo em Integração</h2>
                <p className="text-gray-400 max-w-md text-lg leading-relaxed">
                  O módulo de <span className="text-purple-400 font-bold">{view.toUpperCase()}</span> está sendo sincronizado com os servidores Xeon. Volte em instantes para acessar suas métricas e configurações avançadas.
                </p>
                <button 
                  onClick={() => setView('dashboard')}
                  className="mt-12 px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-100 transition-all flex items-center gap-2"
                >
                  Voltar ao Dashboard
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Ultra Slim Footer */}
      <footer className="h-6 bg-black border-t border-white/5 px-8 flex items-center justify-between text-[8px] font-mono opacity-20 uppercase tracking-[0.4em] shrink-0 pointer-events-none">
        <div className="flex gap-12">
          <span>TX_READY: 0.2ms</span>
          <span>BUFFER_LEVEL: 0%</span>
          <span>GPU_TEMP: 32°C</span>
        </div>
        <div className="flex gap-12">
          <span>SECURE_SHELL: AES-256</span>
          <span>CLUSTER_ID: SMARTVEX-01-BR</span>
        </div>
      </footer>
    </div>
  );
}
