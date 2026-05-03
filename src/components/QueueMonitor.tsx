import React, { useEffect, useRef } from "react";
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

interface QueueMonitorProps {
  jobs: VideoJob[];
  logs: {msg: string, type: string}[];
  selectedJobId: string | null;
  onSelectJob: (id: string) => void;
  onDownload: (job: VideoJob) => void;
  onRetry: (job: VideoJob) => void;
}

export function QueueMonitor({ jobs, logs, selectedJobId, onSelectJob, onDownload, onRetry }: QueueMonitorProps) {
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
        <div className="p-8 pb-4 flex justify-between items-center shrink-0">
          <h3 className="font-display font-black text-[10px] tracking-[0.3em] uppercase flex items-center gap-3 text-purple-400">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
            Ativos no Cache
          </h3>
          <div className="flex items-center gap-2 px-2 py-0.5 bg-white/5 rounded border border-white/10">
             <span className="text-[8px] font-mono text-gray-600 uppercase">Cluster: <span className="text-white">XEON-01</span></span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <AnimatePresence initial={false}>
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center mb-6 text-gray-800">
                  <FileVideo className="w-8 h-8 opacity-20" />
                </div>
                <span className="text-[9px] font-mono uppercase tracking-[0.4em] mb-2 text-gray-700">Vault_Vazio</span>
                <p className="text-[10px] max-w-[170px] leading-relaxed font-mono text-gray-600">Nenhum ativo detectado</p>
              </div>
            ) : (
              jobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ x: 10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onSelectJob(job.id)}
                  className={`p-6 rounded-3xl border transition-all cursor-pointer relative group overflow-hidden ${
                    selectedJobId === job.id 
                      ? 'bg-purple-600/10 border-purple-500/40 shadow-xl' 
                      : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="grow min-w-0 pr-4">
                      <div className={`text-xs font-black truncate tracking-tight transition-colors uppercase italic ${selectedJobId === job.id ? 'text-white' : 'text-gray-400'}`}>
                        {job.name}
                      </div>
                      <div className="flex items-center gap-3 text-[9px] font-mono mt-1.5 uppercase font-medium">
                        <span className="text-purple-400">{job.tool}</span>
                        <div className="w-1 h-1 bg-white/10 rounded-full" />
                        <span className="text-gray-700">{job.status}</span>
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
                      <span className="text-white/30">{job.progress}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${job.progress}%` }}
                        className={`h-full ${
                          job.status === 'completed' ? 'bg-green-500' : 
                          job.status === 'failed' ? 'bg-rose-500' : 
                          'bg-purple-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Actions */}
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
        <div className="px-8 py-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-black z-10">
          <div className="flex items-center gap-3">
            <TerminalIcon className="w-3 h-3 text-purple-600" />
            <span className="text-[9px] font-mono font-black tracking-[0.3em] text-gray-700 uppercase">Pipeline Logs</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-purple-500 animate-ping opacity-50" />
        </div>
        <div ref={terminalRef} className="flex-1 p-8 font-mono text-[9px] space-y-3 overflow-y-auto custom-scrollbar scroll-smooth leading-loose">
           {logs.map((log, i) => (
             <div key={i} className="flex gap-4">
                <span className="text-gray-800 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                <span className={
                  log.type === 'error' ? 'text-rose-500' :
                  log.type === 'success' ? 'text-green-500' :
                  log.type === 'warn' ? 'text-yellow-500' : 'text-gray-400'
                }>{log.msg}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
