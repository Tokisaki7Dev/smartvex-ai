import { 
  Terminal as TerminalIcon, 
  Download, 
  RotateCw, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  FileVideo, 
  BarChart3, 
  History 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { VideoJob } from "../types";
import { useEffect, useRef } from "react";

export function QueueMonitor({ 
  jobs, 
  logs, 
  selectedJobId, 
  onSelectJob,
  onRetry,
  onDownload
}: { 
  jobs: VideoJob[], 
  logs: any[],
  selectedJobId: string | null,
  onSelectJob: (id: string) => void,
  onRetry: (job: VideoJob) => void,
  onDownload: (job: VideoJob) => void
}) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-black">
      {/* Jobs Panel */}
      <div className="flex flex-col overflow-hidden h-[65%] border-b border-white/5">
        <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0 bg-black">
          <h3 className="font-display font-black text-[10px] tracking-[0.3em] uppercase flex items-center gap-3 text-purple-400">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]"></span>
            Gerenciador de Ativos
          </h3>
          <div className="flex items-center gap-2 px-2 py-0.5 bg-white/5 rounded border border-white/10">
             <span className="text-[8px] font-mono text-gray-500 uppercase">Armazenamento: <span className="text-white">Ativo</span></span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[#050505]">
          <AnimatePresence initial={false}>
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center mb-6 text-gray-800">
                  <FileVideo className="w-8 h-8 opacity-20" />
                </div>
                <span className="text-[9px] font-mono uppercase tracking-[0.4em] mb-2 text-gray-700">Cofre_Vazio</span>
                <p className="text-[10px] max-w-[170px] leading-relaxed font-mono text-gray-600">
                  Nenhum ativo detectado no cluster Xeon v4.2
                </p>
              </div>
            ) : (
              jobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ x: 10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onSelectJob(job.id)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer relative group overflow-hidden ${
                    selectedJobId === job.id 
                      ? 'bg-purple-600/10 border-purple-500/40 shadow-[0_0_40px_rgba(168,85,247,0.05)]' 
                      : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="grow min-w-0 pr-4">
                      <div className={`text-xs font-bold truncate tracking-tight transition-colors ${selectedJobId === job.id ? 'text-white' : 'text-gray-400'}`}>
                        {job.name}
                      </div>
                      <div className="flex items-center gap-3 text-[9px] font-mono mt-1.5 uppercase font-medium">
                        <span className="text-purple-400">{job.tool}</span>
                        <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                        <span className="text-gray-600">Restante estimado: 2.4m</span>
                      </div>
                    </div>
                    
                    <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
                        job.status === 'completed' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                        job.status === 'failed' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                        'bg-purple-500/10 border-purple-500/20 text-purple-400'
                    }`}>
                       {job.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                       {job.status === 'failed' && <AlertCircle className="w-4 h-4" />}
                       {job.status === 'processing' && <Loader2 className="w-4 h-4 animate-spin" />}
                       {job.status === 'queued' && <History className="w-4 h-4 opacity-50" />}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="flex justify-between text-[9px] font-mono mb-2 uppercase font-black">
                      <span className={`${
                        job.status === 'completed' ? 'text-green-500' : 
                        job.status === 'failed' ? 'text-rose-500' : 
                        job.status === 'processing' ? 'text-purple-400' : 'text-gray-700'
                      }`}>
                        {job.status}
                      </span>
                      <span className="text-white/30">{job.progress}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${job.progress}%` }}
                        className={`h-full ${
                          job.status === 'completed' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 
                          job.status === 'failed' ? 'bg-rose-500' : 
                          'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* VIRAL SCORE BADGE - ONLY COMPLETED */}
                  {job.status === 'completed' && (
                    <div className="mt-4 flex items-center justify-between">
                       <div className="flex -space-x-2">
                          {[1,2,3].map(i => (
                            <div key={i} className="w-5 h-5 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center text-[7px] text-white">
                               <BarChart3 className="w-2 h-2" />
                            </div>
                          ))}
                       </div>
                       <div className="flex items-center gap-1 text-[8px] font-mono text-gray-500">
                          <Download className="w-2 h-2" /> 23 downloads
                       </div>
                    </div>
                  )}

                  {/* Actions Overlays */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      {job.status === 'completed' && (
                        <button onClick={(e) => { e.stopPropagation(); onDownload(job); }} className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all">
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      {job.status === 'failed' && (
                        <button onClick={(e) => { e.stopPropagation(); onRetry(job); }} className="w-8 h-8 bg-rose-500 text-white rounded-lg flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all">
                          <RotateCw className="w-4 h-4" />
                        </button>
                      )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Terminal Logs */}
      <div className="flex flex-col overflow-hidden h-[35%] bg-black">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-black z-10">
          <div className="flex items-center gap-3">
            <TerminalIcon className="w-3 h-3 text-purple-500" />
            <span className="text-[9px] font-mono font-bold tracking-[0.3em] text-gray-600 uppercase">Logs de Processamento</span>
          </div>
          <div className="flex gap-1.5 opacity-20">
            <div className="w-1 h-1 rounded-full bg-purple-500 animate-ping"></div>
          </div>
        </div>
        <div ref={terminalRef} className="flex-1 p-6 font-mono text-[9px] space-y-3 overflow-y-auto custom-scrollbar scroll-smooth leading-loose">
          {logs.map((log, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              key={i} 
              className="flex gap-4 group/log"
            >
              <span className="text-white/10 shrink-0 tabular-nums">[{new Date().toLocaleTimeString('pt-BR', { hour12: false })}]</span>
              <span className={`
                ${log.type === 'error' ? 'text-rose-500/90 font-bold' : ''}
                ${log.type === 'success' ? 'text-green-500/90 font-bold' : ''}
                ${log.type === 'warn' ? 'text-amber-500/90 font-bold' : ''}
                ${log.type === 'info' ? 'text-purple-400/80' : ''}
              `}>
                <span className="opacity-30 mr-2 lowercase tracking-tighter">idx:{(i+1).toString().padStart(3,'0')}</span>
                {log.msg}
              </span>
            </motion.div>
          ))}
          <div className="inline-block w-1.5 h-3 bg-purple-500/30 animate-pulse ml-2" />
        </div>
      </div>
    </div>
  );
}
