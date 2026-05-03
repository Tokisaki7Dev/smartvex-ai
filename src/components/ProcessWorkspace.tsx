import { useState, useRef, useCallback, DragEvent } from "react";
import { Upload, Play, Settings as SettingsIcon, FileVideo, X, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ToolType, TOOLS } from "../types";

export function ProcessWorkspace({ 
  selectedTool, 
  onUpload 
}: { 
  selectedTool: ToolType, 
  onUpload: (file: File) => void 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [config, setConfig] = useState({ sharpen: 85, denoise: 42, contrast: 68 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toolDef = TOOLS.find(t => t.type === selectedTool);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      onUpload(file);
    }
  };

  return (
    <div className="flex-[3] flex flex-col gap-6 overflow-hidden">
      {/* Dynamic Hero Section */}
      <div className="bg-[#111] p-8 rounded-[2rem] border border-white/5 relative overflow-hidden shrink-0 flex flex-col justify-center">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-600/10 blur-[100px] pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-4 mb-2">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl text-white">
            {toolDef && <toolDef.icon className="w-6 h-6" />}
          </div>
          <h2 className="text-3xl font-display font-bold text-white">
            {toolDef?.name}
          </h2>
        </div>
        <p className="text-gray-400 text-sm max-w-xl relative z-10">
          {toolDef?.description} Solte seu arquivo longo abaixo para a inteligência artificial começar o trabalho de curadoria e edição automática.
        </p>
      </div>

      {/* Drop Zone */}
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`grow border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-8 transition-all relative overflow-hidden group ${
          isDragging 
            ? 'border-purple-500 bg-purple-500/5' 
            : 'border-white/5 bg-[#111] hover:bg-[#151515] hover:border-white/10'
        }`}
      >
        <AnimatePresence>
          {isDragging && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="absolute inset-0 bg-purple-600/5 z-0 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {stagedFile ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-4 z-10"
          >
            <div className="w-24 h-24 rounded-3xl bg-[#1a1a1a] border border-white/10 flex items-center justify-center shadow-2xl relative">
              <FileVideo className="w-10 h-10 text-purple-400" />
              <button 
                onClick={(e) => { e.stopPropagation(); setStagedFile(null); }}
                className="absolute -top-3 -right-3 w-8 h-8 bg-[#222] rounded-full flex items-center justify-center border border-white/20 hover:bg-rose-500 hover:border-rose-500 transition-all text-white shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-center">
              <h3 className="text-white text-xl font-display font-bold">
                {stagedFile.name}
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                {(stagedFile.size / 1024 / 1024).toFixed(2)} MB • Pronto
              </p>
            </div>
          </motion.div>
        ) : (
          <>
            <div className={`transition-all duration-700 relative ${
              isDragging ? 'scale-110 shadow-[0_0_80px_rgba(168,85,247,0.5)]' : ''
            }`}>
              <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center transition-all duration-300 relative z-10 ${
                isDragging ? 'bg-purple-600 border-purple-400' : 'bg-white/5 group-hover:bg-white/10 group-hover:scale-105'
              }`}>
                <Upload className={`w-12 h-12 transition-all duration-500 ${isDragging ? 'text-white' : 'text-gray-400 group-hover:text-purple-400'}`} />
              </div>
              <div className="absolute inset-0 bg-purple-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
            </div>

            <div className="text-center z-10 space-y-3">
              <h3 className="text-white text-3xl font-display font-black tracking-tight uppercase">
                {isDragging ? 'Solte o arquivo...' : 'Pronto para Viralizar?'}
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
                {isDragging ? 'Pode soltar, a IA cuida do resto.' : 'Arraste seu vídeo aqui ou clique no botão abaixo para começar a revolução.'}
              </p>
            </div>

            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              className="relative px-12 py-5 bg-white text-black font-black uppercase tracking-tighter rounded-2xl hover:bg-gray-100 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] text-2xl overflow-hidden group/btn"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
              <span className="relative z-10 flex items-center gap-4">
                <FileVideo className="w-8 h-8" /> Iniciar Agora
              </span>
            </motion.button>
          </>
        )}
        
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept="video/*" 
          onChange={(e) => {
            if (e.target.files?.[0]) onUpload(e.target.files[0]);
            e.target.value = ''; 
          }}
        />
      </div>

      <div className="bg-[#111] border border-white/5 rounded-[2rem] p-6 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Wand2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-white font-bold text-base">Pipeline Xeon-Optimized</h4>
            <p className="text-sm text-gray-500">Pronto para gerar virais e revolucionar o alcance.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-6 py-3 bg-purple-500/5 rounded-full border border-purple-500/10 text-purple-400 font-mono text-[10px] uppercase tracking-widest">
          Status: Aguardando Media
        </div>
      </div>
    </div>
  );
}
