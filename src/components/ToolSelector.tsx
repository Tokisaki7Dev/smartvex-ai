import { motion } from "motion/react";
import { TOOLS, ToolType } from "../types";

export function ToolSelector({ selectedTool, onSelect }: { selectedTool: ToolType, onSelect: (t: ToolType) => void }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 shrink-0">
      {TOOLS.map((tool, i) => (
        <motion.div
          key={tool.type}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelect(tool.type)}
          className={`p-5 rounded-[2rem] transition-all cursor-pointer group flex flex-col justify-between h-40 ${
            selectedTool === tool.type 
              ? 'bg-[#1a1a1a] border border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.15)]' 
              : 'bg-[#111] border border-white/5 hover:bg-[#151515] hover:border-white/10'
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl transition-all ${
              selectedTool === tool.type ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg' : 'bg-white/5 text-gray-400'
            }`}>
              <tool.icon className="w-5 h-5" />
            </div>
          </div>
          
          <div>
            <div className={`font-display font-bold text-lg leading-tight transition-colors mb-1 ${selectedTool === tool.type ? 'text-white' : 'text-gray-300'}`}>
              {tool.name}
            </div>
            <p className="text-[10px] text-gray-500 leading-snug line-clamp-2">
              {tool.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
