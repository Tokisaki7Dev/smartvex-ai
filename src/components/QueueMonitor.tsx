import { Terminal as TerminalIcon, Download, RotateCw, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
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
    <div className="flex-1 flex flex-col overflow-hidden bg-[#050505]">
      {/* Jobs Panel */}
      <div className="flex flex-col overflow-hidden h-[60%] border-b border-white/5">
        <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0 bg-black/40">
          <h3 className="font-display font-black text-[10px] tracking-[0.3em] uppercase flex items-center gap-3 text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
            Tasks Pipeline
          </h3>
          <span className="text-[9px] font-mono text-purple-500/40 font-bold uppercase tracking-widest">
             Cluster_Load: {((jobs.filter(j => j.status === 'processing').length / 16) * 100).toFixed(1)}%
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          <AnimatePresence initial={false}>
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-20 filter grayscale">
                <TerminalIcon className="w-12 h-12 mb-6 text-gray-500" />
                <span className="text-[9px] font-mono uppercase tracking-[0.6em] mb-2">Idle_State</span>
                <p className="text-[10px] max-w-[160px] leading-relaxed font-mono">
                  Aguardando recepção de binários...
                </p>
              </div>
            ) : (
              jobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onSelectJob(job.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                    selectedJobId === job.id 
                      ? 'bg-purple-600/10 border-purple-500/30 shadow-lg' 
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="grow min-w-0 pr-4">
                      <div className={`text-[10px] font-bold truncate uppercase tracking-wider ${selectedJobId === job.id ? 'text-purple-400' : 'text-white'}`}>
                        {job.name}
                      </div>
                      <div className="flex items-center gap-3 text-[8px] font-mono mt-1 opacity-50 uppercase tracking-tighter">
                        <span className="text-purple-400 font-black">{job.tool}</span>
                        <span className="text-white/20">•</span>
                        <span>{job.id.substr(0, 10)}</span>
                      </div>
                    </div>
                    
                    <div className="shrink-0 flex gap-2">
                       {/* Icon based on status */}
                       {job.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                       {job.status === 'failed' && <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
                       {job.status === 'processing' && <Loader2 className="w-3.5 h-3.5 text-purple-500 animate-spin" />}
                    </div>
                  </div>

                  <div className="relative pt-2">
                    <div className="flex justify-between text-[8px] font-mono mb-1.5 uppercase tracking-widest font-bold">
                      <span className={`${
                        job.status === 'completed' ? 'text-green-500' : 
                        job.status === 'failed' ? 'text-rose-500' : 
                        job.status === 'processing' ? 'text-purple-400 animate-pulse' : 'text-gray-600'
                      }`}>
                        {job.status}
                      </span>
                      <span className="text-white/40">{job.progress}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${job.progress}%` }}
                        className={`h-full ${
                          job.status === 'completed' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 
                          job.status === 'failed' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 
                          'bg-gradient-to-r from-purple-600 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-black/60 backdrop-blur-md rounded-lg p-1 border border-white/10">
                      {job.status === 'completed' && (
                        <button onClick={(e) => { e.stopPropagation(); onDownload(job); }} className="p-1 hover:bg-white/10 rounded transition-colors">
                          <Download className="w-3 h-3 text-white" />
                        </button>
                      )}
                      {job.status === 'failed' && (
                        <button onClick={(e) => { e.stopPropagation(); onRetry(job); }} className="p-1 hover:bg-white/10 rounded transition-colors">
                          <RotateCw className="w-3 h-3 text-white" />
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
      <div className="flex flex-col overflow-hidden h-[40%] bg-[#020202]">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#020202]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <TerminalIcon className="w-3 h-3 text-purple-500" />
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-gray-500 uppercase">Engine_Console</span>
          </div>
          <div className="flex gap-1.5 opacity-30">
            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
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
