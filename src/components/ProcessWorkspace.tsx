import { Play, FileVideo, CheckCircle2, AlertCircle, Loader2, DownloadCloud, History, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ToolType, TOOLS, VideoJob } from "../types";

export function ProcessWorkspace({ 
  selectedTool, 
  activeJob
}: { 
  selectedTool: ToolType, 
  activeJob?: VideoJob
}) {
  const toolDef = TOOLS.find(t => t.type === selectedTool);

  if (!activeJob) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10">
          <FileVideo className="w-10 h-10 text-gray-600" />
        </div>
        <h3 className="text-2xl font-display font-bold text-white mb-2 uppercase tracking-tighter italic">Nenhum Job Selecionado</h3>
        <p className="text-gray-500 text-xs font-mono max-w-xs">Importe um vídeo ou selecione uma tarefa no monitor lateral para visualizar o progresso.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col p-8 overflow-hidden">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-purple-400">
            {toolDef && <toolDef.icon className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-xl font-display font-black uppercase tracking-tight text-white">{activeJob.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] font-mono text-purple-500 font-bold uppercase tracking-widest">{activeJob.tool}</span>
              <span className="w-1 h-1 bg-white/20 rounded-full"></span>
              <span className="text-[10px] font-mono text-gray-500 uppercase">{activeJob.id.substring(0, 12)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeJob.status === 'completed' && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2.5 bg-white text-black rounded-xl font-bold text-xs flex items-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              <DownloadCloud className="w-4 h-4" /> Exportar Resultado
            </motion.button>
          )}
        </div>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-8">
        {/* VIEWPORT PRINCIPAL */}
        <div className="col-span-8 flex flex-col gap-6">
          <div className="flex-1 bg-[#050505] rounded-[2rem] border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.8)_0,transparent_100%)] z-10">
               {activeJob.status === 'processing' && (
                 <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                       <Loader2 className="w-16 h-16 text-purple-500 animate-spin" />
                       <div className="absolute inset-0 bg-purple-500/20 blur-2xl animate-pulse"></div>
                    </div>
                    <div className="text-center">
                       <div className="text-4xl font-display font-black text-white glow-text mb-2">{activeJob.progress}%</div>
                       <div className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em] font-bold">Processando Frames IA</div>
                    </div>
                 </div>
               )}

               {activeJob.status === 'completed' && (
                 <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                       <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-display font-bold text-white uppercase italic">Renderização Concluída</h3>
                      <p className="text-[10px] font-mono text-gray-500 mt-2 uppercase tracking-widest">Aguardando download do binário</p>
                    </div>
                 </div>
               )}

               {activeJob.status === 'failed' && (
                 <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/30">
                       <AlertCircle className="w-10 h-10 text-rose-500" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-display font-bold text-white uppercase italic">Erro no Cluster Xeon</h3>
                      <p className="text-[10px] font-mono text-rose-500/60 mt-2 uppercase tracking-widest">Verifique os logs para detalhes</p>
                    </div>
                 </div>
               )}

               {activeJob.status === 'queued' && (
                 <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10 animate-pulse">
                       <History className="w-10 h-10 text-gray-400" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-display font-bold text-white uppercase italic">Na Fila de Espera</h3>
                      <p className="text-[10px] font-mono text-gray-500 mt-2 uppercase tracking-widest">Alocando threads Xeon-Optimized...</p>
                    </div>
                 </div>
               )}
            </div>
            
            {/* GRID OVERLAY PARA LOOK TECH */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
          </div>

          <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${activeJob.progress}%` }}
              className={`h-full bg-gradient-to-r from-purple-600 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]`}
            />
          </div>
        </div>

        {/* SIDEBAR DE DETALHES DO WORKSPACE */}
        <div className="col-span-4 flex flex-col gap-6">
          <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 flex-1">
             <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-6">Metadata do Asset</h4>
             
             <div className="space-y-6">
                <DetailRow label="Tamanho Original" value={`${(Math.random()*500).toFixed(2)} MB`} />
                <DetailRow label="Codec Detectado" value="H.264 / AVC" />
                <DetailRow label="Resolução Alvo" value="1080x1920 (9:16)" />
                <DetailRow label="FPS Configurado" value="60 FPS" />
                <div className="h-px bg-white/5 my-4"></div>
                <DetailRow label="AI Pipeline" value={activeJob.tool} highlight />
                <DetailRow label="Xeon Cluster" value="Node v4.2-E" />
             </div>

             <div className="mt-12">
                <div className="flex items-center gap-2 text-[10px] font-mono text-purple-400 uppercase tracking-widest mb-4">
                  <Play className="w-3 h-3" /> Preview em Real-Time
                </div>
                <div className="aspect-video bg-black rounded-2xl border border-white/5 flex items-center justify-center group cursor-pointer relative overflow-hidden">
                   <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 text-white/50" />
                   </div>
                </div>
             </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-purple-600/10 to-pink-500/10 border border-purple-500/20 rounded-[2rem]">
             <p className="text-[9px] font-mono text-purple-400/80 leading-relaxed uppercase">
                Otimização heurística ativa. Os algoritmos de face tracking estão rodando sob demanda nos cores Xeon reservados.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-mono text-gray-600 uppercase">{label}</span>
      <span className={`text-[10px] font-mono font-bold ${highlight ? 'text-purple-400' : 'text-gray-300'}`}>{value}</span>
    </div>
  );
}
