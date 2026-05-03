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
    <div className="flex-[2] flex flex-col gap-6 overflow-hidden">
      {/* Jobs Panel */}
      <div className="glass-panel rounded-2xl flex flex-col overflow-hidden h-[60%] shadow-2xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0 bg-black/40">
          <h3 className="font-display font-bold text-sm tracking-widest uppercase flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.5)]"></span>
            Queue Monitor
          </h3>
          <span className="text-[10px] font-mono text-white/20">
            ACTIVE_SESSIONS: {jobs.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
          <AnimatePresence initial={false}>
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-20 group">
                <div className="relative mb-6">
                  <TerminalIcon className="w-24 h-24 mb-4 group-hover:text-purple-500 transition-colors" />
                  <div className="absolute inset-0 bg-purple-500/10 blur-3xl rounded-full"></div>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-[1em] mb-4">Aguardando Input...</span>
                <p className="text-[11px] max-w-[200px] leading-relaxed">
                  Utilize o painel ao lado para importar seu primeiro vídeo e ver a mágica acontecer.
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
                  className={`p-5 rounded-xl border transition-all cursor-pointer relative group ${
                    selectedJobId === job.id 
                      ? 'bg-purple-600/10 border-purple-500/30 shadow-lg shadow-purple-500/5' 
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="grow min-w-0 pr-4">
                      <div className={`text-[11px] font-bold truncate ${selectedJobId === job.id ? 'text-purple-400' : 'text-white'}`}>
                        {job.name}
                      </div>
                      <div className="flex items-center gap-3 text-[8px] font-mono mt-1.5 opacity-40 uppercase tracking-tighter">
                        <span className="text-purple-500 font-bold">{job.tool}</span>
                        <span>•</span>
                        <span>{job.id.substr(0, 8)}</span>
                      </div>
                    </div>
                    
                    <div className="shrink-0 flex gap-2">
                      {job.status === 'completed' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDownload(job); }}
                          className="p-1.5 bg-green-500/10 text-green-500 rounded-lg border border-green-500/20 hover:bg-green-500 hover:text-white transition-all shadow-lg shadow-green-500/10"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {job.status === 'failed' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onRetry(job); }}
                          className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/10"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {job.status === 'processing' && (
                        <div className="p-1.5 bg-purple-500/10 text-purple-500 rounded-lg animate-spin">
                          <Loader2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative pt-2">
                    <div className="flex justify-between text-[10px] font-mono mb-2">
                      <span className={`uppercase font-black ${
                        job.status === 'completed' ? 'text-green-500' : 
                        job.status === 'failed' ? 'text-rose-500' : 
                        job.status === 'processing' ? 'text-purple-400' : 'text-gray-600'
                      }`}>
                        {job.status}
                      </span>
                      <span className="text-white/60 font-bold">{job.progress}%</span>
                    </div>
                    <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${job.progress}%` }}
                        className={`h-full ${
                          job.status === 'completed' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 
                          job.status === 'failed' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 
                          'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                        }`}
                      />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Terminal Logs */}
      <div className="glass-panel rounded-2xl flex flex-col overflow-hidden h-[40%] bg-black/20">
        <div className="p-4 border-b border-white/5 bg-black/60 sticky top-0 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <TerminalIcon className="w-3 h-3 text-purple-500" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-white/60">SMARTVEX_CORE_OUTPUT</span>
          </div>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500/30"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/30"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500/30"></div>
          </div>
        </div>
        <div ref={terminalRef} className="flex-1 p-6 font-mono text-[9px] space-y-2.5 overflow-y-auto scroll-smooth bg-[#020202]">
          {logs.map((log, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={i} 
              className="flex gap-4 group"
            >
              <span className="text-gray-800 shrink-0 tabular-nums">[{new Date().toLocaleTimeString('pt-BR')}]</span>
              <span className={`
                ${log.type === 'error' ? 'text-rose-500 font-bold' : ''}
                ${log.type === 'success' ? 'text-green-500 font-bold' : ''}
                ${log.type === 'warn' ? 'text-amber-500' : ''}
                ${log.type === 'info' ? 'text-purple-400 opacity-80' : ''}
              `}>
                <span className="opacity-40 mr-2 uppercase tracking-tighter">[{log.type}]</span>
                {log.msg}
              </span>
            </motion.div>
          ))}
          <div className="inline-block w-2.5 h-4 bg-purple-500/40 animate-pulse ml-2" />
        </div>
      </div>
    </div>
  );
}
