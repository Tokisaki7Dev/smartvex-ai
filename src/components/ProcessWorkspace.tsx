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
    if (file && file.type.startsWith('video/')) setStagedFile(file);
  };

  const handleLaunch = () => {
    if (stagedFile) {
      onUpload(stagedFile);
      setStagedFile(null); // Reset after upload
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
            <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all duration-300 ${
              isDragging ? 'bg-purple-600 border-purple-400 scale-110 shadow-[0_0_60px_rgba(168,85,247,0.4)]' : 'bg-white/5 group-hover:bg-white/10'
            }`}>
              <Upload className={`w-10 h-10 transition-all duration-500 ${isDragging ? 'text-white' : 'text-gray-400'}`} />
            </div>

            <div className="text-center z-10 space-y-2">
              <h3 className="text-white text-2xl font-display font-bold">
                {isDragging ? 'Solte o arquivo...' : 'Arraste seu vídeo p/ cá'}
              </h3>
              <p className="text-gray-500">
                Larga aqui links do YouTube, Google Drive, ou arquivos locais
              </p>
            </div>

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-all shadow-lg text-lg"
            >
              Escolher um arquivo
            </button>
          </>
        )}
        
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept="video/*" 
          onChange={(e) => {
            if (e.target.files?.[0]) setStagedFile(e.target.files[0]);
            e.target.value = ''; // Reset input to allow triggering same file again
          }}
        />
      </div>

      {/* AI Pipeline Controls */}
      <div className="bg-[#111] border border-white/5 rounded-[2rem] p-6 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Wand2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-white font-bold text-base">Opções da IA configuradas</h4>
            <p className="text-sm text-gray-500">Pronto para gerar virais e revolucionar o alcance.</p>
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: stagedFile ? 1.02 : 1 }}
          whileTap={{ scale: stagedFile ? 0.98 : 1 }}
          onClick={handleLaunch}
          disabled={!stagedFile}
          className={`px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-3 shadow-xl transition-all ${
            stagedFile 
              ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-purple-500/20 hover:brightness-110' 
              : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
          }`}
        >
          {stagedFile ? (
            <>Gerar Clipes (1 clique) <Play className="w-5 h-5 fill-current" /></>
          ) : (
            'Aguardando Vídeo'
          )}
        </motion.button>
      </div>
    </div>
  );
}
