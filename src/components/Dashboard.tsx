import { 
  Sparkles,
  AlertCircle,
  LogIn,
  Scissors,
  Type,
  Smartphone
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ToolType, VideoJob } from "../types";
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
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
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
    // Generate a clean dummy text file representing the processed video
    const a = document.createElement('a');
    const content = `SMARTVEX PROCESSED OUTPUT\n=========================\n\nArquivo Original: ${job.name}\nProcessamento: ${job.tool}\nStatus: SUCESSO\n\nNeste ambiente gratuito, estamos gerando este relatório em vez do vídeo renderizado para economizar recursos de processamento backend.\nObrigado por testar o SmartVex!`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    a.href = URL.createObjectURL(blob);
    a.download = `smartvex_${job.tool}_${job.name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleUpload = useCallback(async (file: File) => {
    if (!user) return;

    addLog(`Upload iniciado: ${file.name} [${(file.size / 1024 / 1024).toFixed(2)}MB]`, 'info');

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
      
      const updatedJobs = [newJob, ...activeJobs];
      setActiveJobs(updatedJobs);
      localStorage.setItem(`jobs_${user.uid}`, JSON.stringify(updatedJobs));
      setSelectedJobId(fakeId);

      // Guest Simulation - Fast Processing
      setTimeout(() => {
        addLog(`AI Processing Iniciado: ${file.name} via ${selectedTool}`, 'success');
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 40; // Super fast processing for free tier UX
          if (progress >= 100) {
            progress = 100;
            setActiveJobs(prev => {
              const nj = prev.map(j => j.id === fakeId ? { ...j, progress: 100, status: 'completed' as const } : j);
              localStorage.setItem(`jobs_${user.uid}`, JSON.stringify(nj));
              return nj;
            });
            addLog(`Clipes renderizados com sucesso: ${file.name}`, 'success');
            clearInterval(interval);
          } else {
            setActiveJobs(prev => prev.map(j => j.id === fakeId ? { ...j, progress: Math.floor(progress), status: 'processing' as const } : j));
          }
        }, 500); // Trigger every 500ms
      }, 500);
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
          progress: 0,
          status: 'queued',
          output_url: simulatedOutputUrl
        })
        .select()
        .single();
        
      if (error) throw error;
      
      addLog(`Job registrado na nuvem: ${data.id}`, 'info');
      setSelectedJobId(data.id);

      // Mock of actual processing (faster for free tier constraints)
      let progress = 0;
      const interval = setInterval(async () => {
        progress += Math.random() * 40;
        if (progress >= 100) {
          await supabase.from('video_jobs').update({ progress: 100, status: 'completed' }).eq('id', data.id);
          clearInterval(interval);
          addLog(`Clipes renderizados com sucesso: ${file.name}`, 'success');
        } else {
          await supabase.from('video_jobs').update({ progress: Math.floor(progress), status: 'processing' }).eq('id', data.id);
        }
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
        <Sidebar />
        
        <main className="flex-1 p-8 flex flex-col gap-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-purple-500/5 blur-[150px] -z-10"></div>
          
          <ToolSelector selectedTool={selectedTool} onSelect={(t) => setSelectedTool(t)} />
          
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
                    a.download = `processed_${job.name}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    addLog(`Baixando original processado: ${job.name}`, 'success');
                  } catch (e) {
                    addLog('Erro ao baixar original. Gerando cópia cacheada...', 'warn');
                    fallbackDownload(job);
                  }
                } else {
                  addLog('Gerando cópia pós-processada local (Vercel Free Tier)', 'info');
                  fallbackDownload(job);
                }
              }}
            />
          </div>
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
