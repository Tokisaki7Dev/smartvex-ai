import { motion } from "motion/react";
import { TOOLS, ToolType } from "../types";

export function ToolSelector({ selectedTool, onSelect, vertical = false }: { selectedTool: ToolType, onSelect: (t: ToolType) => void, vertical?: boolean }) {
  return (
    <div className={vertical ? "flex flex-col gap-3 shrink-0" : "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 shrink-0"}>
      {TOOLS.map((tool, i) => (
        <motion.div
          key={tool.type}
          initial={{ x: vertical ? -10 : 0, y: vertical ? 0 : -10, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelect(tool.type)}
          className={`rounded-2xl transition-all cursor-pointer group flex items-center gap-4 ${
            vertical ? 'p-3' : 'p-5 flex-col justify-between h-40'
          } ${
            selectedTool === tool.type 
              ? 'bg-white/5 border border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.15)]' 
              : 'bg-transparent border border-white/5 hover:bg-white/5 hover:border-white/10'
          }`}
        >
          <div className={`shrink-0 p-2.5 rounded-xl transition-all ${
            selectedTool === tool.type ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg' : 'bg-white/5 text-gray-400'
          }`}>
            <tool.icon className={vertical ? "w-4 h-4" : "w-5 h-5"} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className={`font-display font-bold transition-colors leading-none mb-1 ${
              vertical ? 'text-[11px] uppercase tracking-wider' : 'text-lg'
            } ${selectedTool === tool.type ? 'text-white' : 'text-gray-300'}`}>
              {tool.name}
            </div>
            {!vertical && (
              <p className="text-[10px] text-gray-500 leading-snug line-clamp-2">
                {tool.description}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
