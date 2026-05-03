import { 
  Scissors, 
  Type, 
  Minimize2, 
  RefreshCw, 
  Volume2, 
  Sparkles,
  Upload,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LayoutGrid,
  Settings,
  BarChart3,
  Terminal,
  LogOut,
  LogIn
} from "lucide-react";
import { useState, useCallback, useEffect, useRef, DragEvent } from "react";
import { motion } from "framer-motion";
import { auth, db, signInWithGoogle } from "../lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit
} from "firebase/firestore";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

type ToolType = 'Cut' | 'Caption' | 'Compress' | 'Convert' | 'Audio' | 'Enhancer';

interface VideoJob {
  id: string;
  name: string;
  tool: ToolType;
  progress: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  userId: string;
  createdAt: any;
}

const tools = [
  { id: '01', name: 'Corte Precisão', type: 'Cut' as ToolType, icon: Scissors },
  { id: '02', name: 'Legendas AI', type: 'Caption' as ToolType, icon: Type },
  { id: '03', name: 'Compressão H.265', type: 'Compress' as ToolType, icon: Minimize2 },
  { id: '04', name: 'Conversão MKV', type: 'Convert' as ToolType, icon: RefreshCw },
  { id: '05', name: 'Mastering Áudio', type: 'Audio' as ToolType, icon: Volume2 },
  { id: '16', name: 'Video Enhancer', type: 'Enhancer' as ToolType, icon: Sparkles },
];

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [activeJobs, setActiveJobs] = useState<VideoJob[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolType>('Enhancer');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [config, setConfig] = useState({ sharpen: 85, denoise: 42, contrast: 68 });
  const [logs, setLogs] = useState<{msg: string, type: 'info' | 'warn' | 'error' | 'success'}[]>([
    { msg: "Worker node connected (PID: 28312)", type: 'info' },
    { msg: "Analyzing bitstream... [H.264 High Profile]", type: 'info' }
  ]);
  const consoleRef = useRef<HTMLDivElement>(null);

  const selectedJob = activeJobs.find(j => j.id === selectedJobId);

  const addLog = (msg: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    setLogs(prev => [...prev.slice(-40), { msg, type }]);
  };

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  const handleDownload = (job: VideoJob) => {
    alert(`Iniciando download do arquivo processado: ${job.name}`);
    // No ambiente real: window.open(job.outputUrl, '_blank');
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setActiveJobs([]);
      return;
    }

    const path = 'video_jobs';
    const q = query(
      collection(db, path), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobs: VideoJob[] = [];
      snapshot.forEach((doc) => {
        jobs.push({ id: doc.id, ...doc.data() } as VideoJob);
      });
      setActiveJobs(jobs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [user]);

  const handleUpload = useCallback(async (file: File) => {
    if (!user) {
      signInWithGoogle();
      return;
    }

    const formData = new FormData();
    formData.append('video', file);

    try {
      // 1. Register job in Firestore
      const path = 'video_jobs';
      const docRef = await addDoc(collection(db, path), {
        userId: user.uid,
        name: file.name,
        tool: selectedTool,
        progress: 0,
        status: 'queued',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, path);
        throw err;
      });

      // 2. Mock upload actual file (local simulation for UI purposes)
      setTimeout(async () => {
         // Simulate processing
         const jobRef = doc(db, 'video_jobs', docRef.id);
         let progress = 0;
         const interval = setInterval(async () => {
           progress += Math.random() * 15;
           if (progress >= 100) {
             progress = 100;
             await updateDoc(jobRef, {
               progress: 100,
               status: 'completed',
               updatedAt: serverTimestamp(),
               outputUrl: `https://example.com/output/${docRef.id}.mp4`
             });
             clearInterval(interval);
           } else {
             await updateDoc(jobRef, {
               progress: Math.floor(progress),
               status: 'processing',
               updatedAt: serverTimestamp()
             });
           }
         }, 1000);
      }, 1000);
      
      addLog(`Upload simulado concluído: ${file.name}. Iniciando pipeline.`, 'success');
    } catch (error) {
      addLog(`Falha crítica no upload: ${file.name}`, 'error');
      console.error("Upload failed", error);
    }
  }, [selectedTool, user, config]);

  const handleRetry = async (job: VideoJob) => {
    const path = 'video_jobs';
    try {
      const jobRef = doc(db, path, job.id);
      await updateDoc(jobRef, {
        status: 'queued',
        progress: 0,
        updatedAt: serverTimestamp()
      }).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, path);
        throw err;
      });

      // Simulate retry processing locally
      setTimeout(async () => {
         let progress = 0;
         const interval = setInterval(async () => {
           progress += Math.random() * 15;
           if (progress >= 100) {
             progress = 100;
             await updateDoc(jobRef, {
               progress: 100,
               status: 'completed',
               updatedAt: serverTimestamp(),
               outputUrl: `https://example.com/output/${job.id}.mp4`
             });
             clearInterval(interval);
           } else {
             await updateDoc(jobRef, {
               progress: Math.floor(progress),
               status: 'processing',
               updatedAt: serverTimestamp()
             });
           }
         }, 1000);
      }, 1000);
    } catch (error) {
      console.error("Retry failed", error);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) handleUpload(file);
  };

  if (!user) {
    return (
      <div className="flex flex-col h-screen bg-[#050505] text-white items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Animated Background Layers */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 blur-[150px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 blur-[150px] animate-pulse delay-700" />
        </div>

        <div className="relative z-10 max-w-lg">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mb-8 rotate-45 mx-auto shadow-[0_0_50px_rgba(37,99,235,0.4)]"
          >
            <Sparkles className="w-10 h-10 -rotate-45" />
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-8xl font-black tracking-tighter mb-4 italic leading-[0.8]"
          >
            SMARTVEX <br/>
            <span className="text-blue-500 font-serif font-light not-italic text-5xl md:text-7xl opacity-80">CORE_ENGINE</span>
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-500 text-lg mb-12 font-medium leading-relaxed max-w-sm mx-auto"
          >
            Industrial-grade video processing. <br/>
            Optimized for <span className="text-white border-b border-blue-500/50">perfectionists</span>.
          </motion.p>
          
          <motion.button 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={signInWithGoogle}
            className="w-full px-8 py-4 bg-white text-black rounded-2xl font-black hover:bg-gray-200 transition-all flex items-center justify-center gap-4 text-lg shadow-2xl shadow-white/10"
          >
            <LogIn className="w-6 h-6" /> INICIAR COM GOOGLE
          </motion.button>
          
          <div className="mt-12 flex items-center justify-center gap-8 opacity-20 font-mono text-[10px] tracking-widest grayscale">
            <span>XEON® GOLD</span>
            <span>FFMPEG V6</span>
            <span>REDIS CLUSTER</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-gray-400 font-sans overflow-hidden select-none">
      {/* Header Navigation */}
      <nav className="h-14 border-b border-white/5 bg-black px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rotate-45"></div>
          </div>
          <span className="text-white font-bold tracking-tighter text-xl leading-none">
            SMARTVEX <span className="text-blue-500 font-normal ml-1">CORE</span>
          </span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
            <span>FASTAPI: ONLINE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
            <span>REDIS: ACTIVE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span>CELERY: 48 THREADS (XEON®)</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-white text-[11px] font-bold leading-none">{user.displayName}</span>
            <span className="text-[9px] text-gray-500 font-mono tracking-tighter">PLAN: ENTERPRISE</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
            <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-rose-500 transition-all"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <div className="flex grow overflow-hidden">
        {/* Side Rail */}
        <aside className="w-16 border-r border-white/5 flex flex-col items-center py-8 gap-10 shrink-0">
          <div className="text-white cursor-pointer hover:text-blue-500 transition-colors">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div className="opacity-40 hover:opacity-100 cursor-pointer hover:text-blue-500 transition-colors">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div className="opacity-40 hover:opacity-100 cursor-pointer hover:text-blue-500 transition-colors">
            <Terminal className="w-6 h-6" />
          </div>
          <div className="mt-auto mb-4 opacity-20 hover:opacity-100 cursor-pointer transition-colors">
            <Settings className="w-6 h-6" />
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 p-6 flex flex-col gap-6 overflow-hidden">
          {/* Tools Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 border border-white/5 divide-x divide-white/5 shrink-0 rounded-lg overflow-hidden">
            {tools.map((tool) => (
              <div
                key={tool.type}
                onClick={() => setSelectedTool(tool.type)}
                className={`p-5 transition-all cursor-pointer group relative ${
                  selectedTool === tool.type 
                    ? 'bg-blue-600/5 ring-1 ring-inset ring-blue-500/20' 
                    : 'bg-[#0a0a0a] hover:bg-white/[0.02]'
                }`}
              >
                <div className={`text-[9px] font-mono mb-3 tracking-tighter ${selectedTool === tool.type ? 'text-blue-400' : 'opacity-40'}`}>
                  REF_{tool.id} {selectedTool === tool.type && '• ONLINE'}
                </div>
                <div className={`font-mono text-[11px] uppercase tracking-widest transition-colors ${selectedTool === tool.type ? 'text-white' : 'text-gray-400'}`}>
                  {tool.name}
                </div>
                {selectedTool === tool.type && (
                  <motion.div layoutId="tool-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
                )}
              </div>
            ))}
          </div>

          <div className="flex grow gap-6 overflow-hidden">
            {/* Action Panel */}
            <div className="flex-[3] flex flex-col gap-6 overflow-hidden">
              {/* Drop Zone */}
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={`grow border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-6 transition-all relative overflow-hidden group ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-500/5' 
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.03] hover:border-white/20'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center border transition-all ${
                  isDragging ? 'bg-blue-600 border-blue-400 scale-110 shadow-[0_0_40px_rgba(37,99,235,0.3)]' : 'bg-white/5 border-white/10'
                }`}>
                  <Upload className={`w-8 h-8 ${isDragging ? 'text-white' : 'text-blue-500'}`} />
                </div>
                <div className="text-center z-10">
                  <h3 className="text-white text-lg font-semibold mb-1">
                    {isDragging ? 'Drop raw footage here' : `Drag video to ${selectedTool}`}
                  </h3>
                  <p className="text-sm opacity-50 font-mono">PRORES, MP4, MOV UP TO 10GB</p>
                </div>
                
                <input 
                  type="file" 
                  id="file-upload-main" 
                  className="hidden" 
                  accept="video/*" 
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
                <label 
                  htmlFor="file-upload-main"
                  className="mt-4 px-6 py-2 bg-[#111] border border-white/10 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                >
                  SELECT MANUALLY
                </label>
              </div>

              {/* Pipeline Config */}
              <div className="h-60 bg-[#0a0a0a] border border-white/10 rounded-xl p-6 shrink-0 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
                
                <h4 className="font-serif italic text-xs mb-6 text-gray-500 flex justify-between items-center group">
                  <span className="flex items-center gap-2">
                    <Settings className="w-3 h-3 text-blue-500" />
                    FFMPEG Hardware Pipeline
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.3em] opacity-30 group-hover:opacity-100 transition-opacity">
                    Mode: {selectedTool}
                  </span>
                </h4>

                <div className="grid grid-cols-3 gap-8 mb-6">
                  {[
                    { label: 'Sharpen (Unsharp)', key: 'sharpen' as const },
                    { label: 'Denoise (HQDN3D)', key: 'denoise' as const },
                    { label: 'Luma Contrast', key: 'contrast' as const }
                  ].map((param) => (
                    <div key={param.key} className="space-y-4">
                      <div className="flex justify-between text-[10px] font-mono uppercase tracking-tighter">
                        <span className="opacity-40">{param.label}</span>
                        <span className="text-blue-400">{config[param.key]}%</span>
                      </div>
                      <div className="relative h-6 flex items-center">
                        <div className="absolute w-full h-[1px] bg-white/10"></div>
                        <input 
                          type="range" 
                          min="0" max="100" 
                          value={config[param.key]}
                          onChange={(e) => setConfig(prev => ({...prev, [param.key]: parseInt(e.target.value)}))}
                          className="w-full h-1 bg-transparent appearance-none accent-blue-500 cursor-pointer z-10 
                                     [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-white"
                        />
                        <div className="absolute h-full w-[1px] bg-white/10 left-1/2 -translate-x-1/2 pointer-events-none"></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto flex justify-between items-center bg-black/40 p-3 border border-white/5 rounded-lg font-mono text-[10px]">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_blue]"></div>
                      NODE: <span className="text-white">XEON_GOLD_V6</span>
                    </span>
                    <span className="opacity-20">|</span>
                    <span className="text-gray-600">ID: {Math.random().toString(16).slice(2, 8).toUpperCase()}</span>
                  </div>
                  
                  <div className="flex gap-3 h-9">
                    <button 
                      onClick={() => setConfig({sharpen: 85, denoise: 42, contrast: 68})}
                      className="px-4 border border-white/10 text-[9px] text-gray-500 rounded hover:bg-white/5 uppercase font-bold tracking-widest transition-all"
                    >
                      Reset
                    </button>
                    <button 
                      onClick={() => {
                        addLog(`Ajustando parâmetros do pipeline: ${selectedTool}`, 'success');
                      }}
                      className="px-6 bg-blue-600 text-white rounded font-black hover:bg-blue-500 transition-all text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-900/20"
                    >
                      <Play className="w-3 h-3 fill-current" /> Execute Pipeline
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Queue Monitor */}
            <div className="flex-[2] bg-[#070707] border border-white/10 rounded-xl flex flex-col overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-white/10 bg-white/[0.02] flex justify-between items-center shrink-0">
                <span className="font-serif italic text-xs text-gray-500">Processing Queue</span>
                <span className="px-2 py-0.5 bg-blue-600 font-mono text-white text-[9px] rounded uppercase tracking-tighter">
                  {(activeJobs || []).filter(j => j?.status !== 'completed').length} Active
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto font-mono p-1 scrollbar-hide space-y-1">
                {(!activeJobs || activeJobs.length === 0) ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center opacity-10 h-full grayscale">
                    <Terminal className="w-20 h-20 mb-4" />
                    <p className="text-[10px] uppercase tracking-[0.5em]">System Idle</p>
                  </div>
                ) : (
                  activeJobs.map((job, i) => (
                    <motion.div 
                      key={job.id} 
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedJobId(job.id)}
                      className={`p-5 border-b border-white/5 transition-all cursor-pointer relative overflow-hidden ${
                        selectedJobId === job.id ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      {selectedJobId === job.id && (
                        <div className="absolute top-0 left-0 bottom-0 w-1 bg-blue-500"></div>
                      )}
                      
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[11px] font-bold uppercase tracking-tight truncate max-w-[150px] ${selectedJobId === job.id ? 'text-blue-400' : 'text-gray-300'}`}>
                          {job.name}
                        </span>
                        <div className={`p-1 rounded-sm ${
                          job.status === 'completed' ? 'bg-gray-500/10' : 
                          job.status === 'processing' ? 'bg-green-500/10' : 
                          job.status === 'failed' ? 'bg-rose-500/10' : 'bg-blue-500/10'
                        }`}>
                          <div className={`w-1 h-1 rounded-full ${
                             job.status === 'completed' ? 'bg-gray-500' : 
                             job.status === 'processing' ? 'bg-green-500 animate-pulse' : 
                             job.status === 'failed' ? 'bg-rose-500' : 'bg-blue-500 animate-ping'
                          }`}></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 text-[8px] opacity-30 uppercase font-bold">
                          <span>{job.id?.substr(0, 8)}</span>
                          <span>•</span>
                          <span className="text-blue-500">{job.tool}</span>
                        </div>
                        <div className="flex gap-2">
                          {job.status === 'failed' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleRetry(job); }}
                              className="text-[9px] font-black text-rose-500 hover:text-white border border-rose-500/20 hover:bg-rose-500 px-2 py-0.5 rounded transition-all"
                            >
                              RETRY
                            </button>
                          )}
                          {job.status === 'completed' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDownload(job); }}
                              className="text-[9px] font-black text-emerald-500 hover:text-white border border-emerald-500/20 hover:bg-emerald-500 px-2 py-0.5 rounded transition-all"
                            >
                              DL
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="grow h-[2px] bg-white/5 relative overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${job.progress}%` }}
                            className={`h-full absolute left-0 top-0 ${
                              job.status === 'completed' ? 'bg-gray-600' : 
                              job.status === 'failed' ? 'bg-rose-600' : 'bg-blue-600'
                            }`} 
                          />
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-bold">
                          <span className={job.status === 'failed' ? 'text-rose-500' : 'opacity-20'}>
                            {job.status.toUpperCase()}
                          </span>
                          <span className={`${job.status === 'completed' ? 'text-gray-500' : 'text-white'}`}>
                            {job.progress}%
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Console Bar */}
              <div ref={consoleRef} className="h-32 bg-black/80 p-4 font-mono text-[9px] overflow-y-auto border-t border-white/10 scrollbar-hide space-y-1.5">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-3 group">
                    <span className="text-gray-700 shrink-0 tabular-nums">[{new Date().toLocaleTimeString('pt-BR')}]</span> 
                    <span className={`
                      ${log.type === 'error' ? 'text-rose-500' : ''}
                      ${log.type === 'success' ? 'text-emerald-500' : ''}
                      ${log.type === 'warn' ? 'text-amber-500' : ''}
                      ${log.type === 'info' ? 'text-blue-400 opacity-60' : ''}
                    `}>
                      <span className="font-bold mr-2">[{log.type.toUpperCase()}]</span>
                      {log.msg}
                    </span>
                  </div>
                ))}
                {activeJobs.some(j => j.status === 'processing') && (
                  <div className="text-white/40 mt-2 flex justify-between border-t border-white/5 pt-2">
                    <span>FRAME: {Math.floor(Math.random() * 1000)}</span>
                    <span>FPS: 24.2</span>
                    <span>BITRATE: 4521K</span>
                  </div>
                )}
                <div className="inline-block w-2 h-3 bg-blue-500/40 animate-pulse ml-1"></div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Status Footer */}
      <footer className="h-8 bg-black border-t border-white/5 px-6 flex items-center justify-between text-[9px] font-mono opacity-50 uppercase tracking-[0.2em] shrink-0">
        <div className="flex gap-8">
          <div className="flex items-center gap-2">
            <span className="text-blue-500">ROOT:</span> /var/lib/smartvex/cache
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-500">FFMPEG:</span> v6.1-STATIC
          </div>
        </div>
        <div className="flex gap-8">
          <div className="flex items-center gap-2">
            <span className="text-blue-500">ENHANCER_MODEL:</span> GFPGAN_V1.4
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-500">DB:</span> POSTGRESQL 16
          </div>
        </div>
      </footer>
    </div>
  );
}
