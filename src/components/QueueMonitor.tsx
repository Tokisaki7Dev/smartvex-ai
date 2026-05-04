'use client';
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
    <div className="flex-1 flex flex-col overflow-hidden bg-black/40 backdrop-blur-3xl">
      {/* Jobs Panel */}
      <div className="flex flex-col overflow-hidden h-[65%] border-b border-white/5">
        <div className="p-8 pb-4 flex justify-between items-center shrink-0">
          <h3 className="font-display font-black text-[10px] tracking-[0.4em] uppercase flex items-center gap-3 text-pink-500">
            <span className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.8)] animate-pulse" />
            Ativos no Cache
          </h3>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
             <span className="text-[8px] font-mono text-gray-600 uppercase font-black">Node: <span className="text-white">NEXUS-01</span></span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <AnimatePresence initial={false}>
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-40">
                <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center mb-6 text-gray-800">
                  <FileVideo className="w-8 h-8" />
                </div>
                <span className="text-[9px] font-mono uppercase tracking-[0.5em] mb-2 text-gray-700 font-bold">Vault_Vazio</span>
                <p className="text-[10px] max-w-[170px] leading-relaxed font-mono text-gray-600 uppercase tracking-widest">Nenhum ativo detectado no cache local</p>
              </div>
            ) : (
              jobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onSelectJob(job.id)}
                  className={`p-6 rounded-[2rem] border transition-all cursor-pointer relative group overflow-hidden ${
                    selectedJobId === job.id 
                      ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-pink-500/40 shadow-2xl scale-[1.02]' 
                      : 'bg-white/[0.02] border-white/[0.03] hover:border-white/10 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-5 relative z-10">
                    <div className="grow min-w-0 pr-4">
                      <div className={`text-xs font-black truncate tracking-tighter transition-colors uppercase italic ${selectedJobId === job.id ? 'text-white' : 'text-gray-400'}`}>
                        {job.name}
                      </div>
                      <div className="flex items-center gap-3 text-[9px] font-mono mt-2 uppercase font-black tracking-widest">
                        <span className="text-pink-500">{job.tool}</span>
                        <div className="w-1 h-1 bg-white/10 rounded-full" />
                        <span className="text-gray-700">{job.status}</span>
                      </div>
                    </div>
                    
                    <div className={`shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center border transition-all shadow-lg ${
                        job.status === 'completed' ? 'bg-green-500 text-white border-green-500' :
                        job.status === 'failed' ? 'bg-rose-500 text-white border-rose-500' :
                        'bg-white/5 border-white/10 text-pink-500'
                    }`}>
                       {job.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                       {job.status === 'failed' && <AlertCircle className="w-4 h-4" />}
                       {job.status === 'processing' && <Loader2 className="w-4 h-4 animate-spin" />}
                       {job.status === 'queued' && <History className="w-4 h-4 opacity-50" />}
                    </div>
                  </div>

                  <div className="relative z-10">
                    <div className="flex justify-between text-[10px] font-mono mb-2 uppercase font-black text-gray-500">
                      <span>Progress</span>
                      <span>{job.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden p-[2px]">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${job.progress}%` }}
                        className={`h-full rounded-full shadow-[0_0_10px_currentColor] ${
                          job.status === 'completed' ? 'bg-green-500' : 
                          job.status === 'failed' ? 'bg-rose-500' : 
                          'bg-gradient-to-r from-purple-500 to-pink-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all flex gap-2 z-20">
                      {job.status === 'completed' && (
                        <button onClick={(e) => { e.stopPropagation(); onDownload(job); }} className="w-9 h-9 bg-white text-black rounded-xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all">
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      {job.status === 'failed' && (
                        <button onClick={(e) => { e.stopPropagation(); onRetry(job); }} className="w-9 h-9 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all">
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
      <div className="flex flex-col overflow-hidden h-[35%] bg-black/40 backdrop-blur-3xl">
        <div className="px-10 py-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-black/60 backdrop-blur-xl z-20">
          <div className="flex items-center gap-4">
            <div className="p-1.5 bg-pink-500/10 rounded-lg">
               <TerminalIcon className="w-3.5 h-3.5 text-pink-500" />
            </div>
            <span className="text-[10px] font-mono font-black tracking-[0.4em] text-gray-500 uppercase">Pipeline Logs</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping opacity-50" />
             <span className="text-[8px] font-mono text-pink-500 uppercase font-black">Live</span>
          </div>
        </div>
        <div ref={terminalRef} className="flex-1 p-10 font-mono text-[10px] space-y-4 overflow-y-auto custom-scrollbar scroll-smooth leading-relaxed">
           {logs.map((log, i) => (
             <div key={i} className="flex gap-6 group hover:bg-white/[0.02] p-2 rounded-lg transition-colors">
                <span className="text-gray-800 shrink-0 font-black">[{new Date().toLocaleTimeString()}]</span>
                <span className={`tracking-widest uppercase font-bold text-[9px] ${
                  log.type === 'error' ? 'text-rose-500' :
                  log.type === 'success' ? 'text-green-500' :
                  log.type === 'warn' ? 'text-yellow-500' : 'text-gray-500'
                }`}>{log.msg}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
